import type { APIRoute } from 'astro';
import { getSkillBySlug } from '../../../lib/skills';

export const prerender = false;

const NOT_FOUND_CACHE_CONTROL = 'public, max-age=300';
const DOWNLOAD_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug ?? '';

  // Validate the slug against the known collection BEFORE building any R2 key —
  // this prevents arbitrary-key fetches / path traversal (e.g. ../../secret).
  const entry = await getSkillBySlug(slug);

  if (!entry || !entry.data.skillFile) {
    return notFound();
  }

  const { env } = await import('cloudflare:workers');
  const media = (env as { MEDIA?: R2Bucket }).MEDIA;

  // Local dev without an R2 binding — degrade gracefully rather than throw.
  if (!media) {
    return notFound('Download unavailable in this environment.');
  }

  // The skillFile value is a fixed string from validated frontmatter; the slug
  // it pairs with has already been confirmed to exist in the collection.
  const r2Key = `skills/${entry.data.skillFile}`;
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
