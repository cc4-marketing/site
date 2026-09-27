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
last_updated: 2026-09-27
---

## 2026-09-27 release candidate

This section supersedes the package and deployment guidance below. The remaining sections document the earlier Astro 6 integration. These changes are local and have not been deployed.

- Runtime: Node 22.22.2, Astro 7.3.5, `@astrojs/cloudflare` 14.3.3, MDX 8.0.2, React integration 7.0.0, EmDash and its Cloudflare adapter 0.41.0, Wrangler 4.141.0.
- Keep server rendering, existing D1/R2 bindings, and `compressHTML: true`. Do not reintroduce prerendering as part of this upgrade.
- `cc4-site-policy` registers `src/lib/site-middleware.ts` before EmDash's pre-middleware. A normal `src/middleware.ts` runs too late for setup/auth responses.
- Route protection must use Astro's normalized `context.url`, not raw `request.url`. Single and repeated percent-encoding otherwise bypass the CMS path check.
- Production uses `migrations.runtime: 'check'`; local development uses `dev: 'auto'`. Never point the development runtime at production D1.

### Migration gate

A read-only production D1 query returned 31 applied migrations, ending at `032_rate_limits`, with `rows_written: 0`. The 0.41.0 build manifest contains 86 migrations through `087_reference_field_relations`: 55 are pending.

The migration-set fingerprint is `0f51713d91c066543531e7ad3b8fceb61d81af03201a1ed2cab1567bfa1ed605`. This is not the CLI's target-approval fingerprint.

`npx emdash migrate --status --wrangler-config wrangler.jsonc` requires both a Cloudflare account ID and an API token. Wrangler's existing OAuth login does not satisfy the EmDash CLI token requirement. Obtain the token through 1Password after signing in; never copy it into config or documentation.

Before an authorized release:

1. Preserve the previous Worker artifact, capture a fresh D1 Time Travel bookmark, and back up R2. A content-only export is not a restorable site backup.
2. Rehearse against an isolated representative database. The local public-content preview is not a full production migration rehearsal.
3. Run the migration status command, review its target and pending work, and obtain explicit approval before `npx emdash migrate --wrangler-config wrangler.jsonc`.
4. Run `npx emdash migrate --check --wrangler-config wrangler.jsonc`, then deploy the same tested artifact. Do not merge first if Cloudflare Builds automatically deploys the branch.
5. Verify published posts, bylines, media, admin authentication, subscriptions, and changelog on production. The separate `changelog-worker` also needs its own approved deployment.

Time Travel bookmark observed during this audit: `000080cf-00000000-000050f3-9500201bcb856104ea810741b97df7bd`. It is time-limited and must be refreshed before release. No restore or production migration was performed.

### Verification and local preview limits

- `npm test`: 76 tests passed. `npm run build`: completed, synchronized 14 published posts and generated 63 OG images. `npm run og:smoke`: 27 images validated. Production dependency audits: zero vulnerabilities in both packages.
- Built Worker on local D1: Alice's four published articles return 200, show the AI disclosure, and omit an AI `Person` author. Her profile remains `index, follow`.
- The preview copied published posts and public credits only, not credentials, revisions, or all media. Post-migration imports must follow migration 040's `translation_group = id` byline backfill; omitting it hides credits. This preview proves rendering, not full database migration integrity.
- Subscription smoke returned `403, 415, 400, 400, 400, 429` for foreign origin, wrong media type, three requests without an email, and the fourth rate-limited request. No email was sent.
- Removed feedback endpoint returns 404. Encoded unsafe CMS redirects return 302 to the canonical login URL with `noindex, nofollow`.
- Changelog initial HTML contains 32 entries; browser filtering gives 6 course entries, zero for an unmatched query, and 32 after clearing. No duplicate browser feed request occurs.
- Local changelog Worker: a cross-origin form persisted a KV entry before the fix; afterward foreign/null/originless forms and foreign JSON return 403 without changing KV. Same-origin forms and authenticated originless JSON still work.

### External follow-through

- GSC's observed Soft 404 sample is `/changelog`, not `/modules`. After deployment, inspect the rendered canonical `/changelog/` and start validation. The four HTTP/non-slash redirect samples are intentional canonical redirects.
- The main sitemap and eight submitted product sitemaps already report Success. Do not claim validation or indexing has completed before a new GSC result.
- `wrangler secret list --name cc4-mkt` returned only the two Resend secret names. This does not prove that an old GitHub token was revoked; identify it before requesting revocation.
- Both root and `mail.cc4.marketing` publish explicit DMARC monitoring policies. Changing only the root policy does not enforce the newsletter subdomain. Review aggregate alignment evidence before proposing enforcement.

### DMARC evidence, read-only

The Gmail search for domain-specific reports received after 2026-08-27 returned 30 messages and 30 ZIP/gzip aggregate attachments, with no pagination or retrieval failures. All 30 report messages had `dmarc=pass` in the final Gmail receiver's `mx.google.com` Authentication-Results. XML report periods, rather than email receipt dates, determine the coverage below.

- For report periods beginning 2026-08-28 or later: 21 reports, 76 messages, all 76 DMARC-aligned. Providers: Google (74 messages) and Enterprise Outlook (2). Latest covered period ends 2026-09-25 23:59:59 UTC.
- Including delayed older reports: 30 reports covering 2026-08-26 through 2026-09-25, 465 messages, 464 aligned and one unaligned. Coverage includes Google, Enterprise Outlook, Outlook.com, Yahoo, and Zoho.
- The single failure is from 2026-08-27, source `18.198.39.243`, reported by Enterprise Outlook: aligned DKIM and SPF both failed, with no override reason. It is not evidence of a current sender failure, but its origin remains unclassified.
- Forwarded copies with failed SPF retained aligned DKIM. Do not equate every SPF failure with a DMARC failure.
- All parsed reports concern `mail.cc4.marketing`. No root-domain report was found in this mailbox/window, so this sample does not justify enforcing the root domain.

No Gmail labels or DNS records were changed. Keep the existing policies until a separately approved enforcement decision; review the older unexplained failure and sending-source inventory before tightening the newsletter subdomain. Current alignment evidence is positive but is not a guarantee for unobserved senders or recipients.

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

## Regression: 2026-07-15 (prerender re-added by perf work)

Commit `c593427` ("perf: prerender static pages...") re-added `export const prerender = true` to six pages (index, download, brand-guide, changelog, modules hub, 404) to fix a PageSpeed mobile score of 56 (TTFB ~900ms). It assumed prerendered pages "never reach the middleware at runtime". Wrong for this stack (Issue 2/5 above): the Worker still intercepts prerendered routes, Emdash's setup check fails, and every page 302'd to `/_emdash/admin/setup` in production.

Reverted in `8a20648`. Fonts self-hosting and lazy video embed were kept.

Why the regression shipped undetected:

1. The perf commit was written without checking this doc ("Never mix prerender and Emdash middleware" was already in Prevention above).
2. `astro dev` and local build both succeed; the failure only appears against the deployed Worker.
3. The `/ship` smoke test used `curl -sL ... %{http_code}`: `-L` follows the redirect and `/_emdash/admin/setup` returns 200, so a fully broken site still passed the smoke test.

Additional prevention:

- Smoke tests must fail on redirect-to-setup: check the final URL, not just status. Example:
  ```bash
  FINAL=$(curl -sL -o /dev/null -w "%{url_effective}" https://cc4.marketing/)
  case "$FINAL" in *"/_emdash/"*) echo "FAIL: redirected to Emdash setup"; exit 1;; esac
  ```
- Sanctioned perf path for TTFB on static pages: Cloudflare cache rules on the SSR responses (edge cache `/`, `/download/`, etc. with short TTL), never `prerender = true`.

## Related

- [Cloudflare Workers project with static assets needs Worker entry point for API routes](./cloudflare-workers-assets-with-api-routes.md)
- [Cloudflare Pages Resend email setup](./cloudflare-pages-resend-email-setup.md)
- [withastro/astro#14511 — Cloudflare adapter returning [object Object]](https://github.com/withastro/astro/issues/14511)
- [withastro/astro#15434 — Astro v6 + Cloudflare + middleware + nodejs_compat](https://github.com/withastro/astro/issues/15434)
- [Emdash CMS GitHub](https://github.com/emdash-cms/emdash)
