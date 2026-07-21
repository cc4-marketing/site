# Phase 02: Content engine + distribution flywheel

Spoke tutorials that feed the Library (Phase 1) and the email list. Formulaic, cheap, AEO-weighted. Modeled on sheetsformarketers' "how to X in Google Sheets" long tail, adapted: "how to [marketing task] with Claude Code (+ copy-paste [prompt/command])".

## Why this shape

- Each tutorial targets one task a marketer searches for, ends with a real artifact, and links to the matching Library entry. Tutorial ranks/gets cited, Library entry converts (email + later paid pack).
- "claude code" search volume is small and moving, so weight AEO (llms.txt, FAQ schema, clean structure) over pure keyword volume. Goal: get cited by AI answer engines, not just rank.

## Tutorial template (repeatable, ~700-900 words)

Every post follows the same skeleton so it is fast to produce and consistent to crawl:

1. Title: `How to [task] with Claude Code (+ [copy-paste prompt|slash command])`. Year in title where it helps freshness.
2. One-paragraph problem framing (who has this task, why it is slow by hand).
3. What you need (Claude Code installed, link Module 0 install lesson).
4. The steps: 3-6 numbered steps, each with the exact thing to type. Real commands, no hand-waving.
5. The artifact: the full prompt or slash command in a fenced block, copyable. Same artifact as the Library entry (single source: link to the entry, do not fork the text).
6. Example output (trimmed, real).
7. "Take it further" -> link the Library entry + 1 related tutorial + 1 course lesson.
8. Q&A block (3-4 pairs) -> FAQPage schema (reuse faq.astro pattern).
9. CTA: subscribe (Substack) + browse the Library.

Frontmatter (publish-post schema): title <=60, excerpt <=160, author (tri-vo or alice-marketer), keywords. Cover: let the OG engine auto-generate.

## Cadence + ownership

- 2 posts/week, AI-assisted. Tri owns SEO/technical/analytics topics, Alice owns content/email/social. Match the byline to the Library category.
- Batch: draft 4-6 at once from the Library entries that already exist (each free entry = one tutorial). The first 13 tutorials write themselves from the 13 seed entries.
- Pipeline: draft md -> /publish-post (D1 insert + sitemap + auto llms sync from phase 0) -> /ship. No new tooling needed.

## First batch (from existing Library entries)

Each maps 1:1 to a shipped free entry (flywheel):
1. How to Write an SEO Content Brief with Claude Code (+ slash command) -> library/seo/content-brief-generator. [draft written: first-tutorial-draft.md]
2. How to Classify Keywords by Search Intent with Claude Code -> library/seo/serp-intent-classifier.
3. How to Turn One Blog Post into a Week of Social Posts -> library/content/repurpose-blog-to-social.
4. How to Draft a LinkedIn Post from Rough Notes with Claude Code -> library/social/linkedin-post-from-notes.
5. How to Answer GA4 Questions in Plain English with Claude Code -> library/analytics/ga4-question-answerer.
6. How to Write Ad Copy Variants Fast with Claude Code -> library/paid-ads/ad-copy-variants.

## Distribution flywheel (non-code, needs owner)

- Launch the Library as an event, not a slow SEO bet: Product Hunt, Show HN, r/ClaudeAI, r/marketing, LinkedIn, X. The master GitHub repo (cc4-marketing/marketing-library) is the shareable artifact pasted into communities.
- Expert roundup post: "How N marketers use Claude Code" (interview the community, each interviewee shares -> backlinks + relationships).
- Substack nurture, weekly: 1 new Library entry + 1 tutorial + 1 soft paid-pack mention (once packs ship).
- Retrofit internal links (code task, small PR): from existing blog posts and Module 2 lessons into matching Library entries (e.g. content-strategy lesson -> content-brief-generator entry; campaign-brief post -> brief entries).

## AEO for tutorials

- FAQPage schema per post (already the site pattern).
- Add each published tutorial to llms.txt Published Posts (auto via phase-0 publish_post.py change) and cross-reference the Library entry.
- Add a `## Marketing Library` section to llms.txt/llms-full.txt (deferred from Phase 1) so engines see the whole directory.

## Follow-ups / open

- Publishing is a production deploy (D1 + wrangler + ship). Needs owner go-ahead per post or per batch; do not auto-deploy.
- Master GitHub repo not created yet (hub forward-links to it).
- Retrofit-links PR not started.
