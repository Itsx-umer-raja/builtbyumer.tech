# Interaction Test Report — BuiltByUmer V8 (live browser)

**Date:** 2026-11-20. **Repo:** `~/workspace/builtbyumer-review`, branch `main` (uncommitted working tree; **not pushed**).
**Build tested:** production build served on `http://localhost:3000` (`next start`, 181/181 pages).
**Tester:** local Chromium (`/opt/meta-chromium/chrome`, "Muse Browser 157.0.8103.81") driven by puppeteer-core 23.11.1 from `~/workspace/bbu-interaction-test/` (scratch dir outside the repo; repo `package.json` untouched).
**Scope:** the live-browser interaction tests that the earlier Phase 10 pass could not run (see `TEST-REPORT-V8.md` §9). One interactive tool per category, end-to-end, plus the 10 most-used tools (spot checks), hero search, map/passport, mobile 390px, and keyboard. **Result: 19 of 20 items PASS; 1 FAIL** (see §3).

## 0. Test-environment notes (read before judging the console log)

Three sandbox quirks shaped how the tests ran; none of them is a site bug.

1. **Chromium needs a Hatch WebGL domain policy to start.** `/opt/meta-chromium/chrome` refuses to launch without `--hatch-webgl-allowed-domains-file=<file>` + `--hatch-webgl-allowed-domains-sha256=<sha256>`. The policy file used was `~/workspace/bbu-interaction-test/webgl-policy.txt` containing the single line `hatch-webgl-all-origins-v1` (validated with `--hatch-validate-webgl-allowed-domains`). This only affects the test browser instance, not the site.
2. **Chrome's Local Network Access checks block direct navigation to localhost** (a navigation from `about:blank` is treated as public → local and refused with `ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`). `--disable-features=LocalNetworkAccessChecks` (and every related feature flag), the `LocalNetworkAccessAllowedForUrls` enterprise policy, and a CDP `localNetworkAccess` permission grant were all tried and did **not** lift it. The workaround used: every page load goes through a tiny `file://` redirector (`bbu-interaction-test/redirect.html?to=<url>`). A `file://` origin is local, so the redirect to localhost is allowed. In-page navigation (search Enter, link clicks, menu clicks) works natively once on the site. The cloud browser could not run these tests for the same reason (it rejects localhost addresses entirely).
3. **External requests fail in this sandbox.** The egress proxy refuses the browser's external requests (`ERR_TUNNEL_CONNECTION_FAILED` via proxy, `ERR_SSL_PROTOCOL_ERROR` direct). Google Fonts, the AdSense script, and `api.ipify.org` are all unreachable from the test browser (all three return HTTP 200 from `curl` through the same proxy, so this is browser-specific). Every console error in this run is that one failure (see §4). It is environmental, not a site defect — but it also means the `what-is-my-ip` tool could not have worked here even if implemented, because it depends on ipify.

## 1. Results

| # | Test | Verdict | Evidence |
|---|---|---|---|
| 1 | Homepage loads | **PASS** | h1 = "145+ TOOLS. ONE DIGITAL UNIVERSE.", hero search present, WebGL canvas mounted, 2D fallback present in HTML |
| 2 | Hero search | **PASS** | Typed "merge pdf" → results listed → ArrowDown + Enter navigated to `/pdf-tools/merge-pdf` |
| 3 | Route 145 map + worlds + pin click | **PASS** | 10/10 world sections, directory present, 12 map pins; clicked "Stop 1: PDF Tools — 24 tools", scrolled to the PDF world in view |
| 4 | Passport counter visible | **PASS** | "PASSPORT 1/10" — the pin click in test 3 stamped it, so the passport records real clicks (started 0/10) |
| 5 | Merge PDF end-to-end | **PASS** | Uploaded both test PDFs, "Merge 2 PDFs" clicked, download ready, **`merged.pdf` (665,067 bytes) actually downloaded** |
| 6 | Image Compressor end-to-end | **PASS** | Uploaded webp, Compress clicked, result "20.0 KB" with download button present |
| 7 | QR Code Generator | **PASS** | Typed `https://builtbyumer.tech`, QR canvas rendered 384×384, "Download PNG" present |
| 8 | What Is My IP | **FAIL** | Tool not implemented — page shows "This tool is being finalised and will be available shortly." See §3 |
| 9 | JSON Formatter (valid + invalid) | **PASS** | Valid JSON formatted with indentation; invalid `{bad` produced a real error: "Invalid JSON: Expected property name or '}' in JSON at position 1 (line 1 column 2)" — no fake success |
| 10 | Word Counter | **PASS** | "The quick brown fox jumps over the lazy dog" → 9 words, 43 characters (35 letters + 8 spaces; the first run's expectation of 44 was a miscount in the test script, corrected on retest) |
| 11 | Age Calculator | **PASS** | Birth date 1990-01-01 → "36 years" (auto-calculates on date change; no Calculate button exists) |
| 12 | CSV to JSON | **PASS** | Pasted `name,age / Ali,30 / Sara,25` → JSON output containing Ali/30 |
| 13 | Invoice Generator preview updates | **PASS** | Typed "Test Client" into a field → invoice preview rendered "Test Client" |
| 14 | Pomodoro Timer starts | **PASS** | 25:00 → 24:56 after ~3.5s, Start became Pause |
| 15a | Compress PDF | **PASS** | Uploaded a PDF, Compress clicked, download present |
| 15b | Image Resizer controls render | **PASS** | File input + resize controls/text render |
| 15c | Password Generator | **PASS** | Generate clicked, a password was produced |
| 15d | Unit Converter 1 km = 1000 m | **PASS** | Category Length, From "Kilometre (km)", To "Metre (m)", value 1 → **"1 Kilometre = 1,000 Metre"** plus a full conversion table (first runs failed on American spellings "Kilometer/Meter" and on the thousands separator "1,000" — both test-script errors, corrected on retest) |
| 16 | Mobile 390px (nav + tool usable) | **PASS** | No horizontal overflow on homepage or tool page (scrollWidth 390); homepage STOPS menu opened with real links → navigated to `/image-tools`; tool-page hamburger opened → navigated to `/tools`; Merge PDF file input + dropzone usable |
| 17 | Keyboard (Tab focus + Ctrl+K search) | **PASS** | After Tab, focus landed on the search input with a visible 2px solid outline (`:focus-visible` true); Ctrl+K focused the hero search |

## 2. Console errors, page errors, failed requests

- **Page errors (`pageerror` / uncaught exceptions): 0** across all 20 items and all pages visited.
- **Console errors: 24 total, all identical** — `Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED`, one per page load, every one of them the AdSense script `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4227183622564894` failing through the sandbox proxy (§0.3). **No other console error was observed on any page.**
- **Failed requests: 24 total, one unique URL** — the AdSense script above. No localhost request failed anywhere. Google Fonts did not appear as failed requests (the font CSS presumably loaded from cache or failed silently at the CSS level; no font-related console error appeared).

## 3. REAL BUG FOUND — 15 tools are not implemented (pre-existing, not a V8 regression)

**Finding:** `src/components/tools/registry-network.tsx` exports an **empty** record. All 14 Network tools have no client component, so their pages render only the fallback text *"This tool is being finalised and will be available shortly."* (from `src/app/[category]/[tool]/page.tsx`). The same is true of **Stopwatch** in Productivity.

Verified by registry coverage check (145 tools in `src/data/tools.ts` vs. the registry maps):

| Category | In data | Registered |
|---|---|---|
| PDF | 24 | 24 |
| Image | 22 | 22 |
| Developer | 26 | 26 |
| Text | 15 | 15 |
| Calculators | 17 | 17 |
| QR & Barcode | 11 | 11 |
| Data | 6 | 6 |
| Business | 4 | 4 |
| Productivity | 6 | 5 (stopwatch missing) |
| Network | 14 | **0** |
| **Total** | **145** | **130** |

**Not registered (15):** `what-is-my-ip`, `dns-lookup`, `subnet-calculator`, `cidr-calculator`, `ip-validator`, `ip-geolocation`, `ipv4-lookup`, `ipv6-lookup`, `ip-range-calculator`, `isp-lookup`, `asn-lookup`, `domain-rdap-lookup`, `dns-propagation-checker`, `url-parser`, `stopwatch`.
Spot-checked live: `/network-tools/what-is-my-ip`, `/network-tools/dns-lookup`, `/network-tools/subnet-calculator`, `/productivity-tools/stopwatch` all render the "being finalised" fallback.

**This was NOT fixed here.** Implementing 15 tools is a new build phase, not a small safe fix. It is also pre-existing: the Network batch was never built (the registry file is a 7-line stub), so V8 did not break it — but the site currently advertises 145 working tools while 15 of them do nothing. The earlier Phase 10 report (§4, "145/145 render-verified") only verified that the pages render, not that the tools work — this interaction run is what caught it. Recommendation: build the Network batch (and Stopwatch) as the next phase, or remove those 15 tools from the directory until they exist. Do not present the site as "145 working tools" until then.

## 4. Visual / layout defects observed

- **None found in functional testing.** No horizontal overflow at 390px on homepage or tool page; tool workspaces, previews, and buttons rendered as expected at desktop and mobile widths.
- Not covered by this run (stated plainly, not assumed): a dedicated visual-design review of every tool page; the known rough edge from `TEST-REPORT-V8.md` §8 (a few bare `text-muted` lines sitting on the dark workspace, e.g. a "Computing…" line in developer tools, reading dim) was not re-checked visually; no Lighthouse / Web Vitals numbers were measured (no usable browser performance tooling in this sandbox).

## 5. What was NOT tested

- The other 130 registered tools beyond the matrix above (they were render-verified in `TEST-REPORT-V8.md` §4, not interaction-tested here).
- The 15 unimplemented tools beyond confirming their fallback (see §3).
- Reduced-motion visual behaviour in a real browser (verified in CSS/source only, per the earlier report).
- Real-user network conditions: external-dependent tools (What Is My IP, and any tool calling ipify/ipwho.is/Cloudflare/Google DNS) could not be exercised end-to-end because external requests are blocked in this sandbox (§0.3); on a normal connection they should work if implemented.
- Download-to-disk was verified only for Merge PDF (real `merged.pdf` downloaded); other tools' downloads were verified by the presence of a working download link/button, not by saving every file.

## 6. Test files used

- PDFs: `~/workspace/user/files/Equity_Question_1.pdf`, `~/workspace/user/files/Specific_act_by_Maryam_Bilal_law_Academy.pdf` (the user's own files, processed client-side in the test browser; nothing left the machine).
- Image: `~/workspace/builtbyumer-review/public/images/driftlab-sky.webp`.
- Harness: `~/workspace/bbu-interaction-test/` (`test-part1.js`, `test-part2.js`, `test-part3.js`, `probe*.js`, `redirect.html`, `webgl-policy.txt`, `results-part*.json`).
