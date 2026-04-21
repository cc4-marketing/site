import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return Response.json(
        { error: 'Valid email is required' },
        { status: 400, headers: corsHeaders },
      );
    }

    const { env } = await import('cloudflare:workers');
    const RESEND_API_KEY = (env as any).RESEND_API_KEY;
    const RESEND_AUDIENCE_ID = (env as any).RESEND_AUDIENCE_ID;

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
      subject: "Welcome to Claude Code for Marketers — here's your download link",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; color: #2C2C2C; margin-bottom: 16px;">Welcome to CC4 Marketing!</h1>
          <p style="font-size: 16px; color: #444; line-height: 1.6;">
            Thanks for joining. Here's your course download link:
          </p>
          <p style="margin: 24px 0;">
            <a href="https://github.com/cc4-marketing/cc4.marketing/releases"
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

    const [res] = await Promise.all(requests);

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Resend API error:', res.status, errBody);
      return Response.json(
        { error: 'Failed to send email', detail: errBody },
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
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
