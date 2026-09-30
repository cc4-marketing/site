// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import emdash from 'emdash/astro';
import { d1, r2 } from '@emdash-cms/cloudflare';
import fs from 'node:fs';
import { lastmodFromMarkdown, sitemapSerializer } from 'site-kick/lib/sitemap.js';

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

const isoDay = (d) => new Date(`${d}T00:00:00.000Z`).toISOString();

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

// Path -> real lastmod date, combining library frontmatter (updatedAt) with the
// D1-sourced blog dates. Date-less URLs (module lessons, hubs, author pages) are
// intentionally absent so they emit no <lastmod> rather than a fabricated one.
// Not a build-time stamp, which would tell Google every page changed on every deploy.
const lastmodByUrl = lastmodFromMarkdown({ 'src/content/library': 'library' });
for (const { slug, lastmod } of blogSitemapData) {
  if (lastmod) lastmodByUrl.set(`/blog/${slug}/`, isoDay(lastmod));
}

// https://astro.build/config
export default defineConfig({
  site: 'https://cc4.marketing',
  output: 'server',
  compressHTML: true,
  adapter: cloudflare(),
  integrations: [
    {
      name: 'cc4-site-policy',
      hooks: {
        'astro:config:setup': ({ addMiddleware }) => {
          addMiddleware({
            entrypoint: new URL('./src/lib/site-middleware.ts', import.meta.url),
            order: 'pre',
          });
        },
      },
    },
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
      // Honest <lastmod> only where a real content date exists (library
      // frontmatter, blog D1 dates); date-less URLs get none. First matching
      // rule sets priority/changefreq.
      serialize: sitemapSerializer({
        lastmod: lastmodByUrl,
        rules: [
          { match: /^\/$/, priority: 1.0, changefreq: 'daily' },
          // Blog posts and author pages (SEO)
          { match: /\/blog/, priority: 0.9, changefreq: 'weekly' },
          // Download page (conversion)
          { match: /\/download/, priority: 0.9, changefreq: 'weekly' },
          // Module 0 is the entry point; modules 1 to 3 are the core course
          { match: /\/modules\/0\//, priority: 0.9, changefreq: 'monthly' },
          { match: /\/modules\/[123]\//, priority: 0.8, changefreq: 'monthly' },
          { match: /^\/modules\/$/, priority: 0.8, changefreq: 'weekly' },
          { match: /\/changelog/, priority: 0.8, changefreq: 'weekly' },
          // Marketing Library: entry pages 0.7, hub + category pages 0.8
          { match: /\/library\/[^/]+\/[^/]+/, priority: 0.7, changefreq: 'monthly' },
          { match: /\/library\//, priority: 0.8, changefreq: 'monthly' },
          { match: /^/, priority: 0.7, changefreq: 'weekly' },
        ],
      }),
    }),
    emdash({
      database: d1({ binding: 'DB' }),
      storage: r2({ binding: 'MEDIA' }),
      migrations: { runtime: 'check', dev: 'auto' },
    }),
  ],
  vite: {
    plugins: [rawFonts(['.ttf', '.woff'])],
    assetsInclude: ['**/*.ttf', '**/*.woff'],
  },
});
