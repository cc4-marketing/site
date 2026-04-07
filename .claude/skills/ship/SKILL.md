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

### New blog post added via Emdash admin
After creating a post in `/_emdash/admin`, the blog pages auto-render (SSR). But to add the new post to the sitemap:
1. Add the post URL to `blogPages` array in `astro.config.mjs`
2. Run `/ship "feat: add {post-title} to sitemap"`

### Dependency update
```
/ship "chore: update dependencies"
```

### Quick fix
```
/ship "fix: correct typo in module 2 lesson title"
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
