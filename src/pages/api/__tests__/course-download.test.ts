// /api/course-download: inert without the GATEWAY binding (production), simulated on a preview host.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createContext } from 'astro/middleware';

const mockEnv = vi.hoisted(() => ({}) as Record<string, unknown>);
vi.mock('cloudflare:workers', () => ({ env: mockEnv }));

import { POST } from '../course-download';

const PROD = 'https://cc4.marketing';
const PREVIEW = 'https://cc4-mkt-preview.mtri-vo.workers.dev';

function post(origin: string, email = 'reader@example.com', extra: Record<string, unknown> = {}, locals: object = {}) {
  const request = new Request(`${origin}/api/course-download`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', origin },
    body: JSON.stringify({ email, ...extra }),
  });
  return POST(createContext({ request, locals }));
}

// Resend stand-in: /emails answers `send`, a contact lookup answers `lookup`, a contact create 200.
function stubResend({ send = 200, lookup = 404 as number | Record<string, unknown> } = {}) {
  const calls: { method: string; path: string; init?: RequestInit }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => {
    const u = new URL(String(url));
    const method = init?.method ?? 'GET';
    calls.push({ method, path: u.pathname, init });
    if (u.pathname === '/emails') return Response.json({ id: 'm1' }, { status: send });
    if (method === 'GET') {
      return typeof lookup === 'number' ? Response.json({}, { status: lookup }) : Response.json(lookup);
    }
    return Response.json({ id: 'c1' });
  }));
  return calls;
}

const LIVE = {
  SITE_DOMAINS: 'cc4.marketing', LEAD_NOTIFY: 'owner@example.com', MAIL_MODE: 'live',
  MAIL_FROM: 'CC4 Marketing <hello@mail.cc4.marketing>', RESEND_API_KEY: 'k', RESEND_AUDIENCE_ID: 'aud',
};
const contactCalls = (calls: { method: string; path: string }[]) =>
  calls.filter((c) => c.path.startsWith('/audiences/')).map(({ method, path }) => ({ method, path }));
const logLines = () => vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
// An ExecutionContext stand-in, as @astrojs/cloudflare puts it on locals.cfContext.
function cfContext() {
  const tasks: Promise<unknown>[] = [];
  return { tasks, locals: { cfContext: { waitUntil: vi.fn((t: Promise<unknown>) => { tasks.push(t); }) } } };
}

// Stand-in for site-kick-gateway-preview: accepts every submission and journal step.
function fakeGateway() {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  return {
    calls,
    async fetch(url: string, init?: RequestInit) {
      const body = JSON.parse(String(init?.body));
      const path = new URL(url).pathname;
      calls.push({ path, body });
      return Response.json(path === '/submit' ? { ok: true, submissionId: 'sub-1', state: 'guarded' } : { ok: true });
    },
  };
}

beforeEach(() => {
  for (const k of Object.keys(mockEnv)) delete mockEnv[k];
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('no network in tests'); }));
});

describe('POST /api/course-download', () => {
  // cc4-mkt today: Resend secrets only, no GATEWAY, SITE_DOMAINS, LEAD_NOTIFY or MAIL_MODE.
  it('production config answers 503 not_configured on cc4.marketing and on its workers.dev host', async () => {
    Object.assign(mockEnv, { RESEND_API_KEY: 'k', RESEND_AUDIENCE_ID: 'a' });
    const prod = await post(PROD);
    expect(prod.status).toBe(503);
    expect(await prod.json()).toMatchObject({ ok: false, error: 'not_configured', missing: ['SITE_DOMAINS'] });
    const dev = await post('https://cc4-mkt.mtri-vo.workers.dev');
    expect(dev.status).toBe(503);
    expect(await dev.json()).toMatchObject({ ok: false, error: 'not_configured', missing: ['LEAD_NOTIFY'] });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('once production sets SITE_DOMAINS without MAIL_MODE=live it still answers 503', async () => {
    Object.assign(mockEnv, { SITE_DOMAINS: 'cc4.marketing', RESEND_API_KEY: 'k' });
    const res = await post(PROD);
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, error: 'not_configured', missing: ['MAIL_MODE'] });
  });

  it('a workers.dev host without GATEWAY answers 503 and sends nothing', async () => {
    Object.assign(mockEnv, { SITE_DOMAINS: 'cc4.marketing', LEAD_NOTIFY: 'owner@example.com' });
    const res = await post(PREVIEW);
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, error: 'guard_unavailable' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preview config simulates through the gateway, journals simulated, never touches the audience', async () => {
    const gw = fakeGateway();
    Object.assign(mockEnv, { SITE_DOMAINS: 'cc4.marketing', LEAD_NOTIFY: 'owner@example.com', GATEWAY: gw });
    // Worst case for the audience step: live credentials on a host that only simulates.
    Object.assign(mockEnv, { MAIL_MODE: 'live', MAIL_FROM: 'hello@mail.cc4.marketing', RESEND_API_KEY: 'k', RESEND_AUDIENCE_ID: 'aud' });
    const res = await post(PREVIEW);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, simulated: true, mode: 'log' });
    expect(gw.calls[0]).toMatchObject({ path: '/submit', body: { site: 'cc4', action: 'book', payload: { magnet: 'cc4-course' } } });
    expect(gw.calls.map((c) => c.body.state).filter(Boolean)).toEqual(['sending', 'mailed_owner', 'simulated']);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses a cross-site post', async () => {
    Object.assign(mockEnv, { SITE_DOMAINS: 'cc4.marketing', LEAD_NOTIFY: 'owner@example.com', GATEWAY: fakeGateway() });
    const request = new Request(`${PREVIEW}/api/course-download`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', origin: 'https://evil.example' },
      body: JSON.stringify({ email: 'reader@example.com' }),
    });
    expect((await POST(createContext({ request }))).status).toBe(403);
  });

  describe('audience step after a live delivery', () => {
    it('adds the reader to the audience once the live mail went out', async () => {
      const calls = stubResend();
      Object.assign(mockEnv, LIVE, { GATEWAY: fakeGateway() });
      const res = await post(PROD, ' Reader@Example.com ');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(calls.filter((c) => c.path === '/emails')).toHaveLength(2); // owner record, then reader mail
      expect(contactCalls(calls)).toEqual([
        { method: 'GET', path: '/audiences/aud/contacts/reader%40example.com' },
        { method: 'POST', path: '/audiences/aud/contacts' },
      ]);
    });

    it('leaves a contact that unsubscribed as it is', async () => {
      const calls = stubResend({ lookup: { unsubscribed: true } });
      Object.assign(mockEnv, LIVE, { GATEWAY: fakeGateway() });
      expect((await post(PROD)).status).toBe(200);
      expect(contactCalls(calls)).toEqual([{ method: 'GET', path: '/audiences/aud/contacts/reader%40example.com' }]);
    });

    it('an audience API failure still answers 200 and logs a code without the address', async () => {
      stubResend({ lookup: 500 });
      Object.assign(mockEnv, LIVE, { GATEWAY: fakeGateway() });
      const res = await post(PROD);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      const lines = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
      expect(lines.some((l) => l.includes('"state":"audience_failed"') && l.includes('provider_500'))).toBe(true);
      expect(lines.join('\n')).not.toContain('reader@example.com');
    });

    it('a failed reader mail answers 502 and skips the audience', async () => {
      const calls = stubResend({ send: 500 });
      Object.assign(mockEnv, LIVE, { GATEWAY: fakeGateway() });
      const res = await post(PROD);
      expect(res.status).toBe(502);
      expect(await res.json()).toMatchObject({ ok: false, error: 'send_failed' });
      expect(contactCalls(calls)).toEqual([]);
    });

    it('an invalid email and the honeypot never reach the audience', async () => {
      const calls = stubResend();
      Object.assign(mockEnv, LIVE, { GATEWAY: fakeGateway() });
      expect((await post(PROD, 'not-an-email')).status).toBe(400);
      const bot = await post(PROD, 'reader@example.com', { website: 'spam.example' });
      expect(bot.status).toBe(200);
      expect(calls).toEqual([]);
    });

    it('the reader mail carries the release link and the quick start', async () => {
      const bodies: string[] = [];
      vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => {
        if (new URL(String(url)).pathname === '/emails') bodies.push(String(init?.body));
        return Response.json({ id: 'x' });
      }));
      Object.assign(mockEnv, LIVE, { GATEWAY: fakeGateway() });
      expect((await post(PROD)).status).toBe(200);
      const reader = JSON.parse(bodies[1]);
      expect(reader).toMatchObject({ to: ['reader@example.com'], subject: 'Your Claude Code for Marketers download link' });
      for (const part of [reader.text, reader.html]) {
        expect(part).toContain('https://github.com/cc4-marketing/cc4.marketing/releases/latest');
        expect(part).toContain('Run claude, then type /start-0-0');
      }
    });
  });

  describe('audience signup after a live delivery', () => {
    // Substack's /api/v1/free redirected server posts to its homepage and never added anyone
    // (2026-09-30); readers now subscribe through the embed on /download.
    it('joins the Resend audience and never calls Substack', async () => {
      const calls = stubResend();
      Object.assign(mockEnv, LIVE, { GATEWAY: fakeGateway() });
      expect((await post(PROD)).status).toBe(200);
      expect(contactCalls(calls).some((c) => c.method === 'POST' && c.path === '/audiences/aud/contacts')).toBe(true);
      expect(vi.mocked(fetch).mock.calls.some(([u]) => String(u).includes('substack.com'))).toBe(false);
    });

    it('with locals.cfContext the reply does not wait for the audience signup', async () => {
      const pending: string[] = [];
      vi.stubGlobal('fetch', vi.fn((url: string | URL) => {
        const u = new URL(String(url));
        if (u.pathname === '/emails') return Promise.resolve(Response.json({ id: 'm' }));
        pending.push(u.pathname);
        return new Promise<Response>(() => {}); // the audience never answers
      }));
      Object.assign(mockEnv, LIVE, { GATEWAY: fakeGateway() });
      const { tasks, locals } = cfContext();
      const res = await post(PROD, 'reader@example.com', {}, locals);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(locals.cfContext.waitUntil).toHaveBeenCalledTimes(1);
      expect(tasks).toHaveLength(1);
      expect(pending).toEqual(['/audiences/aud/contacts/reader%40example.com']);
    });

    it('schedules nothing on a simulated answer, an error, or the honeypot', async () => {
      stubResend({ send: 500 });
      Object.assign(mockEnv, LIVE, { GATEWAY: fakeGateway() });
      const failed = cfContext();
      expect((await post(PROD, 'reader@example.com', {}, failed.locals)).status).toBe(502);
      const bot = cfContext();
      expect((await post(PROD, 'reader@example.com', { website: 'x' }, bot.locals)).status).toBe(200);
      const sim = cfContext();
      expect((await post(PREVIEW, 'reader@example.com', {}, sim.locals)).status).toBe(200);
      for (const c of [failed, bot, sim]) expect(c.locals.cfContext.waitUntil).not.toHaveBeenCalled();
    });

    it('a failing audience signup never changes the reply and log codes without the address', async () => {
      vi.stubGlobal('fetch', vi.fn(async (url: string | URL) => {
        const u = new URL(String(url));
        if (u.pathname === '/emails') return Response.json({ id: 'm' });
        throw new TypeError('network down');
      }));
      Object.assign(mockEnv, LIVE, { GATEWAY: fakeGateway() });
      const { tasks, locals } = cfContext();
      const res = await post(PROD, 'reader@example.com', {}, locals);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      await Promise.all(tasks);
      const lines = logLines();
      expect(lines.some((l) => l.includes('"state":"audience_failed"') && l.includes('provider_error'))).toBe(true);
      expect(lines.join('\n')).not.toContain('reader@example.com');
    });
  });
});
