import { describe, it, expect } from 'vitest';
import {
  applyCopy, bumpKind, bumpVersion, buildFacts, entryType, fetchEntries, hellobarAnnounceCommand, isPublished, isReaderVisible,
  latestSemver, modulesFromPaths, parseCommit, resolveBase,
} from '../lib/changelog-entry.mjs';

const commit = (subject, files = ['src/components/Header.astro'], body = '') =>
  ({ sha: `${subject.length}abcdef0123456789`, subject, body, files });

// Shape of GET /api/changelog entries: newest first, includes a non-semver label.
const apiEntries = [
  { version: 'unreleased', title: 'Module 3.1', published_at: '2026-07-31T17:49:15.000Z' },
  { version: '0.6.0', title: 'Blog tokens', published_at: '2026-07-16T17:40:42.602975+00:00' },
  { version: '1.2.0', title: 'March course update', published_at: '2026-03-16T00:00:00.000Z' },
];

describe('resolveBase', () => {
  it('bootstraps from the newest API entry date when no changelog tag exists', () => {
    expect(resolveBase({ changelogTag: null, apiEntries })).toMatchObject({
      kind: 'since', since: '2026-07-31T17:49:15.000Z',
    });
  });
  it('prefers the changelog tag written at publish time', () => {
    expect(resolveBase({ changelogTag: 'changelog/v0.7.0', apiEntries })).toEqual({ kind: 'tag', ref: 'changelog/v0.7.0' });
  });
  it('falls back to full history on an empty API', () => {
    expect(resolveBase({ changelogTag: null, apiEntries: [] })).toEqual({ kind: 'root' });
  });
});

describe('isReaderVisible', () => {
  const visible = (c) => isReaderVisible(parseCommit(c));
  it('drops chore, ci, test, refactor, build and dependency bumps', () => {
    expect(visible(commit('chore: tidy'))).toBe(false);
    expect(visible(commit('ci: load deploy key'))).toBe(false);
    expect(visible(commit('test(api): cover download'))).toBe(false);
    expect(visible(commit('refactor(og): move engine'))).toBe(false);
    expect(visible(commit('build: vite config'))).toBe(false);
    expect(visible(commit('chore(deps): bump site-kick to v0.2.1', ['package.json']))).toBe(false);
    expect(visible(commit('fix(deps): bump astro', ['package.json']))).toBe(false);
    expect(visible(commit('Bump astro from 7.3.4 to 7.3.5', ['package.json']))).toBe(false);
  });
  it('drops chore even when it touches content', () => {
    expect(visible(commit('chore: rename lesson', ['src/content/modules/module-1/1.1-x.mdx']))).toBe(false);
  });
  it('keeps feat and fix wherever they land', () => {
    expect(visible(commit('feat(llms): cache llms.txt', ['src/pages/llms.txt.ts']))).toBe(true);
    expect(visible(commit('fix(seo): real 404s', ['src/lib/seo.ts']))).toBe(true);
  });
  it('counts content-only changes without a feat/fix type', () => {
    expect(visible(commit('docs: tweak lesson wording', ['src/content/modules/module-2/2.7-x.mdx']))).toBe(true);
    expect(visible(commit('Update library entry', ['src/content/library/seo/x.mdx']))).toBe(true);
    expect(visible(commit('docs: blog draft', ['docs/blog-drafts/2026-09-12-x.md']))).toBe(true);
  });
  it('drops docs(plans) and non-content docs', () => {
    expect(visible(commit('docs(plans): phase 2', ['plans/20260901-x/plan.md']))).toBe(false);
    expect(visible(commit('docs: readme', ['README.md']))).toBe(false);
    expect(visible(commit('docs: api note', ['src/pages/api/course-download.ts']))).toBe(false);
  });
});

describe('type and bump rules', () => {
  const parsed = (...subjects) => subjects.map((s) => parseCommit(commit(s)));
  it('feat is minor/added, fix only is patch/fixed, content only is patch/changed', () => {
    expect([bumpKind(parsed('feat: a', 'fix: b')), entryType(parsed('feat: a', 'fix: b'))]).toEqual(['minor', 'added']);
    expect([bumpKind(parsed('fix: b')), entryType(parsed('fix: b'))]).toEqual(['patch', 'fixed']);
    expect([bumpKind(parsed('docs: lesson')), entryType(parsed('docs: lesson', 'fix: b'))]).toEqual(['patch', 'changed']);
  });
  it('breaking via ! or BREAKING CHANGE footer is major', () => {
    expect(bumpKind(parsed('feat!: new URL scheme'))).toBe('major');
    expect(bumpKind([parseCommit(commit('fix: urls', undefined, 'BREAKING CHANGE: old links 404'))])).toBe('major');
  });
  it('bumps semver and skips non-semver API labels', () => {
    expect(latestSemver(apiEntries)).toBe('0.6.0');
    expect(latestSemver([])).toBe('0.0.0');
    expect(bumpVersion('0.6.0', 'minor')).toBe('0.7.0');
    expect(bumpVersion('0.6.3', 'patch')).toBe('0.6.4');
    expect(bumpVersion('0.6.3', 'major')).toBe('1.0.0');
  });
});

describe('modulesFromPaths', () => {
  it('maps lessons, library, blog and pages', () => {
    expect(modulesFromPaths([
      'src/content/modules/module-3/3.1-merge.mdx', 'src/content/library/seo/x.mdx',
      'public/blog/cover.jpg', 'src/pages/index.astro', 'docs/blog-drafts/x.md',
    ])).toEqual(['blog', 'course', 'homepage', 'library', 'module-3', 'site']);
  });
});

describe('buildFacts', () => {
  it('returns null when nothing reader-visible remains', () => {
    const commits = [commit('chore: x'), commit('ci: y'), commit('refactor: z')];
    expect(buildFacts({ commits, apiEntries, base: { kind: 'root' }, head: 'abc' })).toBeNull();
  });
  it('computes version, type and modules without an LLM', () => {
    const commits = [commit('feat(blog): new post', ['docs/blog-drafts/x.md']), commit('chore: y')];
    const facts = buildFacts({ commits, apiEntries, base: { kind: 'root' }, head: 'abc' });
    expect(facts).toMatchObject({ version: '0.7.0', bump: 'minor', type: 'added', modules: ['blog'] });
    expect(facts.commits).toHaveLength(1);
  });
});

describe('idempotency', () => {
  it('detects a version already on the API', () => {
    expect(isPublished(apiEntries, '0.6.0')).toBe(true);
    expect(isPublished(apiEntries, '0.7.0')).toBe(false);
  });
  it('re-running publish after a successful POST sees the version and skips', async () => {
    const mockFetch = async (url) => {
      expect(url).toBe('https://api.test/api/changelog');
      return new Response(JSON.stringify({ count: 1, entries: [{ version: '0.7.0', published_at: '2026-10-05T02:00:00Z' }, ...apiEntries] }));
    };
    expect(isPublished(await fetchEntries('https://api.test', mockFetch), '0.7.0')).toBe(true);
  });
  it('fails loudly when the API is down instead of posting blind', async () => {
    const down = async () => new Response('nope', { status: 503 });
    await expect(fetchEntries('https://api.test', down)).rejects.toThrow(/HTTP 503/);
  });
});

describe('applyCopy', () => {
  const facts = buildFacts({ commits: [commit('feat: a'), commit('fix: b')], apiEntries, base: { kind: 'root' }, head: 'h' });
  it('builds summary and slug from the copy', () => {
    const e = applyCopy(facts, { title: 'New post and a fix', bullets: ['A new post', 'A fix.'] });
    expect(e).toMatchObject({ summary: 'A new post. A fix.', slug: 'new-post-and-a-fix', version: '0.7.0' });
  });
  it('rejects dashes, hype words and more bullets than commits', () => {
    expect(() => applyCopy(facts, { title: 'New \u2014 post', bullets: ['x'] })).toThrow(/dash/);
    expect(() => applyCopy(facts, { title: 'Seamless post', bullets: ['x'] })).toThrow(/seamless/);
    expect(() => applyCopy(facts, { title: 'Post', bullets: ['a', 'b', 'c'] })).toThrow(/bullets/);
  });
});

describe('hellobarAnnounceCommand', () => {
  it('queues a one-week bar with a changelog id and single-quoted text', () => {
    const cmd = hellobarAnnounceCommand({ version: '0.7.0', title: "Reader's $HOME `tips`" }, Date.parse('2026-10-01T07:00:00Z'));
    expect(cmd).toBe("npx site-kick hellobar new --id hellobar-changelog-v0-7-0 --text 'New in v0.7.0: Reader'\\''s $HOME `tips`'"
      + " --cta 'See the changelog' --link '/changelog/?utm_source=hellobar&utm_campaign=changelog-v0-7-0'"
      + ' --ends 2026-10-08T23:59:59+07:00 --cooldown 3');
  });
});
