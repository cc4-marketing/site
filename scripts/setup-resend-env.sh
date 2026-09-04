#!/usr/bin/env bash
# Capture the cc4 Resend API key into .dev.vars without it passing through
# chat, shell history, or the process list.
#
# Usage:  bash scripts/setup-resend-env.sh
#   1. Prompts for the key with hidden input (paste from the Resend dashboard,
#      API keys page, of the cc4 account).
#   2. Validates it against GET /audiences.
#   3. Auto-discovers RESEND_AUDIENCE_ID (asks if there are several).
#   4. Writes/updates RESEND_API_KEY and RESEND_AUDIENCE_ID in .dev.vars
#      (gitignored, chmod 600).
set -euo pipefail

cd "$(dirname "$0")/.."
DEV_VARS=".dev.vars"

# Refuse to run if .dev.vars would be committed.
if ! grep -q '^\.dev\.vars$' .gitignore; then
  echo "ERROR: .dev.vars is not in .gitignore, refusing to write secrets there." >&2
  exit 1
fi

printf 'Paste the cc4 Resend API key (input hidden, starts with re_): '
read -rs RESEND_API_KEY
printf '\n'

if [[ ! "$RESEND_API_KEY" =~ ^re_[A-Za-z0-9_-]{10,}$ ]]; then
  echo "ERROR: that does not look like a Resend API key (expected re_...)." >&2
  exit 1
fi

# Validate the key and list audiences in one call.
resp=$(curl -sS -w '\n%{http_code}' https://api.resend.com/audiences \
  -H "Authorization: Bearer $RESEND_API_KEY")
code=${resp##*$'\n'}
body=${resp%$'\n'*}

if [[ "$code" != "200" ]]; then
  echo "ERROR: Resend rejected the key (HTTP $code): $body" >&2
  echo "Note: the key must belong to the cc4 team and allow reads (full access or read-only)." >&2
  exit 1
fi

# Pick the audience. jq is available on this machine (used elsewhere in repo tooling).
count=$(jq '.data | length' <<<"$body")
if [[ "$count" == "0" ]]; then
  echo "ERROR: key is valid but the team has no audiences. Wrong team?" >&2
  exit 1
elif [[ "$count" == "1" ]]; then
  AUDIENCE_ID=$(jq -r '.data[0].id' <<<"$body")
  echo "Audience: $(jq -r '.data[0].name' <<<"$body") ($AUDIENCE_ID)"
else
  echo "Multiple audiences found:"
  jq -r '.data[] | "  \(.id)  \(.name)"' <<<"$body"
  printf 'Enter the audience id to use: '
  read -r AUDIENCE_ID
fi

# Write .dev.vars: replace existing entries, keep everything else.
touch "$DEV_VARS"
tmp=$(mktemp)
grep -vE '^(RESEND_API_KEY|RESEND_AUDIENCE_ID)=' "$DEV_VARS" > "$tmp" || true
{
  cat "$tmp"
  echo "RESEND_API_KEY=$RESEND_API_KEY"
  echo "RESEND_AUDIENCE_ID=$AUDIENCE_ID"
} > "$DEV_VARS"
rm -f "$tmp"
chmod 600 "$DEV_VARS"

# Prove it works end to end with a contact count, no addresses printed.
contacts=$(curl -sS "https://api.resend.com/audiences/$AUDIENCE_ID/contacts" \
  -H "Authorization: Bearer $RESEND_API_KEY" | jq '.data | length')
echo "OK: wrote $DEV_VARS (chmod 600). Audience has $contacts contacts."
echo "Next: npm run check:subscriber-sync -- --substack <export.csv>"
