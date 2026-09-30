import type { APIRoute } from 'astro';
import { bookDeliveryHandler } from 'site-kick/lib/book-delivery.js';
import { gatewayResolver } from 'site-kick/lib/guard-client.js';

// The course download mail (same free resource as /api/subscribe) on the site-kick book handler,
// guarded by the site-kick gateway over the GATEWAY Service binding. Only env.preview
// (cc4-mkt-preview) has that binding; production has none, so this route answers 503 there and
// sends nothing. No page posts here yet: /download still uses /api/subscribe.
export const prerender = false;

const course = {
  path: '/download',
  magnet: 'cc4-course',
  files: [{ label: 'Claude Code for Marketers (latest release)', url: 'https://github.com/cc4-marketing/cc4.marketing/releases/latest' }],
  mail: {
    subject: 'Your Claude Code for Marketers download link',
    intro: "Thanks for joining. Here's your course download link:",
    outro: ['Quick start: unzip the release, open a terminal in the folder, run claude, then type /start-0-0.'],
    signature: { name: 'CC4 Marketing', url: 'https://cc4.marketing' },
  },
  tag: 'course',
};

const handler = bookDeliveryHandler(course, { guard: gatewayResolver({ site: 'cc4' }) });

export const POST: APIRoute = async ({ request }) => {
  const { env } = await import('cloudflare:workers');
  return handler({ request, env: env as unknown as Record<string, unknown> });
};
