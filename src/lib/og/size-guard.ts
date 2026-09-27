/**
 * Check the actual upload size reported by the pinned Wrangler dry-run.
 * Cloudflare limits Workers to 64 MiB uncompressed on Free and Paid plans;
 * gzip size is diagnostic only. Do not count stale outdir files or source maps.
 * https://developers.cloudflare.com/workers/platform/limits/#worker-size
 */

import { spawnSync } from 'node:child_process';

const CEILING_BYTES = 64 * 1024 * 1024;

function main(): void {
  console.log('size-guard: running wrangler deploy --dry-run...');
  const result = spawnSync(
    'npx',
    ['wrangler', 'deploy', '--dry-run'],
    { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' },
  );

  if (result.status !== 0) {
    console.error('size-guard: wrangler dry-run failed');
    console.error(result.stderr);
    process.exit(1);
  }

  const upload = result.stdout.match(/Total Upload:\s+(\d+(?:\.\d+)?) KiB\s*\/\s*gzip:\s+(\d+(?:\.\d+)?) KiB/);
  if (!upload) {
    console.error('size-guard: Wrangler did not report upload size');
    process.exit(1);
  }
  const totalBytes = Math.ceil(Number(upload[1]) * 1024);
  const totalMb = (totalBytes / 1024 / 1024).toFixed(2);
  const ceilingMb = (CEILING_BYTES / 1024 / 1024).toFixed(0);
  const gzipMb = (Number(upload[2]) / 1024).toFixed(2);

  if (totalBytes >= CEILING_BYTES) {
    console.error(
      `size-guard: FAIL: upload ${totalMb} MiB reaches ${ceilingMb} MiB uncompressed limit (gzip ${gzipMb} MiB)`,
    );
    process.exit(1);
  }

  console.log(
    `size-guard: OK: upload ${totalMb} MiB / ${ceilingMb} MiB uncompressed (gzip ${gzipMb} MiB, informational)`,
  );
}

main();
