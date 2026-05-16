---
title: "Author Pages: Personal Sections & Prompt Library"
type: feat
status: completed
date: 2026-04-29
origin: docs/brainstorms/2026-04-29-author-page-personal-prompts-brainstorm.md
---

# Author Pages: Personal Sections & Prompt Library

## Overview

Upgrade `/blog/authors/{slug}` from a generic profile into a personal homepage with four new content sections (long-form intro, "Now" block, tools/stack, topics) plus a per-author **prompt library** with 3-4 ready-to-copy prompts (2 templated + 1-2 hand-written per author). First-pass extracts the inline `AUTHORS` array (currently duplicated across two `.astro` files) into a shared TypeScript module so both pages stay in sync as the schema grows.

This is a **content + UX** upgrade, not an architectural shift. No new dependencies, no external integrations, no schema changes to Emdash. The risk surface is small; the editorial surface (persuading authors to actually write their intros) is bigger than the engineering surface.

## Problem Statement / Motivation

The author page shipped earlier today (commit `8212c66`) is functionally complete but feels generic:

- **Same shape for every author.** The bio is one short paragraph; the AI prompt is a single boilerplate sentence; nothing tells the reader who this person actually is or what they're working on.
- **Single AI prompt is weak.** A lone "Ask Claude about {Author}'s approach…" line provides no real value — readers don't know what to do with it. A small library of distinct, actionable prompts (learn their style, find their work, remix their voice) is the difference between a decoration and a tool.
- **`AUTHORS` array duplicated in two files.** `src/pages/blog/authors.astro:11-32` and `src/pages/blog/authors/[slug].astro:8-29` carry the exact same data. Documented institutional precedent (`docs/solutions/ui-bugs/portabletext-toc-anchor-links-missing-heading-ids.md` — the `slugify()` duplication case) shows this class of drift causes real bugs. About to add 5 new fields per author; duplication will get worse fast.

The current page is a foundation, not a finished product. This plan finishes it.

## Proposed Solution

### Data layer (foundation)

Extract `AUTHORS` to **`src/data/authors.ts`** as a typed module. Define an `Author` interface with the existing fields (`name`, `role`, `bio`, `avatar`, `links`) plus five new optional fields:

- `intro?: string` — multi-paragraph first-person intro, paragraphs separated by blank lines (`\n\n`)
- `now?: { text: string; updatedAt: string }` — "What I'm working on now" with an ISO date
- `tools?: Array<{ name: string; url?: string; why: string }>` — daily-driver tools with one-line rationale
- `topics?: string[]` — hand-curated tag chips (5-8 strings)
- `customPrompts?: Array<{ label: string; prompt: string }>` — 0-2 hand-written prompts per author

Both `authors.astro` and `authors/[slug].astro` import from this module. The hub page only needs `name | role | bio | avatar | links` (existing fields); the new fields are exclusively consumed by the detail page.

### Personal sections (in display order on `[slug].astro`)

After the existing breadcrumb + profile + social links, before the existing prompt block:

1. **Long-form intro** — render `intro` as a sequence of `<p>` elements split on `\n\n`. Falls back to `bio` if `intro` is missing. Sits inside a `.author-intro` block under the profile.
2. **"Now" block** — small dated callout with `now.text` and a "Last updated {date}" footer. Hidden entirely if `now` is missing — never show "no updates."
3. **Tools & stack** — bordered list rendering `tools` as `<ul>` of `{name, why}` lines. Names link out via `url` if present. Hidden if `tools` is missing or empty.
4. **Topics** — chip row rendering `topics` as `<span class="topic-chip">` elements (NOT `<button>` — they're not interactive). Hidden if missing/empty.

**Note on topics**: The brainstorm proposed deriving topics from post tags. **The Emdash `Post` interface has no `tags` field** (verified in `emdash-env.d.ts:20-32`). Auto-derivation is not viable without a schema change. Plan deviates from brainstorm: topics are **hand-curated** in the data file. This keeps the hybrid spirit (some auto, some hand) while avoiding a half-baked keyword-extraction heuristic that nobody will trust.

### Prompt library (replaces the existing single-prompt block)

Create **`src/lib/author-prompts.ts`** exporting `buildAuthorPrompts(author: Author): PromptCard[]`. Returns an array of `{ label, prompt }`:

1. **Templated prompt 1 — Learn their style**: `"You are about to read excerpts from {Author Name}'s writing. Their voice is {role-derived hint}. After reading, write a short piece in their voice on a topic of my choosing."`
2. **Templated prompt 2 — Find their work on a topic**: `"I want to read what {Author Name} has written on a specific topic. Their main themes are: {topics joined or 'AI marketing, Claude Code'}. Suggest which of their CC4.Marketing posts would help me with {my topic}."`
3. **0-2 custom prompts** from `author.customPrompts` (if defined).

Each prompt renders as a card with: small label (uppercase), prompt text in a `<pre>` (so unstyled-JS users can manually copy), and a copy button using the existing `CodeBlockCopy.astro` pattern (clipboard API, "Copied!" feedback, 2000ms reset).

### Hub page (`/blog/authors`)

Minimal change: replace the inline array with `import { AUTHORS } from '../../data/authors'`. No UI changes — the grid layout shipped today is still correct.

## Technical Considerations

### Architecture impacts

- New module: `src/data/authors.ts` (data + type)
- New module: `src/lib/author-prompts.ts` (templated prompt builder)
- Touches: `src/pages/blog/authors.astro`, `src/pages/blog/authors/[slug].astro`
- No new npm dependencies. No build-pipeline changes. No D1 / R2 / KV touches.

### Performance

- Static SSR-rendered content; templated prompts are computed at request time but each call is a few string operations. Negligible impact.
- No additional asset weight (no new images, fonts, or scripts beyond the small inline copy-button JS).

### Security

- **Long-form intro is plain string content rendered as `{paragraph}` text inside `<p>`** — Astro auto-escapes. No `set:html`, no XSS risk.
- **Prompts are rendered into `<pre>` as text** — same auto-escape, same safety.
- **Tool URLs**: rendered as `<a href={url} target="_blank" rel="noopener noreferrer">`. URL is author-controlled but the data file is in our repo (not user-submitted). No additional sanitization needed at the URL level beyond what Astro provides.
- **Copy button JS reads from a known DOM element via `data-clipboard-target`** — no user input feeds the clipboard write.

### Accessibility

- Copy button needs `aria-live="polite"` region (or `aria-live` on the button itself) so the "Copied!" state is announced. The existing `CodeBlockCopy.astro` does not do this — opportunity to fix the pattern site-wide, but scope-creep risk; **do it inline on the prompt buttons only** for this PR.
- Topics chips are `<span>`, not `<button>` (non-interactive). No keyboard/focus handling needed.
- Tools list is a `<ul>` for proper semantics.
- Headings stay in hierarchy: page H1 (author name), section H2s (Intro, Now, Tools, Topics, Prompts, Articles).

### Markdown rendering decision

Considered three options for the long-form intro:
- **(a) Plain text + paragraph split** ← chosen for v1. Zero deps, zero risk, ~5 lines of code. Authors can't bold/link inline but can structure with paragraphs.
- **(b) Add `marked` or `markdown-it`**. Adds ~50KB dep for one feature. YAGNI violation. Reject.
- **(c) One Astro fragment per author**. Maximum expressiveness (full Astro inside an intro), but creates an N-files-per-author maintenance pattern. Overkill for two authors. Reject for v1, revisit if intros get too constrained.

If authors push back on plain text, swap to (c) — each author owns `src/components/authors/{slug}-intro.astro` and the page dynamically imports. Documented as a future enhancement, not built now.

## System-Wide Impact

- **Interaction graph**: Page request → `getEmDashCollection('posts')` (existing) → filter by byline slug (existing) → render new sections from `src/data/authors.ts` (new) + render `buildAuthorPrompts(author)` (new). No new callbacks, no middleware changes. The existing breadcrumb + profile + posts pipeline is unchanged.
- **Error propagation**: Author missing from data file → `Astro.redirect('/404')` (existing behavior preserved). Missing optional field → conditional rendering hides the section. `buildAuthorPrompts` always returns at least the 2 templated prompts, so the prompt library never renders empty.
- **State lifecycle risks**: None. Page is fully static SSR per request; no persistence, no orphaned state.
- **API surface parity**: `AUTHORS` is now imported by both `/blog/authors` (hub) and `/blog/authors/{slug}` (detail). Adding a new author requires editing one file. The OG image engine for `/blog/authors` (build-time, see `src/lib/og/build.ts`) does not consume the new fields, so its build is unaffected.
- **Integration test scenarios**:
  1. Visit `/blog/authors/tri-vo` → all four sections render with content.
  2. Author with no `now` → "Now" section absent (not shown empty).
  3. Author with no `customPrompts` → prompt library shows exactly the 2 templated prompts.
  4. Click any prompt's copy button → clipboard contains the prompt text exactly; button shows "Copied!" then resets after 2s.
  5. Visit `/blog/authors` → hub still renders, cards still link to detail pages (regression check on the data extract).
  6. Build `npm run build` → no TypeScript errors after extracting the data type.

## Acceptance Criteria

### Data foundation
- [x] `src/data/authors.ts` exists with `Author` interface and `AUTHORS` export
- [x] Inline `AUTHORS` removed from both `src/pages/blog/authors.astro` and `src/pages/blog/authors/[slug].astro`
- [x] Both pages import from the new module; build passes (`npm run build`) with no TS errors
- [x] Both existing authors (Tri Vo, Alice Marketer) have content authored for all five new fields

### Personality sections
- [x] Long-form intro renders as multiple paragraphs when `intro` has `\n\n` separators
- [x] Falls back to `bio` if `intro` is missing
- [x] "Now" block shows `text` + "Last updated {formatted date}"; hidden when `now` is missing
- [x] Tools list renders names as links when `url` is present, plain text otherwise; hidden when empty
- [x] Topics render as chip-styled `<span>` elements that wrap on narrow viewports; hidden when empty
- [x] Section headings (H2) follow correct hierarchy under the author H1

### Prompt library
- [x] `src/lib/author-prompts.ts` exports `buildAuthorPrompts(author)` returning at least 2 prompts
- [x] Two templated prompts always present, with `{Author Name}`, `{role hint}`, `{topics}` interpolated correctly
- [x] Custom prompts (if any) render after the templated ones with their custom labels
- [x] Each prompt has a working copy button (clipboard API), shows "Copied!" feedback, resets after 2s
- [x] Prompt text renders inside `<pre>` so JS-disabled users can still select and copy manually

### Quality
- [x] No TypeScript errors
- [x] No console errors at runtime
- [ ] Lighthouse accessibility score ≥ 95 for `/blog/authors/tri-vo` (deferred — verify post-deploy)
- [x] Mobile layout (320px) — all sections stack vertically, no horizontal overflow
- [x] Schema.org `Person` JSON-LD includes the new `intro` (as `description`) and `topics` (as `knowsAbout`)
- [x] Meta description on detail page uses the first paragraph of `intro` (or falls back to bio) — under 160 chars

## Success Metrics

- ✅ Each author page feels distinct from the others — visually skim-test confirms different sections, different prompts, different vibes
- ✅ Adding a third author takes < 30 minutes (data file edit + content authoring), zero code changes
- ✅ Copy button works in Chrome, Safari, Firefox on macOS + iOS Safari + Android Chrome
- ✅ No regressions on `/blog/authors` hub page (cards still link, layout still grid)
- ✅ Build time unchanged (no new compile-time work)

## Dependencies & Risks

### Dependencies
- Existing copy-button pattern: `src/components/CodeBlockCopy.astro` (lines 33-56) and `src/pages/brand-guide.astro` (lines 238-256). Reuse, don't reinvent.
- Existing design tokens in `src/styles/global.css` (rust/plum/mustard/cream palette, spacing, shadows). All new sections use tokens; no hardcoded colors.
- Emdash post collection (already in use). No schema changes.
- Existing author avatars in `public/authors/` (already in use). No new assets needed unless authors want updated photos.

### Risks
- **Editorial bottleneck**: Authors need to actually write 200-400 word intros, define their tools list, write 1-2 custom prompts. Engineering can land empty data fields, but the page won't feel personal until content lands. **Mitigation**: ship the engineering with placeholder content the authors can edit in-place; merge editorial copy as it arrives.
- **Markdown limitation in intros**: Plain-text + paragraph-split means no inline links / bold / lists. **Mitigation**: documented as a known v1 limitation; escape hatch is per-author Astro fragments (rejected for v1, revisit later if needed).
- **Templated prompts feel generic**: If both templated prompts read the same across all authors, the "personal" framing is undermined. **Mitigation**: interpolate enough author-specific data (name, role, topics) that each rendering is materially different. Validate by reading the rendered prompts for each author side-by-side before merging.
- **Clipboard API browser support**: `navigator.clipboard.writeText` requires HTTPS and a secure context. Production is HTTPS so this works; local `npm run dev` over `http://localhost` also gets the secure-context exception. **Mitigation**: existing pattern in repo already handles this; nothing to add.
- **Schema drift between hub and detail**: After extraction, both pages depend on the same `Author` type. **Mitigation**: TypeScript catches drift at build time. The whole point of the extraction.

## Implementation Phases

### Phase 1 — Data foundation (~30 min)
1. Create `src/data/authors.ts` with `Author` interface (existing fields + new optional fields) and exported `AUTHORS` array.
2. Move existing data into the array unchanged (5 fields per author).
3. Add new field content for both Tri Vo and Alice Marketer (intro, now, tools, topics, customPrompts). Treat as engineering placeholder; real editorial copy can replace later.
4. Replace inline arrays in `authors.astro` and `authors/[slug].astro` with imports.
5. `npm run build` passes.

**Success**: Build clean, both pages render identically to today's deploy.

### Phase 2 — Personality sections (~60 min)
1. Add Intro section to `[slug].astro`: split `intro` on `\n\n`, render `<p>` per paragraph.
2. Add "Now" section: conditional render, formatted date, hide when missing.
3. Add Tools section: `<ul>` with `{name, why}`, name links via `url`.
4. Add Topics section: chip row of `<span>` elements.
5. Style with existing tokens. Test on 320px / 768px / 1200px viewports.
6. Update meta description to derive from `intro`.
7. Update Person schema with `description` (intro first para) and `knowsAbout` (topics).

**Success**: All four sections render on `tri-vo`; missing-section fallbacks tested manually by temporarily blanking fields in the data file.

### Phase 3 — Prompt library (~45 min)
1. Create `src/lib/author-prompts.ts` with `buildAuthorPrompts(author)` returning `PromptCard[]`.
2. Replace the existing single-prompt block in `[slug].astro` with a `.prompt-library` section that maps over `buildAuthorPrompts(author)`.
3. Render each as a card: label + `<pre>` with prompt text + copy button.
4. Inline copy script (clipboard API + "Copied!" feedback + 2000ms reset). Use the brand-guide pattern.
5. Add `aria-live="polite"` to the button feedback for accessibility.
6. Test copy in Chrome, Safari, Firefox; on iOS Safari verify the secure-context behavior.

**Success**: All prompts copy correctly across browsers; `aria-live` announces the state change.

### Phase 4 — Polish + ship (~15 min)
1. Verify mobile layout end-to-end on 320px.
2. Verify schema.org Person fields with `npx schema-validator` or a manual JSON-LD inspection.
3. Smoke test `/blog/authors` hub still works.
4. `/ship` to production. Verify post-deploy HTTP 200 on both author pages.
5. Update CHANGELOG `### Added` with one bullet for the personality sections + prompt library.

**Success**: Live in production, smoke tests pass, no console errors.

## Sources & References

### Origin Brainstorm
- **Brainstorm**: [docs/brainstorms/2026-04-29-author-page-personal-prompts-brainstorm.md](../brainstorms/2026-04-29-author-page-personal-prompts-brainstorm.md)
  - Key decisions carried forward:
    1. Four personality sections in order: intro → now → tools → topics
    2. Hybrid prompt sourcing: 2 templated + 1-2 custom per author
    3. Copy buttons are non-negotiable
    4. Light visual treatment in v1 (no per-author color/hero) — content does the work
  - Deviation: brainstorm proposed auto-deriving topics from post tags. **Emdash posts have no tags field**; topics are hand-curated instead. Resolves brainstorm Open Question #1 (where intro lives) → in `src/data/authors.ts` as multi-paragraph string.
  - Deferred: copy-event analytics tracking (brainstorm Open Question #2). Wire later when Beam custom-event API is added repo-wide.

### Internal References
- **Current author detail page**: `src/pages/blog/authors/[slug].astro` (the file shipped today, commit `8212c66`)
- **Current author hub**: `src/pages/blog/authors.astro:11-32` (duplicated `AUTHORS` array)
- **Byline data shape**: `emdash-env.d.ts:20-32` (Post interface — note absence of `tags`)
- **Copy-button reference 1**: `src/components/CodeBlockCopy.astro:33-56`
- **Copy-button reference 2**: `src/pages/brand-guide.astro:238-256`
- **Design tokens**: `src/styles/global.css:5-58`
- **Existing prompt-box style** (to replace): `src/pages/blog/authors/[slug].astro:325-349` (`.author-ai-prompt`)

### Related Solutions
- **Helper duplication precedent**: `docs/solutions/ui-bugs/portabletext-toc-anchor-links-missing-heading-ids.md` — recommends extracting duplicated helpers (the `slugify()` case) to `src/lib/`. Same pattern applies to `AUTHORS`.
- **PortableText custom blocks**: `docs/solutions/ui-bugs/portabletext-missing-code-image-handlers-BlogPublisher-20260426.md` — only relevant if we change our minds and render intros as PortableText (we won't in v1).
- **Astro interactive components**: `docs/solutions/ui-bugs/astro-mobile-nav-hamburger-drawer.md` — copy buttons render server-side and attach via `<script>` (no client directive). Applies directly to the prompt copy buttons.
- **Critical patterns**: `docs/solutions/patterns/cora-critical-patterns.md` — render Emdash content via `<BlogContent>`, never bare `PortableText`. Author intros are not Emdash content, so this doesn't apply, but worth knowing.

### Conventions
- **`AGENTS.md`**: components in `src/components/` PascalCase; pages in `src/pages/`; layouts in `src/layouts/`. No formatter, no linter, no tests — validate via `npm run build` + `npm run preview`. Conventional commits.

## Future Considerations

- **Per-author Astro fragments for intros** — escape hatch if plain-text paragraphs feel too constrained.
- **Beam custom event tracking** on copy-button clicks (and prompt selection). Wait for the repo-wide Beam event helper to land first.
- **"Now" RSS feed** so readers can subscribe to author updates (brainstorm Open Question #4). Out of scope for v1.
- **Author RSS feeds** — per-author article RSS at `/blog/authors/{slug}/rss.xml`. Mentioned in the prior plan's "Post-Implementation Considerations." Different feature; defer.
- **OG image variant for author detail pages** — current `ogPageKey="author"` may not match an existing build-time asset. Verify at ship time; if missing, add to `src/lib/og/build.ts`.

## Next Steps

→ `/ce:work` to implement (Phase 1 → 2 → 3 → 4 in order)
