---
module: Newsletter
date: 2026-04-21
problem_type: integration_issue
component: email_processing
symptoms:
  - "Subscriber emails not stored anywhere after signup"
  - "No contact list to view or export from Resend"
  - "RESEND_API_KEY not set in Cloudflare Dashboard — 'Email service not configured'"
root_cause: config_error
resolution_type: code_fix
severity: medium
tags: [resend, audiences, subscribers, newsletter, cloudflare-pages]
---

## Problem

Two related issues surfaced after the newsletter signup form went live:

1. **"Email service not configured"** — a subscriber reported seeing this error when trying to sign up. `RESEND_API_KEY` was not set in the Cloudflare Pages environment variables (via the Dashboard), so the handler short-circuited before reaching the Resend API.

2. **No subscriber list** — the subscribe handler only sent a welcome email but never stored the subscriber's address anywhere. There was no way to view, export, or email the subscriber list.

## Root Cause

- `RESEND_API_KEY` was configured locally but not added to **Cloudflare Pages → Settings → Environment variables** for the Git-integrated deployment.
- The subscribe handler (`functions/api/subscribe.js`) called `fetch('https://api.resend.com/emails', ...)` only — it had no contact-storage step.

## Solution

### 1. Add RESEND_API_KEY to Cloudflare Dashboard

Go to **Cloudflare Dashboard → Pages → [project] → Settings → Environment variables**, add `RESEND_API_KEY` for Production. Trigger a redeploy (retry deployment or push a new commit).

> Note: for CLI-deployed Pages (wrangler pages deploy), env vars set via dashboard do NOT apply — use `vars` in `wrangler.jsonc` instead. See related doc below.

### 2. Add Resend Audiences integration

Create an audience in **resend.com/audiences**, copy its ID, add it as `RESEND_AUDIENCE_ID` in Cloudflare env vars.

Update the subscribe handler to fire both calls in parallel:

```js
// functions/api/subscribe.js
const resendHeaders = {
  Authorization: `Bearer ${RESEND_API_KEY}`,
  "Content-Type": "application/json",
};

const requests = [
  fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: resendHeaders,
    body: JSON.stringify({ from, to: [email], subject, html }),
  }),
];

if (RESEND_AUDIENCE_ID) {
  requests.push(
    fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
      method: "POST",
      headers: resendHeaders,
      body: JSON.stringify({ email, unsubscribed: false }),
    })
  );
} else {
  console.warn("RESEND_AUDIENCE_ID not set — subscriber not added to audience");
}

const [res] = await Promise.all(requests);
```

The audience call is **gracefully degraded** — if `RESEND_AUDIENCE_ID` is missing, a warning is logged but the welcome email still sends.

### Resend Audiences API endpoint

```
POST https://api.resend.com/audiences/{audience_id}/contacts
Authorization: Bearer {RESEND_API_KEY}
Content-Type: application/json

{ "email": "user@example.com", "unsubscribed": false }
```

## What Didn't Work

- Setting `RESEND_API_KEY` only in local `.env` — Cloudflare Pages Git-integrated deployments require env vars set via the Dashboard, not local files.

## Prevention

- After deploying any new environment variable, verify it's set in **both** Cloudflare Dashboard Production and Preview environments.
- Always combine contact storage with the welcome email send — don't leave subscriber capture as a "later" task.
- Keep `RESEND_AUDIENCE_ID` optional with a fallback `console.warn` so missing config degrades gracefully rather than breaking the signup flow.

## Checklist

- [ ] `RESEND_API_KEY` set in Cloudflare Dashboard → Environment variables (Production + Preview)
- [ ] Audience created in resend.com/audiences
- [ ] `RESEND_AUDIENCE_ID` set in Cloudflare Dashboard → Environment variables
- [ ] Redeploy triggered after adding env vars
- [ ] Test signup end-to-end: welcome email received + contact appears in Resend audience

## Related

- `functions/api/subscribe.js` — Cloudflare Pages Function (used in production)
- `src/pages/api/subscribe.ts` — Astro API route (mirrors the Pages function)
- [Cloudflare Pages + Resend initial setup](./cloudflare-pages-resend-email-setup.md) — covers CLI deploy path, wrangler.jsonc vars, verified sending domain
