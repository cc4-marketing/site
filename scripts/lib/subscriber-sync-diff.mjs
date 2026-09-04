// Pure diff between the Resend audience and a Substack export.
// Kept free of I/O so the four-bucket logic is unit-testable (phase 03 step 5).
//
// Normalisation rule: every address is trim().toLowerCase() before comparison.
// Mixed-case signups exist in the real data (Madison.Kalm@...) and un-normalised
// diffs invent differences.

/** @typedef {{ email: string, unsubscribed: boolean, id?: string }} Contact */

export function normalizeEmail(raw) {
  return String(raw ?? '').trim().toLowerCase();
}

/**
 * Four buckets, per plans/20260828-0238 phase 03 step 2:
 * 1. optedInMissingFromSubstack  (failure: the phase-01 regression)
 * 2. unsubscribedButActiveOnSubstack (failure: compliance)
 * 3. substackOnlyCount (informational, count only: Substack-native signups)
 * 4. substackUnsubscribedButOptedInOnResend (informational: reverse leak)
 *
 * @param {Contact[]} resendContacts
 * @param {Contact[]} substackContacts
 */
export function diffSubscribers(resendContacts, substackContacts) {
  const resend = new Map();
  for (const c of resendContacts) {
    const email = normalizeEmail(c.email);
    if (email) resend.set(email, { ...c, email });
  }
  const substack = new Map();
  for (const c of substackContacts) {
    const email = normalizeEmail(c.email);
    if (email) substack.set(email, { ...c, email });
  }

  const optedInMissingFromSubstack = [];
  const unsubscribedButActiveOnSubstack = [];
  const substackUnsubscribedButOptedInOnResend = [];

  for (const [email, r] of resend) {
    const s = substack.get(email);
    if (!r.unsubscribed && !s) optedInMissingFromSubstack.push(r);
    if (r.unsubscribed && s && !s.unsubscribed) unsubscribedButActiveOnSubstack.push(r);
    if (!r.unsubscribed && s && s.unsubscribed) substackUnsubscribedButOptedInOnResend.push(r);
  }

  let substackOnlyCount = 0;
  for (const email of substack.keys()) {
    if (!resend.has(email)) substackOnlyCount++;
  }

  const sortByEmail = (a, b) => a.email.localeCompare(b.email);
  optedInMissingFromSubstack.sort(sortByEmail);
  unsubscribedButActiveOnSubstack.sort(sortByEmail);
  substackUnsubscribedButOptedInOnResend.sort(sortByEmail);

  return {
    optedInMissingFromSubstack,
    unsubscribedButActiveOnSubstack,
    substackOnlyCount,
    substackUnsubscribedButOptedInOnResend,
  };
}

/**
 * Parse a Substack subscriber export CSV into Contact[].
 * Substack's export format is not versioned; be tolerant:
 * - the email column is whichever header matches /email/i first
 *   (but never a "disabled"/"status" column),
 * - a row counts as unsubscribed when a recognised opt-out column is truthy
 *   (email_disabled, unsubscribed, unsubscribed_at non-empty).
 * Caller should eyeball the detected columns printed by the CLI.
 */
export function parseSubstackCsv(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) return { contacts: [], columns: [] };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const emailIdx = header.findIndex((h) => /email/.test(h) && !/(disabled|status)/.test(h));
  if (emailIdx === -1) {
    throw new Error(`no email column found in Substack CSV header: ${header.join(', ')}`);
  }
  const unsubIdxs = header
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => /(email_disabled|^unsubscribed$|unsubscribed_at|opted_out)/.test(h))
    .map(({ i }) => i);

  const contacts = [];
  for (const row of rows.slice(1)) {
    const email = normalizeEmail(row[emailIdx]);
    if (!email) continue;
    const unsubscribed = unsubIdxs.some((i) => {
      const v = String(row[i] ?? '').trim().toLowerCase();
      return v !== '' && v !== 'false' && v !== '0' && v !== 'no';
    });
    contacts.push({ email, unsubscribed });
  }
  return { contacts, columns: header };
}

/** Minimal CSV parser: quoted fields, escaped quotes, CRLF. No deps. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.length > 1 || row[0] !== '') rows.push(row);
  return rows;
}
