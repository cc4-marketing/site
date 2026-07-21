# Phase 00 — Debt Cleanup / Foundation Prep

Prep before content+growth push. Read-only findings below turned into concrete tasks.
Each task: what + file + why. Do not gold-plate. Ship small, verify each.

Business context: course free (top-of-funnel), monetize skill packs + flows at $19.99 via
Polar (MoR). Substack = nurture newsletter. Resend = transactional only (welcome + download).

---

## Task 1 — Sitemap route collision (Emdash vs file route)

Problem: `src/pages/sitemap.xml.ts` (line 10) is a file route that 301-redirects to
`/sitemap-index.xml` (the real @astrojs/sitemap output). Emdash's astro integration
(`astro.config.mjs` lines 162-165) injects its own `sitemap.xml` route that renders an empty
`<urlset>` because D1 is not queryable at build. Two routes claim `/sitemap.xml`. Astro logs a
route-collision warning today, will hard-error in a future major (noted in the file header,
lines 5-7).

Fix options:
- A. Disable Emdash's injected sitemap via its integration options (preferred if it exists,
  e.g. `emdash({ sitemap: false, ... })`). Then the file route owns `/sitemap.xml` cleanly, no
  collision. Could not confirm the option name (node_modules read blocked). Verify against
  installed `emdash/astro` types before relying on it.
- B. If Emdash has no disable flag: keep the file route but silence/accept the warning. Fragile,
  breaks on the next Emdash/Astro major. Not recommended as the end state.
- C. Rename the real sitemap so nothing competes for `/sitemap.xml`. More churn (robots.txt +
  Search Console resubmit). Avoid.

Pick: A. Fallback to B only if A is not offered upstream.

Steps:
1. Grep the installed `emdash/astro` integration types for a sitemap/route toggle. If present,
   add it in `astro.config.mjs` lines 162-165.
2. If Emdash sitemap disabled: keep `src/pages/sitemap.xml.ts` redirect as-is (it becomes the
   sole owner). If it can't be disabled: leave both, update the header comment in
   `src/pages/sitemap.xml.ts` with the confirmed upstream status and a tracking note.
3. Build (`npm run build`), confirm no collision warning in Astro output.
4. Curl `https://cc4.marketing/sitemap.xml` post-deploy: must 301 to `/sitemap-index.xml`.

Why: remove a known future-breaking warning before piling on content that grows the sitemap.

---

## Task 2 — Lesson-count inconsistency (pick a canonical number)

Ground truth on disk (`src/content/modules/`): 19 MDX files.
- module-0: 4 files (0.0-introduction, 0.1-installation, 0.2-start-clone, 0.3-github-pr-guide)
- module-1: 7 files (1.1 … 1.7)
- module-2: 7 files (2.1 … 2.7)
- module-3: 1 file (3.1-ship-with-sigil)

`0.3-github-pr-guide` is a supplementary guide, not a core numbered lesson. It inflates Module 0.

Current surfaces disagree:
| Surface | File | Says |
|---|---|---|
| README intro | `README.md:9` | "17 interactive lesson pages" |
| README structure | `README.md:27` | "17 MDX lesson files across 3 modules" (also wrong: 4 modules) |
| README table | `README.md:36-40` | M0=4, M1=7, M2=6; no Module 3 row |
| siteData M0 | `src/config/siteData.ts:36` | "4 Lessons" (but only 3 titles listed line 37) |
| siteData M2 | `src/config/siteData.ts:52` | "7 Lessons" |
| FAQ answers | `src/pages/faq.astro:12,20,53,64` | "18 lessons", M0=3, M1=7, M2=7, +Capstone |
| llms.txt | `public/llms.txt:3,35-38` | "18 lessons", M0=4, M1=7, M2=6, M3=1 |

Canonical decision (owner-confirmed 2026-07-18): **4 modules, 19 lessons.** Count
`0.3-github-pr-guide` as a real lesson. Distribution: M0=4, M1=7, M2=7, M3=1 = 19. Matches disk
1:1 (19 MDX = 19 lessons), simplest mental model, no "core vs bonus" caveat to maintain.

Reconcile every surface to "4 modules, 19 lessons":
1. `README.md:9` — "17 interactive lesson pages" → "19".
2. `README.md:27` — "17 MDX lesson files across 3 modules" → "19 MDX lesson files across 4
   modules".
3. `README.md:36-40` — fix table: M0=4 (keep), M2 6→7, add Module 3 (Capstone, 1, ~75 min) row.
   Total row = 19.
4. `src/config/siteData.ts:36-37` — Module 0 header already "4 Lessons" but `lessons` array lists
   only 3 titles: add `0.3-github-pr-guide` as the 4th title so header and list agree.
5. `src/config/siteData.ts:52` — Module 2 already "7 Lessons", verify the 7 titles present.
6. `src/pages/faq.astro:12,20,53,64` — "18 lessons" → "19"; Module 0 "3 lessons" → "4".
7. `public/llms.txt:3` — "18 lessons" → "19". `:35` Module 0 "(4 lessons...)" keep. `:37`
   Module 2 "(6 lessons...)" → "(7 lessons...)", add service-package-from-engagement topic.
8. `public/llms-full.txt` — same "18"→"19" + Module 2 6→7 edits (grep first).

Why: AI answer engines and human readers get one consistent number. 19 = disk truth, zero
ambiguity, every surface reconciles to the same figure.

---

## Task 3 — Auto-sync llms.txt / llms-full.txt in publish-post skill

Today Step 5b of `.claude/skills/publish-post/SKILL.md` (lines 137-153) is a manual instruction:
hand-append the new post to both files' `### Published Posts` section. Easy to forget, drifts.

Both target files exist and have the section:
- `public/llms.txt` — flat list `- [Title](url)`.
- `public/llms-full.txt:12` — `### Published Posts`, list `- [Title](url) — description`.

Automate inside the existing helper `publish_post.py` (referenced SKILL.md line 225), which
already parses frontmatter (title, slug, excerpt) and appends to `blogPages` in
`astro.config.mjs` (line 107). Extend it to also, on `--execute`:
1. Read `public/llms.txt`, if `/blog/{slug}/` not already present, insert
   `- [{title}](https://cc4.marketing/blog/{slug}/)` under `### Published Posts`.
2. Read `public/llms-full.txt`, same, appending ` — {excerpt}` (reuse frontmatter excerpt as the
   one-line description; no new field needed).
3. Idempotent: skip if the slug line already exists (safe re-run).

Then edit `SKILL.md`:
- Step 5b (lines 137-153): change from "manually append" to "the helper appends both files on
  --execute; verify the two lines landed."
- Step 6 staging note (line 159) and Safety rule (line 219): keep "stage both files" but note
  they're now auto-written, so `git add` picks them up.

Why: removes a manual step that silently breaks AI discoverability when skipped. Excerpt already
captured, so no extra input.

---

## Task 4 — Polar integration prep (plan only, no implementation)

Skill present: `~/.claude/skills/payment-integration/SKILL.md` (marked `legacy: true`). Covers
Polar as Merchant of Record with references under `references/polar/` (overview, products,
checkouts, webhooks, benefits, sdk) and `scripts/polar-webhook-verify.js`. Repo slash command
`integrate:polar` also exists. Use these when implementing; below is setup scope only.

Setup steps (do not build yet):
1. Polar account + organization. Enable MoR (Polar handles global sales tax/VAT). Verify payout
   method.
2. Products / SKUs (one-time, $19.99 each):
   - Skill pack (advanced Claude Code skills bundle) — one-time.
   - Workflow flow pack — one-time.
   - Bundle (both) — one-time, priced below 2×$19.99 to nudge the bundle.
   Digital product, one-time price (not subscription), USD.
3. Fulfillment via Polar Benefits (`references/polar/benefits.md`): pick one delivery mechanism:
   - Polar "file downloads" benefit (Polar hosts the zip) — simplest, no infra.
   - or GitHub private repo access benefit (gated repo per pack) — good if packs are code that
     benefits from git updates.
   Recommend file-download benefit for v1 (least moving parts). Revisit GitHub access if buyers
   need versioned updates.
4. Checkout on Astro/Cloudflare Workers:
   - Simplest: Polar hosted checkout link per product, button links out. No server code.
   - Embedded: Polar embedded checkout (`references/polar/checkouts.md`) on a new
     `src/pages/skills.astro` (or `/store`) page, output already `server` (astro.config.mjs:83),
     so an API route can mint a checkout session server-side with the Polar SDK.
   - Store `POLAR_ACCESS_TOKEN` as a Cloudflare Worker secret (wrangler secret), never in repo.
5. Webhook for fulfillment: new route `src/pages/api/polar-webhook.ts` (`prerender = false`,
   mirror `subscribe.ts` env access via `cloudflare:workers`). Verify signature with
   `scripts/polar-webhook-verify.js` pattern + `POLAR_WEBHOOK_SECRET`. On `order.paid` /
   `benefit.granted`, if using Polar benefits the delivery is automatic; the webhook only needs
   to (optionally) add the buyer to the Substack nurture + log. If self-hosting downloads, mint
   a signed R2 URL here.
6. Paid content storage: for file-download benefit, upload packs to Polar. If self-hosting, reuse
   the existing R2 `MEDIA` bucket (bound as `MEDIA`, astro.config.mjs:164) under a `packs/`
   prefix, serve via short-lived signed URLs from the webhook/success handler. Keep paid assets
   out of the public GitHub repo.

Why: lock the shape (SKUs, MoR, fulfillment path, secret names, file locations) before writing
code, so the build phase is mechanical.

---

## Task 5 — Email split cleanup (Resend transactional, Substack nurture)

Current wiring:
- `src/pages/download.astro` form posts to `/api/subscribe` (lines 297-301), then on success
  opens `https://cc4marketing.substack.com/subscribe?email=...` in a background tab (lines
  313-318). So Substack nurture is already triggered client-side.
- `src/pages/api/subscribe.ts` sends the Resend welcome+download email (lines 39-70) AND, when
  `RESEND_AUDIENCE_ID` is set, adds the email to a Resend audience/contacts list (lines 73-83).
- Substack elsewhere is link-only CTAs (`src/components/blog/PostCta.astro:8`,
  `src/pages/blog/index.astro:68`, `authors.astro:89`) — no code change needed there.

New rule (owner-confirmed 2026-07-18): Resend = transactional only (auto-send resource/download
email on every signup). Substack = nurture, and signup must auto-subscribe server-side (not a
popup). Existing Resend contacts must be exported before the audience code is dropped.

Required flow when a visitor submits the resource/download form:
1. Resend fires the resource email (download link) immediately. Already works
   (`subscribe.ts:39-71`), keep.
2. Same request auto-subscribes the email to Substack server-side (reliable, no popup).

Changes:
1. Export first (one-time, before code change): pull existing Resend audience contacts (Resend
   dashboard export or API `GET /audiences/{id}/contacts`), import into Substack so no subscriber
   is lost. Manual op, do before step 3.
2. `src/pages/api/subscribe.ts` — add a server-side Substack subscribe call in the same handler,
   after the Resend email send. Substack's public subscribe endpoint
   (`https://cc4marketing.substack.com/api/v1/free`, POST `{email, ...}`) is unofficial; wrap in
   try/catch, do not fail the resource email if Substack errors, log failures. Verify the exact
   endpoint/payload against a live test before shipping (Substack has no documented API).
3. `src/pages/api/subscribe.ts` — remove the Resend audience contact push (lines 73-83, and the
   `RESEND_AUDIENCE_ID` read line 24). Resend now only fires the transactional email.
4. `src/pages/download.astro` (lines 313-318) — drop the `window.open` Substack popup; the
   server-side subscribe (step 2) replaces it. Removes the popup-blocked-signup loss.
5. `src/pages/download.astro:55` success copy "Also subscribed you to course updates via
   Substack." — still accurate, keep.
6. Confirm no other page adds to the Resend audience (grep `RESEND_AUDIENCE_ID`).

Why: one signup → resource email (Resend) + nurture list (Substack), both server-side and
reliable. No popup loss, no orphaned marketing list on Resend.

Risk: Substack has no official API. The `/api/v1/free` endpoint can change or rate-limit. If it
proves unreliable, fallback is Substack's embeddable form or a redirect-on-success to the hosted
subscribe page. Test before trusting.

---

## Open risks

- Emdash sitemap disable flag unconfirmed (node_modules read blocked). If it does not exist,
  Task 1 stays a mitigation, not a fix, until Emdash ships one or Astro's next major forces it.
- Lesson-count canonical: **19, confirmed.** Reconcile all surfaces to 19 (Task 2).
- Polar MoR onboarding (identity/tax verification) can take days; start account setup early so it
  is not the critical-path blocker for the paid launch.
- Substack has no official API. Server-side subscribe via `/api/v1/free` is unofficial: test live,
  keep the embeddable-form fallback ready.
- Export Resend contacts to Substack BEFORE removing the audience code (Task 5 step 1), else lose
  them.
