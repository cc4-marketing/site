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

// Marketing Library: curated prompts, slash commands, subagents, MCP lists, and
// skills for marketers using Claude Code. Free entries ship now; the paid fields
// (access/polarProductId/polarCheckoutUrl/price) sit ready so paid packs drop in
// later with no schema change once Polar is wired up.
const libraryCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/library' }),
  schema: z.object({
    name: z.string(),
    category: z.enum([
      'seo',
      'content',
      'paid-ads',
      'analytics',
      'email',
      'social',
      'reporting',
      'competitive',
      'project-ops',
    ]),
    type: z.enum(['prompt', 'command', 'subagent', 'mcp', 'skill']),
    tagline: z.string().max(90),
    description: z.string(),
    access: z.enum(['free', 'paid']).default('free'),
    polarProductId: z.string().optional(),
    polarCheckoutUrl: z.string().optional(),
    price: z.number().optional(),
    related: z.array(z.string()).default([]),
    author: z.enum(['tri-vo', 'alice-marketer']),
    tags: z.array(z.string()).default([]),
    updatedAt: z.coerce.date().optional(),
    publishedAt: z.coerce.date().optional(),
    metaDescription: z.string().max(160).optional(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }),
});

export const collections = {
  modules: modulesCollection,
  library: libraryCollection,
};
