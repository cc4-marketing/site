/**
 * Builds the per-author prompt library shown on /blog/authors/[slug].
 *
 * Returns 2 templated prompts (always present) followed by the author's
 * custom prompts (0-2). Templates are interpolated with the author's name,
 * role, and topics so each rendering reads like it was written for that
 * specific author, even though the template is shared.
 */

import type { Author } from '../data/authors';
import { slugifyAuthorName } from '../data/authors';

export interface PromptCard {
  label: string;
  prompt: string;
}

function joinTopics(topics: string[] | undefined): string {
  if (!topics || topics.length === 0) return 'AI marketing and Claude Code workflows';
  if (topics.length === 1) return topics[0];
  if (topics.length === 2) return `${topics[0]} and ${topics[1]}`;
  return `${topics.slice(0, -1).join(', ')}, and ${topics[topics.length - 1]}`;
}

function buildLearnStylePrompt(author: Author): PromptCard {
  if (author.isAI) {
    return {
      label: `Write in ${author.name}'s voice`,
      prompt: `Write a short blog post (300-500 words) in the editorial voice of ${author.name}, an AI author at CC4.Marketing. State that identity explicitly. First person is a writing voice, not a claim to human experience.

Focus on ${joinTopics(author.topics)}. Be direct: show the artifact before the advice, explain the handoff, and name what a reader should check.

Use only the source material I provide or sources you can actually inspect. Cite the source for each factual example and outcome. Separate observed workflow steps from proposed ones. Do not invent shipped work, clients, metrics, tool use, personal experience, or human review. If evidence is missing or inaccessible, ask for it rather than fill the gap. Label hypothetical examples as hypothetical.

End with one practical next step and a way to check its output.

Topic: {your topic here}
Source material: {paste excerpts, files, or accessible source URLs here}`,
    };
  }

  return {
    label: `Write in ${author.name}'s voice`,
    prompt: `I want you to write in the voice of ${author.name}, ${author.role} at CC4.Marketing. Their writing tends to focus on ${joinTopics(author.topics)}.

Their voice is direct and pragmatic. They prefer concrete examples over abstract frameworks. They lead with what they actually shipped, not what they wish they did. They name specific tools, files, and steps instead of staying vague. They don't pad with throat-clearing.

I'll give you a topic. Draft a short blog post (300-500 words) on that topic in ${author.name}'s voice. Include at least one specific, named example. End with a single sentence that invites the reader to try the thing themselves.

Topic: {your topic here}`,
  };
}

function buildFindWorkPrompt(author: Author): PromptCard {
  return {
    label: `Find ${author.name}'s posts on a topic`,
    prompt: `I'm trying to figure out what ${author.name} (${author.role} at CC4.Marketing) has written that's relevant to a problem I'm working on.

${author.isAI ? `${author.name} is an AI author, not a human practitioner. ` : ''}Their main themes are: ${joinTopics(author.topics)}.

The CC4.Marketing blog index lives at https://cc4.marketing/blog/. ${author.name}'s author page lists all their posts: https://cc4.marketing/blog/authors/${slugifyAuthorName(author.name)}/.

My problem: {describe what you're trying to solve}

Look at ${author.name}'s posts and tell me:
1. Which 1-2 posts are most relevant to my problem.
2. The specific section or workflow in each post I should focus on.
3. One concrete next step I can take after reading them.${author.isAI ? '\n\nLink each recommendation to a post you actually inspected and cite the relevant section. Do not invent posts, workflow details, outcomes, or personal experience. If you cannot access the pages, say so and ask me to paste the posts before recommending them.' : ''}`,
  };
}

export function buildAuthorPrompts(author: Author): PromptCard[] {
  const prompts: PromptCard[] = [
    buildLearnStylePrompt(author),
    buildFindWorkPrompt(author),
  ];

  if (author.customPrompts && author.customPrompts.length > 0) {
    prompts.push(...author.customPrompts);
  }

  return prompts;
}
