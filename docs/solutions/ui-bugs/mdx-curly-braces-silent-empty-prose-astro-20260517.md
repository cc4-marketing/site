---
title: "MDX silent empty prose: unescaped curly braces in lesson body parsed as JSX expression"
date: 2026-05-17
category: docs/solutions/ui-bugs/
module: Course Modules / MDX Lessons
problem_type: ui_bug
component: tooling
severity: high
symptoms:
  - "MDX lesson route returns HTTP 200 but renders an empty <article class=\"prose\">"
  - "No build error or dev-server warning logged"
  - "Other lesson routes render correctly; only the newly-added file is blank"
  - "Rendered HTML contains ~2 prose elements instead of the expected ~20+"
  - "File on disk has full frontmatter and 200+ lines of body content"
root_cause: wrong_api
resolution_type: code_fix
tags: [mdx, astro, curly-braces, jsx-expression, silent-failure, content-collections, authoring, lessons]
---

# MDX silent empty prose: unescaped curly braces in lesson body parsed as JSX expression

## Problem
A new MDX lesson rendered as **HTTP 200 with an empty `<article class="prose">`** — the route resolved, the layout shell mounted, but the body was silently dropped. No build or dev-server error appeared.

## Symptoms
- Route returns 200 OK, page title and chrome render normally.
- `<article class="prose">` is nearly empty (~2 elements vs. ~22 on a working lesson).
- No console error, no Astro/MDX warning in the dev server, no failed build.
- Other lessons in the same module render fine; only the offending file is blank.
- Frontmatter, imports, and component usage all look valid on inspection.

## What Didn't Work
- **Diffing frontmatter against a working lesson** — frontmatter was identical in shape; the bug was in the body.
- **Eyeballing for unclosed JSX / malformed components** — there were no custom components on the broken line; the trigger was plain narrative prose.
- **Searching for obvious MDX errors / dev-server logs** — MDX fails silently here, so log inspection yielded nothing.
- **Comparing file length / line count** — file looked "normal size," which masked the issue.

## Solution
Wrap the interpolation-like literal in inline code (backticks) so the curly braces become text inside a `<code>` element, not an MDX JSX expression.

```diff
- No "Dear {firstname}." A real sentence per row.
+ No `"Dear {firstname}."` A real sentence per row.
```

Equivalent alternative — escape the brace with a backslash:

```mdx
No "Dear \{firstname}." A real sentence per row.
```

After the fix the same route returned a full body (52 prose elements; all section headings present).

## Why This Works
MDX is **not** plain Markdown — anywhere in the markdown body, `{ ... }` is parsed as a **JSX expression** and `<Capital...>` is parsed as a **JSX/HTML element**. When MDX sees `{firstname}` in prose, it tries to evaluate `firstname` as a JS identifier in scope. The identifier is undefined, so MDX bails on rendering the rest of the document body — but the route, layout, and frontmatter still resolve, producing the silent **200 + empty prose** signature.

Wrapping the text in backticks turns it into an inline `<code>` node where braces are treated as literal characters. Backslash-escaping (`\{`) tells the MDX parser to treat that brace as a literal too. Either approach defuses the JSX trigger.

The same hazard applies to angle brackets: `<SHEET_ID>` in plain prose would be parsed as a JSX tag. Inside fenced code blocks (```` ``` ````) or inline backticks, both `{...}` and `<...>` are safe.

## Prevention
- **Author rule:** any literal `{placeholder}`, `{{var}}`, `<TOKEN>`, or template-like syntax in MDX body must live inside backticks or a fenced code block — or be backslash-escaped (`\{`, `\<`).
- **Spot the failure fast:** if a new lesson returns 200 but the page body looks empty, suspect an MDX JSX expression in prose before anything else.
- **Pre-commit grep** for risky interpolations in plain prose (run from repo root):

  ```bash
  grep -nE '\{[a-zA-Z_]' src/content/modules/**/*.mdx
  ```

  Review each hit: if it's inside backticks or a fenced code block it's safe; if it's bare prose, wrap it in backticks or escape the brace.

- **Also check for bare JSX-like tags** in prose:

  ```bash
  grep -nE '<[A-Za-z][A-Za-z0-9_]*' src/content/modules/**/*.mdx
  ```

  Anything that isn't an intentional component import or inside a code fence should be wrapped/escaped.

- **Optional CI guardrail:** add a build-time check that compiles every MDX file with MDX's strict mode and fails on undefined identifier references in expressions.

## Related Issues
- [`docs/solutions/ui-bugs/portabletext-missing-code-image-handlers-BlogPublisher-20260426.md`](portabletext-missing-code-image-handlers-BlogPublisher-20260426.md) — sibling "silent content-rendering failure" in a different pipeline (PortableText/blog); useful pattern reference for "rendered HTML doesn't match source."
- [`docs/solutions/seo-issues/faqpage-howto-schemas-lesson-descriptions-aeo-20260428.md`](../seo-issues/faqpage-howto-schemas-lesson-descriptions-aeo-20260428.md) — other doc touching lesson MDX authoring; helpful for authors landing here.
