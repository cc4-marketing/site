// The /download form posts to the site-kick course route with one idempotency key per page load.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../download.astro', import.meta.url), 'utf8');
const script = page.slice(page.lastIndexOf('<script>'));

describe('/download form', () => {
  it('posts to /api/course-download, not /api/subscribe', () => {
    expect(script).toContain('fetch("/api/course-download"');
    expect(script).not.toContain('/api/subscribe"');
  });

  it('sends one idempotency key per page load with every submit', () => {
    expect(script).toMatch(/const idempotencyKey = [^;]*crypto\.randomUUID\(\)/);
    expect(script).toContain('JSON.stringify({ email, website: website.value, idempotencyKey })');
    expect(script).toContain('if (submitBtn.disabled) return;');
  });

  it('carries the kit honeypot field, hidden from people', () => {
    expect(page).toMatch(/<input type="text" name="website"[^>]*tabindex="-1"[^>]*class="hp" aria-hidden="true"/);
    expect(page).toMatch(/\.hp \{ position: absolute; left: -9999px;/);
  });

  it('maps every kit error code to a message', () => {
    for (const code of ['rate_limited', 'invalid_email', 'bad_origin', 'not_configured', 'guard_unavailable', 'send_failed']) {
      expect(script).toMatch(new RegExp(`\\b${code}: "`));
    }
  });
});
