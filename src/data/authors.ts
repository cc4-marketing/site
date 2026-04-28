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
  },
  {
    name: 'Alice Marketer',
    role: 'AI Marketing Strategist',
    bio: 'CC4.Marketing co-admin and resident AI strategist. Specializes in content strategy, SEO optimization, and building AI agent workflows for marketing teams. Focuses on bridging the gap between marketing strategy and AI execution.',
    avatar: '/authors/alice.png',
    links: {
      substack: 'https://cc4marketing.substack.com',
    },
  },
];
