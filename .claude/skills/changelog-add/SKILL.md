---
name: changelog-add
description: Add a new changelog entry to the live changelog
---

# /changelog-add — Add Changelog Entry

Add a new entry to the CC4.Marketing changelog.

## Arguments

`/changelog-add <description>` — a short description of the change. If no argument, ask the user what changed.

## Instructions

### Step 1: Gather entry details

Ask the user (or infer from the argument and recent git history) for:

- **Title**: short headline (max 60 chars)
- **Summary**: 1-2 sentence description
- **Type**: one of `added`, `changed`, `fixed`, `deprecated`, `removed`, `security`
- **Scope**: `site` (cc4-marketing/site) or `course` (cc4-marketing/cc4.marketing)
- **Modules**: relevant tags (e.g., `homepage`, `changelog`, `module-1`, `seo`, `docs`)

Show the draft entry and ask for confirmation before proceeding.

### Step 2: Add to CHANGELOG.md

1. Read `CHANGELOG.md`.
2. Under `## [Unreleased]`, find or create the matching `### {Type}` subsection (e.g., `### Added`).
3. Append a bullet point with the summary.
4. Keep the subsection ordering: Added, Changed, Deprecated, Removed, Fixed, Security.

### Step 3: Add to KV entries

1. Read `changelog-worker/data/entries.json`.
2. Add a new entry object:
   ```json
   {
     "id": "bc_{scope}_{random_3_chars}",
     "slug": "{slugified-title}",
     "title": "{title}",
     "summary": "{summary}",
     "type": "{type}",
     "version": "unreleased",
     "modules": ["{scope}", ...other modules],
     "machine_summary": "{concise technical summary}",
     "status": "published",
     "published_at": "{ISO_NOW}",
     "created_at": "{ISO_NOW}"
   }
   ```
3. Save the file.
4. Upload to Cloudflare KV:
   ```bash
   cd /Users/admin/Documents/cc4m/site/changelog-worker && npx wrangler kv key put --remote --namespace-id=0056bfd0472e481387acaec3f6e8a721 "entries" --path=data/entries.json
   ```

### Step 4: Commit

```bash
cd /Users/admin/Documents/cc4m/site
git add CHANGELOG.md changelog-worker/data/entries.json
git commit -m "changelog: {title}"
git push origin main
```

### Step 5: Confirm

```
✅ Changelog entry added
   - Title: {title}
   - Type: {type}
   - Scope: {scope}
   - Live at: https://cc4.marketing/changelog
```
