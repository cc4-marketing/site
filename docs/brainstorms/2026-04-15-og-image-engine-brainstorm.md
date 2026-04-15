---
date: 2026-04-15
topic: og-image-engine
---

# OG Image Engine for cc4.marketing

## What We're Building

An in-repo TypeScript OG image engine (Satori + resvg-wasm) that replaces the Python `generate_cover*.py` scripts. It renders 1200×630 typographic PNGs on-brand with cc4.marketing's retro-futuristic style (Righteous display font, hard shadows, cream/rust/plum/mustard palette).

Hybrid delivery: build-time pre-generation for known routes (modules, static pages, homepage variants), plus an on-demand `/api/og` SSR endpoint for Emdash-sourced blog posts. Dev-UI preview + manual override per post.

## Why This Approach

**Considered and rejected:**
- Pure build-time only → breaks the Emdash flow (blog posts live in D1, not in the repo, so a build doesn't know about new posts until redeploy).
- Pure SSR only → every cold request pays the Satori + resvg-wasm cost on Workers; risks bundle-size ceiling (~3 MB compressed).
- Keeping Gemini illustrations → user chose typographic templates aligned to brand; editorial-illustration style is dropped.

**Chosen:** Hybrid. Known routes are pre-rendered into `public/og/` at build time (zero runtime cost, CDN-cacheable). Emdash blog posts hit `/api/og` on first request, then get cached at the edge via `Cache-Control: s-maxage` + Workers Cache API. This keeps the Workers bundle in budget for a bounded surface area and sidesteps the "blog post published but no cover yet" problem.

## Key Decisions

- **Visual direction**: Typographic-only — no AI illustration. On-brand retro-futuristic: cream background (`#F5F1E8`), rust/plum/mustard accents, Righteous for title, Outfit for meta, hard drop shadows and thick borders to match the site's chunky aesthetic. Cover feel should read "poster" not "editorial photo."
- **Templates (initial set)**: `blog`, `module-lesson`, `generic`. Defer `event`, `course`, `team` until there's demand — YAGNI.
- **Brand config**: single `og.config.ts` (TypeScript, not YAML — matches the repo's convention and avoids a `js-yaml` dependency).
- **Fonts**: Bundle Righteous + Outfit as `.woff` ArrayBuffers. No network fetches at render time.
- **Author data**: Reuse existing `public/authors/*.png`. Small TS data file `src/lib/og/authors.ts`; skip Content Collections for authors (user chose not to migrate).
- **Runtime**: Satori + `@resvg/resvg-wasm` on Cloudflare Workers. Spike first to verify bundle size before committing to SSR.
- **Caching**: `/api/og` uses Workers Cache API (24h edge cache) + `Cache-Control: public, max-age=3600, s-maxage=86400`. Cache key = hash of query params.
- **Dev preview**: `/_dev/og-preview` route (dev-only) — form UI that calls `/api/og` and shows the PNG + a mock Facebook/Twitter/LinkedIn card.
- **Manual override**: If a post's Emdash frontmatter includes `ogImage`, use that; otherwise auto-generate from `title` + `author` + `category`.
- **Gemini scripts**: Keep `generate_cover*.py` in-repo but mark deprecated in a comment; don't delete until all existing posts have Satori-generated covers committed.

## Resolved Inputs

- **Emdash schema**: Blog post records in D1 already carry `author`, `category`, and `cover` fields — no schema migration needed. `/api/og` reads these directly; `cover` (if set) is the manual override, otherwise auto-generate from `title` + `author` + `category`.
- **Module lesson covers**: Per-lesson (17 covers). Build-time pre-generation writes to `public/og/modules/<module>/<lesson>.png`. One-time cost at build; no runtime impact.

## Open Questions

- **Font weights**: Righteous ships a single weight (400). Outfit is variable — confirm we only need 400 + 600 before bundling (each weight adds ~20–30 KB to the Worker bundle).
- **Decision gate at Step 1.0**: If resvg-wasm pushes the Worker bundle over 3 MB compressed, fall back to build-time-only and regenerate Emdash post covers via a scheduled Worker or a webhook-triggered GitHub Action.

## Scope Cuts (deliberately excluded)

- No Vietnamese/Japanese locale support (cc4.marketing is English-only today).
- No Content Collections migration for blog posts (Emdash stays the source of truth).
- No `event`/`course`/`team` templates in Phase 1.
- No Zod SEO schema enforcement (user scoped to a+b, not c).
- No build-time OG pre-generation for Emdash posts (they're generated on-demand and cached).

## Next Steps

→ `/ce:plan` to produce the implementation plan. Plan should lead with the Step 1.0 spike (Workers bundle size + Satori rendering of Righteous font + hard-shadow CSS) before any template work — that's the decision gate for the whole engine.
