// check-blog-tokens.mjs — acceptance checks for the blog token system (plan U1).
// Two halves:
//   1. Ratios: parse global.css token blocks (light + dark), resolve one level of
//      var() indirection, compute WCAG contrast for the declared pair table, and
//      check the sheet/desk luminance separation. Runs always.
//   2. Grep: raw color literals (rgba(/hsla(/hex) must not appear in blog files
//      outside global.css. Skipped with --ratios-only (expected to fail until the
//      U4 literal-to-token swap lands; see plan).
// Exit non-zero on any failure. Promotion to a CI gate is deferred to the
// governance round; run manually or via `npm run check:blog-tokens`.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RATIOS_ONLY = process.argv.includes('--ratios-only');
const css = readFileSync('src/styles/global.css', 'utf8');

// --- Parse token blocks -----------------------------------------------------
function parseBlock(selectorRe) {
  const m = css.match(selectorRe);
  if (!m) throw new Error(`Block not found: ${selectorRe}`);
  const body = css.slice(m.index).match(/\{([\s\S]*?)\n\}/)[1];
  const tokens = {};
  for (const line of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tokens[line[1]] = line[2].trim();
  return tokens;
}
const light = parseBlock(/:root\s*/);
const darkOverrides = parseBlock(/html\[data-theme="dark"\]\s*/);
const dark = { ...light, ...darkOverrides };

// Resolve one level of var() indirection (e.g., --text-secondary: var(--ink-70)).
function resolve(tokens, name) {
  let v = tokens[name];
  for (let i = 0; v && v.startsWith('var(') && i < 3; i++) v = tokens[v.slice(4, -1).trim()];
  return v;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// --- Declared pair table (plan R5): text-legal pairs need >= 4.5:1 ----------
// Each entry: [foreground token, background token, threshold, label]
const PAIRS = [
  ['--ink-100', '--bg-primary', 4.5, 'primary ink on desk'],
  ['--ink-100', '--sheet', 4.5, 'primary ink on sheet'],
  ['--ink-70', '--bg-primary', 4.5, 'secondary ink on desk'],
  ['--ink-70', '--sheet', 4.5, 'secondary ink on sheet'],
  ['--ink-70', '--tint-rust-1', 4.5, 'secondary ink on rust tint 1'],
  ['--ink-100', '--tint-rust-2', 4.5, 'primary ink on rust tint 2'],
  ['--ink-100', '--tint-plum-1', 4.5, 'primary ink on plum tint 1'],
  ['--code-ink', '--code-surface', 4.5, 'code text on code surface'],
  ['--rust', '--sheet', 3.0, 'rust accent (large/underlined) on sheet'],
  ['--text-primary', '--sheet', 4.5, 'body text on sheet'],
];
// Sheet/desk separation: keeps the document-on-desk metaphor legible.
// Light is inherently close (white on cream); border + shadow carry the rest.
const SHEET_DESK_MIN = 1.1;

let failed = false;
for (const [themeName, tokens] of [['light', light], ['dark', dark]]) {
  console.log(`\n== ${themeName} ==`);
  for (const [fg, bg, min, label] of PAIRS) {
    if (themeName === 'dark' && label.includes('light only')) continue;
    const f = resolve(tokens, fg);
    const b = resolve(tokens, bg);
    if (!f || !b) { console.log(`FAIL  ${label}: unresolved ${!f ? fg : bg}`); failed = true; continue; }
    const r = ratio(f, b);
    const ok = r >= min;
    if (!ok) failed = true;
    console.log(`${ok ? 'pass' : 'FAIL'}  ${label}: ${f} on ${b} = ${r.toFixed(2)} (min ${min})`);
  }
  const sd = ratio(resolve(tokens, '--sheet'), resolve(tokens, '--bg-primary'));
  const ok = sd >= SHEET_DESK_MIN;
  if (!ok) failed = true;
  console.log(`${ok ? 'pass' : 'FAIL'}  sheet/desk separation = ${sd.toFixed(2)} (min ${SHEET_DESK_MIN})`);
}

// --- Grep half: no raw color literals in blog files (AE5) -------------------
if (!RATIOS_ONLY) {
  const targets = [];
  const walk = (dir) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(astro|css|ts|tsx)$/.test(f)) targets.push(p);
    }
  };
  walk('src/pages/blog');
  walk('src/components/blog');
  targets.push('src/components/BlogContent.astro', 'src/styles/blog-prose.css');

  const LITERAL = /rgba?\(|hsla?\(|#[0-9a-fA-F]{3,8}\b/g;
  let hits = 0;
  for (const file of targets) {
    // Blank out block/HTML comments (newline-preserving so line numbers hold):
    // explanatory comments legitimately mention retired literals.
    const source = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
      .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
    const lines = source.split('\n');
    lines.forEach((line, i) => {
      // Ignore anchors/ids (#foo) by requiring hex-shaped match; strip URLs and comments.
      const cleaned = line.replace(/\/\/.*$/, '').replace(/https?:\S+/g, '');
      for (const m of cleaned.matchAll(LITERAL)) {
        // Filter false positives: hex-like strings that are not colors (e.g. #main)
        if (m[0].startsWith('#') && !/^#[0-9a-fA-F]{3}\b|^#[0-9a-fA-F]{6}\b|^#[0-9a-fA-F]{8}\b/.test(m[0])) continue;
        console.log(`RAW   ${file}:${i + 1}  ${line.trim().slice(0, 90)}`);
        hits++;
      }
    });
  }
  if (hits > 0) { console.log(`\nFAIL  ${hits} raw color literal(s) in blog files (must be tokens)`); failed = true; }
  else console.log('\npass  no raw color literals in blog files');
}

process.exit(failed ? 1 : 0);
