---
date: 2026-04-29
topic: author-page-personal-prompts
---

# Author Page: More Personal + Better AI Prompts

## What We're Building

Upgrade `/blog/authors/{slug}` from a generic profile page into a personal homepage that feels like a real human's space. Each page gets four new sections (long-form intro, "now" block, tools/stack, topics) plus a per-author **prompt library** with 3-4 ready-to-copy prompts (mostly templated, 1-2 hand-written per author).

The goal: when a reader lands on Tri's page, they should leave with a clear sense of *who he is*, *what he's working on this month*, *what tools he swears by*, and *how to use AI to learn from or write like him*.

## Why This Approach

We considered three lighter approaches:
- **Just a longer bio** — too static, no personality
- **Single AI prompt** — what we shipped today; useful but impersonal
- **Auto-generated prompts from posts** — too complex, fragile, and the magic doesn't justify the build cost

The chosen approach (hybrid templated + hand-written prompts, plus four personality sections) hits the sweet spot: most of the page is consistent across authors (so adding a new author is fast), but each author still has signature touches that make the page feel like *theirs*.

## Key Decisions

- **All four personality sections, in order**: long-form intro → now → tools/stack → topics → social → prompts → posts. Intro sits at the top because that's the highest-value content.
- **Hybrid prompt sourcing**: 2 templated prompts ("Learn {Author}'s style", "Find their work on a topic") + 1-2 author-written prompts. Templates use placeholders; author overrides live in the local authors data file.
- **Each prompt has a copy button**: low-friction is the whole point. Don't make people select text manually.
- **"Now" block is dated and editable**: stored in the local authors data alongside other fields. Convention: include a "last updated" date so it doesn't go stale silently.
- **Topics are derived, not authored**: pull the unique tags/categories from the author's published posts. No manual tag list to maintain.
- **Tools/stack is hand-written**: each author lists 5-10 tools as `{name, url, why}` tuples. Keeps it opinionated and personal.
- **Visual personality stays light**: skip per-author signature colors and custom hero images for v1. The four content sections do enough heavy lifting; revisit visuals if pages still feel generic.

## Open Questions

- Where does the long-form intro live? Probably in the local `AUTHORS` array (markdown string), but if it gets long we may want it in a separate `.md` file per author.
- Should the prompt copy button track copy events for analytics? Probably yes via Beam, but ship without it first.
- Do we render markdown inside the long-form intro? (Lists, links, emphasis.) Probably yes — use a small markdown renderer or just `set:html` after sanitization.
- For "Now" block: should it have a permalink/RSS so people can subscribe to author updates? Out of scope for v1, revisit if engagement is high.

## Next Steps

→ `/ce:plan` for implementation details
