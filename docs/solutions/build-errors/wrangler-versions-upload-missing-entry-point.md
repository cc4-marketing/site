---
title: "wrangler versions upload fails with 'Missing entry-point to Worker script or to assets directory'"
category: build-errors
date: 2026-03-18
tags:
  - cloudflare-pages
  - wrangler
  - wrangler-jsonc
  - git-deploy
  - build-error
severity: medium
component: wrangler.jsonc, Cloudflare Pages Git integration
---

## Problem

Cloudflare Pages Git-integrated builds failed at the deploy step with:

```
✘ [ERROR] Missing entry-point to Worker script or to assets directory
```

The build command (`npm run build`) succeeded, but the deploy command (`npx wrangler versions upload`) could not find the built assets.

## Root Cause

The `wrangler.jsonc` config had `pages_build_output_dir` but was missing the `assets.directory` field. These serve different purposes:

- **`pages_build_output_dir`**: Used by `wrangler pages deploy` (CLI-based deploys)
- **`assets.directory`**: Used by `wrangler versions upload` (Git-integrated deploys via CF Pages build system)

When Cloudflare Pages runs a Git-triggered build, it uses `npx wrangler versions upload` as the deploy command, which reads `assets.directory` — not `pages_build_output_dir`.

## Solution

Include **both** fields in `wrangler.jsonc` to support both CLI and Git-based deploy paths:

```jsonc
{
  "name": "cc4-mkt",
  "compatibility_date": "2025-11-26",
  "pages_build_output_dir": "./dist",
  "assets": {
    "directory": "./dist"
  }
}
```

## Prevention

- **Always include both `pages_build_output_dir` and `assets.directory`** in `wrangler.jsonc` when using Cloudflare Pages. They look redundant but serve different deploy paths.
- **Test Git-integrated builds** after changing `wrangler.jsonc` — don't assume CLI deploys succeeding means Git deploys will too.

## Related

- `wrangler.jsonc` — project configuration
- `src/worker.js` — Worker entry point (the full fix for Workers projects)
- [cloudflare-workers-assets-with-api-routes.md](../integration-issues/cloudflare-workers-assets-with-api-routes.md) — complete solution for Workers + static assets + API routes
- [cloudflare-pages-resend-email-setup.md](../integration-issues/cloudflare-pages-resend-email-setup.md) — related CF Pages configuration issues
