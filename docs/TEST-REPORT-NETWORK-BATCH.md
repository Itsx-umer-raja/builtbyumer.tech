# Test Report — Network Tools Batch (14 Network + Stopwatch)

**Date:** 2026-11-20. **Repo:** `~/workspace/builtbyumer-review`, branch `main`
(uncommitted working tree; **not pushed** — the parent pushes after verifying).
**Scope:** the 15 tools that live-browser interaction testing had reported as
unimplemented — all 14 Network tools plus Stopwatch, which rendered only
"This tool is being finalised and will be available shortly." The site
advertises 145 tools; this batch makes all 145 real.

## 1. Headline finding — Stopwatch was a false positive

`registry-productivity.tsx` already implemented Stopwatch. Rendered HTML
(scripts stripped) contains "00:00", "Start", "Lap", "Reset" and zero fallback
text. The fallback string appears in raw HTML only because it is passed as a
prop from the server component and serialised in the RSC flight payload.
**Only 14 tools were genuinely missing** (131 of 145 worked, not 130).
No code change was needed for Stopwatch; it was verified working in the
browser test (start / pause / lap / reset, test N15).

## 2. What was built

`src/components/tools/registry-network.tsx` was an empty stub ("Implemented by
the network tools batch" — that batch was never built). It is now a full
~1,900-line implementation following the `registry-text.tsx` /
`registry-productivity.tsx` contract (no props, own state, shared UI from
`ui.tsx`: `Field`, `inputCls`, `labelCls`, `PrimaryButton`, `SecondaryButton`,
`ResetButton`, `CopyButton`, `ErrorNote`, `BusyNote`, `OkNote`; light
`bg-[#f6f1e6]` panels inside the dark workspace). No changes to `src/data/*`,
URLs, metadata, or the homepage. Registry map keys match `src/data/tools.ts`
ids exactly. No new dependencies.

| Tool | Implementation |
|---|---|
| what-is-my-ip | Live, client-side via `https://api.ipify.org?format=json` (auto-detect on mount) |
| dns-lookup | Live via DNS-over-HTTPS (`https://dns.google/resolve`) |
| subnet-calculator | Pure local subnet math |
| cidr-calculator | Pure local CIDR math + binary breakdown |
| ip-validator | Pure local IPv4/IPv6 parse, class/type, binary/hex |
| ip-geolocation | Live via `https://ipwho.is/<ip>` + OpenStreetMap link |
| ipv4-lookup | Local parse (class/type/decimal/binary) + live ipwho.is geo/ISP/ASN |
| ipv6-lookup | Local parse + live ipwho.is geo/ISP/ASN |
| ip-range-calculator | Pure local range math + minimal CIDR decomposition |
| isp-lookup | Live via ipwho.is |
| asn-lookup | Live via ipwho.is (ASN/org/ISP/country) |
| domain-rdap-lookup | Live via `https://rdap.org/domain/<domain>` |
| dns-propagation-checker | Live via DNS-over-HTTPS, Google + Cloudflare resolvers, compared |
| url-parser | Pure local `URL` API (protocol, host, path, query, hash); assumes `https://` when no scheme, noted in UI |
| stopwatch | Already implemented (see §1); verified, no change |

**Hard rule applied throughout:** never fake a result. Unreachable,
rate-limited or erroring APIs show a real, specific error message and no
result. No invented IP/location/DNS data anywhere.

## 3. Build & typecheck — PASS

| Check | Result |
|---|---|
| `npm run build` (final, after all fixes) | **Compiled successfully, 181/181 static pages** |
| `npx tsc --noEmit` | **Clean, exit 0** |

## 4. Browser test results — 15/15 PASS

Harness: `~/workspace/bbu-interaction-test/test-network.js` (puppeteer-core +
local Chromium at `/opt/meta-chromium/chrome`, production server on
`http://localhost:3000`, 15 tests N1–N15 with real inputs and real expected
values). Raw results: `~/workspace/bbu-interaction-test/results-network.json`.

Final run (2026-11-20, after the fixes in §5):

| Test | Tool | Result |
|---|---|---|
| N1 | what-is-my-ip | PASS — detected 104.29.196.210 |
| N2 | ip-validator | PASS — v4=true, v6=true, invalid rejected |
| N3 | ipv4-lookup | PASS — US / Google LLC / AS15169 (8.8.8.8) |
| N4 | ipv6-lookup | PASS — US / Google LLC / AS15169 (2001:4860:4860::8888) |
| N5 | ip-geolocation | PASS — coords + OpenStreetMap link + US (8.8.8.8) |
| N6 | isp-lookup | PASS — Cloudflare, Inc. in result panel (1.1.1.1) |
| N7 | asn-lookup | PASS — AS15169 / Google LLC (8.8.8.8) |
| N8 | subnet-calculator | PASS — 192.168.1.0/24 → network .0, broadcast .255, mask /24, 254 usable hosts |
| N9 | cidr-calculator | PASS — CIDR + broadcast + binary breakdown present |
| N10 | ip-range-calculator | PASS — 192.168.1.10–100 → 91 addresses, CIDR list starts 192.168.1.10/31 |
| N11 | dns-lookup | PASS — A records returned for google.com |
| N12 | dns-propagation-checker | PASS — both resolvers answered (google.com) |
| N13 | domain-rdap-lookup | PASS — MarkMonitor registrar + dates + nameservers (google.com) |
| N14 | url-parser | PASS — parts + query table + scheme assumption |
| N15 | stopwatch | PASS — started=true, lap=true, reset=true |

**Summary: 15 PASS, 0 FAIL.** Page errors: 0.

### 4.1 Earlier runs (how the failures were found and fixed)

- **Run 1: 6 PASS, 9 FAIL** — all external-API tests failed with
  `ERR_TUNNEL_CONNECTION_FAILED` in the test browser (environmental, not site
  code); pure-local tools passed.
- **Run 2: 7 PASS, 8 FAIL** — after `--no-proxy-server`, external requests
  failed with `ERR_SSL_PROTOCOL_ERROR` instead; N9 fixed (textarea read).
- **Run 3: 8 PASS, 7 FAIL** — after the interception shim (§6), dns-lookup
  and propagation passed; the ipwho.is/RDAP tools still failed.
- **Run 4: 9 PASS, 6 FAIL** — N1 fixed (uppercase-label test bug).
- **Run 5: 12 PASS, 3 FAIL** — after the two real API-shape bugs (§5):
  N3, N4, N7 fixed; N5/N6/N13 remained, all three traced to test bugs.
- **Run 6: 14 PASS, 1 FAIL** — N5/N13 fixed (case-sensitive test regexes);
  N6 remained on a stale assertion line.
- **Run 7: 15 PASS, 0 FAIL** — final.

## 5. Two real bugs found by testing and fixed in the site code

Both were wrong assumptions about the live APIs' response shapes, made when
the tools were first written from documentation instead of a live payload.
Both are fixed in `src/components/tools/registry-network.tsx` (and only there).

### 5.1 ipwho.is nests ISP/ASN under `connection` (broke N3, N4, N5, N6, N7)

The code read `data.asn` / `data.org` / `data.isp` at the top level. The live
payload is:

```json
{"ip":"8.8.8.8","success":true,"country":"United States","city":"San Jose",
 "connection":{"asn":15169,"org":"Google LLC","isp":"Google LLC","domain":"google.com"}, ...}
```

Geo fields (country, region, city, coordinates, timezone) are top-level, so
the panels rendered — but the ISP/Organisation/ASN rows were silently omitted
(the `if (data.asn !== undefined)` guards), so the tools looked half-working.
Fix: `ipWhoLookup` now flattens the nested `connection` object
(`isp: r.connection?.isp ?? r.isp`, same for `org`/`asn`) — nested values win,
top-level is the fallback. Verified live: 8.8.8.8 → US / Google LLC / AS15169;
1.1.1.1 → Cloudflare, Inc.

### 5.2 RDAP field is `vcardArray`, not `vCardArray` (broke N13 registrar)

The code read `ent.vCardArray`; the wire format (RFC 7483) is `vcardArray`
(lowercase c). The registrar entity was found (`roles: ["registrar"]`) but
`vcardName` got `undefined` and returned null, so the panel showed
"REGISTRAR — Not listed" even though the data was there (all other RDAP
fields — dates, status, nameservers — rendered fine). Fix: renamed the
interface field and the accessor to `vcardArray`. Verified live: google.com →
registrar "MarkMonitor Inc.", registered 15 September 1997, expires
14 September 2028, nameservers NS1–NS4.GOOGLE.COM.

## 6. Other changes made during the batch

### 6.1 CSP: 7 RDAP authority hosts added to `connect-src` (`next.config.ts`)

Browsers enforce `connect-src` on fetch redirect targets, and rdap.org
302-redirects to authoritative RDAP servers. Added (verified against the IANA
RDAP bootstrap `https://data.iana.org/rdap/dns.json`, fetched 2026-11-20):
`https://rdap.verisign.com` (.com/.net), `https://rdap.publicinterestregistry.org`
(.org), `https://rdap.identitydigital.services` (.ai/.info + many gTLDs),
`https://pubapi.registry.google` (.app/.dev/.page), `https://rdap.nominet.uk`
(.uk), `https://rdap.centralnic.com` (many gTLDs incl. .xyz),
`https://rdap.denic.de` (.de). The file carries a comment documenting why.
This change landed after an earlier build, so the final rebuild (§3) was
required to pick it up.

### 6.2 Quad9 removed from the propagation checker

Was 3 resolvers, now Google + Cloudflare only. Quad9's `:5053` JSON endpoint
returned an empty response from the shell, and the site's CSP `connect-src`
does not include it — the browser console proved it with a CSP violation.
Copy updated ("both resolvers").

### 6.3 iptoasn.com prefix fetch removed from ASN Lookup

The API returns an HTML error page, not JSON. ASN Lookup now shows ASN/org/
ISP/country from ipwho.is; the footnote says no working free prefix API was
found rather than guessing.

## 7. Test-environment limitation and the interception shim

The test Chromium cannot reach the internet directly: with the egress proxy it
fails with `ERR_TUNNEL_CONNECTION_FAILED` (`probe-proxy.js` — the browser
cannot use the proxy at all, even with `page.authenticate`); with
`--no-proxy-server` it fails with `ERR_SSL_PROTOCOL_ERROR`. This is
environmental, not site code — Node fetch from the shell reaches every API
fine through the proxy (verified 2026-11-20: ipify `{"ip":"104.29.194.187"}`,
dns.google, ipwho.is, cloudflare-dns.com, rdap.org 302 → Verisign).

So `test-network.js` routes requests to the API hosts through Node's fetch
(which works via the proxy, Chrome UA for rdap.org — rdap.org returns 403 to
undici's default User-Agent but 302 with a Chrome UA; real browsers send a
Chrome UA, so the tool works there) and responds with the **real live data**.
The React code still does the real fetch/parse/render; only the transport is
shimmed. CSP still applies to the request URLs. This shim is a property of
the test harness, not the site — on a real user's browser the tools fetch the
same endpoints directly.

Test-harness bugs fixed along the way (not site bugs): CIDR binary breakdown
lives in a read-only `<textarea>` so `innerText` misses it (test now reads
textarea values); N6's strict check (static privacy copy mentions
"Cloudflare" once, so the test requires "Cloudflare, Inc." in the result
panel); N1's label renders uppercase via CSS (`innerText` is all-caps);
N5/N6/N13 case-sensitive regexes against uppercase-rendered KvTable labels;
N6's stale assertion line after the wait regex was fixed.

## 8. Console / page errors found

- **Page errors: 0** across all 15 tool pages.
- **Console errors: 15, one per page — all the same pre-existing issue:**
  `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4227183622564894`
  fails to load with `net::ERR_SSL_PROTOCOL_ERROR` in the test browser. This
  is the AdSense script failing because the test browser cannot reach the
  internet (§7), not a tool defect — it appears identically on every page
  including ones untouched by this batch, and `adsEnabled` is still `false`
  in `src/data/site.ts`, so no ad markup renders. No other console errors, no
  failed requests to any tool API (all API requests were answered via the
  shim with real data).

## 9. API verification from the shell (2026-11-20, all real)

curl/Node fetch return 200 with correct payloads for ipify, dns.google,
ipwho.is (8.8.8.8 → US/Google/AS15169), cloudflare-dns.com, rdap.org
(302 → `https://rdap.verisign.com/com/v1/domain/google.com`).
rdap.org returns 403 to undici's default User-Agent but 302 with a Chrome UA.

## 10. Files changed / added

| File | Change |
|---|---|
| `src/components/tools/registry-network.tsx` | Full 14-tool implementation (was an empty stub); ipwho.is `connection` flattening; RDAP `vcardArray` case fix |
| `next.config.ts` | CSP `connect-src` extended with 7 RDAP authority hosts (+ comment) |
| `docs/TEST-REPORT-NETWORK-BATCH.md` | This report |
| `~/workspace/bbu-interaction-test/test-network.js` | 15-test suite + interception shim + strict N6 (outside the repo) |
| `~/workspace/bbu-interaction-test/probe-proxy.js` | Proxy probe (evidence the test browser cannot reach the internet) |
| `~/workspace/bbu-interaction-test/probe-ipv4.js`, `probe-n3.js`, `probe-rdap.js`, `probe-n5n6n13.js` | Debug probes used to isolate the §5 bugs |
| `~/workspace/bbu-interaction-test/results-network.json` | Run results (final run: 15 PASS, 0 FAIL) |

**Not pushed to GitHub** (per task instructions — the parent pushes).
`src/data/*`, URLs, metadata, existing tools' processing logic, and the
homepage were not touched.
