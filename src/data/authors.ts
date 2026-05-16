/**
 * Author data — single source of truth for /blog/authors and /blog/authors/[slug].
 * Content here drives the author hub grid, the detail page personality sections,
 * and the prompt library. Add new authors by appending to AUTHORS.
 */

export interface AuthorLink {
  substack?: string;
  github?: string;
  site?: string;
}

export interface AuthorTool {
  name: string;
  url?: string;
  why: string;
}

export interface AuthorNow {
  text: string;
  /** ISO date string, e.g. "2026-04-29" */
  updatedAt: string;
}

export interface AuthorCustomPrompt {
  label: string;
  prompt: string;
}

export interface Author {
  /** Display name. Slug is derived from this via slugifyAuthorName(). */
  name: string;
  /** Short title shown under the name. */
  role: string;
  /** Short bio used as the hub-card description and the meta-description fallback. */
  bio: string;
  /** Path to avatar PNG under /public. */
  avatar: string;
  /** Outbound social/web links (all optional). */
  links: AuthorLink;
  /**
   * Long-form first-person intro for the detail page.
   * Plain text. Paragraphs separated by `\n\n`. Falls back to `bio` if missing.
   */
  intro?: string;
  /** What the author is working on right now. Hidden if missing. */
  now?: AuthorNow;
  /** Daily-driver tools the author actually uses. Hidden if empty. */
  tools?: AuthorTool[];
  /** Topics the author writes about. Hand-curated chips. Hidden if empty. */
  topics?: string[];
  /** 0-2 author-written prompts. Templated prompts always render in addition. */
  customPrompts?: AuthorCustomPrompt[];
}

/**
 * Convert an author's display name to the URL slug used at /blog/authors/{slug}.
 * Lowercase, alphanumeric+hyphens, no leading/trailing hyphens.
 */
export function slugifyAuthorName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export const AUTHORS: Author[] = [
  {
    name: 'Tri Vo',
    role: 'Course Creator & Lead Writer',
    bio: 'Marketer turned AI workflow builder. Created CC4.Marketing to help non-technical marketers work 10x faster with Claude Code. Writes about practical AI marketing, campaign automation, and the future of human-AI collaboration in marketing teams.',
    avatar: '/authors/tri.png',
    links: {
      substack: 'https://cc4marketing.substack.com',
      github: 'https://github.com/cc4-marketing',
      site: 'https://cc4.marketing',
    },
    intro: `Hi, I'm Tri. I spent years as a marketer doing the boring parts of the job manually — pulling reports, rewriting briefs, chasing down assets — before I realized AI could absorb most of that work if I just learned how to talk to it properly.

CC4.Marketing came out of that realization. It's the course I wish someone had handed me on day one of using Claude Code: not a tour of features, but a working playbook for the actual jobs marketers do every week. Campaign briefs, content calendars, SEO audits, competitive analysis — turned into repeatable workflows you can hand to an AI and trust.

I write about what I'm building in public: tools like Threadmark and castmd, slash-command systems for shipping, and the moments when a workflow finally clicks and a four-hour task turns into ten minutes. The goal isn't to replace marketers. It's to take the busywork off the table so the strategy work gets the attention it deserves.

If something I've written is useful to you, the best thing you can do is steal it, remix it, and tell me how you bent it to your own job.`,
    now: {
      text: 'Shipping the v0.4 release of Threadmark, refining the /publish-post skill so blog posts go from markdown to live in one command, and writing up the patterns behind "the last mile of shipping" — the unglamorous final 20% that turns a working prototype into something a team can actually rely on.',
      updatedAt: '2026-04-29',
    },
    tools: [
      {
        name: 'Claude Code',
        url: 'https://claude.com/claude-code',
        why: 'Primary daily driver. Where every workflow starts.',
      },
      {
        name: 'Threadmark',
        url: 'https://github.com/blacklogos/threadmark',
        why: 'Strips Threads posts to clean Markdown so I can feed real conversations into AI without the noise.',
      },
      {
        name: 'Emdash',
        why: 'CMS that powers this blog. Edits in markdown, renders through PortableText, lives on Cloudflare D1.',
      },
      {
        name: 'Substack',
        url: 'https://cc4marketing.substack.com',
        why: 'Where the long-form thinking goes. RSS-friendly, no algorithm in the way.',
      },
      {
        name: 'Cloudflare Workers',
        url: 'https://workers.cloudflare.com',
        why: 'Runs the OG image engine, the changelog API, and the email subscribe endpoint. Cheap, fast, edge-native.',
      },
      {
        name: 'Beam Analytics',
        url: 'https://beamanalytics.io',
        why: 'Privacy-friendly pageview analytics. No cookies, no consent banner, no GA bloat.',
      },
    ],
    topics: [
      'Claude Code workflows',
      'Marketing automation',
      'AI for non-developers',
      'Slash commands',
      'Shipping practices',
      'Workflow extraction',
    ],
    customPrompts: [
      {
        label: 'Build a slash command from one of my posts',
        prompt: `Read this post by Tri Vo: {paste post URL or excerpt here}.

Identify the workflow he describes. Then turn it into a Claude Code slash command (a Markdown skill file with frontmatter, a Steps section, and any helper scripts). Match the level of specificity in the post — if he names tools or files, use those names; if he leaves room for the reader to fill in, leave the same room in the command. Output the full skill file ready to drop into .claude/skills/.`,
      },
      {
        label: 'Audit my marketing workflow Tri-style',
        prompt: `Pretend you're Tri Vo doing a 10-minute audit of my current marketing workflow. I'll describe what I do step by step. After I finish, give me:

1. The two highest-leverage steps to automate first (with the rationale).
2. One step that should NOT be automated and why.
3. A specific Claude Code prompt or slash command that would handle the highest-leverage step.

Be direct. No throat-clearing. If you'd skip something, say "skip" and move on.

My workflow: {describe here}`,
      },
    ],
  },
  {
    name: 'Alice Marketer',
    role: 'AI Marketing Strategist',
    bio: 'CC4.Marketing co-admin and resident AI strategist. Specializes in content strategy, SEO optimization, and building AI agent workflows for marketing teams. Focuses on bridging the gap between marketing strategy and AI execution.',
    avatar: '/authors/alice.png',
    links: {
      substack: 'https://cc4marketing.substack.com',
    },
    intro: `I'm Alice, and I think a lot about the gap between what marketing teams say they do and what they actually do.

Most "AI marketing strategy" content I read invents new frameworks. I'd rather look at what's already shipped — the campaigns that worked, the briefs that survived contact with stakeholders, the SEO audits that actually changed rankings — and extract the workflow hiding inside. AI is best at the work you've already proven; it's less good at the work you wish you did.

So most of my writing is reverse-engineering: take a real piece of work, identify the steps, identify which steps are pattern-matching (AI does well), which are judgment calls (humans should keep), and which are just admin overhead (AI should absorb entirely). The output is usually a prompt or a small workflow you can run tomorrow.

I'm interested in marketing teams that get smaller and ship more, not bigger and ship the same. If that's the direction you're heading, I think we're in the same conversation.`,
    now: {
      text: 'Drafting a series on extracting workflows from existing campaign briefs, testing whether question-form H2s actually move featured-snippet rankings, and helping Tri stress-test the new author-page prompts to make sure they hold up across the kinds of questions people actually ask AI.',
      updatedAt: '2026-04-29',
    },
    tools: [
      {
        name: 'Claude (web)',
        url: 'https://claude.ai',
        why: 'For long-context strategy work — pasting in entire campaign briefs and reasoning across them.',
      },
      {
        name: 'Claude Code',
        url: 'https://claude.com/claude-code',
        why: 'For anything that touches files: SEO audits, content calendars, PortableText conversions.',
      },
      {
        name: 'Search Console',
        url: 'https://search.google.com/search-console',
        why: 'Ground truth for what Google actually ranks vs. what I think it should rank.',
      },
      {
        name: 'Substack',
        url: 'https://cc4marketing.substack.com',
        why: 'Distribution + subscriber relationship in one. No algorithm middle layer.',
      },
      {
        name: 'Markdown + the filesystem',
        why: 'Everything I write lives in plain text files in a folder. AI tools can read it, version control tracks it, and nothing is locked behind a SaaS.',
      },
    ],
    topics: [
      'Workflow extraction',
      'Content strategy',
      'SEO and AEO',
      'Campaign briefs',
      'AI agent design',
      'Marketing team operations',
    ],
    customPrompts: [
      {
        label: 'Extract the workflow from a piece I shipped',
        prompt: `I'm going to paste a piece of marketing work I've already shipped (a campaign brief, an SEO audit, a content calendar, a launch plan).

Read it like Alice Marketer would: identify the underlying workflow. Output:

1. The 5-8 steps the work actually went through (not the steps I'd describe at a meeting — the real steps).
2. For each step, mark it as "pattern" (AI handles well), "judgment" (human keeps), or "admin" (AI absorbs entirely).
3. A single prompt or slash command that would let me re-run the "pattern" and "admin" steps next time.

The work I shipped:
{paste here}`,
      },
    ],
  },
];
