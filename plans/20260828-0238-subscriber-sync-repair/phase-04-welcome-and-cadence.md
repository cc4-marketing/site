# Phase 04: Welcome email, then cadence

Plumbing is fixed by here. This phase is about the list being worth arriving to.

## Step 1: Welcome for Substack-native signups

51 subscribers have received zero emails. They signed up after the last broadcast and nothing greeted them. Web signups get the Resend download email, so this gap only affects people who came through Substack directly, which was 387 of 667 historically.

Substack, Settings, Welcome email. Turn it on, write it once.

Contents worth having, in order: what this is, the one thing to do first (download and run `/start-0-0`, same as the Resend email), when to expect the next issue, and where the archive is. Keep it to a screen.

This is a settings change, not code. It also removes the recurring "received 0 emails" category permanently, so it is the highest ratio of effect to effort in the whole plan.

## Step 2: Reconcile the two welcome emails

There are now two first-touch emails: Resend's download email for web signups, Substack's welcome for the rest. A web signup after Phase 01 triggers both.

Two emails within a minute of each other, saying overlapping things, is worse than one. Pick a split and make each email own its half:

- Resend download email: the download link, the quick start, nothing about the newsletter.
- Substack welcome: what the newsletter is, cadence, archive, nothing about downloading.

Both already exist as drafts in effect, `subscribe.ts:39-67` holds the Resend email body. Edit that down rather than adding a third email.

## Step 3: Cadence

The data, from the audit:

| cohort | avg sent | open per send | clickers |
|---|---|---|---|
| Jan | 5.9 | 72% | 6/55 |
| Feb | 5.9 | 66% | 8/84 |
| Mar | 5.2 | 58% | 27/171 |
| Apr | 3.4 | 51% | 7/89 |
| May | 2.0 | 52% | 10/105 |
| Jun | 2.0 | 50% | 4/58 |
| Jul | 1.5 | 38% | 1/52 |

Six sends in six months, and last-open timestamps show the hole: Mar 12, Apr 69, May 4, Jun 0, Jul 149, Aug 130. May and June had no send. Jan subscribers still open at 72%, July subscribers at 38%. Newer cohorts are not worse people, they are worse onboarded and less often reminded the list exists.

Pick a rhythm that survives a busy month and publish it in the welcome email so it is a promise. Monthly, reliably, beats weekly for three weeks and then silence. Then hold it for three months before judging any of these numbers again.

## Step 4: The click problem, named but not solved here

69 of 665 have ever clicked a link, and total post views across the entire list are 224. The newsletter is not sending anyone to the site.

That is a content and CTA problem, not a plumbing one, and it needs its own decision rather than a step in this plan. Flagging it so it does not get lost: after three months of steady cadence, if clickers stay near 10%, the issue is what the emails ask people to do.

## Step 5: What not to do yet

Do not suppress the 94 dead addresses (5+ sends, 0 opens) as part of this phase.

Pruning during a send drought measures the drought, not the subscribers. Some of those 94 got their five emails in a bunch during a period when the list was erratic. Restore cadence first, give them three real sends, then re-measure and suppress what is still cold. Reputation is not currently at risk: 4 addresses with drops, and no bounce problem in the export.

## Acceptance

- Substack welcome email is live, verified by signing up with a fresh address and receiving exactly two emails with no content overlap.
- "Received 0 emails" goes to 0 on the next export, except addresses that signed up within minutes of the export.
- A stated cadence exists in writing, in the welcome email.
