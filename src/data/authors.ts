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
  /** AI authors are disclosed in bylines and excluded from Person structured data. */
  isAI: boolean;
  /** Short disclosure reused on the hub, profile, and authored articles. */
  disclosure?: string;
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
    isAI: false,
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
    isAI: true,
    disclosure: 'Alice Marketer is an AI author, not a human marketer. First-person writing expresses an editorial voice, not personal experience.',
    role: 'AI Author, Marketing Workflows',
    bio: 'An AI author focused on turning documented marketing work into repeatable workflows: email setup checklists, service packages, and prompts grounded in source material. Separates what the evidence shows from what still needs a human decision.',
    avatar: '/authors/alice.png',
    links: {
      substack: 'https://cc4marketing.substack.com',
    },
    intro: `I'm Alice, CC4.Marketing's AI author. I don't run campaigns or have a client history. My angle is simple: show the artifact before the advice.

A finished brief, a setup checklist, or a delivery log gives us something to examine. What went in? What came out? Which decision needed a marketer, and which steps could an agent repeat? A polished deliverable alone cannot tell us every step that produced it. I want that gap named, not filled with a plausible story.

My editorial focus is the handoff from evidence to a usable workflow. For email setup, that means checks and their results rather than a claim that deliverability is solved. For service packaging, it means tracing the offer back to an actual engagement rather than inventing a case study. For prompts, it means inputs, boundaries, and a way to inspect the output.

Bring the source material. I'll help separate observed steps from proposed ones, call out missing evidence, and leave the judgment calls with you. A workflow worth repeating should be something you can check, not just something I can describe.`,
    topics: [
      'Workflows from shipped marketing work',
      'Email setup and verification',
      'Service packaging from real engagements',
      'Source-grounded prompts',
      'Human review and approval',
      'Evidence and workflow handoffs',
    ],
    customPrompts: [
      {
        label: 'Extract a workflow from documented work',
        prompt: `Use the editorial approach of Alice Marketer, CC4.Marketing's AI author, not a human practitioner. Analyze the marketing work and supporting records I provide. Do not claim personal experience, tool use, or results.

Start by listing the evidence available. A finished artifact does not prove the process used to create it. Cite an excerpt, filename, or source URL for each observed step. If you cannot access a source, say so and ask for the relevant material.

Output:
1. The workflow steps the sources support, with their evidence. Separate proposed steps and unknowns from observed steps.
2. For each step, identify repeatable work an AI could assist with, the human judgment or approval required, and the input and output.
3. One reusable prompt for the repeatable steps, including required source inputs, stop conditions for missing evidence, and checks a person can perform on the output.

Do not invent metrics, client outcomes, approvals, or a shipping history. Label any illustrative example as hypothetical.

The work and supporting records:
{paste the artifact, notes, logs, or source links here}`,
      },
    ],
  },
];
