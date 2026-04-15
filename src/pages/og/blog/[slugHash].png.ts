import type { APIRoute } from 'astro';
import { getEmDashEntry } from 'emdash';
import { computeOgHash } from '../../../lib/og/hash';
import { parseSlugHash } from '../../../lib/og/url';
import { renderOgImage, isValidPng } from '../../../lib/og/renderer';
import { renderBlogTemplate, type BylineForOg } from '../../../lib/og/templates/blog';

export const prerender = false;

const PNG_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const SHORT_CACHE_CONTROL = 'public, max-age=60';
const NOT_FOUND_CACHE_CONTROL = 'public, max-age=300';

export const GET: APIRoute = async ({ params, url }) => {
  const startedAt = Date.now();
  const parsed = parseSlugHash(params.slugHash ?? '');
  if (!parsed) {
    return notFound();
  }
  const { slug, hash: urlHash } = parsed;

  const { env, ctx } = await import('cloudflare:workers');

  // Kill-switch — redirect to static fallback without touching the engine.
  if ((env as Record<string, string | undefined>).OG_ENGINE_ENABLED === 'false') {
    return Response.redirect(new URL('/og-blog.png', url).toString(), 302);
  }

  // Layer 1: edge cache.
  const cache = (globalThis as { caches?: CacheStorage }).caches?.default;
  const cacheReq = new Request(url.toString(), { method: 'GET' });
  if (cache) {
    const hit = await cache.match(cacheReq);
    if (hit) return hit;
  }

  // Layer 2: R2 (MEDIA bucket, prefix `og/`).
  const media = (env as { MEDIA?: R2Bucket }).MEDIA;
  const r2Key = `og/blog/${slug}-${urlHash}.png`;
  if (media) {
    const obj = await media.get(r2Key).catch(() => null);
    if (obj) {
      const body = await obj.arrayBuffer();
      const resp = pngResponse(new Uint8Array(body));
      if (cache && ctx?.waitUntil) {
        ctx.waitUntil(cache.put(cacheReq, resp.clone()));
      }
      console.log(
        JSON.stringify({
          type: 'og.generate',
          slug,
          cacheLayer: 'r2',
          pngBytes: body.byteLength,
          renderMs: Date.now() - startedAt,
          ok: true,
        }),
      );
      return resp;
    }
  }

  // Layer 3: fetch post from Emdash, validate hash, render.
  // Emdash exposes content fields under `entry.data` (not hoisted to the
  // top-level entry object). Mirror the pattern in src/pages/blog/[slug].astro.
  let post;
  try {
    const entry = await getEmDashEntry('posts', slug);
    post = entry.entry?.data;
  } catch {
    return notFound();
  }
  if (!post) return notFound();

  const currentHash = await computeOgHash({
    title: post.title ?? '',
    excerpt: post.excerpt,
    bylineIds: (post.bylines ?? []).map((b) => b.byline.id),
    updatedAt: post.updatedAt ?? new Date(0),
  });

  if (urlHash !== currentHash) {
    // URL is stale — redirect to current canonical URL.
    return new Response(null, {
      status: 302,
      headers: {
        location: `/og/blog/${slug}-${currentHash}.png`,
        'cache-control': SHORT_CACHE_CONTROL,
      },
    });
  }

  const html = renderBlogTemplate({
    title: post.title ?? 'Untitled',
    excerpt: post.excerpt,
    bylines: bylinesForOg(post.bylines as Array<{ byline: { displayName: string }; roleLabel?: string | null }> | undefined),
  });

  let renderResp: Response;
  try {
    renderResp = renderOgImage(html);
  } catch {
    return fallbackGeneric();
  }

  const png = new Uint8Array(await renderResp.arrayBuffer());
  if (!isValidPng(png)) {
    return fallbackGeneric();
  }

  const out = pngResponse(png);

  // Persist to R2 + warm the edge cache in the background. Non-fatal on failure.
  if (ctx?.waitUntil) {
    const persist = Promise.all([
      media
        ? media
            .put(r2Key, png, { httpMetadata: { contentType: 'image/png' } })
            .catch((err) => console.error('og.r2_put_failed', { slug, err: String(err) }))
        : Promise.resolve(),
      cache
        ? cache
            .put(cacheReq, out.clone())
            .catch((err) => console.error('og.cache_put_failed', { slug, err: String(err) }))
        : Promise.resolve(),
    ]);
    ctx.waitUntil(persist);
  }

  console.log(
    JSON.stringify({
      type: 'og.generate',
      slug,
      cacheLayer: 'miss',
      pngBytes: png.byteLength,
      renderMs: Date.now() - startedAt,
      ok: true,
    }),
  );

  return out;
};

function bylinesForOg(
  bylines: Array<{ byline: { displayName: string }; roleLabel?: string | null }> | undefined,
): BylineForOg[] {
  if (!bylines) return [];
  return bylines.map((b) => ({
    displayName: b.byline.displayName,
    roleLabel: b.roleLabel ?? undefined,
  }));
}

function pngResponse(bytes: Uint8Array): Response {
  return new Response(bytes, {
    headers: {
      'content-type': 'image/png',
      'cache-control': PNG_CACHE_CONTROL,
      'cdn-cache-control': PNG_CACHE_CONTROL,
    },
  });
}

function notFound(): Response {
  return new Response('Not found', {
    status: 404,
    headers: {
      'content-type': 'text/plain',
      'cache-control': NOT_FOUND_CACHE_CONTROL,
    },
  });
}

/**
 * Served when Satori throws mid-render (corrupt CSS, unexpected input). We
 * return a 200 with the generic fallback so crawlers don't pin an error —
 * worst case is a plain cover, never a broken one.
 */
function fallbackGeneric(): Response {
  return Response.redirect('https://cc4.marketing/og-blog.png', 302);
}
