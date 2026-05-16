---
title: Sigil Companion Integration (Capstone Module 3)
type: feat
status: draft
date: 2026-05-16
origin: external — agreement with blacklogos/sigil maintainer (Tri)
---

# Sigil Companion Integration (Capstone Module 3)

## Overview

Add a Module 3 capstone lesson — `3.1 Ship a Real Follow-Up with sigil` — that bridges Modules 0–2 into a working, shippable marketing artifact: a personalized post-event follow-up campaign powered by [blacklogos/sigil](https://github.com/blacklogos/sigil), an open-source MIT-licensed CLI that uses a custom Claude Code slash command (`/email-rewrite`) to handcraft per-recipient sentences.

This integration is **bidirectional**:

- cc4.marketing gains a hands-on capstone that turns Module 1's "build custom AI agents" concept into a real tool a learner can run end-to-end in 75 min.
- Sigil gains a warm distribution channel — the existing cc4.marketing audience is the exact ICP for a per-recipient handcrafted email workflow.

Neither project merges. Each stays in its own repo with its own license and voice. The integration is a cross-link + a single lesson + a done-with-you funnel.

## Goals

1. **One lesson, well-shipped.** `src/content/modules/module-3/3.1-ship-with-sigil.mdx` is live, reviewed, and renders cleanly in the existing Astro pipeline.
2. **Cross-promotion functional.** Sigil's README links here; this lesson links to the sigil repo. The course's existing "Course Complete" closer at 2.6 either updates to point at the capstone or stays put — author's call.
3. **Done-with-you funnel.** The lesson's "When You're Stuck" section points at a done-with-you setup offer for learners who'd rather pair on the first campaign. Pricing test: $200 / $350 / $500 across the first 3 inquiries; lock the closer.

## Non-Goals

- Merging sigil into cc4-site (different repo, different concern)
- Rewriting modules 0–2 to mention sigil (the capstone is bonus; modules 0–2 stay generic)
- A SaaS or hosted version of sigil (not in scope, ever — sigil is a CLI by design)
- A separate "sigil track" in the course (one lesson is enough until traffic justifies more)

## Deliverables

- [x] `src/content/modules/module-3/3.1-ship-with-sigil.mdx` — capstone lesson written, ~75 min hands-on, frontmatter matches existing schema (title, module: 3, lesson: 1, description, duration, objectives, order: 18)
- [ ] `module-3` registered in the navigation (verify it shows up in `/modules/`)
- [ ] Cross-link in sigil's README → this lesson URL (sigil-side change; outside this repo's scope but tracked here)
- [ ] Optional: update 2.6's "Course Complete" closer to mention the bonus capstone (author's call)
- [ ] Static "setup help" page or section linking to the done-with-you offer (author's call where it lives — homepage, `/services`, or off-site at mtri.me)
- [ ] `npm run build` passes after adding module-3

## Architecture Notes

The capstone lesson follows existing conventions exactly:

- File: `.mdx` in `src/content/modules/module-3/`
- Frontmatter: matches `src/content.config.ts` schema (`title`, `module`, `lesson`, `description`, `duration?`, `objectives?[]`, `order`)
- Voice: Planerio fictional client (consistent with module-2 lessons)
- Style: matches existing tutorial flow — Hook → Why → Prerequisites → Steps → Reflection → Stretch Goals → Takeaways
- Length: ~12KB markdown, in line with module-2 lessons (~9–12KB each)

No code changes to `src/`, `src/pages/`, or `src/components/` should be needed unless the modules listing page hard-codes `module-0`, `module-1`, `module-2`. Verify with `npm run build` + `/modules/` route.

## Risks

1. **Prerequisite gap.** The lesson assumes Cloudflare comfort (account, Workers, R2, KV). If a meaningful slice of cc4 learners can't get past Step 3, the funnel breaks. **Mitigation**: the lesson explicitly calls prerequisites up front and points at the done-with-you offer as the escape hatch — self-selection is a feature.
2. **Sigil version drift.** Sigil is at 0.1.0; future bumps could break the lesson's exact commands. **Mitigation**: the lesson references `sig --version` and the author keeps a "lesson pinned against sigil 0.1.0" note in `blacklogos/sigil/plans/cc4-marketing-integration.md`. Re-review after sigil major version bumps.
3. **Voice mismatch.** Sigil's templates are VN-first; cc4.marketing is English-first. **Mitigation**: the lesson uses English copy for the example values (Planerio CMO Roundtable) and surfaces the English template option (`BODY_TEMPLATE=templates/body.en.md`) explicitly in the stretch goals.
4. **Audience leakage to done-with-you.** Healthy thing; track inquiries.

## Implementation Plan

**Phase 1 — Author review & merge (this week)**

- [ ] Author reads `src/content/modules/module-3/3.1-ship-with-sigil.mdx`, edits for voice
- [ ] `npm run dev` — verify the lesson renders at `/modules/module-3/3.1-ship-with-sigil/`
- [ ] `npm run build` — verify no Astro / Zod schema errors
- [ ] Commit (`feat: add module 3 capstone — ship with sigil`)
- [ ] Push, let GitHub Actions deploy

**Phase 2 — Cross-link + announce (within 2 weeks of Phase 1)**

- [ ] Sigil README → add link to the deployed lesson URL
- [ ] Optional: update 2.6's closer to mention the bonus capstone
- [ ] Short post on cc4.marketing's existing channels announcing the capstone

**Phase 3 — Funnel & metrics (within 30 days)**

- [ ] Done-with-you setup offer surfaces somewhere durable (homepage, /services, off-site)
- [ ] Track: cc4 → sigil click-throughs (UTM param `?utm_source=cc4_capstone`)
- [ ] Track: setup-help inquiries (single inbox / Linear list)

## Success Metrics

- Capstone lesson published and renders ✓ (binary)
- ≥1 learner reaches Step 10 (real send) within 30 days of publication — survey via the existing course feedback channel
- ≥1 setup-help inquiry within 30 days (the only metric that pays rent)
- Sigil repo gains visible traffic in GitHub Insights → Traffic after the capstone goes live

## References

- Capstone lesson source: `src/content/modules/module-3/3.1-ship-with-sigil.mdx`
- Sigil repo: <https://github.com/blacklogos/sigil>
- Sigil's mirror of this plan (its view of the integration): `<sigil-repo>/plans/cc4-marketing-integration.md`
- Sigil's locked plan that shipped the v2 work this capstone teaches: `<sigil-repo>/plans/sigil-v2.md`

## Decisions (resolved 2026-05-17)

1. **2.6 closer**: update to point at module-3 capstone.
2. **Done-with-you page**: lives on cc4-site at a new `/services` route.
3. **Sigil version pin in frontmatter**: skip.
