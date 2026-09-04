# PREVIEW: Issue #1 (not sent, for review)

Send meta
- Subject: This newsletter is built by the workflows it teaches
- Preheader/dek: One markdown file, one command, one preview gate. Receipts inside.
- Audience: full Resend list (after phase 02 backfill lands; hold if backfill not done)
- Send: Tuesday 9:00 AM ET / 8:00 PM VN
- Mirror: publish as blog post same day ("Read online" target)
- Placeholders marked [link: ...] need real URLs before HTML build

---

September 9, 2026 | Read online

# This newsletter is built by the workflows it teaches

One markdown file, one command, one preview gate. Receipts inside.

Hey Vibe Marketer,

Before this issue reached you, nobody opened an email tool.

It started as a markdown file in the same repo that runs cc4.marketing. A slash command turned it into HTML, ran a dry-run against the list, and stopped at a preview gate until a human said send. That gate is not optional. We built it after nearly emailing a test batch to real people.

The course this newsletter promotes is the same system that produces it. That is the whole pitch, so let's show the receipts.

## The publishing stack behind this email

| Step | What runs | Human involvement |
|---|---|---|
| Draft | Markdown in the site repo | Writes it |
| Build | Template wraps it into the HTML you are reading | None |
| Safety | Dry-run + rendered preview, send blocked until confirmed | Approves once |
| Send | Resend campaign, one command | None |
| Archive | Same markdown ships to the blog as the web version | None |

Draft → build → preview → send → archive. One reviewed command per step, no tab-hopping, no copy-paste between tools.

Steal this: your publishing flow should be one command with one approval gate. If it takes an afternoon, the afternoon is the bug.

## The bug that ate a third of our signups

Honest receipts cut both ways, so here is an ugly one.

Last week's audit: 418 subscribers in our own database, 667 on Substack, only 280 on both. 130 people signed up on the site and never reached the newsletter list at all.

Root cause was one line. After the signup API call finished, the page tried to open Substack in a new tab. By then the browser no longer treated it as a user click, so popup blockers killed it silently. Safari by default, most mobile browsers, no error anywhere. Whether you got subscribed depended on your browser settings.

The fix: the server owns the write now.

Before: signup → API → email sent → browser popup (maybe) → Substack (maybe)
After: signup → API → email sent + list write + Substack write, no browser involved

Plus a regression test that encodes one rule: a broken third-party service must never cost a signup.

Steal this: when two systems hold the same list, diff them. A number that looks healthy on its own (418!) can hide a 30% leak. One command, two exports, one comparison. We found this with the same Claude Code workflow taught in Module 2.

## Shipped on cc4 this month

Donation card with VietQR so Vietnamese readers can support the free course in two taps. Sitemap footer with cross-links. The subscriber fix above. Full history lives on the changelog.

## Wrapping up

Every tool vendor says "we use our own product." The honest version is showing the bug you shipped, the number it cost you, and the diff that fixed it. That is what this newsletter will do every week: real workflows from a real site, with the receipts attached, teachable in the free course.

See you next Tuesday.

## Worth your tab space

1. start the free course in one command: /start-0-0 → [link: cc4.marketing/download]
2. what shipped, dated and honest → [link: cc4.marketing/changelog]
3. the lesson behind this week's diff workflow → [link: module 2 lesson]
4. how we built a designed PDF book with one skill → [link: book-publisher blog post]
5. the case study: merging a 3-channel campaign into one repo → [link: merge-campaign post]

## Keep building

Wanna learn the workflows? → Start the free course
Wanna see what shipped this week? → Changelog
Built something with the course? → Reply. Best builds get featured next issue.
Wanna keep the course free? → Buy us a coffee

Got feedback? Just hit reply. I read every message.
Know a marketer figuring out Claude Code? Share this with them.

How was this issue?
[ Shipped it ] [ Skimmed it ] [ Skip next time ]
