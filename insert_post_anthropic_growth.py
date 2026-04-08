"""Insert the Anthropic growth marketing blog post into the Emdash D1 database.

Builds PortableText JSON content and outputs a SQL INSERT statement that can be
executed against the remote D1 database via:

    npx wrangler d1 execute cc4-emdash --remote --file=/tmp/insert_post.sql
"""
import json
import secrets
import string
from datetime import datetime, timezone


def gen_id(length: int = 26) -> str:
    """Generate a ULID-ish uppercase alphanumeric id similar to Emdash style."""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def key() -> str:
    """Generate a short hex _key for PortableText spans/blocks."""
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


# --- Content ---------------------------------------------------------------

content = [
    # Lede
    block("normal", "One person. Five channels. No engineering support. Ten months."),
    block(
        "normal",
        (
            "That's the structure Anthropic's Growth Marketing team ran on — paid search, "
            "paid social, app stores, email, and SEO — managed by a single non-technical hire "
            "using Claude Code for growth marketing workflows that would otherwise require a full team."
        ),
    ),
    block(
        "normal",
        (
            "The results aren't abstract. Ad creation: from two hours to fifteen minutes. "
            "Creative output: 10x more variations tested across channels. Tasks that traditionally "
            "needed dedicated engineering resources: handled without them."
        ),
    ),
    block("normal", "Here's how the system is built."),

    # Section 1
    block("h2", "Automated ad creative generation with Claude Code"),
    block(
        "normal",
        (
            "The process starts with a CSV export of existing ads and their performance data. "
            "Claude Code analyzes the file, identifies underperforming ads, and generates new "
            "copy variations — all within Google's strict formatting constraints."
        ),
    ),
    block(
        "normal",
        (
            "The design choice that matters: two specialized sub-agents rather than one. A "
            "headline agent (30-character limit) and a description agent (90-character limit) "
            "each handle their specific task. Splitting the work this way keeps each agent "
            "focused, which improves output quality and makes debugging straightforward. "
            "Hundreds of new ad variations generated in minutes."
        ),
    ),

    # Section 2
    block("h2", "Figma plugin for creative production at scale"),
    block(
        "normal",
        (
            "Text is only part of the ad. The visual creative — banners, social images, "
            "display formats — still needs to be produced."
        ),
    ),
    block(
        "normal",
        (
            "The team built a Figma plugin that identifies existing ad templates and "
            "programmatically swaps new headlines and descriptions across frames. Up to 100 "
            "variations per batch, generated in half a second. The hours previously spent "
            "duplicating frames and copy-pasting text manually now run automatically. Creative "
            "output scaled by 10x without adding a designer."
        ),
    ),

    # Section 3
    block("h2", "Meta Ads analytics, surfaced directly in Claude"),
    block(
        "normal",
        (
            "Campaign data used to mean dashboard-switching: open Meta Ads Manager, pull "
            "reports, interpret numbers, return to work. The team eliminated that friction by "
            "building an MCP server integrated with the Meta Ads API."
        ),
    ),
    block(
        "normal",
        (
            "Now campaign performance, spend data, and ad effectiveness are queryable directly "
            "inside Claude Desktop. Ask which ads converted best this week. Ask where spend is "
            "being wasted. Get real answers from live data without leaving the working environment."
        ),
    ),

    # Section 4
    block("h2", "The memory system that closes the loop"),
    block(
        "normal",
        "Each of the above systems generates results. The memory layer captures them.",
    ),
    block(
        "normal",
        (
            "The team implemented a logging system that records hypotheses and experiment "
            "results across ad iterations. When generating the next batch of variations, "
            "Claude pulls previous test results into context — what worked, what didn't, "
            "what to try next. The system refines its own output over time."
        ),
    ),
    block(
        "normal",
        (
            "Systematic experimentation across hundreds of ads, tracked automatically. That's "
            "the work of an analytics function built into the workflow itself."
        ),
    ),

    # Section 5 (closer)
    block("h2", "The design principle behind Claude Code for growth marketing"),
    block(
        "normal",
        (
            "Every piece of this system follows the same logic: find a repetitive task, "
            "locate the API, build a structured workflow around it."
        ),
    ),
    block(
        "normal",
        (
            "The tools — Claude Code, Figma's API, Meta's API — aren't the story. The approach "
            "is. Break complex workflows into specialized agents. Brainstorm the full process "
            "before writing a line of code. Work step by step rather than asking for one-shot "
            "solutions."
        ),
    ),
    block(
        "normal",
        (
            "A non-technical marketer built an infrastructure that runs like a larger team. "
            "The constraint wasn't technical skill. It was identifying where to start."
        ),
    ),

    # CTA
    block("h2", "Learn the workflow yourself"),
    block(
        "normal",
        (
            "CC4.Marketing is a free interactive course that teaches non-technical marketers "
            "how to use Claude Code for exactly these kinds of workflows — campaign briefs, "
            "ad creative generation, analytics, and memory-driven iteration. The course runs "
            "inside Claude Code itself. No coding experience required."
        ),
    ),
    block("normal", "Start the course at cc4.marketing."),
]

# --- Post record -----------------------------------------------------------

post_id = gen_id(26)
slug = "anthropic-growth-marketing-claude-code"
title = "How Anthropic's Growth Marketing Team Uses Claude Code to 10x Output"
excerpt = (
    "Inside Anthropic's one-person growth marketing team — how a single non-technical hire "
    "used Claude Code to automate five channels, 10x ad creative, and run a full growth "
    "function without engineering support."
)
published_at = "2026-04-09T09:00:00.000Z"

featured_image = {
    "id": "cover-3",
    "src": "/blog/cover-anthropic-growth-marketing.png",
    "alt": (
        "Editorial illustration showing a single marketer operating five channels through "
        "Claude Code, with a grid of 15 ad variation cards and badges reading 10x more "
        "variations, 2 hours to 15 minutes, and 10 months"
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
    published_at, created_at, updated_at, version, locale
) VALUES (
    '{post_id}',
    '{slug}',
    'published',
    '{sql_escape(title)}',
    '{sql_escape(featured_json)}',
    '{sql_escape(content_json)}',
    '{sql_escape(excerpt)}',
    '{published_at}',
    '{published_at}',
    '{published_at}',
    1,
    'en'
);
"""

output_path = "/tmp/insert_anthropic_growth_post.sql"
with open(output_path, "w") as f:
    f.write(sql)

print(f"SQL written to {output_path}")
print(f"Post id: {post_id}")
print(f"Slug: {slug}")
print(f"Title: {title}")
print(f"Content blocks: {len(content)}")
print(f"Content JSON length: {len(content_json)}")
