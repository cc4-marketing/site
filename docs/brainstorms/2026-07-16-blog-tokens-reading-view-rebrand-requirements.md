---
date: 2026-07-16
topic: blog-tokens-reading-view-rebrand
---

# Blog Visual Rebrand, Round 1: Ink Token System + Reading View

## Summary

Replace the blog's scattered rgba tints, off-brand #666 gray, and translucent shadows with a solid, pre-computed ink/tint/shadow token system defined once per theme in `src/styles/global.css`, and rebuild the post reading view to compose it: the article on a bordered document-on-desk sheet with a spec-plate masthead, decomposed out of the inline-styled `src/pages/blog/[slug].astro` into a prose layer plus header/TOC/nav/CTA pieces, with persistently underlined links and token-restyled code blocks.

---

## Problem Frame

The blog post page is the site's least branded surface and its most likely first touch: organic search lands cold visitors on posts, not the homepage. Its styles live as 833 inline lines in `[slug].astro` and have drifted into ~8 ad-hoc rgba tints, a secondary-text gray (#666) unrelated to the brand ink, and translucent plum shadows that contradict the brand's own "hard shadows, no blur" rule. Runtime-alpha tints are also structurally fragile: WCAG contrast over semi-transparent backgrounds is ambiguous, and alpha values tuned for cream break silently when the `html[data-theme="dark"]` swap changes the page behind them (per the ideation round's external research; `docs/solutions/` documents the related dark-mode token-swap trap). Reference analysis of ayush.digital/blog showed the payoff of the opposite discipline: one ink at fixed steps, one recurring frame, a heavily branded reading view that stays readable.

---

## Requirements

**Token system (global.css)**

- R1. Define a solid, pre-computed ink text ramp derived from charcoal (approx. 5 steps: primary, secondary, tertiary/captions, faint, hairline) in both themes; `--text-secondary: #666666` (and its dark counterpart `#A8A8A8`) are retired in favor of ramp steps.
- R2. Define solid surface tint steps for rust and plum per theme replacing every rgba tint currently consumed by blog pages: rust `rgba(184,92,60,.04/.05/.06/.1)` and plum `rgba(92,58,107,.05/.06/.08/.1/.25)`, including the two gradient backgrounds (blog index hero, authors page) whose endpoints swap to tint tokens. The plum `.2/.3` alphas are the shadow definitions covered by R3, not surface tints.
- R3. Shadow tokens (`--shadow-sm/md/lg/mustard`) become solid colors per theme; no translucency, honoring the brand's hard-shadow rule.
- R4. When dark mode is active, only token values change: the dark ramp is authored deliberately in the `html[data-theme="dark"]` block, and no component-level dark override may reference already-swapped variables.
- R5. Every token pair that can carry text ships with a recorded WCAG contrast check (4.5:1 normal text, 3:1 large text), both themes.

**Reading view (blog post page)**

- R6. The article renders as a document-on-desk sheet: cream page as desk, article on a bordered sheet (3px ink border, hard offset shadow), opened by a spec-plate masthead (breadcrumb/date row, Righteous display title, excerpt, author + read-time chips). A distinct sheet-surface token (separate from the desk/page background) is declared per theme, with enough delta from the desk to preserve the document-on-desk read in dark mode; R5's contrast pairs and R2's tint steps are computed against the sheet surface for everything rendered inside the article, with desk pairs kept only for on-desk elements (TOC, prev/next). When a post has no excerpt, the masthead omits that row cleanly; long titles wrap, never truncate.
- R7. `[slug].astro`'s inline styles decompose into a prose layer plus header, TOC, prev/next, and newsletter CTA pieces; every extracted rule consumes tokens only (no raw hex/rgba outside `global.css`).
- R8. The prose layer pins measure at roughly 65ch, sets heading and paragraph rhythm, and gives prose links a persistent 2px underline (offset, visible change on hover) instead of color-only rust.
- R9. Code blocks keep their existing structure: the `pre`/`code` segment in `src/components/BlogContent.astro` plus the copy button injected sitewide by `src/components/CodeBlockCopy.astro` (mounted in BaseLayout, styled in `global.css`). The frame (solid charcoal surface, 3px border, hard offset shadow) renders server-side on the `pre` element itself; the copy button's blog alignment is scoped under the blog prose layer so lesson code blocks keep their current button, and its opacity-based translucency is replaced with solid token colors inside blog pages. The whole back catalog upgrades since no content changes.
- R10. On phones the sheet keeps its 3px border near full-bleed (it does not dissolve into a plain page), and wide content (code blocks) scrolls inside its own container; the page never scrolls horizontally.
- R11. The desktop TOC sidebar is restyled from tokens; the mobile TOC drawer's custom JS is replaced with a native details/summary disclosure styled with brand borders. The mobile disclosure defaults closed (matching current drawer behavior) and renders after the masthead, before the article body, so the title is the first thing above the fold.
- R12. `slugify()` exists once in a shared util consumed by both `BlogContent.astro` and `[slug].astro`.
- R13. The blog index and non-blog pages receive no redesign this round; they pick up the new token values passively (derived secondary text, solid shadows). Blog index and author pages (`src/pages/blog/index.astro`, `authors.astro`, `authors/[slug].astro`) additionally receive a mechanical literal-to-token swap only (no layout or design changes) so AE5's grep passes.
- R14. The featured hero image sits inside the sheet, below the masthead and above the prose; its container is token-restyled alongside the header piece and respects the sheet's internal width (not full-bleed).

---

## Acceptance Examples

- AE1. **Covers R4.** Given the new tokens shipped, when the theme toggles to dark, every color change on the article sheet, masthead, TOC, prev/next, and CTA traces to a token value in the `html[data-theme="dark"]` block (pre-existing dark overrides in shared chrome such as Header, Footer, and promo banners are out of scope per R13); grep finds no new `[data-theme="dark"]` selectors in blog components.
- AE2. **Covers R10.** Given a published post with a 120-character command line in a code block, when viewed at 375px width, the code block scrolls internally, the document's scroll width does not exceed the viewport width, and the sheet's right border remains visible within the viewport (not clipped off-screen).
- AE3. **Covers R5.** Given the token definitions, each text-bearing pair (e.g., secondary ink on cream, secondary ink on rust tint, cream on charcoal) has a documented ratio meeting its WCAG threshold in both themes.
- AE4. **Covers R9, R13.** Given an existing published post (Emdash D1 row untouched), when the round ships, its code blocks render with the new framed style and the post content is byte-identical in the database.
- AE5. **Covers R7.** Given the shipped round, when grepping `src/pages/blog/` and `src/components/BlogContent.astro` for `rgba(` and hex literals, the only matches are in `src/styles/global.css`.

---

## Success Criteria

- Clicking from the branded homepage into a post no longer feels like leaving the site: the post page carries the same physical language (border, hard shadow, chips) while prose stays comfortably readable (measure held, contrast verified).
- A visitor landing directly on a post can identify what the site is and reach the homepage or course from the masthead without scrolling: the breadcrumb/date row carries site identity, not just navigation.
- After the token swap, the homepage, one lesson page, and the changelog are checked in both themes; any regression found is fixed at the token level, never with page-local overrides.
- The color vocabulary shrinks to named steps: no raw color values in blog files outside `global.css` (AE5 is the mechanical check).
- No regressions in delivery: all pages still SSR (no `prerender` reintroduced), post URLs return 200 without redirecting to `/_emdash/admin/setup` (check `url_effective`, not just status), dark mode holds on every restyled surface.
- Handoff quality: ce-plan can produce an implementation plan without inventing product behavior; open items below are technical, not product, decisions.

---

## Scope Boundaries

- WindowFrame figure family (terminal/browser/editor chrome), terminalSession block type, figure captions, and fence auto-classification: deferred to the figures round. This round touches zero PortableText schema and none of `insert_post_*` / publish tooling.
- Frame chassis primitive shared across index cards, masthead, CTA, nav: deferred; this round styles those pieces directly and accepts the noted debt.
- Governance pipeline (raw-color lint gate, /styleguide legend page, single token source feeding OG engine and theme-color meta): later round.
- Sitewide restyle pass of homepage, lessons, changelog: out. They only inherit new token values passively (accepted trade-off).
- Responsive architecture rework and dek/excerpt copywriting: rejected during ideation, out.

---

## Key Decisions

- Solid pre-computed tokens over runtime alpha: WCAG contrast over semi-transparent backgrounds is ambiguous and alpha breaks across the theme swap (USWDS-style solid grades; Radix ships per-theme ramps for the same reason).
- Global token redefinition, blog consumes first: one color system sitewide beats two parallel systems; the subtle passive shift on non-blog pages is accepted without a dedicated QA pass this round.
- Document-on-desk sheet masthead over post-as-window, J-card, and folio flavors: quietest option, strongest measure control, and it uses only existing brand moves.
- Persistent thick underline for prose links over mustard marker swipe and verify-first: zero dependency on contrast math, brand-native hard edge.
- Minimal token restyle of code blocks now, window chrome later: bare blocks would clash inside the new sheet; restyling the existing segment upgrades the whole back catalog with no D1 migration.

---

## Dependencies / Assumptions

- Brand constants are fixed by `docs/brand-guidelines.md` (palette hues, Righteous + Outfit, 3px borders, 8px hard offset shadows, translate(-4px,-4px) hover); this round derives from them, never replaces them.
- The `html[data-theme]` toggle mechanism stays as-is; only token values behind it change.
- Existing posts remain untouched in Emdash D1; everything in this round is presentation-layer.
- Never reintroduce `export const prerender = true` on any page (documented Emdash middleware regression, reverted in 8a20648).

---

## Outstanding Questions

### Deferred to Planning

- [Affects R1, R2][Technical] Exact ramp step values, count, and token naming convention; whether steps are hand-picked hexes or color-mix() outputs frozen to hexes.
- [Affects R5][Needs research] Verified contrast values for rust underline on cream and dark rust (#FF8866) pairings when exact hexes are picked.
- [Affects R7][Technical] Decomposition boundary: single blog-post stylesheet vs child components vs both; what the prose layer owns vs what BlogContent renderers own.
- [Affects R11][Technical] details/summary styling approach and whether desktop sidebar and mobile disclosure share markup.
