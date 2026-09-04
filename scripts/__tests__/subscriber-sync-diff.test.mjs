// Fixture test for the four-bucket diff (phase 03 step 5).
// Case and whitespace variants are the part that silently breaks, so the
// fixtures carry them on purpose.
import { describe, it, expect } from 'vitest';
import { diffSubscribers, parseSubstackCsv, normalizeEmail } from '../lib/subscriber-sync-diff.mjs';

describe('diffSubscribers', () => {
  const resend = [
    { id: 'r1', email: 'stranded@example.com', unsubscribed: false }, // bucket 1
    { id: 'r2', email: ' Mixed.Case@Example.COM ', unsubscribed: false }, // present on both (case variant)
    { id: 'r3', email: 'optedout@example.com', unsubscribed: true }, // bucket 2 (active on substack)
    { id: 'r4', email: 'left-on-substack@example.com', unsubscribed: false }, // bucket 4
    { id: 'r5', email: 'gone-everywhere@example.com', unsubscribed: true }, // unsub both sides: no bucket
  ];
  const substack = [
    { email: 'mixed.case@example.com', unsubscribed: false },
    { email: 'optedout@example.com', unsubscribed: false },
    { email: 'LEFT-ON-SUBSTACK@example.com', unsubscribed: true },
    { email: 'native-1@example.com', unsubscribed: false }, // bucket 3
    { email: 'native-2@example.com', unsubscribed: false }, // bucket 3
  ];

  const diff = diffSubscribers(resend, substack);

  it('bucket 1: opted in on Resend, absent from Substack', () => {
    expect(diff.optedInMissingFromSubstack.map((c) => c.email)).toEqual(['stranded@example.com']);
  });

  it('bucket 2: unsubscribed on Resend, active on Substack', () => {
    expect(diff.unsubscribedButActiveOnSubstack.map((c) => c.email)).toEqual(['optedout@example.com']);
  });

  it('bucket 3: Substack-native count only', () => {
    expect(diff.substackOnlyCount).toBe(2);
  });

  it('bucket 4: unsubscribed on Substack, opted in on Resend', () => {
    expect(diff.substackUnsubscribedButOptedInOnResend.map((c) => c.email)).toEqual([
      'left-on-substack@example.com',
    ]);
  });

  it('case/whitespace variants never land in a failure bucket', () => {
    const emails = [
      ...diff.optedInMissingFromSubstack,
      ...diff.unsubscribedButActiveOnSubstack,
    ].map((c) => c.email);
    expect(emails).not.toContain('mixed.case@example.com');
  });
});

describe('parseSubstackCsv', () => {
  it('parses a typical export, detects email + disabled columns', () => {
    const csv = [
      'email,active_subscription,email_disabled,created_at',
      'One@Example.com,true,false,2026-01-01',
      'two@example.com,true,true,2026-02-01',
      '"quoted@example.com",true,,2026-03-01',
    ].join('\n');
    const { contacts, columns } = parseSubstackCsv(csv);
    expect(columns).toContain('email');
    expect(contacts).toEqual([
      { email: 'one@example.com', unsubscribed: false },
      { email: 'two@example.com', unsubscribed: true },
      { email: 'quoted@example.com', unsubscribed: false },
    ]);
  });

  it('throws with a readable message when no email column exists', () => {
    expect(() => parseSubstackCsv('name,thing\na,b')).toThrow(/no email column/);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail(' Foo@Bar.COM ')).toBe('foo@bar.com');
    expect(normalizeEmail(null)).toBe('');
  });
});
