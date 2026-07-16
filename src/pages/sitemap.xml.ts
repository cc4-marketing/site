// /sitemap.xml used to serve an empty <urlset> (source: not in this repo; likely
// an integration-injected route or stale deploy asset). Crawlers and AI bots that
// probe the conventional path got a contradictory signal vs the real sitemap at
// /sitemap-index.xml (which robots.txt declares). File-based routes take priority
// over injected routes, so this guarantees a correct response.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect }) => redirect('/sitemap-index.xml', 301);
