// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import emdash from 'emdash/astro';
import { d1, r2 } from '@emdash-cms/cloudflare';
import fs from 'node:fs';

/** Loads .ttf/.woff files as Uint8Array modules so Satori can consume them at runtime on Workers. */
function rawFonts(exts) {
  return {
    name: 'vite-plugin-raw-fonts',
    enforce: 'pre',
    transform(_code, id) {
      if (exts.some((ext) => id.endsWith(ext))) {
        const buffer = fs.readFileSync(id);
        return {
          code: `export default new Uint8Array([${buffer.join(',')}])`,
          map: null,
        };
      }
    },
  };
}

const SITE_URL = 'https://cc4.marketing';

// Auto-derive lesson URLs from src/content/modules/module-N/<L>.<n>-<slug>.mdx.
// Reading at config-load means new lessons (and new modules) appear in the
// sitemap with zero extra config. Pattern matches the [...slug].astro
// route's slug derivation: `${module}/${tail-after-the-first-dash-segment}`.
function deriveModuleLessonUrls() {
  const ROOT = './src/content/modules';
  const urls = [];
  for (const dir of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!dir.isDirectory() || !dir.name.startsWith('module-')) continue;
    const num = dir.name.replace(/^module-/, '');
    for (const file of fs.readdirSync(`${ROOT}/${dir.name}`)) {
      if (!file.endsWith('.mdx')) continue;
      const tail = file.replace(/\.mdx$/, '').split('-').slice(1).join('-');
      urls.push(`${SITE_URL}/modules/${num}/${tail}/`);
    }
  }
  return urls.sort();
}

// Auto-derive /blog/authors/<slug>/ URLs from src/data/authors.ts. The data
// file lists each author with a top-level `name: '...'` indented at four
// spaces; nested tools/links use deeper indentation and are filtered out.
// Slug derivation matches slugifyAuthorName() in src/data/authors.ts.
function deriveAuthorUrls() {
  const text = fs.readFileSync('./src/data/authors.ts', 'utf8');
  const matches = [...text.matchAll(/^ {4}name:\s*'([^']+)',\s*$/gm)];
  return matches
    .map((m) => m[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .map((slug) => `${SITE_URL}/blog/authors/${slug}/`)
    .sort();
}

// Auto-derive Marketing Library URLs from src/content/library/{category}/*.mdx.
// Mirrors deriveModuleLessonUrls(): reading at config-load means new categories
// and entries appear in the sitemap with zero extra config. URLs are driven off
// the folder (category) + filename (entry slug), matching the route pattern
// /library/{category}/{fileslug}/.
function deriveLibraryUrls() {
  const ROOT = './src/content/library';
  const urls = new Set([`${SITE_URL}/library/`]);
  if (!fs.existsSync(ROOT)) return [...urls];
  for (const dir of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const category = dir.name;
    urls.add(`${SITE_URL}/library/${category}/`);
    for (const file of fs.readdirSync(`${ROOT}/${category}`)) {
      if (!file.endsWith('.mdx')) continue;
      const fileslug = file.replace(/\.mdx$/, '');
      urls.add(`${SITE_URL}/library/${category}/${fileslug}/`);
    }
  }
  return [...urls].sort();
}

// Library entries carry a real `updatedAt` in frontmatter; collect them into a
// URL->date map so the sitemap can emit an honest <lastmod> (not a build-time
// stamp, which would tell Google every page changed on every deploy).
function deriveLibraryLastmod() {
  const ROOT = './src/content/library';
  const map = new Map();
  if (!fs.existsSync(ROOT)) return map;
  for (const dir of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const file of fs.readdirSync(`${ROOT}/${dir.name}`)) {
      if (!file.endsWith('.mdx')) continue;
      const fm = fs.readFileSync(`${ROOT}/${dir.name}/${file}`, 'utf8');
      const m = fm.match(/^updatedAt:\s*'?(\d{4}-\d{2}-\d{2})'?/m);
      if (!m) continue;
      map.set(`${SITE_URL}/library/${dir.name}/${file.replace(/\.mdx$/, '')}/`, m[1]);
    }
  }
  return map;
}

const modulePages = deriveModuleLessonUrls();
const authorPages = deriveAuthorUrls();
const libraryPages = deriveLibraryUrls();
const modulesHub = `${SITE_URL}/modules/`;

// Blog posts live in the Emdash D1 CMS, which is not queryable from this
// node/Vite config context. `scripts/generate-blog-sitemap-data.mjs` (run in
// prebuild) syncs published posts + lastmod from D1 into this JSON, so the
// sitemap stays current with zero manual upkeep. Fall back to empty if the file
// is missing (e.g. `astro check`/dev before a sync) so config load never throws.
let blogSitemapData = [];
try {
  blogSitemapData = JSON.parse(fs.readFileSync('./src/data/blog-sitemap-data.json', 'utf8'));
} catch {
  console.warn('[sitemap] blog-sitemap-data.json missing — run `npm run sync:blog-sitemap`. Blog URLs omitted this build.');
}
const blogPages = blogSitemapData.map(({ slug }) => `${SITE_URL}/blog/${slug}/`);

// URL -> real lastmod date, combining library frontmatter (updatedAt) with the
// D1-sourced blog dates. Date-less URLs (module lessons, hubs, author pages) are
// intentionally absent so they emit no <lastmod> rather than a fabricated one.
const lastmodByUrl = deriveLibraryLastmod();
for (const { slug, lastmod } of blogSitemapData) {
  if (lastmod) lastmodByUrl.set(`${SITE_URL}/blog/${slug}/`, lastmod);
}

// https://astro.build/config
export default defineConfig({
  site: 'https://cc4.marketing',
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    react(),
    mdx(),
    sitemap({
      customPages: [...modulePages, modulesHub, ...authorPages, ...blogPages, ...libraryPages],
      // Exclude dev-only routes from the sitemap. These are gated behind
      // import.meta.env.DEV (404 in production) and Disallowed in robots.txt;
      // including them in the sitemap sends a contradictory signal to crawlers.
      filter: (page) =>
        !page.includes('/og-preview') &&
        !page.includes('/og/preview') &&
        !page.includes('/og/debug') &&
        !page.includes('/library/download/'),
      serialize(item) {
        const url = item.url;
        // Real content lastmod where we have an honest date (library frontmatter,
        // blog D1 dates). Date-less URLs (modules, hubs) stay without lastmod
        // rather than getting a build-time stamp, which would erode trust.
        const lm = lastmodByUrl.get(url);
        if (lm) item.lastmod = new Date(`${lm}T00:00:00.000Z`).toISOString();

        // Homepage - highest priority
        if (url === 'https://cc4.marketing/') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        // Blog posts - high priority (SEO)
        else if (url.includes('/blog')) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        // Download page - high priority (conversion)
        else if (url.includes('/download')) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        // Module 0 - Getting Started (entry point)
        else if (url.includes('/modules/0/')) {
          item.priority = 0.9;
          item.changefreq = 'monthly';
        }
        // Module 1 - Core lessons
        else if (url.includes('/modules/1/')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        }
        // Module 2 - Advanced lessons
        else if (url.includes('/modules/2/')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        }
        // Module 3 - Capstone
        else if (url.includes('/modules/3/')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        }
        // Modules hub
        else if (url === `${SITE_URL}/modules/`) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        }
        // Author detail pages
        else if (url.includes('/blog/authors/')) {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        }
        // Changelog
        else if (url.includes('/changelog')) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        }
        // Marketing Library: hub + category pages 0.8, entry pages 0.7.
        // Depth is the number of path segments after /library/.
        else if (url.includes('/library/')) {
          const rest = url.split('/library/')[1].replace(/\/$/, '');
          const depth = rest === '' ? 0 : rest.split('/').length;
          item.priority = depth >= 2 ? 0.7 : 0.8;
          item.changefreq = 'monthly';
        }
        // Default
        else {
          item.priority = 0.7;
          item.changefreq = 'weekly';
        }

        return item;
      },
    }),
    emdash({
      database: d1({ binding: 'DB' }),
      storage: r2({ binding: 'MEDIA' }),
    }),
  ],
  vite: {
    plugins: [rawFonts(['.ttf', '.woff'])],
    assetsInclude: ['**/*.ttf', '**/*.woff'],
  },
});
