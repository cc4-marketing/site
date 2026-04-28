---
title: "Blog: Author Pages & Top Bar Fix"
type: feat
status: completed
date: 2026-04-29
origin: docs/brainstorms/2026-04-29-blog-author-pages-topbar-fix-brainstorm.md
---

# Blog: Author Pages & Top Bar Fix

## Overview

Two interconnected improvements to the blog section:

1. **Fix top bar overlap** — Hello bar currently overlaps navigation menu, making it unreadable. Fix by adding margin-bottom to hello bar so header is pushed down when visible.
2. **Author pages** — Transform `/blog/authors` into a hub with author cards in a grid. Add individual author pages (`/blog/authors/{slug}`) showing full bio, avatar, social links, AI-discovery prompt, and their blog posts.

Both changes enhance the blog/author area and share infrastructure (author data from Emdash, consistent styling).

## Problem Statement

### Top Bar Issue
- Hello bar (z-index: 1000) sits above header (z-index: 100)
- No spacing between them → navigation menu text becomes unreadable
- Affects site navigation and user experience across all pages
- Currently fixed by CSS padding-top on body, but hello bar doesn't account for its own height properly

### Author Pages Gap
- Current `/blog/authors` page exists but only shows team member cards
- No individual author profiles or per-author post listings
- No way for readers to discover all posts by a specific author
- Missing "learn more about this author" discovery mechanism

## Proposed Solution

### Part 1: Fix Top Bar Overlap

**Root cause**: Hello bar and header have no explicit spacing relationship. When hello bar is visible, it overlays header without pushing it down.

**Fix**: Modify HelloBar component to account for its own height:
- Add `margin-bottom` to `.hello-bar.visible` equal to the bar's height (~42px based on padding + font)
- Ensures header sits cleanly below hello bar
- Works with existing body padding-top mechanism

**Alternative considered**: Position header's padding-top conditionally. **Rejected** because it couples header logic to hello-bar state. The hello bar should be responsible for its own spacing.

### Part 2: Author Pages

**Hub page** (`/blog/authors`):
- Convert current single-column flex layout to a 2-3 column responsive grid
- Keep existing card design (avatar, name, role, bio, links) but arrange in grid
- Each card becomes a link to individual author page

**Individual author pages** (`/blog/authors/{slug}`):
- Dynamic Astro route using author slugs extracted from Emdash bylines
- Structure: bio section (avatar + name + role) → social links → AI discovery prompt → list of their posts
- Breadcrumb: Home → Blog → Authors → {Author Name}

**Author data flow**:
- Source: Emdash D1 `bylines` table (already contains `displayName`, `roleLabel`, avatar URL)
- Local author data from `/src/pages/blog/authors.astro` (name, role, bio, links) supplements Emdash data
- Posts filtered by byline ID via `post.data.bylines?.[0]?.byline.id`

## Technical Approach

### Architecture

**Component changes**:
1. **HelloBar** (`/src/components/HelloBar.astro`):
   - Add `margin-bottom` to visible state (line 58-61)
   - Value: `calc(var(--space-md) + 1.25em)` → ~42px (accounts for padding + font size)

2. **Authors page** (`/src/pages/blog/authors.astro`):
   - Keep hero section, update grid layout
   - Grid: `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))` (2-3 columns desktop, 1 mobile)
   - Each card becomes `<a href={`/blog/authors/${slug}`}>` wrapper
   - Extract author slug from name: `name.toLowerCase().replace(/[^a-z0-9]+/g, '-')`

3. **New author detail page** (`/src/pages/blog/authors/[slug].astro`):
   - Dynamic route matching author slugs from local authors array
   - Sections:
     - Breadcrumbs (`Home > Blog > Authors > {Name}`)
     - Hero/profile: avatar (circular, 120px), name, role, bio (full text, not snippet)
     - Social links: Flex row with text links (no buttons, consistent with existing byline pattern)
     - AI prompt card: Callout box with "Learn about {Name}" prompt template
     - Blog posts: Grid or list of their posts (title, date, excerpt, read link)
   - Get byline from Emdash: `bylines.find(b => slugify(b.displayName) === slug)`
   - Filter posts: `allPosts.filter(p => p.data.bylines?.some(b => b.byline.id === bylineId))`

### File Changes

**Modified**:
- `/src/components/HelloBar.astro` — Add margin-bottom on visible state
- `/src/pages/blog/authors.astro` — Convert flex to grid layout, make cards linkable
- `/astro.config.mjs` — Add `/blog/authors/{slug}` to dynamic routes (optional, Astro auto-discovers)

**Created**:
- `/src/pages/blog/authors/[slug].astro` — Dynamic author detail page

### Styling Details

**Hello bar margin-bottom**:
```css
.hello-bar.visible {
  /* Existing: transform, opacity, transition */
  margin-bottom: 42px; /* Matches: 12px padding-top + 12px padding-bottom + 1.25em line-height */
}
```

**Authors hub grid**:
```css
.authors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.author-card {
  display: flex;
  flex-direction: column;
  border: 2px solid var(--border-color);
  background: var(--bg-secondary);
  padding: 24px;
  text-decoration: none;
  color: inherit;
  transition: all 0.25s ease;
}

.author-card:hover {
  transform: translate(-4px, -4px);
  box-shadow: 8px 8px 0 var(--mustard);
}

@media (max-width: 768px) {
  .authors-grid {
    grid-template-columns: 1fr;
  }
}
```

**Author detail page**:
- Hero section: 120px circular avatar, centered, name below, role in smaller text, bio in secondary text
- Social links: Horizontal list, rust color links with hover underline
- AI prompt box: Bordered callout (similar to CTA box style), background tint
- Posts list: Standard blog card grid or vertical list

### Implementation Phases

#### Phase 1: Top Bar Fix
**Duration**: ~30 minutes
- Modify HelloBar component
- Test on all pages (homepage, blog, lessons, author page)
- Verify no layout shifts on dismiss

**Success criteria**:
- Hello bar visible → header pushes down cleanly
- Hello bar dismissed → layout returns to normal
- No overlap on any viewport size

#### Phase 2: Author Pages
**Duration**: ~2 hours

**Phase 2a: Hub page refactoring** (45 min):
- Convert flex layout to grid in authors.astro
- Make cards linkable (wrap in `<a>` tag)
- Test responsive layout (2 cols desktop, 1 mobile)

**Phase 2b: Author detail page** (75 min):
- Create `[slug].astro` dynamic route
- Build profile section (avatar, name, role, bio)
- Add social links section
- Build AI prompt box
- Filter and render author's posts
- Add breadcrumbs
- Style for consistency with existing pages

**Success criteria**:
- `/blog/authors` shows grid of author cards
- Clicking card → `/blog/authors/{slug}` loads individual page
- Author page displays: bio, socials, AI prompt, their posts
- Breadcrumb navigation works
- Grid responsive on mobile (single column)

## System-Wide Impact

### Interaction Graph

**Hello bar margin flow**:
1. HelloBar mount → Check `.hello-bar.visible` in DOM
2. `.hello-bar.visible` { margin-bottom: 42px } applied
3. Header naturally flows below hello bar (no absolute positioning conflict)
4. Body padding-top still applies for safety, but margin handles visual spacing

**Author page data flow**:
1. `/blog/authors/[slug]` route receives slug param
2. Extract matching byline from Emdash bylines array
3. Fetch all posts via getEmDashCollection('posts')
4. Filter posts where byline.id matches
5. Render profile + post list

### Error Propagation

**Hello bar**: No new error paths. Styling change is additive (margin-bottom doesn't break layout).

**Author pages**:
- If author slug doesn't match any byline → No author found → Show 404
- If author has no posts → Show empty state or "No posts yet" message
- If Emdash data missing (displayName, etc.) → Use fallback empty string or "Unknown"

### State Lifecycle Risks

**Hello bar**: None. Margin is deterministic based on visibility class.

**Author pages**: Author slug in URL param must match Emdash byline data. If byline names change in Emdash, URLs become stale. Mitigation: Use byline ID in URL instead of slug (more robust), or redirect old slugs.

### API Surface Parity

**Hello bar**: Self-contained component, no new interfaces exposed.

**Author pages**: New route, new page component, no new Emdash queries (uses existing posts + bylines).

### Integration Test Scenarios

1. **Top bar + nav**: Load homepage, wait for hello bar to animate in, verify header is below it and nav menu is readable
2. **Top bar dismiss**: Click close button, verify margin-bottom removed smoothly (CSS transition)
3. **Author hub**: Load `/blog/authors`, verify grid layout with 2-3 cols on desktop, 1 on mobile, cards are clickable
4. **Author profile**: Click author card → load profile page, verify breadcrumb, bio, socials, AI prompt, post list all present
5. **Author post filtering**: Verify only that author's posts show (not all blog posts)
6. **Mobile author page**: Load author page on mobile, verify layout stacks vertically, readable on small screens

## Acceptance Criteria

### Hello Bar Fix
- [x] Hello bar visible → header pushed down (no overlap)
- [x] Hello bar dismissed → layout returns to normal smoothly
- [x] Works on all pages (homepage, blog, lessons, docs, etc.)
- [x] No layout shift on page load/unload
- [ ] Tested on mobile, tablet, desktop viewports

### Author Pages Hub
- [x] Grid layout 2-3 cols on desktop, 1 on mobile
- [x] Cards maintain hover shadow effect
- [x] Cards are clickable links to author detail page
- [x] Author slugs generated consistently from names

### Author Detail Page
- [x] Dynamic route `/blog/authors/{slug}` loads correctly
- [x] Profile section displays: avatar, name, role, full bio
- [x] Social links section shows Twitter, GitHub, website, etc. (where available)
- [x] AI prompt box displays with copy-able prompt text
- [x] Blog posts list shows all posts by that author
- [x] Post list is sortable/filterable (optional: by date, newest first)
- [x] Breadcrumb navigation correct (Home > Blog > Authors > {Name})
- [x] Author with no posts shows empty state gracefully
- [ ] Mobile layout stacks vertically and is readable

### Quality
- [x] No console errors or warnings
- [x] Styled consistently with existing blog pages
- [x] Accessible (link colors meet contrast, heading hierarchy correct)
- [ ] Responsive on 320px (mobile), 768px (tablet), 1200px (desktop)

## Success Metrics

- ✅ Navigation menu fully visible when hello bar present
- ✅ All users can click through to discover authors
- ✅ Authors can be discovered and their posts found easily
- ✅ No performance regression (new route doesn't slow site)
- ✅ User engagement with author pages tracks successfully

## Dependencies & Risks

### Dependencies
- Emdash D1 database for bylines data (already in use)
- Existing author data in `/src/pages/blog/authors.astro` (local fallback)
- Blog posts already tagged with bylines (no schema changes needed)

### Risks
- **Author slug collision**: If two authors have same slugified name, URLs break. Mitigation: use byline ID in URL, or append number suffix
- **Broken links to authors**: If byline names change in Emdash, old `/blog/authors/{old-slug}` links break. Mitigation: redirects or use ID-based URLs
- **Performance**: Filtering posts for each author page (N+1 queries). Mitigation: Astro builds at build-time, not runtime; no performance impact
- **Mobile viewport**: Author profile might be cluttered on very small screens. Mitigation: test on 320px, stack sections vertically

## Sources & References

### Origin Brainstorm
- **Brainstorm**: docs/brainstorms/2026-04-29-blog-author-pages-topbar-fix-brainstorm.md
  - Key decisions:
    1. Fix hello bar first with margin-bottom (not padding-top on header)
    2. Both changes in one feature (cohesive blog improvements)
    3. Author hub: grid cards layout
    4. Author detail: bio + socials + AI prompt + post list
    5. Social links + AI prompt for discovery

### Related Code
- **HelloBar**: `/src/components/HelloBar.astro` (lines 51-61 for visible state styling)
- **Authors hub page**: `/src/pages/blog/authors.astro` (lines 73-105 for card grid structure)
- **Blog post byline**: `/src/pages/blog/[slug].astro` (lines 24, 31-36 for byline extraction)
- **Blog post styling patterns**: `/src/pages/blog/[slug].astro` (grid layout, card styling)
- **Design system**: `/src/styles/global.css` (colors, typography, spacing, shadows)
- **Emdash config**: `/astro.config.mjs` (database binding setup)

### Related Solutions
- **Layout pattern**: The TOC sidebar in blog posts uses sticky positioning and responsive drawer pattern (reuse for author profile on mobile)
- **Author byline rendering**: OG image engine renders author avatars in `/src/lib/og/templates/blog.ts` (code to reference for avatar handling)

### Astro/Framework Documentation
- Astro dynamic routing: `[slug].astro` files auto-discovered by Astro
- Getters: `getEmDashCollection()`, `getEmDashEntry()` from emdash SDK

## Timeline & Effort

| Phase | Tasks | Effort |
|-------|-------|--------|
| 1 | HelloBar: add margin-bottom, test all pages | 30 min |
| 2a | Authors hub: grid layout, make cards clickable | 45 min |
| 2b | Author detail page: create route, profile, posts list, styling | 75 min |
| Testing | Responsive testing, edge cases (no posts, mobile), cross-browser | 30 min |
| **Total** | | **180 min (3 hours)** |

## Next Steps

→ `/ce:work` to implement both changes together

---

**Post-Implementation Considerations**:
- Monitor bounce rate on author detail pages
- Track clicks from blog bylines to author profiles (engagement metric)
- Consider adding "Read more posts by {Author}" CTAs on blog post pages
- Future: Author RSS feeds, author follow/subscribe functionality
