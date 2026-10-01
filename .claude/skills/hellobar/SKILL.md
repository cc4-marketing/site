---
name: hellobar
description: Check, schedule, turn on or off, or replace the cc4.marketing top hello bar. Use when asked what the hello bar shows, to announce something in the top bar, to queue a bar for a date, or to stop one.
---

# /hellobar: manage the cc4.marketing hello bar

cc4 runs the site-kick scheduled hello bar. The kit's own skill (`skills/hellobar/SKILL.md` in the
`site-kick` package, v0.2.2+) is the full reference; this file is the cc4 workflow.

- Data: `src/data/hellobar.json` (`"hellobar"` in `site-kick.config.json`), `{ "bars": [...] }`.
- Every enabled bar that has not ended ships with the build. The visitor's clock shows the first bar
  whose window holds "now" (startsAt inclusive, endsAt exclusive). File order is priority.
- `id` is the dismiss key in localStorage (`cooldownDays`). A new campaign needs a new id.
- Rendered by `src/components/HelloBar.astro` (cc4 look, kit selection logic) from
  `src/layouts/BaseLayout.astro`. `/hellobar.json` (`src/pages/hellobar.json.ts`) publishes what the
  build carries.
- Never edit the JSON by hand. The CLI validates before writing and keeps the file stable.
- `floatingBanner` and `lessonBanner` in `src/config/promo.ts` are separate. Do not touch them here.

## 1. Status first

    npx site-kick hellobar status
    npx site-kick hellobar status --url https://cc4.marketing        # what the live build carries
    npx site-kick hellobar status --at 2026-11-27T09:00:00+07:00     # what shows at that time

Report the active bar, upcoming bars with start times, expired, disabled and any `shadowed` bar.
Exit 0 ok, 2 config problem, 3 network. On a non-zero exit show the `FAIL` and `next:` lines.

## 2. Change

    npx site-kick hellobar off <id>
    npx site-kick hellobar on <id>
    npx site-kick hellobar end <id>       # endsAt = now; for a bar that has not started, use off
    npx site-kick hellobar new --text '...' --link '/path/?utm_source=hellobar&utm_campaign=...' \
      --cta 'Learn more' [--starts 2026-11-27T00:00:00+07:00] [--ends 2026-12-01T23:59:59+07:00] \
      [--cooldown 3] [--id hellobar-...]

- `new` puts the bar first, so it wins over the others while its window is open.
- Use single quotes around text and links (zsh expands `$`, backticks and `!` in double quotes).
- Links: `https://...` (opens in a new tab) or a site path `/x` (same tab). Text max 160, CTA max 40.
- Tag links with `utm_source=hellobar&utm_campaign=<campaign>`.
- Changelog releases: the publish workflow's "Suggest an announcement" step prints the exact
  `new` command for the version.

## 3. Ship

1. Run `status` again and show it.
2. Branch, commit only `src/data/hellobar.json`: `chore: hello bar <on|off|new|end> <id>`
   (`chore`, never `feat`, so it stays out of the changelog).
3. Open a PR and merge it to main after the owner confirms; the merge deploys. Never push or merge
   without that confirmation.
4. After the deploy, run `npx site-kick hellobar status --url https://cc4.marketing` and confirm
   `live: matches the local file`.

A scheduled start or end needs no deploy.
