import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const modulesCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/modules' }),
  schema: z.object({
    title: z.string(),
    module: z.number(),
    lesson: z.number(),
    description: z.string(),
    duration: z.string().optional(),
    objectives: z.array(z.string()).optional(),
    order: z.number(),
  }),
});

// Skills gallery (/skills). Each markdown file is one CC4M Claude agent skill;
// the frontmatter is metadata, the body is the SKILL.md rendered inline.
// Rendered under SSR (prerender = false) — verified in Phase 1 spike.
const skillsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/skills' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    // GitHub repo for the skill's source; affordance hidden when absent.
    repo: z.string().url().optional(),
    // R2 object key for the packaged download; the download route 404s cleanly
    // (with an on-page GitHub fallback) when the object is missing.
    skillFile: z.string().optional(),
    // Byline slug; reserved for future author cross-linking.
    author: z.string().optional(),
    // File present + draft=false => live. draft entries are excluded everywhere.
    draft: z.boolean().default(false),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
  }),
});

export const collections = {
  modules: modulesCollection,
  skills: skillsCollection,
};
