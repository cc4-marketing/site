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
With no argument, ask the user for the article title, excerpt, slug (optional), cover path (optional), and body content. Then write a temporary markdown file to `/tmp/new-post-{slug}.md` with frontmatter + body and proceed as Mode A.

Additional flags (optional):
- `--dry` — run all validation and emit SQL, but don't execute, update sitemap, or ship

## Frontmatter schema

```yaml
---
title: "How to X"                          # required, ≤ 60 chars for SEO
slug: how-to-x                             # optional; derived from title
excerpt: "Meta description around 155 chars — shown in SERP and OG/Twitter cards."  # required
cover: /blog/cover-how-to-x.png            # optional; defaults to /blog/cover-{slug}.png
cover_alt: "Descriptive alt text"          # optional; defaults to generic
published_at: 2026-04-09T09:00:00Z         # optional; defaults to now UTC
keywords: [ai marketing, claude code]      # optional
---
```

## Instructions

### Step 1: Preflight

1. Confirm the markdown file exists (Mode A) or gather fields from the user (Mode B).
2. Verify on `main` branch: `git branch --show-current`.
3. If not on main, warn and ask to continue.

### Step 2: Cover image

Check whether the cover PNG already exists at `public/blog/cover-{slug}.png`:

```bash
ls public/blog/cover-{slug}.png
```

**If it exists:** skip to Step 3.

**If it doesn't exist:** help the user generate it. Three options, in order of reliability:

1. **Hand-authored SVG + cairosvg** (most reliable — use this by default):
   - Look at `public/blog/cover-*.svg` for the house style (editorial brutalist, cream `#F5F1E8` / rust `#B85C3C` / plum `#5C3A6B`, 1200×630)
   - Author `public/blog/cover-{slug}.svg`
   - Rasterize:
     ```bash
     DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib uv run python -c "
     import cairosvg
     cairosvg.svg2png(
         url='public/blog/cover-{slug}.svg',
         write_to='public/blog/cover-{slug}.png',
         output_width=1200,
         output_height=630,
     )
     "
     ```
   - **Never use ImageMagick** for gradient SVGs — it silently renders them as solid black.

2. **Gemini API (`compound-engineering:gemini-imagegen` skill):** requires `GEMINI_API_KEY` set.

3. **Vertex AI via `generate_cover.py`:** requires billing enabled on `gen-lang-client-0013409905` (check first — was disabled as of 2026-04-09).

### Step 3: Dry run the publisher

Run the helper script in dry-run mode to validate everything before touching D1:

```bash
uv run python .claude/skills/publish-post/publish_post.py <markdown_file>
```

The script performs these checks:
1. Frontmatter parses and has required fields (title, excerpt)
2. Slug is not already in `ec_posts` (queries remote D1)
3. Cover exists at the expected path
4. Cover is exactly 1200×630
5. Cover is not a solid-black rectangle (pixel sample check)
6. Markdown body converts to valid PortableText (≥1 block)

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
npx wrangler d1 execute cc4-emdash --remote --command "SELECT id, slug, status, title, published_at FROM ec_posts WHERE slug='{slug}';"
```

The post should show `status: published` with the expected title and timestamp.

### Step 6: Ship

Invoke the `/ship` skill with a commit message like `feat: publish "{title}" blog post`. Because this is a `feat:` commit, `/ship` will also offer to add a changelog entry — accept it (see `.claude/skills/ship/SKILL.md` for the auto-changelog flow).

`/ship` handles: build, stage (cover PNG/SVG + astro.config.mjs + any helper script changes), commit, push, deploy monitoring, and smoke tests.

### Step 7: Post-deploy verification

After `/ship` reports success, run:

```bash
# Verify the live page renders
/usr/bin/curl -sL -w "%{http_code}" -o /dev/null "https://cc4.marketing/blog/{slug}"

# Verify the og:image points at the new cover (not the fallback /og-blog.png)
/usr/bin/curl -s "https://cc4.marketing/blog/{slug}" | grep -E 'og:image|twitter:image'

# Verify the sitemap contains the new URL
/usr/bin/curl -s "https://cc4.marketing/sitemap-0.xml" | grep "{slug}"

# Verify the cover asset shipped
/usr/bin/curl -sI "https://cc4.marketing/blog/cover-{slug}.png" | head -1
```

**All four must pass.** If `og:image` still points at `/og-blog.png`, the cover PNG didn't ship — investigate `git status` to see if the cover was staged, and re-run `/ship` if needed.

### Step 8: Report

```
✅ Post published

Title: {title}
URL: https://cc4.marketing/blog/{slug}
Cover: https://cc4.marketing/blog/cover-{slug}.png
D1 id: {post_id}
Deploy: {workflow_run_url}

SEO verified:
  ✓ og:image → new cover
  ✓ twitter:image → new cover
  ✓ sitemap contains /blog/{slug}
  ✓ cover asset 200
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
- If the INSERT succeeds but `/ship` fails, the post is live on the D1 side but has no cover asset in production. Diagnose the ship failure and re-run `/ship`, not `/publish-post`
- Rollback: `npx wrangler d1 execute cc4-emdash --remote --command "DELETE FROM ec_posts WHERE slug='{slug}';"` — but you should rarely need this

## Key files

- `.claude/skills/publish-post/publish_post.py` — the helper script that does parsing, validation, SQL generation, and execution
- `src/pages/blog/[slug].astro` — the SSR route that reads the post from D1 via Emdash
- `astro.config.mjs` — contains the `blogPages` array for sitemap
- `public/blog/` — where cover images live (PNG + SVG source)
- `docs/solutions/integration-issues/emdash-d1-blog-post-publishing-workflow.md` — the full workflow reference

## Related skills

- `/ship` — invoked at Step 6; handles build/commit/push/deploy and auto-adds changelog entry for `feat:` commits
- `/changelog-add` — use if you want a custom changelog entry instead of the auto-generated one
- `/release` — cut a version when enough posts/features have accumulated in `[Unreleased]`
