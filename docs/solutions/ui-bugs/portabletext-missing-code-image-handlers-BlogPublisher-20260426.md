---
module: Blog Publisher
date: 2026-04-26
problem_type: ui_bug
component: rails_view
symptoms:
  - "Fenced code blocks rendered with visible backticks; # comment lines became h2 headings"
  - "![alt](url) images rendered as !<a href> links instead of <img> tags"
root_cause: logic_error
resolution_type: code_fix
severity: high
tags: [portabletext, markdown-parser, code-blocks, images, astro, emdash, blog-renderer]
---

## Problem

After publishing a blog post containing fenced code blocks and inline images, the live page rendered them incorrectly:

1. **Code blocks**: Opening/closing ` ``` ` fences appeared as literal text. Lines starting with `#` inside the fence (bash comments) were converted to `<h2>` headings. Multi-line commands appeared as separate paragraphs.

2. **Images**: Markdown `![alt](url)` rendered as `!<a href="/url">alt text</a>` — a plain text `!` followed by a link — no `<img>` tag at all.

The result was an unreadable post with broken structure.

## Root Cause

`markdown_to_portable_text()` in `publish_post.py` had no handlers for:
- Fenced code blocks (`` ``` ``) — fell through to the paragraph accumulator, which then picked up `#` lines as headings
- Standalone image syntax (`![alt](url)`) — the `!` was emitted as plain text and `[alt](url)` was parsed as a regular link

Additionally, the `PortableText` component from `emdash/ui` only renders standard `_type: "block"` nodes (`normal`, `h2`, `h3`, `blockquote`). Any custom block types passed to it are silently ignored — so even if the parser emitted a `_type: "code"` block, the bare `<PortableText>` component would not render it.

## Solution

### 1. Fix `publish_post.py` — add fenced code and image handlers

In `markdown_to_portable_text()`, add these handlers **before** the paragraph accumulator:

```python
# Fenced code block
if stripped.startswith("```"):
    lang = stripped[3:].strip() or "text"
    code_lines = []
    i += 1
    while i < len(lines) and not lines[i].strip().startswith("```"):
        code_lines.append(lines[i])
        i += 1
    i += 1  # skip closing ```
    blocks.append({
        "_type": "code",
        "_key": gen_key(),
        "language": lang,
        "code": "\n".join(code_lines),
    })
    continue

# Standalone image line
img_match = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)$", stripped)
if img_match:
    blocks.append({
        "_type": "blogImage",
        "_key": gen_key(),
        "url": img_match.group(2),
        "alt": img_match.group(1),
    })
    i += 1
    continue
```

Also extend the paragraph stop-condition to break on lines starting with `` ``` `` or `![`:

```python
or nxt.startswith("```")
or re.match(r"^!\[", nxt)
```

### 2. Create `BlogContent.astro` — custom renderer for code and image blocks

`src/components/BlogContent.astro` groups the content array into segments: consecutive `_type: "block"` blocks are passed to `<PortableText>` (preserving list grouping), while custom types are rendered directly:

```astro
---
import { PortableText } from 'emdash/ui';
const { blocks } = Astro.props;

const segments = [];
let current = [];

for (const block of blocks) {
  if (block._type === 'code') {
    if (current.length) { segments.push({ kind: 'portable', blocks: current }); current = []; }
    segments.push({ kind: 'code', language: block.language || 'text', code: block.code, key: block._key });
  } else if (block._type === 'blogImage') {
    if (current.length) { segments.push({ kind: 'portable', blocks: current }); current = []; }
    segments.push({ kind: 'image', url: block.url, alt: block.alt || '', key: block._key });
  } else {
    current.push(block);
  }
}
if (current.length) segments.push({ kind: 'portable', blocks: current });
---

{segments.map((seg) => {
  if (seg.kind === 'code') return <pre><code class={`language-${seg.language}`}>{seg.code}</code></pre>;
  if (seg.kind === 'image') return <figure class="blog-inline-image"><img src={seg.url} alt={seg.alt} loading="lazy" /></figure>;
  return <PortableText value={seg.blocks} />;
})}
```

### 3. Update `[slug].astro` to use BlogContent

```astro
// Before
import { PortableText, Image } from 'emdash/ui';
// ...
{post.data.content && <PortableText value={post.data.content} />}

// After
import BlogContent from '../../components/BlogContent.astro';
// ...
{post.data.content && <BlogContent blocks={post.data.content} />}
```

### 4. Re-insert the affected post

The bad PortableText was already stored in D1. Delete and re-insert:

```bash
npx wrangler d1 execute cc4-emdash --remote --command \
  "DELETE FROM _emdash_content_bylines WHERE content_id=(SELECT id FROM ec_posts WHERE slug='<slug>'); \
   DELETE FROM ec_posts WHERE slug='<slug>';"

uv run python .claude/skills/publish-post/publish_post.py <file>.md --execute
```

## What Didn't Work

- Hoping `<PortableText>` would silently ignore unknown block types and fall through — it does ignore them, but that means images and code blocks simply don't appear at all (or they appear garbled because the parser emitted the wrong block types)

## Prevention

- **Always test with a post that has code fences and images before shipping to production** — the dry-run only validates frontmatter and slug availability, not content rendering
- When adding new markdown constructs to posts, verify the parser emits the correct block type AND that the renderer handles it
- `emdash/ui`'s `PortableText` is a black box — assume it only handles the standard Sanity block types; wrap it with a custom renderer for any non-standard content
- The paragraph accumulator in `publish_post.py` is greedy — any unrecognized line gets absorbed into it. Always add explicit stop-conditions when introducing new block-level syntax

## Checklist

- [ ] `publish_post.py` handles ` ``` ` fences → `_type: "code"` block
- [ ] `publish_post.py` handles `![alt](url)` → `_type: "blogImage"` block
- [ ] `publish_post.py` paragraph stop-condition includes `` ` `` `` ` `` ` `` and `![`
- [ ] `BlogContent.astro` exists and renders code/image segments
- [ ] `[slug].astro` uses `<BlogContent>` instead of bare `<PortableText>`
- [ ] Any post with bad PortableText has been deleted from D1 and re-inserted

## Related

- `publish_post.py` → `markdown_to_portable_text()` function (~line 271)
- `src/components/BlogContent.astro` — the custom renderer
- `src/pages/blog/[slug].astro` — updated to use BlogContent
- [Emdash D1 blog post publishing workflow](../integration-issues/emdash-d1-blog-post-publishing-workflow.md) — full publishing reference
- [Critical Patterns #1 & #2](../patterns/cora-critical-patterns.md) — promoted to Required Reading
