---
name: ship
description: Build, test, commit, push, and deploy to production in one command
---

# /ship — Build, Test, Commit, Push, Deploy

Ship changes to production in a single flow. Runs build verification, commits, pushes, and monitors the deploy.

## Arguments

`/ship` — auto-generate commit message from changes
`/ship [message]` — use custom commit message
`/ship --dry` — build and test only, don't commit/push
`/ship --no-changelog` — skip the auto-changelog step even if the commit is `feat:`/`fix:`

## Instructions

### Step 1: Pre-flight Checks

Run these in parallel:

```bash
# Check for uncommitted changes
git status -s

# Check current branch
git branch --show-current

# Check if we're up to date with remote
git fetch origin main && git rev-list --count HEAD..origin/main
```

**Stop if:**
- Not on `main` branch (warn, ask to continue)
- Remote has commits we don't have (suggest `git pull` first)
- No changes to commit (skip to deploy if last commit hasn't been deployed)

### Step 2: Build & Verify

```bash
npm run build
```

**Stop if build fails.** Show the error and suggest fixes.

After successful build, verify key outputs:
```bash
# Check sitemap has expected URL count
grep -c "<url>" dist/client/sitemap-0.xml

# Check no prerendered pages (all should be SSR with Emdash)
ls dist/client/*/index.html 2>/dev/null | wc -l
```

### Step 3: Commit

1. Run `git diff --stat` and `git status -s` to see all changes.
2. If no commit message was provided, analyze the changes and generate one following conventional commits:
   - `feat:` — new features
   - `fix:` — bug fixes
   - `chore:` — maintenance
   - `docs:` — documentation
   - `style:` — formatting/style
3. Stage relevant files (NOT `.env`, `.dev.vars`, `node_modules`, `.wrangler`).

#### Step 3a: Auto-changelog for feat/fix commits

**Before committing**, check whether the drafted commit message starts with `feat:` or `fix:`. If so, the commit is user-visible and should be reflected in the changelog.

1. Read `CHANGELOG.md` and confirm the commit's subject isn't already represented under `## [Unreleased]` (look for substring match on the main phrase).
2. If it's already there, skip to step 4 below.
3. Otherwise, propose a changelog entry derived from the commit subject:
   - **Type**: `Added` for `feat:`, `Fixed` for `fix:`
   - **Bullet**: rewrite the commit subject in changelog voice (present-tense, user-facing, no conventional-commit prefix). For example:
     - `feat: add /publish-post skill` → `- New /publish-post skill for blog post publishing`
     - `fix: correct og:image fallback on blog pages` → `- OG image now correctly points to the post's cover instead of the site default`
4. Edit `CHANGELOG.md` in place:
   - Find the `## [Unreleased]` section
   - Find or create the matching `### Added` / `### Fixed` subsection (ordering: Added, Changed, Deprecated, Removed, Fixed, Security)
   - Append the new bullet
5. Stage `CHANGELOG.md` alongside the other changes so it rides in the same commit.
6. **Do NOT update `changelog-worker/data/entries.json` or sync to KV here.** That's deferred to `/release` so KV writes are batched. The `[Unreleased]` section in CHANGELOG.md is the source of truth between releases.

**When to skip 3a:**
- Commit is `chore:`, `docs:`, `style:`, `refactor:`, `test:`, `build:`, `ci:`, or `release:` — no changelog entry
- Commit message was passed explicitly as `/ship "release: ..."` or similar
- The user passed `--no-changelog` (honor it — don't touch CHANGELOG.md)
- `[Unreleased]` already contains the same change (substring match)

**When to ask first:**
- The commit subject is generic (`feat: improvements`) — ask the user for a better changelog bullet before writing
- The commit spans multiple unrelated changes — ask whether to split into multiple bullets

#### Step 3b: Commit

4. Commit with the message + co-author:

```bash
git commit -m "$(cat <<'EOF'
{message}

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Step 4: Push

```bash
git push origin main
```

### Step 5: Monitor Deploy

1. Wait for the GitHub Actions deploy workflow to start:
```bash
sleep 8
gh run list --limit 1 --workflow=deploy.yml
```

2. Watch the deploy:
```bash
gh run watch {RUN_ID}
```

3. If deploy **fails**:
   - Run `gh run view {RUN_ID} --log-failed | tail -30`
   - Show the error
   - Suggest a fix
   - **Do NOT push again until the fix is confirmed**

### Step 6: Post-Deploy Verification

After successful deploy, run a quick smoke test:

```bash
# Test key pages return 200
for path in "/" "/blog/" "/changelog/" "/modules/0/introduction/" "/blog/claude-code-for-marketing-guide-2026"; do
  CODE=$(curl -sL -w "%{http_code}" -o /dev/null "https://cc4.marketing${path}")
  echo "$CODE $path"
done
```

**Flag any non-200 responses.**

### Step 7: Report

```
✅ Shipped to production

Commit: {COMMIT_HASH} {MESSAGE}
Deploy: {WORKFLOW_RUN_URL}
Status: All pages responding 200

Live at: https://cc4.marketing/
```

If there were any warnings or issues during the process, list them at the end.

## Common Scenarios

### New blog post
Use the dedicated `/publish-post` skill — it handles the D1 insert, sitemap update, and calls `/ship` at the end. Don't invoke `/ship` directly for a new post.

### New feature (auto-changelog kicks in)
```
/ship "feat: add /publish-post skill for blog post publishing"
```
`/ship` will auto-propose a `### Added` bullet for `## [Unreleased]` and stage `CHANGELOG.md` in the same commit. Confirm or edit the bullet when prompted.

### Bug fix (auto-changelog kicks in)
```
/ship "fix: correct og:image fallback on blog detail pages"
```
Auto-proposes a `### Fixed` bullet.

### Dependency update (no changelog)
```
/ship "chore: update dependencies"
```

### Docs or internal refactor (no changelog)
```
/ship "docs: document Emdash D1 publishing workflow"
/ship "refactor: extract markdown parser into helper module"
```

### Feature you explicitly don't want in the changelog
```
/ship "feat: internal dashboard improvements" --no-changelog
```

## Key Files

- `astro.config.mjs` — build config, sitemap
- `wrangler.jsonc` — Cloudflare Workers config
- `.github/workflows/deploy.yml` — deploy pipeline
- `package.json` — version and scripts

## Safety Rules

- **Never** force push to main
- **Never** skip the build step
- **Never** deploy if the build fails
- **Always** verify pages respond 200 after deploy
- **Always** include the co-author line in commits
- If the deploy workflow fails, **diagnose before retrying** — don't just push again
