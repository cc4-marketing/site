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
// After a live delivery the reader joins the Resend audience (RESEND_AUDIENCE_ID) and Substack,
// as /api/subscribe did.
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

const SUBSCRIBE_URL = 'https://cc4marketing.substack.com/api/v1/free?nojs=true';

// Same request /api/subscribe made. Never retried (scripts/check-subscriber-sync.mjs reconciles);
// a failure is logged as a status code only, never the address or the response body.
async function joinSubstack(email: string) {
  const log = actionLogger('substack');
  try {
    const r = await fetch(SUBSCRIBE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // The endpoint rejects requests without a browser-like agent.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
      body: new URLSearchParams({ email, source: 'subscribe_page' }),
    });
    if (!r.ok) log.log('substack_failed', { status: r.status, error: `provider_${r.status}` });
    await logSubstackResponse(r, email);
  } catch (err) {
    log.log('substack_failed', { error: errorCode(err) });
  }
}

// TEMPORARY diagnostic (2026-09-30): a 2xx from Substack did not add the subscriber. Log what the
// endpoint actually answers: status, content type, final URL and the first 200 characters of the
// body with the address removed. Remove once the Substack path is decided.
async function logSubstackResponse(r: Response, email: string) {
  const body = await r.text().catch(() => '');
  const snippet = body
    .split(email).join('<email>')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '<email>')
    .replace(/\s+/g, ' ')
    .slice(0, 200);
  console.log(JSON.stringify({ action: 'substack', state: 'substack_response', status: r.status,
    type: r.headers.get('content-type'), url: r.url, redirected: r.redirected, snippet }));
}

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

// The list signups run only after a live delivery: a simulated answer carries `simulated`, and
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
    // Each step catches its own errors, so the task never rejects.
    const task = Promise.all([joinAudience(email, e), joinSubstack(email)]);
    // @astrojs/cloudflare puts the Worker's ExecutionContext on locals.cfContext: the reply goes
    // out once the mail is sent and the signups finish in the background. Without it, wait.
    const ctx = (locals as { cfContext?: { waitUntil?: WaitUntil } }).cfContext;
    if (ctx?.waitUntil) ctx.waitUntil(task);
    else await task;
  }
  return res;
};
