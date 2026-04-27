---
name: hellobar
description: Toggle the site hello bar on/off or create a new one with custom content
---

# /hellobar — Manage the Hello Bar

Turn the site's top announcement bar on or off, or create a new one with custom content.

## Arguments

```
/hellobar on                         # Enable the current hello bar
/hellobar off                        # Disable the hello bar
/hellobar <text>                     # Create a new hello bar with this text
/hellobar                            # Show current status and ask what to do
```

**With options (can be combined with any of the above):**
```
/hellobar <text> --link <url>        # Set the CTA link URL
/hellobar <text> --cta <label>       # Set the CTA button text (default: "Learn more")
/hellobar <text> --cooldown <days>   # Set re-show cooldown in days (default: 3)
/hellobar <text> --ship              # Auto-run /ship after saving
```

## Instructions

### Config location

All hello bar state lives in a single file:

```
src/config/promo.ts → promoConfig.helloBar
```

Fields:
- `enabled: boolean` — whether the bar renders at all
- `text: string` — the announcement copy
- `linkText: string` — the CTA label (e.g. "See what's new")
- `linkUrl: string` — where the CTA links to
- `storageKey: string` — localStorage key for dismiss tracking (must be unique per campaign)
- `cooldownDays: number` — days before re-showing after dismiss

### Subcommand: `/hellobar on`

1. Read `src/config/promo.ts`.
2. Set `enabled: true` in the `helloBar` block.
3. Show the current text/link/cooldown so the user knows what they're enabling.
4. Save the file.

### Subcommand: `/hellobar off`

1. Read `src/config/promo.ts`.
2. Set `enabled: false` in the `helloBar` block.
3. Save the file.

### Subcommand: `/hellobar <text>` (new hello bar)

1. Read `src/config/promo.ts`.
2. Parse the arguments:
   - `<text>` — everything that isn't a flag; this becomes the `text` field
   - `--link <url>` — becomes `linkUrl` (required for new bars — if missing, ask the user)
   - `--cta <label>` — becomes `linkText` (default: `"Learn more"`)
   - `--cooldown <days>` — becomes `cooldownDays` (default: `3`)
3. Generate a unique `storageKey` from the text:
   - Slugify the first 4 words of the text, prefix with `hellobar-`
   - Example: `"New course module available"` → `"hellobar-new-course-module-available"`
   - This ensures users who dismissed a previous bar see the new one
4. Update the `helloBar` block in `promoConfig`:
   ```typescript
   helloBar: {
       enabled: true,
       text: "<text>",
       linkText: "<cta>",
       linkUrl: "<url>",
       storageKey: "<generated-key>",
       cooldownDays: <days>
   },
   ```
5. Save the file.
6. Show a preview:
   ```
   Hello bar updated

   Text: <text>
   CTA: <cta> → <url>
   Cooldown: <days> days
   Storage key: <key>
   Status: enabled

   Run /ship to deploy, or /hellobar off to disable.
   ```

### Subcommand: `/hellobar` (no args — status check)

1. Read `src/config/promo.ts`.
2. Show the current hello bar config:
   ```
   Hello bar status:
     Enabled: true/false
     Text: "..."
     CTA: "..." → https://...
     Cooldown: 3 days
     Storage key: hellobar-...
   ```
3. Ask: "Want to turn it on/off, or create a new one?"

### Auto-ship

If the user passed `--ship`, invoke `/ship` after saving the config. The commit message should be:
- For `on`: `chore: enable hello bar`
- For `off`: `chore: disable hello bar`
- For new content: `chore: update hello bar — "<first 40 chars of text>"`

Note: Always use `chore:` — hello bar updates are config changes, not user-facing features. Using `feat:` would wrongly trigger auto-changelog entries in `/ship`.

## Config file format

The exact shape of `src/config/promo.ts` to maintain when editing:

```typescript
export const promoConfig = {
    // Hello Bar (top banner)
    helloBar: {
        enabled: true,
        text: "...",
        linkText: "...",
        linkUrl: "...",
        storageKey: "hellobar-...",
        cooldownDays: 3
    },

    // Floating Side Banner (appears on scroll) — global
    floatingBanner: {
        ...
    },

    // Lesson Promo Banner (floating inside course lessons)
    lessonBanner: {
        ...
    }
};
```

**Important:** Only modify the `helloBar` block. Never touch `floatingBanner` or `lessonBanner` — those have separate controls.

## Component architecture (for reference)

- `src/components/HelloBar.astro` — the Astro component (renders if `enabled`, has dismiss JS with localStorage cooldown)
- `src/layouts/BaseLayout.astro` — imports and renders HelloBar with props from `promoConfig.helloBar`
- `src/styles/global.css` — `body:has(.hello-bar.visible) { padding-top: 42px; }` pushes content down when bar is shown

## Examples

```bash
# Quick toggle
/hellobar off
/hellobar on

# New announcement
/hellobar "New Module 3 just launched — Advanced Analytics" --link https://cc4.marketing/modules/3/welcome/ --cta "Start learning"

# Black Friday promo with short cooldown and auto-ship
/hellobar "Black Friday: 50% off ClaudeKit Marketing" --link https://claudekit.cc/?ref=BF2026 --cta "Grab the deal" --cooldown 1 --ship

# Status check
/hellobar
```

## Related skills

- `/ship` — deploy the config change to production
- `/changelog-add` — if you want a manual changelog entry for a promo change
