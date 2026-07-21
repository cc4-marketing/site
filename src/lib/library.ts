import type { CollectionEntry } from 'astro:content';
import { TYPE_LABELS } from '../data/library-categories';

export type LibraryEntry = CollectionEntry<'library'>;

const AUTHOR_NAMES: Record<string, string> = {
  'tri-vo': 'Tri Vo',
  'alice-marketer': 'Alice Marketer',
};

/** The filename slug for an entry, e.g. `seo/content-brief-generator` -> `content-brief-generator`. */
export function fileSlug(entry: LibraryEntry): string {
  return entry.id.split('/').pop() ?? entry.id;
}

/** Public URL for an entry, driven by frontmatter category + file slug. */
export function entryUrl(entry: LibraryEntry): string {
  return `/library/${entry.data.category}/${fileSlug(entry)}/`;
}

export function authorName(slug: string): string {
  return AUTHOR_NAMES[slug] ?? slug;
}

export function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

/**
 * SERP-safe meta description for an entry. Prefers the hand-written
 * `metaDescription`, otherwise trims the long on-page `description` to a clean
 * word boundary under 155 chars (the on-page paragraph keeps the full text).
 */
export function metaFor(data: LibraryEntry['data']): string {
  if (data.metaDescription) return data.metaDescription;
  return truncateAtWord(data.description, 155);
}

/** Cuts text to <= max chars at the last word boundary, no trailing punctuation. */
export function truncateAtWord(text: string, max: number): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const cut = slice.slice(0, slice.lastIndexOf(' '));
  return cut.replace(/[\s,.;:]+$/, '');
}

/**
 * Resolve the related entries for a card row. Prefer the hand-picked `related`
 * slugs (matched by file slug), then fill from same-category siblings. Returns
 * 3 to 5 entries, never the entry itself.
 */
export function resolveRelated(entry: LibraryEntry, all: LibraryEntry[]): LibraryEntry[] {
  const self = fileSlug(entry);
  const bySlug = new Map(all.map((e) => [fileSlug(e), e]));
  const picked: LibraryEntry[] = [];
  const seen = new Set<string>([self]);

  for (const slug of entry.data.related) {
    const match = bySlug.get(slug);
    if (match && !seen.has(slug)) {
      picked.push(match);
      seen.add(slug);
    }
  }

  if (picked.length < 3) {
    for (const e of all) {
      if (picked.length >= 5) break;
      const slug = fileSlug(e);
      if (seen.has(slug)) continue;
      if (e.data.category === entry.data.category) {
        picked.push(e);
        seen.add(slug);
      }
    }
  }

  // Last resort: any other entries, so the row is never empty on a lone category.
  if (picked.length < 3) {
    for (const e of all) {
      if (picked.length >= 5) break;
      const slug = fileSlug(e);
      if (seen.has(slug)) continue;
      picked.push(e);
      seen.add(slug);
    }
  }

  return picked.slice(0, 5);
}

export interface FaqPair {
  q: string;
  a: string;
}

/**
 * Q&A pairs for an entry. One generic, code-derived question always leads (so
 * every entry emits a valid FAQPage), then any entry-specific `faq` pairs from
 * frontmatter follow. The visible <details> and the FAQPage JSON-LD read from
 * this same array, so they stay identical (Google's visible-match requirement).
 */
export function buildEntryFaq(entry: LibraryEntry): FaqPair[] {
  const { name, access, faq } = entry.data;
  const kind = typeLabel(entry.data.type).toLowerCase();
  const generic: FaqPair = {
    q: `Is ${name} free to use in Claude Code?`,
    a:
      access === 'free'
        ? `Yes. ${name} is a free entry in the marketing library. Copy the ${kind} and use it in Claude Code at no cost.`
        : `${name} is a paid entry. The free artifacts in the library stay free to copy; paid packs add extended versions.`,
  };

  return [generic, ...(faq ?? [])];
}
