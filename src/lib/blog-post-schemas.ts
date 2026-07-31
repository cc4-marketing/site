// JSON-LD builders for blog post pages, extracted from [slug].astro (plan U3)
// so the page stays data-plumbing + composition. Content unchanged.

export interface PostSchemaInput {
  slug: string;
  title: string;
  excerpt?: string;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
  ogImageUrl: string;
  authorName: string;
  authorUrl: string;
}

export function buildArticleSchema(p: PostSchemaInput): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': p.title,
    'description': p.excerpt || '',
    'datePublished': p.publishedAt?.toISOString(),
    'dateModified': p.updatedAt?.toISOString(),
    'url': `https://cc4.marketing/blog/${p.slug}/`,
    'image': p.ogImageUrl,
    'author': { '@type': 'Person', 'name': p.authorName, 'url': p.authorUrl },
    'publisher': {
      '@type': 'Organization',
      'name': 'CC4.Marketing',
      'url': 'https://cc4.marketing/',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://cc4.marketing/apple-touch-icon.png',
        'width': 180,
        'height': 180,
      },
    },
    'mainEntityOfPage': { '@type': 'WebPage', '@id': `https://cc4.marketing/blog/${p.slug}/` },
    'breadcrumb': {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://cc4.marketing/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': 'https://cc4.marketing/blog/' },
        { '@type': 'ListItem', 'position': 3, 'name': p.title },
      ],
    },
  };
}

// Top-level BreadcrumbList — Google reads this independent of the BlogPosting
// nesting and uses it to render breadcrumb trails in SERP.
export function buildBreadcrumbListSchema(slug: string, title: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://cc4.marketing/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': 'https://cc4.marketing/blog/' },
      { '@type': 'ListItem', 'position': 3, 'name': title, 'item': `https://cc4.marketing/blog/${slug}/` },
    ],
  };
}

// Per-post rich result schemas — FAQPage for informational guides, HowTo for
// step-by-step posts. Keyed by slug so future posts opt in without touching
// the template.
export const extraSchemas: Record<string, object> = {
  'claude-code-for-marketing-guide-2026': {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'What is Claude Code for marketing?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Claude Code is an AI-powered CLI tool from Anthropic that lets marketers automate workflows, generate copy, analyze campaigns, and build custom AI agents — all from a terminal interface. No coding experience required.',
        },
      },
      {
        '@type': 'Question',
        'name': 'Why are marketers switching to Claude Code?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Claude Code lets marketers work 10x faster on repetitive tasks like campaign briefs, competitive research, content strategy, and copy generation. Unlike chat interfaces, it reads your actual project files and remembers context across sessions.',
        },
      },
      {
        '@type': 'Question',
        'name': 'Which marketing workflows can I automate with Claude Code?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Common automations include campaign brief generation, content calendar planning, multi-channel copy creation, competitive analysis, SEO keyword research, and campaign performance reporting.',
        },
      },
      {
        '@type': 'Question',
        'name': 'How do I get started with Claude Code for marketing?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Install Claude Code from anthropic.com, authenticate with your Anthropic account, then start the free CC4.Marketing course by typing /start-0-0. The whole setup takes under 5 minutes.',
        },
      },
    ],
  },
  'write-campaign-brief-with-ai': {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': 'How to Write a Campaign Brief with AI in 10 Minutes',
    'description': 'Use Claude Code to generate a professional, multi-section campaign brief with strategic AI feedback in under 10 minutes.',
    'totalTime': 'PT10M',
    'step': [
      {
        '@type': 'HowToStep',
        'position': 1,
        'name': 'Define your campaign goal',
        'text': 'Open Claude Code and describe your campaign objective in plain language — what outcome you want, your timeline, and any constraints.',
      },
      {
        '@type': 'HowToStep',
        'position': 2,
        'name': 'Provide audience and product context',
        'text': 'Tell Claude who the target audience is, their key pain points, your product positioning, and any existing brand guidelines.',
      },
      {
        '@type': 'HowToStep',
        'position': 3,
        'name': 'Generate the structured brief',
        'text': 'Ask Claude to create a brief covering goals, audience definition, messaging hierarchy, channel strategy, and budget allocation.',
      },
      {
        '@type': 'HowToStep',
        'position': 4,
        'name': 'Run multi-perspective AI feedback',
        'text': 'Use custom reviewer sub-agents (brand voice, strategy, conversion) to identify gaps and inconsistencies before the brief is finalized.',
      },
      {
        '@type': 'HowToStep',
        'position': 5,
        'name': 'Refine and export',
        'text': 'Incorporate reviewer feedback, finalize the document, and export it for stakeholder review — typically under 10 minutes total.',
      },
    ],
  },
  'what-i-caught-before-a-coding-agent-sent-real-emails': {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Why does Gmail clip long HTML emails?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': "Usually because images are embedded as base64 data directly inside the HTML instead of sent as real attachments. That inflates the message size enough to trip Gmail's clipping threshold, cutting the email short and often failing to render the images at all. Sending images as real attachments, referenced by a cid: token in the HTML, avoids both problems.",
        },
      },
      {
        '@type': 'Question',
        'name': 'Can an AI coding agent actually send a real email campaign?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes — a coding agent like Claude Code can write and run a script that sends through a real email provider, including merge fields, attachments, and a full recipient list. The mechanics take an afternoon. The part that takes real judgment is the safety layer around it: previewing actual output before sending, testing to your own inbox first, and verifying personalization is correct rather than assuming a template is right because it compiles.',
        },
      },
      {
        '@type': 'Question',
        'name': 'How do you personalize emails safely at scale with an AI agent?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': "Treat merge-field isolation as something to verify, not assume — render at least two different recipients' versions and confirm one recipient's data never leaks into another's. For any personalization field you're missing data on, have the agent flag genuine uncertainty instead of guessing every row to look complete.",
        },
      },
      {
        '@type': 'Question',
        'name': 'Is a 100% email open rate a good sign?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Not necessarily, especially on B2B or enterprise recipient lists. Corporate email security systems commonly pre-fetch links and scan embedded images before a human ever opens the message, which can register as a false open or even a false click. A suspiciously perfect open rate is a reason to check the breakdown by domain, not a reason to report the number at face value.',
        },
      },
      {
        '@type': 'Question',
        'name': 'What causes garbled or mojibake text in an HTML email?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Almost always a missing character-encoding declaration. If the email\'s HTML has no <meta charset="utf-8"> in a <head> tag, some email clients guess the encoding and guess wrong — non-ASCII text renders as garbled symbols even though the underlying text was correct UTF-8 the whole time. Adding that one meta tag fixes it.',
        },
      },
    ],
  },
};
