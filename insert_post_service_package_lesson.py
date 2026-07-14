"""Sync the 'Service Package from a Real Engagement' lesson-launch post (byline: Alice Marketer)
in the Emdash D1 database.

First run inserted the post. The script now emits an UPDATE for the existing record
(SEO/AEO revision: question-form H2s, bullet lists, inline internal links, tighter
title and excerpt). Execute via:

    npx wrangler d1 execute cc4-emdash --remote --file=/tmp/update_service_package_post.sql
"""
import json
import secrets

POST_ID = "TD07D46FJZ763SW452M7I70NXE"  # existing ec_posts row
SLUG = "service-package-from-real-engagement"
LESSON_URL = "/modules/2/service-package-from-engagement/"
MODULES_URL = "/modules/"
CAMPAIGN_BRIEF_URL = "/modules/2/campaign-brief/"


def key() -> str:
    return secrets.token_hex(5)


def block(style: str, *parts) -> dict:
    """PortableText block. Each part: str, or (text, href), or (text, href, bold)."""
    mark_defs, children = [], []
    for p in parts:
        if isinstance(p, str):
            p = (p, None, False)
        text, href, bold = (p + (None, False))[:3] if isinstance(p, tuple) else (p, None, False)
        marks = []
        if href:
            k = key()
            mark_defs.append({"_type": "link", "_key": k, "href": href})
            marks.append(k)
        if bold:
            marks.append("strong")
        children.append({"_type": "span", "_key": key(), "text": text, "marks": marks})
    b = {"_type": "block", "_key": key(), "style": style, "children": children}
    if mark_defs:
        b["markDefs"] = mark_defs
    return b


def bullet(*parts) -> dict:
    b = block("normal", *parts)
    b["listItem"] = "bullet"
    b["level"] = 1
    return b


def code(code_text: str, language: str = "text") -> dict:
    return {"_type": "code", "_key": key(), "language": language, "code": code_text}


# --- The full copyable prompt ------------------------------------------------

FULL_PROMPT = """I'm turning a completed client engagement into a sellable service package.
Corpus: [POINT AT YOUR PROJECT FOLDER / EXPORT]

Work in four steps. Do not skip ahead.

STEP 1 - MINE. Read the whole corpus (including messy documents: disputes,
complaints, mid-flight fixes - those are the most valuable). Save a research
file covering: (1) service operations model - roles, cadence, tooling,
escalation, working-hours policy; (2) SLA & metrics evolution - contractual
targets vs. what the customer later demanded, and how each is measured;
(3) customer feedback - verbatim quotable praise, criticisms, what was fixed;
(4) results - concrete numbers with dates; (5) commercial model - pricing,
capacity unit, billing, contract lifecycle; (6) reusable assets - every
template, checklist, dashboard recipe worth productizing. Cite filenames.
No invented claims.

STEP 2 - DECIDE. Ask me, and wait for answers: target buyer (niche or broad)?
name the reference client or anonymize (default: anonymize)? which
deliverables first (blueprint / case study / landing page / deck / one-pager)?
language(s)? Then propose 3-5 service names with rationale and let me pick.

STEP 3 - BLUEPRINT. Write the internal service blueprint from the research
file: service definition with explicit out-of-scope; blueprint table (journey
stages Discover > Contract > Onboard > Operate > Review > Renew, crossed with
customer actions / frontstage / backstage / supporting systems); engagement
lifecycle with the de-risking spelled out as a selling point; operating model
with every LESSON from the engagement stated as a rule; onboarding playbook;
SLA and metrics catalog with measurement recipes; pricing tiers - the proven
price is fact, extrapolated tiers are marked "proposal - confirm with finance";
asset library; anonymized proof points. Written so a new PM could run a second
engagement from it alone. End with unresolved questions.

STEP 4 - DERIVE. From the blueprint produce an external offer sheet (the
single source of truth for marketing copy), then an anonymized case study
(context > challenge > solution > results table > quotes > CTA), then any
further assets I chose - all copy sourced from the offer sheet verbatim.

QUALITY GATES before showing me anything: grep every external file for
client/people/product names; verify numbers are identical across all assets;
verify generated files programmatically (page counts, slide bounds); list
every extrapolated or assumed figure under "unresolved questions"."""


# --- Content ------------------------------------------------------------------

content = [
    # Lede
    block("normal", "Your best sales asset is sitting in a project folder you already closed."),
    block(
        "normal",
        "We just shipped ",
        ("Module 2.7: Service Package from a Real Engagement", LESSON_URL),
        (
            ", and it exists because of a pattern we keep seeing. A company runs a genuinely "
            "good client engagement: SLAs hit, metrics improve month over month, a happy "
            "customer says quotable things in review meetings. Then the engagement ends, the "
            "folder gets archived, and the sales team goes back to pitching with adjectives."
        ),
    ),
    block(
        "normal",
        (
            "The proof, the process, and the pricing already exist. They are just buried in "
            "sprint reports and meeting notes. Reading and synthesizing a messy corpus is "
            "exactly what an agent is good at, which makes packaging a service a "
            "workflow-extraction problem, not a writing problem."
        ),
    ),

    # Section 1
    block("h2", "What does Module 2.7 teach?"),
    block("normal", "The practice is four steps. Each step feeds the next:"),
    bullet(
        ("Mine. ", None, True),
        (
            "The agent reads the whole project corpus and writes a research file where "
            "every claim cites a source document. No invented numbers."
        ),
    ),
    bullet(
        ("Decide. ", None, True),
        (
            "You answer five questions before anything gets written: target buyer, "
            "anonymization, deliverables, language, and service name."
        ),
    ),
    bullet(
        ("Blueprint. ", None, True),
        (
            "The agent writes the internal service blueprint: the operating manual a new "
            "project manager could run a second engagement from."
        ),
    ),
    bullet(
        ("Derive. ", None, True),
        (
            "Offer sheet, case study, landing page, deck. All marketing copy quotes one "
            "source of truth, so the numbers never drift."
        ),
    ),
    block(
        "normal",
        (
            "The counterintuitive part: the messy documents matter most. A dispute about "
            "out-of-hours work becomes a working-hours governance policy. A client complaint "
            "that led to a process fix becomes your most credible quality standard. Post-fix "
            "process beats marketing adjectives every time."
        ),
    ),

    # Section 2
    block("h2", "Why write the blueprint before the brochure?"),
    block(
        "normal",
        (
            "Asking an agent for “a landing page for our support service” gets you "
            "something plausible and unverifiable. The blueprint-first practice forces a "
            "citation chain: every marketing claim traces to the offer sheet, which traces to "
            "the blueprint, which traces to the research file, which cites project documents. "
            "When a prospect asks “is that number real?”, your salesperson has an answer."
        ),
    ),
    block(
        "normal",
        (
            "We ran this practice on a real production-support engagement while building the "
            "lesson. The proof band it produced:"
        ),
    ),
    bullet("Zero SLA breaches across 151 tickets in five months"),
    bullet("Product coverage grown from 2 to 9 apps"),
    bullet("Resolution rate up from 64% to 87%"),
    bullet("Zero negative CSAT"),
    block(
        "normal",
        "Every one of those numbers traces to a monthly report in the project folder.",
    ),

    # Section 3 - the prompt
    block("h2", "The full service package prompt"),
    block(
        "normal",
        (
            "Here is the whole practice as one prompt. Paste it into Claude Code at the root "
            "of any completed project's folder, point the first line at your export, and "
            "answer the questions when it stops to ask. It works in Claude web too if your "
            "corpus fits in the context window."
        ),
    ),
    code(FULL_PROMPT),
    block("normal", "Two habits make it work:"),
    bullet(
        ("Answer Step 2 in writing and make the agent wait. ", None, True),
        (
            "Regenerating everything because you changed the anonymization decision halfway "
            "is the most common failure."
        ),
    ),
    bullet(
        ("Keep the unresolved-questions list. ", None, True),
        (
            "An honest assumptions list is what separates a package you can sell from one "
            "you have to walk back."
        ),
    ),

    # CTA
    block("h2", "Try it in the course"),
    block(
        "normal",
        "The interactive version is live in the course: run /start-2-7 inside Claude Code "
        "and you'll package a service from the Planerio campaign work you built in ",
        ("Module 2's campaign brief lesson", CAMPAIGN_BRIEF_URL),
        (
            ". Then run the same practice on a real engagement at your own company. That "
            "second run is where it compounds."
        ),
    ),
    block(
        "normal",
        "Browse ",
        ("all course modules", MODULES_URL),
        ", or jump straight to the lesson: ",
        ("Module 2.7: Service Package from a Real Engagement", LESSON_URL),
        ".",
    ),
]

# --- Post record ----------------------------------------------------------------

title = "Turn a Client Engagement into a Sellable Service Package"
excerpt = (
    "Module 2.7 is live: a four-step prompt practice that turns a finished client "
    "engagement into a service blueprint, case study, and marketing kit."
)
updated_at = "2026-07-14T07:30:00.000Z"

content_json = json.dumps(content, ensure_ascii=False)


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


sql = f"""UPDATE ec_posts SET
    title = '{sql_escape(title)}',
    excerpt = '{sql_escape(excerpt)}',
    content = '{sql_escape(content_json)}',
    updated_at = '{updated_at}',
    version = version + 1
WHERE id = '{POST_ID}' AND slug = '{SLUG}';
"""

output_path = "/tmp/update_service_package_post.sql"
with open(output_path, "w") as f:
    f.write(sql)

assert len(title) <= 60, f"title too long: {len(title)}"
assert len(excerpt) <= 160, f"excerpt too long: {len(excerpt)}"

print(f"SQL written to {output_path}")
print(f"Post id: {POST_ID}")
print(f"Title ({len(title)} chars): {title}")
print(f"Excerpt ({len(excerpt)} chars): {excerpt}")
print(f"Content blocks: {len(content)}")
print(f"Internal links: {content_json.count('\"_type\": \"link\"') or content_json.count('_type": "link')}")
