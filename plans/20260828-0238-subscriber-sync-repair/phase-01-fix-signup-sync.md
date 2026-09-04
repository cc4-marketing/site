# Phase 01: Fix the signup leak

Goal: every address that reaches `/api/subscribe` also reaches Substack, with no dependency on the visitor's browser allowing popups.

Files: `src/pages/api/subscribe.ts`, `src/pages/download.astro`, `src/pages/api/subscribe.test.ts` (new).

## Step 1: Check the Substack double opt-in setting first

Substack dashboard, Settings, and look for double opt-in / confirmation on new free subscribers.

If it is ON, a server-side add produces a pending confirmation, not a subscriber, and the leak only shrinks instead of closing. Decide then: turn it off (the site form is already an explicit opt-in, the checkbox copy on `download.astro` says so), or accept a confirm step and measure the new rate in Phase 03.

Do not write code before knowing this. It determines whether Phase 01 is a fix or a partial fix.

## Step 2: Check whether an official write API now exists

Log into `support.substack.com` and open the Substack Developer API article (login-gated, so it cannot be read from here). If it offers an authenticated endpoint for adding free subscribers, use it in Step 4 instead of the unofficial one, keep the rest of this phase unchanged, and note the swap in the plan.

## Step 3: Tighten validation in `subscribe.ts`

Replace `!email || !email.includes('@')` at line 15 with a real shape check. A single anchored regex is enough, this is not a deliverability check:

```ts
const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[a-zA-Z]{2,}$/;
const email = String(raw ?? '').trim().toLowerCase();
if (!EMAIL_RE.test(email) || email.length > 254) { /* 400 */ }
```

Lowercase and trim before anything else, so Resend and Substack both receive the same normalised key. The audit had to lowercase both exports by hand to compare them, and `Madison.Kalm@colibrigroup.com` went in with mixed case. Normalising at the boundary makes the Phase 03 diff trustworthy.

Rejects `x@gmail.comcom`? No, that is a valid shape with an invalid TLD. Accept that. It is one address in 418 and a TLD allowlist is not worth carrying.

## Step 4: Add the Substack write, server-side

In `subscribe.ts`, alongside the existing Resend calls:

```ts
const substack = fetch('https://cc4marketing.substack.com/api/v1/free?nojs=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  },
  body: new URLSearchParams({ email, source: 'subscribe_page' }),
});
```

Rules for this call:

- It MUST NOT gate the response. The existing `const [res] = await Promise.all(requests)` only inspects the first promise, so push the Substack fetch onto `requests` and it already degrades correctly. Keep it that way. A Substack outage must never cost a signup or the download email.
- Log failures with the address so they are recoverable: `console.error('substack subscribe failed', email, status, body)`. Cloudflare Workers logs are the fallback record until Phase 03 exists.
- Do not add a retry loop. Phase 03 is the retry mechanism, and it runs against real state instead of guessing.
- The `User-Agent` matters. The endpoint rejects requests without a browser-like agent.

## Step 5: Delete the popup

`src/pages/download.astro`, remove lines 313-318 entirely:

```js
// Also subscribe on Substack in background
window.open(`https://cc4marketing.substack.com/subscribe?email=...`, "_blank", "noopener");
```

Nothing replaces it. The server now owns that write. Leaving it in means a second subscribe attempt and a stray tab on the browsers where it does work.

## Step 6: Fix the copy that lied

`download.astro:55` says "Also subscribed you to course updates via Substack." That was false for roughly a third of visitors. After Step 4 it is true, so it can stay, but re-read it against the double opt-in answer from Step 1. If confirmation is on, it becomes "Check your inbox to confirm your newsletter subscription."

## Step 7: Test

Add `src/pages/api/subscribe.test.ts` (vitest is already a devDependency and `npm test` runs `vitest run`). Stub `fetch` and assert the contract, not the plumbing:

- Valid address produces three outbound calls: Resend send, Resend contact, Substack free.
- Substack returning 500 still yields a 200 response to the client. This is the regression that matters, it encodes "a broken Substack never costs a signup."
- Resend send returning 500 still yields 502. Existing behaviour, guard it.
- `x@gmail.comcom`, ` Foo@Bar.com ` (normalised to `foo@bar.com`), `nope`, and `""` hit the validation branch as expected.

## Step 8: Verify live

`npm run build`, deploy, then a real signup with a fresh address you control.

Acceptance, all four:
1. Download email arrives.
2. Address appears in the Resend audience.
3. Address appears in Substack as a free subscriber, with no tab having opened.
4. Repeat in Safari with popups blocked. This is the exact case that was failing, so it is the only test that proves the fix.
