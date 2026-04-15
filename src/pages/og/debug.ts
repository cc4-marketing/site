import type { APIRoute } from 'astro';
import { getEmDashEntry } from 'emdash';
import { computeOgHash } from '../../lib/og/hash';

export const prerender = false;

/**
 * Dev-only debug introspection. Given ?slug=..., returns JSON with the
 * computed hash, source fields, and R2 state for the post's OG image.
 * Helps answer "why is this crawler still showing the old image?"
 *
 * Hard-gated to import.meta.env.DEV to prevent any accidental prod exposure.
 */
export const GET: APIRoute = async ({ url }) => {
  if (!import.meta.env.DEV) {
    return new Response('Not found', {
      status: 404,
      headers: { 'cache-control': 'no-store' },
    });
  }

  const slug = url.searchParams.get('slug');
  if (!slug) {
    return Response.json(
      { error: 'missing required param: slug' },
      { status: 400, headers: { 'cache-control': 'no-store' } },
    );
  }

  const { env } = await import('cloudflare:workers');

  let post: Record<string, unknown> | null = null;
  let emdashError: string | null = null;
  try {
    const entry = await getEmDashEntry('posts', slug);
    post = (entry.entry?.data ?? null) as Record<string, unknown> | null;
  } catch (err) {
    emdashError = String(err);
  }

  let hash: string | null = null;
  let sourceFields: Record<string, unknown> | null = null;
  if (post) {
    sourceFields = {
      title: post.title,
      excerpt: post.excerpt,
      bylineIds:
        (post.bylines as Array<{ byline: { id: string } }> | undefined)?.map(
          (b) => b.byline.id,
        ) ?? [],
      updatedAt: post.updatedAt,
      featuredImageSrc: (post.featured_image as { src?: string } | undefined)?.src,
    };
    hash = await computeOgHash({
      title: (post.title as string) ?? '',
      excerpt: post.excerpt as string | undefined,
      bylineIds: (sourceFields.bylineIds as string[]) ?? [],
      updatedAt: (post.updatedAt as Date | string | undefined) ?? new Date(0),
    });
  }

  const r2Key = hash ? `og/blog/${slug}-${hash}.png` : null;
  let r2Exists = false;
  let r2Uploaded: string | null = null;
  if (r2Key) {
    const media = (env as { MEDIA?: R2Bucket }).MEDIA;
    if (media) {
      const obj = await media.head(r2Key).catch(() => null);
      r2Exists = !!obj;
      r2Uploaded = obj?.uploaded?.toISOString?.() ?? null;
    }
  }

  return Response.json(
    {
      slug,
      post: post ? 'found' : 'not-found',
      emdashError,
      contentHash: hash,
      sourceFields,
      r2Key,
      r2Exists,
      r2Uploaded,
      currentOgUrl: hash ? `/og/blog/${slug}-${hash}.png` : null,
      note: 'Dev-only endpoint. Gated on import.meta.env.DEV.',
    },
    {
      headers: { 'cache-control': 'no-store' },
    },
  );
};
