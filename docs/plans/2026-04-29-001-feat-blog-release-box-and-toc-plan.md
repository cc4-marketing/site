---
title: "Add Release Highlight Box and Sticky TOC to Blog Posts"
type: feat
status: completed
date: 2026-04-29
---

# Add Release Highlight Box and Sticky TOC to Blog Posts

## Overview

Enhance the blog post template with two UX improvements:
1. **Release Highlight Box** — A minimal highlight callout for product releases, version info, and download links (first used on Threadmark post)
2. **Sticky Table of Contents** — Auto-generated TOC from H2 headings with sticky positioning on desktop and collapsible drawer on mobile

These changes improve content discoverability and navigation without cluttering the design.

## Problem Statement

**Current State:**
- Release/product info appears as plain text in prose ("v0.4.0 is the public release. Download: ... Landing page: ... Source: ...")
- No table of contents for multi-section blog posts, making it hard to scan or navigate to specific sections
- Blog posts are long-form content with 5-7 H2 sections but no visual navigation aid

**Impact:**
- Product launches and tool releases don't have visual prominence (looks like regular paragraph text)
- Readers can't quickly scan post structure or jump to relevant sections
- Mobile users have no guide to post length or content organization

## Proposed Solution

### 1. Release Highlight Box (Minimal Style)

**Design Pattern:**
- Left border accent (4px, rust color: `#B85C3C`)
- Subtle tinted background (rgba(184, 92, 60, 0.04) — matches existing CTA)
- Padding and typography hierarchy
- Supports structured data: version, download URL, landing page, source code link

**Implementation Approach:**
- Add `releaseHighlight` as a PortableText block type in Emdash
- Extend BlogContent.astro to handle this block type
- Render as a styled `<div>` with links formatted as inline text (no buttons for minimal feel)
- Mobile: stacks naturally, full width

**Example Usage in Post:**
```
"Available Now section"
[releaseHighlight block]
{
  version: "v0.4.0",
  downloadUrl: "github.com/blacklogos/threadmark/releases",
  landingPageUrl: "threadmark.cc4.marketing",
  sourceUrl: "github.com/blacklogos/threadmark"
}
```

### 2. Sticky Table of Contents (Desktop) + Collapsible Drawer (Mobile)

**Desktop Behavior:**
- Auto-extracts all H2 headings from post content
- Generates TOC in right sidebar, fixed position (sticky)
- Smooth scroll navigation to section
- Highlights current section as user scrolls (intersection observer)
- Works with any post, no manual config needed

**Mobile Behavior (< 768px):**
- TOC hidden by default
- "Contents" button or hamburger icon triggers accordion drawer
- Full TOC in slide-in panel from side
- Dismisses when user clicks a link
- Uses CSS media query + JS to toggle visibility

**Technical Approach:**
- **Astro template** ([slug].astro): Extract H2s from BlogContent blocks, generate anchor IDs
- **TOC component** (TableOfContents.astro): Renders list with links
- **Styling** ([slug].astro `<style>`): Position (sticky on desktop), layout grid, mobile drawer
- **Interactivity** (vanilla JS in template): Smooth scroll, active section highlighting, drawer toggle

**No Emdash Changes:** TOC generation happens entirely in the Astro template; no database changes needed. **Optional override:** If a post manually adds a `tableOfContents` block in Emdash, use that instead of auto-generating.

## Technical Considerations

### Release Box Implementation

**Files to modify:**
- `src/components/BlogContent.astro` — add `releaseHighlight` block handler
- `src/pages/blog/[slug].astro` — add CSS for `.blog-release-box` styling

**PortableText Block Type (expected shape):**
```javascript
{
  _type: 'releaseHighlight',
  _key: 'unique-key',
  version: string,           // e.g., "v0.4.0"
  downloadUrl: string,       // e.g., "github.com/..."
  landingPageUrl: string,    // e.g., "threadmark.cc4.marketing"
  sourceUrl: string          // e.g., "github.com/..."
}
```

### TOC Implementation

**Files to modify:**
- `src/pages/blog/[slug].astro` — extract H2s, generate TOC, add layout grid
- Add new CSS for `.blog-toc-sticky`, `.blog-toc-drawer`, drawer toggle button

**Algorithm (in Astro template):**
```
1. Parse post.data.content blocks
2. Filter blocks where _type === 'paragraph' and has h2 style (or similar)
3. Extract text from each H2 block
4. Generate anchor ID from heading text (slugify)
5. Create array: [{ id, text }, ...]
6. Render as <nav> with <a> tags linking to anchors
7. Apply position: sticky; top: 0; for desktop
```

**Interactivity (vanilla JS in template):**
```javascript
// Smooth scroll on link click
document.querySelectorAll('.toc-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(e.currentTarget.hash);
    target?.scrollIntoView({ behavior: 'smooth' });
  });
});

// Active section highlighting (IntersectionObserver)
const headings = document.querySelectorAll('h2');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      document.querySelectorAll('.toc-link').forEach(link => {
        link.classList.toggle('active', link.hash === `#${id}`);
      });
    }
  });
}, { rootMargin: '-80px 0px -80% 0px' });

headings.forEach(h => observer.observe(h));

// Mobile drawer toggle
const drawerBtn = document.querySelector('.toc-toggle');
const drawer = document.querySelector('.blog-toc-drawer');
drawerBtn?.addEventListener('click', () => {
  drawer.classList.toggle('visible');
});

drawer?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    drawer.classList.remove('visible');
  });
});
```

### Styling

**Release Box** (minimal highlight style):
```css
.blog-release-box {
  border-left: 4px solid var(--rust);
  padding: 20px 24px;
  margin: 32px 0;
  background: rgba(184, 92, 60, 0.04);
}

.blog-release-box strong {
  display: block;
  margin-bottom: 12px;
  color: var(--rust);
  font-weight: 600;
}

.blog-release-box a {
  color: var(--rust);
  text-decoration: underline;
}
```

**TOC Sticky (Desktop):**
```css
/* Grid layout: content + TOC sidebar */
.blog-post-inner {
  display: grid;
  grid-template-columns: 1fr 250px;
  gap: 40px;
  max-width: 1000px; /* widen for sidebar */
}

.blog-toc-sticky {
  position: sticky;
  top: 100px; /* below header */
  max-height: 70vh;
  overflow-y: auto;
  font-size: 0.9em;
  line-height: 1.6;
}

.toc-link {
  display: block;
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: 8px;
  padding: 4px 8px;
  transition: all 0.2s;
}

.toc-link:hover,
.toc-link.active {
  color: var(--rust);
  font-weight: 600;
}

@media (max-width: 768px) {
  .blog-post-inner {
    grid-template-columns: 1fr;
  }
  
  .blog-toc-sticky {
    display: none;
  }
}
```

**TOC Mobile Drawer:**
```css
.blog-toc-toggle {
  display: none; /* hidden on desktop */
  margin-bottom: 16px;
  background: transparent;
  border: 2px solid var(--border-color);
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 600;
  color: var(--rust);
}

@media (max-width: 768px) {
  .blog-toc-toggle {
    display: block;
  }
  
  .blog-toc-drawer {
    position: fixed;
    left: -100%;
    top: 0;
    width: 100%;
    height: 100vh;
    background: var(--bg-primary);
    z-index: 999;
    padding: 20px;
    transition: left 0.3s ease;
    overflow-y: auto;
  }
  
  .blog-toc-drawer.visible {
    left: 0;
  }
  
  .blog-toc-drawer a {
    display: block;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-color);
    color: var(--rust);
    text-decoration: none;
  }
}
```

## Acceptance Criteria

### Release Highlight Box
- [x] `releaseHighlight` block type renders in BlogContent.astro
- [x] Minimal highlight style applied (left border, tinted background)
- [x] All 4 fields display correctly: version, download link, landing page, source
- [x] Mobile responsive (full width, readable on mobile)
- [x] Links are underlined and rust-colored
- [x] Works with Threadmark post (added to D1, displays on live post)

### Table of Contents
- [x] H2 headings auto-extracted from post content
- [x] Anchor IDs generated from heading text
- [x] TOC renders on right sidebar (desktop)
- [x] TOC sticky-positioned and stays visible while scrolling
- [x] Smooth scroll navigation on link click
- [x] Current section highlighted as user scrolls (IntersectionObserver)
- [x] Mobile: "Contents" button toggles drawer
- [x] Mobile drawer: closes when link clicked
- [x] Mobile: drawer slides in from side smoothly
- [x] Works with Threadmark post (7 sections: Introducing, What, Why, How, Philosophy, Where, Available)
- [x] Optional override: if post has manual `tableOfContents` block in Emdash, use that instead (auto-generation used as default)

### Quality
- [x] No layout shift on page load
- [x] TOC scrollable if it exceeds viewport height (max-height: 70vh with overflow-y: auto)
- [x] Works in light and dark modes (uses CSS custom properties)
- [x] Accessibility: TOC links have proper `href` anchors, drawer is keyboard-navigable
- [x] Performance: IntersectionObserver and drawer toggle don't block main thread

## System-Wide Impact

### Interaction Graph
- **Release box render:** BlogContent processes `releaseHighlight` block → returns styled `<div>` — isolated, no side effects
- **TOC generation:** [slug].astro extracts H2s → generates anchor IDs → renders `<nav>` — runs at build time
- **TOC interactivity:** JS listeners on `.toc-link` → scroll to target, update `.active` class — no state mutations beyond DOM

### Error Propagation
- **Malformed block:** If `releaseHighlight` missing fields, render with fallbacks (empty string for missing URLs)
- **Missing H2 headings:** If post has no H2s, TOC renders empty — no error, gracefully degrades
- **Scroll target not found:** IntersectionObserver ignores missing headings, no crash

### State Lifecycle
- **TOC active state:** Updated via IntersectionObserver, reset on every scroll event — no orphaned state
- **Mobile drawer state:** Toggled by button, auto-dismissed on link click — state always in sync with DOM

### API Surface Parity
- **BlogContent component:** Adds handler for `releaseHighlight` type alongside existing `code`, `blogImage` handlers — consistent pattern
- **No new Astro props needed** — TOC generation is template-internal

### Integration Test Scenarios
1. **Release box + desktop TOC:** Post renders with both, TOC sticky position works, release box styled correctly
2. **Mobile drawer + scroll:** Drawer opens/closes, smooth scroll works, current section highlights
3. **Override scenario:** Post has manual `tableOfContents` block → auto-generation skipped, manual TOC used
4. **No H2 headings:** Post renders, TOC empty, no errors
5. **Dark mode:** TOC and release box colors adapt to theme variables

## Success Metrics

- ✅ Threadmark post displays release box prominently
- ✅ All 6 Threadmark sections appear in TOC
- ✅ TOC scrolls with user on desktop
- ✅ Mobile drawer works smoothly
- ✅ No layout regressions on existing blog posts
- ✅ Page load time unchanged (TOC generation at build time)

## Dependencies & Risks

**Low Risk:** Both features are additive and isolated
- Release box: new PortableText type, no impact on existing blocks
- TOC: template-level extraction, no schema changes

**Assumptions:**
- H2 headings exist in post content (blogContent blocks)
- Anchor generation from heading text is reliable (slugify/kebab-case)
- IntersectionObserver supported in all target browsers (it is)

**Optional Fallback:** If manual TOC override is too complex to implement initially, ship without it — auto-generation covers 99% of use cases.

## Files to Modify

1. **src/components/BlogContent.astro** — Add `releaseHighlight` block handler
2. **src/pages/blog/[slug].astro** — TOC generation, styling, JS interactivity
3. **docs/plans/** — This plan file

## Next Steps

→ Proceed to `/ce:work` to implement both features on Threadmark post as initial test case.

---

**Sources & References:**
- **Existing blog pattern:** `src/pages/blog/[slug].astro:365-503` — newsletter CTA styling (used as template for release box)
- **BlogContent component:** `src/components/BlogContent.astro:20-31` — block type handling pattern (code, blogImage)
- **Brainstorming decisions:** Release box minimal style (left border + tint), TOC sticky right sidebar desktop + collapsible drawer mobile, hybrid auto-generate + override approach
