import { defineMiddleware } from 'astro:middleware';

// 301 non-trailing-slash page URLs to their trailing-slash form.
// Without this, /blog/foo and /blog/foo/ both serve 200 and every page has a
// live duplicate variant held together only by its canonical tag (this caused
// real "Duplicate without user-selected canonical" errors in Search Console).
export const onRequest = defineMiddleware((context, next) => {
  const { request } = context;
  const url = new URL(request.url);
  const { pathname } = url;

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
