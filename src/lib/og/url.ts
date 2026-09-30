import { computeOgHash as kitOgHash } from 'site-kick/og/og-hash.js';
import { OG_TEMPLATE_VERSION } from './config';

export { parseSlugHash } from 'site-kick/og/og-hash.js';

/** Fields that participate in the blog OG content hash. Order doesn't matter. */
export interface OgHashInput {
  title: string;
  excerpt?: string;
  bylineIds?: string[];
  updatedAt: Date | string;
}

/**
 * 8-hex content hash for blog OG URLs. Bumping OG_TEMPLATE_VERSION in config.ts
 * invalidates every hashed URL, which forces crawlers to re-fetch.
 */
export function computeOgHash(input: OgHashInput): Promise<string> {
  return kitOgHash(input, { version: OG_TEMPLATE_VERSION });
}

export interface OgResolveContext {
  /** Astro.url.pathname */
  path: string;
  /** Site origin, e.g. "https://cc4.marketing" */
  siteUrl: string;
  /** Master kill-switch; when false, resolve to static defaults */
  engineEnabled: boolean;
}

export interface OgPostInput extends OgHashInput {
  slug: string;
  featuredImageSrc?: string;
}

export type OgPageKey =
  | 'home'
  | 'blog'
  | 'changelog'
  | 'authors'
  | 'modules'
  | 'download'
  | 'brand-guide';

const STATIC_FALLBACK_BLOG = '/og-blog.png';
const STATIC_FALLBACK_DEFAULT = '/og-image.png';

/**
 * Resolves the root-relative OG image path for a given page.
 *
 * Precedence (first match wins):
 *   1. Engine disabled → /og-blog.png (blog routes) or /og-image.png (else)
 *   2. Manual override (post.featuredImageSrc) → that path
 *   3. Blog post → /og/blog/{slug}-{hash}.png (runtime endpoint)
 *   4. Static page key → /og/pages/{key}.png (build-time asset)
 *   5. Module lesson path → /og/modules/{module}-{slug}.png (build-time)
 *   6. Fallback → /og-image.png
 *
 * Returns a root-relative path. BaseLayout absolutizes against siteUrl.
 */
export async function resolveOgImage(
  ctx: OgResolveContext,
  opts: { post?: OgPostInput; pageKey?: OgPageKey } = {},
): Promise<string> {
  if (!ctx.engineEnabled) {
    return isBlogPath(ctx.path) ? STATIC_FALLBACK_BLOG : STATIC_FALLBACK_DEFAULT;
  }

  if (opts.post?.featuredImageSrc) {
    return opts.post.featuredImageSrc;
  }

  if (opts.post) {
    const hash = await computeOgHash(opts.post);
    return `/og/blog/${opts.post.slug}-${hash}.png`;
  }

  if (opts.pageKey) {
    return `/og/pages/${opts.pageKey}.png`;
  }

  const moduleMatch = ctx.path.match(/^\/modules\/(\d+)\/([^/]+)\/?$/);
  if (moduleMatch) {
    const [, module, slug] = moduleMatch;
    return `/og/modules/${module}-${slug}.png`;
  }

  // Library hub: /library/ → fixed build-time cover.
  if (ctx.path === '/library' || ctx.path === '/library/') {
    return '/og/library/hub.png';
  }

  // Library entry pages: /library/{category}/{slug}/ → build-time OG asset.
  const libraryMatch = ctx.path.match(/^\/library\/([^/]+)\/([^/]+)\/?$/);
  if (libraryMatch) {
    const [, category, slug] = libraryMatch;
    return `/og/library/${category}-${slug}.png`;
  }

  // Library category index: /library/{category}/ → per-category cover.
  const libraryCatMatch = ctx.path.match(/^\/library\/([^/]+)\/?$/);
  if (libraryCatMatch) {
    return `/og/library/cat-${libraryCatMatch[1]}.png`;
  }

  return STATIC_FALLBACK_DEFAULT;
}

function isBlogPath(path: string): boolean {
  return path === '/blog' || path === '/blog/' || path.startsWith('/blog/');
}
