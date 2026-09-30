// /api/course-download: inert without the GATEWAY binding (production), simulated on a preview host.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createContext } from 'astro/middleware';

const mockEnv = vi.hoisted(() => ({}) as Record<string, unknown>);
vi.mock('cloudflare:workers', () => ({ env: mockEnv }));

import { POST } from '../course-download';

const PROD = 'https://cc4.marketing';
const PREVIEW = 'https://cc4-mkt-preview.mtri-vo.workers.dev';

function post(origin: string, email = 'reader@example.com') {
  const request = new Request(`${origin}/api/course-download`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', origin },
    body: JSON.stringify({ email }),
  });
  return POST(createContext({ request }));
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
  it('production config (no GATEWAY, no MAIL_MODE) answers 503 not_configured on cc4.marketing', async () => {
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

  it('preview config simulates through the gateway and journals simulated', async () => {
    const gw = fakeGateway();
    Object.assign(mockEnv, { SITE_DOMAINS: 'cc4.marketing', LEAD_NOTIFY: 'owner@example.com', GATEWAY: gw });
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
});
