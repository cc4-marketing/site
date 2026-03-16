# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Changelog system powered by BearlyChange and Cloudflare Workers + KV storage
- Dedicated `/changelog` page with timeline view, version grouping, type filters, and search
- "What's New" section on homepage showing latest 3 updates
- Contextual update banners on lesson pages for module-relevant changes
- `/whats-new` Claude Code skill for students to check updates inside the terminal
- `llms.txt` and `llms-full.txt` for AI agent discovery
- Auto-changelog GitHub Actions workflow that generates entries from conventional commits
- RSS and JSON Feed endpoints for changelog subscriptions

### Changed

- Updated robots.txt with LLMs-txt directive for AI agent discovery
- Enhanced changelog API with richer metadata (site_url, feed_urls, llms_txt)
- Navigation now includes Changelog link
- Sitemap includes changelog page with weekly frequency

## [0.1.0] - 2025-11-25

### Added

- Full course website with 17 interactive lessons across 3 modules
- Module 0: Getting Started (4 lessons — Introduction, Installation, Start & Clone, GitHub PR Guide)
- Module 1: Core Concepts (7 lessons — Markit agency, files, tasks, agents, sub-agents, memory, navigation)
- Module 2: Advanced Applications (6 lessons — briefs, strategy, copy, analytics, competitive analysis, SEO)
- Dark mode with full theme support and high-contrast design
- Quickstart video embed with 4-step installation guide
- Email subscription via Substack integration at `/download`
- PayPal and Ko-fi donation integration
- GitHub-based feedback system on lesson pages
- Brand guidelines page at `/brand-guide`
- Centralized site configuration in `siteData.ts`
- Comprehensive SEO: meta tags, Open Graph, Twitter Cards, JSON-LD structured data
- Sitemap with page-specific priorities (homepage 1.0, download 0.9, modules 0.8)
- AI-friendly robots.txt allowing GPTBot, Claude-Web, PerplexityBot, and other AI crawlers
- Beam Analytics integration
- Cloudflare deployment with wrangler configuration
- GitHub Pages deployment via GitHub Actions
- Retro-futuristic design system with Righteous/Outfit fonts and brutalist card styling

[unreleased]: https://github.com/cc4-marketing/cc4.marketing/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/cc4-marketing/cc4.marketing/releases/tag/v0.1.0
