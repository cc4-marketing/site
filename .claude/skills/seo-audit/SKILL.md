---
name: seo-audit
description: Run a full SEO, AEO, and LLM discoverability audit on cc4.marketing
---

# /seo-audit — SEO + AEO + LLM Readiness Audit

Run a comprehensive audit of cc4.marketing for search engine optimization, answer engine optimization, and AI/LLM discoverability.

## Arguments

`/seo-audit` — full audit (default)
`/seo-audit quick` — check only critical items
`/seo-audit [url]` — audit a specific page (e.g. `/seo-audit /blog/my-post`)

## Instructions

### Phase 1: Parallel Page Audits

Launch parallel agents to audit pages. For each page, check:

**Meta Tags:**
- Title tag (unique, under 60 chars, includes primary keyword)
- Meta description (unique, 150-160 chars, includes CTA)
- Meta keywords (page-specific, not generic defaults)
- Canonical URL (correct, no duplicates)
- robots (index, follow)

**Open Graph / Social:**
- og:title, og:description, og:image (absolute URL, 1200x630 PNG)
- og:type (website for pages, article for posts/lessons)
- twitter:card (summary_large_image), twitter:image

**Structured Data (JSON-LD):**
- Homepage: WebSite, Course, BreadcrumbList
- Blog index: CollectionPage (no Course schema, no base BreadcrumbList)
- Blog posts: BlogPosting with headline, description, datePublished, dateModified, author (Person), publisher (Organization with raster logo), mainEntityOfPage, breadcrumb
- Authors: AboutPage with Person schemas
- Lesson pages: should NOT have Course schema duplicated
- Check for duplicate/conflicting BreadcrumbList schemas

**Content Quality:**
- H1 count (exactly 1 per page)
- Internal links have trailing slashes
- Images have alt text and dimensions

### Phase 2: Site-Wide Checks

**robots.txt:**
- Fetch https://cc4.marketing/robots.txt
- Check if AI bots are allowed: GPTBot, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended
- **CRITICAL:** Check for Cloudflare managed block prepended before custom rules — this overrides your Allow directives
- Verify sitemap and llms.txt references

**llms.txt:**
- Fetch https://cc4.marketing/llms.txt
- Follows llms.txt spec (title, blockquote summary, structured sections)
- Covers all site sections: homepage, blog, modules, changelog
- Links to llms-full.txt

**llms-full.txt:**
- Fetch https://cc4.marketing/llms-full.txt
- Full course structure with all 17 lessons
- Blog section with post URLs
- Changelog API endpoints

**Sitemap:**
- Fetch https://cc4.marketing/sitemap-index.xml
- All pages included (homepage, blog posts, module lessons, changelog, download, brand-guide, authors)
- Priorities correct (homepage 1.0, blog/download 0.9, modules 0.8-0.9, changelog 0.8)
- No orphaned pages (pages in sitemap that 404)

### Phase 3: AEO-Specific Checks

- **FAQ schema** — do any blog posts have Q&A sections that should use FAQPage?
- **HowTo schema** — do any blog posts have step-by-step instructions that should use HowTo?
- **Featured snippets** — are H2/H3 headings phrased as questions for featured snippet targeting?
- **Entity clarity** — is the Organization entity consistent across all schemas?
- **Breadcrumb depth** — do all pages have proper breadcrumb chains (Home > Section > Page)?

### Phase 4: Report

Output a table:

```
| Area              | Status | Issues |
|-------------------|--------|--------|
| Meta tags         | PASS/FAIL | ... |
| OG / Social       | PASS/FAIL | ... |
| Structured data   | PASS/FAIL | ... |
| robots.txt        | PASS/FAIL | ... |
| llms.txt          | PASS/FAIL | ... |
| Sitemap           | PASS/FAIL | ... |
| AEO readiness     | PASS/FAIL | ... |
```

Then list fixes by priority:
1. **Critical** — blocks indexing or AI discovery
2. **High** — affects SERP appearance or rich results
3. **Medium** — optimization opportunities
4. **Low** — nice-to-have

For each fix, show the exact file and line to change, or the exact code change needed.

## Key Files

- `src/layouts/BaseLayout.astro` — global meta tags, JSON-LD schemas
- `src/pages/blog/[slug].astro` — BlogPosting schema
- `src/pages/blog/index.astro` — CollectionPage schema
- `src/pages/blog/authors.astro` — AboutPage schema
- `astro.config.mjs` — sitemap config with customPages
- `public/robots.txt` — bot directives
- `public/llms.txt` — AI discovery
- `public/llms-full.txt` — extended AI reference
- `wrangler.jsonc` — Cloudflare config

## Known Gotchas

- Cloudflare prepends a managed AI bot block to robots.txt at the edge — your `public/robots.txt` Allow rules get overridden. Fix in Cloudflare Dashboard > Security > Bots > AI Bots.
- Blog posts are SSR from Emdash CMS — they must be manually added to `customPages` in the sitemap config.
- The `showCourseSchema` and `showBreadcrumb` props on BaseLayout control which pages get Course/BreadcrumbList schemas.
