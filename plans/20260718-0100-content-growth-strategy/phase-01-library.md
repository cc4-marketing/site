# Phase 01: Claude Code Marketing Library

Central growth asset. Curated directory of prompts, slash commands, skills, subagents, MCP servers for marketers using Claude Code. Two jobs: link magnet (free entries drive traffic + email signups) and product shelf (paid packs at $19.99 via Polar). Modeled on sheetsformarketers.com: hub-and-spoke, dense internal links, one master public doc that travels in communities and links back, formulaic cheap-to-produce entry pages.

## Decision: MDX content collection, not D1

Store library entries as MDX in a new `library` content collection (`src/content/library/`), same loader pattern as `modules`. Reasons:

- D1/Emdash blog path has real manual friction (see publish-post SKILL): dry-run python helper, `wrangler d1 execute` exactly once, manual `featured_image` fix, hardcoded `blogPages` array in astro.config for sitemap. Fine for ~10 posts, wrong for 30+ formulaic entries.
- MDX collection auto-derives sitemap from the filesystem (copy `deriveModuleLessonUrls` in astro.config). New entry = new file, zero extra config, zero D1 round-trip.
- The artifact (prompt text, command body, skill source) lives inline in the MDX. Git-versioned, greppable, PR-reviewable. No R2 upload dance.
- Entry pages render server-side like lessons: `getCollection('library')` + `render(entry)`, mirroring `src/pages/modules/[...slug].astro`.

Blog stays on D1 (Emdash owns rich PortableText + OG engine). Library is a separate, simpler surface. Do not force them onto one store.

## 1. Entry schema (`src/content.config.ts`, new collection)

Zod schema, frontmatter per MDX file:

- `name` string. Display title.
- `slug` string optional. Derived from filename if absent (match modules pattern).
- `category` enum. One of the category tree below.
- `type` enum: `prompt | command | skill | subagent | mcp`.
- `tagline` string, <=90 chars. One-line desc for grid cards + meta description.
- `description` string. Longer paragraph, the "what + why + when" for the entry body top.
- `artifact` handled in MDX body, not frontmatter: a fenced code block (copyable) for free entries; for paid, a short preview block + locked marker.
- `access` enum: `free | paid`.
- `polarProductId` string optional. Required when `access: paid`.
- `polarCheckoutUrl` string optional. Direct checkout link (Polar hosted) for the buy button.
- `price` number optional, default 19.99 when paid.
- `related` array of slugs. Powers the related-entries block.
- `author` enum: `tri-vo | alice-marketer`. Reuse existing byline slugs.
- `tags` array of strings. Freeform (e.g. `seo`, `serp`, `brief`, `b2b-saas`).
- `updatedAt` date optional. Drives freshness + AEO.

## 2. Category tree

sheetsformarketers ran 17 categories by tool/function. Start narrower (9), by marketing function, so each category page has real density on day one instead of thin stubs. Grow later.

Starting set (slug: label):
- `seo`: SEO
- `content`: Content & Copy
- `paid-ads`: Ads & Paid
- `analytics`: Analytics & Data
- `email`: Email & Lifecycle
- `social`: Social & Community
- `reporting`: Reporting & Dashboards
- `competitive`: Competitive Research
- `project-ops`: Project & Ops

Each maps to course lessons (SEO + content -> Module 2, analytics/reporting -> Module 2 analytics lesson, project-ops -> Module 1 workflows). Add `ads`-adjacent or `crm` categories only once they have 3+ entries.

## 3. URL + hub architecture

Three levels, mirrors the model site:

- `/library/` hub. All categories as cards, brand stats, the free-vs-paid explainer, link to the master public doc, email capture.
- `/library/[category]/` category page. Grid of entry cards, category intro paragraph (200-300 words, keyword-targeted, hub-page role in the topic cluster), sidebar listing all categories.
- `/library/[category]/[entry]/` entry page. Formulaic: name, tagline, type + access badges, description, artifact block, install/use steps, Q&A block, related entries, breadcrumbs.

Internal-linking rules (the SEO engine):
- Sidebar on every category + entry page lists all 9 categories (cross-links the whole hub).
- Every entry page: breadcrumb `Home > Library > Category > Entry`; a "Related entries" block (3-5 from `related` + same-category fallback).
- Category page links down to all its entries; entry pages link back up to their category (pillar).
- Retro-fit: link from relevant blog posts and Module 2 lessons into matching library entries (e.g. the content-strategy lesson links the "SEO content brief" command; the campaign-brief blog post links the brief entries).

Route registration (Astro):
- Content collection `library` in `src/content.config.ts`.
- Pages: `src/pages/library/index.astro`, `src/pages/library/[category]/index.astro`, `src/pages/library/[category]/[entry].astro`. Use `getCollection('library')` + `render()`, static-generate with `getStaticPaths` (default prerender, unlike the blog SSR route).
- Sitemap: add `deriveLibraryUrls()` to astro.config (copy `deriveModuleLessonUrls`, read `src/content/library/`), push hub + category + entry URLs into `customPages`. No hardcoded list, no D1 query. Give entries priority 0.7, category pages 0.8, hub 0.8 in `serialize`.

## 4. Free vs paid split

Free (ungated, real value, the magnet):
- Single prompts.
- Single slash commands.
- Single subagent definitions.
- Simple project-memory / CLAUDE.md templates.

Paid ($19.99, the shelf):
- Multi-step skill packs (a skill + its scripts + reference docs bundled).
- Multi-agent flows (orchestrated subagents + commands that run a full workflow).
- Anything that replaces a chunk of billable agency work in one shot.

Paid entry page layout:
- Same header (name, tagline, badges) as free, so it sits in the same grid and gets the same SEO.
- Real preview: description, what's inside (file list), a screenshot or a trimmed sample of the artifact.
- Locked artifact block: blurred/omitted body with a "Get this pack" panel = Polar buy button (`polarCheckoutUrl`), price, what you get, refund note.
- Q&A + related entries still render (AEO + cross-sell).

Bundle: "Marketing Library Pro" = every paid pack, single Polar product, priced below the sum (e.g. 4 packs x $19.99 = ~$80 retail, bundle ~$49). One bundle checkout link surfaced on the hub and on each paid entry page ("or get all packs").

Note: current `faq.astro` says "no paid tier, no upsell." Update that answer when the first pack ships: course stays 100% free, packs are optional add-ons.

## 5. Seed entries (first ~26)

Free lead magnets:
1. SEO content brief generator (seo, command, free): `/content-brief` builds a full SEO brief from a keyword.
2. SERP intent classifier (seo, prompt, free): label a keyword list by search intent.
3. Meta title + description writer (seo, command, free): SERP-length-checked title/description pairs.
4. Topic cluster mapper (seo, command, free): pillar + supporting posts from a seed keyword. Ties to Module 2.2.
5. Blog post outline from keyword (content, command, free): H2/H3 outline with intent notes.
6. Brand voice project-memory template (content, prompt, free): CLAUDE.md block that enforces tone across a project.
7. Repurpose blog to social (content, command, free): one post -> LinkedIn, X thread, IG carousel copy.
8. Newsletter draft from a link (email, command, free): summarize + CTA from a URL.
9. Cold email personalizer (email, prompt, free): per-recipient opening lines from notes.
10. Ad copy variant generator (paid-ads, command, free): 10 headline/body variants for one offer.
11. Google Ads negative-keyword finder (paid-ads, prompt, free): mine a search-terms export.
12. GA4 question answerer (analytics, prompt, free): plain-English questions to GA4 exploration steps.
13. UTM builder + naming convention (analytics, command, free): consistent tagged links.
14. Weekly metrics summary prompt (reporting, prompt, free): turn a CSV into a plain-language readout.
15. Competitor page teardown (competitive, prompt, free): analyze one competitor landing page.
16. Content calendar scaffold (project-ops, command, free): 90-day rolling calendar. Ties to Module 2.2.
17. Brand Voice Guardian subagent (content, subagent, free): reviews copy against brand rules.
18. SEO Specialist subagent (seo, subagent, free): on-page review pass.
19. Marketing MCP starter list (project-ops, mcp, free): curated MCP servers marketers actually use, with setup notes.

Paid packs:
20. Competitor teardown skill pack (competitive, skill, paid $19.99): multi-source competitor audit (site + ads + content + social) into one report.
21. Weekly reporting flow (reporting, skill, paid $19.99): pull metrics, compute deltas, write the exec summary, output a formatted dashboard doc. End to end.
22. Full content engine flow (content, skill, paid $19.99): research -> topic clusters -> calendar -> briefs -> drafts, chained. Productized version of Module 2.2.
23. SEO audit skill pack (seo, skill, paid $19.99): tech + on-page + content-gap audit with prioritized fix list. Mirrors the repo's own seo-audit skill, packaged for the student's own site.
24. Campaign-brief-to-assets flow (project-ops, skill, paid $19.99): brief -> channel plan -> copy -> QA, one command.

Bundle:
25. Marketing Library Pro bundle (project-ops, skill, paid): all packs, discounted single checkout.

Seed authoring: Tri owns the technical/SEO packs, Alice owns content/email/social entries (matches existing bylines). ~26 entries covers all 9 categories with 2+ each.

## 6. Master public doc

Recommend a public GitHub repo (`cc4-marketing/marketing-library`), not Notion/Sheet. Reasons: audience is Claude Code users (GitHub-native), entries are code, repos travel well in dev/marketing communities, README renders as a directory, stars = social proof, and it lets people PR new entries (community flywheel). Notion/Sheet fits the sheetsformarketers spreadsheet-native audience; ours is code-native.

Structure:
- `README.md` = the full directory table: category, name, type, free/paid, one-line desc, and a link to the live entry page on cc4.marketing.
- One folder per category, one `.md` per free entry holding the raw artifact (source of truth the site MDX mirrors, or the site imports).
- Paid packs: a stub page in the repo (description + "buy on cc4.marketing" link), never the full source.

Flywheel: every repo entry links back to the entry page (traffic + SEO), every entry page links to the repo (stars + shares), the repo README is the artifact that gets pasted into Reddit/X/Slack communities. Add a "Add your own" CONTRIBUTING that routes contributors to the site.

## 7. AEO per entry

Every entry page carries:
- JSON-LD: `SoftwareSourceCode` (for prompt/command/skill/subagent) or `SoftwareApplication` for MCP entries, plus `BreadcrumbList`. Free entries add the artifact as `text`; include `author`, `keywords` (tags), `isAccessibleForFree`.
- A `FAQPage`-schema Q&A block, 3-4 pairs per entry ("What does this do?", "How do I install it in Claude Code?", "Is it free?", "What does it pair with?"). Reuses the FAQ schema pattern already shipped on `faq.astro`.
- llms.txt: new `## Marketing Library` section listing hub + category URLs; llms-full.txt lists each entry URL with its one-line desc (same convention as Published Posts). Update both when entries ship, folded into the entry-publish flow.

## Open questions

- Polar not yet integrated (no code refs found). Blocks paid entries. Sequence: ship free library first (magnet + SEO), wire Polar via the `integrate:polar` command + payment-integration skill in a later phase, then flip on paid packs.
- Entry-publish automation: worth a small `/publish-library-entry` skill (scaffold MDX + frontmatter + llms.txt append), but only after the manual pattern proves out on the first ~10.
