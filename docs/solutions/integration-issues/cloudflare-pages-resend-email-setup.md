---
title: "Cloudflare Pages Functions secrets and env vars unreliable with wrangler pages deploy"
category: integration-issues
date: 2026-03-18
tags:
  - cloudflare-pages
  - wrangler
  - resend
  - email
  - env-vars
  - secrets
severity: high
component: Cloudflare Pages Functions, Resend API, wrangler.jsonc
---

## Problem

When deploying Cloudflare Pages Functions via `wrangler pages deploy`, secrets set with `wrangler pages secret put` were not reliably accessible at runtime. The environment variable keys were present in `Object.keys(context.env)` but their values were falsy or empty, causing the Resend API calls to fail with missing authentication. This is a known friction point when using the CLI-based deploy path rather than the Git-integration deploy path for Cloudflare Pages.

A second issue arose when defining `vars` in `wrangler.jsonc` whose values contained domain-like strings with angle brackets. Specifically, a `FROM_EMAIL` variable set to `"CC4 Marketing <hello@cc4.marketing>"` was being truncated or mangled during deployment, resulting in malformed sender addresses reaching the Resend API.

A third compounding issue was that Resend requires emails to be sent from a verified domain. The root domain `cc4.marketing` had not been verified for sending; only the subdomain `mail.cc4.marketing` was configured and verified in Resend.

## Root Cause

Three cascading issues prevented Cloudflare Pages Functions from sending email via Resend:

1. **Secrets are invisible to CLI-deployed Pages.** When you deploy with `wrangler pages deploy` (as opposed to Git-integrated deployments), secrets set via `wrangler pages secret put` or the Cloudflare dashboard appear in `Object.keys(context.env)` but resolve to empty/falsy values at runtime. This is a known limitation: the secrets mechanism is designed for Git-triggered builds, not direct CLI uploads.

2. **JSONC vars mangle strings containing angle brackets.** Placing a value like `"CC4 Marketing <hello@cc4.marketing>"` inside the `vars` block of `wrangler.jsonc` causes truncation or corruption during deployment. The angle brackets and domain-like substrings are not faithfully preserved.

3. **Resend domain mismatch.** Resend requires the `from` address to use a verified sending domain. The verified domain was the subdomain `mail.cc4.marketing`, not the root `cc4.marketing`. Sending from `hello@cc4.marketing` fails verification even if the API key and transport are correct.

## Solution

### Step 1 -- Move the API key into `wrangler.jsonc` vars

Since secrets do not work with `wrangler pages deploy`, put `RESEND_API_KEY` directly in the `vars` block. It is a plain alphanumeric string with no special characters, so it survives JSONC processing intact.

```jsonc
// wrangler.jsonc
{
  "name": "cc4-mkt",
  "compatibility_date": "2025-11-26",
  "pages_build_output_dir": "./dist",
  "vars": {
    "RESEND_API_KEY": "re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

### Step 2 -- Hardcode the `from` address in function code

Do not put the `from` email in `wrangler.jsonc` vars because the angle-bracket format gets truncated. Instead, define it directly in the function source code, using the verified subdomain:

```js
// functions/api/subscribe.js
const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "CC4 Marketing <hello@mail.cc4.marketing>",
    to: [email],
    subject: "Welcome to Claude Code for Marketers",
    html: htmlBody,
  }),
});
```

The critical detail is `hello@mail.cc4.marketing` (the verified subdomain), not `hello@cc4.marketing`.

### Step 3 -- Deploy with the CLI as usual

```bash
npx wrangler pages deploy
```

The API key is now read from `vars` (which works with CLI deploys), and the `from` address is hardcoded with the correct subdomain.

## What Didn't Work

- **`wrangler pages secret put RESEND_API_KEY`** for both production and preview environments. The key appeared in `Object.keys(context.env)` but the value was empty at runtime.
- **Deleting and re-creating secrets with piped input** (`echo "re_xxx" | wrangler pages secret put RESEND_API_KEY`). Same result -- key present, value empty.
- **Putting `FROM_EMAIL` in `wrangler.jsonc` vars** with the value `"CC4 Marketing <hello@cc4.marketing>"`. The angle brackets caused the value to be truncated after deployment.
- **Sending from the root domain** (`hello@cc4.marketing`) when only the subdomain `mail.cc4.marketing` was verified in Resend.

## Prevention

- **Never rely on `wrangler pages secret put` for CLI-deployed Pages Functions.** Use `vars` in `wrangler.jsonc` or set environment variables through the Cloudflare Dashboard.
- **Never put values containing angle brackets or special characters in `wrangler.jsonc` vars.** Hardcode these in function source code or use the Cloudflare Dashboard.
- **Always verify the exact sending domain in your email provider.** Many providers verify a subdomain like `mail.example.com` rather than the root. The `from` address must match exactly.

## Best Practices

- **Separate config from secrets.** Use `wrangler.jsonc` `vars` for non-sensitive, plain-ASCII config. Put sensitive values in the Cloudflare Dashboard as encrypted environment variables for Git-integrated deployments.
- **Use `context.env` in Pages Functions, not `process.env`.** Pages Functions receive bindings through the `context` parameter.
- **Test env var availability with a health endpoint.** Create a simple `/api/debug-env` function that returns which env vars are defined (not their values) to confirm bindings after deploy.
- **Log the full error response from email APIs during development.** Domain mismatch errors are clearly stated in the response body but invisible if you only check for `2xx`.
- **Deploy to Preview first.** Cloudflare Pages has separate Production and Preview environments with independent env vars.

## Checklist

- [ ] Email provider account created and API key obtained
- [ ] Sending domain verified -- note the **exact** domain string (e.g., `mail.example.com` vs `example.com`)
- [ ] DNS records (DKIM, SPF, DMARC) added and verified
- [ ] `from` address in code uses the **verified** domain exactly
- [ ] API key added to `wrangler.jsonc` vars (for CLI deploy) or Cloudflare Dashboard (for Git deploy)
- [ ] Pages Function accesses the key via `context.env`, not `process.env`
- [ ] No angle brackets or special characters in `wrangler.jsonc` vars
- [ ] Test email sent successfully from Preview deployment before promoting to Production

## Related

- `functions/api/subscribe.js` -- the Pages Function that sends email via Resend
- `wrangler.jsonc` -- project config with vars binding
- `changelog-worker/wrangler.jsonc` -- separate Cloudflare Worker (uses KV, different deploy model)
- [Resend Audiences subscriber storage](./resend-audiences-subscriber-storage-newsletter-20260421.md) -- adding contact list storage + Dashboard env var setup for Git-integrated deploys
