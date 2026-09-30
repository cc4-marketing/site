#!/usr/bin/env node
// Weekly changelog CLI used by .github/workflows/changelog-draft.yml and changelog-publish.yml.
//   facts   [--since <date>] [--out f]   compute the entry facts from git + API (no LLM)
//   prompt  <facts.json>                 print the Claude prompt for title + bullets
//   apply   <facts.json> <claude.json>   merge Claude copy, write changelog/next.json + PR body
//   check   <entry.json>                 is this version already on the API?
//   payload <entry.json>                 print the POST /admin/entries body
//   announce <entry.json>                print a suggested hello bar edit
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  apiPayload, applyCopy, buildFacts, fetchEntries, isPublished, renderMarkdown, resolveBase,
} from './lib/changelog-entry.mjs';

const API_URL = process.env.CHANGELOG_API_URL || 'https://cc4-changelog.mtri-vo.workers.dev';
const [cmd, ...rest] = process.argv.slice(2);
const flag = (name) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : undefined; };
const positional = rest.filter((a, i) => !a.startsWith('--') && !rest[i - 1]?.startsWith('--'));
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 << 20 }).trim();
const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'));
const writeOut = (f, text) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, text); };
const setOutput = (k, v) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);

function readCommits(base) {
  const args = ['log', '--no-merges', '--name-only', '--format=%x1e%H%x1f%s%x1f%b%x1f'];
  args.push(base.kind === 'tag' ? `${base.ref}..HEAD` : base.kind === 'since' ? `--since=${base.since}` : 'HEAD');
  return git(...args).split('\x1e').filter(Boolean).map((rec) => {
    const [sha, subject, body, files] = rec.split('\x1f');
    return { sha, subject, body, files: files.split('\n').map((f) => f.trim()).filter(Boolean) };
  });
}

async function facts() {
  const apiEntries = await fetchEntries(API_URL);
  const changelogTag = git('tag', '-l', 'changelog/v*', '--sort=-v:refname').split('\n')[0] || null;
  const since = flag('since');
  const base = since ? { kind: 'since', since, from: '--since override' } : resolveBase({ changelogTag, apiEntries });
  const head = git('rev-parse', 'HEAD');
  console.log(`Range base: ${JSON.stringify(base)}; head ${head.slice(0, 7)}`);
  const result = buildFacts({ commits: readCommits(base), apiEntries, base, head });
  if (!result) {
    console.log('No reader-visible changes in range. Nothing to draft.');
    return setOutput('has_changes', 'false');
  }
  if (isPublished(apiEntries, result.version)) throw new Error(`v${result.version} is already on the API; refusing to draft a duplicate`);
  const out = flag('out') || 'changelog-facts.json';
  writeOut(out, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`v${result.version} (${result.bump}, ${result.type}) from ${result.commits.length} commits, modules: ${result.modules.join(', ')}`);
  setOutput('has_changes', 'true');
  setOutput('version', result.version);
}

function prompt([factsFile]) {
  const f = readJson(factsFile);
  const commits = f.commits.map((c) => `- [${c.type || 'other'}] ${c.subject}${c.body ? `\n  ${c.body.replace(/\n+/g, ' ')}` : ''}`).join('\n');
  console.log(`You write changelog copy for cc4.marketing, a Claude Code course for marketers.
Readers are marketers, not engineers. Write about what they can now read, use, or notice on the site.

Rules:
- Use ONLY facts stated in the commits below. Do not invent features, numbers, dates, or benefits.
- Plain English. No hype words (delve, leverage, robust, seamless, comprehensive, crucial, unlock, empower, elevate, streamline).
- Never use em dashes or en dashes. Use commas, colons, or periods.
- Title: at most 60 characters, names the main change.
- Bullets: 1 to ${Math.min(6, f.commits.length)} short sentences, one per reader-visible change. Merge related commits. Skip pure internal plumbing.

Commits (${f.commits.length}):
${commits}

Reply with ONLY this JSON, no code fences: {"title": "...", "bullets": ["...", "..."]}`);
}

function apply([factsFile, claudeFile]) {
  const raw = readJson(claudeFile);
  if (raw.is_error) throw new Error(`claude -p returned an error: ${raw.result}`);
  const text = String(raw.result ?? '').replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '');
  let copy;
  try { copy = JSON.parse(text); } catch { throw new Error(`Claude reply is not JSON:\n${text}`); }
  const entry = applyCopy(readJson(factsFile), copy);
  const out = flag('out') || 'changelog/next.json';
  writeOut(out, `${JSON.stringify(entry, null, 2)}\n`);
  const body = `Weekly changelog draft. Merging this PR publishes the entry below to the live changelog API and tags \`changelog/v${entry.version}\`.\nEdit \`${out}\` on this branch to change the copy before merging.\n\n${renderMarkdown(entry)}\n`;
  writeOut(flag('body') || 'changelog-pr-body.md', body);
  console.log(renderMarkdown(entry));
}

async function check([entryFile]) {
  const { version } = readJson(entryFile);
  const published = isPublished(await fetchEntries(API_URL), version);
  console.log(published ? `v${version} is already on the API; skipping POST.` : `v${version} is not on the API yet.`);
  setOutput('published', String(published));
}

function announce([entryFile]) {
  const e = readJson(entryFile);
  const tag = `v${e.version.replace(/\./g, '-')}`;
  console.log(`Optional: announce v${e.version} in the hello bar. Edit helloBar in src/config/promo.ts to:
  text: "New in v${e.version}: ${e.title}",
  linkText: "See what changed",
  linkUrl: "https://cc4.marketing/changelog/?utm_source=hellobar&utm_campaign=changelog-${tag}",
  storageKey: "hellobar-changelog-${tag}",`);
}

const commands = {
  facts, prompt: () => prompt(positional), apply: () => apply(positional), check: () => check(positional),
  payload: () => console.log(JSON.stringify(apiPayload(readJson(positional[0])))),
  announce: () => announce(positional),
};
if (!commands[cmd]) {
  console.error(`Usage: node scripts/changelog.mjs <${Object.keys(commands).join('|')}> ...`);
  process.exit(2);
}
Promise.resolve(commands[cmd]()).catch((err) => { console.error(`::error::${err.message}`); process.exit(1); });
