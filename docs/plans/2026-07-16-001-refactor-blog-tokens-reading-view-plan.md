---
title: "refactor: Blog ink token system and reading-view rebrand (round 1)"
type: refactor
status: completed
date: 2026-07-16
origin: docs/brainstorms/2026-07-16-blog-tokens-reading-view-rebrand-requirements.md
---

# refactor: Blog ink token system and reading-view rebrand (round 1)

## Summary

Land the round in five dependency-ordered units: define the solid ink/tint/shadow/sheet tokens in `src/styles/global.css` with a committed contrast-and-grep check script, build the blog prose layer and code-block frame on those tokens, decompose `src/pages/blog/[slug].astro` into masthead/TOC/nav/CTA components composed into the document-on-desk sheet, run the mechanical literal-to-token swap on blog index and author pages, then verify against the origin's acceptance examples on the deployed Worker.

---

## Problem Frame

The post reading view is the least branded page and its styles have drifted into ad-hoc rgba tints, an off-brand gray, and translucent shadows that contradict brand rules and break silently across the dark-mode token swap. Full framing in the origin document (see Sources & References).

---

## Requirements

Traceability to origin R-IDs (docs/brainstorms/2026-07-16-blog-tokens-reading-view-rebrand-requirements.md):

- R1-R5: solid ink ramp, tint steps, solid shadows, token-level dark swap, recorded contrast checks
- R6, R14: document-on-desk sheet with per-theme sheet-surface token, spec-plate masthead (no-excerpt collapse, wrapping titles), featured image inside the sheet
- R7, R8, R12: decomposition into token-only components + prose layer (~65ch, persistent underlined links), shared slugify
- R9: code-block frame SSR on the pre element; blog-scoped copy-button styling (CodeBlockCopy is sitewide)
- R10, R11: bordered sheet near full-bleed on phones, internal overflow only; TOC as native details on mobile (default closed, after masthead), token-restyled sidebar on desktop
- R13: index/author pages get a mechanical literal-to-token swap only; non-blog pages inherit passively

**Origin acceptance examples:** AE1 (dark swap traces to tokens on blog-owned surfaces), AE2 (375px internal scroll + visible sheet border), AE3 (documented contrast ratios both themes), AE4 (back catalog upgrades, D1 untouched), AE5 (no raw colors in blog files outside global.css)

---

## Scope Boundaries

Carried from origin: WindowFrame figure family, terminalSession block, captions, Frame chassis primitive, governance pipeline (lint gate in CI, /styleguide, OG single-source, theme-color meta), sitewide non-blog restyle, responsive rework, dek copywriting. No PortableText schema or publish tooling changes; no `export const prerender = true` anywhere.

### Deferred to Follow-Up Work

- TOC active-section highlighting: the current IntersectionObserver script is broken in production (`NodeList.filter` TypeError at `src/pages/blog/[slug].astro:346`), so this round ships a JS-free TOC; re-add highlighting later if wanted
- Promoting `scripts/check-blog-tokens.mjs` into a CI gate: governance round
- Non-blog raw rgba migration (Hero, Footer, LessonSidebar, ModuleCard): unowned, flagged in origin review

---

## Context & Research

### Relevant Code and Patterns

- `src/styles/global.css`: token definitions; dark mode = one variable swap in `html[data-theme="dark"]` (lines 64-76); `--text-secondary: #666666` (:40), translucent shadows (:57-59); `.code-copy-btn` styles with `opacity: .8`
- `src/pages/blog/[slug].astro`: 833 lines inline styles; TOC drawer JS (broken `.filter` at ~346); slugify duplicated with `src/components/BlogContent.astro:21` (byte-identical)
- `src/components/BlogContent.astro`: segment router; code segment renders bare `pre/code` (line 53); never render custom types outside it
- `src/components/CodeBlockCopy.astro`: mounted sitewide in `src/layouts/BaseLayout.astro` (~line 222); JS wraps every `pre` and injects the button at runtime; also serves lesson/changelog code blocks
- `src/layouts/LessonLayout.astro`: owns a `.prose` class with `:global` pre/code rules; blog prose layer must NOT reuse that class name
- rgba consumers to swap: `[slug].astro:563/571/725`; `blog/index.astro:116/141` (one gradient); `blog/authors.astro:103/128` (one gradient); `blog/authors/[slug].astro:274/480/482/511`
- `body { overflow-x: hidden }` (global.css:93) masks layout escapes; AE2 checks scroll width + visible border instead

### Institutional Learnings

- `docs/solutions/integration-issues/emdash-astro6-cloudflare-workers-setup.md`: never mix prerender with Emdash middleware; smoke test must check `curl -w "%{url_effective}"`, not just status; verify on deployed Worker, `astro dev` masks failures
- `docs/solutions/ui-bugs/astro-mobile-nav-hamburger-drawer.md`: dark-mode trap: swap once at token level; never write per-theme component overrides referencing already-swapped vars
- `docs/solutions/ui-bugs/portabletext-toc-anchor-links-missing-heading-ids.md`: custom block logic stays centralized in BlogContent; wrap PortableText output rather than mutating library output
- `docs/solutions/integration-issues/emdash-d1-blog-post-publishing-workflow.md`: posts are D1 rows; presentation-only changes upgrade the back catalog with no migration

### External References

- Radix Colors scales (per-theme ramps), USWDS grade tokens (solid pre-computed tints for text surfaces), WCAG G183/F73 (link affordance), 50-75 CPL guidance; cached in the ideation record

---

## Key Technical Decisions

- Solid pre-computed hexes, no runtime alpha: contrast becomes checkable, theme swap safe (origin Key Decisions; see origin doc)
- Token naming: `--ink-100/-70/-50/-30/-12` (text/border/hairline lane derived from charcoal), `--tint-rust-1..3` / `--tint-plum-1..3` (surface lane), `--sheet` (article surface), shadows re-declared solid per theme. Exact hex values are picked at implementation and must pass the U1 contrast check; in-article tints/pairs computed against `--sheet`, on-desk pairs against `--bg-primary`
- Prose layer scoped as `.blog-prose` on the existing article content wrapper, not `.prose`: avoids LessonLayout collision
- Component split: `PostMasthead.astro`, `PostToc.astro`, `PostNav.astro`, `PostCta.astro` with scoped styles + one `src/styles/blog-prose.css`; `[slug].astro` becomes layout + data plumbing
- TOC rebuilt JS-free: shared details/summary markup, CSS-differentiated per breakpoint; drop broken highlighting (deferred)
- Acceptance checks committed as `scripts/check-blog-tokens.mjs` (raw-color grep over blog files + WCAG ratio computation for the token-pair table): keeps AE3/AE5 repeatable pre-governance
- `--shadow-mustard` stays `6px 6px 0 var(--mustard)`: already solid, swaps once at token level, R3/R4-compliant

---

## Open Questions

### Resolved During Planning

- Ramp step count/naming: 5 ink steps + 3 tints per accent + sheet (12-token budget from ideation held)
- Shadow per-backdrop variants: unnecessary; fully opaque shadow colors render identically on any backdrop
- TOC on sheet or desk: desk (origin R6 as reviewed)
- Desktop IntersectionObserver highlighting: dropped this round (broken today, no parity baseline)

### Deferred to Implementation

- Exact hex values per token per theme: picked against the contrast script, not guessable at plan time
- Sheet padding scale at narrow widths: tune visually at 375px during U3
- Whether `blog-prose.css` rules land as a plain stylesheet import or a CSS cascade layer: implementer's call after seeing specificity interactions with global.css

---

## Implementation Units

### U1. Token foundation and check script

**Goal:** Define the complete solid token system in global.css (both themes) and the committed script that proves it.

**Requirements:** R1, R2, R3, R4, R5, sheet token from R6; AE3, AE5 (script side)

**Dependencies:** None

**Files:**
- Modify: `src/styles/global.css`
- Create: `scripts/check-blog-tokens.mjs`

**Approach:**
- Add ink lane (`--ink-100/-70/-50/-30/-12`), tint lanes (`--tint-rust-1..3`, `--tint-plum-1..3`), `--sheet`, and solid shadow values; author the dark block deliberately (dark ramp is not derived from light)
- Redefine `--text-secondary` as an ink step alias so existing consumers shift passively (R13); keep the variable name to avoid touching 20+ non-blog files
- Replace shadow rgba with solid hexes per theme; `--shadow-mustard` unchanged
- Script: (a) grep `src/pages/blog/` + `src/components/BlogContent.astro` for `rgba(`/hex literals outside allowed files, exits non-zero on hits; (b) parse the token block and compute WCAG ratios for a declared pair table (ink steps on `--bg-primary` and on `--sheet`, cream on charcoal, rust on cream, dark equivalents), printing pass/fail per threshold
- Record the pair table + ratios as comments next to the tokens (R5)

**Patterns to follow:**
- Existing `:root` / `html[data-theme="dark"]` structure in global.css; swap-once rule from docs/solutions

**Test scenarios:**
- Covers AE3. Happy path: script run prints every declared pair with ratio and threshold verdict in both themes; all pass
- Covers AE5. Error path: a planted `rgba(0,0,0,.5)` in a blog file makes the grep exit non-zero; removing it passes
- Edge case: `--ink-12` (hairline) is decoration-only and excluded from text-pair thresholds

**Verification:**
- `node scripts/check-blog-tokens.mjs` passes; `npm run build` succeeds; homepage/lesson/changelog eyeballed in both themes (origin success criterion), regressions fixed at token level only

---

### U2. Blog prose layer and code-block frame

**Goal:** One stylesheet owning the article reading experience: measure, rhythm, links, and the token-framed code blocks.

**Requirements:** R8, R9; AE4

**Dependencies:** U1

**Files:**
- Create: `src/styles/blog-prose.css`
- Modify: `src/styles/global.css` (blog-scoped `.blog-prose .code-copy-btn` overrides only if not expressible in blog-prose.css)

**Approach:**
- `.blog-prose` class: `max-width: 65ch` measure, paragraph/heading rhythm, blockquote and inline-code on sheet-relative tints, persistent 2px rust underline with offset + hover change on links
- Code frame renders server-side on the `pre` element (solid charcoal surface, 3px border, hard offset shadow, internal `overflow-x: auto`); copy button alignment scoped under `.blog-prose` so lesson blocks keep their current button; replace the button's `opacity: .8` translucency with solid token colors within blog scope
- No `[data-theme="dark"]` selectors anywhere: tokens only (R4)

**Patterns to follow:**
- `src/components/CodeBlockCopy.astro` runtime wrapper (do not move the frame onto the JS-created wrapper: it does not exist at SSR)
- LessonLayout `.prose` as the counter-example: do not collide

**Test scenarios:**
- Covers AE4. Integration: an existing published post renders framed code blocks with zero D1 changes (verify against the deployed Worker, not astro dev)
- Happy path: prose links visibly underlined at rest in both themes; hover state changes
- Edge case: code block with a 120-char line scrolls inside the frame, frame edges intact
- Error path (JS disabled): pre renders framed without the copy button, no layout break

**Verification:**
- Check script still passes; a real post's body reads at ~65ch with underlined links and framed code in both themes

---

### U3. Post page decomposition and the document-on-desk sheet

**Goal:** Rebuild the reading view as sheet + masthead + furniture composed from tokens and components; shrink [slug].astro to plumbing.

**Requirements:** R6, R7, R10, R11, R12, R14; AE1, AE2

**Dependencies:** U1, U2

**Files:**
- Create: `src/components/blog/PostMasthead.astro`, `src/components/blog/PostToc.astro`, `src/components/blog/PostNav.astro`, `src/components/blog/PostCta.astro`, `src/lib/blog-slugify.ts`
- Modify: `src/pages/blog/[slug].astro`, `src/components/BlogContent.astro` (import shared slugify only)

**Approach:**
- Sheet: article on `--sheet` surface, 3px `--ink-100` border, hard offset shadow, on the `--bg-primary` desk; near full-bleed on phones (border kept, R10)
- PostMasthead: breadcrumb/date row carrying site identity (origin cold-visitor criterion), Righteous title (wraps, never truncates), excerpt row omitted cleanly when absent, author + read-time chips
- Featured image inside the sheet below the masthead, token-restyled container, sheet-width (R14)
- PostToc: shared details/summary markup; desktop styled as an on-desk sidebar card, mobile a details disclosure default-closed rendered after the masthead; delete the drawer/IntersectionObserver script wholesale
- slugify to `src/lib/blog-slugify.ts`, imported by both consumers (R12)
- All extracted rules consume tokens; zero raw colors, zero new dark selectors

**Patterns to follow:**
- Existing masthead data already available in [slug].astro frontmatter (byline, dates, excerpt); keep `<BlogContent blocks={...}>` untouched per docs/solutions rail

**Test scenarios:**
- Covers AE1. Integration: toggling dark on a post changes sheet/masthead/TOC/nav/CTA colors only via token values; grep confirms no new `[data-theme]` selectors in blog components
- Covers AE2. Edge case: at 375px with a wide code block, `document.documentElement.scrollWidth <= window.innerWidth` and the sheet's right border stays visible
- Happy path: post with excerpt + featured image renders full masthead; older post without either collapses cleanly (no empty rows)
- Edge case: very long title wraps inside the sheet without breaking the chip row
- Error path: TOC details opens/closes with keyboard, anchors navigate without JS

**Verification:**
- [slug].astro reduced to data + composition (target: under ~200 lines); build passes; deployed post URL returns 200 with `url_effective` unchanged (no setup redirect)

---

### U4. Blog index and author pages: mechanical token swap

**Goal:** Make AE5's grep pass across all of src/pages/blog/ with zero layout or design changes.

**Requirements:** R13 (as reviewed); AE5

**Dependencies:** U1

**Files:**
- Modify: `src/pages/blog/index.astro`, `src/pages/blog/authors.astro`, `src/pages/blog/authors/[slug].astro`

**Approach:**
- Literal-for-token substitution only: rust tints to `--tint-rust-*`, plum tints (.05/.06/.1/.25) to `--tint-plum-*`, `#666`-family and hardcoded grays to ink steps; gradient endpoints swap to tint tokens (accepted minor visual shift per origin R2)
- No selector, spacing, or layout edits

**Test scenarios:**
- Covers AE5. Happy path: check script grep passes over the whole blog directory
- Edge case: both gradients (index hero, authors page) still render as gradients with token endpoints in both themes

**Verification:**
- Visual diff of index and author pages is negligible in both themes; script passes

---

### U5. Acceptance pass and ship checks

**Goal:** Prove the round against the origin's acceptance examples and success criteria on the deployed Worker.

**Requirements:** All AEs; origin success criteria

**Dependencies:** U1-U4

**Files:**
- Test: `scripts/check-blog-tokens.mjs` (run), no new files expected

**Approach:**
- Run the check script (AE3, AE5); walk AE1/AE2/AE4 manually per their reviewed definitions; spot-check homepage + one lesson + changelog in both themes; smoke the deployed post URL with `curl -w "%{url_effective}"` (no `/_emdash/admin/setup` redirect)

**Test scenarios:**
- Test expectation: none -- verification unit; scenarios live in U1-U4

**Verification:**
- Every AE passes as written in the origin doc; no page-local dark overrides were introduced anywhere (grep); prerender never re-enabled

---

## System-Wide Impact

- **Interaction graph:** CodeBlockCopy's runtime wrapper touches every `pre` sitewide; blog scoping keeps lesson/changelog blocks untouched. `--text-secondary` and `--shadow-*` redefinitions shift 20+ non-blog consumers passively (accepted, spot-checked)
- **Error propagation:** none (presentation-only); JS-free TOC removes a failure surface (current script throws)
- **State lifecycle risks:** none; D1 rows untouched (AE4)
- **API surface parity:** none; no schema, routes, or publish tooling changes
- **Integration coverage:** deployed-Worker checks required; `astro dev` masks Emdash middleware behavior
- **Unchanged invariants:** `<BlogContent blocks={...}>` contract, Emdash SSR middleware (no prerender), LessonLayout `.prose`, sitemap registration, OG engine (still reads old palette until governance round)

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Passive token shift degrades a non-blog surface | Both-themes spot check of homepage/lesson/changelog (origin success criterion); fixes at token level only |
| Dark-mode sheet/desk delta too subtle, metaphor collapses | `--sheet` declared per theme with explicit delta; checked visually in U3 before ship |
| Frozen tints look wrong on the sheet vs desk | In-article pairs computed against `--sheet` (origin R6 as reviewed); script encodes both backdrops |
| `.blog-prose` specificity fights global.css | Cascade-layer option left open (deferred to implementation); verify lesson pages unaffected in U2 |
| Losing drawer/highlighting feels like regression | Current script is broken in production, so no working behavior is lost; highlighting deferred explicitly |

---

## Documentation / Operational Notes

- Optional pre-ship: capture GA4 landing-page split (/blog/* vs /) so the rebrand's cold-visitor effect is measurable (origin deferred question)
- Update `docs/brand-guidelines.md` with the token table after U1 lands (small addendum, not a rewrite)
- Ship via existing `/ship` flow; smoke test must check `url_effective` per docs/solutions

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-07-16-blog-tokens-reading-view-rebrand-requirements.md](../brainstorms/2026-07-16-blog-tokens-reading-view-rebrand-requirements.md)
- Ideation record: docs/ideation/2026-07-16-blog-visual-system-ideation.md
- Related learnings: docs/solutions/integration-issues/emdash-astro6-cloudflare-workers-setup.md, docs/solutions/ui-bugs/astro-mobile-nav-hamburger-drawer.md
- External: Radix Colors scales, USWDS theme tokens, WCAG G183/F73 (cited in ideation record)
