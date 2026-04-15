import { describe, expect, it } from 'vitest';
import { computeOgHash } from '../hash';

describe('computeOgHash', () => {
  const base = {
    title: 'How Anthropic 10x\'d Growth Marketing',
    excerpt: 'A deep dive into Claude Code workflows.',
    bylineIds: ['byline-tri', 'byline-alice'],
    updatedAt: new Date('2026-04-15T10:00:00Z'),
  };

  it('returns 8 hex characters', async () => {
    const hash = await computeOgHash(base);
    expect(hash).toMatch(/^[a-f0-9]{8}$/);
  });

  it('is deterministic for identical inputs', async () => {
    const a = await computeOgHash(base);
    const b = await computeOgHash({ ...base });
    expect(a).toBe(b);
  });

  it('is order-independent for bylineIds', async () => {
    const a = await computeOgHash({ ...base, bylineIds: ['byline-tri', 'byline-alice'] });
    const b = await computeOgHash({ ...base, bylineIds: ['byline-alice', 'byline-tri'] });
    expect(a).toBe(b);
  });

  it('changes when title changes', async () => {
    const a = await computeOgHash(base);
    const b = await computeOgHash({ ...base, title: 'Different title' });
    expect(a).not.toBe(b);
  });

  it('changes when excerpt changes', async () => {
    const a = await computeOgHash(base);
    const b = await computeOgHash({ ...base, excerpt: 'Different excerpt' });
    expect(a).not.toBe(b);
  });

  it('changes when bylineIds content changes', async () => {
    const a = await computeOgHash(base);
    const b = await computeOgHash({ ...base, bylineIds: ['byline-tri'] });
    expect(a).not.toBe(b);
  });

  it('changes when updatedAt changes', async () => {
    const a = await computeOgHash(base);
    const b = await computeOgHash({ ...base, updatedAt: new Date('2026-04-16T10:00:00Z') });
    expect(a).not.toBe(b);
  });

  it('accepts updatedAt as ISO string', async () => {
    const fromDate = await computeOgHash(base);
    const fromString = await computeOgHash({ ...base, updatedAt: '2026-04-15T10:00:00Z' });
    expect(fromDate).toBe(fromString);
  });

  it('treats missing excerpt as empty string', async () => {
    const a = await computeOgHash({ ...base, excerpt: undefined });
    const b = await computeOgHash({ ...base, excerpt: '' });
    expect(a).toBe(b);
  });

  it('treats missing bylineIds as empty array', async () => {
    const a = await computeOgHash({ ...base, bylineIds: undefined });
    const b = await computeOgHash({ ...base, bylineIds: [] });
    expect(a).toBe(b);
  });
});
