# Subscriber sync repair

Audit 2026-08-28: web DB 418, Substack 667, only 280 on both. 138 web signups (130 still opted in) never reached Substack. Miss rate 26-47% per month, worst in August.

Root cause: `src/pages/download.astro:314` calls `window.open` to Substack **after** `await fetch("/api/subscribe")`. The user-gesture token is spent by then, so popup blockers kill it (Safari default, mobile Chrome, most desktop Chrome configs). Survivors still have to spot a background tab and click confirm. Random-by-browser, which matches the data: missing addresses have the same domain mix as present ones, no malformed addresses, no time pattern.

Second-order problems the audit surfaced:
- Unsubscribes write to Resend only. `hanpris@gmail.com` and `chanderr1995@outlook.com` opted out on the site and still receive Substack mail.
- 51 subscribers have received zero emails. No welcome on the Substack side; only web signups get the Resend download email.
- 6 sends in 6 months with May and June dark. Open-per-send by cohort: Jan 72%, Mar 58%, Jul 38%.
- `subscribe.ts:15` validates with `email.includes('@')`, which admitted `x@gmail.comcom`.

Decision: keep Resend as the system of record and make the server responsible for the Substack write. No browser popup in the path. Substack has no supported write API, so the live path uses the unofficial `POST /api/v1/free?nojs=true` endpoint, and a reconcile script backstops it. That combination is what would have caught this in April.

## Phases

- **Phase 01**: Fix the leak. Server-side Substack subscribe in `src/pages/api/subscribe.ts`, delete the `window.open` call, tighten validation, correct the success copy. Ships alone and stops the bleeding. See `phase-01-fix-signup-sync.md`.
- **Phase 02**: Recover the 130 stranded addresses via Substack CSV import, and make unsubscribe propagate. See `phase-02-backfill-and-unsub-parity.md`.
- **Phase 03**: Reconcile guard: `npm run check:subscriber-sync` diffs Resend audience against a Substack export and fails loud. See `phase-03-reconcile-guard.md`.
- **Phase 04**: Welcome email for Substack-only signups, then fix cadence. See `phase-04-welcome-and-cadence.md`.

## Sequencing

01 first and alone. It is the only phase that changes production signup behaviour, so it wants a clean deploy and a real end-to-end test before anything else moves.

02 after 01 is verified live. Importing 130 people while the form is still leaking means doing the import twice.

03 can be built in parallel with 02, but only lands after 02, otherwise its first run reports the 130 as failures.

04 last. It is the growth work, and it is pointless while a third of new signups never arrive.

Do not prune the 94 dead addresses (5+ sends, 0 opens) in this plan. Suppression is cosmetic while May and June are empty; revisit after 04 restores a normal send rhythm.

## Risks

- The Substack endpoint is reverse-engineered and unversioned. It can break or start rate limiting without notice. Mitigation: the Substack call never blocks the signup response, failures are logged with the address, and Phase 03 catches drift within a week.
- If double opt-in is on in Substack settings, a server-side add still only sends a confirmation request. Check this before Phase 01 ships, because it changes what "fixed" means. Phase 01 step 1 covers it.
- Substack may now have an official developer API. The support article is login-gated. If it exists and supports subscriber writes, prefer it over the unofficial endpoint and adjust Phase 01 step 4 only.

## Open questions

- Should the site keep mailing from Substack at all? Resend already holds every address and sends the download email. Consolidating on one sender removes this entire class of bug. Out of scope here, worth a decision after Phase 03 shows the real drift rate.
- `RESEND_AUDIENCE_ID` is not listed in the `wrangler.jsonc` secrets comment. Confirm it is actually set in production, or the audience write has been silently degrading to `console.warn` this whole time.
