/**
 * Bundle-size guard for CI. Runs `wrangler deploy --dry-run --outdir=...`,
 * computes the gzipped size of the uploaded Worker, and fails with exit
 * code 1 if it crosses the configured ceiling.
 *
 * Why this exists: the OG engine adds ~770 KiB gzipped via workers-og +
 * resvg-wasm + fonts. A future dep bump or new route that accidentally
 * imports a heavy library could push us past Cloudflare's 3 MB free-tier
 * (or 10 MB paid) limits. We'd rather fail a PR than discover it in a
 * failed `wrangler deploy` on main.
 */

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const CEILING_BYTES = 2.5 * 1024 * 1024; // 2.5 MB compressed
const OUT_DIR = '.size-guard-bundle';

function main(): void {
  console.log('size-guard: running wrangler deploy --dry-run...');
  const result = spawnSync(
    'npx',
    ['wrangler', 'deploy', '--dry-run', '--outdir', OUT_DIR],
    { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' },
  );

  if (result.status !== 0) {
    console.error('size-guard: wrangler dry-run failed');
    console.error(result.stderr);
    process.exit(1);
  }

  let totalGzipped = 0;
  walk(OUT_DIR, (_path, bytes) => {
    totalGzipped += gzipSync(bytes).byteLength;
  });

  const totalKb = (totalGzipped / 1024).toFixed(1);
  const ceilingKb = (CEILING_BYTES / 1024).toFixed(1);
  const pct = ((totalGzipped / CEILING_BYTES) * 100).toFixed(1);

  if (totalGzipped > CEILING_BYTES) {
    console.error(
      `size-guard: FAIL — gzipped worker bundle is ${totalKb} KB (ceiling ${ceilingKb} KB, ${pct}%)`,
    );
    process.exit(1);
  }

  console.log(
    `size-guard: OK — gzipped worker bundle ${totalKb} KB / ${ceilingKb} KB (${pct}%)`,
  );
}

function walk(dir: string, visit: (path: string, bytes: Uint8Array) => void): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, visit);
    } else if (entry.isFile()) {
      visit(full, readFileSync(full));
    }
  }
}

main();
