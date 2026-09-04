# Phase 03: Reconcile guard

The point of this phase: this bug ran for five months across 138 people because nothing ever compared the two lists. Phase 01 fixes the known cause. This phase is what notices the next one.

Files: `scripts/check-subscriber-sync.mjs` (new), `package.json` script entry.

## Step 1: Script contract

`npm run check:subscriber-sync -- --substack <export.csv>`

Reads:
- Resend audience over the API, `GET https://api.resend.com/audiences/{RESEND_AUDIENCE_ID}/contacts`, paginated. Needs `RESEND_API_KEY` from the environment, never hardcoded, `op` if it has to be fetched.
- A Substack CSV export path passed as an argument. Substack has no read API worth depending on, and the export is two clicks. Do not scrape.

Normalises every address with `trim().toLowerCase()` on both sides before comparing. Without this the diff invents differences, mixed-case addresses like `Madison.Kalm@colibrigroup.com` exist in the real data.

## Step 2: What it reports

Four buckets, each with a count and the addresses:

1. **Opted in on Resend, absent from Substack.** The Phase 01 regression. Should be 0. Anything here means the live signup write is failing again.
2. **Unsubscribed on Resend, active on Substack.** Compliance. Should be 0.
3. **Absent from Resend, present on Substack.** Expected and fine, these are Substack-native signups. On the audit data that was 387, mostly the Jan to Apr cohorts that predate the web DB. Report the count only, not the list, or the output is unreadable.
4. **Unsubscribed on Substack, opted in on Resend.** The reverse compliance leak.

Bucket 1 and 2 are failures. Exit non-zero when either is non-empty, so it can be wired into anything later. Buckets 3 and 4 are informational.

## Step 3: The one automated action

For bucket 2, `PATCH https://api.resend.com/audiences/{id}/contacts/{contact_id}` with `{ unsubscribed: true }` behind an explicit `--apply` flag. Default is dry run, printing exactly what it would do.

Suppression only. Never automate a resubscribe from a diff, and never automate anything against Substack, it has no API for this and the manual step is small.

## Step 4: Cadence

Weekly, run by hand alongside the send. Do not put this in CI.

It needs a Substack export as input, so it cannot run unattended without scraping, and a scheduled job that silently fails to get its input is worse than no job. Weekly with a human is honest. If bucket 1 stays at 0 for two months, drop to monthly.

## Step 5: Test

One test in the existing vitest setup, feeding two small fixture lists through the diff function and asserting all four buckets. Export the pure diff separately from the fetching so it is testable without network. Case and whitespace variants belong in the fixture, that is the part that silently breaks.

## Acceptance

- Run it against the current 2026-08-28 exports before Phase 02 runs. It must report 130 in bucket 1 and 2 in bucket 2. If it does not reproduce the audit numbers, the script is wrong, not the audit.
- Run it again after Phase 02. Buckets 1 and 2 read 0, exit code 0.
