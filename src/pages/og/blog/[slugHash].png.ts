import type { APIRoute } from 'astro';
import { getEmDashEntry } from 'emdash';
import { computeOgHash } from '../../../lib/og/hash';
import { parseSlugHash } from '../../../lib/og/url';
import { renderOgImage, isValidPng } from '../../../lib/og/renderer';
import { renderBlogTemplate, type BylineForOg } from '../../../lib/og/templates/blog';

type EmdashByline = { byline: { id?: string; displayName: string; avatarMediaId?: string | null }; roleLabel?: string | null };

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

  const bylinesWithAvatars = await resolveBylinesWithAvatars(
    post.bylines as EmdashByline[] | undefined,
    env as { DB?: D1Database; MEDIA?: R2Bucket },
  );

  const html = renderBlogTemplate({
    title: post.title ?? 'Untitled',
    excerpt: post.excerpt,
    bylines: bylinesWithAvatars,
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

/**
 * For each byline, look up its avatar (media.storage_key) and fetch the
 * bytes from R2 so Satori can embed them as a base64 data URI. Non-fatal
 * on any lookup failure — the template falls back to an initials circle.
 */
async function resolveBylinesWithAvatars(
  bylines: EmdashByline[] | undefined,
  env: { DB?: D1Database; MEDIA?: R2Bucket },
): Promise<BylineForOg[]> {
  if (!bylines || bylines.length === 0) return [];

  const mediaIds = bylines
    .map((b) => b.byline.avatarMediaId)
    .filter((id): id is string => !!id);

  // Batch-resolve media → storage_key in one D1 query.
  const storageKeys = new Map<string, string>();
  if (env.DB && mediaIds.length > 0) {
    try {
      const placeholders = mediaIds.map(() => '?').join(',');
      const result = await env.DB.prepare(
        `SELECT id, storage_key FROM media WHERE id IN (${placeholders})`,
      )
        .bind(...mediaIds)
        .all<{ id: string; storage_key: string }>();
      for (const row of result.results ?? []) {
        if (row.storage_key) storageKeys.set(row.id, row.storage_key);
      }
    } catch (err) {
      console.error('og.media_lookup_failed', { err: String(err) });
    }
  }

  const results: BylineForOg[] = [];
  for (const b of bylines) {
    let avatarDataUri: string | undefined;
    const mediaId = b.byline.avatarMediaId ?? undefined;
    const key = mediaId ? storageKeys.get(mediaId) : undefined;
    if (key && env.MEDIA) {
      try {
        const obj = await env.MEDIA.get(key);
        if (obj) {
          const bytes = new Uint8Array(await obj.arrayBuffer());
          const contentType = obj.httpMetadata?.contentType ?? 'image/png';
          avatarDataUri = `data:${contentType};base64,${bytesToBase64(bytes)}`;
        }
      } catch (err) {
        console.error('og.avatar_fetch_failed', { key, err: String(err) });
      }
    }
    results.push({
      displayName: b.byline.displayName,
      roleLabel: b.roleLabel ?? undefined,
      avatarDataUri,
    });
  }
  return results;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.byteLength; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.byteLength)));
  }
  // btoa is available on Workers runtime
  return btoa(binary);
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
