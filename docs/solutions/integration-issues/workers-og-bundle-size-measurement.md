---
date: 2026-04-15
topic: workers-og bundle size + runtime validation
plan: docs/plans/2026-04-15-001-feat-og-image-engine-plan.md
phase: Phase 0 spike
outcome: GO — proceed with workers-og hybrid architecture
---

# `workers-og` on Cloudflare Workers — Bundle Size & Runtime Validation

## Purpose

Phase 0 decision gate for the OG Image Engine plan. Answers: can `workers-og` (Satori + resvg-wasm) run on Cloudflare Workers within bundle-size limits for the cc4.marketing Astro 6 SSR site, and does it render our brand typography correctly?

## Measurements

Baseline vs. spike endpoint (`src/pages/og/spike.png.ts`) using three bundled fonts: Righteous Regular (42 KB TTF), Outfit Regular (18 KB WOFF), Outfit Bold (18 KB WOFF) = **78 KB of fonts**.

| Metric | Baseline (no OG) | With `workers-og` spike | Delta |
|---|---|---|---|
| Uncompressed worker bundle | 5,589 KiB | 7,849 KiB | **+2,260 KiB** |
| Gzipped upload size | 1,068 KiB | 1,837 KiB | **+769 KiB** |
| Module count | 292 | 295 | +3 |
| Spike chunk (`spike_*.mjs`) | — | 830 KiB | — (includes resvg-wasm base64-inlined) |

**Verdict:** gzipped bundle size is well under Cloudflare's Workers limits:
- Free tier: 3 MB compressed → 1,837 KiB = **61% of ceiling** ✓
- Paid tier: 10 MB compressed → 1,837 KiB = **18% of ceiling** ✓

## Runtime Validation

Spike endpoint tested via `wrangler dev --port 8789 --local`:

```
$ curl -I http://localhost:8789/og/spike.png
HTTP/1.1 200 OK
Content-Type: image/png
Cache-Control: public, immutable, no-transform, max-age=31536000

$ file /tmp/spike.png
/tmp/spike.png: PNG image data, 1200 x 630, 8-bit/color RGBA, non-interlaced
```

Output: 26 KB PNG, correct dimensions, clean render of Righteous + Outfit typography with brand palette (cream/rust/plum/mustard, hard shadows, 3px charcoal borders).

## Key Findings & Gotchas

### 1. WOFF2 not supported by Satori — use WOFF or TTF

- Google Fonts CSS only serves WOFF2 today, even to legacy User-Agents.
- **Workaround:** download fonts directly:
  - Righteous TTF from the Google Fonts repo: `https://github.com/google/fonts/raw/main/ofl/righteous/Righteous-Regular.ttf`
  - Outfit WOFF (Latin subset) from fontsource CDN: `https://cdn.jsdelivr.net/npm/@fontsource/outfit/files/outfit-latin-{weight}-normal.woff`
- Satori 0.26 accepts TTF, OTF, WOFF — **not WOFF2**. Silent failure (empty text) if you pass WOFF2.

### 2. Astro excludes underscore-prefixed pages from the bundle

Initially named the spike `src/pages/og/_spike.png.ts` — the leading underscore tells Astro "not a route," so Vite tree-shakes it out entirely. First bundle measurement showed zero delta because `workers-og` was never imported into a real entrypoint. Renamed to `spike.png.ts` to get a real measurement.

**Lesson:** for production, the runtime endpoint `/og/blog/[slugHash].png.ts` must NOT start with underscore. For dev-only routes (`_dev/og-preview.astro`), the underscore is correct and desired (dev-only).

### 3. Vite raw-fonts plugin pattern

`vite-plugin-raw-fonts` transforms `.ttf`/`.woff` imports into `Uint8Array` module exports at build time:

```js
// astro.config.mjs
function rawFonts(exts) {
  return {
    name: 'vite-plugin-raw-fonts',
    enforce: 'pre',
    transform(_code, id) {
      if (exts.some((ext) => id.endsWith(ext))) {
        const buffer = fs.readFileSync(id);
        return {
          code: `export default new Uint8Array([${buffer.join(',')}])`,
          map: null,
        };
      }
    },
  };
}

export default defineConfig({
  // ...
  vite: {
    plugins: [rawFonts(['.ttf', '.woff'])],
    assetsInclude: ['**/*.ttf', '**/*.woff'],
  },
});
```

TypeScript module declarations required (`src/lib/og/fonts.d.ts`):

```ts
declare module '*.ttf' { const data: Uint8Array; export default data; }
declare module '*.woff' { const data: Uint8Array; export default data; }
```

### 4. resvg-wasm is inlined, not a separate .wasm asset

`workers-og` bundles the resvg WebAssembly binary as a base64 string inside JS. This makes it a single ~830 KB `.mjs` chunk (Astro names it `spike_*.mjs` in our build), not a separate `.wasm` file. Good for deployment simplicity; the uploader sees one consolidated bundle.

### 5. `nodejs_compat` already enabled — no wrangler.jsonc changes needed

The existing `compatibility_flags: ["nodejs_compat", "disable_nodejs_process_v2"]` is exactly what Satori + resvg-wasm need. No modifications to `wrangler.jsonc` required for Phase 0.

### 6. Astro 6 Cloudflare prerender WASM bug is avoided

`withastro/astro#15684` flags that Astro's Cloudflare prerenderer can fail on dynamic WASM compilation at build time. We avoid this by marking `export const prerender = false` on all OG endpoints — the WASM only runs at request time, not during prerender.

## Decision Record

**GO.** Proceed with Phase 1 (foundation modules) and Phase 2 (blog template + runtime endpoint).

Bundle headroom is 4,200 KiB gzipped on paid plan — plenty of room for:
- Additional templates (module-lesson, generic, etc.)
- Additional fonts if we ever need them (ja, vi, emoji)
- Future runtime additions (author avatar compositing, image caching helpers)

Keep an eye on total gzipped size in CI; target ceiling = 2.5 MB compressed (i.e. <= ~1,400 KiB delta over current baseline).

## Next Steps

- Rename `src/pages/og/spike.png.ts` → remove or convert to dev-only preview in Phase 5
- Implement `src/lib/og/{config, hash, url, fonts}` modules (Phase 1)
- Move fonts from `src/lib/og/fonts/` into versioned location alongside template code
