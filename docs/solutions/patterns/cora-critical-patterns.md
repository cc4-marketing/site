# Critical Patterns — Required Reading

These patterns must be followed every time. Each was discovered the hard way and caused broken behavior in production.

---

## 1. Always use BlogContent instead of bare PortableText for blog posts (ALWAYS REQUIRED)

### ❌ WRONG (images and code blocks silently broken or missing)

```astro
{post.data.content && <PortableText value={post.data.content} />}
```

### ✅ CORRECT

```astro
{post.data.content && <BlogContent blocks={post.data.content} />}
```

**Why:** `emdash/ui`'s `PortableText` only renders standard `_type: "block"` nodes. Custom types emitted by `publish_post.py` — `_type: "code"` (fenced code blocks) and `_type: "blogImage"` (inline images) — are silently ignored. `BlogContent.astro` routes these to `<pre><code>` and `<figure><img>` respectively, then passes standard blocks to `PortableText`.

**Placement/Context:** `src/pages/blog/[slug].astro` — the content render line. Never revert to bare `<PortableText value={post.data.content} />`.

**Documented in:** `docs/solutions/ui-bugs/portabletext-missing-code-image-handlers-BlogPublisher-20260426.md`

---

## 2. publish_post.py must handle fenced code blocks and images before the paragraph accumulator (ALWAYS REQUIRED)

### ❌ WRONG (code fences fall through to paragraph; # comments become headings)

```python
# No handler for ``` or ![]() — falls through to paragraph accumulator
# Result: backticks appear literally, # lines become <h2> headings
blocks.append(_build_block("normal", " ".join(para_lines)))
```

### ✅ CORRECT

```python
# Fenced code block — MUST come before paragraph accumulator
if stripped.startswith("```"):
    lang = stripped[3:].strip() or "text"
    code_lines = []
    i += 1
    while i < len(lines) and not lines[i].strip().startswith("```"):
        code_lines.append(lines[i])
        i += 1
    i += 1
    blocks.append({"_type": "code", "_key": gen_key(), "language": lang, "code": "\n".join(code_lines)})
    continue

# Standalone image — MUST come before paragraph accumulator
img_match = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)$", stripped)
if img_match:
    blocks.append({"_type": "blogImage", "_key": gen_key(), "url": img_match.group(2), "alt": img_match.group(1)})
    i += 1
    continue
```

**Why:** The paragraph accumulator is greedy — any unrecognized line is absorbed into it. Lines starting with `#` inside a code block get picked up by the heading handler; the opening/closing backtick lines appear as inline code. Images become `!` (plain text) + `[alt](url)` (parsed as a link).

**Placement/Context:** `publish_post.py` → `markdown_to_portable_text()` function. Both handlers must appear in order before the paragraph block at the bottom of the loop.

**Documented in:** `docs/solutions/ui-bugs/portabletext-missing-code-image-handlers-BlogPublisher-20260426.md`
