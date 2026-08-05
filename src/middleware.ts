import { defineMiddleware } from 'astro:middleware';

// 301 non-trailing-slash page URLs to their trailing-slash form.
// Without this, /blog/foo and /blog/foo/ both serve 200 and every page has a
// live duplicate variant held together only by its canonical tag (this caused
// real "Duplicate without user-selected canonical" errors in Search Console).
export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context;
  const url = new URL(request.url);
  const { pathname } = url;

  // Force HTTPS. Cloudflare currently serves http:// with a 200 (no edge
  // redirect), so http and https are live duplicates — Google even indexed
  // http://cc4.marketing/_emdash/admin/setup. 301 any http request to https.
  if (url.protocol === 'http:') {
    url.protocol = 'https:';
    return context.redirect(url.toString(), 301);
  }

  // The Emdash CMS admin/API under /_emdash/ must never be indexed. Emit
  // noindex on the response (not a robots.txt Disallow): the admin URL is
  // already indexed, and blocking it in robots would stop the recrawl that
  // needs to see this header before Google can drop it.
  if (pathname.startsWith('/_emdash/')) {
    const res = await next();
    const headers = new Headers(res.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }

  // The /skills gallery never shipped: it was folded into /library/. Any
  // pre-merge shares or stray index entries get a 301 to the library hub.
  if (pathname === '/skills' || pathname.startsWith('/skills/')) {
    return context.redirect('/library/', 301);
  }

  const isPage =
    !pathname.endsWith('/') &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_') &&
    // Skip anything with a file extension (robots.txt, sitemap-index.xml, .png, ...)
    !/\.[a-zA-Z0-9]+$/.test(pathname);

  if (isPage && (request.method === 'GET' || request.method === 'HEAD')) {
    return context.redirect(`${pathname}/${url.search}`, 301);
  }

  return next();
});
