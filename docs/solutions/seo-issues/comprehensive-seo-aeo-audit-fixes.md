---
title: "Comprehensive SEO/AEO audit fixes: schema spam, broken breadcrumbs, meta lengths, trailing slashes, and LLM discoverability"
category: seo-issues
date: 2026-04-15
tags:
  - seo
  - aeo
  - json-ld
  - structured-data
  - course-schema
  - breadcrumbs
  - meta-tags
  - trailing-slashes
  - llms-txt
  - robots-txt
  - cloudflare
  - og-image
severity: critical
component: BaseLayout.astro, LessonLayout.astro, blog/[slug].astro, blog/index.astro, llms.txt, llms-full.txt, robots.txt, promo.ts
---

## Problem

A full-site SEO/AEO audit of cc4.marketing (12 pages) revealed 29 issues across structured data, meta tags, infrastructure, and AI discoverability. The three critical issues were: (1) Cloudflare's managed AI bot block silently overriding custom robots.txt Allow rules for GPTBot, ClaudeBot, and Google-Extended; (2) the Course JSON-LD schema being emitted on every page (18+) instead of only the homepage; (3) all lesson pages emitting a semantically useless 1-item BreadcrumbList containing only "Home".

## Root cause

1. **Cloudflare AI bot block**: Cloudflare prepends a managed `# BEGIN Cloudflare Managed content` block to robots.txt at the edge. This block `Disallow: /` for GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot, and others — and appears *before* the custom `Allow: /` rules in `public/robots.txt`. Per robots.txt spec, the first matching directive wins, so the custom Allow rules were silently ignored.

2. **Course schema duplication**: `BaseLayout.astro:35` defaulted `showCourseSchema = true`. Neither `LessonLayout.astro` nor individual pages like `/download/` or `/brand-guide/` passed `showCourseSchema={false}`, so every page inherited the Course schema.

3. **Broken breadcrumbs**: `BaseLayout.astro:84-95` hardcoded a single-item BreadcrumbList with only "Home". There was no mechanism to pass additional breadcrumb items from child layouts, and `showBreadcrumb` defaulted to `true`, so every page got the useless 1-item breadcrumb.

4. **Blog title truncation**: `BaseLayout.astro:42` appended `| Claude Code for Marketers` (27 chars) to every title. Blog post titles were already 60-68 chars, pushing the full title to 87-96 chars — far over Google's 60-char display limit.

5. **Hardcoded meta keywords**: `blog/[slug].astro:84` used a static array identical for all posts instead of deriving keywords from the post content.

6. **Missing trailing slashes on blog links**: `blog/index.astro:74` and `[slug].astro:138-148` built internal blog URLs without trailing slashes, causing 301 redirects.

7. **llms.txt/llms-full.txt gaps**: Both files described the blog generically but never listed the actual 3 blog post URLs, making individual posts undiscoverable by LLMs.

## Solution

### Issue #1: Cloudflare AI bot block (dashboard fix)

Go to Cloudflare Dashboard > Security > Bots > AI Bots > disable the managed block. This is not fixable in code — the block is prepended at the edge regardless of `public/robots.txt` content.

**Verification:**
```bash
curl -s https://cc4.marketing/robots.txt | grep -c "BEGIN Cloudflare Managed"
# Should return 0
```

### Issue #2: Course schema default

```diff
# src/layouts/BaseLayout.astro line 35
- showCourseSchema = true,
+ showCourseSchema = false,
```

Then set `showCourseSchema={true}` only on the homepage:

```diff
# src/pages/index.astro
- <BaseLayout title="Claude Code for Marketers" description="...">
+ <BaseLayout title="Claude Code for Marketers | Free AI Marketing Course" description="..." showCourseSchema={true}>
```

### Issue #3: Broken breadcrumbs

Suppress the useless default breadcrumb on pages that can't provide proper depth:

```diff
# src/layouts/LessonLayout.astro
- <BaseLayout title={title} description={description}>
+ <BaseLayout title={title} description={description} type="article" showCourseSchema={false} showBreadcrumb={false}>
```

Same for `/download/`, `/brand-guide/` — add `showCourseSchema={false} showBreadcrumb={false}`.

Blog post pages and the authors page already had their own proper multi-level breadcrumbs via `showBreadcrumb={false}` + custom JSON-LD, so they were unaffected.

### Issue #4: Blog title suffix

```diff
# src/layouts/BaseLayout.astro line 42
- const fullTitle = (title.includes("CC4") || title.includes("Claude Code for Marketers")) ? title : `${title} | Claude Code for Marketers`;
+ const titleSuffix = type === "article" ? " | CC4M" : " | Claude Code for Marketers";
+ const fullTitle = (title.includes("CC4") || title.includes("Claude Code for Marketers")) ? title : `${title}${titleSuffix}`;
```

Result: `"How Anthropic's Growth Marketing Team Uses Claude Code to 10x Output | CC4M"` (75 chars → still a bit over 60 but much better than 96).

### Issue #5: Blog excerpts too long

Trimmed directly in D1:

```bash
npx wrangler d1 execute cc4-emdash --remote --command "UPDATE ec_posts SET excerpt='...' WHERE slug='...';"
```

Post 1: 177 → ~150 chars. Post 2: 208 → ~155 chars.

### Issue #6: Per-post keywords

```typescript
// src/pages/blog/[slug].astro — after the post fetch
const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'to', 'in', 'for', ...]);
const titleWords = post.data.title.toLowerCase()
  .replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  .filter((w: string) => w.length > 2 && !stopWords.has(w));
const postKeywords = [...new Set([...titleWords.slice(0, 6), 'Claude Code', 'AI marketing'])];
```

Then `keywords={postKeywords}` on the BaseLayout call.

### Issue #8: Blog trailing slashes

```diff
# src/pages/blog/index.astro line 74
- <a href={`/blog/${post.data.slug}`} class="blog-card">
+ <a href={`/blog/${post.data.slug}/`} class="blog-card">

# src/pages/blog/[slug].astro lines 143, 149
- <a href={`/blog/${prevPost.data.slug}`} ...>
+ <a href={`/blog/${prevPost.data.slug}/`} ...>
```

### Issue #9: llms.txt + llms-full.txt

Added a `### Published Posts` section to both files with the 3 blog post URLs and descriptions:

```markdown
### Published Posts
- [How to Use Claude Code for Marketing: A Complete 2026 Guide](https://cc4.marketing/blog/claude-code-for-marketing-guide-2026/)
- [How to Write a Campaign Brief with AI in 10 Minutes](https://cc4.marketing/blog/write-campaign-brief-with-ai/)
- [How Anthropic's Growth Marketing Team Uses Claude Code to 10x Output](https://cc4.marketing/blog/anthropic-growth-marketing-claude-code/)
```

### Additional fixes in the same commit

- **WebSite publisher logo**: Added `"logo": {"@type": "ImageObject", "url": ".../og-image.png", "width": 1200, "height": 630}` to the WebSite schema publisher.
- **Course schema enrichment**: Added `offers` (free, USD), `image`, `url` with trailing slash. Removed invalid `numberOfCredits: "17 lessons"`.
- **Schema URL trailing slashes**: All JSON-LD URLs now use `https://cc4.marketing/` instead of `https://cc4.marketing`.
- **Orphaned preconnects**: Removed `fonts.googleapis.com` and `fonts.gstatic.com` preconnect hints (no Google Fonts are loaded). Replaced with `beamanalytics.b-cdn.net` preconnect.
- **Blog index**: Description expanded with CTA. CollectionPage URL and breadcrumb URLs fixed with trailing slashes.
- **Homepage**: Title expanded to "Claude Code for Marketers | Free AI Marketing Course" (55 chars). Description expanded to 186 chars.

## Prevention & best practices

### Running future SEO audits
- Use the `/seo-audit` skill — it covers all the checks that caught these issues
- The full audit report is saved at `docs/seo-audit-2026-04-15.md` for reference
- Re-audit after any layout, schema, or meta tag change

### When adding new pages
- Always pass `showCourseSchema={false}` unless the page is the homepage or a dedicated course overview
- Always pass `showBreadcrumb={false}` unless the page provides its own multi-level breadcrumb JSON-LD
- Check that the title (with suffix) stays under 60 chars: articles get `| CC4M` (7 chars), other pages get `| Claude Code for Marketers` (27 chars)

### When publishing new blog posts
- Keep excerpt under 160 chars (the `/publish-post` skill doesn't enforce this yet — manual check)
- Keywords are auto-generated from title, but check they're meaningful after the stopword filter
- Blog links auto-get trailing slashes now (fixed in the templates)
- Update `public/llms.txt` and `public/llms-full.txt` with the new post URL (the `/publish-post` skill doesn't do this yet)

### Cloudflare AI bot management
- Cloudflare can silently re-enable the managed AI bot block on plan changes, security policy updates, or dashboard resets
- After any Cloudflare plan/config change, verify: `curl -s https://cc4.marketing/robots.txt | grep "BEGIN Cloudflare Managed"`
- If it returns anything, the block was re-enabled — go to Dashboard > Security > Bots > AI Bots to disable

### Schema validation
- Test changes with Google's Rich Results Test: https://search.google.com/test/rich-results
- Check for duplicate schema types on any page: `curl -s <url> | grep -o '"@type":"[^"]*"' | sort | uniq -c`
- Course schema should appear exactly once across the entire site (on the homepage)

## Related documentation

- [`docs/seo-audit-2026-04-15.md`](../../seo-audit-2026-04-15.md) — the full 29-issue audit report this fix addresses
- [`emdash-astro6-cloudflare-workers-setup.md`](../integration-issues/emdash-astro6-cloudflare-workers-setup.md) — the original Emdash + Astro 6 setup guide
- [`emdash-d1-blog-post-publishing-workflow.md`](../integration-issues/emdash-d1-blog-post-publishing-workflow.md) — the D1 publishing workflow (covers excerpt/cover creation where meta lengths matter)
- `.claude/skills/seo-audit/SKILL.md` — the audit skill that discovered these issues
