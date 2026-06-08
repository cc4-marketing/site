import { getCollection, type CollectionEntry } from 'astro:content';

export type SkillEntry = CollectionEntry<'skills'>;

/** Slug for a skill entry — the filename without extension or directory. */
export function skillSlug(entry: SkillEntry): string {
  return entry.id.replace(/\.md$/, '').split('/').pop() ?? entry.id;
}

/** All published (non-draft) skills, newest first; ties broken by name. */
export async function getPublishedSkills(): Promise<SkillEntry[]> {
  return (await getCollection('skills'))
    .filter((s) => !s.data.draft)
    .toSorted((a, b) => {
      const byDate = b.data.publishedAt.getTime() - a.data.publishedAt.getTime();
      return byDate !== 0 ? byDate : a.data.name.localeCompare(b.data.name);
    });
}

/** Look up a single published skill by slug, or null if absent/draft. */
export async function getSkillBySlug(slug: string): Promise<SkillEntry | null> {
  const skills = await getCollection('skills');
  return skills.find((e) => skillSlug(e) === slug && !e.data.draft) ?? null;
}
