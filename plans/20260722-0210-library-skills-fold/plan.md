# Fold /skills (PR #25) into the Marketing Library

Decision: one directory. Keep every library file on main, port only net-new mechanics from PR #25 (cart, R2 download, tabbed install). Close #25.

## Packaging (gh repo vs R2): split by tier
- Free skills: public GitHub repo, `git clone <repo> ~/.claude/skills/<slug>`. Versioned, PR-able, transparent, flywheel, native install shape.
- Paid packs: R2 gated download via Polar (later). Protects paid source; single file for non-tech buyers.

## Mechanics to port (net-new only)
1. Schema (`content.config.ts` libraryCollection): add optional `repoUrl`, `downloadKey` (skill-only). Skip `installCmd` (YAGNI).
2. Cart: port `SkillCart.astro` -> `src/components/library/stack-cart.astro`, route-agnostic via data-attrs (`data-download-url`, `data-page-url`). Render add-to-stack ONLY on `type: skill` (and future paid packs). Not on prompt/command/subagent/mcp.
3. Download route: `src/pages/library/download/[slug].skill.ts` (SSR, R2 `MEDIA`, slug-validated via `getLibraryEntryBySlug`, 404-not-500, noindex). Exclude `/library/download/*` from sitemap filter.
4. Detail page (`library/[category]/[entry].astro`): conditional `{type === 'skill'}` block: tabbed install (git clone / download), View on GitHub, add-to-stack + one `<StackCart/>`. Swap JSON-LD to `SoftwareApplication` for skill type; keep `SoftwareSourceCode` for the other 4. Zero change to 16 non-skill entries.
5. `CodeBlockCopy.astro`: add the one-line `[data-no-copy-btn]` skip.
6. Helper: `getLibraryEntryBySlug(slug)` in `src/lib/library.ts` (globally-unique skill slugs).

## Drop from #25 (library already owns these)
skills routes, skills collection, Skills nav entry, skillPages sitemap branch, skills OgPageKey, separate llms Skills section. Close PR #25. Add defensive 301 `/skills` and `/skills/*` -> `/library/`.

## Skills to bring (user pick)
- notes-humanizer (content, FREE): ship now via public repo, working git clone. Proves the pattern.
- campaign-review (project-ops, PAID), last-30-days (competitive, PAID), pptx deck (reporting, PAID): add as skill entries, access: paid, install gated until Polar. Preview + "install at launch".

## Sequencing
- Phase A: fold mechanics (schema, cart, download route, detail UI, CodeBlockCopy, helper, sitemap). Build green.
- Phase B: 4 skill entries; publish notes-humanizer to a public repo, set repoUrl. Paid 3 as preview entries.
- Close #25, 301 redirect, deploy, verify.

## Open
- notes-humanizer repo home: dedicated `cc4-marketing/skills` vs a folder in `cc4-marketing/marketing-library`. Recommend dedicated repo so `git clone <repo> ~/.claude/skills/notes-humanizer` lands clean.
- Category for cross-cutting skills: content/project-ops per skill; no new category.
