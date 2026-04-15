"""Blog post publisher for cc4.marketing.

Converts a markdown file with YAML frontmatter into an Emdash PortableText
D1 INSERT, optionally executes it, and updates the sitemap blogPages array.

Usage:
    python publish_post.py <article.md> [--execute] [--skip-sitemap]

Frontmatter schema (all required except keywords):
    ---
    title: "How to do X"
    slug: how-to-do-x                    # optional; derived from title if missing
    excerpt: "Meta description ~155 chars."
    cover: /blog/cover-how-to-do-x.png   # optional; defaults to /blog/cover-{slug}.png
    published_at: 2026-04-09T09:00:00Z   # optional; defaults to now UTC
    keywords: [ai marketing, claude code]
    ---

    ## Opening H2 (optional)
    Body paragraphs...

Markdown → PortableText mapping:
    ## heading  → style: h2
    ### heading → style: h3
    paragraph   → style: normal

Inline marks (bold/italic/links) are NOT preserved — the current Emdash
posts in production use plain spans only, so we match that. Extend later
if needed.

The script does these checks in order:
    1. Markdown file exists and has valid frontmatter
    2. Slug is not already in ec_posts
    3. Cover image exists at public/blog/cover-{slug}.png
    4. Cover is 1200x630 and not a solid-black rectangle (sanity check)

Then it emits SQL to /tmp/insert_post_{slug}.sql. With --execute, it runs
`wrangler d1 execute cc4-emdash --remote --file=<sql>`. With --skip-sitemap,
it leaves astro.config.mjs alone (useful for dry runs).
"""
from __future__ import annotations

import argparse
import json
import re
import secrets
import string
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[3]
ASTRO_CONFIG = REPO_ROOT / "astro.config.mjs"
PUBLIC_BLOG = REPO_ROOT / "public" / "blog"


# ---------- ID / key generation -------------------------------------------

def gen_id() -> str:
    """ULID-ish uppercase alphanumeric id, 26 chars, matching Emdash style."""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(26))


def gen_key() -> str:
    """Short hex _key for PortableText blocks and spans."""
    return secrets.token_hex(5)


# ---------- Byline lookup --------------------------------------------------

def resolve_byline_id(slug: str) -> str:
    """Look up a byline ID from remote D1 by slug.

    Raises a helpful error if no matching byline exists — we never
    silently publish a post without the author the user chose.
    """
    cmd = [
        "npx", "wrangler", "d1", "execute", "cc4-emdash", "--remote",
        "--command", f"SELECT id FROM _emdash_bylines WHERE slug='{sql_escape(slug)}' LIMIT 1",
        "--json",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(f"byline lookup failed: {result.stderr.strip()}")
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError:
        raise RuntimeError(f"byline lookup returned non-JSON: {result.stdout[:200]}")
    # wrangler --json returns [{results: [...], success: true, meta: ...}]
    rows: list[dict[str, Any]] = []
    if isinstance(payload, list) and payload:
        rows = payload[0].get("results") or []
    elif isinstance(payload, dict):
        rows = payload.get("results") or []
    if not rows:
        raise ValueError(
            f"no byline with slug '{slug}' in _emdash_bylines. "
            "Insert one first (see SKILL.md) or pick a different author."
        )
    return rows[0]["id"]


# ---------- Frontmatter parsing -------------------------------------------

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)$", re.DOTALL)


def parse_frontmatter(md_text: str) -> tuple[dict[str, Any], str]:
    """Minimal YAML-like frontmatter parser. Supports string/int/list values
    in `key: value` form, plus `key: [a, b, c]` inline lists. No nested maps
    — blog post frontmatter doesn't need them.
    """
    match = FRONTMATTER_RE.match(md_text)
    if not match:
        raise ValueError(
            "Markdown file must start with YAML frontmatter delimited by `---` lines"
        )

    header, body = match.group(1), match.group(2)
    meta: dict[str, Any] = {}
    for raw_line in header.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"Invalid frontmatter line: {raw_line!r}")
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()

        # Strip matched quotes
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]
        # Inline list: [a, b, c]
        elif value.startswith("[") and value.endswith("]"):
            inner = value[1:-1].strip()
            if not inner:
                value = []
            else:
                value = [
                    v.strip().strip('"').strip("'")
                    for v in inner.split(",")
                ]

        meta[key] = value

    return meta, body


# ---------- Markdown → PortableText ---------------------------------------

def make_block(style: str, text: str) -> dict[str, Any]:
    return {
        "_type": "block",
        "_key": gen_key(),
        "style": style,
        "children": [
            {"_type": "span", "_key": gen_key(), "text": text},
        ],
    }


def markdown_to_portable_text(body: str) -> list[dict[str, Any]]:
    """Convert markdown body into a PortableText block array.

    Rules:
        - Blank-line-separated chunks become blocks
        - A chunk starting with `## ` becomes an h2 block
        - A chunk starting with `### ` becomes an h3 block
        - Everything else becomes a `normal` block; internal newlines are
          collapsed to single spaces (standard markdown paragraph behavior)
    """
    blocks: list[dict[str, Any]] = []
    for raw_chunk in re.split(r"\n\s*\n", body.strip()):
        chunk = raw_chunk.strip()
        if not chunk:
            continue

        if chunk.startswith("## "):
            # Only accept single-line headings
            heading_text = chunk[3:].split("\n", 1)[0].strip()
            blocks.append(make_block("h2", heading_text))
            # If there's trailing body after the heading in the same chunk,
            # emit it as a normal block too
            if "\n" in chunk:
                rest = chunk.split("\n", 1)[1].strip()
                if rest:
                    blocks.append(make_block("normal", " ".join(rest.split())))
        elif chunk.startswith("### "):
            heading_text = chunk[4:].split("\n", 1)[0].strip()
            blocks.append(make_block("h3", heading_text))
            if "\n" in chunk:
                rest = chunk.split("\n", 1)[1].strip()
                if rest:
                    blocks.append(make_block("normal", " ".join(rest.split())))
        else:
            # Paragraph: collapse newlines within the chunk to spaces
            paragraph = " ".join(chunk.split())
            blocks.append(make_block("normal", paragraph))

    return blocks


# ---------- Validation -----------------------------------------------------

def slugify(title: str) -> str:
    """Simple kebab-case slug from a title."""
    s = title.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s


def check_slug_available(slug: str) -> None:
    """Query D1 to confirm the slug is free. Exits with code 2 on collision."""
    result = subprocess.run(
        [
            "npx", "wrangler", "d1", "execute", "cc4-emdash", "--remote",
            "--command", f"SELECT count(*) AS n FROM ec_posts WHERE slug='{slug}';",
            "--json",
        ],
        capture_output=True, text=True, cwd=REPO_ROOT,
    )
    # wrangler prints a json array at the end; fall back to substring search
    if '"n": 0' not in result.stdout and '"n":0' not in result.stdout:
        print(f"ERROR: slug '{slug}' is already taken in ec_posts", file=sys.stderr)
        print(result.stdout[-500:], file=sys.stderr)
        sys.exit(2)


def check_cover(cover_rel_path: str, slug: str) -> Path:
    """Verify the cover PNG exists, is 1200x630, and is not all-black.

    Returns the absolute path to the cover file.
    """
    # cover_rel_path is like "/blog/cover-foo.png"; resolve against public/
    cover_path = REPO_ROOT / "public" / cover_rel_path.lstrip("/")
    if not cover_path.exists():
        print(
            f"ERROR: cover image not found at {cover_path}\n"
            f"Expected: public/blog/cover-{slug}.png (or set `cover:` in frontmatter)",
            file=sys.stderr,
        )
        sys.exit(3)

    # Pillow check — dimensions + sanity pixel sample
    try:
        from PIL import Image
    except ImportError:
        print("WARN: Pillow not installed; skipping cover sanity check", file=sys.stderr)
        return cover_path

    with Image.open(cover_path) as img:
        if img.size != (1200, 630):
            print(
                f"ERROR: cover must be exactly 1200x630, got {img.size}",
                file=sys.stderr,
            )
            sys.exit(4)

        # Sample 9 points across the image; if they're all (near-)black,
        # the SVG→PNG render probably failed (ImageMagick gradient bug)
        rgb = img.convert("RGB")
        w, h = rgb.size
        samples = [
            rgb.getpixel((x, y))
            for x in (w // 6, w // 2, 5 * w // 6)
            for y in (h // 6, h // 2, 5 * h // 6)
        ]
        if all(max(px) < 20 for px in samples):
            print(
                "ERROR: cover looks like a solid black rectangle — "
                "likely a failed ImageMagick SVG render. "
                "Re-rasterize with cairosvg instead:\n"
                "  DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib uv run python -c \\\n"
                '    "import cairosvg; cairosvg.svg2png(url=\'cover.svg\', '
                "write_to='cover.png', output_width=1200, output_height=630)\"",
                file=sys.stderr,
            )
            sys.exit(5)

    return cover_path


# ---------- Sitemap update -------------------------------------------------

def update_sitemap(slug: str) -> None:
    """Append the new /blog/<slug> route to the blogPages array in
    astro.config.mjs. Idempotent — no-op if the route is already present.
    """
    text = ASTRO_CONFIG.read_text()
    new_route = f"'/blog/{slug}'"

    if new_route in text:
        print(f"sitemap: /blog/{slug} already in blogPages, skipping")
        return

    # Find the blogPages array and insert before the closing bracket.
    # The array pattern: const blogPages = [\n  '/blog/a',\n  '/blog/b',\n].map(...)
    pattern = re.compile(
        r"(const blogPages = \[)(.*?)(\]\s*\.map)",
        re.DOTALL,
    )
    match = pattern.search(text)
    if not match:
        print(
            "ERROR: couldn't find `const blogPages = [...]` in astro.config.mjs — "
            "sitemap update skipped. Add manually.",
            file=sys.stderr,
        )
        return

    existing_body = match.group(2)
    # Preserve indentation from the last line
    indent = "  "
    new_body = existing_body.rstrip() + f"\n{indent}{new_route},\n"
    new_text = text[: match.start()] + f"const blogPages = [{new_body}].map" + text[match.end():]
    ASTRO_CONFIG.write_text(new_text)
    print(f"sitemap: added /blog/{slug} to blogPages")


# ---------- SQL generation -------------------------------------------------

def sql_escape(s: str) -> str:
    return s.replace("'", "''")


@dataclass
class PostRecord:
    id: str
    slug: str
    title: str
    excerpt: str
    cover_src: str
    cover_alt: str
    published_at: str
    content_blocks: list[dict[str, Any]]
    byline_id: str | None = None
    byline_cb_id: str | None = None

    def to_sql(self) -> str:
        featured = {
            "id": f"cover-{self.slug}",
            "src": self.cover_src,
            "alt": self.cover_alt,
            "width": 1200,
            "height": 630,
        }
        featured_json = json.dumps(featured, ensure_ascii=False)
        content_json = json.dumps(self.content_blocks, ensure_ascii=False)

        byline_val = f"'{self.byline_id}'" if self.byline_id else "NULL"
        post_insert = (
            "INSERT INTO ec_posts (\n"
            "    id, slug, status, title, featured_image, content, excerpt,\n"
            "    primary_byline_id, published_at, created_at, updated_at, version, locale\n"
            ") VALUES (\n"
            f"    '{self.id}',\n"
            f"    '{self.slug}',\n"
            f"    'published',\n"
            f"    '{sql_escape(self.title)}',\n"
            f"    '{sql_escape(featured_json)}',\n"
            f"    '{sql_escape(content_json)}',\n"
            f"    '{sql_escape(self.excerpt)}',\n"
            f"    {byline_val},\n"
            f"    '{self.published_at}',\n"
            f"    '{self.published_at}',\n"
            f"    '{self.published_at}',\n"
            f"    1,\n"
            f"    'en'\n"
            ");\n"
        )

        if not self.byline_id or not self.byline_cb_id:
            return post_insert

        byline_link = (
            "INSERT INTO _emdash_content_bylines (\n"
            "    id, collection_slug, content_id, byline_id, sort_order, created_at\n"
            ") VALUES (\n"
            f"    '{self.byline_cb_id}',\n"
            f"    'posts',\n"
            f"    '{self.id}',\n"
            f"    '{self.byline_id}',\n"
            f"    0,\n"
            f"    '{self.published_at}'\n"
            ");\n"
        )
        return post_insert + byline_link


# ---------- Main -----------------------------------------------------------

def build_record(md_path: Path) -> PostRecord:
    md_text = md_path.read_text()
    meta, body = parse_frontmatter(md_text)

    title = meta.get("title")
    if not title:
        raise ValueError("frontmatter missing required field: title")
    excerpt = meta.get("excerpt")
    if not excerpt:
        raise ValueError("frontmatter missing required field: excerpt")

    slug = meta.get("slug") or slugify(title)
    cover_src = meta.get("cover") or f"/blog/cover-{slug}.png"
    cover_alt = meta.get("cover_alt") or f"Cover illustration for: {title}"

    published_at = meta.get("published_at")
    if not published_at:
        published_at = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    elif not published_at.endswith("Z"):
        # Normalize to trailing Z for consistency with existing posts
        published_at = published_at.rstrip("+00:00") + "Z" if "+" not in published_at else published_at

    content_blocks = markdown_to_portable_text(body)
    if not content_blocks:
        raise ValueError("markdown body is empty; nothing to publish")

    # Author is optional at the frontmatter level; when present, it must
    # match an existing byline slug in _emdash_bylines. Defaults handled
    # downstream — no byline means the OG template renders "CC4.Marketing
    # Team" as the fallback.
    author_slug = meta.get("author")
    byline_id: str | None = None
    byline_cb_id: str | None = None
    if author_slug:
        byline_id = resolve_byline_id(author_slug)
        byline_cb_id = gen_id()

    return PostRecord(
        id=gen_id(),
        slug=slug,
        title=title,
        excerpt=excerpt,
        cover_src=cover_src,
        cover_alt=cover_alt,
        published_at=published_at,
        content_blocks=content_blocks,
        byline_id=byline_id,
        byline_cb_id=byline_cb_id,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Publish a markdown blog post to Emdash D1")
    parser.add_argument("markdown_file", type=Path, help="Path to the markdown file with frontmatter")
    parser.add_argument("--execute", action="store_true", help="Actually run the INSERT against remote D1")
    parser.add_argument("--skip-sitemap", action="store_true", help="Don't touch astro.config.mjs")
    parser.add_argument("--skip-checks", action="store_true", help="Skip slug/cover validation (dangerous)")
    args = parser.parse_args()

    if not args.markdown_file.exists():
        print(f"ERROR: {args.markdown_file} not found", file=sys.stderr)
        return 1

    record = build_record(args.markdown_file)

    print(f"Post id: {record.id}")
    print(f"Slug: {record.slug}")
    print(f"Title: {record.title}")
    print(f"Blocks: {len(record.content_blocks)}")
    print(f"Cover: {record.cover_src}")
    print(f"Published: {record.published_at}")

    if not args.skip_checks:
        check_slug_available(record.slug)
        check_cover(record.cover_src, record.slug)
        print("Checks passed: slug available, cover valid")

    sql = record.to_sql()
    sql_path = Path(f"/tmp/insert_post_{record.slug}.sql")
    sql_path.write_text(sql)
    print(f"SQL written to {sql_path}")

    if args.execute:
        print("Executing INSERT against remote D1...")
        result = subprocess.run(
            [
                "npx", "wrangler", "d1", "execute", "cc4-emdash", "--remote",
                f"--file={sql_path}",
            ],
            cwd=REPO_ROOT,
        )
        if result.returncode != 0:
            print("ERROR: D1 insert failed", file=sys.stderr)
            return result.returncode
        print("D1 INSERT succeeded")
    else:
        print("(dry run — pass --execute to actually insert)")

    if not args.skip_sitemap:
        update_sitemap(record.slug)

    return 0


if __name__ == "__main__":
    sys.exit(main())
