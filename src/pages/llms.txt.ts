import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getEmDashCollection } from 'emdash';
import { llmsTxtResponse } from 'site-kick/lib/agent-markdown.js';
import { buildCc4LlmsTxt } from '../lib/llms-txt';

// SSR, not prerendered: post titles live only in EmDash D1, which is reachable at request time but
// not during `astro build` (prebuild syncs slug + lastmod only). New posts show up without a deploy.
export const prerender = false;

export const GET: APIRoute = async () => {
  const [{ entries: posts }, lessons, entries] = await Promise.all([
    getEmDashCollection('posts'),
    getCollection('modules'),
    getCollection('library'),
  ]);
  const res = llmsTxtResponse(
    buildCc4LlmsTxt({
      posts: posts
        .filter((p) => p.data.status === 'published')
        .map((p) => ({ slug: p.data.slug, title: p.data.title, publishedAt: p.data.publishedAt })),
      lessons,
      entries,
    }),
  );
  // One D1 read per hour at most per edge; a new post reaches llms.txt within the hour.
  res.headers.set('cache-control', 'public, max-age=3600');
  return res;
};
