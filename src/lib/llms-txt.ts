import { buildLlmsTxt } from 'site-kick/lib/agent-markdown.js';

const SITE = 'https://cc4.marketing';

export interface LlmsPost { slug: string; title: string; publishedAt?: Date | null }
export interface LlmsLesson { id: string; data: { module: number; lesson: number; title: string; order: number } }
export interface LlmsLibraryEntry { id: string; data: { category: string; name: string } }

// Same slug rule as src/pages/modules/[...slug].astro: drop the "<L>.<n>" prefix of the file name.
const lessonPath = (e: LlmsLesson) =>
  `/modules/${e.data.module}/${e.id.split('/').pop()?.replace('.mdx', '').split('-').slice(1).join('-')}/`;
const entryPath = (e: LlmsLibraryEntry) => `/library/${e.data.category}/${e.id.split('/').pop()}/`;

/** /llms.txt: prose sections stay hand-written; post, lesson and library links come from real data. */
export function buildCc4LlmsTxt(input: { posts: LlmsPost[]; lessons: LlmsLesson[]; entries: LlmsLibraryEntry[] }): string {
  const posts = input.posts
    .toSorted((a, b) => (a.publishedAt?.getTime() ?? 0) - (b.publishedAt?.getTime() ?? 0))
    .map((p) => ({ title: p.title, url: `${SITE}/blog/${p.slug}/` }));
  const lessons = input.lessons
    .toSorted((a, b) => a.data.order - b.data.order)
    .map((e) => ({ title: `${e.data.module}.${e.data.lesson} ${e.data.title}`, url: SITE + lessonPath(e) }));
  const entries = input.entries
    .map((e) => ({ title: e.data.name, path: entryPath(e) }))
    .toSorted((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map((e) => ({ title: e.title, url: SITE + e.path }));

  return buildLlmsTxt({
    title: 'CC4.Marketing — Claude Code for Marketers',
    summary:
      'A free, interactive course teaching marketers how to use Claude Code to work 10x faster. 4 modules, 20 lessons, taught entirely inside Claude Code itself.',
    sections: [
      { title: 'About', body: ABOUT },
      { title: 'Site Structure', body: SITE_STRUCTURE },
      { title: 'Blog', body: BLOG },
      { title: 'Published Posts', level: 3, links: posts },
      { title: 'Course Modules', body: COURSE_MODULES },
      { title: 'All Lessons', level: 3, links: lessons },
      { title: 'Marketing Library', body: LIBRARY },
      { title: 'Library Entries', level: 3, links: entries },
      { title: 'Free Tools', body: FREE_TOOLS },
      { title: 'Changelog API', body: CHANGELOG_API },
      { title: 'For AI Agents and Students', body: FOR_AGENTS },
      { title: 'Source Code', body: SOURCE_CODE },
      { title: 'Contact', body: CONTACT },
    ],
  });
}

const ABOUT = `CC4.Marketing is an open-source course that teaches AI-powered marketing workflows. Students install Claude Code, clone a starter project, then type /start-0-0 to begin interactive lessons. The practice project simulates working as a Marketing Strategist at "Markit" agency, running campaigns for a B2B SaaS client called "Planerio."`;

const SITE_STRUCTURE = `- Homepage: https://cc4.marketing/
- Blog: https://cc4.marketing/blog/
- Blog Authors hub: https://cc4.marketing/blog/authors/
- Author detail pages: https://cc4.marketing/blog/authors/{slug}/ (e.g. /tri-vo/, /alice-marketer/)
- Course Modules hub: https://cc4.marketing/modules/
- Course Lessons: https://cc4.marketing/modules/{module}/{lesson-slug}/
- FAQ & Pricing: https://cc4.marketing/faq/
- Changelog: https://cc4.marketing/changelog/
- Download/Subscribe: https://cc4.marketing/download/
- Brand Guidelines: https://cc4.marketing/brand-guide/`;

const BLOG = `The blog publishes practical guides, tutorials, and insights on AI-powered marketing with Claude Code. Content is SEO-focused and distinct from the Substack newsletter (which covers announcements and community updates).`;

const COURSE_MODULES = `- Module 0: Getting Started (4 lessons, 30 min) — Installation, setup, first task
- Module 1: Core Concepts (7 lessons, 3-4 hours) — Agents, sub-agents, project memory, marketing workflows
- Module 2: Advanced Applications (7 lessons, 4-5 hours) — Campaign briefs, content strategy, copy, analytics, SEO, service packaging
- Module 3: Capstone (2 lessons, 135 min) — Lesson 3.1: Send Merge Campaigns at Scale, Safely — bulk, structured personalization with a full safe-send protocol, using a free Resend account and an open starter kit (https://github.com/blacklogos/campaign-merge-kit). Lesson 3.2: Ship a Real Follow-Up with sigil, an open-source CLI inside Claude Code (https://github.com/blacklogos/sigil) — real send pipeline on Cloudflare Workers, custom \`/email-rewrite\` slash command, per-recipient handcrafted sentences for VIP-size sends.`;

const LIBRARY = `The Marketing Library is a curated directory of free Claude Code prompts, slash commands, subagents, and MCP lists for marketers. Every entry is a real, copyable artifact organized into 9 categories.

- Library hub: https://cc4.marketing/library/
- SEO (https://cc4.marketing/library/seo/): keyword research, content briefs, and SERP intent prompts
- Content & Copy (https://cc4.marketing/library/content/): outlines, brand voice, and repurposing workflows
- Ads & Paid (https://cc4.marketing/library/paid-ads/): headline and primary text variant helpers
- Analytics & Data (https://cc4.marketing/library/analytics/): plain English questions into GA4 steps
- Email & Lifecycle (https://cc4.marketing/library/email/): newsletter, subject line, and lifecycle copy
- Social & Community (https://cc4.marketing/library/social/): posts, threads, and captions from notes
- Reporting & Dashboards (https://cc4.marketing/library/reporting/): metrics into weekly readouts
- Competitive Research (https://cc4.marketing/library/competitive/): teardowns of rival pages and offers
- Project & Ops (https://cc4.marketing/library/project-ops/): calendars, briefs, and repeatable systems`;

const FREE_TOOLS = `Open-source tools published by CC4.Marketing. Each has its own llms.txt with a full FAQ.

- [Book Publisher](https://bookpublisher.cc4.marketing/): Builds designed PDF and EPUB books from one Markdown file. Four real themes, cover pages, sidenotes, print-ready pagination. An agent skill, free and offline. ([llms.txt](https://bookpublisher.cc4.marketing/llms.txt))
- [castmd](https://castmd.cc4.marketing/): Chrome extension that converts any webpage to clean Markdown for LLM workflows. One click → clipboard-ready MD, JSON, or Claude XML. Token-aware. Free and open source. ([llms.txt](https://castmd.cc4.marketing/llms.txt))
- [Threadmark](https://threadmark.cc4.marketing/): Threadmark is a free Chrome extension that extracts Threads.com posts into clean Markdown, HTML, or plain text — AI-ready in one click. No server, no account. 100% local. ([llms.txt](https://threadmark.cc4.marketing/llms.txt))
- [MacMerge](https://macmerge.cc4.marketing/): MacMerge sends personalized outreach emails from your Mac. On-device AI personalization, CSV import, open & click tracking. Native, private, no Mailchimp overhead. ([llms.txt](https://macmerge.cc4.marketing/llms.txt))
- [sigil](https://sigil.cc4.marketing/): A tiny open-source CLI that sends one truly personalized email per recipient — with a signed PDF link, click tracking, and a Claude Code slash command that drafts the per-row sentence. VIP-list size, not bulk. ([llms.txt](https://sigil.cc4.marketing/llms.txt))
- [Clip](https://clip.cc4.marketing/): A macOS menu bar app + CLI for content creators: read and annotate Markdown with AI-ready comment export, diff two texts side by side, style Unicode for social (Vietnamese-aware), manage assets — zero dependencies. ([llms.txt](https://clip.cc4.marketing/llms.txt))
- [batch-qr](https://qr.cc4.marketing/): Free batch QR code generator. Paste URLs, generate bulk QR codes with labels, download as PNG/JPG or ZIP. No signup, no watermarks, 100% client-side. Open source. ([llms.txt](https://qr.cc4.marketing/llms.txt))
- [Offline Notes](https://notes.cc4.marketing/): Save articles, highlight useful text, and keep your notes in Chrome. Read offline and export Markdown. Try the free Offline Notes tester build. ([llms.txt](https://notes.cc4.marketing/llms.txt))`;

const CHANGELOG_API = `The changelog tracks all course and site updates. Each entry includes a \`machine_summary\` field optimized for agent consumption.

- JSON API: https://cc4-changelog.mtri-vo.workers.dev/api/changelog
- JSON Feed (v1.1): https://cc4-changelog.mtri-vo.workers.dev/feed.json
- RSS Feed (2.0): https://cc4-changelog.mtri-vo.workers.dev/rss.xml

Entry schema: { id, slug, title, summary, machine_summary, type (new|improvement|fix|breaking), version, modules[], published_at }`;

const FOR_AGENTS = `- Students can type \`/whats-new\` inside Claude Code to see latest updates
- \`/whats-new course\` filters to course-only updates, \`/whats-new site\` for website updates
- Entries are sorted newest-first
- The \`machine_summary\` field provides concise, structured descriptions for programmatic consumption
- The \`modules\` array maps entries to course modules (e.g., "module-1", "course", "homepage")
- Entry \`type\` indicates severity: breaking > new > improvement > fix
- Full course details available at: https://cc4.marketing/llms-full.txt`;

const SOURCE_CODE = `- Site repo: https://github.com/cc4-marketing/cc4.marketing
- License: MIT`;

const CONTACT = `- Newsletter: https://cc4marketing.substack.com`;
