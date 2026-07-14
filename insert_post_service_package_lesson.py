"""Insert the 'Service Package from a Real Engagement' lesson-launch post (byline: Alice Marketer)
into the Emdash D1 database.

Builds PortableText JSON content and outputs a SQL INSERT statement that can be
executed against the remote D1 database via:

    npx wrangler d1 execute cc4-emdash --remote --file=/tmp/insert_service_package_post.sql
"""
import json
import secrets
import string


def gen_id(length: int = 26) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def key() -> str:
    return secrets.token_hex(5)


def block(style: str, text: str) -> dict:
    return {
        "_type": "block",
        "_key": key(),
        "style": style,
        "children": [
            {"_type": "span", "_key": key(), "text": text},
        ],
    }


def code(code_text: str, language: str = "text") -> dict:
    return {
        "_type": "code",
        "_key": key(),
        "language": language,
        "code": code_text,
    }


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
    block("normal", "Your best sales asset is sitting in a project folder you've already closed."),
    block(
        "normal",
        (
            "We just shipped a new lesson - Module 2.7: Service Package from a Real Engagement - "
            "and it exists because of a pattern we keep seeing. Companies run a genuinely good "
            "client engagement: SLAs hit, metrics improving month over month, a happy customer "
            "saying quotable things in review meetings. Then the engagement ends, the folder gets "
            "archived, and the sales team goes back to pitching with adjectives."
        ),
    ),
    block(
        "normal",
        (
            "The proof, the process, and the pricing already exist. They're just buried in sprint "
            "reports and meeting notes. Reading and synthesizing a messy corpus is exactly what an "
            "agent is good at - which makes packaging a service a workflow-extraction problem, "
            "not a writing problem."
        ),
    ),

    # Section 1
    block("h2", "What the new lesson teaches"),
    block(
        "normal",
        (
            "The practice is four steps: mine, decide, blueprint, derive. The agent mines the "
            "project corpus into a research file with every claim cited to a source document. You "
            "make five decisions before anything gets written - target buyer, anonymization, "
            "deliverables, language, service name. The agent then writes an internal service "
            "blueprint (the operating manual a new project manager could run a second engagement "
            "from), and only then derives the marketing: offer sheet, case study, landing page, "
            "deck, one-pager - all quoting one source of truth so the numbers never drift."
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
    block("h2", "Why blueprint-first beats brochure-first"),
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
            "lesson. The proof band it produced: zero SLA breaches across 151 tickets in five "
            "months, product coverage grown from 2 to 9 apps, resolution rate up from 64% to 87%, "
            "zero negative CSAT. Every one of those numbers traces to a monthly report in the "
            "project folder."
        ),
    ),

    # Section 3 - the prompt
    block("h2", "The full prompt"),
    block(
        "normal",
        (
            "Here's the whole practice as one prompt. Paste it into Claude Code at the root of "
            "any completed project's folder, point the first line at your export, and answer the "
            "questions when it stops to ask. It works in Claude web too if your corpus fits in "
            "the context window."
        ),
    ),
    code(FULL_PROMPT),
    block(
        "normal",
        (
            "Two habits make it work. First: answer Step 2 in writing and make the agent wait - "
            "regenerating everything because you changed the anonymization decision halfway is "
            "the most common failure. Second: don't delete the unresolved-questions list from "
            "the output. An honest assumptions list is what separates a package you can sell "
            "from one you have to walk back."
        ),
    ),

    # CTA
    block("h2", "Try it in the course"),
    block(
        "normal",
        (
            "The interactive version is live in the course repo: run /start-2-7 inside Claude "
            "Code and you'll package a service from the Planerio campaign work you built in "
            "Module 2 - then run the same practice on a real engagement at your own company. "
            "That second run is where it compounds."
        ),
    ),
    block("normal", "Start at cc4.marketing, or jump straight to the lesson page: Module 2.7 - Service Package from a Real Engagement."),
]

# --- Post record ----------------------------------------------------------------

post_id = gen_id(26)
slug = "service-package-from-real-engagement"
title = "New Lesson: Turn a Finished Client Engagement into a Sellable Service Package"
excerpt = (
    "Module 2.7 is live - a four-step practice (mine, decide, blueprint, derive) for turning "
    "a completed engagement's project folder into a service blueprint, case study, and "
    "marketing kit. Includes the full prompt to copy."
)
published_at = "2026-07-14T09:00:00.000Z"
alice_byline_id = "01BYLINEALICE00001"

featured_image = {
    "id": "cover-service-package",
    "src": "/blog/cover-service-package-lesson.png",
    "alt": (
        "Editorial illustration of a project folder transforming into a service blueprint, "
        "case study, and landing page, with a proof band reading zero SLA breaches across "
        "151 tickets"
    ),
    "width": 1200,
    "height": 630,
}

content_json = json.dumps(content, ensure_ascii=False)
featured_json = json.dumps(featured_image, ensure_ascii=False)


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


sql = f"""INSERT INTO ec_posts (
    id, slug, status, title, featured_image, content, excerpt,
    primary_byline_id, published_at, created_at, updated_at, version, locale
) VALUES (
    '{post_id}',
    '{slug}',
    'published',
    '{sql_escape(title)}',
    '{sql_escape(featured_json)}',
    '{sql_escape(content_json)}',
    '{sql_escape(excerpt)}',
    '{alice_byline_id}',
    '{published_at}',
    '{published_at}',
    '{published_at}',
    1,
    'en'
);
"""

output_path = "/tmp/insert_service_package_post.sql"
with open(output_path, "w") as f:
    f.write(sql)

print(f"SQL written to {output_path}")
print(f"Post id: {post_id}")
print(f"Slug: {slug}")
print(f"Byline: {alice_byline_id} (Alice Marketer)")
print(f"Content blocks: {len(content)}")
print(f"Content JSON length: {len(content_json)}")
