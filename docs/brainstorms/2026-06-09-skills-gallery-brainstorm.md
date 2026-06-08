---
date: 2026-06-09
topic: skills-gallery
---

# Skills gallery (`/skills`) — share CC4 Marketing Claude agent skills

## What we're building

A public `/skills` section on cc4.marketing where CC4 Marketing shares its own
curated Claude agent skills (SKILL.md bundles — e.g. naming, brand voice,
content workflows), in the spirit of [kits.vibery.app](https://kits.vibery.app/)
and the [Anduril naming skill](https://github.com/blacklogos/anduril-naming-skill).
Positioning is **general CC4M skills** (not marketing-only) — whatever skills the
team builds, with a curated editorial bar.

**Success looks like:** the gallery is live with 1–3 CC4M skills, each with a
shareable detail URL, working GitHub link + `.skill` download + inline SKILL.md,
indexed in the sitemap and `llms.txt`. (Copy-install-command lands in a later
increment with the marketplace — see below.)

- **Index** `/skills/` — responsive card grid (cloned from `blog/index.astro`):
  each card shows the skill name, a short description, and tags.
- **Detail** `/skills/<slug>/` — its own canonical URL for sharing + SEO, with
  **four ways to get the skill**:
  1. **Link to the GitHub repo** (the skill's source / README install steps)
  2. **Copy install command** — a one-click copy of `/plugin marketplace add <cc4m-marketplace>` (+ the install step). ⚠️ **Blocked on a prerequisite:** the CC4M marketplace does not exist yet (see Resolved Q1). This affordance is live only once that marketplace is stood up; the other three ship without it.
  3. **Download the packaged `.skill` file** (hosted on R2)
  4. **Read SKILL.md inline** — the skill body rendered on the page so visitors can read/copy without leaving

This is **not** the existing image-prompts brainstorm
(`docs/brainstorms/2026-05-09-prompts-gallery-brainstorm.md`, `/prompts`) and
**not** the per-author writing-prompt library (`src/lib/author-prompts.ts`).
Different content type (agent skills), different route, separate effort.

## Why this approach

**Chosen: Approach B — static repo-file MVP now, migrate to Emdash D1 later.**

- **Ship fast, low risk.** Skills live as repo files/array entries (the pattern
  already proven in `src/pages/blog/authors.astro` and `src/data/authors.ts`).
  No D1 schema, no new publish tooling, version-controlled, reviewable in PRs.
  At a curated <15-entry scale this is the right altitude (YAGNI).
- **Same UX as the eventual D1 version.** Index grid + detail pages + the four
  get-affordances are identical whether data comes from a file or D1 — so the
  later migration is a data-source swap, not a redesign.
- **Curated, authors-only, no submissions.** CC4M authors the skills; high
  editorial bar; no auth/moderation/spam surface. Reuses `src/data/authors.ts`
  for bylines.
- **Reuse the site's primitives.** `BaseLayout.astro`, `Header`/`Footer`,
  neobrutalist card tokens in `global.css`, and `CodeBlockCopy.astro`
  (auto-injected on `<pre>`) for the copy-install-command button — zero new JS.
- **Zero new authoring tooling in the MVP.** Skills are added by hand-editing
  repo files (`src/data/skills.ts` + a markdown body) and opening a PR. The
  `/publish-skill` skill belongs to the deferred D1 phase, **not v1** — do not
  scope it into the plan.

**Deferred: Approach A — Emdash D1 `skills` collection + `/publish-skill` skill.**
The intended end state once publishing cadence justifies redeploy-free entries.
Mirrors `/publish-post` (D1 insert, R2 upload for `.skill` + assets, sitemap
regen, ship). Migrate when either trigger hits: more than ~15 entries, or
updates frequent enough that deploy-per-entry slows publishing.

Approach C (live GitHub-sync of SKILL.md) rejected — rate limits + build-time
GitHub dependency, no payoff at curated scale.

## Key decisions

- **Routes**: `/skills/` (index) and `/skills/<slug>/` (detail). New top-level
  route, not nested under `/blog/`. Skills aren't blog posts; keep them out of
  the blog feed/RSS.
- **Storage (MVP)**: repo data — a typed array/data module
  (`src/data/skills.ts`) for metadata, plus a per-skill markdown file for the
  SKILL.md body (the body is too long to live inline in the array). Packaged
  `.skill` files in `public/`. Exact file/folder layout pinned in `/ce:plan`.
- **Entry fields** (per skill): `title`, `slug`, `description`, `tags` (string
  array), `author` (slug ref into `src/data/authors.ts`), `repoUrl`,
  `installCommand` (string — the `/plugin marketplace add …` form),
  `skillFile` (path/URL to downloadable `.skill`), `skillBody` (SKILL.md, rendered
  inline), `publishedAt`. Required: title, slug, description, repoUrl,
  installCommand, skillBody. Optional: tags, skillFile, author.
- **Install model**: Claude Code **plugin marketplace** — CC4M publishes its
  skills as a marketplace; the copy command is `/plugin marketplace add …`
  followed by the install step. Exact strings finalized in plan.
- **Get-affordances**: all four (GitHub link, copy install command, `.skill`
  download, inline SKILL.md) — confirmed required by the user.
- **Index UX**: card grid — name, description, tags. No filter UI in v1; add a
  tag filter later if entries pass ~15–20.
- **SEO**: each detail page emits an OG image and `SoftwareApplication`-style
  (or `CreativeWork`) JSON-LD with `author` = byline. Add an `OgPageKey`
  (`'skills'`) in `src/lib/og/url.ts`; add routes to `customPages`/sitemap in
  `astro.config.mjs`; append to `public/llms.txt` / `llms-full.txt`.
- **Discoverability**: not auto-promoted at launch. Feature via hello bar / blog
  cross-links once there are 3+ skills.

## Resolved questions

1. **CC4M marketplace** — *does not exist yet.* Creating a CC4M Claude Code
   plugin marketplace is a **prerequisite** of this work. The `/plugin
   marketplace add …` install command isn't "real" until that marketplace repo
   exists. Plan must account for standing it up (or sequence the gallery behind
   it). Until then, detail pages can still ship GitHub link + `.skill` download +
   inline SKILL.md; the copy-install-command becomes live once the marketplace
   lands.
2. **Skill source of truth (MVP)** — *repo files.* The inline SKILL.md body
   lives as a markdown file in the cc4m repo; the downloadable `.skill` is a
   packaged file committed to the repo / served from `public/` (or R2). Fully
   version-controlled, no GitHub fetch at build/request time. Packaging step
   (how the `.skill` is produced) pinned in plan.
3. **Launch set** — *1–3 skills for v1.* Small, curated launch (exact picks
   chosen during/after planning). Comfortably within the static-file threshold,
   confirms Approach B is right.
4. **Marketplace sequencing** — *launch without the marketplace.* v1 ships the
   gallery with three of the four affordances (GitHub link, `.skill` download,
   inline SKILL.md). The copy-install-command is a **later increment**, wired in
   once the CC4M marketplace exists. The gallery is not blocked on marketplace
   work.

## Open questions

1. **OG image** — per-skill hero art, or a templated OG (name + tags on brand
   background) via the existing Satori engine? Decide in plan.
2. **`.skill` packaging step** — manual commit of the packaged file, or a build
   script that produces it from the SKILL.md source? Decide in plan.

## Next steps

→ Resolve open questions, then `/compound-engineering:ce-plan` for implementation
details (file layout for `src/data/skills.ts` + SKILL.md bodies, route files,
detail-page get-affordances, OG `OgPageKey`, sitemap/llms.txt wiring, and a
stubbed migration note toward the deferred Emdash D1 `skills` collection).
