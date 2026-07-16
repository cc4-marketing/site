// /sitemap.xml used to serve an empty <urlset>. Confirmed source: emdash injects
// its own sitemap.xml route (emdash/src/astro/routes/sitemap.xml.ts) which renders
// empty because D1 content is not queryable at build. This file-based route takes
// priority and redirects crawlers to the real sitemap at /sitemap-index.xml
// (declared in robots.txt). NOTE: Astro warns about the route collision and will
// hard-error in a future major; if emdash ships a disable-sitemap option, use it
// and keep this redirect.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect }) => redirect('/sitemap-index.xml', 301);
