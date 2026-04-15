import { computeOgHash, type OgHashInput } from './hash';

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

  return STATIC_FALLBACK_DEFAULT;
}

function isBlogPath(path: string): boolean {
  return path === '/blog' || path === '/blog/' || path.startsWith('/blog/');
}

/** Parses the dynamic endpoint's [slugHash] param back into its parts. */
export function parseSlugHash(param: string): { slug: string; hash: string } | null {
  const match = param.match(/^(.+)-([a-f0-9]{8})$/);
  if (!match) return null;
  return { slug: match[1], hash: match[2] };
}
