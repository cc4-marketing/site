---
title: "PortableText TOC Anchor Links Missing Heading IDs"
category: ui-bugs
date: 2026-04-29
tags: [portabletext, table-of-contents, anchor-links, heading-ids, astro]
related: 
  - integration-issues/portabletext-missing-code-image-handlers-BlogPublisher-20260426.md
  - plans/2026-04-29-001-feat-blog-release-box-and-toc-plan.md
---

## Problem

Table of contents (TOC) links in blog posts rendered but didn't scroll to their target sections when clicked. The TOC was visually present and interactive—clicking links had no effect. This occurred in both desktop (sticky sidebar) and mobile (collapsible drawer) layouts.

**Symptom**: Click "Contents > Section Name" in TOC → no scroll, page stays in place.

## Root Cause

H2 headings rendered by the PortableText component lacked `id` attributes. The TOC extracted heading text and generated anchor references (e.g., `href="#section-name"`), but the rendered HTML had no matching elements with `id="section-name"`. Browser anchor navigation requires a target element with an id that matches the link's href fragment.

The architectural issue: PortableText is a content rendering library that converts semantic blocks into HTML. It doesn't know about application-level concerns like anchor IDs, SEO, or table-of-contents synchronization. When the original implementation attempted H2 detection at the page level ([slug].astro), it had no mechanism to attach ids to the elements that PortableText was rendering in BlogContent.astro.

## Solution

**Move H2 detection and ID generation from the page template into the content renderer.**

H2 blocks are now detected in `BlogContent.astro` (where content is actually rendered), and each H2 is wrapped in a `<div>` with a deterministically-generated id attribute.

### Changes Made

**File: `src/components/BlogContent.astro`**

1. Added `headingId` optional property to Segment type:
   ```typescript
   type Segment =
     | { kind: 'portable'; blocks: any[]; headingId?: string }
     | { kind: 'code'; ... }
     | { kind: 'image'; ... }
     | { kind: 'releaseBox'; ... };
   ```

2. Added `slugify()` function to generate deterministic anchor IDs:
   ```typescript
   function slugify(text: string): string {
     return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
   }
   ```
   Converts "Why This Matters for Your Workflow" → `why-this-matters-for-your-workflow`

3. Modified block processing loop to detect H2s and create dedicated segments:
   ```typescript
   if (block._type === 'block' && block.style === 'h2') {
     if (current.length) { 
       segments.push({ kind: 'portable', blocks: current }); 
       current = []; 
     }
     const headingText = block.children?.[0]?.text || '';
     const headingId = slugify(headingText);
     segments.push({ kind: 'portable', blocks: [block], headingId });
   }
   ```

4. Added rendering logic for segments with heading IDs:
   ```typescript
   if (seg.headingId) {
     return (
       <div id={seg.headingId}>
         <PortableText value={seg.blocks} />
       </div>
     );
   }
   ```

**File: `src/pages/blog/[slug].astro`**

Removed duplicate H2 detection logic from the BlogContent component call. Changed from:
```typescript
<BlogContent blocks={post.data.content.map((block: any) => {
  if (block._type === 'block' && block.style === 'h2') {
    const text = block.children?.[0]?.text || '';
    return { ...block, _id: slugify(text) };
  }
  return block;
})} />
```

To simply:
```typescript
<BlogContent blocks={post.data.content} />
```

### Result

Generated HTML now contains proper anchor targets:
```html
<div id="why-this-matters-for-your-workflow">
  <h2>Why This Matters for Your Workflow</h2>
</div>
```

When TOC link `<a href="#why-this-matters-for-your-workflow">` is clicked:
1. Browser finds the div with matching id
2. Smooth scroll animation carries user to that section
3. IntersectionObserver fires and highlights the TOC link as "active"
4. Mobile drawer auto-closes after navigation

## Prevention Strategies

### 1. Centralize Custom Block Type Handling
Maintain a single source of truth for all custom block types. When adding new block types (callout, highlight, etc.), modify only `BlogContent.astro`. Never scatter block type logic across multiple files.

### 2. Separate Rendering Phase from Attribute Synthesis
Follow the Segment pattern:
- Detect block type → Flush pending blocks → Extract metadata → Create Segment
- Then in render phase: check if metadata exists → wrap accordingly

Don't try to attach IDs to blocks during detection. Create metadata properties in the Segment and use them during rendering.

### 3. Wrap with Divs, Don't Modify PortableText Output
When a library-provided component (PortableText) doesn't support an attribute you need (id, data-*, etc.), wrap it in a parent element rather than trying to modify the rendered output. The wrapper carries the attribute.

### 4. Extract Shared ID Generation Utility
The `slugify()` function currently exists in both `BlogContent.astro` and `[slug].astro`. Extract it to `src/lib/blog-utils.ts` so:
- ID generation is deterministic and centralized
- TOC extraction and element IDs never drift
- New developers use the same algorithm for new features

### 5. Test HTML Output, Not Just UI
Future tests should verify:
- Heading wrapper divs exist with correct id attributes
- TOC links have matching href values
- No accidental nested wrappers or broken structure
- Edge cases: identical heading text, special characters, very long headings

### Code Review Checklist
Before approving changes to `BlogContent.astro` or custom block types:
- [ ] New block type has explicit if/else-if check in the loop
- [ ] Pending blocks flushed before creating new Segment
- [ ] ID generation is deterministic (same input → same output)
- [ ] ID attribute placed on a wrapper div, not inline PortableText
- [ ] Affected tests updated or new tests added for HTML structure
- [ ] Documentation updated if new block type added

## Testing

The fix was verified by:
1. Build completed without errors
2. Live site deployed and pages respond with 200 status
3. HTML inspection confirms `<div id="section-name">` wrappers exist on H2 elements
4. Manual testing: clicking each TOC link scrolls to the target section
5. Desktop and mobile layouts both work correctly

For regression prevention, create snapshot tests in `src/components/__tests__/blog-content.test.ts` that verify:
- H2 blocks generate wrappers with id attributes
- Block segmentation logic flushes correctly
- ID values are deterministic and match expected slugify output
- Clicking anchor links navigates to correct elements

## Impact

- ✅ TOC links now scroll to their target sections (desktop + mobile)
- ✅ Active section highlighting via IntersectionObserver works correctly
- ✅ Mobile drawer auto-closes after navigation
- ✅ Solution is backward compatible—works with all existing blog posts
- ✅ Architectural pattern ready for future custom block types

## Related Issues

- Upstream: [portabletext-missing-code-image-handlers-BlogPublisher-20260426.md](../integration-issues/portabletext-missing-code-image-handlers-BlogPublisher-20260426.md) — Documents the pattern for custom PortableText rendering
- Feature plan: [2026-04-29-001-feat-blog-release-box-and-toc-plan.md](../../plans/2026-04-29-001-feat-blog-release-box-and-toc-plan.md) — Full TOC + Release Box implementation

## Future Improvements

1. **Shared slugify utility**: Extract to `src/lib/blog-utils.ts` and reuse in [slug].astro
2. **Duplicate heading handling**: If two headings slugify to the same id, either append suffix (-2, -3) or fail at build time
3. **Comprehensive test suite**: Unit tests for slugify, component tests for block segmentation, HTML snapshot tests, integration tests for TOC synchronization
4. **Documentation**: Add BLOCKS.md registry documenting all custom block types and their expected HTML output

## Commits

- `564cc7e` - fix(blog): add id attributes to H2 headings for TOC anchor links
- `98c9aaa` - feat(blog): add release highlight box and sticky table of contents (original TOC implementation)
