# Changelog

All notable changes to the [CC4.Marketing website](https://cc4.marketing) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For changes to the interactive course content, see the [course repo](https://github.com/cc4-marketing/cc4.marketing/releases).

## [Unreleased]

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
