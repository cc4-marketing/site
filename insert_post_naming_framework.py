"""Insert the "how I named a B2B/PMO event" blog post into the Emdash D1 database.

Builds PortableText JSON content and outputs a SQL INSERT statement, executed via:

    npx wrangler d1 execute cc4-emdash --remote --file=/tmp/insert_post_naming_framework.sql

NOT RUN YET — draft only. See the bottom of this file for the exact commands.
"""
import json
import secrets
import string
from datetime import datetime, timezone


def gen_id(length: int = 26) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


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


def image(url: str, alt: str) -> dict:
    return {"_type": "blogImage", "_key": key(), "url": url, "alt": alt}


def code(code_text: str, language: str = "bash") -> dict:
    return {"_type": "code", "_key": key(), "language": language, "code": code_text}


def table(headers: list, rows: list, caption: str = None) -> dict:
    return {"_type": "table", "_key": key(), "headers": headers, "rows": rows, "caption": caption}


# --- Content ---------------------------------------------------------------

content = [
    block("normal", "I almost named an AI-powered PMO event “Lodestar.”"),
    block(
        "normal",
        (
            "It sounded great on its own. Sailors used a lodestar to navigate before "
            "compasses existed, so the metaphor tracked: align, predict, optimize, all in "
            "one word. I had a naming tool built for exactly this kind of story-driven name, "
            "and it delivered."
        ),
    ),
    block(
        "normal",
        (
            "Then I remembered who was actually going to read it: PMO leads at a B2B "
            "company, deciding in about two seconds whether a Tuesday-afternoon session was "
            "worth their calendar. Nobody registers for “Lodestar.” They register for "
            "something that sounds like it fixes their Monday."
        ),
    ),
    block(
        "normal",
        (
            "Here's the 5-round process that got me from Lodestar to the name that actually "
            "shipped, "
        ),
        ("AI-Powered PMO: Align. Predict. Optimize.", "https://cc4.marketing/library/content/b2b-enterprise-naming/"),
        (
            ", and the free Claude Code skill I built afterward so I don't have to redo "
            "this by hand next time."
        ),
    ),

    block("h2", "Round 1: let the myth fail first, on purpose"),
    block(
        "normal",
        (
            "My default naming tool leans mythic — feed it a brief, it hands back names "
            "with a story behind them. For a consumer brand that's often exactly right. I ran "
            "the PMO event through it anyway, first pass, no filter, just to see what came out."
        ),
    ),
    block(
        "normal",
        (
            "It handed back Lodestar, Wayfinder, Helm. Each one had a clean narrative: a "
            "lodestar guides ships, a wayfinder reads stars and currents, a helm steers. Good "
            "names, on paper."
        ),
    ),
    image(
        "/blog/naming-illus-myth-too-big.jpg",
        "An ornate, star-covered banner unrolling above a small plain office doorway, too wide and tall to fit through the frame",
    ),
    block(
        "normal",
        (
            "The problem showed up the moment I said them out loud in the context they'd "
            "actually live in: a subject line, a event banner, a name badge at registration. A "
            "PMO director skimming an inbox doesn't have time to learn a metaphor before "
            "deciding whether a session is worth 45 minutes. Myth-first names ask the reader "
            "to do work before you've earned it."
        ),
    ),

    block("h2", "Round 2: overcorrect, and watch it go flat"),
    block(
        "normal",
        (
            "Next round, I swung the other way as hard as I could: strip out every trace of "
            "story, use only plain B2B vocabulary. AI-Powered PMO. Enterprise Project "
            "Intelligence. Smart Project Delivery."
        ),
    ),
    image(
        "/blog/naming-illus-generic-invisible.jpg",
        "A plain flat nameplate sign mounted on a wall painted the exact same color, nearly disappearing into it, only a faint seam outline visible",
    ),
    block(
        "normal",
        (
            "Safe. Also forgettable. Every one of those phrases could describe a dozen "
            "different products at a dozen different companies. Nothing in them said "
            "“this one, not that one.” Generic isn't the opposite of a bad name, it's a "
            "different way of failing: instead of asking the reader to work too hard, it "
            "gives them nothing to hold onto at all."
        ),
    ),

    block("h2", "Round 3: borrow a term that already has a job"),
    block(
        "normal",
        (
            "The actual unlock came from a third direction: instead of inventing a metaphor "
            "or deleting every trace of one, I went looking for a word some other industry "
            "had already loaded with the exact meaning I needed."
        ),
    ),
    block(
        "normal",
        (
            "Control Tower. It's a real term out of supply chain and IT operations, and it "
            "already means something specific: real-time visibility across a lot of moving "
            "parts, plus the authority to act on what you see. I didn't have to explain it. "
            "The audience already knew it from vendor demos and ops dashboards."
        ),
    ),
    image(
        "/blog/naming-illus-control-tower-borrow.jpg",
        "A ground-crew silhouette carrying a small airport control tower, radar dish on top, and setting it down onto a lectern to serve as its nameplate",
    ),
    block(
        "normal",
        (
            "One borrowed term did more work than either the myth or the generic label. It "
            "read as B2B without reading as boring, and it didn't need a footnote to land."
        ),
    ),

    block("h2", "Round 4: dial it to who's actually in the room"),
    block(
        "normal",
        (
            "Control Tower still wasn't quite right, and it took a minute to name why: it's "
            "an executive word. It assumes someone with portfolio-level authority, the kind "
            "of person who says “visibility” unprompted in a meeting."
        ),
    ),
    block(
        "normal",
        (
            "The actual audience skewed mid-level: PMO leads managing delivery day to day, "
            "not VPs setting quarterly strategy. For them, Control Tower read one size too "
            "big, the same failure as Lodestar, just quieter. I dialed back to plainer nouns "
            "tied to what they do every day: Project, Delivery."
        ),
    ),

    block("h2", "Round 5: score it, don't vibe it"),
    block(
        "normal",
        (
            "By round 5 I had a real shortlist and no more gut feel left to spend. So I "
            "built a scoring matrix instead — five questions, each candidate rated 1 to 5:"
        ),
    ),
    bullet(("Short", None, True), " — is the core name itself compact, not counting the subtitle"),
    bullet(("B2B-aware", None, True), " — does it read as enterprise software, not consumer marketing"),
    bullet(("Domain-related", None, True), " — does it clearly say PMO, or is it broadened on purpose"),
    bullet(("Easy and not too broad", None, True), " — could it be mistaken for an unrelated product category"),
    bullet(("Not too distant or strange", None, True), " — does it need an explainer sentence to land"),
    block("normal", "Here's the actual shortlist, scored 1 to 5 on each axis:"),
    table(
        headers=["Candidate", "Short", "B2B-aware", "Domain-related", "Not too broad", "Not too strange", "Total"],
        rows=[
            ["Enterprise Project Intelligence", "3", "5", "3", "3", "5", "19"],
            ["Smarter PMO", "5", "4", "5", "4", "5", "23"],
            ["Smart Project Delivery", "4", "3", "2", "4", "5", "18"],
            ["Augmented Project Delivery", "2", "4", "2", "3", "3", "14"],
            ["AI-Powered PMO", "4", "4", "5", "5", "5", "23"],
            ["AI-Driven PMO", "4", "4", "5", "5", "5", "23"],
            ["Project Intelligence", "5", "4", "3", "3", "5", "20"],
        ],
        caption="1 = weakest, 5 = strongest on that axis. Total out of 25.",
    ),
    image(
        "/blog/naming-illus-scoring-scale.jpg",
        "A two-pan balance scale: one pan holds a single heavy star-shaped tag, the other holds five small square tags and is sinking lower with a checkmark glowing above it",
    ),
    block(
        "normal",
        (
            "AI-Powered PMO: Align. Predict. Optimize. tied for the top score with two other "
            "candidates, Smarter PMO and AI-Driven PMO, all at 23 out of 25. The tiebreaker "
            "wasn't taste — it was the Domain-related column, the one question none of the "
            "earlier rounds had a rubric for: does this audience actually work in a PMO, or "
            "does baking that word into the name narrow the room. For this event, the answer "
            "was yes, they do. That's the deciding factor a scoring matrix catches and a gut "
            "check doesn't."
        ),
    ),

    block("h2", "The framework, packaged"),
    block(
        "normal",
        (
            "Five rounds is a lot to redo by hand every time a naming brief lands on my "
            "desk. So the process is now a free Claude Code skill, b2b-enterprise-naming:"
        ),
    ),
    code(
        "git clone https://github.com/cc4-marketing/marketing-library\ncp -r "
        "marketing-library/content/b2b-enterprise-naming ~/.claude/skills/",
        "bash",
    ),
    block(
        "normal",
        (
            "It runs the same five rounds automatically: starts from your brief, sources "
            "from two vocabulary lanes (plain category words and a short glossary of "
            "borrowed terms like Control Tower), builds Core Name plus Subtitle candidates, "
            "and scores the shortlist on the same five-question matrix. Full skill file and "
            "install instructions: "
        ),
        ("cc4.marketing/library/content/b2b-enterprise-naming", "https://cc4.marketing/library/content/b2b-enterprise-naming/"),
        ".",
    ),

    block("h2", "Common Questions"),

    block("h3", "How do you know when to borrow an industry term instead of using plain language?"),
    block(
        "normal",
        (
            "When the plain version reads flat and forgettable, but a full myth would be "
            "overkill for a B2B audience. A borrowed term like Control Tower or Command "
            "Center works because the audience already knows what it means from another "
            "context, so it adds specificity without adding a story you have to explain."
        ),
    ),

    block("h3", "What's the real difference between a story-driven name and a B2B name?"),
    block(
        "normal",
        (
            "A story-driven name asks the reader to learn a metaphor before it pays off, "
            "which is fine when the audience has time to fall in love with a brand. A B2B "
            "name has to work in the two seconds someone spends deciding whether to open an "
            "email or register for a session — it needs to read as exactly what it is, "
            "on first pass, with zero required backstory."
        ),
    ),

    block("h3", "Does a five-axis scoring matrix actually beat gut feel?"),
    block(
        "normal",
        (
            "It doesn't replace judgment, it forces the judgment you'd make anyway into "
            "the open where you can compare candidates on the same terms. The real value "
            "showed up at the tiebreaker: two names scored identically on taste, and the "
            "matrix's domain-related question was the only thing that actually decided "
            "between them."
        ),
    ),

    block("h3", "Can I use this framework for a product name instead of an event?"),
    block(
        "normal",
        (
            "Yes — the same five rounds apply to internal platforms, corporate campaigns, "
            "or any B2B product where the buyer is a business function rather than a "
            "consumer. The b2b-enterprise-naming skill takes any naming brief, not just "
            "events."
        ),
    ),
]

featured_image = {
    "id": "cover-b2b-naming-framework",
    "src": "/blog/cover-b2b-naming-framework.jpg",
    "alt": (
        "A dressmaker silhouette tailoring an oversized star-covered banner sign down to a "
        "small, correctly sized plain nameplate on a dress form"
    ),
    "width": 1200,
    "height": 630,
}

post_id = gen_id()
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

# Title leads with the search-intent phrase (see merge-campaign script's note on
# [slug].astro deriving <meta keywords> from the first 6 non-stopword title words).
title = "How to Name a B2B Product or Enterprise Event: A 5-Round Framework"
slug = "almost-named-my-pmo-event-lodestar"
excerpt = (
    "I almost named an AI-powered PMO event Lodestar. Here's the 5-round framework that "
    "saved it, the free Claude Code skill it turned into, and the tiebreaker that had "
    "nothing to do with taste."
)


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


content_json = json.dumps(content, ensure_ascii=False)
featured_image_json = json.dumps(featured_image, ensure_ascii=False)

byline_id = "01BYLINETRIVO0001"
content_byline_id = gen_id()

sql = f"""INSERT INTO ec_posts
  (id, slug, status, published_at, locale, version, title, featured_image, content, excerpt)
VALUES
  ('{post_id}', '{slug}', 'published', '{now}', 'en', 1,
   '{sql_escape(title)}',
   '{sql_escape(featured_image_json)}',
   '{sql_escape(content_json)}',
   '{sql_escape(excerpt)}');

INSERT INTO _emdash_content_bylines
  (id, collection_slug, content_id, byline_id, sort_order, created_at)
VALUES
  ('{content_byline_id}', 'posts', '{post_id}', '{byline_id}', 0, '{now}');
"""

if __name__ == "__main__":
    with open("/tmp/insert_post_naming_framework.sql", "w") as f:
        f.write(sql)
    print(f"Wrote /tmp/insert_post_naming_framework.sql")
    print(f"slug: {slug}")
    print(f"id: {post_id}")
    print()
    print("NOT executed. To publish for real:")
    print("  1. Cover + inline illustrations generated via gen-image skill, copied to public/blog/")
    print("  2. npx wrangler d1 execute cc4-emdash --remote --file=/tmp/insert_post_naming_framework.sql")
    print("  3. Commit public/blog/ image files, push, deploy (sitemap/OG data auto-sync on prebuild)")
