---
title: SEO/AEO Backlog — 2026-04-15 Audit
type: docs
status: active
date: 2026-04-15
origin: docs/solutions/seo-issues/comprehensive-seo-aeo-audit-fixes.md
---

# SEO/AEO Backlog

Tracking the follow-up items surfaced in the 2026-04-15 `/seo-audit` pass.

- **HIGH** items shipped in [PR #15](https://github.com/cc4-marketing/site/pull/15): sitemap excludes `/og-preview/`, blog posts emit standalone `BreadcrumbList`, 1-item homepage `BreadcrumbList` suppressed.
- This doc tracks the **MEDIUM** and **LOW** items still open. Work top-to-bottom; each item is independent.

---

## 🟡 MEDIUM — quick wins

### M1. Trim long title on one blog post

- **Post:** `anthropic-growth-marketing-claude-code` — current title is **79 chars** (>70 target for SERP without truncation)
- **Current:** "How Anthropic's Growth Marketing Team Uses Claude Code to 10x Output"
- **Suggested:** "How Anthropic's Growth Team Uses Claude Code to 10x Output" (~66 chars with `| CC4M` suffix)
- **How to fix:** `npx wrangler d1 execute cc4-emdash --remote --command "UPDATE ec_posts SET title='…', updated_at='…Z' WHERE slug='anthropic-growth-marketing-claude-code'"` — then crawl with Facebook Sharing Debugger to force re-fetch
- **Est:** 10 min

---

### M2. Normalize description lengths on 4 pages

Target: 150–160 chars for SERP snippet fit.

| Page | File | Current | Action |
|---|---|---|---|
| Homepage | `src/pages/index.astro` | 186 | Trim ~30 chars |
| Blog index | `src/pages/blog/index.astro` | 180 | Trim ~25 chars |
| Changelog | `src/pages/changelog.astro` | 140 | Expand ~15 chars |
| `/brand-guide/` | `src/pages/brand-guide.astro` | 64 | Expand to ~150 |
| `write-campaign-brief-with-ai` | D1 `ec_posts.excerpt` | 187 | D1 UPDATE |

**Grouped because the edits are identical shape** (copy-tweak one `description=""` prop per page; one D1 UPDATE for the post).

**Est:** 30 min

---

### M3. Expand module titles + descriptions

- **Current:** all 17 lesson MDX frontmatters produce titles 19–33 chars and descriptions 93–100 chars. Both ends of the range are short for SERP real estate.
- **Suggested:** expand description to 120-160 chars on all 17 lesson MDX files in `src/content/modules/`. Titles can stay as-is if lengthening feels forced; the base `| Claude Code for Marketers` suffix is already applied by BaseLayout when titles don't already contain "CC4" — check BaseLayout.astro:43.
- **How to fix:** edit each MDX frontmatter. Batch job — do all 17 in one pass.
- **Est:** 1–1.5 hours (writing effort, not mechanical)

---

### M4. Module sitemap priority inconsistency

- **Current:** M0 lessons = `0.9`, M1 + M2 lessons = `0.8` in `astro.config.mjs:67-79`
- **Recommendation:** set all 17 lessons to the same priority. M1+M2 are where the course *value* lives — raising everything to 0.9 is the aligned choice.
- **How to fix:** `astro.config.mjs` — remove the module-0 branch, fold it into a single `/modules/` condition at 0.9.
- **Est:** 5 min

---

### M5. Add explicit `Google-Extended` allow in robots.txt

- **Current:** `public/robots.txt` has explicit `Allow: /` blocks for GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, Anthropic-AI, PerplexityBot, Applebot-Extended — but no block for `Google-Extended` (the bot that controls Gemini/Bard training consent). Falls through to `User-agent: *` which is also `Allow: /`, so functionally fine. Inconsistent with the pattern, though.
- **How to fix:** add a `User-agent: Google-Extended` + `Allow: /` pair to the AI-bots section.
- **Est:** 2 min

---

## 🟢 LOW — backlog

### L1. Consolidate duplicate `User-agent: *` blocks in robots.txt

- Two `User-agent: *` blocks (L5 and L89) — most parsers merge them but naive ones may treat the second as overriding.
- **Fix:** move the `Crawl-delay: 1` from L89 into the first `User-agent: *` block and delete the duplicate.
- **Est:** 2 min

---

### L2. Add trailing slashes to lesson paths in `llms-full.txt`

- `public/llms-full.txt` lists lessons as `/modules/0/introduction` (no trailing slash), but the site canonicalizes to trailing-slash form and the sitemap matches.
- A crawler following these bare paths hits a 301 (negligible hit, but inconsistent).
- **Fix:** add trailing slash to every lesson path in `llms-full.txt`.
- **Est:** 5 min (sed pass)

---

### L3. Add `<lastmod>` to sitemap entries

- **Current:** no `<lastmod>` on any URL in `sitemap-0.xml`. Google uses this to prioritize recrawl.
- **Fix:** extend the sitemap `serialize(item)` function in `astro.config.mjs` to add `item.lastmod`. For static pages (home, blog index, changelog), use the build timestamp. For module lessons, use `git log` mtime of each MDX (hard — simpler: use build time). For blog posts, manually maintained or read from D1 `updated_at` (harder — requires a build-time D1 query).
- **Caveat:** scope creep risk. Start with static pages using build time — defer the per-post dynamic lastmod until there's a reason to bother.
- **Est:** 30 min (simple version) — 2–3 hrs (full per-post version, not worth it)

---

### L4. Add `LearningResource` JSON-LD to module lesson pages

- **Current:** lesson pages emit only `WebSite` + `Organization` schemas (site-wide defaults). No page-specific rich-result schema.
- **Opportunity:** add `LearningResource` schema per lesson for EDU rich results. Fields: `name`, `description`, `educationalLevel`, `teaches`, `timeRequired`, `isPartOf` → Course schema on homepage, `mainEntityOfPage`.
- **Fix:** edit `src/layouts/LessonLayout.astro` (or the route file at `src/pages/modules/[...slug].astro`) to pass a new schema prop.
- **Est:** 45 min

---

### L5. `/download/` title/H1 drift

- **Title:** "Subscribe & Download" (52 chars, fine)
- **H1:** "Subscribe for Course Updates" (in the page body) — doesn't match the title's primary keyword ("Download")
- **Pick one:** either update H1 to "Subscribe & Download" for keyword consistency, or change the page title to match the H1's promise. I lean toward keeping "Download" in both — it's the conversion keyword.
- **Fix:** `src/pages/download.astro` — align H1 text to title.
- **Est:** 2 min

---

### L6. Add `WebPage` / `Course` / `Offer` / `AboutPage` schemas on light-schema pages

- `/download/` and `/brand-guide/` emit only `WebSite` schema (site-wide default). No page-specific schema.
- Adds AEO surface area — Google sometimes uses `WebPage` for basic rich snippets, `Course` + `Offer` would mark up `/download/` as free course access.
- **Fix:** extend `BaseLayout.astro` to accept a per-page `schema` array, or add per-route schemas like `[slug].astro` does.
- **Est:** 1 hr

---

## Scope cuts (deliberately NOT doing)

- **Sitewide trailing-slash 301 normalization** — the audit flagged that both `/path` and `/path/` both return 200 (no 301 redirect). Canonicals point to one form, so duplicate-content risk is low. Adding 301s is a Cloudflare routing or Astro adapter change, and the benefit is marginal. Not worth it unless Search Console starts flagging duplicates.
- **Cloudflare managed-bot block audit** — audit confirmed no managed block is being prepended to robots.txt right now. If Cloudflare's defaults change in the future, re-check.
- **FAQ / HowTo schema retrofits on existing posts** — only do this if the post genuinely has a Q&A or step-by-step structure. Current 4 posts don't.

---

## Shipping strategy

Recommend picking up MEDIUMs as a batch PR (probably a single "fix(seo): M1–M5 from 2026-04-15 audit" commit, since each is small and related). LOWs can be individual commits or a quiet afternoon pass.

**If you prioritize AEO impact:** L4 (LearningResource) > M3 (module descriptions) > L6 (page-specific schemas).
**If you prioritize SERP appearance:** M2 (description lengths) > M1 (title length) > M4 (sitemap priorities).
