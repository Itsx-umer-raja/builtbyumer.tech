# Test Report — BuiltByUmer V8 (Phases 7–10)

**Date:** 2026-11-20. **Repo:** `~/workspace/builtbyumer-review`, branch `main`
(uncommitted working tree; **not pushed** — the parent pushes after verifying).
**Scope:** Phases 7–10 of the master redesign (tool-interface redesign,
connected-service verification, performance/accessibility/SEO hardening,
full-site testing). Homepage V8, ten worlds and directory/search (Phases 3–6)
were already complete; this report covers what Phases 7–10 did and verified.

## 1. Build & typecheck — PASS

| Check | Result |
|---|---|
| `npx tsc --noEmit` (after a build exists) | **Clean, exit 0** |
| `npm run build` (clean rebuild, `rm -rf .next`) | **Compiled successfully, 181/181 static pages, exit 0** |
| Second build after the og-image fix (§5) | **181/181, exit 0** |

Known pre-existing caveat, confirmed again in this pass: standalone `tsc`
run on a fresh checkout **without** `.next/` fails with
`Cannot find name 'PageProps'` / `'LayoutProps'` (Next 16 generated types
don't exist until a build runs). The build's own TypeScript pass is the
authority and it is clean. This is a repo caveat, not a regression.

No dependencies were added in Phases 7–10. No credentials were added anywhere.

## 2. Page-count reconciliation (the "181 vs 162" gap is closed)

The Phase 8/9 auditor flagged that 162 countable routes didn't match the
repeated "181 pages" claim. Verified against the build output:

- **168** prerendered HTML routes in `.next/prerender-manifest.json`
  (1 home + 1 `/tools` + 10 categories + 145 tools + 5 static pages
  [about, contact, portfolio, privacy-policy, terms-of-service]
  + `_not-found`, `_global-error`, `favicon.ico`, `manifest.webmanifest`,
  `opengraph-image`, `robots.txt`).
- **+ 12** dynamic-route shell HTML files (the 10 per-category `[tool]`
  shells + the generic `/[category]` and `/[category]/[tool]` shells).
- **+ 1** `sitemap.xml` (dynamic route).
- **181 = 168 + 12 + 1.** The sitemap itself lists 162 URLs
  (7 static + 10 categories + 145 tools), which is correct and unchanged.

## 3. Production smoke test — PASS (173 URLs, all HTTP 200)

Production server (`next start`, port 3100) against the final build.
Checked: all 168 prerendered routes + `/sitemap.xml`, `/robots.txt`,
`/google83a962037754e787.html`, `/ads.txt`, and 3 per-tool
opengraph-image routes. **Result: 173 checked, 0 failures.**

Excluded (not user-facing routes): `/_global-error` (HTTP 500 when hit
directly) and `/_not-found` (HTTP 404 when hit directly) — both are
Next.js internal error handlers; a direct request to them is expected to
fail. A genuinely unknown URL (e.g. `/nonexistent-page`) correctly
returns the custom 404 page with HTTP 404.

Spot checks on served HTML:
- Homepage: exact headline `145+ TOOLS. ONE DIGITAL UNIVERSE.` present
  as plain HTML; **zero `<ins>` ad elements** (see §6).
- Tool page (`/pdf-tools/merge-pdf`): canonical
  `https://builtbyumer.tech/pdf-tools/merge-pdf`, 3 JSON-LD blocks
  (WebApplication, BreadcrumbList, FAQPage), `route-145` scope present.
- Sitemap: 162 `<loc>` entries. robots.txt: `Allow: /`, sitemap + host set.
- AdSense verification file: **now served** — `GET
  /google83a962037754e787.html → 200` (it was previously at the repo
  root, where Next.js never serves it; moved to `public/` in Phase 8).

## 4. Tool render verification — all 145 tool pages PASS

Every tool page (all 145, parsed from `src/data/tools.ts`) was fetched
from the production server and checked for: HTTP 200, the tool's title
in the SSR HTML, the first 60 chars of its description in the SSR HTML,
the `route-145` scope marker, and the presence of JSON-LD.
**145/145 pass, 0 failures.**

One representative tool per category was additionally confirmed by hand:
`pdf-tools/merge-pdf`, `image-tools/image-compressor`,
`qr-tools/qr-code-generator`, `network-tools/what-is-my-ip`,
`developer-tools/json-formatter`, `text-tools/word-counter`,
`calculators/age-calculator`, `data-tools/csv-to-json`,
`business-tools/invoice-generator`, `productivity-tools/pomodoro-timer`
— all HTTP 200 with the V8 tool workspace rendered.

The 10 most-used tools (Merge PDF, Compress PDF, Image Compressor,
Image Resizer, QR Code Generator, Password Generator, JSON Formatter,
Word Counter, Age Calculator, Unit Converter) are all inside the 145/145
pass above.

## 5. Bug found & fixed in this pass — per-tool og:image 500

**Finding:** `GET /pdf-tools/merge-pdf/opengraph-image` (and every other
per-tool og:image route) returned no response; the server log showed
Satori failing with: `Expected <div> to have explicit "display: flex",
"display: contents", or "display: none" if it has more than one child
node.` The root cause was the category label div in
`src/app/[category]/[tool]/opengraph-image.tsx` — `{cat.toUpperCase()}
TOOL` renders as two text child nodes inside a `<div>` with no `display`
set. **This was pre-existing** (Phase 7 did not touch the file) and it
meant every tool page's `og:image` social preview was broken.

**Fix:** one line — added `display: "flex"` to that div. Rebuilt and
re-tested: `/pdf-tools/merge-pdf/opengraph-image`,
`/image-tools/image-compressor/opengraph-image` and
`/qr-tools/qr-code-generator/opengraph-image` all return **HTTP 200**
with a valid **1200×630 PNG**. The home og:image (`/opengraph-image`)
was already 200 and is unaffected.

## 6. Phase 8 — connected services (verified, nothing invented)

- **AdSense:** `SITE.adsEnabled` is `false` (`src/data/site.ts:9`).
  `AdSlot.tsx` returns `null` before rendering anything while disabled.
  Served homepage HTML contains **no `<ins>` elements**; the only
  "adsbygoogle" strings are the account script URL
  (`pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-…`),
  which loads unconditionally in `layout.tsx` (known minor gap — the
  gate covers slots, not the script; see recommendations). No
  `adUnitId` is set anywhere, so enabling today would render an `<ins>`
  with no `data-ad-slot` — real ad units still need to be configured
  after approval.
- **MCP-independence:** zero hits in `src/` for `motionsites.ai/api`,
  `supabase`, `oauth`, `/api/mcp`, `githubcopilot`; no imports from any
  connector folder; `.mcp.json` contains only a public `npx` command and
  is referenced nowhere in site code. The finished site is fully
  independent of private developer MCP sessions.
- **Credential scan:** zero hits for API keys, tokens, client secrets,
  private-key blocks, `sk-…`/`ghp_…`/`AIza…` patterns in `src/` and
  `public/` (excluding the vendored minified `public/pdf.worker.min.mjs`).
  Only intentionally-public identifier is the AdSense publisher ID.
  No `.env` files exist.
- **Not connected / not added (honest):** Vercel, Figma, Canva,
  Google Drive, analytics, Search Console, error monitoring — none of
  these exist as connections in this environment and none were faked.
  See recommendations in `MCP_INTEGRATION_AUDIT.md`.

## 7. Phase 9 — performance / accessibility / SEO (source + served checks)

- **3D hero is lazy and non-blocking:** `next/dynamic` + `ssr:false`,
  mounted only near viewport (IntersectionObserver, 400px root margin),
  never mounted under `prefers-reduced-motion` or without WebGL,
  DPR capped 1.75/1.5, frameloop paused offscreen, ~14 meshes, no
  shadows/post-processing, static SVG fallback always in server HTML.
- **Reduced motion:** global kill-switch in `globals.css`, V8
  hero/reveal/stagger neutralised, `HomeV8` skips Lenis/GSAP reveals,
  `Reveal` is JS-gated and motion-safe, `.route-145 .animate-spin`
  disabled under reduced motion.
- **Ads/CLS:** while disabled, `AdSlot` returns `null` (no box, no
  shift). When enabled, reserved heights exist (leaderboard 110px,
  in-feed 280px, anchor 64px).
- **Fonts:** `layout.tsx` loads **10 Google font families** on every
  page (legacy V2–V7 voices) — contradicts the V8 two-face discipline
  and adds payload. Pruning needs a user decision; not changed silently.
- **SEO:** metadata, canonicals, all three JSON-LD blocks, sitemap
  (162 URLs), robots.txt intact; tool names/descriptions in crawlable
  HTML (verified for all 145 pages, §4); 3D hero is decoration only.
  FAQ answers are templated generics from `src/lib/toolContent.ts`,
  not per-tool facts — honest but generic.
- **Focus/keyboard:** cyan focus-visible rings on links, buttons,
  inputs, selects, textareas and `[role="button"]` under `.route-145`;
  FileDrop keeps its `role=button`/tabIndex/Enter/Space contract.

## 8. Phase 7 — what changed (tool interfaces)

Shared surfaces only — no per-tool logic, no `src/data/*`, no URLs:

- New shared scope class **`.route-145`** (appended to
  `src/app/globals.css`, ~90 lines): carries the V8 dark system onto
  tool/category pages. Decision: no hoisting was needed (`--v8-*` vars
  are already in `:root`; `.v8-glass`/`.v8-btn-*` are already top-level),
  and legacy light tokens were deliberately **not** remapped — per-tool
  bodies contain ~180 hardcoded light panels whose dark text depends on
  those tokens, so remapping would turn text light-on-light. Per-tool
  light cards now render as coherent light "document" panels inside the
  dark workspace. Documented in a comment block at the end of
  `globals.css`.
- `src/components/tools/ui.tsx`: FileDrop (dark glass, cyan icon, violet
  drag-over, same validation/error text), Primary/Secondary/Download/
  Reset/Copy buttons on V8 tokens, ErrorNote (`role="alert"`, red-on-dark),
  BusyNote/OkNote (`role="status"`), dark inputs/labels. Same exports
  and props everywhere; processing logic untouched.
- `src/app/[category]/[tool]/page.tsx`: shell fully V8 (breadcrumb,
  badges, Anta title with violet last word, `v8-glass` workspace,
  how-to/FAQ/privacy/related/prev-next sections). Logic, JSON-LD and
  metadata untouched.
- `src/app/[category]/page.tsx`: `route-145` added alongside `home-v8`.
- `src/components/home-v2/CategoryToolRows.tsx`: rows V5 vermillion → V8.
- `src/components/tools/ToolSearch.tsx`: dark variant → V8 (light
  homepage variant untouched).
- `src/components/tools/registry-image.tsx`: shared helpers only
  (`BehaviorNote`, `FileMeta`, `ResultPanel`, `SourcePreview`,
  `QualitySlider`/`Checkbox` accents lime → `#8b7cff`).
- `src/components/tools/registry-qr.tsx`: shared family chrome only
  (preview panels, colour swatches, empty-state icons → cyan);
  **QR/barcode canvases keep their white backing so codes stay scannable.**
- `src/app/[category]/[tool]/opengraph-image.tsx`: one-line Satori fix (§5).
- `public/google83a962037754e787.html`: moved from repo root (Phase 8 fix).

**Deliberately left unchanged:** per-tool internals (~44 legacy-palette
occurrences in `registry-image.tsx` and similar in other registries —
cropper overlays, timers, password/hash outputs, etc.); the camera
viewfinder internals; `ToolLauncher.tsx` (verified dead code, zero
imports); `PageShell.tsx`/`SiteChrome.tsx` (SiteChrome already V8;
PageShell is shared with `/about` and `/contact`).

**Known rough edge (disclosed):** a few bare `text-muted` /
`text-[#163D2B]` lines sit directly on the dark workspace background
(e.g. a "Computing…" line in developer tools) and read dim. Fixing
those belongs to a per-tool pass, not Phase 7.

## 9. What was NOT verified — honest coverage limits

Generic subagents in this environment **cannot operate a live browser**,
so the following were NOT verified here and must be checked with a
browser-capable agent (or by the user) before the work is called fully
tested:

- **No live-browser functional tests.** No tool was exercised
  end-to-end in a browser (no real file upload → process → download,
  no QR generation/download, no calculator/formatter input → output).
  Shared processing engines were verified only by code inspection and
  by route/render checks — the engines themselves were not run.
- **No browser console check.** Console errors on homepage, `/tools`,
  category and tool pages were not observed (no browser to observe them).
- **No mobile-viewport or touch testing**, no mobile-navigation test,
  no hero-search interaction test, no keyboard walkthrough in a real
  browser (focus rings were verified in CSS/source only).
- **No reduced-motion visual check** in a real browser (verified in
  CSS/source only).
- **No performance measurement** (no Lighthouse/Web Vitals run in a
  browser; no LCP/CLS/INP numbers to report).

What **was** verified instead: clean build + typecheck, all 173 routes
HTTP 200, all 145 tool pages render-verified from SSR HTML, SEO/ad
gating from served HTML, and source-level checks for lazy 3D,
reduced motion, focus rings and credential hygiene. That is route +
render coverage, not interaction coverage — the two must not be confused.

## 10. Deviations from the master brief (and why)

1. **Per-tool interiors not fully restyled** (brief §7 asks for every
   tool page to get the full premium treatment). Only the shared
   surfaces were restyled; per-tool internals keep their light panels.
   Reason: hand-editing 145 tools was out of scope for this phase and
   a token remap would have broken their text contrast (§8). The
   shared shell is consistent; the interiors are a documented follow-up.
2. **No analytics / Search Console / error monitoring added** (brief
   §12D). No connector for any of them exists in this environment;
   nothing was faked. Recorded as recommendations instead.
3. **AdSense script still loads unconditionally** (brief §12C/§13
   privacy). Gating it was a one-line change but touches the account
   verification path; left as a recommendation rather than changed
   silently.
4. **Fonts not pruned to the V8 pair** (brief §8 two-face discipline).
   10 families still load; pruning is a user decision (some legacy
   voices may still be referenced by older home versions in the repo).
5. **Interaction testing not completed** (brief §15: test uploads,
   conversions, downloads, mobile nav, console errors). Blocked on
   live-browser access for subagents — see §9. This is the largest
   remaining gap.
