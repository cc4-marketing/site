// Deterministic half of the weekly changelog: range base, commit filter,
// type, version bump and modules. Claude only writes title + bullets later.

const CONVENTIONAL = /^(\w+)(?:\(([^)]*)\))?(!)?:\s*(.+)$/;
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const HYPE_WORDS = [
  'delve', 'leverage', 'robust', 'seamless', 'comprehensive', 'crucial', 'pivotal',
  'foster', 'empower', 'elevate', 'streamline', 'game-changer', 'unlock', 'harness',
  'revolutionary', 'cutting-edge', 'supercharge',
];

// Paths a reader can see on cc4.marketing. src/pages/api is server plumbing, not a page.
const CONTENT_PATHS = [
  /^src\/content\//,
  /^src\/pages\/(?!api\/|__tests__\/)/,
  /^docs\/blog-drafts\//,
  /^public\/blog\//,
  /^insert_post_[^/]+\.py$/,
];

export function parseCommit({ sha, subject, body = '', files = [] }) {
  const m = CONVENTIONAL.exec(subject);
  const breaking = Boolean(m?.[3]) || /^BREAKING[ -]CHANGE:/m.test(body);
  return { sha, subject, body, files, type: m ? m[1].toLowerCase() : null, scope: m?.[2] || null, breaking };
}

export const isContentPath = (file) => CONTENT_PATHS.some((re) => re.test(file));

export function isDependencyBump(c) {
  return /^(chore|build|fix)\(deps(-dev)?\)/.test(c.subject) || /^bump \S+ from \S+ to \S+/i.test(c.subject);
}

const SKIP_TYPES = new Set(['chore', 'ci', 'test', 'refactor', 'build', 'style']);

// feat and fix count on their own. Anything else that is not a skipped type
// (docs, perf, untyped subjects) counts only if it touches reader-visible content.
export function isReaderVisible(c) {
  if (isDependencyBump(c) || SKIP_TYPES.has(c.type)) return false;
  if (c.type === 'feat' || c.type === 'fix') return true;
  if (c.type === 'docs' && c.files.some((f) => f.startsWith('docs/plans/') || f.startsWith('plans/'))) return false;
  return c.files.some(isContentPath);
}

export function entryType(commits) {
  if (commits.some((c) => c.type === 'feat')) return 'added';
  if (commits.every((c) => c.type === 'fix')) return 'fixed';
  return 'changed';
}

export function bumpKind(commits) {
  if (commits.some((c) => c.breaking)) return 'major';
  if (commits.some((c) => c.type === 'feat')) return 'minor';
  return 'patch';
}

export function bumpVersion(version, kind) {
  const [, ma, mi, pa] = SEMVER.exec(version).map(Number);
  if (kind === 'major') return `${ma + 1}.0.0`;
  if (kind === 'minor') return `${ma}.${mi + 1}.0`;
  return `${ma}.${mi}.${pa + 1}`;
}

// API entries come newest first; "unreleased" and other labels are skipped.
export function latestSemver(apiEntries) {
  return sortNewestFirst(apiEntries).find((e) => SEMVER.test(e.version))?.version || '0.0.0';
}

export function modulesFromPaths(files) {
  const out = new Set();
  for (const f of files) {
    const mod = /^src\/content\/modules\/(module-\d+)\//.exec(f);
    if (mod) out.add('course').add(mod[1]);
    else if (/^src\/pages\/modules\//.test(f)) out.add('course');
    else if (/^(src\/content\/library|src\/pages\/library)\//.test(f)) out.add('library');
    else if (/^(docs\/blog-drafts|public\/blog|src\/pages\/blog)\/|^insert_post_/.test(f)) out.add('blog');
    else if (f === 'src/pages/index.astro') out.add('homepage');
    else if (f === 'src/pages/changelog.astro') out.add('changelog');
    if (/^(src|public)\//.test(f)) out.add('site');
  }
  return [...out].sort();
}

// Range base. A changelog/v* tag is written at publish time and marks the last
// commit already covered. Without one, fall back to the newest API entry's date.
export function resolveBase({ changelogTag, apiEntries }) {
  if (changelogTag) return { kind: 'tag', ref: changelogTag };
  const newest = sortNewestFirst(apiEntries)[0];
  if (!newest) return { kind: 'root' };
  return { kind: 'since', since: newest.published_at, from: `API entry "${newest.title}"` };
}

export const isPublished = (apiEntries, version) => apiEntries.some((e) => e.version === version);

export async function fetchEntries(apiUrl, fetchImpl = fetch) {
  const res = await fetchImpl(`${apiUrl}/api/changelog`);
  if (!res.ok) throw new Error(`GET ${apiUrl}/api/changelog failed: HTTP ${res.status}`);
  return (await res.json()).entries || [];
}

export function buildFacts({ commits, apiEntries, base, head }) {
  const visible = commits.map(parseCommit).filter(isReaderVisible);
  if (visible.length === 0) return null;
  const kind = bumpKind(visible);
  return {
    version: bumpVersion(latestSemver(apiEntries), kind),
    bump: kind,
    type: entryType(visible),
    modules: modulesFromPaths(visible.flatMap((c) => c.files)),
    range: { base, head },
    commits: visible.map(({ sha, subject, body, type }) => ({ sha: sha.slice(0, 7), type, subject, body: body.trim().slice(0, 600) })),
  };
}

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50).replace(/-$/, '');
}

// Merge Claude's copy into the facts. Throws with a readable reason on bad copy.
export function applyCopy(facts, copy) {
  const title = String(copy?.title || '').trim();
  const bullets = Array.isArray(copy?.bullets) ? copy.bullets.map((b) => String(b).trim()).filter(Boolean) : [];
  const problems = [];
  if (!title || title.length > 70) problems.push(`title must be 1 to 70 chars, got ${title.length}`);
  if (bullets.length === 0 || bullets.length > facts.commits.length) problems.push(`need 1 to ${facts.commits.length} bullets, got ${bullets.length}`);
  const text = [title, ...bullets].join('\n');
  if (/[\u2013\u2014]/.test(text)) problems.push('contains an em or en dash');
  const hype = HYPE_WORDS.filter((w) => new RegExp(`\\b${w}`, 'i').test(text));
  if (hype.length) problems.push(`hype words: ${hype.join(', ')}`);
  if (problems.length) throw new Error(`Claude copy rejected: ${problems.join('; ')}`);
  const summary = bullets.map((b) => (/[.!?]$/.test(b) ? b : `${b}.`)).join(' ');
  const machine = facts.commits.map((c) => `${c.sha} ${c.subject}`).join('; ');
  return { ...facts, title, bullets, summary, slug: slugify(title), machine_summary: machine };
}

export function apiPayload(entry) {
  const { title, slug, summary, type, version, machine_summary, modules } = entry;
  return { title, slug, summary, type, version, machine_summary, modules: modules.join(','), status: 'published' };
}

export function renderMarkdown(entry) {
  return [
    `### v${entry.version} · ${entry.title}`,
    '',
    `Type: \`${entry.type}\` · Bump: \`${entry.bump}\` · Modules: ${entry.modules.map((m) => `\`${m}\``).join(', ') || 'none'}`,
    '',
    ...entry.bullets.map((b) => `- ${b}`),
    '',
    `<details><summary>Source commits (${entry.commits.length})</summary>`,
    '',
    ...entry.commits.map((c) => `- ${c.sha} ${c.subject}`),
    '',
    '</details>',
  ].join('\n');
}

function sortNewestFirst(entries) {
  return [...entries].sort((a, b) => Date.parse(b.published_at || 0) - Date.parse(a.published_at || 0));
}
