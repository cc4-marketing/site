import { describe, expect, it } from 'vitest';
import { parseSlugHash, resolveOgImage, type OgResolveContext } from '../url';

const ctxEnabled: OgResolveContext = {
  path: '/',
  siteUrl: 'https://cc4.marketing',
  engineEnabled: true,
};
const ctxDisabled: OgResolveContext = { ...ctxEnabled, engineEnabled: false };

const basePost = {
  slug: 'claude-code-for-marketing-guide-2026',
  title: 'The Claude Code for Marketing Guide',
  excerpt: 'A complete walkthrough.',
  bylineIds: ['tri'],
  updatedAt: new Date('2026-04-15T10:00:00Z'),
};

describe('resolveOgImage', () => {
  describe('when engine is disabled (kill-switch)', () => {
    it('returns /og-blog.png for blog routes', async () => {
      const result = await resolveOgImage({ ...ctxDisabled, path: '/blog/some-post' });
      expect(result).toBe('/og-blog.png');
    });

    it('returns /og-image.png for non-blog routes', async () => {
      const result = await resolveOgImage({ ...ctxDisabled, path: '/modules/0/introduction' });
      expect(result).toBe('/og-image.png');
    });

    it('still honors kill-switch even when a post is provided', async () => {
      const result = await resolveOgImage(
        { ...ctxDisabled, path: '/blog/x' },
        { post: basePost },
      );
      expect(result).toBe('/og-blog.png');
    });
  });

  describe('manual override via featuredImageSrc', () => {
    it('returns featured_image.src as-is', async () => {
      const result = await resolveOgImage(ctxEnabled, {
        post: { ...basePost, featuredImageSrc: '/blog/cover-custom.png' },
      });
      expect(result).toBe('/blog/cover-custom.png');
    });

    it('takes precedence over hashed URL', async () => {
      const result = await resolveOgImage(ctxEnabled, {
        post: { ...basePost, featuredImageSrc: '/blog/cover-custom.png' },
      });
      expect(result).not.toMatch(/^\/og\/blog\//);
    });
  });

  describe('blog post (dynamic endpoint)', () => {
    it('returns /og/blog/{slug}-{hash}.png', async () => {
      const result = await resolveOgImage(ctxEnabled, { post: basePost });
      expect(result).toMatch(/^\/og\/blog\/claude-code-for-marketing-guide-2026-[a-f0-9]{8}\.png$/);
    });

    it('produces identical URL for identical post content', async () => {
      const a = await resolveOgImage(ctxEnabled, { post: basePost });
      const b = await resolveOgImage(ctxEnabled, { post: { ...basePost } });
      expect(a).toBe(b);
    });

    it('produces different URL when title changes', async () => {
      const a = await resolveOgImage(ctxEnabled, { post: basePost });
      const b = await resolveOgImage(ctxEnabled, { post: { ...basePost, title: 'Different' } });
      expect(a).not.toBe(b);
    });
  });

  describe('static page key', () => {
    it.each(['home', 'blog', 'changelog', 'authors', 'download', 'brand-guide'] as const)(
      'returns /og/pages/%s.png',
      async (key) => {
        const result = await resolveOgImage(ctxEnabled, { pageKey: key });
        expect(result).toBe(`/og/pages/${key}.png`);
      },
    );
  });

  describe('module lesson path', () => {
    it('matches /modules/0/introduction/', async () => {
      const result = await resolveOgImage({ ...ctxEnabled, path: '/modules/0/introduction/' });
      expect(result).toBe('/og/modules/0-introduction.png');
    });

    it('matches without trailing slash', async () => {
      const result = await resolveOgImage({ ...ctxEnabled, path: '/modules/2/campaign-brief' });
      expect(result).toBe('/og/modules/2-campaign-brief.png');
    });

    it('does not match non-lesson module paths', async () => {
      const result = await resolveOgImage({ ...ctxEnabled, path: '/modules/0/' });
      expect(result).toBe('/og-image.png');
    });
  });

  describe('fallback', () => {
    it('returns /og-image.png when no post, pageKey, or module match', async () => {
      const result = await resolveOgImage({ ...ctxEnabled, path: '/some-unknown-path' });
      expect(result).toBe('/og-image.png');
    });
  });
});

describe('parseSlugHash', () => {
  it('parses slug + 8-char hex hash', () => {
    expect(parseSlugHash('my-post-abcdef12')).toEqual({ slug: 'my-post', hash: 'abcdef12' });
  });

  it('accepts slugs with multiple hyphens', () => {
    expect(parseSlugHash('claude-code-for-marketing-guide-2026-deadbeef')).toEqual({
      slug: 'claude-code-for-marketing-guide-2026',
      hash: 'deadbeef',
    });
  });

  it('returns null for malformed inputs', () => {
    expect(parseSlugHash('no-hash')).toBeNull();
    expect(parseSlugHash('short-hash-abc')).toBeNull();
    expect(parseSlugHash('uppercase-hash-ABCDEF12')).toBeNull();
    expect(parseSlugHash('')).toBeNull();
  });

  it('rejects non-hex hash characters', () => {
    expect(parseSlugHash('my-post-ghijklmn')).toBeNull();
  });
});
