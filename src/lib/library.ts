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
 * Standard question and answer pairs derived from entry metadata. Kept in code
 * (not frontmatter) so every entry emits a consistent, valid FAQPage without an
 * extra schema field. Real, useful answers, not filler.
 */
export function buildEntryFaq(entry: LibraryEntry): FaqPair[] {
  const { name, access } = entry.data;
  const kind = typeLabel(entry.data.type).toLowerCase();
  const priceLine =
    access === 'free'
      ? `Yes. ${name} is a free entry in the marketing library. Copy the ${kind} and use it in your own projects at no cost.`
      : `${name} is a paid entry. The free artifacts in the library stay free to copy; paid packs add extended versions.`;

  return [
    {
      q: `Is ${name} free to use?`,
      a: priceLine,
    },
    {
      q: `What does ${name} do?`,
      a: entry.data.description,
    },
    {
      q: `How do I use ${name} in Claude Code?`,
      a: `Copy the ${kind} from the block above, paste it into Claude Code (as a message, or save it in your project as a slash command or memory file), then swap the placeholders for your own details and run it.`,
    },
    {
      q: `Do I need to know how to code to use ${name}?`,
      a: `No. ${name} is written for marketers. If you can copy text into Claude Code and edit a few placeholders, you can run it. No programming required.`,
    },
  ];
}
