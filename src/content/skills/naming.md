---
name: Naming Skill
description: Turn an abstract naming brief into scored, narrative-backed name candidates — for brands, products, features, campaigns, and codenames.
tags:
  - naming
  - branding
  - strategy
repo: https://github.com/cc4marketing/naming-skill
skillFile: naming.skill
author: tri-vo
draft: false
publishedAt: 2026-06-09
---

# Naming Skill

A structured naming workflow for Claude. It converts a loose naming need into an
organized brief, generates name clusters from mythological and cultural sources,
scores each candidate on memorability and distinctiveness, and presents a
shortlist with a short narrative (Origin → Transformation → Destiny) for each.

> This skill does **not** perform trademark or legal screening. Always run a
> separate trademark check before committing to a name.

## What it's good for

- Product and feature names
- Brand and campaign names
- Internal codenames

## How it works

1. **Brief** — clarifying questions turn your need into a one-page brief.
2. **Generate** — name clusters from distinct inspiration sources.
3. **Score** — each candidate rated on memorability + distinctiveness.
4. **Shortlist** — top candidates with an Origin → Transformation → Destiny story.

## Example

```text
> Use the naming skill. We need a name for a privacy-first analytics product.
```

The skill replies with a brief, ~20 candidates across 4 clusters, scores, and a
narrated shortlist of 5.
