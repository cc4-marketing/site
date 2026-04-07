---
title: "Emdash CMS + Astro 6 + Cloudflare Workers: complete integration guide and pitfalls"
category: integration-issues
date: 2026-04-08
tags:
  - emdash
  - astro-6
  - cloudflare-workers
  - cloudflare-d1
  - cloudflare-r2
  - ssr
  - prerender
  - object-object
  - setup-redirect
  - nodejs-compat
  - trailing-slash
severity: critical
component: astro.config.mjs, wrangler.jsonc, src/pages, src/live.config.ts
---

## Problem

Integrating Emdash CMS into an Astro 5 site deployed on Cloudflare Workers required upgrading to Astro 6, switching from static output to server mode, and configuring D1/R2 bindings. This triggered a cascade of 5 distinct issues:

1. **`[object Object]` on all SSR pages** in production
2. **Setup redirect loop** — all pages redirected to `/_emdash/admin/setup` even after completing setup
3. **404 page redirecting to setup** via asset handler loop
4. **Emdash `getEmDashCollection()` returning empty** — missing `live.config.ts`
5. **Prerendered pages broken** — Emdash middleware intercepting static asset routes

## Root Causes

### Issue 1: `[object Object]` on SSR pages

**Cause:** The `nodejs_compat` compatibility flag in `wrangler.jsonc` exposes the native `process` v2 object in Cloudflare Workers. Astro's SSR pipeline detects `process` and assumes it's running in Node.js, returning async iterables instead of readable streams. The Workers runtime then calls `.toString()` on the Response, producing `[object Object]`.

**Reference:** [withastro/astro#14511](https://github.com/withastro/astro/issues/14511), [withastro/astro#15434](https://github.com/withastro/astro/issues/15434)

### Issue 2: Setup redirect on public routes

**Cause:** Emdash's middleware runs on every request (including public routes). For non-admin routes without an active session, it does a lightweight DB check via `getDb()` to verify the site is set up. When pages are prerendered (`export const prerender = true`), the Cloudflare adapter serves them as static files through the `ASSETS` binding — but the worker middleware still intercepts the request first. The `getDb()` call in the middleware's setup check fails silently on prerendered route code paths because the D1 dialect virtual module isn't properly initialized in that context. The catch-all error handler then redirects to `/_emdash/admin/setup`.

### Issue 3: 404 page setup redirect loop

**Cause:** Setting `not_found_handling: "404-page"` in `wrangler.jsonc` caused Cloudflare's asset handler to re-fetch `/404/` through the worker when any page returned a 404 status. This second request hit the Emdash middleware, which ran the setup check on `/404/` and redirected to setup.

### Issue 4: Empty `getEmDashCollection()` results

**Cause:** Emdash uses Astro's Live Collections API. The `_emdash` collection must be registered in `src/live.config.ts`. Without this file, `getLiveCollection("_emdash")` returns an empty result set, and `getEmDashCollection("posts")` returns no entries even when posts exist in the D1 database.

### Issue 5: Prerendered pages broken with Emdash

**Cause:** With `output: 'server'` in Astro config, the Cloudflare adapter processes ALL requests through the worker — including requests for prerendered static HTML files. The Emdash middleware chain runs before the asset handler can serve the static file. Since Emdash's setup-check middleware uses `getDb()` which can fail on non-runtime-initialized code paths, prerendered pages get incorrectly redirected to setup.

## Solution

### Fix 1: Add `disable_nodejs_process_v2` compatibility flag

```jsonc
// wrangler.jsonc
{
  "compatibility_flags": ["nodejs_compat", "disable_nodejs_process_v2"]
}
```

Alternatively, using a recent `compatibility_date` (>= `2026-02-24`) also fixes this.

### Fix 2: Convert ALL pages to SSR (remove prerender)

Remove `export const prerender = true` from every page. This ensures all routes go through Astro's SSR pipeline where the Emdash runtime is properly initialized via the middleware chain.

For pages that used Node.js APIs (like `fs.readFileSync`), replace with Vite-compatible imports:

```diff
- import fs from 'fs';
- const content = fs.readFileSync('./docs/file.md', 'utf-8');
+ const content = await import('../docs/file.md?raw').then(m => m.default);
```

For dynamic routes that used `getStaticPaths()`, convert to SSR-style parameter handling:

```diff
- export const prerender = true;
- export async function getStaticPaths() { ... }
- const { entry } = Astro.props;

+ const { slug } = Astro.params;
+ const entries = await getCollection('modules');
+ const entry = entries.find(e => generateSlug(e) === slug);
+ if (!entry) return Astro.redirect('/404');
```

### Fix 3: Do NOT set `not_found_handling` in wrangler.jsonc

```jsonc
// wrangler.jsonc — keep assets config minimal
{
  "assets": {
    "directory": "./dist/client"
  }
}
```

Astro handles 404s through its own SSR pipeline. Adding `not_found_handling: "404-page"` creates a re-entry loop through the worker.

### Fix 4: Create `src/live.config.ts`

```typescript
// src/live.config.ts
import { defineLiveCollection } from "astro:content";
import { emdashLoader } from "emdash/runtime";

export const collections = {
  _emdash: defineLiveCollection({ loader: emdashLoader() }),
};
```

This registers the `_emdash` live collection that Emdash's query functions (`getEmDashCollection`, `getEmDashEntry`) rely on.

### Fix 5: Use `output: 'server'` in Astro config

```javascript
// astro.config.mjs
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    react(), // Required by Emdash admin UI
    mdx(),
    sitemap(),
    emdash({
      database: d1({ binding: 'DB' }),
      storage: r2({ binding: 'MEDIA' }),
    }),
  ],
});
```

### Fix 6: Add trailing slashes to all internal links

With all pages as SSR, there are no trailing-slash 307 redirects from the asset handler. But for consistency and to avoid any edge cases, ensure all internal `href` values use trailing slashes for page routes:

```diff
- href="/changelog"
+ href="/changelog/"
- href="/modules/0/introduction"
+ href="/modules/0/introduction/"
```

## Complete wrangler.jsonc

```jsonc
{
  "name": "cc4-mkt",
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_date": "2026-03-14",
  "compatibility_flags": ["nodejs_compat", "disable_nodejs_process_v2"],
  "assets": {
    "directory": "./dist/client"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "cc4-emdash",
      "database_id": "YOUR_D1_DATABASE_ID"
    }
  ],
  "r2_buckets": [
    {
      "binding": "MEDIA",
      "bucket_name": "cc4-media"
    }
  ]
}
```

## Required packages

```
astro@^6.0.0
@astrojs/cloudflare@^13.0.0
@astrojs/react@^5.0.0
@astrojs/mdx@^5.0.0
@astrojs/sitemap@^3.7.0
emdash@^0.1.0
@emdash-cms/cloudflare@^0.1.0
@tanstack/react-query@^5.0.0
@tanstack/react-router@^1.100.0
react@^19.0.0
react-dom@^19.0.0
```

## Astro 5 → 6 migration checklist

- [ ] Change `z` import: `import { z } from 'astro/zod'` (not `astro:content`)
- [ ] Replace `entry.render()` with `render(entry)` from `astro:content`
- [ ] Ensure `getStaticPaths()` params are strings, not numbers
- [ ] Replace `Astro.locals.runtime.env` with `import { env } from 'cloudflare:workers'`
- [ ] Add `adapter: cloudflare()` to astro config
- [ ] Update wrangler.jsonc `main` to `@astrojs/cloudflare/entrypoints/server`
- [ ] Remove custom `src/worker.js` (adapter handles routing)
- [ ] Node.js 22+ required

## Production deployment checklist

1. Create D1 database: `npx wrangler d1 create <name>`
2. Enable R2 in Cloudflare Dashboard, then: `npx wrangler r2 bucket create <name>`
3. Update `database_id` in `wrangler.jsonc`
4. Set secrets: `npx wrangler secret put RESEND_API_KEY` etc.
5. Deploy: `npx wrangler deploy`
6. Visit `/_emdash/admin/setup` to initialize the CMS
7. Create "posts" collection in admin
8. Seed content or create posts via admin UI

## Prevention

- **Always test SSR pages in `wrangler preview`** before deploying — `astro dev` uses Node.js runtime which masks Workers-specific issues
- **Never use `not_found_handling` or `html_handling`** in wrangler.jsonc with Astro + Emdash — let Astro handle routing
- **Never mix prerender and Emdash middleware** — if using Emdash, make all pages SSR
- **Always include `disable_nodejs_process_v2`** when using `nodejs_compat` with Astro 6
- **Create `src/live.config.ts`** immediately when adding Emdash — it's not documented prominently but is required for content queries
- **Add trailing slashes to all internal links** when deploying to Cloudflare Workers with static assets

## Related

- [Cloudflare Workers project with static assets needs Worker entry point for API routes](./cloudflare-workers-assets-with-api-routes.md)
- [Cloudflare Pages Resend email setup](./cloudflare-pages-resend-email-setup.md)
- [withastro/astro#14511 — Cloudflare adapter returning [object Object]](https://github.com/withastro/astro/issues/14511)
- [withastro/astro#15434 — Astro v6 + Cloudflare + middleware + nodejs_compat](https://github.com/withastro/astro/issues/15434)
- [Emdash CMS GitHub](https://github.com/emdash-cms/emdash)
