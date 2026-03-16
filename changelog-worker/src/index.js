const KV_KEY = 'entries';

// ── Helpers ──────────────────────────────────────────────────

async function readEntries(kv) {
  const raw = await kv.get(KV_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

async function writeEntries(kv, entries) {
  await kv.put(KV_KEY, JSON.stringify(entries));
}

function onlyPublished(entries) {
  return entries
    .filter((e) => (e.status || 'published') === 'published')
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
}

function normalize(entry) {
  return {
    ...entry,
    status: entry.status || 'published',
    created_at: entry.created_at || entry.published_at || new Date().toISOString(),
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function checkAuth(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return false;
  const decoded = atob(auth.split(' ')[1]);
  const [user, pass] = decoded.split(':');
  return user === (env.ADMIN_USER || 'admin') && pass === (env.ADMIN_PASS || 'bearlychange');
}

function unauthorized() {
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="bearlychange-admin"' },
  });
}

function cors(response) {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return newResponse;
}

// ── Routes ───────────────────────────────────────────────────

async function handleApiChangelog(kv, url) {
  const entries = onlyPublished((await readEntries(kv)).map(normalize));
  return json({
    project: 'cc4-changelog',
    description: 'Changelog for CC4.Marketing — Claude Code for Marketers course',
    site_url: 'https://cc4.marketing',
    feed_urls: {
      json: `${url.origin}/feed.json`,
      rss: `${url.origin}/rss.xml`,
    },
    llms_txt: 'https://cc4.marketing/llms.txt',
    count: entries.length,
    entries,
  });
}

async function handleFeedJson(kv, url) {
  const entries = onlyPublished((await readEntries(kv)).map(normalize));
  return json({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'CC4.Marketing Changelog',
    home_page_url: url.origin,
    feed_url: `${url.origin}/feed.json`,
    items: entries.map((e) => ({
      id: e.id,
      url: `${url.origin}/entries/${e.slug}`,
      title: e.title,
      content_html: `<p><strong>${e.type.toUpperCase()}</strong> · v${e.version}</p><p>${e.summary}</p>`,
      date_published: e.published_at,
      tags: [e.type, ...(e.modules || [])],
    })),
  });
}

async function handleRss(kv, url) {
  const entries = onlyPublished((await readEntries(kv)).map(normalize));
  const items = entries
    .map(
      (e) => `
    <item>
      <title><![CDATA[${e.title}]]></title>
      <link>${url.origin}/entries/${e.slug}</link>
      <guid>${e.id}</guid>
      <pubDate>${new Date(e.published_at).toUTCString()}</pubDate>
      <description><![CDATA[${e.summary}]]></description>
      <category>${e.type}</category>
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>CC4.Marketing Changelog</title>
    <description>Course updates for humans &amp; agents</description>
    <link>${url.origin}</link>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml' },
  });
}

async function handleAdmin(kv) {
  const entries = (await readEntries(kv)).map(normalize)
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));

  const rows = entries
    .map(
      (e) => `<tr>
<td>${e.id}</td>
<td>${e.title}</td>
<td><span class="status status-${e.status}">${e.status}</span></td>
<td>v${e.version}</td>
<td><span class="type type-${e.type}">${e.type}</span></td>
<td>
<form method="post" action="/admin/entries/${e.id}/status" style="display:inline-flex;gap:6px;">
<select name="status">
<option value="draft" ${e.status === 'draft' ? 'selected' : ''}>draft</option>
<option value="published" ${e.status === 'published' ? 'selected' : ''}>published</option>
</select>
<button type="submit">Update</button>
</form>
</td>
</tr>`
    )
    .join('');

  return html(`<!doctype html>
<html><head><meta charset="utf-8"><title>CC4 Changelog Admin</title>
<style>
  body { font-family: system-ui; max-width: 980px; margin: 32px auto; padding: 0 16px; line-height: 1.5; }
  h1 { color: #B85C3C; }
  form { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  input, select, textarea, button { padding: 8px; font-size: 14px; }
  button { background: #6B8E23; color: white; border: none; cursor: pointer; }
  button:hover { background: #5a7a1e; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; margin-top: 20px; }
  th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
  th { background: #2C2C2C; color: white; }
  .status-published { color: #6B8E23; font-weight: bold; }
  .status-draft { color: #999; }
  .type-added { color: #6B8E23; } .type-changed { color: #E8B923; }
  .type-deprecated { color: #999; } .type-removed { color: #EC4899; }
  .type-fixed { color: #B85C3C; } .type-security { color: #5C3A6B; }
</style>
</head>
<body>
<h1>CC4 Changelog Admin</h1>
<p>Create and manage changelog entries for <a href="https://cc4.marketing">cc4.marketing</a>.</p>
<form method="post" action="/admin/entries">
<input name="title" placeholder="Title" required />
<input name="slug" placeholder="Slug (url-friendly)" required />
<input name="summary" placeholder="Summary" required style="grid-column:1/3" />
<input name="version" placeholder="Version (e.g. 1.2.0)" required />
<select name="type"><option>added</option><option>changed</option><option>deprecated</option><option>removed</option><option>fixed</option><option>security</option></select>
<select name="status"><option value="draft">draft</option><option value="published">published</option></select>
<input name="modules" placeholder="Modules (comma-separated)" />
<textarea name="machine_summary" placeholder="Machine summary (for AI agents)" rows="2" style="grid-column:1/3"></textarea>
<button type="submit" style="grid-column:1/3">Create Entry</button>
</form>
<h2>Entries (${entries.length})</h2>
<table>
<thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Version</th><th>Type</th><th>Action</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`);
}

async function parseForm(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return new Map(Object.entries(await request.json()));
  }
  // Works for both multipart/form-data and application/x-www-form-urlencoded
  const formData = await request.formData();
  return formData;
}

async function handleCreateEntry(request, kv) {
  const formData = await parseForm(request);
  const entries = (await readEntries(kv)).map(normalize);
  const now = new Date().toISOString();
  const id = `bc_${crypto.randomUUID().slice(0, 8)}`;
  const status = formData.get('status') === 'published' ? 'published' : 'draft';

  const entry = {
    id,
    slug: formData.get('slug'),
    title: formData.get('title'),
    summary: formData.get('summary'),
    type: formData.get('type') || 'new',
    version: formData.get('version') || '0.1.0',
    modules: String(formData.get('modules') || '')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean),
    machine_summary: formData.get('machine_summary') || '',
    status,
    created_at: now,
    published_at: status === 'published' ? now : null,
  };

  entries.push(entry);
  await writeEntries(kv, entries);

  const acceptJson = (request.headers.get('Accept') || '').includes('application/json');
  if (acceptJson) return json(entry, 201);
  return Response.redirect(new URL('/admin', request.url).toString(), 302);
}

async function handleUpdateStatus(request, kv, entryId) {
  const formData = await parseForm(request);
  const status = formData.get('status') === 'published' ? 'published' : 'draft';
  const entries = (await readEntries(kv)).map(normalize);

  const updated = entries.map((e) => {
    if (e.id !== entryId) return e;
    const publishTime = status === 'published' && !e.published_at ? new Date().toISOString() : e.published_at;
    return { ...e, status, published_at: publishTime };
  });

  await writeEntries(kv, updated);
  return Response.redirect(new URL('/admin', request.url).toString(), 302);
}

// ── Main fetch handler ───────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }));
    }

    let response;

    // Public routes
    if (method === 'GET' && path === '/api/changelog') {
      response = await handleApiChangelog(env.CHANGELOG_KV, url);
    } else if (method === 'GET' && path === '/feed.json') {
      response = await handleFeedJson(env.CHANGELOG_KV, url);
    } else if (method === 'GET' && path === '/rss.xml') {
      response = await handleRss(env.CHANGELOG_KV, url);
    }

    // Admin routes (auth required)
    else if (path.startsWith('/admin')) {
      if (!checkAuth(request, env)) return cors(unauthorized());

      if (method === 'GET' && path === '/admin') {
        response = await handleAdmin(env.CHANGELOG_KV);
      } else if (method === 'POST' && path === '/admin/entries') {
        response = await handleCreateEntry(request, env.CHANGELOG_KV);
      } else if (method === 'POST' && path.match(/^\/admin\/entries\/(.+)\/status$/)) {
        const entryId = path.match(/^\/admin\/entries\/(.+)\/status$/)[1];
        response = await handleUpdateStatus(request, env.CHANGELOG_KV, entryId);
      } else {
        response = new Response('Not found', { status: 404 });
      }
    }

    // Root
    else if (method === 'GET' && path === '/') {
      response = html(`<!doctype html>
<html><head><meta charset="utf-8"><title>CC4 Changelog API</title></head>
<body style="font-family:system-ui;max-width:600px;margin:40px auto;line-height:1.5;">
<h1>CC4 Changelog API</h1>
<ul>
<li><a href="/api/changelog">/api/changelog</a> — JSON</li>
<li><a href="/feed.json">/feed.json</a> — JSON Feed</li>
<li><a href="/rss.xml">/rss.xml</a> — RSS</li>
<li><a href="/admin">/admin</a> — Dashboard (auth required)</li>
</ul>
</body></html>`);
    } else {
      response = new Response('Not found', { status: 404 });
    }

    return cors(response);
  },
};
