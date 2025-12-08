import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { type, text, email, lessonTitle, lessonUrl } = await request.json();

    if (!type || !text) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const githubToken = import.meta.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.error('GITHUB_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Feedback system not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const issueTitle = `Lesson Feedback (${type}): ${lessonTitle}`;
    const issueBody = `**Feedback Type:** ${type}\n\n**Message:**\n${text}\n\n**Lesson URL:** ${lessonUrl}\n${
      email ? `\n**User Email:** ${email}` : ''
    }`;

    const response = await fetch('https://api.github.com/repos/cc4-marketing/site/issues', {
      method: 'POST',
      headers: {
        Authorization: `token ${githubToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels: ['feedback'],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub API error:', error);
      throw new Error('Failed to create GitHub issue');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Feedback API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
