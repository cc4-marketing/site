import type { APIRoute } from 'astro';
import { renderOgImage } from '../../lib/og/renderer';
import { renderBlogTemplate } from '../../lib/og/templates/blog';
import { renderModuleLessonTemplate } from '../../lib/og/templates/module-lesson';
import { renderGenericTemplate } from '../../lib/og/templates/generic';

export const prerender = false;

/**
 * Dev-only preview endpoint. Accepts query params for every template and
 * returns the rendered PNG. Powers /_dev/og-preview.astro.
 *
 * Locked behind import.meta.env.DEV so it can't leak to production even if
 * a build slips through — returns 404 anywhere else.
 */
export const GET: APIRoute = async ({ url }) => {
  if (!import.meta.env.DEV) {
    return new Response('Not found', {
      status: 404,
      headers: { 'cache-control': 'no-store' },
    });
  }

  const q = url.searchParams;
  const template = q.get('template') ?? 'blog';

  let html: string;

  if (template === 'blog') {
    const avatarUrl = q.get('avatarUrl');
    let avatarDataUri: string | undefined;
    if (avatarUrl) {
      try {
        const r = await fetch(avatarUrl.startsWith('http') ? avatarUrl : new URL(avatarUrl, url));
        if (r.ok) {
          const ct = r.headers.get('content-type') ?? 'image/png';
          const buf = new Uint8Array(await r.arrayBuffer());
          let binary = '';
          for (let i = 0; i < buf.byteLength; i++) binary += String.fromCharCode(buf[i]);
          avatarDataUri = `data:${ct};base64,${btoa(binary)}`;
        }
      } catch {
        // fall through to initials
      }
    }
    const bylines = (q.get('bylines') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((displayName, i) => ({
        displayName,
        roleLabel: i === 0 ? q.get('role') ?? undefined : undefined,
        avatarDataUri: i === 0 ? avatarDataUri : undefined,
      }));
    html = renderBlogTemplate({
      title: q.get('title') ?? 'Untitled',
      excerpt: q.get('excerpt') ?? undefined,
      category: q.get('category') ?? undefined,
      bylines,
    });
  } else if (template === 'module-lesson') {
    html = renderModuleLessonTemplate({
      module: Number(q.get('module') ?? '0'),
      lesson: Number(q.get('lesson') ?? '1'),
      title: q.get('title') ?? 'Untitled',
      description: q.get('description') ?? undefined,
      duration: q.get('duration') ?? undefined,
    });
  } else {
    const accent = q.get('accent');
    html = renderGenericTemplate({
      title: q.get('title') ?? 'Untitled',
      subtitle: q.get('subtitle') ?? undefined,
      badge: q.get('badge') ?? undefined,
      accent:
        accent === 'rust' || accent === 'olive' || accent === 'mustard' || accent === 'plum'
          ? accent
          : undefined,
    });
  }

  return renderOgImage(html, { cacheControl: 'no-store' });
};
