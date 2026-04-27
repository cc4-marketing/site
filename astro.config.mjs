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

// All module lesson URLs (SSR, not auto-discovered by sitemap plugin)
const modulePages = [
  '/modules/0/introduction/',
  '/modules/0/installation/',
  '/modules/0/start-clone/',
  '/modules/0/github-pr-guide/',
  '/modules/1/welcome/',
  '/modules/1/working-with-files/',
  '/modules/1/first-tasks/',
  '/modules/1/agents/',
  '/modules/1/custom-agents/',
  '/modules/1/project-memory/',
  '/modules/1/navigation/',
  '/modules/2/campaign-brief/',
  '/modules/2/content-strategy/',
  '/modules/2/marketing-copy/',
  '/modules/2/analytics/',
  '/modules/2/competitive-analysis/',
  '/modules/2/seo-optimization/',
].map((p) => `https://cc4.marketing${p}`);

// Known blog post URLs (SSR from Emdash CMS)
const blogPages = [
  '/blog/claude-code-for-marketing-guide-2026/',
  '/blog/write-campaign-brief-with-ai/',
  '/blog/anthropic-growth-marketing-claude-code/',
  '/blog/ai-workflows-not-automation/',
  '/blog/the-last-mile-of-shipping/',
  '/blog/castmd-vibe-coding-chrome-extension/',
].map((p) => `https://cc4.marketing${p}`);

// https://astro.build/config
export default defineConfig({
  site: 'https://cc4.marketing',
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    react(),
    mdx(),
    sitemap({
      customPages: [...modulePages, ...blogPages],
      // Exclude dev-only routes from the sitemap. These are gated behind
      // import.meta.env.DEV (404 in production) and Disallowed in robots.txt;
      // including them in the sitemap sends a contradictory signal to crawlers.
      filter: (page) =>
        !page.includes('/og-preview') &&
        !page.includes('/og/preview') &&
        !page.includes('/og/debug'),
      serialize(item) {
        const url = item.url;
        item.lastmod = new Date().toISOString();

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
        // Changelog
        else if (url.includes('/changelog')) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
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
