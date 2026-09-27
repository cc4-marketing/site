import { defineMiddleware } from 'astro/middleware';

// Registered before EmDash so setup/auth short-circuits cannot bypass site policy.
export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context;
  // Match the normalized path Astro and EmDash route, including encoded segments.
  const url = new URL(context.url);
  const { pathname } = url;

  // Redirect HTTP before CMS setup or authentication. Keep local preview usable.
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol === 'http:' && !isLocal) {
    url.protocol = 'https:';
    return withSecurityHeaders(context.redirect(url.toString(), 301));
  }

  // Parse every redirect value before the admin app can consume it.
  if (pathname.startsWith('/_emdash/') && url.searchParams.has('redirect')) {
    const sameOrigin = url.searchParams.getAll('redirect').every((target) => {
      if (!target.startsWith('/') || target.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(target)) {
        return false;
      }
      try {
        return new URL(target, url.origin).origin === url.origin;
      } catch {
        return false;
      }
    });
    if (!sameOrigin) {
      url.searchParams.delete('redirect');
      return withSecurityHeaders(context.redirect(url.pathname + url.search, 302), true);
    }
  }

  // Add noindex even when EmDash returns early for setup/authentication.
  if (pathname.startsWith('/_emdash/')) {
    return withSecurityHeaders(await next(), true);
  }

  // Let EmDash own the route without competing with its injected endpoint.
  if (pathname === '/sitemap.xml') {
    return withSecurityHeaders(context.redirect('/sitemap-index.xml', 301));
  }

  // The /skills gallery never shipped: it was folded into /library/. Any
  // pre-merge shares or stray index entries get a 301 to the library hub.
  if (pathname === '/skills' || pathname.startsWith('/skills/')) {
    return withSecurityHeaders(context.redirect('/library/', 301));
  }

  const isPage =
    !pathname.endsWith('/') &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_') &&
    // Skip anything with a file extension (robots.txt, sitemap-index.xml, .png, ...)
    !/\.[a-zA-Z0-9]+$/.test(pathname);

  if (isPage && (request.method === 'GET' || request.method === 'HEAD')) {
    return withSecurityHeaders(context.redirect(`${pathname}/${url.search}`, 301));
  }

  return withSecurityHeaders(await next());
});

// Preserve EmDash's stricter CSP while hardening public SSR responses.
function withSecurityHeaders(res: Response, noindex = false): Response {
  const headers = new Headers(res.headers);
  if (noindex) headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  if (!headers.has('Content-Security-Policy')) {
    headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests",
    );
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
