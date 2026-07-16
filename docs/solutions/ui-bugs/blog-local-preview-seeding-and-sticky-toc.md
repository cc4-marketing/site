---
category: ui-bugs
date: 2026-07-17
module: blog reading view / local preview
---

# Local blog preview seeding, asset 500s, and the sticky-TOC grid trap

Three lessons from the blog rebrand round 1 (branch refactor/blog-tokens-reading-view).

## 1. `astro preview` serves SSR HTML but 500s every static asset

Symptom: pages render unstyled; every `/_astro/*.css`, favicon, and image returns 500. The cloudflare adapter's `astro preview` does not serve the assets binding correctly here. Fix: run the built worker with `npx wrangler dev --port <p>` instead; assets serve (note: filenames containing `@` return 307 to the percent-encoded URL, which browsers follow). `wrangler dev --remote` is NOT usable: the SESSION KV binding has no id in wrangler.jsonc (Astro injects it at deploy) and remote preview upload rejects it.

## 2. Seeding local D1 with production posts (for visual review with real content)

`wrangler d1 export --remote` fails outright ("cannot export databases with Virtual Tables (fts5)"). Selective row copy works:

1. Export rows as JSON: `wrangler d1 execute cc4-emdash --remote --json --command "SELECT * FROM <table>"` for `ec_posts` (published), `_emdash_bylines`, `_emdash_content_bylines`, `users`.
2. Generate `INSERT OR REPLACE` statements (escape quotes by doubling).
3. FK traps when executing `--local`: `ec_posts.live_revision_id/draft_revision_id` reference `revisions` rows that are mostly absent even remotely — NULL them in the seed. `_emdash_bylines.avatar_media_id` references `media` — NULL it too. Insert order: users, bylines, posts, content_bylines. `PRAGMA defer_foreign_keys` does not save you; the Durable Object rolls back the whole file on commit-time violations.
4. Local schema already exists from prior dev sessions in `.wrangler/state`; only data is missing.

## 3. `align-items: start` on a grid kills sticky children

Symptom: TOC sidebar with `position: sticky; top: 90px` never floats. Cause: `align-items: start` on the grid container collapses the aside track to its content height, so the sticky element has zero travel room. Fix: let the aside stretch (grid default) and keep sticky on the inner element. If a rebuild replaces `dist/` while `wrangler dev` is serving it, the server dies silently — restart it.
