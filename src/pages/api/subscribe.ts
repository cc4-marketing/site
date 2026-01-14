import type { APIRoute } from 'astro';

const RESEND_API_URL = 'https://api.resend.com/emails';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const POST: APIRoute = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = import.meta.env.RESEND_API_KEY;
    const resendFrom = import.meta.env.RESEND_FROM;
    const resendReplyTo = import.meta.env.RESEND_REPLY_TO;

    if (!resendApiKey || !resendFrom) {
      console.error('Resend is not configured');
      return new Response(JSON.stringify({ error: 'Email system not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const html = `
      <p>Thanks for downloading Claude Code for Marketers.</p>
      <p>Your download is ready here: <a href="https://go.mtri.me/cm">Download Course (ZIP)</a></p>
      <p>Next steps:</p>
      <ol>
        <li>Extract the ZIP file</li>
        <li>Open the folder in Claude Code</li>
        <li>Type <code>/start-0-0</code> to begin</li>
      </ol>
      <p>If you need anything, just reply to this email.</p>
    `;

    const text = [
      'Thanks for downloading Claude Code for Marketers.',
      'Download Course (ZIP): https://go.mtri.me/cm',
      'Next steps:',
      '1. Extract the ZIP file',
      '2. Open the folder in Claude Code',
      '3. Type /start-0-0 to begin',
      'If you need anything, just reply to this email.',
    ].join('\n');

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [email],
        reply_to: resendReplyTo,
        subject: 'Welcome to Claude Code for Marketers',
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Subscribe API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
