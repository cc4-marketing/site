// check-download-links.mjs — guards the welcome-email download resource.
// Run via `npm run check:download-links` (wired into the /release skill).
// Checks:
//  1. The subscribe email template links to releases/latest (evergreen URL,
//     never pins a version that can go stale).
//  2. That URL resolves live to a concrete release tag (HTTP 200).
//  3. The quick-start entry command in the email still matches the one the
//     site advertises (siteData/FAQ) — the realistic drift vector.
//  4. No second copy of the template exists (functions/api/subscribe.js was
//     a dead Pages-era duplicate; duplicates drift).
import { readFileSync, existsSync } from 'node:fs';

let failed = false;
const fail = (msg) => { console.log(`FAIL  ${msg}`); failed = true; };
const pass = (msg) => console.log(`pass  ${msg}`);

const tpl = readFileSync('src/pages/api/subscribe.ts', 'utf8');

// 1. Evergreen link present, no pinned /releases/tag/ URL
if (tpl.includes('github.com/cc4-marketing/cc4.marketing/releases/latest')) {
  pass('email links to releases/latest (evergreen)');
} else {
  fail('email does not link to releases/latest — pinned or missing download link');
}
if (/releases\/tag\//.test(tpl)) fail('email pins a specific release tag — will go stale');

// 2. Live resolution
try {
  const res = await fetch('https://github.com/cc4-marketing/cc4.marketing/releases/latest', { redirect: 'follow' });
  if (res.ok && /\/releases\/tag\//.test(res.url)) {
    pass(`releases/latest resolves to ${res.url.split('/').pop()}`);
  } else {
    fail(`releases/latest returned ${res.status} (${res.url})`);
  }
} catch (e) {
  fail(`releases/latest unreachable: ${e.message}`);
}

// 3. Entry command consistency: email vs the site's own quick-start copy
const emailCmd = tpl.match(/type <code>(\/[\w-]+)<\/code>/)?.[1];
const siteSources = ['src/pages/blog/[slug].astro', 'src/lib/blog-post-schemas.ts']
  .filter(existsSync)
  .map((f) => readFileSync(f, 'utf8'))
  .join('');
const siteCmd = siteSources.match(/typing (\/start-[\w-]+)/)?.[1];
if (!emailCmd) fail('could not find the quick-start command in the email template');
else if (siteCmd && emailCmd !== siteCmd) fail(`email says "${emailCmd}" but site copy says "${siteCmd}"`);
else pass(`quick-start command "${emailCmd}" consistent`);

// 4. Single source of truth
if (existsSync('functions/api/subscribe.js')) {
  fail('functions/api/subscribe.js exists — dead duplicate of the email template, delete it');
} else {
  pass('no duplicate template (functions/api/subscribe.js gone)');
}

process.exit(failed ? 1 : 0);
