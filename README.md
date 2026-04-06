# CC4.Marketing

The website for **Claude Code for Marketers** — a free, interactive course that teaches AI-powered marketing workflows. Built with [Astro](https://astro.build), deployed on [Cloudflare Workers](https://workers.cloudflare.com).

**Live site:** [cc4.marketing](https://cc4.marketing)

## What is this?

This repo powers the course website at [cc4.marketing](https://cc4.marketing). It serves course documentation, 17 interactive lesson pages, and a live changelog. The actual course is taught inside [Claude Code](https://claude.ai/code) itself — students clone the [course repo](https://github.com/cc4-marketing/cc4.marketing), open Claude Code, and type `/start-0-0` to begin.

## Tech Stack

- **Framework:** [Astro](https://astro.build) 5 (static output)
- **Content:** MDX with Astro Content Collections
- **Styling:** CSS variables, light/dark mode, no CSS framework
- **Changelog:** [BearlyChange](https://github.com/blacklogos/bearlychange) on Cloudflare Workers + KV
- **Hosting:** Cloudflare Workers (static assets + API routes)
- **CI/CD:** GitHub Actions → `wrangler deploy`

## Project Structure

```
src/
├── pages/              # Routes (index, changelog, download, modules)
├── layouts/            # BaseLayout, LessonLayout
├── components/         # Header, Footer, Hero, WhatsNew, ModuleUpdatesBanner, etc.
├── content/modules/    # 17 MDX lesson files across 3 modules
├── config/             # siteData.ts (centralized site config)
└── styles/             # global.css (design system)
changelog-worker/       # Cloudflare Worker for changelog API
public/                 # Static assets, robots.txt, llms.txt
```

## Course Modules

| Module | Title | Lessons | Duration |
|--------|-------|---------|----------|
| 0 | Getting Started | 4 | ~30 min |
| 1 | Core Concepts | 7 | ~3-4 hrs |
| 2 | Advanced Applications | 6 | ~4-5 hrs |

## Development

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:4321`.

### Changelog server (local)

The changelog data is served from a Cloudflare Worker in production. For local development:

```bash
cd changelog-server
npm install
PORT=4399 node server.mjs
```

Update `src/config/siteData.ts` to point `changelog.apiUrl` to `http://localhost:4399` for local testing.

## Build

```bash
npm run build
```

Static output goes to `dist/`. Deployed automatically to Cloudflare Workers via GitHub Actions on push to `main`.

## Changelog

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

See [CHANGELOG.md](CHANGELOG.md) for the full history, or visit the [live changelog](https://cc4.marketing/changelog) with timeline view, filters, and RSS/JSON feeds.

## Contributing

- Open an [issue](https://github.com/cc4-marketing/site/issues) for bugs or suggestions
- Submit a [pull request](https://github.com/cc4-marketing/site/pulls) for changes
- See the [PR guide](https://cc4.marketing/modules/0/github-pr-guide) for contribution workflow

## License

[MIT](LICENSE)
