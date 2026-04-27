---
name: publish-post
description: Publish a new blog post to the cc4.marketing site — converts markdown to PortableText, inserts into Emdash D1, updates sitemap, and ships to production
---

# /publish-post — Publish a Blog Post

Publish a new blog post end-to-end: parse markdown with frontmatter, convert to PortableText, insert into Emdash D1, update the sitemap, and hand off to `/ship`.

This skill encapsulates the workflow documented in `docs/solutions/integration-issues/emdash-d1-blog-post-publishing-workflow.md`.

## Arguments

Two input modes:

**Mode A — file path (recommended):**
```
/publish-post path/to/article.md
```
The file must have YAML frontmatter (see schema below).

**Mode B — inline content:**
```
/publish-post
```
With no argument, ask the user for the article title, excerpt, slug (optional), **author slug** (required — list existing bylines first via `wrangler d1 execute ... SELECT slug, display_name FROM _emdash_bylines` so the user can pick), cover path (optional), and body content. Then write a temporary markdown file to `/tmp/new-post-{slug}.md` with frontmatter + body and proceed as Mode A.

Additional flags (optional):
- `--dry` — run all validation and emit SQL, but don't execute, update sitemap, or ship

## Frontmatter schema

```yaml
---
title: "How to X"                          # required, ≤ 60 chars for SEO
slug: how-to-x                             # optional; derived from title
excerpt: "Meta description ≤ 160 chars — shown in SERP and OG/Twitter cards."  # required, hard limit 160 chars
author: tri-vo                             # optional; must match a byline slug in _emdash_bylines. Drives the avatar + name on the OG card.
cover: /blog/cover-how-to-x.png            # optional; defaults to /blog/cover-{slug}.png. Omit for engine-generated OG.
cover_alt: "Descriptive alt text"          # optional; defaults to generic
published_at: 2026-04-09T09:00:00Z         # optional; defaults to now UTC
keywords: [ai marketing, claude code]      # optional
---
```

### Authors

The `author` frontmatter field is a byline **slug** (not the display name). The publish helper resolves it to a byline ID against `_emdash_bylines` on remote D1 and fails loudly if no match exists.

To list existing bylines: `npx wrangler d1 execute cc4-emdash --remote --command "SELECT slug, display_name FROM _emdash_bylines"`

To add a new byline:
1. Upload avatar to R2: `npx wrangler r2 object put cc4-media/bylines/<slug>.png --file=<path> --remote --content-type="image/png"`
2. Insert media row (use `media` table; `id` = 26-char ULID, `storage_key` = `bylines/<slug>.png`, `status` = `ready`)
3. Insert byline row into `_emdash_bylines` with `slug`, `display_name`, `avatar_media_id` pointing at the media row

Without `author` set, the post is attributed to "CC4.Marketing Team" with a fallback initials circle.

## Instructions

### Step 1: Preflight

1. Confirm the markdown file exists (Mode A) or gather fields from the user (Mode B).
2. Verify on `main` branch: `git branch --show-current`.
3. If not on main, warn and ask to continue.

### Step 2: Cover image

**No manual cover step needed.** The OG engine auto-generates a typographic cover for every published post at `/og/blog/{slug}-{hash}.png`, rendered on demand via `workers-og` (Satori + resvg-wasm) and cached in R2 + Cloudflare edge cache. `BaseLayout.astro` emits the correct hashed URL in `og:image` and the article JSON-LD schema.

**When to override** with a bespoke illustrated/photographic cover:
1. Author `public/blog/cover-{slug}.{svg,png}` by hand (or use the `compound-engineering:gemini-imagegen` skill).
2. Set `featured_image` in the post's Emdash record — the engine's precedence rules give `featured_image.src` priority over the auto-generated URL.

The legacy `public/blog/cover-*` covers for existing posts are still in place and take precedence (they set `featured_image` in D1). New posts without `featured_image` automatically use the engine.

**Dev preview:** iterate on templates at `http://localhost:4321/og-preview` (dev server only).

If a post needs a bespoke cover, skip to the override path below; otherwise move on to Step 3.

### Step 3: Dry run the publisher

Run the helper script in dry-run mode to validate everything before touching D1:

```bash
uv run python .claude/skills/publish-post/publish_post.py <markdown_file>
```

The script performs these checks:
1. Frontmatter parses and has required fields (title, excerpt)
2. Slug is not already in `ec_posts` (queries remote D1)
3. Cover checks (3-5) only run when `featured_image` is set in frontmatter — the engine handles the generic case. If set, cover must exist at the expected path, be exactly 1200×630, and not a solid-black rectangle (pixel sample check).
4. Markdown body converts to valid PortableText (≥1 block)

If any check fails, **stop** and show the user the error. Fix the issue (rename slug, re-render cover, etc.) before proceeding.

On success, the script prints the post ID, slug, block count, and writes SQL to `/tmp/insert_post_{slug}.sql`.

If the user passed `--dry`, stop here and show the SQL path. Do not proceed.

### Step 4: Execute the INSERT

```bash
uv run python .claude/skills/publish-post/publish_post.py <markdown_file> --execute
```

This re-runs the checks, regenerates the ID (fresh ULID), and runs `wrangler d1 execute cc4-emdash --remote --file=/tmp/insert_post_{slug}.sql`. It also appends the new route to `blogPages` in `astro.config.mjs`.

**Important:** run the helper with `--execute` exactly once. Don't re-run on failure without investigating — the slug unique constraint will reject duplicates, but a half-applied state (row inserted, sitemap not updated) is possible if wrangler is killed mid-flight.

### Step 5: Verify the insert

```bash
npx wrangler d1 execute cc4-emdash --remote --command "SELECT id, slug, status, title, published_at, featured_image FROM ec_posts WHERE slug='{slug}';"
```

The post should show `status: published` with the expected title and timestamp.

**Check `featured_image`.** If it is `null` and the post has a bespoke cover at `public/blog/cover-{slug}.png`, set it now — the blog index grid reads this column and will show no thumbnail without it:

```bash
npx wrangler d1 execute cc4-emdash --remote --command "
UPDATE ec_posts
SET featured_image = '{\"src\":\"https://cc4.marketing/blog/cover-{slug}.png\",\"width\":1200,\"height\":630,\"alt\":\"{descriptive alt text}\"}'
WHERE slug = '{slug}';
"
```

If no bespoke cover exists, `featured_image` can stay null — the OG engine handles the social card and the blog index will simply show no thumbnail (acceptable for engine-only posts).

> If a cover PNG needs creating from an existing screenshot, use `sips` (macOS built-in — no Pillow needed):
> ```bash
> sips --resampleWidth 1200 source.png --out /tmp/tmp.png
> sips --cropToHeightWidth 630 1200 /tmp/tmp.png --out public/blog/cover-{slug}.png
> ```

### Step 5b: Update llms.txt and llms-full.txt

Both files must be updated so AI crawlers (Perplexity, Claude, etc.) can discover the new post.

**`public/llms.txt`** — append to the `### Published Posts` section:

```markdown
- [{Post Title}](https://cc4.marketing/blog/{slug}/)
```

**`public/llms-full.txt`** — append to the `### Published Posts` section with a one-sentence description:

```markdown
- [{Post Title}](https://cc4.marketing/blog/{slug}/) — {one-sentence description of the post's topic and value}
```

Stage both files alongside the cover PNG so they ship in the same commit.

### Step 6: Ship

Invoke the `/ship` skill with a commit message like `feat: publish "{title}" blog post`. Because this is a `feat:` commit, `/ship` will also offer to add a changelog entry — accept it (see `.claude/skills/ship/SKILL.md` for the auto-changelog flow).

`/ship` handles: build, stage (cover PNG/SVG + astro.config.mjs + any helper script changes), commit, push, deploy monitoring, and smoke tests.

### Step 7: Post-deploy verification

After `/ship` reports success, run:

```bash
# Verify the live page renders
/usr/bin/curl -sL -w "%{http_code}" -o /dev/null "https://cc4.marketing/blog/{slug}"

# Verify the og:image points at a valid URL (engine-hashed OR manual override)
/usr/bin/curl -s "https://cc4.marketing/blog/{slug}" | grep -oE 'og:image" content="[^"]*"'

# Verify the sitemap contains the new URL
/usr/bin/curl -s "https://cc4.marketing/sitemap-0.xml" | grep "{slug}"

# If engine-generated: fetch the OG URL itself to confirm the runtime endpoint returns 200
OG_URL=$(/usr/bin/curl -s "https://cc4.marketing/blog/{slug}" | grep -oE 'https://cc4.marketing/og/[^"]*\.png' | head -1)
/usr/bin/curl -sI "$OG_URL" | head -1
```

**All three must pass.** If `og:image` is `/og-blog.png`, the engine kill-switch is active or BaseLayout isn't receiving `ogPost`. If the OG URL returns 500, check `og.generate` logs in Logpush for render errors.

### Step 8: Report

```
✅ Post published

Title: {title}
URL: https://cc4.marketing/blog/{slug}/
D1 id: {post_id}
Deploy: {workflow_run_url}

SEO verified:
  ✓ og:image → {engine-hashed URL or cover URL}
  ✓ sitemap contains /blog/{slug}/
  ✓ featured_image in D1: {set|null (engine-only)}
  ✓ llms.txt updated
  ✓ llms-full.txt updated
```

## Mode B: inline content gathering

When `/publish-post` is called with no file argument, gather fields conversationally:

1. Ask for the title (required)
2. Propose a slug from the title; ask the user to accept or override
3. Ask for the excerpt (required, 1-2 sentences, ~155 chars for SERP)
4. Ask whether there's an existing cover image; if yes, get the path; if no, proceed to cover generation (Step 2 above)
5. Ask for the body content (the user will paste it — plain markdown, paragraphs separated by blank lines, `##` for h2, `###` for h3)
6. Write the assembled file to `/tmp/new-post-{slug}.md` with proper frontmatter
7. Proceed with Step 3 onwards

## Safety rules

- **Never** insert without running the dry run first
- **Never** skip the cover pixel-sample check — a 1200×630 black rectangle will pass dimension checks but ship broken OG images
- **Never** execute with `--skip-checks` unless debugging — the defaults are correct
- **Never** hand-edit SQL files — use the helper script so escaping is correct
- **Always** check `featured_image` in D1 after insert (Step 5) — the blog index grid shows no thumbnail when this column is null, even if the cover PNG exists on disk
- **Always** update `llms.txt` and `llms-full.txt` before shipping — AI crawlers discover posts through these files
- If the INSERT succeeds but `/ship` fails, the post is live on the D1 side but has no cover asset in production. Diagnose the ship failure and re-run `/ship`, not `/publish-post`
- Rollback: `npx wrangler d1 execute cc4-emdash --remote --command "DELETE FROM ec_posts WHERE slug='{slug}';"` — but you should rarely need this

## Key files

- `.claude/skills/publish-post/publish_post.py` — the helper script that does parsing, validation, SQL generation, and execution
- `src/pages/blog/[slug].astro` — the SSR route that reads the post from D1 via Emdash
- `astro.config.mjs` — contains the `blogPages` array for sitemap
- `public/blog/` — where cover images live (PNG + SVG source)
- `public/llms.txt` — AI discovery index; must include every published post URL
- `public/llms-full.txt` — extended AI reference; includes post URLs with descriptions
- `docs/solutions/integration-issues/emdash-d1-blog-post-publishing-workflow.md` — the full workflow reference

## Related skills

- `/ship` — invoked at Step 6; handles build/commit/push/deploy and auto-adds changelog entry for `feat:` commits
- `/changelog-add` — use if you want a custom changelog entry instead of the auto-generated one
- `/release` — cut a version when enough posts/features have accumulated in `[Unreleased]`
