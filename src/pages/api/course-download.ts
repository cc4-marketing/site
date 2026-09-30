import type { APIRoute } from 'astro';
import { actionLogger, errorCode } from 'site-kick/lib/action-log.js';
import { bookDeliveryHandler } from 'site-kick/lib/book-delivery.js';
import { isBot, isEmail, normalizeEmail, readForm } from 'site-kick/lib/form-request.js';
import { gatewayResolver } from 'site-kick/lib/guard-client.js';
import { addToAudience } from 'site-kick/lib/mail-transport.js';

// The /download form posts here (it used /api/subscribe until 2026-09-30). The course download
// mail runs on the site-kick book handler, guarded by the site-kick gateway over the GATEWAY
// Service binding: journal, per-recipient quota, site budget, idempotency, owner lead record.
// Only cc4.marketing with MAIL_MODE=live sends; workers.dev and localhost simulate (log mode).
// After a live delivery the reader joins the Resend audience (RESEND_AUDIENCE_ID), as /api/subscribe did.
export const prerender = false;

const RELEASE_URL = 'https://github.com/cc4-marketing/cc4.marketing/releases/latest';

// Copy carried over from the /api/subscribe mail (same subject, link and quick start).
export const course = {
  path: '/download',
  magnet: 'cc4-course',
  files: [{ label: 'Download the Course', url: RELEASE_URL }],
  mail: {
    subject: 'Your Claude Code for Marketers download link',
    greeting: 'Welcome to CC4 Marketing!',
    intro: "Thanks for joining. Here's your course download link:",
    outro: [
      'Quick start:',
      '1. Download the latest release from the link above',
      '2. Unzip and open a terminal in the folder',
      '3. Run claude, then type /start-0-0',
      "You're receiving this because you signed up at cc4.marketing.",
    ],
    signature: { name: 'CC4 Marketing', url: 'https://cc4.marketing' },
  },
  tag: 'course',
};

const handler = bookDeliveryHandler(course, { guard: gatewayResolver({ site: 'cc4' }) });

type Env = Record<string, string | undefined>;

// Joins the audience only after a live delivery: a simulated answer carries `simulated`, and the
// honeypot also answers 200 { ok: true }, so it is screened again here. addToAudience never
// re-subscribes a contact that opted out. Nothing here changes the answer the reader gets.
async function joinAudience(copy: Request, res: Response, env: Env) {
  if (res.status !== 200) return;
  const result = await res.clone().json().catch(() => null);
  if (!result?.ok || result.simulated) return;
  const body = await readForm(copy);
  const email = normalizeEmail(body.email);
  if (isBot(body) || !isEmail(email)) return;
  const log = actionLogger('audience');
  try {
    const r = await addToAudience(env, email);
    log.log(r.added ? 'audience_added' : 'audience_skipped', { error: r.reason });
  } catch (err) {
    log.log('audience_failed', { error: errorCode(err) });
  }
}

export const POST: APIRoute = async ({ request }) => {
  const { env } = await import('cloudflare:workers');
  const e = env as unknown as Env;
  // The handler consumes the body; the audience step reads the copy.
  const copy = request.clone();
  const res = await handler({ request, env: e });
  await joinAudience(copy, res, e);
  return res;
};
