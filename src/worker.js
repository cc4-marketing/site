export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle /api/subscribe
    if (url.pathname === "/api/subscribe") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      if (request.method === "POST") {
        return handleSubscribe(request, env);
      }

      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    // Everything else: serve static assets
    return env.ASSETS.fetch(request);
  },
};

async function handleSubscribe(request, env) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return Response.json(
        { error: "Valid email is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const RESEND_API_KEY = env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return Response.json(
        { error: "Email service not configured" },
        { status: 500, headers: corsHeaders }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CC4 Marketing <hello@mail.cc4.marketing>",
        to: [email],
        subject:
          "Welcome to Claude Code for Marketers — here's your download link",
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
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend API error:", res.status, errBody);
      return Response.json(
        { error: "Failed to send email", detail: errBody },
        { status: 502, headers: corsHeaders }
      );
    }

    return Response.json(
      { success: true, message: "Email sent" },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("Subscribe error:", err);
    return Response.json(
      { error: "Internal error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
