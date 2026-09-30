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
// After a live delivery the reader joins the Resend audience (RESEND_AUDIENCE_ID). There is no
// server-side Substack step: the POST to Substack's /api/v1/free was redirected to the homepage and
// never created a subscriber (diagnostic log, 2026-09-30). The /download success state shows
// Substack's own embed instead, and a monthly GitHub issue guides the Resend -> Substack import
// (.github/workflows/monthly-substack-sync-reminder.yml).
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
type WaitUntil = (task: Promise<unknown>) => void;

// addToAudience never re-subscribes a contact that opted out.
async function joinAudience(email: string, env: Env) {
  const log = actionLogger('audience');
  try {
    const r = await addToAudience(env, email);
    log.log(r.added ? 'audience_added' : 'audience_skipped', { error: r.reason });
  } catch (err) {
    log.log('audience_failed', { error: errorCode(err) });
  }
}

// The audience signup runs only after a live delivery: a simulated answer carries `simulated`, and
// the honeypot also answers 200 { ok: true }, so it is screened again here. Returns the address
// to sign up, or null.
async function signupEmail(copy: Request, res: Response): Promise<string | null> {
  if (res.status !== 200) return null;
  const result = await res.clone().json().catch(() => null);
  if (!result?.ok || result.simulated) return null;
  const body = await readForm(copy);
  const email = normalizeEmail(body.email);
  return isBot(body) || !isEmail(email) ? null : email;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = await import('cloudflare:workers');
  const e = env as unknown as Env;
  // The handler consumes the body; the signup step reads the copy.
  const copy = request.clone();
  const res = await handler({ request, env: e });
  const email = await signupEmail(copy, res);
  if (email) {
    // joinAudience catches its own errors, so the task never rejects.
    const task = joinAudience(email, e);
    // @astrojs/cloudflare puts the Worker's ExecutionContext on locals.cfContext: the reply goes
    // out once the mail is sent and the signup finishes in the background. Without it, wait.
    const ctx = (locals as { cfContext?: { waitUntil?: WaitUntil } }).cfContext;
    if (ctx?.waitUntil) ctx.waitUntil(task);
    else await task;
  }
  return res;
};
