#!/usr/bin/env node
// Generates src/data/blog-sitemap-data.json from the Emdash D1 database so the
// sitemap's blog URLs and <lastmod> dates stay in sync with the CMS with zero
// manual upkeep. Runs in `prebuild` (before `astro build`); also runnable on
// demand via `npm run sync:blog-sitemap`.
//
// Emdash D1 is not queryable from astro.config's node/Vite context, but a
// standalone script can shell out to wrangler. In CI the Cloudflare creds used
// for `wrangler deploy` also authorize this read. If D1 is ever unreachable the
// build must NOT fail: we keep the committed JSON as a last-known-good fallback.
import { execSync } from 'node:child_process';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../src/data/blog-sitemap-data.json');

// lastmod = last content change (updated_at), falling back to publish date.
const SQL =
  "SELECT slug, date(coalesce(updated_at, published_at)) AS lastmod " +
  "FROM ec_posts WHERE status='published' AND deleted_at IS NULL ORDER BY slug";

try {
  const raw = execSync(
    `npx wrangler d1 execute cc4-emdash --remote --json --command ${JSON.stringify(SQL)}`,
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000 },
  );
  // --json prints a clean JSON array to stdout; slice from the first bracket in
  // case wrangler ever prepends a banner line.
  const parsed = JSON.parse(raw.slice(raw.indexOf('[')));
  const rows = parsed?.[0]?.results ?? [];
  if (!rows.length) throw new Error('query returned no published posts');
  const data = rows.map((r) => ({ slug: r.slug, lastmod: r.lastmod }));
  writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');
  console.log(`[blog-sitemap] synced ${data.length} posts from D1 -> ${OUT}`);
} catch (err) {
  if (existsSync(OUT)) {
    const n = JSON.parse(readFileSync(OUT, 'utf8')).length;
    console.warn(`[blog-sitemap] D1 sync failed (${err.message}); keeping committed ${n}-post fallback.`);
  } else {
    console.error(`[blog-sitemap] D1 sync failed and no committed fallback at ${OUT}.`);
    process.exit(1);
  }
}
