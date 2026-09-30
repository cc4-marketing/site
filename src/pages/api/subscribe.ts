import type { APIRoute } from 'astro';

declare global {
  namespace Cloudflare {
    interface Env {
      SUBSCRIBE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
      RESEND_API_KEY?: string;
      RESEND_AUDIENCE_ID?: string;
    }
  }
}

export const prerender = false;

// The /download form moved to /api/course-download on 2026-09-30. This route stays for old
// cached pages and any other caller until its traffic is gone.

// Only our own pages call this endpoint. Never reflect the caller's Origin:
// that let any site drive signups (and our Resend quota) from a browser.
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://cc4.marketing',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  Vary: 'Origin',
};

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: 'Origin not allowed' }, { status: 403, headers: corsHeaders });
  }

  // Require JSON. A text/plain POST skips the CORS preflight, so without this
  // any web page could fire signups cross-site with a plain <form>.
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return Response.json({ error: 'Content-Type must be application/json' }, { status: 415, headers: corsHeaders });
  }

  try {
    const { env } = await import('cloudflare:workers');

    // Fail closed: a missing binding must never enable unlimited email sends.
    const limiter = env.SUBSCRIBE_LIMITER;
    if (!limiter) {
      console.error('SUBSCRIBE_LIMITER not configured');
      return Response.json({ error: 'Signup temporarily unavailable' }, { status: 503, headers: corsHeaders });
    }
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const { success } = await limiter.limit({ key: ip });
    if (!success) {
      return Response.json({ error: 'Too many requests, try again in a minute' }, { status: 429, headers: corsHeaders });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders });
    }
    const rawEmail = body && typeof body === 'object' && 'email' in body ? body.email : undefined;

    // Normalise at the boundary so the Resend audience keys match the Substack export
    // (audit 2026-08-28: mixed-case signups made cross-list diffs unreliable).
    const email = String(rawEmail ?? '').trim().toLowerCase();

    // Shape check only, not a deliverability check. The old `includes('@')`
    // admitted addresses like `x@gmail.comcom` with no local/domain structure.
    const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return Response.json(
        { error: 'Valid email is required' },
        { status: 400, headers: corsHeaders },
      );
    }

    const { RESEND_API_KEY, RESEND_AUDIENCE_ID } = env;

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return Response.json(
        { error: 'Email service not configured' },
        { status: 500, headers: corsHeaders },
      );
    }

    const resendHeaders = {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const emailBody = JSON.stringify({
      from: 'CC4 Marketing <hello@mail.cc4.marketing>',
      to: [email],
      // Phase 04 split: this email owns the download + quick start only.
      // The newsletter half (what it is, cadence, archive) lives in the
      // Substack welcome email, so the two first-touch emails never overlap.
      subject: "Your Claude Code for Marketers download link",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; color: #2C2C2C; margin-bottom: 16px;">Welcome to CC4 Marketing!</h1>
          <p style="font-size: 16px; color: #444; line-height: 1.6;">
            Thanks for joining. Here's your course download link:
          </p>
          <p style="margin: 24px 0;">
            <a href="https://github.com/cc4-marketing/cc4.marketing/releases/latest"
               style="display: inline-block; background: #E8B923; color: #2C2C2C; padding: 14px 28px; text-decoration: none; font-weight: 700; font-size: 16px;">
              Download the Course →
            </a>
          </p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            <strong>Quick start:</strong><br>
            1. Download the latest release from the link above<br>
            2. Unzip and open a terminal in the folder<br>
            3. Run <code>claude</code>, then type <code>/start-0-0</code>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="font-size: 12px; color: #999;">
            You're receiving this because you signed up at <a href="https://cc4.marketing" style="color: #999;">cc4.marketing</a>.
          </p>
        </div>
      `,
    });

    const requests: Promise<Response>[] = [
      fetch('https://api.resend.com/emails', { method: 'POST', headers: resendHeaders, body: emailBody }),
    ];

    if (RESEND_AUDIENCE_ID) {
      requests.push(
        fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
          method: 'POST',
          headers: resendHeaders,
          body: JSON.stringify({ email, unsubscribed: false }),
        }),
      );
    } else {
      console.warn('RESEND_AUDIENCE_ID not set — subscriber not added to audience');
    }

    // No server-side Substack call. The POST to Substack's /api/v1/free was redirected to the
    // publication homepage and never created a subscriber (diagnostic log, 2026-09-30), so it
    // failed silently. Readers subscribe through the embed on /download; the monthly issue from
    // .github/workflows/monthly-substack-sync-reminder.yml covers the Resend -> Substack import.

    const [res] = await Promise.all(requests);

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Resend API error:', res.status, errBody);
      return Response.json(
        { error: 'Failed to send email' },
        { status: 502, headers: corsHeaders },
      );
    }

    return Response.json({ success: true, message: 'Email sent' }, { headers: corsHeaders });
  } catch (err) {
    console.error('Subscribe error:', err);
    return Response.json(
      { error: 'Internal error' },
      { status: 500, headers: corsHeaders },
    );
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};
