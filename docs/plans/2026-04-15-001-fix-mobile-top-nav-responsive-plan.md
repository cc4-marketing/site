---
title: "fix: Mobile top nav hamburger + drawer"
type: fix
status: completed
date: 2026-04-15
issue: "#10"
---

# fix: Mobile top nav hamburger + drawer

Resolves [#10](https://github.com/cc4-marketing/cc4.marketing/issues/10) — "Update top menu on mobile, it's too busy. not good responsive."

## Problem

On phone-width viewports (≤480px), `src/components/Header.astro:5-25` renders the logo + five text nav items + a theme-toggle button in a single horizontal flex row. The only responsive rule (`Header.astro:118-121`) reduces the flex gap from 32px to 16px at `max-width: 768px` — nothing hides, wraps, or collapses below that. The reporter's screenshot (issue #10 attachment) confirms the result:

- Logo "CC4.Marketing" visually touches the first nav link with no breathing room.
- Only three of five links fit in the viewport; "Blog" and "GitHub" are pushed off-screen (or overflow-clipped by the fixed header).
- The theme-toggle button is not visible at all on the reporter's device.
- The Changelog notification dot sits next to the right-most visible item, adding perceived clutter.

Root cause: no hamburger/drawer pattern exists. The existing fix of narrowing the gap is not enough when 6 interactive elements have to share ~320px after the logo.

## Proposed solution

Add a hamburger toggle + slide-in drawer at `≤768px`. Desktop behaviour (≥769px) stays exactly as it is today. Keep the work inside `Header.astro` since it is already a self-contained vanilla-CSS + inline `<script>` component — no new component file, no framework island, no Tailwind.

**Visible header at ≤768px**: logo (left) · theme toggle · hamburger button (right). Nav list hides. Tapping the hamburger slides a full-height drawer in from the right containing the same five nav items (larger tap targets) plus any future items the drawer can absorb without redesign.

**Why a drawer, not a wrap/stack**: stacking the bar vertically eats ~200px of mobile viewport height on every page; the hello bar already consumes 42px when visible. A drawer keeps the fixed-header footprint at ~60px and matches the pattern users expect on phones.

## Acceptance criteria

- [x] At viewport width ≤768px, the five nav links are hidden from the header bar; only logo + theme toggle + hamburger icon are visible.
- [x] Tapping the hamburger opens a right-side drawer containing: Home, Modules, Blog, Changelog (with dot), GitHub. Tapping any link navigates and closes the drawer.
- [x] Drawer can be closed by: tapping a close button inside the drawer, tapping the scrim/backdrop outside the drawer, pressing Escape.
- [x] Drawer slides in/out with a transform animation (≤250ms); respects `prefers-reduced-motion`.
- [x] Body scroll is locked while the drawer is open; restored on close. Scroll position preserved.
- [x] Hamburger button exposes `aria-expanded`, `aria-controls`, and `aria-label="Open menu"` / `"Close menu"`.
- [x] Drawer uses `role="dialog"` + `aria-modal="true"` + `aria-label="Site navigation"`. Focus moves to the first drawer link on open and returns to the hamburger on close. Tab/Shift+Tab stays inside the drawer.
- [x] Drawer z-index sits above the fixed header (z-index: 100) and below the hello bar (z-index: 1000) — `z-index: 500` for the scrim and `501` for the drawer so the hello bar stays reachable.
- [x] Works in light and dark mode — drawer uses `var(--cream)` for bg and `var(--text-primary)` / `var(--border-color)` for contrast, which auto-swap between themes.
- [x] Changelog notification dot renders inside the drawer. Existing fetch script now targets `querySelectorAll('.nav-dot')` so desktop + mobile dots update together.
- [x] Desktop (≥769px): zero visual or behavioural change. Hamburger hidden via CSS. Drawer never opens.
- [x] No new dependency added. No Tailwind introduced. Implementation stays in `Header.astro`.
- [x] Manual test on 375px (mobile), 768px (mobile edge), 769px (desktop edge), 1024px (desktop). Drawer auto-closes on resize across breakpoint.

**Implementation notes (discovered during build):**
- Drawer + scrim had to be hoisted **out** of `<header>` because the header's `backdrop-filter: blur(10px)` creates a new containing block for `position: fixed` descendants, which clipped the drawer to ~96px tall. Moving them to be siblings of `<header>` fixes this.
- The project's CSS variables `--cream` / `--charcoal` are **semantic** (primary-bg / primary-text), not literal. Their values swap between light and dark themes. A draft version hardcoded `var(--charcoal, #1a1a1a)` as a dark-mode override for drawer bg, which produced a light-gray drawer with light-gray text in dark mode. Removed that override and let `var(--cream)` handle both themes.
- A separate, pre-existing bug (unrelated to #10): the hello bar wraps to two lines on narrow viewports (~114px tall), but `body:has(.hello-bar.visible) { padding-top: 42px }` in `global.css:79-81` is hardcoded to a single-line height. On phones with the hello bar active, the bar overlaps the fixed header. This is out of scope for #10 and tracked separately.

## Technical approach

### 1. Breakpoint decision
Keep the existing 768px breakpoint so there is a single mobile cutoff across the codebase (`Header.astro`, `Footer.astro`, `global.css` all already use 768px). Desktop nav shows at `min-width: 769px`; mobile hamburger shows at `max-width: 768px`. The hello bar uses a 600px sub-breakpoint internally — that is fine to leave alone, it is a layout concern, not a nav concern.

### 2. Markup changes in `src/components/Header.astro`

Render both desktop nav and drawer in the same markup; CSS decides which shows:

```astro
<!-- Header.astro (pseudocode — line numbers refer to current file) -->
<header class="header">
  <div class="header-inner">
    <a href="/" class="logo">CC4.Marketing</a>

    <!-- Existing desktop nav — unchanged, hidden on mobile via CSS -->
    <nav class="nav nav-desktop" aria-label="Primary">
      {siteData.navItems.map(item => <a class="nav-link" …>{item.label}</a>)}
    </nav>

    <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode">🌙</button>

    <!-- New: hamburger, hidden on desktop via CSS -->
    <button
      id="nav-toggle"
      class="nav-toggle"
      aria-label="Open menu"
      aria-expanded="false"
      aria-controls="mobile-drawer"
      type="button">
      <span class="hamburger-lines" aria-hidden="true"></span>
    </button>
  </div>

  <!-- New: drawer + scrim -->
  <div id="mobile-scrim" class="mobile-scrim" hidden></div>
  <nav id="mobile-drawer" class="mobile-drawer" role="dialog" aria-modal="true" aria-label="Site navigation" hidden>
    <button id="nav-close" class="nav-close" aria-label="Close menu" type="button">✕</button>
    <ul class="mobile-nav-list">
      {siteData.navItems.map(item => (
        <li>
          <a class="mobile-nav-link" href={item.href} {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {item.label}
            {item.label === 'Changelog' && <span class="nav-dot nav-dot-mobile hidden" aria-label="New entries"></span>}
          </a>
        </li>
      ))}
    </ul>
  </nav>
</header>
```

### 3. CSS additions to the scoped `<style>` block

```css
/* Hamburger — hidden on desktop */
.nav-toggle { display: none; background: none; border: 0; width: 40px; height: 40px; cursor: pointer; }
.hamburger-lines, .hamburger-lines::before, .hamburger-lines::after {
  content: ''; display: block; height: 2px; width: 22px; background: var(--charcoal); transition: transform 200ms, opacity 200ms;
}
.hamburger-lines::before { transform: translateY(-7px); }
.hamburger-lines::after  { transform: translateY( 5px); }
.nav-toggle[aria-expanded="true"] .hamburger-lines { background: transparent; }
.nav-toggle[aria-expanded="true"] .hamburger-lines::before { transform: translateY(0) rotate(45deg); }
.nav-toggle[aria-expanded="true"] .hamburger-lines::after  { transform: translateY(-2px) rotate(-45deg); }

/* Scrim + drawer */
.mobile-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 500; opacity: 0; transition: opacity 200ms; }
.mobile-scrim.visible { opacity: 1; }
.mobile-drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: min(320px, 80vw);
  background: var(--cream);
  z-index: 501;
  padding: 72px 24px 24px;
  transform: translateX(100%);
  transition: transform 250ms ease;
  box-shadow: -8px 0 24px rgba(0,0,0,0.12);
}
.mobile-drawer.visible { transform: translateX(0); }
.mobile-nav-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.mobile-nav-link { display: block; padding: 16px 8px; font-size: 1.125em; color: var(--charcoal); text-decoration: none; border-bottom: 1px solid rgba(0,0,0,0.08); }
.mobile-nav-link:hover, .mobile-nav-link:focus-visible { color: var(--rust); }
.nav-close { position: absolute; top: 16px; right: 16px; background: none; border: 0; font-size: 1.5em; cursor: pointer; color: var(--charcoal); }

@media (prefers-reduced-motion: reduce) {
  .mobile-drawer, .mobile-scrim, .hamburger-lines,
  .hamburger-lines::before, .hamburger-lines::after { transition: none; }
}

/* Swap layouts at 768px */
@media (max-width: 768px) {
  .nav-desktop { display: none; }
  .nav-toggle { display: inline-flex; align-items: center; justify-content: center; }
}
```

Dark-mode override already works via `html[data-theme="dark"] { --cream: …; --charcoal: … }` cascading through the drawer.

### 4. JS additions to the existing inline `<script>` at `Header.astro:125-180`

Keep the theme-toggle and changelog-dot code as-is. Append one IIFE that wires the drawer:

```js
(function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const closeBtn = document.getElementById('nav-close');
  const drawer = document.getElementById('mobile-drawer');
  const scrim  = document.getElementById('mobile-scrim');
  if (!toggle || !drawer || !scrim) return;

  let lastFocused = null;

  function open() {
    lastFocused = document.activeElement;
    drawer.hidden = false; scrim.hidden = false;
    // force reflow so transition runs
    void drawer.offsetWidth;
    drawer.classList.add('visible'); scrim.classList.add('visible');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden';
    const firstLink = drawer.querySelector('a, button');
    if (firstLink) firstLink.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    drawer.classList.remove('visible'); scrim.classList.remove('visible');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
    // hide after transition
    setTimeout(() => { drawer.hidden = true; scrim.hidden = true; }, 260);
    if (lastFocused) lastFocused.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      const focusables = drawer.querySelectorAll('a, button');
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  toggle.addEventListener('click', () => (toggle.getAttribute('aria-expanded') === 'true' ? close() : open()));
  closeBtn?.addEventListener('click', close);
  scrim.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
})();
```

Update the existing changelog-dot script (`Header.astro:163-179`) to target `document.querySelectorAll('.nav-dot')` instead of `document.getElementById('nav-dot')` so both the desktop and mobile dots reveal together.

### 5. Hello-bar interaction

The hello bar is `position: fixed; top: 0; z-index: 1000`. When visible, body gets `padding-top: 42px` (`global.css:79-81`). The drawer is `position: fixed; top: 0` — it will visually sit *under* the hello bar, which is the desired stacking (user can still dismiss the hello bar from inside the drawer view). No change needed to hello bar. Confirm visually during manual test.

## System-wide impact

- **Interaction graph**: hamburger click → `open()` → sets body `overflow: hidden`, adds keydown listener, shifts focus. No other components listen to these events. Theme toggle and changelog fetch remain independent.
- **Error propagation**: all new DOM lookups are guarded by early-return `if (!toggle || ...)`. No network calls, no async work.
- **State lifecycle**: single transient piece of state — `aria-expanded` + two `.visible` classes + body overflow. Reset atomically on `close()`. Page navigation within drawer triggers link default → full page load resets state. SPA-style partial navigation is not used on this site, so no stale drawer concern.
- **API-surface parity**: no public API. Only consumers are the `nav` markup the component itself owns.
- **Integration scenarios**:
  1. Hello bar visible + drawer open on 375px: hello bar still reachable at top, drawer scrolls independently if links overflow.
  2. User opens drawer, rotates phone landscape crossing 768px: CSS `@media` re-shows desktop nav and hides hamburger — drawer state is stale. Mitigation: add a `resize` listener that calls `close()` when `matchMedia('(min-width: 769px)').matches` becomes true.
  3. User opens drawer, clicks theme toggle via the header (toggle stays in header bar on mobile — still visible beside hamburger): theme flips; drawer unaffected because it inherits CSS variables.
  4. Keyboard user tabs past hamburger without opening: no focus trap engaged. Expected.
  5. Prefers-reduced-motion user opens drawer: drawer appears instantly, no slide animation. Acceptable.

## Dependencies & risks

- **Risk — z-index ordering**: current header is 100, hello bar 1000. Drawer at 501 sits between them. If any future overlay uses `z-index: 501+`, recheck. Low risk; nothing else in the repo is near that range.
- **Risk — focus trap correctness**: hand-rolled trap can miss edge cases (elements becoming non-focusable, dynamically inserted links). Only five known links today; keep it simple, no library.
- **Risk — viewport resize across breakpoint while drawer open**: mitigated by resize listener above.
- **No dep changes**. No build changes. No route changes. No server changes.

## Out of scope

- Footer changes (existing mobile footer works fine).
- Re-prioritising nav items (e.g., moving GitHub to footer). Keep the link set identical so the fix is minimal; the drawer has room for all five.
- Redesigning the hello bar.
- Introducing a framework (Alpine, React island) just for this.
- Adding a search bar, auth UI, or any new nav item.

## Files touched

- `src/components/Header.astro` — add hamburger button, drawer markup, drawer CSS, drawer JS; tweak changelog-dot selector to `querySelectorAll`.
- *(No other files expected to change. `global.css` already covers dark-mode variables.)*

## Manual test plan

1. `npm run dev` (or `uv run …` if using the project's toolchain — confirm with `package.json` scripts).
2. Resize Chrome DevTools to iPhone SE (375×667). Confirm: logo, theme toggle, hamburger visible; no text links in bar.
3. Tap hamburger. Confirm: drawer slides in from right, scrim darkens page, first drawer link is focused, body cannot scroll, hello bar still visible at top.
4. Press Escape. Confirm: drawer closes, focus returns to hamburger.
5. Open drawer, tap scrim. Confirm: closes.
6. Open drawer, tap "Blog". Confirm: navigates to `/blog/`, drawer not visible on new page.
7. Open drawer, Tab through links, hit Shift+Tab from first link. Confirm: focus wraps to last link.
8. Resize viewport from 375px → 1024px while drawer is open. Confirm: drawer auto-closes, desktop nav reappears, no stuck scroll lock.
9. Toggle `prefers-reduced-motion` in DevTools rendering pane. Confirm: drawer appears without slide.
10. Toggle dark mode via theme button while drawer open. Confirm: drawer background and text swap correctly.
11. Cross-browser: Safari iOS (real device if possible), Chrome Android emulator, Firefox desktop.
12. Lighthouse mobile audit — confirm accessibility score does not regress and no new a11y warnings on `/`.

## Sources & references

- Issue: [GitHub #10](https://github.com/cc4-marketing/cc4.marketing/issues/10) + attached screenshot (phone viewport ~375px, logo abutting nav items, two links overflowing off-screen, theme toggle not visible).
- `src/components/Header.astro:5-25` — current header markup.
- `src/components/Header.astro:58-122` — current nav CSS (the 768px media query that only reduces gap).
- `src/components/Header.astro:125-180` — existing theme-toggle + changelog-dot inline scripts.
- `src/components/HelloBar.astro` — sibling fixed-position pattern informing z-index choice.
- `src/styles/global.css:79-81` — body padding logic for hello bar.
- `src/config/siteData.ts:5-11` — authoritative list of nav items.
- Accessibility pattern: APG "Disclosure (Menu Button)" / "Dialog (Modal)" — the drawer is modal-like and needs focus management per ARIA APG.
