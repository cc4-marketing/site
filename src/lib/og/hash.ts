import { OG_TEMPLATE_VERSION } from './config';

/**
 * Input fields that participate in the content hash for a blog post.
 * Order doesn't matter — we canonicalize before hashing.
 */
export interface OgHashInput {
  title: string;
  excerpt?: string;
  bylineIds?: string[];
  updatedAt: Date | string;
}

/**
 * Computes a stable 8-char hex hash for OG image cache-busting.
 *
 * Bumping OG_TEMPLATE_VERSION invalidates all hashes globally — use when
 * template design changes.
 *
 * Uses crypto.subtle (Web Crypto API) — available on both Node 18+ and the
 * Cloudflare Workers runtime. SHA-1 is deliberate: we want a short, stable
 * hash, not a cryptographic digest. 8 hex chars = 32 bits = 1-in-4-billion
 * collision probability, well beyond what we need for per-slug URL keying.
 */
export async function computeOgHash(input: OgHashInput): Promise<string> {
  const updatedAtIso =
    input.updatedAt instanceof Date
      ? input.updatedAt.toISOString()
      : new Date(input.updatedAt).toISOString();

  const canonical = JSON.stringify({
    v: OG_TEMPLATE_VERSION,
    title: input.title ?? '',
    excerpt: input.excerpt ?? '',
    bylineIds: [...(input.bylineIds ?? [])].sort(),
    updatedAt: updatedAtIso,
  });

  const encoded = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-1', encoded);
  const bytes = new Uint8Array(digest);
  return [...bytes.slice(0, 4)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
