---
name: whats-new
description: Show the latest course updates and changelog entries from CC4.Marketing
---

# /whats-new — Course Changelog

Show the user the latest updates to the CC4.Marketing course.

## Instructions

1. Fetch the changelog API:
   ```
   curl -s https://cc4-changelog.mtri-vo.workers.dev/api/changelog
   ```
   Use the Bash tool with `curl` to fetch this URL.

2. Parse the JSON response. The `entries` array contains changelog items sorted newest-first.

3. **If the user passed an argument** (e.g., `/whats-new module-1` or `/whats-new fix`):
   - If the arg matches a module name (e.g., `module-0`, `module-1`, `module-2`, `course`, `homepage`), filter entries where the `modules` array contains the arg.
   - If the arg matches a type (`added`, `changed`, `fixed`, `deprecated`, `removed`, `security`), filter by `type`.
   - If no matches, show a message: "No updates found for '{arg}'. Try: module-0, module-1, module-2, new, fix, improvement"

4. **If no argument**, show the 5 most recent entries.

5. **Format each entry like this:**

   ```
   [ADDED] v0.1.0 — Live changelog with Cloudflare Workers
   Mar 16, 2026
   Integrated a full changelog system powered by BearlyChange...
   Agent context: Deployed bearlychange as Cloudflare Worker...
   Modules: changelog, infrastructure, homepage
   ─────────────────────────────────────
   ```

   - Use `[ADDED]`, `[CHANGED]`, `[FIXED]`, `[DEPRECATED]`, `[REMOVED]`, or `[SECURITY]` prefix based on `entry.type` (follows Keep a Changelog convention)
   - Show `entry.version`, `entry.title`, formatted `entry.published_at` date
   - Show `entry.summary` as the human description
   - Show `entry.machine_summary` prefixed with "Agent context:" (if present)
   - Show `entry.modules` joined by comma (if present)
   - Separate entries with a horizontal rule

6. **After listing entries**, show:
   ```
   Full changelog: https://cc4.marketing/changelog
   RSS feed: https://cc4-changelog.mtri-vo.workers.dev/rss.xml
   ```

7. If the API is unreachable, tell the user:
   "Could not reach the changelog API. Visit https://cc4.marketing/changelog in your browser instead."
