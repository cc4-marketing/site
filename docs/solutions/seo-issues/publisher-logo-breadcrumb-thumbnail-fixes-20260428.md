---
title: "SEO round 2: publisher logo dimensions, standalone BreadcrumbList, blog thumbnail missing, lesson breadcrumbs, author URL anchors"
category: seo-issues
date: 2026-04-28
tags:
  - seo
  - json-ld
  - structured-data
  - breadcrumbs
  - publisher-logo
  - featured-image
  - d1
  - emdash
  - llms-txt
  - robots-txt
  - lesson-pages
severity: critical
component: BaseLayout.astro, LessonLayout.astro, blog/[slug].astro, blog/index.astro, astro.config.mjs, llms.txt, llms-full.txt, robots.txt
---

## Problem

A follow-up SEO/AEO audit of cc4.marketing on 2026-04-28 (after the April 15 round) revealed 5 critical and high issues that remained or were newly introduced:

1. **Blog thumbnail missing on index page** — newly published `castmd-vibe-coding-chrome-extension` post showed no thumbnail in the blog grid.
2. **Publisher logo wrong dimensions** — all three schema files (BaseLayout, blog/[slug], and implicitly blog/index via BaseLayout) used `og-image.png` (1200×630) as the `publisher.logo` in JSON-LD. Google rejects banner-format images as organization logos.
3. **Blog index BreadcrumbList nested** — the `BreadcrumbList` was emitted only inside the `CollectionPage` breadcrumb property, not as a standalone top-level schema. Google's rich results require a top-level `BreadcrumbList` script.
4. **Lesson pages had no BreadcrumbList** — `LessonLayout.astro` never emitted any breadcrumb schema, and the title passed to BaseLayout was just the lesson title (no "Module N:" prefix).
5. **Author URLs all pointed to generic /blog/authors/** — every blog post linked to `https://cc4.marketing/blog/authors/` even for named authors who have `#anchor` entries on that page.

Additionally, three new blog posts were missing from `llms.txt` and `llms-full.txt`, the sitemap lacked `lastmod` dates, four more AI crawlers were not in `robots.txt`, and the homepage/blog descriptions were slightly over 160 chars.

## Root cause

### 1. Blog thumbnail missing

The `blog/index.astro` thumbnail render is conditional on `post.data.featured_image?.src` being set (line 84). The castmd post was inserted without a `featured_image` record in D1 — the cover PNG existed at `public/blog/cover-castmd-vibe-coding-chrome-extension.png` but the D1 `featured_image` JSON column was null. The blog index never falls back to the cover file path.

### 2. Publisher logo dimensions

The `og-image.png` (1200×630) was copied into the `publisher.logo` ImageObject during initial schema setup. Google's structured data guidelines for `Organization.logo` require either a rectangle no wider than 600px and no taller than 60px, **or** a 1:1 square logo. A 1200×630 banner image violates both constraints and will be rejected by the Rich Results Test.

### 3. BreadcrumbList nesting

Google's documentation explicitly states that `BreadcrumbList` must appear as a **top-level standalone** JSON-LD script to qualify for breadcrumb display in SERP. A `BreadcrumbList` nested inside a `CollectionPage.breadcrumb` property is valid JSON-LD but Google does not use it for rich results.

### 4. No lesson breadcrumbs

`LessonLayout.astro` called `BaseLayout` with `showBreadcrumb={false}` (to suppress the useless 1-item default) but never injected its own 3-level BreadcrumbList. No module name was passed to BaseLayout either, so Google saw lesson titles without their module context.

### 5. Generic author URLs

`blog/[slug].astro` hardcoded `authorUrl = 'https://cc4.marketing/blog/authors/'` for all posts regardless of the author. Named authors like "Tri Vo" and "Alice Chen" have `#tri-vo` and `#alice-chen` anchors on the authors page, which Google can use to associate the `Person` entity.

## Solution

### Fix 1: Blog thumbnail — set featured_image in D1

Create the 1200×630 cover PNG with `sips` (macOS built-in, no Pillow needed):

```bash
# Crop/resize an existing screenshot to exactly 1200×630
sips --resampleWidth 1200 public/blog/castmd-landing-page.png --out /tmp/cover-tmp.png
sips --cropToHeightWidth 630 1200 /tmp/cover-tmp.png --out public/blog/cover-castmd-vibe-coding-chrome-extension.png
```

Then set the `featured_image` JSON column in D1:

```bash
npx wrangler d1 execute cc4-emdash --remote --command "
UPDATE ec_posts
SET featured_image = '{\"src\":\"https://cc4.marketing/blog/cover-castmd-vibe-coding-chrome-extension.png\",\"width\":1200,\"height\":630,\"alt\":\"castmd Chrome extension popup showing three output modes: MD, JSON, and XML for Claude\"}'
WHERE slug = 'castmd-vibe-coding-chrome-extension';
"
```

Verify:
```bash
npx wrangler d1 execute cc4-emdash --remote --command "SELECT slug, featured_image FROM ec_posts WHERE slug='castmd-vibe-coding-chrome-extension';"
```

> **Key insight:** The cover PNG on disk and the `featured_image` column in D1 are completely independent. The blog index always reads from D1 — the file on disk is irrelevant unless D1 points to it.

### Fix 2: Publisher logo — use apple-touch-icon.png

Replace `og-image.png` with `apple-touch-icon.png` (180×180, a proper square) in all three places:

**`src/layouts/BaseLayout.astro`** (WebSite schema):
```diff
- "logo": { "@type": "ImageObject", "url": "https://cc4.marketing/og-image.png", "width": 1200, "height": 630 }
+ "logo": { "@type": "ImageObject", "url": "https://cc4.marketing/apple-touch-icon.png", "width": 180, "height": 180 }
```

**`src/pages/blog/[slug].astro`** (BlogPosting publisher):
```diff
- 'url': 'https://cc4.marketing/apple-touch-icon.png',  // already updated in April 15 round — verify
```

> **Rule:** `Organization.logo` in JSON-LD must be ≤600×60px (rectangular) or a square. The `og:image` banner (1200×630) is correct for social sharing but wrong for the publisher logo. `apple-touch-icon.png` (180×180) satisfies both Google and Apple.

### Fix 3: Standalone BreadcrumbList on blog index

Emit the BreadcrumbList as a top-level `<script>` **before** the CollectionPage schema:

```astro
<!-- src/pages/blog/index.astro -->
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://cc4.marketing/" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://cc4.marketing/blog/" }
  ]
})} />

<!-- existing CollectionPage schema still includes breadcrumb property — both are fine -->
<script type="application/ld+json" set:html={JSON.stringify(collectionPageSchema)} />
```

> **Rule:** A `BreadcrumbList` inside another schema's `breadcrumb` property is valid JSON-LD but Google ignores it for rich results. Always emit a **standalone top-level** `<script type="application/ld+json">` with `@type: BreadcrumbList`.

### Fix 4: Lesson page breadcrumbs (3-level)

Add a module name map and 3-level BreadcrumbList to `LessonLayout.astro`. Also enrich the title:

```astro
---
const moduleNames: Record<number, string> = {
  0: 'Getting Started',
  1: 'Core Concepts',
  2: 'Advanced Applications',
};
const moduleName = moduleNames[module] ?? `Module ${module}`;
const moduleUrl = `https://cc4.marketing/modules/${module}/`;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://cc4.marketing/" },
    { "@type": "ListItem", "position": 2, "name": `Module ${module}: ${moduleName}`, "item": moduleUrl },
    { "@type": "ListItem", "position": 3, "name": title, "item": Astro.url.href },
  ]
};
---

<!-- Enrich the title to include module context -->
<BaseLayout title={`Module ${module}: ${title}`} description={description} type="article" showCourseSchema={false} showBreadcrumb={false}>
  <!-- Inject breadcrumb in body — BaseLayout has no named head slot -->
  <script type="application/ld+json" set:html={JSON.stringify(breadcrumbSchema)} />
  ...
</BaseLayout>
```

> **Note:** `slot="head"` on the BaseLayout script tag was attempted and rejected — BaseLayout has no named `head` slot. Injecting JSON-LD in `<body>` is fully valid; Google parses all `<script type="application/ld+json">` tags regardless of placement.

### Fix 5: Per-author anchor URLs

```typescript
// src/pages/blog/[slug].astro
const authorSlug = authorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const authorUrl = authorName === 'CC4.Marketing Team'
  ? 'https://cc4.marketing/blog/authors/'
  : `https://cc4.marketing/blog/authors/#${authorSlug}`;
```

Use `authorUrl` in both the `author` JSON-LD field and the byline `<a href>`.

### Additional fixes

**llms.txt / llms-full.txt** — add all newly published posts to the Published Posts section after every `/ship`. The `/publish-post` skill does not update these files automatically.

**robots.txt** — add missing AI crawlers:
```
User-agent: Google-Extended
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: Bytespider
Allow: /

User-agent: cohere-ai
Allow: /
```

**Sitemap `lastmod`** — add to `astro.config.mjs` `serialize()` function before priority branches:
```javascript
item.lastmod = new Date().toISOString();
```

**Homepage description** — trim to ≤160 chars (Google truncates at 155-160):
```
"Master AI-powered marketing with Claude Code. 17 free lessons — campaign briefs, copy generation, competitive analysis, SEO automation. No coding required."
```
(159 chars)

## Prevention

### When publishing new blog posts

1. After inserting the post in D1, **always verify** `featured_image` is set:
   ```bash
   npx wrangler d1 execute cc4-emdash --remote --command "SELECT slug, featured_image FROM ec_posts WHERE slug='<slug>';"
   ```
2. Create the 1200×630 cover PNG and run the D1 UPDATE even if the OG engine handles the social card — the blog index grid reads `featured_image.src`.
3. Add the new post URL to both `public/llms.txt` and `public/llms-full.txt`.

### Schema validation checklist for new layouts

- Publisher logo: use `apple-touch-icon.png` (180×180) — never `og-image.png`
- BreadcrumbList: always emit as a standalone top-level `<script>` tag, never only as a nested property
- Lesson pages: 3-level breadcrumb (Home → Module N → Lesson title) + module-enriched `<title>`
- Named authors: derive `#anchor` URL from `authorName` slug — don't hardcode `/blog/authors/`

### macOS image manipulation without PIL

When `uv pip install Pillow` fails (Python version mismatches), use `sips`:

```bash
# Resize width, preserve aspect ratio
sips --resampleWidth 1200 source.png --out output.png

# Crop to exact dimensions (crops from center by default)
sips --cropToHeightWidth 630 1200 source.png --out output.png

# Two-step resize then crop
sips --resampleWidth 1200 source.png --out /tmp/tmp.png && sips --cropToHeightWidth 630 1200 /tmp/tmp.png --out final.png
```

## Related documentation

- [`comprehensive-seo-aeo-audit-fixes.md`](./comprehensive-seo-aeo-audit-fixes.md) — the April 15 round (Course schema duplication, trailing slashes, blog title suffix, per-post keywords)
- [`emdash-d1-blog-post-publishing-workflow.md`](../integration-issues/emdash-d1-blog-post-publishing-workflow.md) — full D1 publishing workflow; `featured_image` column format documented there
- `.claude/skills/seo-audit/SKILL.md` — the audit skill used to discover these issues
- `.claude/skills/publish-post/SKILL.md` — update this skill to auto-update llms.txt and verify featured_image after insert
