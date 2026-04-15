/**
 * Build-time OG image generator.
 *
 * Runs as `npm run prebuild` before `astro build`. Iterates the 17 module
 * lesson MDX frontmatters and 6 static page configs, renders each via
 * Satori (Node) + resvg-js (Node native binding — ~5-10x faster than the
 * WASM variant used at runtime), and writes PNGs to public/og/.
 *
 * The runtime endpoint at src/pages/og/blog/[slugHash].png.ts handles
 * Emdash blog posts separately (build time doesn't know about them).
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { html as satoriHtml } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import { renderModuleLessonTemplate } from './templates/module-lesson';
import { renderGenericTemplate, type GenericTemplateInput } from './templates/generic';
import { OG_DIMENSIONS, OG_TEMPLATE_VERSION } from './config';
import { injectPngText } from './png-metadata';

const BUILD_STAMP = {
  'engine-version': String(OG_TEMPLATE_VERSION),
  'generated-at': new Date().toISOString(),
  'generator': 'cc4.marketing/og',
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const OUT_DIR = join(ROOT, 'public/og');
const MODULES_DIR = join(ROOT, 'src/content/modules');

const FONTS_DIR = join(__dirname, 'fonts');
const fonts = [
  {
    name: 'Righteous',
    data: readFileSync(join(FONTS_DIR, 'Righteous-Regular.ttf')),
    weight: 400 as const,
    style: 'normal' as const,
  },
  {
    name: 'Outfit',
    data: readFileSync(join(FONTS_DIR, 'Outfit-Regular.woff')),
    weight: 400 as const,
    style: 'normal' as const,
  },
  {
    name: 'Outfit',
    data: readFileSync(join(FONTS_DIR, 'Outfit-Bold.woff')),
    weight: 700 as const,
    style: 'normal' as const,
  },
];

async function renderToPng(htmlString: string): Promise<Buffer> {
  const svg = await satori(satoriHtml(htmlString) as Parameters<typeof satori>[0], {
    width: OG_DIMENSIONS.width,
    height: OG_DIMENSIONS.height,
    fonts,
  });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: OG_DIMENSIONS.width } });
  const rawPng = resvg.render().asPng();
  const stamped = injectPngText(new Uint8Array(rawPng), BUILD_STAMP);
  return Buffer.from(stamped);
}

interface ModuleFrontmatter {
  title: string;
  module: number;
  lesson: number;
  description?: string;
  duration?: string;
}

/** Parses the YAML frontmatter block from an MDX file (minimal parser). */
function parseFrontmatter(source: string): ModuleFrontmatter {
  const match = source.match(/^---\n([\s\S]+?)\n---/);
  if (!match) throw new Error('No frontmatter block');
  const body = match[1];
  const data: Record<string, string | number> = {};
  for (const line of body.split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    let value: string | number = rawValue.trim().replace(/^['"]|['"]$/g, '');
    if (/^\d+$/.test(value)) value = Number(value);
    data[key] = value;
  }
  return {
    title: String(data.title),
    module: Number(data.module),
    lesson: Number(data.lesson),
    description: data.description ? String(data.description) : undefined,
    duration: data.duration ? String(data.duration) : undefined,
  };
}

/** Walks src/content/modules/ recursively and returns all MDX files. */
function listModuleFiles(): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.mdx')) out.push(full);
    }
  }
  walk(MODULES_DIR);
  return out;
}

/**
 * Maps a module file path (e.g. `module-2/2.1-campaign-brief.mdx`) to the
 * runtime URL slug the BaseLayout's resolveOgImage() produces — `/modules/
 * {M}/{kebab}` — so the build output keys match the runtime expectations.
 */
function urlSlugForLesson(filePath: string, fm: ModuleFrontmatter): string {
  const base = filePath.split('/').at(-1)!.replace(/\.mdx$/, '');
  // Strip leading "2.1-" prefix → "campaign-brief"
  const kebab = base.replace(/^\d+(\.\d+)?-/, '');
  return `${fm.module}-${kebab}`;
}

const STATIC_PAGES: Record<
  string,
  Omit<GenericTemplateInput, never> & { badge: string }
> = {
  home: {
    title: 'Claude Code for Marketers',
    subtitle: 'Work 10x faster with AI — 17 free interactive lessons, no coding required.',
    accent: 'rust',
    badge: 'FREE COURSE',
  },
  blog: {
    title: 'AI Marketing Insights',
    subtitle: 'Practical guides and tutorials on using Claude Code for marketing.',
    accent: 'mustard',
    badge: 'BLOG',
  },
  changelog: {
    title: 'Changelog',
    subtitle: 'Every update, improvement, and fix to the CC4.Marketing course.',
    accent: 'olive',
    badge: 'RELEASE NOTES',
  },
  authors: {
    title: 'Meet the Authors',
    subtitle: 'Marketers who build with Claude Code every day.',
    accent: 'plum',
    badge: 'TEAM',
  },
  download: {
    title: 'Subscribe & Download',
    subtitle: 'Get the course free, plus bonus AI marketing content delivered to your inbox.',
    accent: 'rust',
    badge: 'FREE',
  },
  'brand-guide': {
    title: 'Brand Guidelines',
    subtitle: 'Visual identity, voice, and tone for the CC4.Marketing platform.',
    accent: 'plum',
    badge: 'BRAND',
  },
};

async function main(): Promise<void> {
  const startedAt = Date.now();
  mkdirSync(join(OUT_DIR, 'pages'), { recursive: true });
  mkdirSync(join(OUT_DIR, 'modules'), { recursive: true });

  let total = 0;
  let totalBytes = 0;

  // --- Static pages ---
  for (const [key, input] of Object.entries(STATIC_PAGES)) {
    const html = renderGenericTemplate(input);
    const png = await renderToPng(html);
    const outPath = join(OUT_DIR, 'pages', `${key}.png`);
    writeFileSync(outPath, png);
    total += 1;
    totalBytes += png.byteLength;
    console.log(`✓ pages/${key}.png (${(png.byteLength / 1024).toFixed(0)} KB)`);
  }

  // --- Module lessons ---
  const files = listModuleFiles();
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const fm = parseFrontmatter(source);
    const slug = urlSlugForLesson(file, fm);
    const html = renderModuleLessonTemplate({
      module: fm.module,
      lesson: fm.lesson,
      title: fm.title,
      description: fm.description,
      duration: fm.duration,
    });
    const png = await renderToPng(html);
    const outPath = join(OUT_DIR, 'modules', `${slug}.png`);
    writeFileSync(outPath, png);
    total += 1;
    totalBytes += png.byteLength;
    console.log(`✓ modules/${slug}.png (${(png.byteLength / 1024).toFixed(0)} KB)`);
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `\nGenerated ${total} OG images (${(totalBytes / 1024).toFixed(0)} KB total) in ${elapsed}s`,
  );
}

main().catch((err) => {
  console.error('og-build failed:', err);
  process.exit(1);
});
