// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import emdash from 'emdash/astro';
import { d1, r2 } from '@emdash-cms/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://cc4.marketing',
  adapter: cloudflare(),
  integrations: [
    react(),
    mdx(),
    sitemap({
      serialize(item) {
        const url = item.url;

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
});
