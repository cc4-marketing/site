---
date: 2026-07-16
topic: blog-visual-system
focus: keep retro-futuristic style; accessible ink-step color simplification; window/terminal figure components; brand the post reading view
mode: repo-grounded
---

# Ideation: Blog Visual System (ayush.digital lessons, translated to brand)

## Grounding Context

Codebase Context: Astro 5 SSR on Cloudflare Workers; blog posts are PortableText JSON rows in Emdash D1 (ec_posts). Key files: src/styles/global.css (tokens, dark mode via html[data-theme=dark] variable swap), src/pages/blog/index.astro, src/pages/blog/[slug].astro (833 lines inline styles, TOC drawer JS), src/components/BlogContent.astro (segment router: portable | code | image | releaseBox). Brand locked by docs/brand-guidelines.md: cream/rust/mustard/charcoal/plum, hard offset shadows (8px 8px 0), 3px borders, no blur, Righteous + Outfit, hover translate(-4px,-4px).

Pain: ~8 magic rgba tints scattered per component; --text-secondary #666 not derived from brand ink; shadow tokens are translucent plum rgba (contradicts "hard shadows, no blur"); code blocks bare pre/code; blogImage uncaptioned; post view least branded page; prose links color-only rust.

Past learnings (docs/solutions/): new PortableText block types need 3 touchpoints (publish_post.py parser before greedy paragraph accumulator, BlogContent segment branch, renderer); never bare PortableText in [slug].astro; existing D1 rows never gain new blocks retroactively; dark-mode swap happens once at token level (per-theme overrides referencing swapped vars = documented failure); never export const prerender = true; slugify() duplicated in two files.

External research: solid pre-computed tints (USWDS) beat runtime alpha for text surfaces (WCAG alpha-blend ambiguity; alpha breaks across theme swap; Radix ships dual light/dark ramps for this reason). Expressive Code plugin-frames = prior art for terminal/editor chrome with a11y; termynal for graceful degradation. WCAG G183/F73: color-only links need 3:1 vs text and 4.5:1 vs bg, else persistent underline. 50-75 CPL measure. Decorative chrome must be aria-hidden. Frames need internal overflow-x on mobile.

ayush.digital reference: one ink at opacity steps (/80.../10); macOS window mocks for figures; figcaptions at 50% ink; one bordered frame shared index + post; theme-color meta.

## Topic Axes

- A. Ink token system (steps, semantics, dark mode)
- B. Figure block types and content furniture
- C. Post reading view branding
- D. Cross-page coherence
- E. Accessibility and readability guarantees

## Ranked Ideas

### 1. Ink plate token system (solid pre-computed ramps, both themes)
**Description:** Two token lanes in global.css: --ink-100/70/50/30/12 text steps derived from charcoal (retires #666) and --rust-tint-*/--plum-tint-* surface steps (retires all scattered rgba mixes). Solid hex per theme, swapped once in the html[data-theme=dark] block. Shadow tokens re-derived as solid ink in the same pass. Dark ramp authored deliberately (dark-first stance), not inherited from light values.
**Axis:** A
**Basis:** direct: global.css:40 --text-secondary:#666666; global.css:57-59 rgba shadows; [slug].astro:563/571/725 rgba tints. external: USWDS solid grade tints; Radix dual light/dark ramps.
**Rationale:** ayush's one-ink discipline done accessibly: solid tokens make WCAG contrast checkable per token and survive the theme swap, which runtime alpha cannot.
**Downsides:** Global token blast radius beyond blog; step-count and naming must be agreed before component work.
**Confidence:** 90%
**Complexity:** Medium
**Status:** Explored

### 2. WindowFrame figure family, bespoke retro chrome, markdown-is-the-API
**Description:** One zero-config frame primitive: 3px border, 8px offset shadow, Righteous title plate, square brand-color chips (aria-hidden; not macOS traffic lights), internal overflow-x, caption slot (title-bar-as-figcaption or comic caption plate variant). Variants: terminal, browser, editor, plain figure. Sequencing: restyle the existing code segment branch first so the whole back catalog upgrades with no D1 migration; then publish_post.py auto-classifies fences (bash/shell to terminal, URL-first to browser) and lifts markdown image titles into captions. Authors change nothing.
**Axis:** B
**Basis:** direct: terminal transcripts are the core content and render as bare pre/code today; blogImage has no caption support. external: Expressive Code plugin-frames (auto-detect, titles, copy, a11y); termynal degradation.
**Rationale:** The single most repeated content element in every post is currently the least designed; one frame upgrades the entire catalog and every future post at zero authoring cost.
**Downsides:** Chrome design is a taste-level, hard-to-reverse call; needs a sketch round.
**Confidence:** 85%
**Complexity:** Medium-High
**Status:** Explored

### 3. terminalSession structured block (two-voice worked examples)
**Description:** New PortableText block type with typed turns: marketer command (bold, rust prompt glyph) vs Claude output (ink-70), copy button per command, rendered inside WindowFrame. Board-game rulebook "example of play" pedagogy for non-terminal-native marketers.
**Axis:** B
**Basis:** direct: 3-touchpoint rail in docs/solutions; site voice (how-to guides for marketers). reasoned: undifferentiated monospace walls are the biggest comprehension risk for a non-developer audience reading transcripts.
**Rationale:** Turns the product's core artifact into a typed, restyle-once data structure with pedagogical rendering.
**Downsides:** Schema one-way door; existing posts unaffected; authoring syntax contract needed in publish_post.py.
**Confidence:** 70%
**Complexity:** High
**Status:** Unexplored

### 4. Frame chassis at three scales (Braun grammar)
**Description:** One bordered/shadowed/hover-physics primitive (3px border, 8px 8px 0 shadow, translate(-4px,-4px) hover, optional title-plate slot) stamped as: index card, post masthead, figure chrome (idea 2 composes it), TOC panel, newsletter CTA, prev/next. Adoption path for lesson pages and changelog later.
**Axis:** D
**Basis:** external: ayush.digital's shared bordered frame across index + post as the coherence mechanism. direct: index.astro and [slug].astro each re-declare border/shadow/hover; shadow tokens exist but no frame recipe.
**Rationale:** Cross-page coherence becomes structural rather than a review chore; a frame tweak propagates everywhere.
**Downsides:** Slot/variant API design is load-bearing; wrong shape taxes every later block type.
**Confidence:** 80%
**Complexity:** Medium
**Status:** Explored

### 5. Reading-view rebrand by composition + [slug].astro decomposition
**Description:** Extract the 833 inline-styled lines into ProseLayer (measure ~65ch, rhythm, headings, links) plus PostHeader/TocSidebar/PostNav/NewsletterCta components consuming idea 1 tokens and idea 4 frames. slugify() moves to a shared util. Mobile TOC drawer JS replaced with a native details element. Masthead flavor to pick in a design round: document-on-desk sheet, post-as-window, cassette J-card with track-list TOC, or magazine folio + colophon.
**Axis:** C
**Basis:** direct: [slug].astro 833 lines inline styles; slugify duplicated; post view visually plain vs homepage. reasoned: organic search lands cold visitors on the least branded page.
**Rationale:** Branding-by-composition means the post view can never drift from the homepage again; new CSS dialects would just create a third style.
**Downsides:** Biggest visual swing; needs a mock and an explicit mobile answer.
**Confidence:** 85%
**Complexity:** Medium-High
**Status:** Explored

### 6. Link affordance decided once + contrast gate
**Description:** WCAG triple-check rust links in both themes (3:1 vs body text AND 4.5:1 vs background). Expected fail leads to persistent thick underline (brand-native hard edge) or the bolder mustard marker-swipe variant. Every token ships with a recorded contrast grade.
**Axis:** E
**Basis:** external: WCAG G183/F73. direct: prose links color-only rust; dark rust #FF8866 never verified.
**Rationale:** Converts an accessibility remediation into a signature brand move; one decision replaces per-page link styling.
**Downsides:** Visible prose change sitewide; taste sign-off needed.
**Confidence:** 90%
**Complexity:** Low
**Status:** Unexplored

### 7. Token governance pipeline (single source, legend, lint gate)
**Description:** One token source (TS module or JSON) emits global.css values, per-theme theme-color meta (currently missing from BaseLayout), and the Satori OG engine palette (Satori cannot read CSS vars). A /styleguide legend page prints each swatch with its contrast ratio. Lint/CI gate fails raw rgba(/hex in blog files outside global.css; ~12-token budget.
**Axis:** A (spans D/E)
**Basis:** direct: workers-og OG engine exists; theme-color absent. reasoned: convention already failed once; that is how 8 rgba mixes accumulated.
**Rationale:** Makes the cleanup permanent and propagates palette changes to page, tab chrome, and social cards from one edit.
**Downsides:** Build-pipeline decision on where truth lives (TS import vs codegen).
**Confidence:** 75%
**Complexity:** Medium
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Solid ink shadows (standalone) | folded into #1, same pass, same files |
| 2 | Dark-first token authoring (standalone) | folded into #1 as authoring stance |
| 3 | Captioned figures (standalone) | folded into #2 caption slot |
| 4 | Auto-classified frames (standalone) | folded into #2 markdown-is-the-API |
| 5 | Print-proof figures (@media print forcing function) | tactic, outcomes covered by #2 + #6 |
| 6 | Measure token + native details TOC (standalone) | folded into #5 ProseLayer scope |
| 7 | Cartographer's legend (standalone) | folded into #7 governance pipeline |
| 8 | Single token source for OG (standalone) | folded into #7 |
| 9 | Worked-example pedagogy synthesis | folded into #3 |
| 10 | Frame-at-three-scales synthesis | is #4 |
| 11 | Self-documenting token pipeline synthesis | is #7 |

No axis left without survivors.
