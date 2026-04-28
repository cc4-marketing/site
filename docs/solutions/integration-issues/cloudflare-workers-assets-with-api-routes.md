---
title: "Cloudflare Workers project with static assets needs Worker entry point for API routes"
category: integration-issues
date: 2026-03-18
tags:
  - cloudflare-workers
  - cloudflare-pages
  - wrangler
  - wrangler-jsonc
  - api-routes
  - static-assets
  - resend
  - email
severity: high
component: wrangler.jsonc, src/worker.js, Cloudflare Workers with Assets
---

## Problem

The email subscribe form on `cc4.marketing/download` returned "Something went wrong" in production, while the same code worked on the preview deploy at `fix-email-subscribe-flow.cc4-mkt.pages.dev`. The form POSTed to `/api/subscribe` which returned a 404 on the production domain.

## Root Cause

Three compounding issues:

1. **The production project was a Cloudflare Workers project, not a Pages project.** The dashboard showed `cc4-mkt.mtri-vo.workers.dev` (Workers) with a custom domain `cc4.marketing`. The preview deploy was on a separate CLI-created Pages project (`cc4-mkt.pages.dev`). These are fundamentally different deployment models.

2. **Workers projects don't support `functions/` directory.** The subscribe endpoint was in `functions/api/subscribe.js` — a Cloudflare Pages Functions convention. Workers projects ignore this directory entirely. The `functions/` directory is only auto-discovered by Pages projects with Git integration and no custom deploy command.

3. **A static-assets-only Worker can't have environment variables.** Without a Worker entry point (`main` in `wrangler.jsonc`), the project was treated as static-only. The dashboard showed "Variables cannot be added to a Worker that only has static assets", making it impossible to set `RESEND_API_KEY`.

### How the confusion arose

- A CLI-created Pages project (`cc4-mkt.pages.dev`) coexisted with the Git-connected Workers project that owned `cc4.marketing`
- CLI deploys went to the wrong project
- The `wrangler pages deploy` command and `wrangler versions upload` command have incompatible config requirements (`pages_build_output_dir` vs `assets.directory`)
- Multiple failed deploy attempts with different `wrangler.jsonc` configurations

## Solution

### Step 1 — Create a Worker entry point

Create `src/worker.js` with a `fetch` handler that routes API requests and falls through to static assets:

```js
// src/worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle API routes
    if (url.pathname === "/api/subscribe") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
      if (request.method === "POST") {
        return handleSubscribe(request, env);
      }
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    // Everything else: serve static assets
    return env.ASSETS.fetch(request);
  },
};

async function handleSubscribe(request, env) {
  // ... API logic using env.RESEND_API_KEY
}
```

Key details:
- `env.ASSETS.fetch(request)` is the magic binding that serves static files from the `assets.directory`
- API routes are handled before the assets fallthrough
- Environment variables (like `RESEND_API_KEY`) are accessed via the `env` parameter

### Step 2 — Configure wrangler.jsonc

```jsonc
{
  "name": "cc4-mkt",
  "main": "src/worker.js",
  "compatibility_date": "2025-11-26",
  "assets": {
    "directory": "./dist"
  }
}
```

- `main` points to the Worker entry point — this is what makes it a "Worker with code" instead of "static assets only"
- `assets.directory` tells `wrangler versions upload` where the built static files are
- Do NOT include `pages_build_output_dir` — that's for Pages projects, not Workers

### Step 3 — Set the deploy command

In Cloudflare Dashboard → Build configuration:
- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler versions upload`

### Step 4 — Add environment variables

Once the Worker has a `main` entry point, the "Variables cannot be added" restriction is lifted:
- Dashboard → Settings → Variables and Secrets → Add `RESEND_API_KEY`

### Step 5 — Delete duplicate projects

Remove any CLI-created Pages projects with the same name to avoid deploy confusion.

## What Didn't Work

| Attempt | Why it failed |
|---------|--------------|
| `functions/api/subscribe.js` (Pages Functions) | Workers projects ignore the `functions/` directory |
| Deploy command: `npx wrangler deploy` | Prompts "this is a Pages project" then fails with missing entry-point |
| Deploy command: `npx wrangler pages deploy ./dist` | Authentication error — `CLOUDFLARE_API_TOKEN` in build env lacked Pages permissions |
| Deploy command blank/empty | Field is required for this project type |
| `pages_build_output_dir` without `assets` | `wrangler versions upload` reads `assets.directory`, not `pages_build_output_dir` |
| Adding `assets` field for CLI `wrangler pages deploy` | "Configuration file for Pages projects does not support 'assets'" |
| Setting env vars on static-only Worker | Dashboard says "Variables cannot be added to a Worker that only has static assets" |

## Key Insight: Pages vs Workers

Cloudflare has two deployment models that look similar but behave very differently:

| | Pages project | Workers project |
|---|---|---|
| Domain pattern | `*.pages.dev` | `*.workers.dev` |
| API routes | `functions/` directory auto-discovered | Need `main` Worker entry point |
| Static files | `pages_build_output_dir` | `assets.directory` |
| Deploy command | `wrangler pages deploy` | `wrangler versions upload` or `wrangler deploy` |
| Env vars | Always available via dashboard | Requires Worker code (not static-only) |
| Config conflict | `assets` field NOT supported | `pages_build_output_dir` NOT used |

**Check your project type first.** Look at the workers.dev subdomain in the dashboard to determine which model you're on.

## Prevention

- **Before adding API routes, check if your project is Pages or Workers.** The `.workers.dev` vs `.pages.dev` subdomain in the dashboard is the quickest indicator.
- **Workers projects need a `main` entry point** to support API routes and environment variables. Use `env.ASSETS.fetch(request)` to fall through to static assets.
- **Never have two projects with the same name.** CLI-created and Git-connected projects can coexist with the same name, causing deploy confusion.
- **Test the production domain directly**, not just the deployment URL. Custom domain routing may point to a different project than expected.

## Related

- `src/worker.js` — Worker entry point with API routing
- `functions/api/subscribe.js` — Legacy Pages Function (kept for reference, not used in production)
- `wrangler.jsonc` — Project configuration
- [cloudflare-pages-resend-email-setup.md](./cloudflare-pages-resend-email-setup.md) — Earlier investigation (Pages-focused, partially superseded)
- [wrangler-versions-upload-missing-entry-point.md](../build-errors/wrangler-versions-upload-missing-entry-point.md) — Related build error
