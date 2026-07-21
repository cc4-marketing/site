---
title: "How to Write an SEO Content Brief with Claude Code"
slug: seo-content-brief-with-claude-code
excerpt: "Turn one keyword into a full SEO content brief in Claude Code with a reusable slash command. Intent, SERP notes, outline, entities, word count."
author: tri-vo
keywords: [seo content brief, claude code, content brief template, seo workflow]
---

A content brief is the difference between a writer guessing and a writer executing. Most briefs take 30 to 45 minutes of tab-switching: check the SERP, skim three competitors, note the intent, sketch an outline, list the entities. This tutorial turns that into one command you type once and reuse for every keyword.

By the end you will have a `/content-brief` slash command in Claude Code that takes a target keyword and returns intent, SERP notes, a title, an outline, entities, internal links, and a grounded word count.

## What you need

Claude Code installed and a project folder open. If you have not set it up yet, the [installation lesson](https://cc4.marketing/modules/0/installation/) walks through it in five minutes. No coding required: you type plain English and save one text file.

## Step 1: Create the command file

Slash commands in Claude Code are just markdown files in `.claude/commands/`. Create one called `content-brief.md`:

```markdown
---
description: Build a full SEO content brief from one target keyword.
argument-hint: [target keyword]
---

You are an SEO strategist writing a content brief for a writer who has not
researched this topic. The target keyword is: $ARGUMENTS

Produce a brief with these sections, in this order:

1. Target keyword and 3 to 5 secondary keywords or close variants.
2. Search intent: label it informational, commercial, transactional, or
   navigational, and explain in one sentence what the searcher wants.
3. SERP notes: describe the likely content types ranking now, the common
   angle, and one gap none of them cover.
4. Recommended title and one-line meta description.
5. Outline: an H2 and H3 structure that covers the topic more completely than
   a typical top result. Mark which sections answer the primary intent.
6. Entities and subtopics to include. List 8 to 12.
7. Internal links: 3 to 5 types of pages that should link to or from this article.
8. Target word count, with a one-line rationale tied to the SERP.
9. Three questions the article must answer to earn a featured snippet.

Keep it scannable. Use lists, not paragraphs, wherever possible. If the keyword
is ambiguous, state your assumption at the top and continue.
```

## Step 2: Run it on a real keyword

In Claude Code, type `/content-brief best crm for small teams` and swap in your own keyword. Claude returns the full brief in one pass.

## Step 3: Read intent and SERP notes first

If the intent label is wrong, the rest of the brief is built on sand. Refine the keyword (add a qualifier, narrow the audience) and rerun before you trust the outline.

## Step 4: Hand off or keep going

Give the outline and entity list to your writer, or stay in Claude Code and draft the article section by section against the brief. Because the structure is fixed, every brief your team produces looks the same, which makes drafting and review faster.

## Example output

For "best crm for small teams" the command labels the intent commercial, flags that the SERP is dominated by listicles with the same ten tools, and suggests the gap: none segment by team size under ten. The outline leads with that segmentation, and the word count lands around 2,200 with a rationale tied to the depth of the top three results.

## Take it further

- Grab the ready-made version on the [Content Brief Generator](https://cc4.marketing/library/seo/content-brief-generator/) page in the Marketing Library.
- Pair it with the [Meta Title and Description Writer](https://cc4.marketing/library/seo/meta-title-description-writer/) to finish the on-page setup.
- Learn the full method in the [Content Strategy lesson](https://cc4.marketing/modules/2/content-strategy/).

## FAQ

**Do I need to know how to code?** No. A slash command is a plain text file with instructions. You write instructions in English and save the file.

**Where does the file go?** In `.claude/commands/content-brief.md` inside your project folder. Claude Code picks it up automatically.

**Is the command free?** Yes. The full artifact lives in the Marketing Library at no cost. You only need your own Claude subscription to run it.

**What pairs well with this?** The SERP intent classifier for keyword lists, and the meta title and description writer for the on-page tags.
