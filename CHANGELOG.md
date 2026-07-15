# Changelog

All notable changes to the [CC4.Marketing website](https://cc4.marketing) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For changes to the interactive course content, see the [course repo](https://github.com/cc4-marketing/cc4.marketing/releases).

## [Unreleased]

### Changed

- Mobile performance: fonts are self-hosted with preload instead of chained through fonts.googleapis.com, removing ~850ms of render-blocking. The quickstart video iframe lazy-loads.

### Fixed

- Reverted page prerendering from the performance overhaul: with Emdash middleware on Cloudflare Workers, prerendered routes fail the setup DB check at runtime and every page redirected to `/_emdash/admin/setup`. All pages are SSR again (see docs/solutions/integration-issues/emdash-astro6-cloudflare-workers-setup.md).
- robots.txt no longer contains the invalid `LLMs-txt` directive or the non-standard `Crawl-delay`/`Host` lines that Search Console flagged as errors and warnings.
- Sitemap URL for the Threadmark announcement post now uses the canonical trailing-slash form, resolving duplicate-canonical indexing errors.
- Sitemap no longer stamps every URL with the build time as `lastmod`; entries omit `lastmod` instead of reporting a fake change on each deploy.
- Page URLs without a trailing slash now 301-redirect to the canonical trailing-slash form instead of serving duplicate content.

## [0.5.0] - 2026-07-14

### Added

- New lesson — Module 2.7: Service Package from a Real Engagement. Teaches the mine → decide → blueprint → derive practice for turning a completed client engagement into a service blueprint, case study, and marketing kit, with copy-paste prompts and quality gates. Capstone reordered after it; module 2 is now 7 lessons.
- Blog post by Alice Marketer introducing the lesson, including the full packaging prompt as a copyable code block (`/blog/service-package-from-real-engagement`).
- New blog cover `cover-service-package-lesson` (SVG + PNG) in house editorial style.
- HelloBar updated to promote Module 2.7.
- Newsletter broadcast template for the Module 2.7 announcement in `emails/`, with an editorial-illustration cover (`cover-service-package-newsletter`) served from `/blog/`.

### Changed

- Service-package blog post revised for SEO/AEO: 56-char title, 144-char excerpt, question-form H2s, bullet lists, and 4 internal links (lesson page, campaign-brief lesson, modules hub).
- Course repo release v1.3.0 cut so the downloadable zip includes `/start-2-7`.

### Fixed

- Service-package blog post was missing from the sitemap (`astro.config.mjs` blogPages), `llms.txt`, and `llms-full.txt` — added to all three.
- `package.json` version reconciled to the shipped v0.4.0 tag; changelog footer compare links repaired (missing `[0.4.0]` entry).

## [0.4.0] - 2026-05-17

### Removed

- `generate_cover.py` and `generate_cover_anthropic_growth.py` Python scripts — replaced by the OG engine. For bespoke covers, set `featured_image` on the Emdash post record instead.

### Added

- Personal author homepages — each author page now reads like a personal homepage: a long-form first-person intro, a "What I'm working on now" block with a live rust dot, a "Tools I use daily" list, and a "Topics I write about" chip row. Hidden when missing so adding a new author with no Now block doesn't show empty state.
- Per-author prompt library — every author page ships with 3-4 ready-to-copy prompts: two templated ("Write in their voice", "Find their posts on a topic") interpolated with the author's name/role/topics, plus 0-2 author-written custom prompts. Each prompt has a Copy button.
- Single source of truth for author data at `src/data/authors.ts`. Adding a new author is one file edit.
- Author profile pages at `/blog/authors/{slug}` — individual author pages with bio, avatar, social links, AI discovery prompt, and filtered list of their published articles. Each author card on the hub page links to their profile.
- Responsive author grid on `/blog/authors` — converted from single-column to 2-3 column grid layout on desktop, 1 column on mobile. Author cards are now clickable with hover animations.
- HelloBar now accounts for its own height with `margin-bottom` when visible, preventing overlap with the navigation menu on all pages.
- Release Highlight Box for blog posts — minimal, prominent callout for product releases with version, download link, landing page, and source code reference. Styled with rust-colored accent and tinted background, added to Threadmark release post.
- Sticky Table of Contents for blog posts — auto-generated from H2 headings with smooth scroll navigation and active section highlighting. Desktop: right sidebar with sticky positioning. Mobile: collapsible drawer that slides in from left. Works with all existing posts automatically.
- FAQPage and HowTo structured data on eligible blog posts — the marketing guide gets a FAQPage schema and the campaign brief post gets a HowTo schema with 5 steps, enabling Google rich results for both
- Expanded meta descriptions on all 17 course lessons (from 63–101 chars to 148–160 chars) for improved SERP snippet quality
- Question-form H2 headings in key lessons (Introduction, Agents, Campaign Brief, SEO) for featured snippet targeting

- New blog post by Tri Vo: ["castmd: Vibe Coding a Chrome Extension for LLMs"](https://cc4.marketing/blog/castmd-vibe-coding-chrome-extension/) — on rebuilding a forgotten Chrome extension into a focused LLM input tool using vibe coding with Claude Code
- New blog post by Tri Vo: ["The Last Mile of Shipping Is the Hardest Part"](https://cc4.marketing/blog/the-last-mile-of-shipping/) — on turning manual release steps into a system of slash commands
- New blog post by Alice Marketer: ["AI Works Best When It Looks at What You've Already Shipped"](https://cc4.marketing/blog/ai-workflows-not-automation/) — on extracting real workflows from shipped work instead of inventing new frameworks
- New blog post by Alice Marketer: ["Introducing Threadmark: The Tool That Brings Threads Into Your AI Workflow"](https://cc4.marketing/blog/introducing-threadmark/) — on a Chrome extension that converts Threads posts to clean Markdown for AI workflows
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

- **Module 3 capstone — "Ship a Real Follow-Up with sigil"** — new 75-minute hands-on lesson at `/modules/3/ship-with-sigil/` that bridges Modules 0–2 into a real, shippable artifact: a personalized post-event follow-up campaign powered by [sigil](https://github.com/blacklogos/sigil), an open-source MIT CLI inside Claude Code. Real send pipeline on Cloudflare Workers, custom `/email-rewrite` slash command, per-recipient handcrafted sentences. Course now: 4 modules / 18 lessons.
- **Lesson navigation sidebar + `/modules/` hub** — sticky desktop sidebar inside every lesson shows all modules + lessons with current highlighted and a progress bar. Mobile collapses to an off-canvas drawer triggered by a floating button. New `/modules/` hub page lists every module + lesson with descriptions and durations (previously 404'd).
- **Google Analytics 4** — gtag.js added alongside the existing Beam analytics in `<head>`. Two analytics signals run in parallel for cross-checking.

### Changed

- Hello bar + lesson promo banner now point at the Module 3 capstone (was: ClaudeKit Marketing v1.3.0 and Introducing Threadmark). Storage keys bumped so previously-dismissed visitors see the fresh content.

### Fixed

- Author byline on blog post pages now links directly to the personal author page (`/blog/authors/{slug}/`) instead of the hub-with-anchor (`/blog/authors/#{slug}`). JSON-LD `Person.author.url` updated to match for consistent SEO canonicalization.

- Blog post table of contents anchor links now scroll to correct sections — H2 headings rendered by PortableText now have proper id attributes for anchor navigation. Fixes smooth scroll navigation and active section highlighting in TOC.
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

[unreleased]: https://github.com/cc4-marketing/site/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/cc4-marketing/site/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/cc4-marketing/site/compare/v0.2.0...v0.4.0
[0.3.0]: https://github.com/cc4-marketing/site/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/cc4-marketing/site/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/cc4-marketing/site/releases/tag/v0.1.0
