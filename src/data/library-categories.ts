/**
 * Marketing Library category tree. Single source of truth for the hub cards,
 * the category sidebar, and the sitemap. Order here is the display order.
 * `blurb` is a one sentence card description. `intro` is the longer, keyword
 * targeted paragraph shown at the top of each category page.
 */

export type LibraryCategorySlug =
  | 'seo'
  | 'content'
  | 'paid-ads'
  | 'analytics'
  | 'email'
  | 'social'
  | 'reporting'
  | 'competitive'
  | 'project-ops';

export interface LibraryCategory {
  slug: LibraryCategorySlug;
  label: string;
  blurb: string;
  intro: string;
}

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  {
    slug: 'seo',
    label: 'SEO',
    blurb: 'Keyword research, content briefs, and SERP intent prompts that help your pages rank.',
    intro:
      'The SEO section collects prompts and slash commands for the parts of search work that repeat every week: keyword research, search intent classification, content briefs, and title and meta description writing. Each entry is a real, copyable artifact you paste into Claude Code and run against your own keywords, so you skip the blank page and start from a structured draft. Marketers use these to build content briefs that developers and writers can follow, to sort a raw keyword list by informational, commercial, transactional, or navigational intent, and to produce SERP length checked titles and descriptions that fit Google without truncation. Every prompt here is free and ungated. Read the artifact, copy it into your project, and adapt the variables to your niche. If you run SEO for a site or a set of clients, these are the pieces you would otherwise rewrite by hand each time a new keyword lands on your plate.',
  },
  {
    slug: 'content',
    label: 'Content & Copy',
    blurb: 'Copywriting workflows that turn one idea into outlines, drafts, and on brand copy.',
    intro:
      'The Content and Copy section holds workflows for turning a single idea into finished marketing writing: blog outlines, brand voice rules that persist across a project, and repurposing that spins one post into social ready copy. Each entry is a real prompt or command you can drop into Claude Code and run today. Marketers reach for these to draft an H2 and H3 outline from a target keyword, to enforce a consistent tone across everything an AI writes for a brand, and to turn one long form post into a LinkedIn post, an X thread, and an Instagram carousel without starting from scratch. The point is not to hand your voice to a machine. The point is to remove the mechanical parts, outlining, reformatting, first drafts, so the judgment work gets your attention. Everything here is free and copyable. Take the artifact, wire in your own brand details, and reuse it on every piece you ship.',
  },
  {
    slug: 'paid-ads',
    label: 'Ads & Paid',
    blurb: 'Ad copy helpers that spin up headline and primary text variants fast.',
    intro:
      'The Ads and Paid section is for the copy side of paid media: headline variants, primary text options, and the angle testing that feeds a healthy ad account. Each entry is a real command you paste into Claude Code and run against one offer. Marketers use these to generate ten distinct headline and primary text variants in a single pass, each tagged with the angle it plays (pain, proof, curiosity, urgency, and so on), so a test has real variety instead of ten rewordings of the same line. Good paid performance comes from volume of distinct angles, and writing that volume by hand burns hours. These artifacts get you a labeled batch you can drop straight into your ad platform and start testing. Everything here is free and ungated. Copy the command, swap in your product, audience, and offer, and keep it as a repeatable step in your campaign launch checklist.',
  },
  {
    slug: 'analytics',
    label: 'Analytics & Data',
    blurb: 'Prompts that translate plain English questions into GA4 steps and clear answers.',
    intro:
      'The Analytics and Data section turns the gap between a question and a report into something you can cross in one prompt. Each entry is a real artifact for Claude Code that takes a plain English analytics question and returns the exact steps to answer it. Marketers use these to translate a question like which channels drove the most signups last month into a concrete GA4 exploration: the dimensions to pick, the metrics to add, the filters to set, and the segment to compare against. Instead of guessing which report holds the answer, you get a build sheet you can follow inside GA4. This matters most for teams without a dedicated analyst, where the person asking the question is also the person who has to find it. Everything here is free and copyable. Paste the prompt, describe the question in your own words, and get the steps that lead to the number.',
  },
  {
    slug: 'email',
    label: 'Email & Lifecycle',
    blurb: 'Commands that draft newsletters, subject lines, and lifecycle copy from a source.',
    intro:
      'The Email and Lifecycle section covers the drafting work behind newsletters and lifecycle messages: turning a source into a section, writing subject lines, and shaping a clear call to action. Each entry is a real command you run inside Claude Code. Marketers use these to summarize a link or article into a newsletter section that keeps your voice, complete with a subject line and a single CTA, so a weekly send stops eating an afternoon. The artifacts assume you still make the editorial calls, what to feature, what to cut, and handle the mechanical part of shaping raw material into a section that reads well. Everything in this section is free and ungated. Copy the command, point it at the URL or notes you are working from, and get a draft you can edit down rather than a blank compose window. Keep the command in your project and it becomes a fixed step in your newsletter routine.',
  },
  {
    slug: 'social',
    label: 'Social & Community',
    blurb: 'Prompts that draft posts, threads, and captions from rough notes.',
    intro:
      'The Social and Community section is for turning rough thinking into posts worth publishing. Each entry is a real command or prompt for Claude Code that takes bullet notes or a raw idea and returns a drafted post with a hook and a call to action. Marketers use these to draft a LinkedIn post from a few messy lines, keeping the specifics that make a post credible while adding an opening that earns the click and a close that asks for something. The aim is to shorten the distance between having a thought and shipping it, without flattening your voice into generic social filler. These work best when you feed them real detail: a number, a moment, a specific opinion. Everything here is free and copyable. Paste the command, drop in your notes, and edit the draft to sound like you. Save it in your project so posting becomes a habit instead of a chore you avoid.',
  },
  {
    slug: 'reporting',
    label: 'Reporting & Dashboards',
    blurb: 'Commands that turn raw metrics into weekly readouts and stakeholder summaries.',
    intro:
      'The Reporting and Dashboards section handles the translation from numbers to narrative. Each entry is a real prompt for Claude Code that takes a metrics export and returns a plain language readout: what moved, by how much, and what is worth a second look. Marketers use these to turn a weekly metrics CSV into a summary a stakeholder can read in a minute, with the week over week deltas called out and the noteworthy changes flagged instead of buried in a grid of numbers. The artifacts do the reading and framing so you spend your time on the decisions the numbers point to, not on assembling the recap. This is the unglamorous work that eats Monday mornings, and it is exactly the kind of pattern an AI handles well once you give it the structure. Everything here is free and ungated. Copy the prompt, paste your metrics, and get a readout you can send with light edits.',
  },
  {
    slug: 'competitive',
    label: 'Competitive Research',
    blurb: 'Prompts that tear down rival pages, offers, and positioning.',
    intro:
      'The Competitive Research section is for looking hard at what other companies ship. Each entry is a real prompt for Claude Code that takes one competitor page and returns a structured teardown: their positioning, the offer, the proof they lean on, the calls to action, and the gaps you could exploit. Marketers use these to analyze a rival landing page without staring at it for an hour, getting a consistent breakdown they can compare across several competitors. The output gives you a repeatable lens, so five teardowns line up on the same dimensions instead of drifting into five different write ups. This is research that informs your own positioning, messaging tests, and offer design. Everything in this section is free and copyable. Paste the prompt, drop in the page content or URL, and get a teardown you can act on. Run it across a set of competitors and patterns start to show, which is where the real strategy work begins.',
  },
  {
    slug: 'project-ops',
    label: 'Project & Ops',
    blurb: 'Commands that scaffold calendars, briefs, and repeatable marketing systems.',
    intro:
      'The Project and Ops section covers the scaffolding that keeps marketing work organized: content calendars, briefs, and the repeatable structures a team runs on. Each entry is a real command for Claude Code that builds one of these from a short description. Marketers use these to scaffold a ninety day rolling content calendar, with themes, cadence, and slots laid out, so planning starts from a real structure instead of an empty spreadsheet. The artifacts handle the setup, the parts that are the same every quarter, so you spend your time on the choices that actually differ. This is operations work: not glamorous, but the difference between a plan that ships and a plan that stays in someone head. Everything here is free and ungated. Copy the command, describe your situation, cadence, channels, goals, and get a scaffold you can fill in and run. Keep it in your project and reuse it every planning cycle.',
  },
];

export function getCategory(slug: string): LibraryCategory | undefined {
  return LIBRARY_CATEGORIES.find((c) => c.slug === slug);
}

/** Human label for an entry type badge. */
export const TYPE_LABELS: Record<string, string> = {
  prompt: 'Prompt',
  command: 'Slash Command',
  subagent: 'Subagent',
  mcp: 'MCP Server',
  skill: 'Skill',
};
