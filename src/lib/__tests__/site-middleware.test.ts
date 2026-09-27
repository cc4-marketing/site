import { createContext } from 'astro/middleware';
import { describe, expect, it } from 'vitest';
import { onRequest } from '../site-middleware';

const login = 'https://cc4.marketing/_emdash/admin/login';

async function request(url: string, downstream: Response = new Response('admin')) {
  const context = createContext({ request: new Request(url) });
  const response = await onRequest(context, async () => downstream);
  if (!(response instanceof Response)) throw new Error('Middleware did not return a response');
  return response;
}

describe('admin redirect security', () => {
  it.each(['https://example.com', '//example.com', '/\t/example.com', '/\\example.com', 'javascript:alert(1)'])(
    'removes unsafe redirect %j before a CMS setup response', async target => {
      const url = new URL(login);
      url.searchParams.set('redirect', target);
      url.searchParams.set('notice', 'expired');
      const response = await request(url.href, new Response(null, {
        status: 302, headers: { Location: '/_emdash/admin/setup' },
      }));
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/_emdash/admin/login?notice=expired');
      expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    },
  );

  it.each(['/_%65mdash/admin/login', '/_%2565mdash/admin/login'])(
    'guards the normalized CMS route for %s', async path => {
      const context = createContext({
        request: new Request(`https://cc4.marketing${path}?redirect=%2F%09%2Fexample.com`),
      });
      context.url.pathname = '/_emdash/admin/login';
      const response = await onRequest(context, async () => new Response('unguarded CMS'));
      if (!(response instanceof Response)) throw new Error('Middleware did not return a response');
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/_emdash/admin/login');
      expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    },
  );

  it.each(['/', '/_emdash/admin', '/_emdash/admin/posts?status=draft'])(
    'preserves the same-origin destination %j', async target => {
      const url = new URL(login);
      url.searchParams.set('redirect', target);
      const response = await request(url.href);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('admin');
    },
  );

  it('rejects a second unsafe redirect value', async () => {
    const url = new URL(login);
    url.searchParams.append('redirect', '/_emdash/admin');
    url.searchParams.append('redirect', '//example.com');
    const response = await request(url.href);
    expect(response.headers.get('location')).toBe('/_emdash/admin/login');
  });

  it('keeps CMS CSP and adds noindex to an early auth response', async () => {
    const response = await request(login, new Response(null, {
      status: 302,
      headers: { Location: '/_emdash/admin/setup', 'Content-Security-Policy': "default-src 'self'" },
    }));
    expect(response.headers.get('location')).toBe('/_emdash/admin/setup');
    expect(response.headers.get('content-security-policy')).toBe("default-src 'self'");
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });
});

it('protects CMS authentication API redirect parameters as well as admin pages', async () => {
  const response = await request('https://cc4.marketing/_emdash/api/auth/logout?redirect=%2F%09%2Fexample.com');
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe('/_emdash/api/auth/logout');
});

it('redirects the CMS sitemap alias to the canonical sitemap index', async () => {
  const response = await request('https://cc4.marketing/sitemap.xml');
  expect(response.status).toBe(301);
  expect(response.headers.get('location')).toBe('/sitemap-index.xml');
});

it('redirects HTTP to HTTPS before reaching CMS', async () => {
  const response = await request('http://cc4.marketing/download?source=course');
  expect(response.status).toBe(301);
  expect(response.headers.get('location')).toBe('https://cc4.marketing/download?source=course');
});

it('canonicalizes page slashes without dropping query parameters', async () => {
  const response = await request('https://cc4.marketing/changelog?q=course');
  expect(response.status).toBe(301);
  expect(response.headers.get('location')).toBe('/changelog/?q=course');
});
