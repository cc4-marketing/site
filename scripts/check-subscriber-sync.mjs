#!/usr/bin/env node
// Reconcile guard between the Resend audience and a Substack export.
// plans/20260828-0238-subscriber-sync-repair, phase 03.
//
// Usage:
//   npm run check:subscriber-sync -- --substack <export.csv> [--apply] [--emit-import-csv <path>]
//
//   RESEND_API_KEY and RESEND_AUDIENCE_ID must be in the environment, e.g.:
//   RESEND_API_KEY=$(op read "op://<vault>/<item>/api key") ... npm run check:subscriber-sync -- --substack sub.csv
//
// Buckets (failures exit non-zero):
//   1. opted in on Resend, absent from Substack   -> FAILURE (signup write regressing)
//   2. unsubscribed on Resend, active on Substack -> FAILURE (compliance)
//   3. absent from Resend, present on Substack    -> info, count only (Substack-native)
//   4. unsubscribed on Substack, opted in on Resend -> info (reverse leak, manual review)
//
// --apply: for bucket 2 only, PATCH the Resend contact to unsubscribed:true.
//   Suppression only; nothing is ever resubscribed and Substack is never written.
// --emit-import-csv: write bucket 1 as a single-column `email` CSV, the exact
//   file phase 02 imports into Substack.

import { readFileSync, writeFileSync } from 'node:fs';
import { diffSubscribers, parseSubstackCsv } from './lib/subscriber-sync-diff.mjs';

const args = process.argv.slice(2);
function argValue(flag) {
  const i = args.indexOf(flag);
  return i === -1 ? undefined : args[i + 1];
}
const substackPath = argValue('--substack');
const apply = args.includes('--apply');
const emitImportCsv = argValue('--emit-import-csv');

// Env first; fall back to the gitignored .dev.vars (written by
// scripts/setup-resend-env.sh) so the weekly run is a single command.
function devVar(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync(new URL('../.dev.vars', import.meta.url), 'utf8')
      .split('\n')
      .find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim();
  } catch {
    return undefined;
  }
}
const RESEND_API_KEY = devVar('RESEND_API_KEY');
const RESEND_AUDIENCE_ID = devVar('RESEND_AUDIENCE_ID');

if (!substackPath || !RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
  console.error(
    'usage: RESEND_API_KEY=... RESEND_AUDIENCE_ID=... node scripts/check-subscriber-sync.mjs --substack <export.csv> [--apply] [--emit-import-csv <path>]',
  );
  process.exit(2);
}

const resendHeaders = { Authorization: `Bearer ${RESEND_API_KEY}` };

async function fetchResendContacts() {
  // Resend returns the audience in one response today; the loop is a guard for
  // when pagination appears. The seen-id check prevents an infinite loop if the
  // API ignores the `after` cursor.
  const contacts = [];
  const seen = new Set();
  let after;
  for (;;) {
    const url = new URL(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`);
    url.searchParams.set('limit', '100');
    if (after) url.searchParams.set('after', after);
    const res = await fetch(url, { headers: resendHeaders });
    if (!res.ok) throw new Error(`resend contacts list failed: ${res.status} ${await res.text()}`);
    const body = await res.json();
    const page = body.data ?? [];
    if (page.length === 0 || seen.has(page[0].id)) break;
    for (const c of page) {
      seen.add(c.id);
      contacts.push({ id: c.id, email: c.email, unsubscribed: Boolean(c.unsubscribed) });
    }
    if (!body.has_more) break;
    after = page[page.length - 1].id;
  }
  return contacts;
}

async function suppressOnResend(contact) {
  const res = await fetch(
    `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts/${contact.id}`,
    {
      method: 'PATCH',
      headers: { ...resendHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ unsubscribed: true }),
    },
  );
  if (!res.ok) throw new Error(`suppress failed for ${contact.email}: ${res.status}`);
}

const substackRaw = readFileSync(substackPath, 'utf8');
const { contacts: substackContacts, columns } = parseSubstackCsv(substackRaw);
console.log(`substack export: ${substackContacts.length} rows, columns: ${columns.join(', ')}`);

const resendContacts = await fetchResendContacts();
console.log(`resend audience: ${resendContacts.length} contacts\n`);

const diff = diffSubscribers(resendContacts, substackContacts);

const b1 = diff.optedInMissingFromSubstack;
const b2 = diff.unsubscribedButActiveOnSubstack;
const b4 = diff.substackUnsubscribedButOptedInOnResend;

console.log(`bucket 1 FAILURE  opted in on Resend, absent from Substack: ${b1.length}`);
for (const c of b1) console.log(`  ${c.email}`);
console.log(`bucket 2 FAILURE  unsubscribed on Resend, active on Substack: ${b2.length}`);
for (const c of b2) console.log(`  ${c.email}`);
console.log(`bucket 3 info     Substack-native (absent from Resend): ${diff.substackOnlyCount}`);
console.log(`bucket 4 info     unsubscribed on Substack, opted in on Resend: ${b4.length}`);
for (const c of b4) console.log(`  ${c.email}`);

if (emitImportCsv) {
  writeFileSync(emitImportCsv, ['email', ...b1.map((c) => c.email)].join('\n') + '\n');
  console.log(`\nwrote ${b1.length} addresses to ${emitImportCsv} (phase 02 import set)`);
}

if (b2.length > 0) {
  if (apply) {
    for (const c of b2) {
      await suppressOnResend(c);
      console.log(`suppressed on Resend: ${c.email}`);
    }
  } else {
    console.log('\ndry run: would suppress the bucket 2 addresses on Resend. Re-run with --apply.');
  }
  console.log('Substack side of bucket 2 is manual: Subscribers -> find address -> remove.');
}

const failed = b1.length > 0 || b2.length > 0;
process.exit(failed ? 1 : 0);
