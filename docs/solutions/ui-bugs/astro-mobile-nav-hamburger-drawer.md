---
problem_type: responsive-layout-bug
component: header-nav
symptoms:
  - "Logo 'CC4.Marketing' abuts first nav link with zero gap at 375px"
  - "Only 3 of 5 nav links visible; 'Blog' and 'GitHub' pushed off-screen"
  - "Theme-toggle button not visible on mobile viewport"
  - "Single media query reduced gap 32px to 16px, still overflows horizontally"
  - "Six interactive elements crammed into one row after logo on phones"
title: "Mobile header nav overflows at <=768px; add hamburger drawer"
date: 2026-04-15
tags:
  - responsive-design
  - mobile-navigation
  - header
  - hamburger-menu
  - astro
  - css-media-queries
  - slide-in-drawer
  - viewport-overflow
severity: medium
related_issue: "#10"
related_pr: "#11"
framework: astro
breakpoint: "768px"
---

# Mobile header nav overflows at ≤768px; add hamburger drawer

## Root cause

The mobile top nav was cluttered because all desktop links rendered unconditionally at narrow widths, and a first attempt to hoist them into a drawer failed due to two non-obvious CSS traps. First, `<header>` had `backdrop-filter: blur(10px)`, which (like `transform`, `filter`, `perspective`, and `will-change`) establishes a new containing block for `position: fixed` descendants — so a drawer nested inside `<header>` was clipped to the header's ~96px box instead of filling the viewport. Second, a draft fix added `html[data-theme="dark"] .mobile-drawer { background: var(--charcoal); }` as a "safe" override, not realizing `--cream` and `--charcoal` in this codebase are **semantic** variables (primary-bg / primary-text) whose values already swap between themes — the override produced a light-gray-on-light-gray drawer in dark mode. The fix is to make the drawer/scrim **siblings** of `<header>` and to rely on the semantic variables without per-theme overrides.

## Solution

Render desktop and mobile navigation DOM side-by-side and let a `@media (max-width: 768px)` rule swap them — no JS needed on initial paint. Place the drawer and scrim as **siblings of `<header>`**, not children, so `backdrop-filter` on the header doesn't capture them as its containing block. Use the project's semantic CSS variables directly (no `html[data-theme="dark"]` overrides for colors that already swap). Wire up a full a11y kit: `aria-expanded` / `aria-controls` on the hamburger, `role="dialog" aria-modal="true"` on the drawer, focus move on open, focus return on close, Tab/Shift+Tab focus trap, Escape-to-close, scrim-click-to-close, and `document.body.style.overflow = 'hidden'` for scroll lock. Finally, listen to `matchMedia('(min-width: 769px)')` so that a mobile-to-desktop viewport crossing (tablet rotate, window resize) auto-closes the drawer and clears stale state.

### 1. Markup shape — desktop + mobile side by side, drawer OUTSIDE `<header>`

```astro
<header class="header">
  <div class="container">
    <a href="/" class="logo">CC4.Marketing</a>
    <nav class="nav nav-desktop" aria-label="Primary">
      <a href="/about">About</a>
      <a href="/blog">Blog</a>
      <a href="/contact">Contact</a>
      <button class="theme-toggle" aria-label="Toggle theme">…</button>
    </nav>
    <div class="mobile-controls">
      <button class="theme-toggle" aria-label="Toggle theme">…</button>
      <button id="nav-toggle" class="hamburger"
              aria-label="Open navigation menu"
              aria-expanded="false"
              aria-controls="mobile-drawer">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<!-- MUST be siblings of <header>: header has backdrop-filter, which creates a
     new containing block and would clip any position:fixed descendant. -->
<div id="mobile-scrim" class="mobile-scrim" hidden></div>
<nav id="mobile-drawer" class="mobile-drawer"
     role="dialog" aria-modal="true"
     aria-label="Site navigation" hidden>
  <a href="/about">About</a>
  <a href="/blog">Blog</a>
  <a href="/contact">Contact</a>
</nav>
```

### 2. CSS — breakpoint swap and theme-safe colors

```css
/* Desktop-first: mobile controls hidden until the breakpoint */
.mobile-controls { display: none; }

@media (max-width: 768px) {
  .nav-desktop    { display: none; }
  .mobile-controls { display: inline-flex; gap: 0.5rem; align-items: center; }
}

.mobile-scrim {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0; transition: opacity 250ms ease;
  z-index: 500;
}
.mobile-scrim.visible { opacity: 1; }

.mobile-drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: min(320px, 80vw);
  /* Semantic variables — already swap per theme.
     Do NOT add html[data-theme="dark"] overrides for these. */
  background: var(--cream);
  color: var(--text-primary);
  border-left: 1px solid var(--border-color);
  z-index: 501;
  transform: translateX(100%);
  transition: transform 250ms ease;
  display: flex; flex-direction: column; gap: 1rem;
  padding: 2rem 1.5rem;
}
.mobile-drawer.visible { transform: translateX(0); }

@media (prefers-reduced-motion: reduce) {
  .mobile-drawer, .mobile-scrim { transition: none; }
}
```

### 3. JS — open/close with focus trap, scroll lock, viewport-resize cleanup

```js
(function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('mobile-drawer');
  const scrim  = document.getElementById('mobile-scrim');
  if (!toggle || !drawer || !scrim) return;

  let lastFocused = null;
  const desktopMq = window.matchMedia('(min-width: 769px)');

  const focusables = () =>
    drawer.querySelectorAll('a[href], button:not([disabled])');

  function open() {
    lastFocused = document.activeElement;
    drawer.hidden = false;
    scrim.hidden  = false;
    // Force reflow so the transition runs from the just-unhidden state.
    // Without this, the browser collapses initial + final state and skips animation.
    void drawer.offsetWidth;
    drawer.classList.add('visible');
    scrim.classList.add('visible');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
    document.body.style.overflow = 'hidden';
    focusables()[0]?.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    drawer.classList.remove('visible');
    scrim.classList.remove('visible');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
    // Wait for transition before re-hiding so the slide-out animates.
    setTimeout(() => { drawer.hidden = true; scrim.hidden = true; }, 250);
    lastFocused?.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); return close(); }
    if (e.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  toggle.addEventListener('click', () =>
    toggle.getAttribute('aria-expanded') === 'true' ? close() : open()
  );
  scrim.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  // Viewport-crossing cleanup: if user resizes/rotates past the breakpoint
  // while the drawer is open, CSS hides the hamburger but JS state (aria-expanded,
  // body overflow) would be stale. Close proactively.
  desktopMq.addEventListener('change', e => {
    if (e.matches && toggle.getAttribute('aria-expanded') === 'true') close();
  });
})();
```

## Prevention

### Rules of thumb

- DO keep `position: fixed` overlays (drawer, scrim, modal) as **siblings of `<body>`** or at least outside any ancestor using `backdrop-filter`, `transform`, `filter`, `perspective`, or `will-change: transform` — those properties create a new containing block and silently re-parent `fixed` children.
- DON'T add `backdrop-filter` (or the other containing-block properties above) to a header/nav/card that wraps a drawer or modal trigger; move the blur to a pseudo-element or a sibling layer instead.
- DO use semantic tokens (`--cream`, `--charcoal`, `--text-primary`, `--border-color`) directly and let the token itself swap per theme.
- DON'T write `html[data-theme="dark"] .foo { color: var(--charcoal); }` style overrides for variables that already swap — that double-swaps and inverts contrast. Per-theme overrides are only valid for literal (non-swapping) variables.
- DO force a reflow (`void el.offsetWidth`) between `el.hidden = false` and `el.classList.add('visible')` — without it the browser batches the style change and skips the transition.
- DO register a `matchMedia('(min-width: <desktop-bp>)').addEventListener('change', …)` that calls `close()` when the viewport crosses back to desktop, so `body { overflow: hidden }` and `aria-expanded="true"` don't leak after a resize.
- DON'T rely on CSS `display: none` at the desktop breakpoint to "close" a mobile drawer — JS state (body lock, ARIA, focus) must be explicitly reset.

### Checklist for any new mobile drawer / modal / overlay

- [ ] Drawer/scrim are **siblings** of (not nested inside) any ancestor that uses `backdrop-filter`, `transform`, `filter`, `perspective`, or `will-change: transform`.
- [ ] Colors come from semantic CSS vars (`--cream`, `--text-primary`, `--border-color`); no `html[data-theme="dark"]` override unless the variable itself does not swap.
- [ ] `aria-expanded` + `aria-controls` on the toggle; `role="dialog"` + `aria-modal="true"` + `aria-label` on the drawer.
- [ ] Focus moves to first focusable inside on open; returns to toggle on close.
- [ ] Tab/Shift+Tab trapped inside; Escape closes.
- [ ] Body scroll locked on open; restored on close.
- [ ] `@media (prefers-reduced-motion: reduce)` disables the slide transition.
- [ ] `matchMedia('(min-width: <desktop-breakpoint>)').addEventListener('change', …)` auto-closes when viewport crosses back to desktop.
- [ ] Click scrim, close button, and any drawer link all route to the same `close()`.
- [ ] Transition from `hidden=false` uses a forced reflow (`void el.offsetWidth`) before adding the `.visible` class.

### Quick sanity test

- Open the drawer on mobile width (≤767px), then resize the window past the desktop breakpoint — the drawer must close cleanly and `<body>` must regain scroll (no stuck `overflow: hidden`, no lingering `aria-expanded="true"`).
- With the drawer open, press Tab repeatedly and then Shift+Tab: focus must cycle only among elements inside the drawer, never escape to the page behind.
- Press Escape with the drawer open: it closes and focus returns to the hamburger toggle button.
- Toggle the site theme to dark mode and re-open the drawer: background, text, and borders must remain readable (no cream-on-cream or charcoal-on-charcoal from a double-swap).
- Open and close the drawer once: the slide-in animation must actually play the first time (confirms the reflow between `hidden=false` and `.visible` is present).

### Reviewer grep hints

- `rg "backdrop-filter|transform:|filter:|perspective:|will-change" src/components/ src/layouts/` — flag any ancestor of a `position: fixed` overlay that creates a new containing block.
- `rg 'data-theme="dark"\]' src/ -A1 | rg 'var\('` — spot per-theme overrides that re-reference already-swapping semantic vars (likely contrast inversions).
- `rg "hidden\s*=\s*false|removeAttribute\(['\"]hidden" src/ -A3 | rg -v offsetWidth` — find drawer-open paths that toggle `hidden` without a forced reflow before adding the visible class.
- `rg "matchMedia\(" src/` — confirm every mobile-only drawer/modal registers a breakpoint listener; absence is the leak.

## Related

- **Issue:** [#10 — Update top menu on mobile, it's too busy. not good responsive.](https://github.com/cc4-marketing/site/issues/10)
- **PR:** [#11 — fix(header): mobile hamburger + drawer nav](https://github.com/cc4-marketing/site/pull/11)
- **Plan:** [docs/plans/2026-04-15-001-fix-mobile-top-nav-responsive-plan.md](../../plans/2026-04-15-001-fix-mobile-top-nav-responsive-plan.md)
- **Existing solutions that share context:** None found (all existing solutions cover Cloudflare Workers/Pages deploy, Emdash CMS, and email integration — none touch UI/responsive layout, header/nav, a11y, or theming).
- **Other components with `backdrop-filter` or `transform` that might trap fixed descendants:**
  - `src/components/ModuleCard.astro:35` — `.module-card` uses `backdrop-filter: blur(10px)`; any future `position: fixed` descendant will be clipped to the card's box (same containing-block trap that bit the drawer in Header.astro).
  - `src/components/Header.astro` — `.header` still has `backdrop-filter: blur(10px)`; the drawer/scrim were hoisted out as siblings of `<header>` for this reason. Keep any future fixed overlay (search, user menu) outside this element.
  - `src/components/HelloBar.astro` — no `backdrop-filter`; uses `transform: translateY()` only on itself (it *is* the fixed element, so no descendant-trap risk today, but note any future fixed child would be affected by the transform).
  - `src/components/FloatingSideBanner.astro` — same story as HelloBar: `transform` is on the fixed element itself; currently no fixed descendants, but worth flagging if that changes.
- **Other related GitHub issues/PRs (open or closed):** None found (other issues/PRs cover content audit, Resend email, Ko-fi, dark mode bootstrap, Wrangler name — none overlap the mobile-nav work).
