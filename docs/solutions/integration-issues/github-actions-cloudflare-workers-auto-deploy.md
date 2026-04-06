---
title: "Cloudflare Workers Auto-Deploy Pipeline via GitHub Actions"
category: integration-issues
date: 2026-04-07
tags:
  - cloudflare-workers
  - github-actions
  - astro
  - wrangler
  - ci-cd
  - deployment
  - github-pages
severity: high
components:
  - .github/workflows/deploy.yml
  - .github/workflows/static.yml
  - public/CNAME
  - wrangler.jsonc
symptoms:
  - "Site requires manual deployment via 'npx wrangler deploy'"
  - "GitHub Pages workflow uploads raw source files instead of built output"
  - "Default Jekyll pages-build-deployment action always fails"
  - "Competing deployment mechanisms (GitHub Pages and Cloudflare Workers) with neither working automatically"
  - "wrangler-action@v3 fails to pass apiToken correctly to wrangler v4"
---

## Problem

The cc4.marketing Astro site on Cloudflare Workers had no CI/CD pipeline. Deploys were manual (`npx wrangler deploy`). A legacy GitHub Pages workflow existed but was broken and irrelevant.

Investigation revealed several layers of the issue:

- The existing deploy workflow (`static.yml`) was uploading raw source files (`path: '.'`) instead of building Astro first.
- Even after fixing the workflow to run `npm ci` + `npm run build` and upload `dist/`, it deployed to GitHub Pages — not Cloudflare.
- Running `npx wrangler pages project list` confirmed there is no Cloudflare Pages project. The site runs as a Cloudflare Worker (`cc4-mkt`).
- `npx wrangler deployments list` showed the last deploy was March 16, 2026.
- `curl -sI https://cc4.marketing` confirmed Cloudflare is serving the site (cf-ray headers), but the live HTML still had old code — confirming a stale deployment.
- GitHub's auto `pages-build-deployment` workflow kept triggering and failing because Jekyll was trying to build an Astro project.

## Root Cause

The site was set up on Cloudflare Workers (not Cloudflare Pages) with manual deploys only. A GitHub Pages workflow existed as a leftover from early project setup, but it targeted the wrong platform entirely. No CI/CD existed for the actual Cloudflare Workers deployment, so every change required a developer to manually run `npx wrangler deploy`.

## Solution

1. **Disabled GitHub Pages** to stop the broken Jekyll builds:

   ```bash
   gh api -X DELETE repos/cc4-marketing/site/pages
   ```

2. **Removed GitHub Pages artifacts**: deleted `public/CNAME` and the old `.github/workflows/static.yml`.

3. **Created `.github/workflows/deploy.yml`** with a proper Cloudflare Workers deploy pipeline:

   ```yaml
   name: Deploy to Cloudflare Workers

   on:
     push:
       branches: ["main"]
     workflow_dispatch:

   concurrency:
     group: "deploy"
     cancel-in-progress: false

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 22
             cache: npm
         - run: npm ci
         - run: npm run build
         - name: Deploy to Cloudflare Workers
           run: npx wrangler@4 deploy
           env:
             CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
             CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
   ```

4. **Set GitHub repository secrets**: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, which wrangler v4 reads from the environment automatically.

## Key Gotchas

### wrangler-action@v3 does not work with wrangler v4

The `cloudflare/wrangler-action@v3` action does not properly pass `apiToken` to wrangler v4. The deploy step fails with:

> "In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable."

**Fix:** Skip the action entirely and run `npx wrangler@4 deploy` directly with environment variables.

### wrangler v3 cannot read `.jsonc` config files

The default wrangler version installed by the action (v3.90) only recognizes `.toml` or `.json` config files. A `wrangler.jsonc` file causes:

> "Missing entry-point: The entry-point should be specified via the command line or the `main` config field."

**Fix:** Use wrangler v4, which supports JSONC natively.

### wranglerVersion validation rejects non-semver values

Setting `wranglerVersion: "4"` in the wrangler-action config fails with `"Invalid Version: 4"` because it expects full semver. Even specifying `"4.80.0"` installs correctly but the API token still does not get passed through — reinforcing that the action should be avoided in favor of direct `npx wrangler@4 deploy`.

## Prevention Strategies

- **Remove legacy workflows immediately after migration.** When migrating from one hosting platform to another, delete the old deployment workflow in the same PR that introduces the new one. Stale workflows create confusion about which pipeline is authoritative.
- **Establish CI/CD as a day-zero requirement.** Treat automated deployment as part of initial platform setup, not a follow-up task. A site without CI/CD will inevitably drift from the repository state.
- **Pin and test action versions against your toolchain.** Verify compatibility with your exact CLI version and config format before committing. Major version mismatches are common silent failure points.
- **Audit active workflows regularly.** Run `gh workflow list` periodically to catch orphaned pipelines before they cause incidents.

## Verification Checklist

- [ ] Only one production deployment workflow exists in `.github/workflows/`
- [ ] The workflow triggers on the correct branch (`main`)
- [ ] `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets are set in GitHub repo settings
- [ ] A test push deploys successfully (green check in Actions)
- [ ] The live site reflects the latest commit after deploy completes
- [ ] The wrangler CLI version in logs matches what was tested locally (v4.x)
- [ ] Previous hosting mechanism (GitHub Pages) is fully disabled
- [ ] No `.jsonc` parsing warnings in workflow logs

## Related

- [cloudflare-workers-assets-with-api-routes.md](./cloudflare-workers-assets-with-api-routes.md) — Workers + static assets architecture this pipeline deploys
- [cloudflare-pages-resend-email-setup.md](./cloudflare-pages-resend-email-setup.md) — env var handling differences between CLI and Git-integrated deploys
- [wrangler-versions-upload-missing-entry-point.md](../build-errors/wrangler-versions-upload-missing-entry-point.md) — troubleshooting wrangler.jsonc configuration issues
