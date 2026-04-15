/**
 * Post-build smoke test: verifies the OG build produced all expected static
 * PNGs and that each is a valid PNG of reasonable size. Fails with exit code
 * 1 so CI surfaces the problem before deploy.
 *
 * Run after `npm run og:build` (or via `npm run og:smoke`).
 */

import { statSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const OUT_DIR = join(ROOT, 'public/og');

const EXPECTED_PAGES = ['home', 'blog', 'changelog', 'authors', 'download', 'brand-guide'];
const EXPECTED_MODULES = [
  '0-introduction',
  '0-installation',
  '0-start-clone',
  '0-github-pr-guide',
  '1-welcome',
  '1-working-with-files',
  '1-first-tasks',
  '1-agents',
  '1-custom-agents',
  '1-project-memory',
  '1-navigation',
  '2-campaign-brief',
  '2-content-strategy',
  '2-marketing-copy',
  '2-analytics',
  '2-competitive-analysis',
  '2-seo-optimization',
];

const MIN_BYTES = 1000;
const MAX_BYTES = 300 * 1024;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function checkPng(relPath: string): string | null {
  const full = join(OUT_DIR, relPath);
  let stat;
  try {
    stat = statSync(full);
  } catch {
    return `missing: ${relPath}`;
  }
  if (stat.size < MIN_BYTES) return `too small (${stat.size} B): ${relPath}`;
  if (stat.size > MAX_BYTES) return `suspiciously large (${stat.size} B): ${relPath}`;
  const head = readFileSync(full, { encoding: null }).subarray(0, PNG_MAGIC.length);
  for (let i = 0; i < PNG_MAGIC.length; i++) {
    if (head[i] !== PNG_MAGIC[i]) return `not a valid PNG: ${relPath}`;
  }
  return null;
}

function main(): void {
  const errors: string[] = [];
  const expected = [
    ...EXPECTED_PAGES.map((k) => `pages/${k}.png`),
    ...EXPECTED_MODULES.map((k) => `modules/${k}.png`),
  ];

  for (const rel of expected) {
    const err = checkPng(rel);
    if (err) errors.push(err);
  }

  // Catch orphan files (e.g. an old slug that's no longer generated).
  const seen = new Set(expected);
  for (const sub of ['pages', 'modules']) {
    let entries: string[] = [];
    try {
      entries = readdirSync(join(OUT_DIR, sub));
    } catch {
      continue;
    }
    for (const entry of entries) {
      const rel = `${sub}/${entry}`;
      if (entry.endsWith('.png') && !seen.has(rel)) {
        errors.push(`orphan (remove or add to expected list): ${rel}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error(`og:smoke FAILED — ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(`og:smoke OK — ${expected.length} images validated`);
}

main();
