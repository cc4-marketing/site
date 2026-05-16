---
title: "AEO round 1: FAQPage/HowTo schemas on blog posts, expanded lesson meta descriptions, question-form H2s"
category: seo-issues
date: 2026-04-28
tags:
  - aeo
  - seo
  - json-ld
  - structured-data
  - faqpage
  - howto
  - rich-results
  - meta-description
  - featured-snippets
  - lesson-pages
severity: moderate
component: blog/[slug].astro, src/content/modules/**/*.mdx
---

## Problem

Three AEO gaps remained after the April 28 SEO round:

1. **No rich result schemas on blog posts** — eligible posts (step-by-step guide, FAQ-style guide) had no `FAQPage` or `HowTo` JSON-LD. Google cannot display rich results for these posts.
2. **Lesson meta descriptions too short** — all 17 lesson pages had descriptions of 63–101 chars. Google truncates to 155–160 chars in SERP, meaning the existing descriptions were leaving 50–90 chars of SERP real estate unused.
3. **H2 headings as noun phrases** — key lesson H2s like "Agent Basics", "Course Structure", "Mastering Search Engine Optimization" were statements, not questions, missing featured snippet opportunities.

## Root cause

1. **No per-post schema infrastructure** — `blog/[slug].astro` emitted only `BlogPosting` and `BreadcrumbList`. There was no mechanism to add post-specific schemas without duplicating the entire file.
2. **Descriptions written as micro-summaries** — original MDX frontmatter descriptions were written for developer context ("what this lesson covers") not for SERP display ("why a searcher should click").
3. **H2s written for readability, not discoverability** — noun phrases scan well for readers but question-form headings match searcher intent and trigger featured snippets.

## Solution

### Fix 1: Per-post rich result schemas in blog/[slug].astro

Add a slug-keyed `extraSchemas` map. Future posts opt in by adding one entry:

```typescript
// src/pages/blog/[slug].astro — in the frontmatter script block
const extraSchemas: Record<string, object> = {
  'claude-code-for-marketing-guide-2026': {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'What is Claude Code for marketing?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Claude Code is an AI-powered CLI tool from Anthropic...',
        },
      },
      // ... more Q&A pairs
    ],
  },
  'write-campaign-brief-with-ai': {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': 'How to Write a Campaign Brief with AI in 10 Minutes',
    'totalTime': 'PT10M',
    'step': [
      { '@type': 'HowToStep', 'position': 1, 'name': 'Define your campaign goal', 'text': '...' },
      // ... 4 more steps
    ],
  },
};
const extraSchema = extraSchemas[slug!] ?? null;
```

Emit in the template:

```astro
{extraSchema && <script type="application/ld+json" set:html={JSON.stringify(extraSchema)} />}
```

**Which posts qualify:**
- `FAQPage`: posts with multiple H2s that read as questions ("What is X?", "Why do Y?", "How does Z work?")
- `HowTo`: posts with a numbered/step-by-step section, a clear `totalTime`, and discrete steps

**FAQPage rules:**
- Each `Question.name` should match a real H2 heading or implied searcher query
- `acceptedAnswer.text` should be 1–3 sentences — enough for a featured snippet, not a wall of text
- 3–6 questions is ideal; more than 8 dilutes the signal

**HowTo rules:**
- `totalTime` in ISO 8601 duration format: `PT10M` = 10 minutes, `PT1H` = 1 hour
- Each step needs `position`, `name` (short label), and `text` (1–2 sentence description)
- Steps must map to actual content sections — don't fabricate steps

### Fix 2: Expand lesson meta descriptions

All 17 MDX files need descriptions of 130–160 chars. Use `sed` for batch editing:

```bash
BASE=src/content/modules

# Pattern: replace the exact current description with an expanded version
sed -i '' 's|description: "OLD TEXT"|description: "NEW TEXT (130-160 chars)"|' "$BASE/module-N/N.N-lesson.mdx"
```

**Writing expanded descriptions — formula:**
- Lead with the *action* the learner takes (verb first)
- Include the primary keyword (Claude Code + topic)
- Mention 2-3 concrete outputs/skills
- End with a hook or scope qualifier ("in 45 minutes", "no coding required")

**Examples (before → after):**

| File | Before (chars) | After (chars) |
|------|------|------|
| 0.2-start-clone | "Launch Claude Code and clone the course materials to your local machine." (71) | "Learn to launch Claude Code for the first time, authenticate your Anthropic account, and clone the CC4.Marketing course starter project to your local machine." (158) |
| 2.3-marketing-copy | "Create high-converting copy at scale for every marketing channel" (63) | "Generate high-converting copy for email, social ads, landing pages, and more. Learn to prompt Claude Code for channel-specific marketing copy that converts." (155) |

**Batch verify after editing:**
```bash
grep "^description:" src/content/modules/**/*.mdx | awk -F'"' '{print length($2), $1}' | sort -n
```
All should be ≥ 130.

### Fix 3: Question-form H2s for featured snippets

Target the highest-traffic conceptual lessons. Only rephrase H2s that introduce a concept — exercise headers, step labels, and key-takeaways sections don't benefit from question form.

```bash
# 0.0 introduction
sed -i '' 's/^## Course Structure$/## How Is the Course Structured?/' src/content/modules/module-0/0.0-introduction.mdx
sed -i '' 's/^## Who This Course Is For$/## Who Is This Course For?/' src/content/modules/module-0/0.0-introduction.mdx

# 1.4 agents
sed -i '' 's/^## Agent Basics$/## What Are the Basics of Claude Code Agents?/' src/content/modules/module-1/1.4-agents.mdx
sed -i '' 's/^## When to Use Agents$/## When Should You Use Agents for Marketing?/' src/content/modules/module-1/1.4-agents.mdx

# 2.1 campaign brief
sed -i '' 's/^## Creating Professional Campaign Briefs with Claude$/## How Do You Create a Campaign Brief with Claude Code?/' src/content/modules/module-2/2.1-campaign-brief.mdx
sed -i '' 's/^## Step-by-Step: Creating a Campaign Brief$/## How to Write a Campaign Brief: Step-by-Step/' src/content/modules/module-2/2.1-campaign-brief.mdx

# 2.6 SEO
sed -i '' 's/^## Mastering Search Engine Optimization$/## How Do You Master SEO with Claude Code?/' src/content/modules/module-2/2.6-seo-optimization.mdx
sed -i '' 's/^## Technical SEO Audit$/## How Do You Run a Technical SEO Audit?/' src/content/modules/module-2/2.6-seo-optimization.mdx
```

**Which H2s to convert:**
- ✅ Concept introductions: "Agent Basics" → "What Are the Basics of...?"
- ✅ Procedural sections: "Step-by-Step: Creating X" → "How to Create X: Step-by-Step"
- ✅ "When/Why/Who" topics: "When to Use Agents" → "When Should You Use Agents?"
- ❌ Exercise headers: "Exercise: Build Your Content Strategy" — keep imperative
- ❌ Key Takeaways, Next Steps — structural, not discoverable
- ❌ Named frameworks or tools: "Competitive Positioning Matrix" — noun phrase is correct here

## Prevention

### Adding FAQPage/HowTo to future posts

When publishing a new how-to or FAQ-style post, add an entry to `extraSchemas` in `src/pages/blog/[slug].astro` before shipping. The check:

1. Does the post have ≥3 H2s phrased as questions? → FAQPage
2. Does the post have a numbered step section with clear discrete actions? → HowTo
3. Can you write the steps without fabricating content not in the post? → proceed

### Lesson description template

For each new lesson MDX, write the description as:
```
"[Verb] [primary topic] [with Claude Code context]: [2-3 concrete outputs or skills]. [scope/hook]."
```
Target: 140–155 chars. Check with: `echo -n "description text" | wc -c`

### Validating rich results before shipping

Test any new schema with Google's Rich Results Test:
```
https://search.google.com/test/rich-results?url=https://cc4.marketing/blog/{slug}/
```

For FAQPage: Google requires `@type: Question` with `acceptedAnswer` for every entry.
For HowTo: `totalTime` and at least 2 `HowToStep` entries are required.

## Related documentation

- [`comprehensive-seo-aeo-audit-fixes.md`](./comprehensive-seo-aeo-audit-fixes.md) — April 15 round (Course schema, breadcrumbs, title suffix, trailing slashes)
- [`publisher-logo-breadcrumb-thumbnail-fixes-20260428.md`](./publisher-logo-breadcrumb-thumbnail-fixes-20260428.md) — April 28 round 1 (publisher logo, standalone BreadcrumbList, featured_image D1, lesson breadcrumbs)
- `.claude/skills/seo-audit/SKILL.md` — audit skill used to identify these gaps
- `.claude/skills/publish-post/SKILL.md` — updated to remind publishers to add extraSchemas entry for eligible posts
