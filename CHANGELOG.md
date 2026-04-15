# Changelog

All notable changes to the [CC4.Marketing website](https://cc4.marketing) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For changes to the interactive course content, see the [course repo](https://github.com/cc4-marketing/cc4.marketing/releases).

## [Unreleased]

### Removed

- `generate_cover.py` and `generate_cover_anthropic_growth.py` Python scripts — replaced by the OG engine. For bespoke covers, set `featured_image` on the Emdash post record instead.

### Added

- New blog post by Alice Marketer: ["AI Works Best When It Looks at What You've Already Shipped"](https://cc4.marketing/blog/ai-workflows-not-automation/) — on extracting real workflows from shipped work instead of inventing new frameworks
- Typographic OG image engine for every page — homepage, blog index, changelog, authors, download, brand guide, and 17 module lessons each get a distinct, brand-compliant social share card (cream/rust/plum/mustard palette, Righteous display, hard shadows)
- Dynamic OG endpoint for blog posts at `/og/blog/{slug}-{hash}.png` — runtime-rendered via `workers-og` (Satori + resvg-wasm), R2-cached, content-hashed URLs for automatic cache invalidation when a post is edited
- Per-post author avatar + excerpt on blog OG cards — blog template now renders the author's circular avatar (loaded from R2) alongside the excerpt subtitle. Posts pick up their author via the `author` frontmatter field (matches a byline slug in `_emdash_bylines`); all 3 existing posts now attributed to Tri Vo with avatar.
- Dev-only `/og-preview` UI for iterating on templates with live PNG preview and mock Facebook/Twitter/LinkedIn cards
- Dev-only `/og/debug?slug=...` endpoint for post-mortem debugging of stale cached covers
- PNG tEXt metadata on build-time covers — embed engine version, generation timestamp, and generator tag for forensic debugging of which deploy rendered a given image
- `/publish-post` skill for end-to-end blog post publishing — converts markdown to PortableText, validates cover images, inserts into Emdash D1, updates sitemap, and ships to production
- Automatic changelog entries in `/ship` for `feat:` and `fix:` commits — appends to `[Unreleased]` in CHANGELOG.md in the same commit, with KV sync deferred to `/release`
- `/hellobar` skill for toggling the site announcement bar on/off and creating new announcements with custom text, links, and cooldown
- Hello bar updated to promote the Anthropic growth marketing case study blog post

### Fixed

- Course schema no longer duplicated on lesson, download, brand guide, and changelog pages — now only on homepage
- Broken 1-item breadcrumbs removed from lesson and secondary pages
- Blog post title tags shortened (`| CC4M` suffix for articles vs full site name) to stay under 60 chars
- Blog post meta descriptions trimmed to 150-160 char target
- Per-post meta keywords generated from title instead of identical hardcoded set
- Internal blog links now include trailing slashes (eliminates unnecessary 301 redirects)
- Schema URLs use trailing slashes consistently across all JSON-LD blocks
- WebSite publisher schema now includes logo (consistent with BlogPosting publisher)
- Course schema enriched with `offers` (free) and `image` for Google rich result eligibility
- Orphaned font preconnect hints removed from layout (no Google Fonts loaded)
- `llms.txt` and `llms-full.txt` updated with all 3 individual blog post URLs and descriptions
- Blog index meta description expanded with CTA and CollectionPage URL trailing slash fixed
- Homepage title and meta description expanded for better SERP coverage

## [0.3.0] - 2026-04-08

### Added

- Blog section at `/blog` powered by Emdash CMS on Cloudflare D1
- Blog post detail pages with PortableText rendering, prev/next navigation, and newsletter CTA
- Author page at `/blog/authors` with team bios and social links
- Custom OG image for blog pages (`og-blog.png`, 1200x630)
- Cover illustrations for each blog post
- BlogPosting, CollectionPage, and AboutPage schema.org structured data
- Breadcrumb schema for all blog pages
- Blog section added to `llms.txt` and `llms-full.txt` for AI discovery
- Two launch posts: "Claude Code for Marketing: A Complete 2026 Guide" and "How to Write a Campaign Brief with AI in 10 Minutes"

### Changed

- Upgraded Astro 5 to Astro 6 with `@astrojs/cloudflare` adapter (server mode)
- Migrated email subscribe API from custom `worker.js` to Astro API route
- Migrated feedback API to use `cloudflare:workers` env access
- Navigation now includes Blog link between Modules and Changelog
- Sitemap updated with blog routes at priority 0.9
- `wrangler.jsonc` updated with D1 database and R2 bucket bindings
- Content config updated for Astro 6 (zod import from `astro/zod`)

## [0.2.0] - 2026-03-17

### Added

- Changelog system powered by [BearlyChange](https://github.com/blacklogos/bearlychange) on Cloudflare Workers + KV
- Dedicated `/changelog` page with timeline view, version grouping, type filters, and search
- "What's New" section on homepage showing latest 3 updates
- Contextual update banners on lesson pages for module-relevant changes
- `/whats-new` Claude Code skill for students to check updates in the terminal
- `llms.txt` and `llms-full.txt` for AI agent discovery
- `CHANGELOG.md` following Keep a Changelog convention
- Auto-changelog GitHub Actions workflow from conventional commits
- RSS and JSON Feed endpoints for changelog subscriptions
- Professional README for public GitHub release

### Changed

- Navigation now includes Changelog link
- Sitemap includes changelog page with weekly frequency
- robots.txt updated with LLMs-txt directive
- Changelog API returns richer metadata (site_url, feed_urls, llms_txt)

### Fixed

- Lesson counts corrected to 17 across JSON-LD, homepage, and Module 0 card
- Ko-fi links normalized to single vanity URL
- SEO title duplication in BaseLayout template
- Quickstart install steps updated to match Substack subscribe flow

### Removed

- changelog-server submodule reference that broke Cloudflare Pages builds
- Wrangler state files from git tracking

## [0.1.0] - 2025-11-25

Initial public release of the CC4.Marketing website.

### Added

- Course website with 17 interactive lessons across 3 modules
  - Module 0: Getting Started (4 lessons)
  - Module 1: Core Concepts (7 lessons)
  - Module 2: Advanced Applications (6 lessons)
- Retro-futuristic design system (Righteous/Outfit fonts, brutalist card styling)
- Dark mode with full theme support
- Quickstart video embed with 4-step installation guide
- Email subscription via Substack at `/download`
- PayPal and Ko-fi donation integration
- GitHub-based feedback system on lesson pages
- Brand guidelines page at `/brand-guide`
- Centralized site configuration in `siteData.ts`
- Comprehensive SEO: meta tags, Open Graph, Twitter Cards, JSON-LD structured data
- Sitemap with page-specific priorities
- AI-friendly robots.txt (GPTBot, Claude-Web, PerplexityBot)
- Beam Analytics integration
- GitHub Pages deployment via GitHub Actions
- Cloudflare DNS/CDN configuration

[unreleased]: https://github.com/cc4-marketing/site/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/cc4-marketing/site/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/cc4-marketing/site/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/cc4-marketing/site/releases/tag/v0.1.0
