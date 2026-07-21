import type { APIRoute } from 'astro';
import { getLibraryEntryBySlug } from '../../../lib/library';

export const prerender = false;

const NOT_FOUND_CACHE_CONTROL = 'public, max-age=300';
const DOWNLOAD_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug ?? '';

  // Validate the slug against the known collection BEFORE building any R2 key.
  // This prevents arbitrary-key fetches / path traversal (e.g. ../../secret):
  // only slugs that map to a real skill entry can reach R2 at all.
  const entry = await getLibraryEntryBySlug(slug);

  if (!entry || !entry.data.downloadKey) {
    return notFound();
  }

  const { env } = await import('cloudflare:workers');
  const media = (env as { MEDIA?: R2Bucket }).MEDIA;

  // Local dev / missing binding: degrade to a friendly 404 rather than a 500.
  if (!media) {
    return notFound('Download unavailable in this environment.');
  }

  // downloadKey is a fixed string from validated frontmatter; its slug has
  // already been confirmed to exist in the collection.
  const r2Key = `skills/${entry.data.downloadKey}`;
  const obj = await media.get(r2Key).catch(() => null);

  if (!obj) {
    return notFound();
  }

  const body = await obj.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${slug}.skill"`,
      'Cache-Control': DOWNLOAD_CACHE_CONTROL,
      'X-Robots-Tag': 'noindex',
    },
  });
};

function notFound(message = 'Skill download not found.'): Response {
  return new Response(message, {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': NOT_FOUND_CACHE_CONTROL,
      'X-Robots-Tag': 'noindex',
    },
  });
}
