---
title: Skills Gallery (/skills) — share CC4M Claude agent skills
type: feat
status: active
date: 2026-06-09
origin: docs/brainstorms/2026-06-09-skills-gallery-brainstorm.md
---

# ✨ Skills Gallery (`/skills`)

## Overview

A public `/skills` section on cc4.marketing where CC4 Marketing shares its own
curated Claude agent skills (SKILL.md bundles), in the spirit of
[kits.vibery.app](https://kits.vibery.app/) and the
[Anduril naming skill](https://github.com/blacklogos/anduril-naming-skill).
Positioning is **general CC4M skills** (not marketing-only).

- **Index** `/skills/` — responsive card grid (name, description, tags), cloned
  from `src/pages/blog/index.astro`.
- **Detail** `/skills/<slug>/` — a shareable page per skill with three
  get-affordances at launch: **(1)** link to the GitHub repo, **(2)** download
  the packaged `.skill` file, **(3)** read the SKILL.md inline. Plus an explicit
  **"How to install"** block (the marketplace copy-command affordance is deferred
  — see below).

**MVP storage:** repo-file-backed. Skill bodies live as markdown in an Astro
**Content Collection** (`src/content/skills/*.md`), rendered with
`getCollection` + `render` + `<Content/>` like the course modules — **but the
route is forced SSR (`prerender = false`)**, because prerendering is "poison" on
this site (Emdash middleware hijacks the prerender path → `/_emdash/admin/setup`
redirect). Migration to Emdash D1 is deferred (see brainstorm: Approach A).

**Deferred (not in this plan):** the copy `/plugin marketplace add …` install
command and the `/publish-skill` authoring tool — both wait on a CC4M plugin
marketplace that does not exist yet (see brainstorm: Resolved Q1, Q4).

## Problem Statement / Motivation

CC4M has shippable Claude skills but no public surface to share them. A gallery
gives each skill a canonical, shareable URL (good for social + SEO), lets
visitors actually get the skill, and establishes a content type distinct from the
blog and the (separate, image-prompts) `/prompts` effort. Curated + authors-only
keeps the editorial bar high with zero auth/moderation surface.

> **Not** the image-prompts `/prompts` gallery
> (`docs/brainstorms/2026-05-09-prompts-gallery-brainstorm.md`,
> `docs/plans/2026-05-09-001-feat-prompts-gallery-plan.md`) — that one is
> Emdash-D1-backed image prompts. This `/skills` feature is a separate,
> content-collection-backed feature. The decision to **not** use D1 for skills
> v1 is intentional (brainstorm: Approach B).

## Proposed Solution

Clone the blog's visual/structural patterns; swap the data layer to a static
Content Collection; add an R2-backed download route and OG support.

1. **`skills` Content Collection** in `src/content.config.ts` (Zod schema), files
   under `src/content/skills/*.md`. Frontmatter holds metadata; markdown body is
   the SKILL.md content rendered inline.
2. **Index `/skills/index.astro`** (`prerender = false`) — `getCollection('skills')`,
   filter out drafts, render the card grid + `CollectionPage`/`BreadcrumbList`
   JSON-LD + empty state.
3. **Detail `/skills/[slug].astro`** (`prerender = false`) — `getStaticPaths`-free
   SSR lookup by slug (mirror `blog/[slug].astro` 404 redirect), `render()` the
   body, three affordances + "How to install" block, single JSON-LD type +
   `BreadcrumbList`.
4. **Download route `/skills/[slug]/download.skill.ts`** (`prerender = false`) —
   validate slug against the collection, `env.MEDIA.get(r2Key)` (mirror
   `src/pages/og/blog/[slugHash].png.ts:39-43`), stream with
   `Content-Disposition: attachment`, 404 (not 500) on miss, `noindex`.
5. **OG**: add `'skills'` to `OgPageKey` (`src/lib/og/url.ts`) + a `skills` entry
   in `STATIC_PAGES` (`src/lib/og/build.ts`); re-run `npm run prebuild` →
   `public/og/pages/skills.png`. Per-skill OG deferred (open question).
6. **SEO wiring**: `skillPages` array + `customPages` + a `serialize()` branch in
   `astro.config.mjs`; entries in `public/llms.txt` + `public/llms-full.txt`; one
   durable nav/footer entry point.

## Technical Considerations

- **SSR everywhere (no prerender).** Documented: prerendered pages get hijacked
  by Emdash setup-check middleware. Both routes + the download + any OG endpoint
  use `export const prerender = false`. (Learning:
  `docs/solutions/integration-issues/emdash-astro6-cloudflare-workers-setup.md`.)
- **Content Collection under SSR is unproven on this site** — it must be spiked
  before building (Phase 1). Verify `render()` returns rendered HTML on a real
  Cloudflare preview (not just `astro dev`) and that the static `skills`
  collection doesn't collide with Emdash's live collection in `src/live.config.ts`.
- **Download via Astro SSR route, not a Pages Function.** (SpecFlow corrected the
  brainstorm: a `functions/` dir *does* exist — `functions/api/subscribe.js` —
  but this is a **Workers** project where that convention is ignored. The real
  reason for an SSR route is to reuse the R2-read pattern already proven in
  `src/pages/og/blog/[slugHash].png.ts`.) R2 binding is `MEDIA` (`wrangler.jsonc`).
- **Slug-validate before building the R2 key** — only fetch keys for slugs that
  exist in the collection (no `../../secret.skill` traversal / arbitrary fetch).
- **Copy buttons are free** — `CodeBlockCopy.astro` (rendered once in
  `BaseLayout.astro:209`) auto-injects a copy button on every `<pre>`. The inline
  SKILL.md's fenced code blocks get them with zero wiring. (Caveat: it has no
  `aria-live` and a weak failure fallback — extend only if we surface a dedicated
  "copy install command" later.)
- **JSON-LD: pick ONE type, don't hedge.** Index = `CollectionPage` +
  `BreadcrumbList`. Detail = **`SoftwareApplication`** (`applicationCategory:
  "DeveloperApplication"`, `operatingSystem`, `offers` free) + `BreadcrumbList`.
  Partial schema fails Google's Rich Results Test, so commit fully.
- **Design tokens / card signature**: reuse `--rust`, `--mustard`, `--border-color`,
  `--shadow-sm`, `--font-display`; hover = `translate(-4px,-4px)` +
  `box-shadow: 8px 8px 0 var(--mustard)` + rust border. Honor
  `prefers-reduced-motion`.
- **Title length** ≤ 60 chars including the `| Claude Code for Marketers` suffix.
- **Trailing slashes** on all internal links; unknown slug → `/404` redirect.

## System-Wide Impact

- **Interaction graph**: A request to `/skills/<slug>/` hits Astro SSR → Emdash
  middleware (must pass through, not intercept) → `getCollection('skills')` +
  `render()`. The download route hits the `MEDIA` R2 binding. OG resolution flows
  through `resolveOgImage()` → `/og/pages/skills.png` (build-time asset).
- **Error propagation**: unknown slug → `Astro.redirect('/404')` (mirror
  `blog/[slug].astro:16`). Missing R2 object → **404, never 500** + on-page
  "download unavailable, use GitHub" fallback. `env.MEDIA` undefined in local dev
  → graceful degrade (mirror the OG route's tolerance).
- **State lifecycle risks**: source-of-truth divergence — inline SKILL.md
  (`src/content/skills/*.md`) vs. the downloaded `.skill` (R2). Define a sync rule
  (the repo markdown is canonical; the `.skill` is packaged from the same commit)
  and document the packaging/upload step so the two can't drift.
- **API surface parity**: `customPages` + `serialize` in `astro.config.mjs`,
  `OgPageKey` union + `STATIC_PAGES`, `llms.txt` + `llms-full.txt` — every one is
  a **hand-maintained** list. Adding a skill touches all of them; until a
  `/publish-skill` skill exists (deferred), this is a documented manual checklist.
- **Integration test scenarios**:
  1. Cloudflare preview deploy: `/skills/<slug>/` returns 200 with rendered
     `<Content/>` HTML (the spike's core assertion).
  2. `/skills/` with 0 published skills → `noindex` + friendly empty state, layout
     intact.
  3. Download of a slug whose `.skill` is absent from R2 → 404 + page fallback,
     no 500.
  4. Emdash blog still renders and `_emdash` live collection unaffected
     (regression).
  5. `sitemap.xml` post-deploy contains every `/skills/*` URL.

## Implementation Phases

### Phase 1 — Spike (GATE: must pass before Phase 2) — ✅ PASSED 2026-06-09

- [x] Add a throwaway `skills` collection + one `src/content/skills/test.md`.
- [x] Stub `src/pages/skills/[slug].astro` with `prerender = false`,
      `getCollection` + `render` + `<Content/>`.
- [x] Confirm `/skills/test/` returns 200 with rendered HTML in the **workerd
      Cloudflare runtime** (`wrangler dev --local`, all D1/R2/Emdash bindings
      active — a faithful production proxy, stronger than `astro dev`).
- [x] Confirm Emdash `src/live.config.ts` middleware doesn't intercept/error on
      `/skills/*` (no `/_emdash/admin/setup` redirect); static `skills` collection
      coexists with the live `_emdash` collection; `astro sync` clean; blog index
      regression 200.
- [x] Unknown slug → `/404` (302) verified.
- [x] Copy button auto-injects on `<pre>` (`code-copy-btn` present via BaseLayout).

**Result:** Content-Collection-under-SSR is proven on this site. **No fallback
needed** — Phase 2 builds directly on this pattern. (Raw `?raw` import fallback
remains the documented contingency if a future Emdash upgrade regresses this.)

### Phase 2 — Index + Detail (static content) — ✅ DONE

- [x] `src/content.config.ts`: add `skills` collection + Zod schema —
      `name`, `description`, `tags` (optional), `repo` (url, optional),
      `skillFile` (optional), `author` (optional), `draft` (default false),
      `publishedAt`, `updatedAt` (optional). (Slug derives from filename.)
- [x] `src/content/skills/<slug>.md` × 2 launch skills (naming, brand-voice;
      realistic placeholders, body = SKILL.md).
- [x] `src/pages/skills/index.astro` (`prerender = false`): grid, drafts filtered,
      empty state (`noindex` when 0), `CollectionPage` + `BreadcrumbList` JSON-LD,
      `BaseLayout` with `ogPageKey="skills"`, `showCourseSchema={false}`,
      `showBreadcrumb={false}`. Grid uses `auto-fill` + `minmax(280px,320px)` +
      `justify-content:start` so 1–2 cards left-align. `prefers-reduced-motion`
      honored.
- [x] `src/pages/skills/[slug].astro` (`prerender = false`): SSR lookup, 404 on
      miss, `render()` body, three affordances, **"How to install" block**,
      conditional GitHub link (hidden if `repo` absent),
      `SoftwareApplication` + `BreadcrumbList` JSON-LD.

### Phase 3 — Download route + R2 — ✅ DONE (route); ⏳ upload deferred

- [x] `slug → R2 key` contract documented: object key is `skills/<skillFile>`
      (e.g. `skills/naming.skill`). MVP upload = manual `wrangler r2 object put`
      (see Open Questions / packaging step).
- [x] `src/pages/skills/[slug]/download.skill.ts` (`prerender = false`):
      slug-validate against collection (traversal-safe) → `env.MEDIA.get(key)` →
      stream with `Content-Type: application/octet-stream` +
      `Content-Disposition: attachment; filename="<slug>.skill"` +
      immutable `Cache-Control` + `X-Robots-Tag: noindex`; **404 (not 500)** on
      miss (verified locally); dev-safe when `env.MEDIA` undefined.
- [x] Detail page shows a "download unavailable — use GitHub" fallback when no
      `skillFile` is set.
- [ ] **Upload the actual `.skill` files to R2** (`skills/naming.skill`,
      `skills/brand-voice.skill`) — pending real packaged artifacts.

### Phase 4 — OG, SEO, discoverability — ✅ DONE

- [x] `src/lib/og/url.ts`: added `'skills'` to `OgPageKey`.
- [x] `src/lib/og/build.ts`: added `skills` to `STATIC_PAGES`;
      `public/og/pages/skills.png` emitted (42 KB, verified).
- [x] `astro.config.mjs`: `skillPages` array (index + both skills, trailing
      slashes) → `customPages`; `serialize()` branch for `/skills/`; sitemap
      filter excludes `/download.skill`. Sitemap output verified.
- [x] `public/llms.txt`: `Skills:` line under `## Site Structure` + `## Skills`
      section. `public/llms-full.txt`: `## Skills` section with per-skill
      Path / Description / Install / What-it-does blocks.
- [x] Durable entry point: `Skills` added to header nav (`src/config/siteData.ts`).
- [ ] Re-run `/seo-audit` after deploy; verify `curl robots.txt` has no
      Cloudflare-managed AI-bot block re-enabled. (Post-deploy.)

## Acceptance Criteria

**Spike gate** — ✅ PASSED 2026-06-09 (workerd via `wrangler dev --local`)
- [x] `/skills/test/` returns 200 with rendered `<Content/>` HTML in the
      Cloudflare workerd runtime.
- [x] Emdash `src/live.config.ts` doesn't intercept `/skills/*`; static + live
      collections coexist.
- [x] Fallback path documented (raw `?raw` import) — not needed; spike passed.

**Functional**
- [ ] `/skills/` renders all non-draft skills as cards (name, description, tags).
- [ ] 0-skill state → `noindex` + friendly message, layout intact; 1–2 card grids
      left-align.
- [ ] `/skills/<slug>/` renders name, description, tags, inline SKILL.md, and
      every available affordance.
- [ ] Unknown slug → `/404` redirect, verified under SSR on Cloudflare.
- [ ] Skill with no `repo` hides the GitHub affordance cleanly.
- [ ] Detail page includes an explicit, copy-pasteable **"How to install this
      skill"** section (marketplace command deferred).
- [ ] `draft: true` skills are excluded from index, detail, sitemap, and llms.txt.

**Download route**
- [ ] Serves `.skill` from R2 with `Content-Type` + `Content-Disposition:
      attachment; filename="<slug>.skill"` + `Cache-Control`.
- [ ] Missing R2 object → 404 (not 500) **and** page shows GitHub fallback.
- [ ] `env.MEDIA` undefined (local dev) degrades gracefully.
- [ ] Slug validated against the collection before building the R2 key (no
      arbitrary-key fetch / traversal).
- [ ] Download route is `noindex` and absent from the sitemap.
- [ ] Inline SKILL.md and the downloaded `.skill` are the same version (sync rule
      defined + documented).

**SEO / discoverability**
- [ ] Every `/skills/` and `/skills/<slug>/` URL appears in `sitemap.xml`
      post-deploy, with a `/skills/` `serialize()` branch.
- [ ] `'skills'` added to `OgPageKey` and `STATIC_PAGES`;
      `public/og/pages/skills.png` emitted by the build.
- [ ] `showCourseSchema={false}` + `showBreadcrumb={false}` on both routes; index
      = `CollectionPage` + `BreadcrumbList`, detail = `SoftwareApplication` +
      `BreadcrumbList`, both pass Google Rich Results Test.
- [ ] `llms.txt` + `llms-full.txt` contain every skill.
- [ ] At least one durable nav/footer entry point to `/skills/`.
- [ ] Trailing-slash canonical enforced.

**Quality gates**
- [ ] Lighthouse a11y ≥ 95 on index + each detail page.
- [ ] Cards: one accessible link per card, non-interactive tags, correct image
      `alt`, keyboard-operable, `prefers-reduced-motion` honored.
- [ ] Download control keyboard-operable with a discernible name.
- [ ] Title ≤ 60 chars incl. suffix.
- [ ] No regression to blog OG, blog index, or the Emdash `_emdash` live
      collection.

## Success Metrics

Gallery live with 1–3 CC4M skills, each with a shareable detail URL, working
GitHub link + `.skill` download + inline SKILL.md + install instructions, indexed
in `sitemap.xml` and `llms.txt`, reachable from a durable nav entry. (Brainstorm
success criteria.)

## Dependencies & Risks

- **Risk (high): Content Collection under SSR is unproven here** → mitigated by
  the Phase 1 spike gate with a documented raw-import fallback.
- **Risk (med): prerender hijack** by Emdash middleware → mitigated by
  `prerender = false` on every route, asserted on a real preview deploy.
- **Risk (med): hand-maintained sitemap/llms.txt/customPages drift** → documented
  manual checklist for MVP; a `/publish-skill` skill (deferred) automates later.
- **Risk (low): `.skill` ↔ SKILL.md version drift** → repo markdown canonical,
  `.skill` packaged from same commit; documented.
- **Dependency: marketplace** does not exist → copy-install affordance + the
  `/publish-skill` skill are explicitly out of scope (brainstorm: Resolved Q1/Q4).

## Open Questions (carried from brainstorm + research)

1. **Per-skill OG image** — reuse the single `skills.png` page key for all skills
   (cheap, ship now), or add a build-time per-skill OG (extend `build.ts` to
   iterate `src/content/skills`, emit `public/og/skills/<slug>.png`, add a
   `resolveOgImage` branch)? *Lean: single key for MVP.*
2. **`.skill` packaging step** — manual `wrangler r2 object put` for MVP vs. a
   build script. *Lean: manual for 1–3 skills.*
3. **Tag interactivity** — decorative now (non-interactive chips); add
   `/skills/?tag=` filter only past ~15 entries.

## Sources & References

### Origin
- **Brainstorm:** [docs/brainstorms/2026-06-09-skills-gallery-brainstorm.md](../brainstorms/2026-06-09-skills-gallery-brainstorm.md)
  — carried forward: Approach B (static repo-file MVP, defer D1); three
  get-affordances at launch (copy-install deferred); general CC4M positioning;
  1–3 launch skills; launch without the marketplace.

### Internal references
- `src/pages/blog/index.astro` — card grid + `CollectionPage` JSON-LD (clone).
- `src/pages/blog/[slug].astro:16` — SSR 404 redirect pattern; prose CSS.
- `src/pages/modules/[...slug].astro` — `getCollection` + `render` + `<Content/>`.
- `src/content.config.ts` — collection + Zod schema location.
- `src/live.config.ts` — Emdash live-collection collision check (spike).
- `src/pages/og/blog/[slugHash].png.ts:39-43` — R2-read pattern for the download.
- `src/lib/og/url.ts:17` — `OgPageKey` union; `src/lib/og/build.ts:126` —
  `STATIC_PAGES`.
- `astro.config.mjs:50,69,77` — `blogPages`/`customPages`/`serialize`.
- `src/layouts/BaseLayout.astro:209` — `CodeBlockCopy` global include.
- `src/components/CodeBlockCopy.astro:49` — weak failure fallback, no `aria-live`.
- `wrangler.jsonc` — `MEDIA` (R2), `DB` (D1) bindings.

### Learnings (docs/solutions/)
- `integration-issues/emdash-astro6-cloudflare-workers-setup.md` — **prerender is
  poison**; SSR everywhere; trailing slashes; no `not_found_handling`.
- `integration-issues/workers-og-bundle-size-measurement.md` — OG endpoints need
  `prerender=false`; Satori rejects WOFF2; no `_`-prefixed route files.
- `integration-issues/emdash-d1-blog-post-publishing-workflow.md` — SSR routes
  invisible to sitemap → hand-add to `customPages`.
- `seo-issues/comprehensive-seo-aeo-audit-fixes.md` — `showCourseSchema={false}` +
  `showBreadcrumb={false}`; manually update `llms.txt`; verify robots.txt.
- `integration-issues/cloudflare-workers-assets-with-api-routes.md` — Workers (not
  Pages); R2 downloads via SSR route + `MEDIA` binding.

### Related work
- `docs/plans/2026-05-09-001-feat-prompts-gallery-plan.md` — the *separate*
  `/prompts` image-gallery (D1-backed); pattern reference only, not this feature.
