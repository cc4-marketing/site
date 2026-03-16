---
name: release
description: Cut a new release — bump version, update changelog, publish entries, tag, push, and create GitHub release
---

# /release — Full Release Flow

Run the complete release process for cc4-marketing/site in one go.

## Arguments

`/release <bump>` where `<bump>` is one of:
- `patch` — bug fixes (0.2.0 → 0.2.1)
- `minor` — new features (0.2.0 → 0.3.0)
- `major` — breaking changes (0.2.0 → 1.0.0)

If no argument is given, ask the user which bump type to use.

## Instructions

Follow these steps **in order**. Stop and report if any step fails.

### Step 1: Determine the new version

1. Read `package.json` and extract the current `"version"` field.
2. Apply the bump type (patch/minor/major) using semver rules.
3. Confirm the new version with the user before proceeding: "Releasing v{NEW_VERSION} (was v{OLD_VERSION}). Continue?"

### Step 2: Check for uncommitted changes

Run `git status`. If there are uncommitted changes:
- Show them to the user
- Ask: "There are uncommitted changes. Should I commit them as part of this release?"
- If yes, stage and commit with message `chore: pre-release cleanup`
- If no, stop.

### Step 3: Gather changelog content

1. Read `CHANGELOG.md` and extract everything under `## [Unreleased]`.
2. If the Unreleased section is empty, look at git commits since the last tag:
   ```bash
   git log $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD --oneline
   ```
3. Summarize the changes into Keep a Changelog categories: Added, Changed, Fixed, Deprecated, Removed, Security.
4. Show the draft changelog to the user and ask for confirmation.

### Step 4: Update CHANGELOG.md

1. Replace `## [Unreleased]` content with an empty section.
2. Insert a new version section below it: `## [{NEW_VERSION}] - {TODAY_YYYY-MM-DD}`
3. Add the changelog content from Step 3 under the new version.
4. Update the links at the bottom:
   - Change `[unreleased]` to compare against the new tag: `compare/v{NEW_VERSION}...HEAD`
   - Add new version link: `[{NEW_VERSION}]: https://github.com/cc4-marketing/site/compare/v{OLD_VERSION}...v{NEW_VERSION}`

### Step 5: Update package.json

Change `"version": "{OLD_VERSION}"` to `"version": "{NEW_VERSION}"`.

### Step 6: Update changelog KV entries

1. Read `changelog-worker/data/entries.json`.
2. Change all entries with `"version": "unreleased"` to `"version": "{NEW_VERSION}"`.
3. Save the file.
4. Upload to Cloudflare KV:
   ```bash
   cd changelog-worker && npx wrangler kv key put --remote --namespace-id=0056bfd0472e481387acaec3f6e8a721 "entries" --path=data/entries.json
   ```

### Step 7: Build and verify

```bash
cd /Users/admin/Documents/cc4m/site && rm -rf dist && npx astro build
```

If the build fails, stop and report the error.

### Step 8: Commit, tag, and push

```bash
git add package.json CHANGELOG.md changelog-worker/data/entries.json
git commit -m "release: v{NEW_VERSION}"
git tag v{NEW_VERSION}
git push origin main --tags
```

### Step 9: Create GitHub release

Generate release notes from the changelog content in Step 3. Create the release:

```bash
gh release create v{NEW_VERSION} --repo cc4-marketing/site \
  --title "v{NEW_VERSION} - {SHORT_TITLE}" \
  --notes "{RELEASE_NOTES}"
```

The release notes should include:
- The changelog categories (Added, Changed, Fixed, etc.) as markdown
- A link to the full changelog: https://cc4.marketing/changelog
- A link to the diff: https://github.com/cc4-marketing/site/compare/v{OLD_VERSION}...v{NEW_VERSION}

### Step 10: Confirm

Show a summary:
```
✅ Released v{NEW_VERSION}
   - CHANGELOG.md updated
   - package.json bumped
   - KV entries published
   - Git tagged and pushed
   - GitHub release: {RELEASE_URL}
   - Live at: https://cc4.marketing/changelog
```
