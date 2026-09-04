# Phase 02: Backfill the stranded 130, make unsubscribe honest

Runs only after Phase 01 is verified live. Importing while the form still leaks means importing twice.

## Step 1: Regenerate the diff against fresh exports

The audit numbers are from 2026-08-28 exports. By the time this runs they are stale, and Phase 01 will have added people to both sides. Re-export both:

- Resend audience, or whatever produced `/tmp/cc4-subscribers-2026-08-28.csv`.
- Substack, Settings, Subscribers, Export.

Then diff. Emails must be lowercased and trimmed on both sides before comparing, which is exactly what Phase 03 automates. If Phase 03 is already built, use it here instead of a one-off.

The import set is: present in Resend, `unsubscribed=False`, absent from Substack. On the 2026-08-28 data that was 130 addresses, 49 of them from the previous 60 days.

The 8 addresses that are both missing from Substack and already unsubscribed in Resend do not get imported. They opted out.

## Step 2: Import to Substack by CSV

Substack, Settings, Subscribers, Import. Single `email` column, no header games, one address per line.

CSV import is the sanctioned path and it skips double opt-in, which the live endpoint may not. That is why the backfill uses import rather than looping the Phase 01 code over 130 addresses.

Do not import in one blind shot. Take 5 addresses first, confirm they land as free subscribers on the right section (`CC4.Marketing`), then do the rest. A bad import is tedious to unwind, Substack has no bulk delete worth using.

## Step 3: Decide what these people hear first

49 of the 130 signed up in the last 60 days and have received exactly one email, the Resend download link. The other 81 are up to five months cold and have heard nothing since.

Importing them means the next broadcast lands in an inbox that does not remember signing up. Expect complaints and spam marks, which is the one thing that can actually damage the sending reputation here.

So the first thing they receive should acknowledge it. Either:
- **Preferred:** hold the import until Phase 04's welcome email exists, then import and let the welcome fire. Cleanest story, and it is the same email new subscribers get.
- **Or:** import now and make the next broadcast open with one line naming the gap. Cheaper, but it spends goodwill on an apology instead of content.

This is the one place in the plan where the ordering is a judgement call rather than a dependency. Note the choice in the phase report.

## Step 4: Unsubscribe parity

Both directions currently leak:
- Unsubscribe via Resend's link writes `unsubscribed=True` in the audience. Substack never hears about it. `hanpris@gmail.com` and `chanderr1995@outlook.com` are the two known cases still receiving mail.
- Unsubscribe via Substack's footer removes them there. Resend still lists them as subscribed, so the download email path would happily mail them again.

There is no Substack write API for unsubscribes, so the automated half is detection, not action:

- Phase 03 reports both directions as named lists.
- Acting on the Substack side is manual: Subscribers, find address, remove. At current volume that is a handful per month, not a burden.
- Acting on the Resend side is scriptable: `PATCH https://api.resend.com/audiences/{id}/contacts/{id}` with `{ unsubscribed: true }`. Do this one in Phase 03 automatically, since it is a suppression and can only ever reduce sending. Never automate the reverse, resubscribing someone from a diff is how you mail people who opted out.

## Step 5: Clear the two known cases immediately

Do not wait for the tooling. Remove `hanpris@gmail.com` and `chanderr1995@outlook.com` from Substack now. They asked to stop hearing from you in April and still are.

## Acceptance

- Resend-opted-in minus Substack goes to zero, or to a list you can name and justify.
- The two known cases are gone from Substack.
- Every imported address is a free subscriber on the `CC4.Marketing` section.
- Phase report records the count imported, the date, and the Step 3 choice.
