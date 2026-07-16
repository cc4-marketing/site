// Shared heading slugifier for blog TOC anchors. Single source of truth:
// BlogContent.astro assigns heading IDs and [slug].astro builds TOC links
// from the same function, so anchors can never silently diverge (plan R12).
export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
}
