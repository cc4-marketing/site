// Contract tests for /api/subscribe (plans/20260828-0238 phase 01).
// Stubs fetch and the cloudflare:workers env; asserts the contract, not the plumbing.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mutable so individual tests can attach a rate limiter binding.
const mockEnv = vi.hoisted(() => ({
  RESEND_API_KEY: 'test-key',
  RESEND_AUDIENCE_ID: 'test-audience',
} as Record<string, unknown>));
vi.mock('cloudflare:workers', () => ({ env: mockEnv }));

import { POST } from '../subscribe';

type FetchCall = { url: string; init: RequestInit };

function stubFetch(handler: (url: string) => Response | Promise<Response>) {
  const calls: FetchCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return handler(String(url));
    }),
  );
  return calls;
}

function makeRequest(body: unknown): Request {
  return new Request('https://cc4.marketing/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const ok = () => new Response('{}', { status: 200 });

async function post(body: unknown): Promise<Response> {
  // Astro's APIRoute receives a context object; the handler only uses `request`.
  return POST({ request: makeRequest(body) } as any);
}

beforeEach(() => {
  delete mockEnv.SUBSCRIBE_LIMITER;
  vi.unstubAllGlobals();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('POST /api/subscribe', () => {
  it('valid address produces three outbound calls: Resend send, Resend contact, Substack free', async () => {
    const calls = stubFetch(ok);
    const res = await post({ email: 'person@example.com' });

    expect(res.status).toBe(200);
    const urls = calls.map((c) => c.url);
    expect(urls).toEqual([
      'https://api.resend.com/emails',
      'https://api.resend.com/audiences/test-audience/contacts',
      'https://cc4marketing.substack.com/api/v1/free?nojs=true',
    ]);
  });

  it('a broken Substack never costs a signup: substack 500 still yields 200', async () => {
    stubFetch((url) =>
      url.includes('substack.com') ? new Response('boom', { status: 500 }) : ok(),
    );
    const res = await post({ email: 'person@example.com' });
    expect(res.status).toBe(200);
  });

  it('a substack network error still yields 200', async () => {
    stubFetch((url) => {
      if (url.includes('substack.com')) throw new Error('network down');
      return ok();
    });
    const res = await post({ email: 'person@example.com' });
    expect(res.status).toBe(200);
  });

  it('Resend send returning 500 still yields 502 (existing behaviour, guarded)', async () => {
    stubFetch((url) =>
      url === 'https://api.resend.com/emails' ? new Response('err', { status: 500 }) : ok(),
    );
    const res = await post({ email: 'person@example.com' });
    expect(res.status).toBe(502);
  });

  it('normalises mixed case and whitespace before any outbound call', async () => {
    const calls = stubFetch(ok);
    await post({ email: ' Foo@Bar.com ' });

    const sendBody = JSON.parse(String(calls[0].init.body));
    expect(sendBody.to).toEqual(['foo@bar.com']);
    const substackBody = String(calls[2].init.body);
    expect(substackBody).toContain('email=foo%40bar.com');
  });

  it('rejects structurally invalid addresses with 400', async () => {
    for (const bad of ['nope', '', 'a@b', 'a b@c.com', 'a@@c.com', null]) {
      const calls = stubFetch(ok);
      const res = await post({ email: bad });
      expect(res.status, `expected 400 for ${JSON.stringify(bad)}`).toBe(400);
      expect(calls.length).toBe(0);
    }
  });

  it('accepts x@gmail.comcom (valid shape, invalid TLD is not our problem)', async () => {
    stubFetch(ok);
    const res = await post({ email: 'x@gmail.comcom' });
    expect(res.status).toBe(200);
  });

  it('rejects non-JSON bodies with 415 before any outbound call (blocks cross-site form posts)', async () => {
    const calls = stubFetch(ok);
    const res = await POST({
      request: new Request('https://cc4.marketing/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ email: 'person@example.com' }),
      }),
    } as any);
    expect(res.status).toBe(415);
    expect(calls).toHaveLength(0);
  });

  it('never reflects a foreign Origin in CORS headers', async () => {
    stubFetch(ok);
    const res = await post({ email: 'person@example.com' });
    expect(res.headers.get('access-control-allow-origin')).toBe('https://cc4.marketing');
  });

  it('returns 429 with no outbound calls when the rate limiter says no', async () => {
    mockEnv.SUBSCRIBE_LIMITER = { limit: async () => ({ success: false }) };
    const calls = stubFetch(ok);
    const res = await post({ email: 'person@example.com' });
    expect(res.status).toBe(429);
    expect(calls).toHaveLength(0);
  });

  it('does not leak the upstream Resend error body', async () => {
    stubFetch((url) => (url.includes('/emails') ? new Response('secret-ish detail', { status: 500 }) : ok()));
    const res = await post({ email: 'person@example.com' });
    expect(await res.text()).not.toContain('secret-ish detail');
  });
});
