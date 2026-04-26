---
title: "Publishing blog posts to Emdash CMS: D1 schema, PortableText, covers, and sitemap"
category: integration-issues
date: 2026-04-09
tags:
  - emdash
  - cloudflare-d1
  - portabletext
  - astro
  - blog-publishing
  - cairosvg
  - imagemagick
  - wrangler
  - sitemap
  - og-image
severity: medium
component: ec_posts (D1), src/pages/blog/[slug].astro, astro.config.mjs, wrangler d1 execute, cover image pipeline
---

## Problem

Publishing a new blog post on cc4.marketing requires inserting a row into the remote D1 `ec_posts` table — posts are not files, they're rows with PortableText JSON in the `content` column. There is no documented admin UI workflow, no seed script, and no authoring tooling in the repo; prior posts were inserted directly into D1 with no trace left behind.

## Root cause

The site uses Emdash CMS backed by Cloudflare D1 + R2, but the repo ships only the reader side (`src/pages/blog/[slug].astro`) — no authoring path. Astro's sitemap plugin can't discover SSR routes sourced from an external CMS, so new URLs must also be hand-registered in `astro.config.mjs`. The "just use the CMS admin UI" shortcut doesn't exist in this codebase, so publishing means: learn the schema, hand-build PortableText, generate a cover image, insert the row via `wrangler d1`, update the sitemap, and ship.

## Solution

### 1. Inspect the `ec_posts` schema on remote D1

Run this once per session so you know exactly which columns are required vs. nullable:

```bash
npx wrangler d1 execute cc4-emdash --remote --command "SELECT sql FROM sqlite_master WHERE name='ec_posts';"
```

Relevant schema:

```sql
CREATE TABLE "ec_posts" (
  "id" text primary key,
  "slug" text,
  "status" text default 'draft',
  "author_id" text,
  "primary_byline_id" text,
  "created_at" text default (datetime('now')),
  "updated_at" text default (datetime('now')),
  "published_at" text,
  "scheduled_at" text,
  "deleted_at" text,
  "version" integer default 1,
  "live_revision_id" text references "revisions" ("id"),
  "draft_revision_id" text references "revisions" ("id"),
  "locale" text default 'en' not null,
  "translation_group" text,
  "title" TEXT NOT NULL DEFAULT '',
  "featured_image" TEXT,  -- JSON string
  "content" JSON,          -- PortableText array
  "excerpt" TEXT,
  constraint "ec_posts_slug_locale_unique" unique ("slug", "locale")
);
```

`live_revision_id`, `draft_revision_id`, `author_id`, `primary_byline_id`, `scheduled_at`, and `deleted_at` can all be NULL — existing published posts have them NULL. The minimum required fields for a published post are: `id`, `slug`, `status='published'`, `published_at`, `title`, `featured_image`, `content`, `excerpt`.

### 2. Author the body as PortableText JSON

The `emdash/ui` `PortableText` component renders the `content` column. Styles observed in existing posts: `normal`, `h2`, `h3`. Every block and every span needs a unique `_key`:

```json
[
  {
    "_type": "block",
    "_key": "abc123",
    "style": "h2",
    "children": [{"_type": "span", "_key": "def456", "text": "Section heading"}]
  },
  {
    "_type": "block",
    "_key": "xyz789",
    "style": "normal",
    "children": [{"_type": "span", "_key": "ghi012", "text": "Paragraph body text."}]
  }
]
```

### 3. Generate the cover image as a 1200×630 PNG

`src/pages/blog/[slug].astro` reads `post.data.featured_image?.src` and passes it to `BaseLayout` as `image=`, which auto-builds `og:image`, `twitter:image`, and the hero `<img>` — **one file covers all three**. Author an SVG in the brand palette (editorial brutalist, cream `#F5F1E8` / rust `#B85C3C` / plum `#5C3A6B`), referencing `public/blog/cover-*.svg` for the established visual language, then rasterize with cairosvg. Do **not** use ImageMagick — see investigation notes below.

```bash
uv pip install cairosvg
DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib uv run python -c "
import cairosvg
cairosvg.svg2png(
    url='public/blog/cover-foo.svg',
    write_to='public/blog/cover-foo.png',
    output_width=1200,
    output_height=630,
)
"
```

### 4. Store `featured_image` as a JSON string

The column is `TEXT`, but the content is JSON. The `src` is served statically from `/public`:

```json
{"id": "cover-3", "src": "/blog/cover-foo.png", "alt": "...", "width": 1200, "height": 630}
```

### 5. Build and run the INSERT via a Python helper

Use `insert_post_anthropic_growth.py` in the repo root as a template — it generates a ULID-style 26-char ID, builds the PortableText JSON with unique hex keys per block/span, SQL-escapes single quotes (`'` → `''`), and writes the statement to `/tmp/insert_post.sql`. Then execute on remote D1:

```bash
npx wrangler d1 execute cc4-emdash --remote --file=/tmp/insert_post.sql
```

Sets `status='published'`, `published_at` to an ISO-8601 timestamp, `locale='en'`, `version=1`, and leaves all revision/author/byline columns NULL.

### 6. Register the new URL in the sitemap

`astro.config.mjs` (~line 32) has a hardcoded `blogPages` array used as `customPages` for the Astro sitemap plugin, because SSR routes backed by an external CMS can't be auto-discovered. Add the new `/blog/<slug>` entry to that array in the **same commit** as the post.

### 7. Ship it

Run the `/ship` skill (see `.claude/skills/ship/SKILL.md`): build + commit + push + Cloudflare Workers deploy.

### 8. Verify on the live URL

Confirm meta tags and assets all shipped:

```bash
curl -s https://cc4.marketing/blog/<slug> | grep -E 'og:image|twitter:image|canonical|article:published_time'
curl -s https://cc4.marketing/sitemap-0.xml | grep '<slug>'
curl -sI https://cc4.marketing/blog/cover-foo.png
```

If `og:image` points at `/og-blog.png` instead of your new cover, the PNG didn't ship — the D1 row has the correct `featured_image.src`, but the layout's fallback kicked in because the asset 404'd. Re-run `/ship`.

## Investigation steps tried

- **Gemini 3 Pro Image via Vertex AI** (the existing `generate_cover.py` path): returned `403 BILLING_DISABLED` on project `gen-lang-client-0013409905`. No `GEMINI_API_KEY` was set for the direct AI Studio API either, so the scripted cover generation flow was unusable. Fell back to hand-authored SVG.
- **ImageMagick 7 `magick convert` for SVG rasterization**: the default MSVG renderer silently does not resolve `<linearGradient>` `url(#id)` fills — the cream gradient background rendered as solid black. No error, just a wrong PNG with correct dimensions. cairosvg (with `DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib` so it finds the homebrew cairo dylib on Apple Silicon) renders gradients correctly.
- **Looking for an Emdash admin UI / authoring route in the repo**: none exists in this codebase. The only CMS code shipped is the reader side of `[slug].astro`. Direct D1 insert is the intended path.

## Prevention & best practices

### When publishing a new post
- Verify existing covers in `public/blog/` for style reference before designing a new one — match the established brand palette and typography
- Confirm the slug isn't already taken before writing any content:
  ```bash
  npx wrangler d1 execute cc4-emdash --remote --command "SELECT slug FROM ec_posts;"
  ```
- Inspect the `ec_posts` schema once per session so you know which columns are NOT NULL vs. NULL-okay:
  ```bash
  npx wrangler d1 execute cc4-emdash --remote --command "PRAGMA table_info(ec_posts);"
  ```
- Use an existing `insert_post_*.py` helper as a template rather than hand-writing SQL — it captures the full row shape (PortableText JSON, `_key` generation, timestamps, locale, status) so you don't re-derive the schema each time
- Always update the `blogPages` array in `astro.config.mjs` in the **same commit** as the new post — if you forget, the post exists in D1 but won't appear in the sitemap and search engines won't discover it
- Always run `/ship` after inserting — the D1 INSERT publishes the text content, but the cover PNG only exists locally until the next deploy. Shipping text without the cover leaves the live page falling back to `/og-blog.png`
- After deploy, curl the live URL and grep for `og:image` to confirm the cover landed:
  ```bash
  curl -s https://cc4.marketing/blog/new-slug | grep 'og:image'
  ```

### SVG-to-PNG rendering
- **Never use ImageMagick** for SVGs that contain `<linearGradient>`, `<radialGradient>`, `<pattern>` with `url(#...)` references, `<filter>` effects, or complex `<clipPath>` definitions — the MSVG renderer silently drops the reference and fills with black. You won't see an error; you'll just get a broken PNG
- Default to **cairosvg** with the homebrew cairo dylib path (required on Apple Silicon because Python can't find `libcairo` without the hint):
  ```bash
  DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib uv run python -c "
  import cairosvg
  cairosvg.svg2png(url='cover.svg', write_to='cover.png', output_width=1200, output_height=630)
  "
  ```
- Verify the render **visually** with the Read tool on the output PNG before committing — don't trust file size or dimensions alone. A 1200×630 black rectangle has the same dimensions as a correctly rendered cover
- If cairosvg isn't installed: `uv pip install cairosvg` (never `pip install` directly, per global instructions)

### Image generation fallbacks
- **Primary:** `generate_cover.py` with Vertex AI Gemini 3 Pro Image — requires billing enabled on Vertex project `gen-lang-client-0013409905`. Check with `gcloud billing projects describe` before assuming it'll work
- **Fallback 1:** `GEMINI_API_KEY` env var with the AI Studio direct API via the `compound-engineering:gemini-imagegen` skill — bypasses Vertex billing but requires an API key with image-gen quota
- **Fallback 2:** Hand-author the SVG in the brand style (see `public/blog/cover-*.svg` for the visual language) and rasterize with cairosvg. **This is the most reliable path** — fully self-contained, deterministic, committable, no billing risk. Prefer this when you need a guaranteed result in one pass

### Sitemap verification
- The generated sitemap at `dist/client/sitemap-0.xml` is **single-line minified** — `grep -c "<url>"` returns `1` regardless of how many URLs are in the file, which silently hides missing entries
- Correct counting approaches:
  ```bash
  tr '>' '\n' < dist/client/sitemap-0.xml | grep -c '<loc'
  # Or just verify the specific new slug is present
  grep "new-slug" dist/client/sitemap-0.xml
  ```
- Run this check **after** `astro build` but **before** `/ship` — catching a missing entry pre-deploy is cheap, catching it post-deploy means another full build + deploy cycle

### D1 safety
- Use `--file=insert.sql` rather than inline `--command=` for INSERTs that contain JSON — shell escaping of nested quotes, backslashes, and newlines in PortableText payloads will corrupt the content field in subtle ways
- INSERT is reversible if needed:
  ```bash
  npx wrangler d1 execute cc4-emdash --remote --command "DELETE FROM ec_posts WHERE slug='...';"
  ```
  But you shouldn't need to — the `slug + locale` unique constraint rejects duplicates before any corruption, so a failed INSERT is a safe no-op
- Keep insert helper scripts around as living templates (`insert_post_anthropic_growth.py`, etc.). They document the full row shape including every NULL-okay column
- Always execute against `--remote`, not local — the local D1 is ephemeral in this setup and won't reflect production state

### Test cases for a future `/new-post` skill
If this workflow gets automated into a dedicated skill, it must handle:
- **Input:** Accept a markdown file and auto-convert to PortableText — every paragraph → `normal` block, every `##` → `h2`, every `###` → `h3`, preserving inline marks (bold, italic, links) as `markDefs`
- **Key generation:** Unique `_key` for every block and span (hex or ULID, 12+ chars) — PortableText breaks if keys collide within a document
- **Slug collision check:** Query `ec_posts` for the proposed slug before proceeding and fail loudly, rather than letting the unique constraint reject mid-transaction
- **Cover verification:** Assert `public/blog/cover-{slug}.png` exists, is exactly 1200×630, and is not a solid black rectangle (pixel sample check to catch silent MSVG failures)
- **Sitemap sync:** Auto-append the new route to the `blogPages` array in `astro.config.mjs`
- **End-to-end verification:** INSERT → `/ship` → curl the live URL and assert both the post body and the correct `og:image` are present
- **Idempotency:** Re-running on the same markdown file should be a no-op, not a duplicate-insert error
- **Rollback:** On any post-INSERT failure, auto-DELETE the row so the next retry starts clean

## Related documentation

- [`emdash-astro6-cloudflare-workers-setup.md`](./emdash-astro6-cloudflare-workers-setup.md) — **Prerequisite reading.** Foundational guide covering the Emdash + D1 + R2 binding setup, SSR/prerender requirements, and `live.config.ts`. Start there if the integration isn't already working.
- [`cloudflare-workers-assets-with-api-routes.md`](./cloudflare-workers-assets-with-api-routes.md) — How static assets (including `public/blog/*.png`) are served alongside SSR routes from the Workers adapter.
- [`github-actions-cloudflare-workers-auto-deploy.md`](./github-actions-cloudflare-workers-auto-deploy.md) — The CI/CD pipeline that `/ship` triggers.
- [`../build-errors/wrangler-versions-upload-missing-entry-point.md`](../build-errors/wrangler-versions-upload-missing-entry-point.md) — Adjacent build-time gotcha with `wrangler` + `assets.directory`.

## Related code

- `src/pages/blog/[slug].astro` — SSR route, reads post via `getEmDashEntry('posts', slug)`, builds JSON-LD and passes `featured_image.src` to `BaseLayout` as `image=`
- `src/pages/blog/index.astro` — Blog index, auto-picks up any published post from D1
- `emdash-env.d.ts` — Generated `Post` interface; use this as the source of truth for field shapes
- `astro.config.mjs` — `blogPages` array (sitemap custom pages), Emdash integration with D1/R2 bindings
- `wrangler.jsonc` — D1 binding `DB` → `cc4-emdash`, R2 binding `MEDIA` → `cc4-media`
- `insert_post_anthropic_growth.py` — Working reference script for PortableText + SQL generation
- `.claude/skills/ship/SKILL.md` — The deploy workflow invoked at step 7

## Style reference assets

All covers are 1200×630, editorial brutalist palette (`#F5F1E8` cream / `#B85C3C` rust / `#5C3A6B` plum):

- `public/blog/cover-claude-code-marketing-guide.svg` + `.png`
- `public/blog/cover-campaign-brief-ai.svg` + `.png`
- `public/blog/cover-anthropic-growth-marketing.svg` + `.png`

## Related

- [PortableText missing code/image block handlers](../ui-bugs/portabletext-missing-code-image-handlers-BlogPublisher-20260426.md) — what happens when `publish_post.py` doesn't handle ` ``` ` or `![img]()` syntax, and how to add custom block renderers to the blog template
