"use client";

import type { ToolComponent } from "./registry";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BusyNote,
  CopyButton,
  ErrorNote,
  Field,
  OkNote,
  PrimaryButton,
  ResetButton,
  SecondaryButton,
  inputCls,
  labelCls,
} from "./ui";
import { cn, downloadText } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════
   Network tools — all 14 live in this file. Pure math runs
   locally; live lookups go to well-known free public endpoints
   (ipify, Google/Cloudflare DNS-over-HTTPS, ipwho.is, rdap.org)
   with no API keys. A failed lookup is always shown as a real,
   specific error — results are never invented.
   ════════════════════════════════════════════════════════════════ */

/* ── Shared local primitives (same visual language as the text
   registry: light "document" panels inside the dark workspace) ── */

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-3 py-3 text-center">
      <div className="break-all font-mono text-lg font-semibold text-[#163D2B] sm:text-xl">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

function StatsGrid({ items }: { items: Array<[string, string | number]> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(([label, value]) => (
        <StatCard key={label} label={label} value={value} />
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-lime bg-[#163D2B]/10 text-[#163D2B]"
          : "border-[#121212]/15 text-cream hover:border-[#163D2B]/50 hover:text-[#163D2B]",
      )}
    >
      {children}
    </button>
  );
}

/** Label/value table inside a light panel. Values are mono + copyable. */
function KvTable({ rows }: { rows: Array<[string, ReactNode, string?]> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#121212]/12 bg-[#f6f1e6]">
      {rows.map(([label, value, copy], i) => (
        <div
          key={label}
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 px-4 py-3",
            i > 0 && "border-t border-[#121212]/10",
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
          <span className="flex items-center gap-2 font-mono text-sm font-medium text-[#163D2B] break-all">
            {value}
            {copy ? <CopyButton text={copy} label="Copy" /> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

function OutputBox({
  value,
  label = "Result",
  rows = 8,
}: {
  value: string;
  label?: string;
  rows?: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className={labelCls + " !mb-0"}>{label}</label>
        {value && <CopyButton text={value} />}
      </div>
      <textarea
        readOnly
        value={value}
        rows={rows}
        spellCheck={false}
        placeholder="Result appears here"
        className={cn(inputCls, "font-mono resize-y")}
      />
    </div>
  );
}

/* ── Fetch helper: timeout + specific, honest errors ─────────── */

async function fetchJson<T>(
  url: string,
  opts?: { timeoutMs?: number; headers?: Record<string, string> },
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: opts?.headers });
    if (!res.ok) {
      if (res.status === 404) throw new Error("Not found — the service has no record for this input.");
      if (res.status === 429) throw new Error("The service is rate-limiting requests right now — try again in a minute.");
      throw new Error(`The service answered with HTTP ${res.status}.`);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Request timed out — the service did not answer in time. Try again.");
    }
    if (e instanceof TypeError) {
      throw new Error("Network error — could not reach the service. Check your connection and try again.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/* ── IPv4 math ────────────────────────────────────────────────── */

function parseIPv4(s: string): number | null {
  const m = s.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const o = m.slice(1).map(Number);
  if (o.some((n) => n > 255)) return null;
  return (((o[0] as number) << 24) | ((o[1] as number) << 16) | ((o[2] as number) << 8) | (o[3] as number)) >>> 0;
}

function ipv4ToString(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function ipv4Binary(n: number): string {
  const bits = (n >>> 0).toString(2).padStart(32, "0");
  return bits.replace(/(.{8})(?=.)/g, "$1.");
}

function ipv4Class(n: number): string {
  const first = (n >>> 24) & 255;
  if (first < 128) return "Class A";
  if (first < 192) return "Class B";
  if (first < 224) return "Class C";
  if (first < 240) return "Class D (multicast)";
  return "Class E (reserved)";
}

function ipv4Kind(n: number): string {
  const s = ipv4ToString(n);
  if (n === 0) return "Unspecified (0.0.0.0)";
  if (((n >>> 24) & 255) === 10) return "Private (RFC 1918)";
  if ((n & 0xfff00000) >>> 0 === 0xac100000) return "Private (RFC 1918)";
  if ((n & 0xffff0000) >>> 0 === 0xc0a80000) return "Private (RFC 1918)";
  if (((n >>> 24) & 255) === 127) return "Loopback";
  if ((n & 0xffff0000) >>> 0 === 0xa9fe0000) return "Link-local (APIPA)";
  if ((n & 0xffc00000) >>> 0 === 0x64400000) return "Shared / CGNAT (RFC 6598)";
  if ((n & 0xffffff00) >>> 0 === 0xc0000200) return "Documentation (TEST-NET-1)";
  if ((n & 0xffffff00) >>> 0 === 0xc6336400) return "Documentation (TEST-NET-2)";
  if ((n & 0xffffff00) >>> 0 === 0xcb007100) return "Documentation (TEST-NET-3)";
  if (((n >>> 24) & 255) >= 224 && ((n >>> 24) & 255) < 240) return "Multicast";
  if (((n >>> 24) & 255) >= 240) return "Reserved";
  if ((n & 0xffffff00) >>> 0 === 0xc0000000) return "IETF protocol assignments";
  return `Public (${s})`;
}

interface SubnetInfo {
  network: number;
  broadcast: number;
  mask: number;
  wildcard: number;
  prefix: number;
  total: number;
  usable: number;
  first: number;
  last: number;
}

function subnetInfo(ip: number, prefix: number): SubnetInfo {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  const wildcard = (~mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const total = 2 ** (32 - prefix);
  const usable = prefix === 32 ? 1 : prefix === 31 ? 2 : total - 2; // /31: RFC 3021 point-to-point
  const first = prefix >= 31 ? network : (network + 1) >>> 0;
  const last = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0;
  return { network, broadcast, mask, wildcard, prefix, total, usable, first, last };
}

/** Decompose [start, end] (inclusive) into the minimal CIDR list. */
function rangeToCidrs(start: number, end: number): string[] {
  const out: string[] = [];
  let s = start;
  while (s <= end) {
    let prefix = 0;
    for (let p = 0; p <= 32; p++) {
      const block = 2 ** (32 - p);
      if (s % block === 0) {
        prefix = p;
        break;
      }
    }
    let block = 2 ** (32 - prefix);
    const remaining = end - s + 1;
    while (block > remaining) {
      prefix += 1;
      block /= 2;
    }
    out.push(`${ipv4ToString(s)}/${prefix}`);
    s += block;
  }
  return out;
}

/* ── IPv6 parse / format / classify ─────────────────────────── */

/** Parse an IPv6 address (incl. :: compression and embedded IPv4). */
function parseIPv6(input: string): number[] | null {
  let s = input.trim().toLowerCase();
  // Embedded IPv4 tail: rewrite it as two hex groups first.
  const v4 = s.match(/:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (v4) {
    const n = parseIPv4(v4[1] as string);
    if (n === null) return null;
    s = s.slice(0, s.length - (v4[1] as string).length) + ((n >>> 16) & 0xffff).toString(16) + ":" + (n & 0xffff).toString(16);
  }
  const parseGroup = (str: string): number[] | null => {
    if (str === "") return [];
    const out: number[] = [];
    for (const g of str.split(":")) {
      if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
      out.push(parseInt(g, 16));
    }
    return out;
  };
  const parts = s.split("::");
  if (parts.length > 2) return null;
  if (parts.length === 2) {
    const left = parseGroup(parts[0] as string);
    const right = parseGroup(parts[1] as string);
    if (left === null || right === null) return null;
    const missing = 8 - left.length - right.length;
    if (missing < 1) return null; // "::" must stand for at least one group
    return [...left, ...new Array<number>(missing).fill(0), ...right];
  }
  const groups = parseGroup(s);
  if (groups === null || groups.length !== 8) return null;
  return groups;
}

/** RFC 5952-style compression: longest run of 0 groups (>= 2) becomes "::". */
function formatIPv6(groups: number[], compress = true): string {
  const hex = groups.map((g) => g.toString(16));
  if (!compress) return hex.join(":");
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;
  for (let i = 0; i <= 8; i++) {
    if (i < 8 && groups[i] === 0) {
      if (curStart === -1) {
        curStart = i;
        curLen = 1;
      } else curLen++;
    } else {
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
      curStart = -1;
      curLen = 0;
    }
  }
  if (bestLen < 2) return hex.join(":");
  const left = hex.slice(0, bestStart).join(":");
  const right = hex.slice(bestStart + bestLen).join(":");
  if (left === "") return "::" + right;
  if (right === "") return left + "::";
  return left + "::" + right;
}

function ipv6Kind(groups: number[]): string {
  const allZero = groups.every((g) => g === 0);
  if (allZero) return "Unspecified (::)";
  if (groups.every((g, i) => g === (i === 7 ? 1 : 0))) return "Loopback (::1)";
  const first = groups[0] as number;
  if ((first & 0xffc0) === 0xfe80) return "Link-local (fe80::/10)";
  if ((first & 0xfe00) === 0xfc00) return "Unique local (fc00::/7)";
  if ((first & 0xff00) === 0xff00) return "Multicast (ff00::/8)";
  if (first === 0x2001 && groups[1] === 0xdb8) return "Documentation (2001:db8::/32)";
  if (first === 0x2001 && groups[1] === 0) return "Teredo (2001::/32)";
  if (first === 0x2002) return "6to4 (2002::/16)";
  if (first === 0x0064 && groups[1] === 0xff9b) return "Well-known prefix (64:ff9b::/96)";
  if (groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff) return "IPv4-mapped (::ffff:0:0/96)";
  if ((first & 0xe000) === 0x2000) return "Global unicast (2000::/3)";
  return "Global unicast";
}

/* ── DNS-over-HTTPS types ───────────────────────────────────── */

const DNS_TYPES: Array<[string, number]> = [
  ["A", 1],
  ["AAAA", 28],
  ["MX", 15],
  ["TXT", 16],
  ["NS", 2],
  ["CNAME", 5],
  ["SOA", 6],
];

const DNS_TYPE_NAME: Record<number, string> = Object.fromEntries(DNS_TYPES.map(([n, v]) => [v, n]));

interface DohAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DohResponse {
  Status: number;
  Answer?: DohAnswer[];
  Authority?: DohAnswer[];
  Comment?: string;
}

const DOH_STATUS: Record<number, string> = {
  0: "NOERROR",
  1: "FORMERR",
  2: "SERVFAIL",
  3: "NXDOMAIN — the domain does not exist",
  5: "REFUSED",
};

async function dohQuery(
  base: string,
  domain: string,
  type: number,
  extraHeaders?: Record<string, string>,
): Promise<DohResponse> {
  return fetchJson<DohResponse>(
    `${base}?name=${encodeURIComponent(domain)}&type=${type}`,
    { timeoutMs: 12000, headers: extraHeaders },
  );
}

/* ── ipwho.is types ─────────────────────────────────────────── */

interface IpWhoResult {
  success: boolean;
  ip: string;
  type: string;
  continent?: string;
  continent_code?: string;
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  postal?: string;
  timezone?: { id?: string; abbr?: string; utc?: string };
  // The live ipwho.is payload nests the connection fields under `connection`
  // (verified 2026-11-20: {"connection":{"asn":15169,"org":"Google LLC",
  // "isp":"Google LLC",...}}). The top-level fields are kept as a fallback
  // in case the API shape ever varies; ipWhoLookup flattens them.
  connection?: { asn?: number; org?: string; isp?: string; domain?: string };
  isp?: string;
  org?: string;
  asn?: number;
  message?: string;
}

async function ipWhoLookup(ip: string): Promise<IpWhoResult> {
  const r = await fetchJson<IpWhoResult>(`https://ipwho.is/${encodeURIComponent(ip)}`, { timeoutMs: 12000 });
  if (!r.success) {
    throw new Error(r.message ? `Lookup failed: ${r.message}` : "The lookup service could not resolve this address.");
  }
  // Flatten the nested `connection` object so the detail panels can read
  // isp/org/asn directly. Nested values win; top-level is the fallback.
  return {
    ...r,
    isp: r.connection?.isp ?? r.isp,
    org: r.connection?.org ?? r.org,
    asn: r.connection?.asn ?? r.asn,
  };
}

function isIpLike(s: string): boolean {
  return parseIPv4(s) !== null || parseIPv6(s) !== null;
}

function isValidDomain(s: string): boolean {
  const d = s.trim().toLowerCase().replace(/\.$/, "");
  return /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63}(?<!-))*\.[a-z]{2,}$/.test(d);
}

/* ── what-is-my-ip ──────────────────────────────────────────── */

function WhatIsMyIp() {
  const [ip, setIp] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetchJson<{ ip: string }>("https://api.ipify.org?format=json", { timeoutMs: 10000 });
      if (!r.ip || !isIpLike(r.ip)) throw new Error("The service returned an unexpected answer.");
      setIp(r.ip);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not detect your IP address.");
      setIp(null);
    } finally {
      setBusy(false);
    }
  };

  // Detect once on mount (client-only effect; SSR stays clean).
  const didRun = useRef(false);
  useEffect(() => {
    if (!didRun.current) {
      didRun.current = true;
      void detect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const version = ip ? (parseIPv4(ip) !== null ? "IPv4" : "IPv6") : null;

  return (
    <div>
      {busy && <BusyNote>Detecting your public IP address…</BusyNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {ip && (
        <div>
          <div className="rounded-xl border border-[#121212]/12 bg-[#f6f1e6] px-5 py-6 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Your public {version} address
            </div>
            <div className="mt-2 break-all font-mono text-3xl font-semibold text-[#163D2B] sm:text-4xl">
              {ip}
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <CopyButton text={ip} label="Copy IP" />
            </div>
          </div>
          <div className="mt-5">
            <StatsGrid
              items={[
                ["Version", version ?? "—"],
                ["Type", version === "IPv4" ? ipv4Kind(parseIPv4(ip) as number) : "Global unicast"],
                ["Decimal", parseIPv4(ip) !== null ? String(parseIPv4(ip) as number) : "—"],
                ["Hex", parseIPv4(ip) !== null ? `0x${(parseIPv4(ip) as number).toString(16).toUpperCase()}` : "—"],
              ]}
            />
          </div>
          <p className="mt-4 text-xs text-muted">
            Your address is fetched from api.ipify.org and never stored. If it changes, your
            provider may be rotating addresses — press Detect again to refresh.
          </p>
        </div>
      )}
      <div className="mt-5 flex items-center gap-3">
        <PrimaryButton onClick={() => void detect()} disabled={busy}>
          {ip ? "Detect again" : "Detect my IP"}
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ── ip-validator ───────────────────────────────────────────── */

function IpValidator() {
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    const s = input.trim();
    if (!s) return null;
    const v4 = parseIPv4(s);
    if (v4 !== null) {
      return {
        kind: "IPv4" as const,
        valid: true,
        rows: [
          ["Address", ipv4ToString(v4), ipv4ToString(v4)],
          ["Decimal value", String(v4), String(v4)],
          ["Hexadecimal", `0x${v4.toString(16).toUpperCase().padStart(8, "0")}`, `0x${v4.toString(16).toUpperCase().padStart(8, "0")}`],
          ["Binary", ipv4Binary(v4), ipv4Binary(v4)],
          ["Class", ipv4Class(v4), undefined],
          ["Type", ipv4Kind(v4), undefined],
        ] as Array<[string, string, string?]>,
      };
    }
    const v6 = parseIPv6(s);
    if (v6 !== null) {
      return {
        kind: "IPv6" as const,
        valid: true,
        rows: [
          ["Compressed", formatIPv6(v6, true), formatIPv6(v6, true)],
          ["Expanded", formatIPv6(v6, false), formatIPv6(v6, false)],
          ["Type", ipv6Kind(v6), undefined],
          ["Groups", v6.map((g) => g.toString(16).padStart(4, "0")).join(":"), undefined],
        ] as Array<[string, string, string?]>,
      };
    }
    return { kind: null, valid: false, rows: [] as Array<[string, string, string?]> };
  }, [input]);

  return (
    <div>
      <Field label="IP address to validate">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 192.168.1.1 or 2001:4860:4860::8888"
          className={inputCls}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      {result && result.valid && (
        <div className="mt-5">
          <OkNote>
            Valid {result.kind} address — parsed live below.
          </OkNote>
          <div className="mt-4">
            <KvTable rows={result.rows} />
          </div>
        </div>
      )}
      {result && !result.valid && (
        <ErrorNote>
          “{input.trim()}” is not a valid IPv4 or IPv6 address. IPv4 needs four numbers from 0–255
          separated by dots; IPv6 needs eight hex groups (or a valid :: compression).
        </ErrorNote>
      )}
      {!result && (
        <p className="mt-4 text-sm text-muted">
          Type an address to check it instantly — nothing is sent anywhere; validation runs
          entirely in your browser.
        </p>
      )}
      <div className="mt-4">
        <ResetButton onClick={() => setInput("")} />
      </div>
    </div>
  );
}

/* ── Shared live IP detail view (used by ipv4/ipv6/geolocation/isp/asn) ── */

function IpDetailPanel({ data }: { data: IpWhoResult }) {
  const rows: Array<[string, ReactNode, string?]> = [];
  rows.push(["IP address", data.ip, data.ip]);
  rows.push(["Type", data.type === "IPv4" ? "IPv4" : "IPv6", undefined]);
  if (data.country) rows.push(["Country", `${data.country}${data.country_code ? ` (${data.country_code})` : ""}`, undefined]);
  if (data.region) rows.push(["Region / state", data.region, undefined]);
  if (data.city) rows.push(["City", data.city, undefined]);
  if (data.postal) rows.push(["Postal code", data.postal, undefined]);
  if (data.latitude !== undefined && data.longitude !== undefined) {
    rows.push([
      "Coordinates",
      `${data.latitude}, ${data.longitude}`,
      `${data.latitude}, ${data.longitude}`,
    ]);
  }
  if (data.timezone?.id) {
    rows.push([
      "Timezone",
      `${data.timezone.id}${data.timezone.utc ? ` (${data.timezone.utc})` : ""}`,
      undefined,
    ]);
  }
  if (data.isp) rows.push(["ISP", data.isp, undefined]);
  if (data.org) rows.push(["Organisation", data.org, undefined]);
  if (data.asn !== undefined) rows.push(["ASN", `AS${data.asn}`, `AS${data.asn}`]);
  if (data.continent) rows.push(["Continent", data.continent, undefined]);
  return <KvTable rows={rows} />;
}

/* ── ipv4-lookup ────────────────────────────────────────────── */

function Ipv4Lookup() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<IpWhoResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => (input.trim() ? parseIPv4(input.trim()) : null), [input]);

  const lookup = async () => {
    const s = input.trim();
    if (parsed === null) {
      setError("Enter a valid IPv4 address first (four numbers 0–255, separated by dots).");
      setData(null);
      return;
    }
    setBusy(true);
    setError(null);
    setData(null);
    try {
      setData(await ipWhoLookup(s));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Field label="IPv4 address">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void lookup();
          }}
          placeholder="e.g. 8.8.8.8"
          className={inputCls}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      {parsed !== null && (
        <div className="mt-4">
          <StatsGrid
            items={[
              ["Class", ipv4Class(parsed)],
              ["Type", ipv4Kind(parsed)],
              ["Decimal", String(parsed)],
              ["Binary", ipv4Binary(parsed)],
            ]}
          />
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton onClick={() => void lookup()} disabled={busy || parsed === null}>
          Look up
        </PrimaryButton>
        <ResetButton
          onClick={() => {
            setInput("");
            setData(null);
            setError(null);
          }}
        />
      </div>
      {busy && <BusyNote>Querying ipwho.is for {input.trim()}…</BusyNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {data && (
        <div className="mt-5">
          <OkNote>Live lookup result for {data.ip}.</OkNote>
          <div className="mt-4">
            <IpDetailPanel data={data} />
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-muted">
        The local parse (class, type, binary) is computed in your browser. Country, city, ISP and
        ASN come from the free ipwho.is service — no key, no account, nothing stored.
      </p>
    </div>
  );
}

/* ── ipv6-lookup ────────────────────────────────────────────── */

function Ipv6Lookup() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<IpWhoResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => (input.trim() ? parseIPv6(input.trim()) : null), [input]);

  const lookup = async () => {
    const s = input.trim();
    if (parsed === null) {
      setError("Enter a valid IPv6 address first (eight hex groups, or a valid :: compression).");
      setData(null);
      return;
    }
    setBusy(true);
    setError(null);
    setData(null);
    try {
      setData(await ipWhoLookup(s));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Field label="IPv6 address">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void lookup();
          }}
          placeholder="e.g. 2001:4860:4860::8888"
          className={inputCls}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      {parsed !== null && (
        <div className="mt-4">
          <StatsGrid
            items={[
              ["Type", ipv6Kind(parsed)],
              ["Compressed", formatIPv6(parsed, true)],
              ["Expanded", formatIPv6(parsed, false)],
              ["Groups", "8 × 16-bit"],
            ]}
          />
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton onClick={() => void lookup()} disabled={busy || parsed === null}>
          Look up
        </PrimaryButton>
        <ResetButton
          onClick={() => {
            setInput("");
            setData(null);
            setError(null);
          }}
        />
      </div>
      {busy && <BusyNote>Querying ipwho.is for {input.trim()}…</BusyNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {data && (
        <div className="mt-5">
          <OkNote>Live lookup result for {data.ip}.</OkNote>
          <div className="mt-4">
            <IpDetailPanel data={data} />
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-muted">
        The local parse (compressed/expanded form, address type) is computed in your browser.
        Country, city, ISP and ASN come from the free ipwho.is service — no key, no account,
        nothing stored.
      </p>
    </div>
  );
}

/* ── ip-geolocation ─────────────────────────────────────────── */

function IpGeolocation() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<IpWhoResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (target?: string) => {
    const s = (target ?? input).trim();
    if (s && !isIpLike(s)) {
      setError("Enter a valid IPv4 or IPv6 address — or leave it blank to look up your own IP.");
      setData(null);
      return;
    }
    setBusy(true);
    setError(null);
    setData(null);
    try {
      let ip = s;
      if (!ip) {
        const me = await fetchJson<{ ip: string }>("https://api.ipify.org?format=json", { timeoutMs: 10000 });
        ip = me.ip;
        setInput(ip);
      }
      setData(await ipWhoLookup(ip));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed.");
    } finally {
      setBusy(false);
    }
  };

  const mapUrl =
    data?.latitude !== undefined && data?.longitude !== undefined
      ? `https://www.openstreetmap.org/?mlat=${data.latitude}&mlon=${data.longitude}#map=10/${data.latitude}/${data.longitude}`
      : null;

  return (
    <div>
      <Field label="IP address (leave blank for your own IP)">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void lookup();
          }}
          placeholder="e.g. 8.8.8.8 — or blank for my IP"
          className={inputCls}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton onClick={() => void lookup()} disabled={busy}>
          Locate
        </PrimaryButton>
        <SecondaryButton onClick={() => void lookup("")} disabled={busy}>
          Locate my IP
        </SecondaryButton>
        <ResetButton
          onClick={() => {
            setInput("");
            setData(null);
            setError(null);
          }}
        />
      </div>
      {busy && <BusyNote>Looking up the location…</BusyNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {data && (
        <div className="mt-5">
          <OkNote>Location for {data.ip}.</OkNote>
          <div className="mt-4">
            <IpDetailPanel data={data} />
          </div>
          {mapUrl && (
            <p className="mt-4 text-sm">
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[var(--v8-accent-2)] underline underline-offset-2"
              >
                View this location on OpenStreetMap →
              </a>
            </p>
          )}
        </div>
      )}
      <p className="mt-4 text-xs text-muted">
        Geolocation comes from the free ipwho.is service (no key, no account). IP-based location
        is approximate — it usually resolves to the city or region of the network, not a street
        address.
      </p>
    </div>
  );
}

/* ── isp-lookup ─────────────────────────────────────────────── */

function IspLookup() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<IpWhoResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async () => {
    const s = input.trim();
    if (!isIpLike(s)) {
      setError("Enter a valid IPv4 or IPv6 address first.");
      setData(null);
      return;
    }
    setBusy(true);
    setError(null);
    setData(null);
    try {
      setData(await ipWhoLookup(s));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Field label="IP address">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void lookup();
          }}
          placeholder="e.g. 1.1.1.1"
          className={inputCls}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton onClick={() => void lookup()} disabled={busy || !isIpLike(input.trim())}>
          Find ISP
        </PrimaryButton>
        <ResetButton
          onClick={() => {
            setInput("");
            setData(null);
            setError(null);
          }}
        />
      </div>
      {busy && <BusyNote>Querying ipwho.is for {input.trim()}…</BusyNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {data && (
        <div className="mt-5">
          <div className="rounded-xl border border-[#121212]/12 bg-[#f6f1e6] px-5 py-6 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Internet provider for {data.ip}
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#163D2B] sm:text-3xl">
              {data.isp ?? "Unknown"}
            </div>
            {data.org && data.org !== data.isp && (
              <div className="mt-1 text-sm text-muted">Organisation: {data.org}</div>
            )}
          </div>
          <div className="mt-4">
            <IpDetailPanel data={data} />
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-muted">
        Provider data comes from the free ipwho.is service (no key, no account). The ISP shown is
        the network that owns the address range — for VPNs and cloud hosts it is the VPN or cloud
        provider, not the end user’s home ISP.
      </p>
    </div>
  );
}

/* ── asn-lookup ─────────────────────────────────────────────── */

function AsnLookup() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<IpWhoResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async () => {
    const s = input.trim();
    if (!isIpLike(s)) {
      setError("Enter a valid IPv4 or IPv6 address first.");
      setData(null);
      return;
    }
    setBusy(true);
    setError(null);
    setData(null);
    try {
      setData(await ipWhoLookup(s));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Field label="IP address">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void lookup();
          }}
          placeholder="e.g. 8.8.8.8"
          className={inputCls}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton onClick={() => void lookup()} disabled={busy || !isIpLike(input.trim())}>
          Identify ASN
        </PrimaryButton>
        <ResetButton
          onClick={() => {
            setInput("");
            setData(null);
            setError(null);
          }}
        />
      </div>
      {busy && <BusyNote>Identifying the autonomous system for {input.trim()}…</BusyNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {data && (
        <div className="mt-5">
          <div className="rounded-xl border border-[#121212]/12 bg-[#f6f1e6] px-5 py-6 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Autonomous system for {data.ip}
            </div>
            <div className="mt-2 font-mono text-3xl font-semibold text-[#163D2B] sm:text-4xl">
              {data.asn !== undefined ? `AS${data.asn}` : "Unknown"}
            </div>
            <div className="mt-1 text-sm font-medium text-[#163D2B]/80">{data.org ?? data.isp ?? ""}</div>
          </div>
          <div className="mt-4">
            <KvTable
              rows={[
                ["ASN", data.asn !== undefined ? `AS${data.asn}` : "—", data.asn !== undefined ? `AS${data.asn}` : undefined],
                ["Network name", data.org ?? "—", undefined],
                ["ISP", data.isp ?? "—", undefined],
                ["Country", data.country ?? "—", undefined],
                ["IP address", data.ip, data.ip],
              ]}
            />
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-muted">
        ASN and network name come from the free ipwho.is service (no key, no account, nothing
        stored). No working free prefix-range API was found — the iptoasn service returns an
        error page instead of data — so the announced prefix is not shown rather than guessed.
      </p>
    </div>
  );
}

/* ── subnet-calculator ──────────────────────────────────────── */

function SubnetCalculator() {
  const [ip, setIp] = useState("192.168.1.0");
  const [prefix, setPrefix] = useState("24");

  const parsed = useMemo(() => parseIPv4(ip.trim()), [ip]);
  const prefixNum = useMemo(() => {
    const n = Number(prefix);
    return Number.isInteger(n) && n >= 0 && n <= 32 ? n : null;
  }, [prefix]);

  const info = useMemo(
    () => (parsed !== null && prefixNum !== null ? subnetInfo(parsed, prefixNum) : null),
    [parsed, prefixNum],
  );

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <Field label="IP address">
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="e.g. 192.168.1.0"
            className={inputCls}
            spellCheck={false}
            autoComplete="off"
          />
        </Field>
        <Field label="Prefix length (/bits)">
          <input
            type="number"
            min={0}
            max={32}
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      {parsed === null && ip.trim() !== "" && (
        <ErrorNote>“{ip.trim()}” is not a valid IPv4 address.</ErrorNote>
      )}
      {prefixNum === null && (
        <ErrorNote>Prefix length must be a whole number from 0 to 32.</ErrorNote>
      )}
      {info && (
        <div className="mt-5">
          <StatsGrid
            items={[
              ["Network", ipv4ToString(info.network)],
              ["Broadcast", ipv4ToString(info.broadcast)],
              ["Total addresses", info.total.toLocaleString()],
              ["Usable hosts", info.usable.toLocaleString()],
            ]}
          />
          <div className="mt-4">
            <KvTable
              rows={[
                ["Subnet mask", ipv4ToString(info.mask), ipv4ToString(info.mask)],
                ["Wildcard mask", ipv4ToString(info.wildcard), ipv4ToString(info.wildcard)],
                ["CIDR notation", `${ipv4ToString(info.network)}/${info.prefix}`, `${ipv4ToString(info.network)}/${info.prefix}`],
                ["First usable host", info.prefix >= 31 ? "— (see note)" : ipv4ToString(info.first), info.prefix >= 31 ? undefined : ipv4ToString(info.first)],
                ["Last usable host", info.prefix >= 31 ? "— (see note)" : ipv4ToString(info.last), info.prefix >= 31 ? undefined : ipv4ToString(info.last)],
                ["Host range", `${ipv4ToString(info.first)} – ${ipv4ToString(info.last)}`, undefined],
                ["IP class", ipv4Class(parsed as number), undefined],
                ["Network type", ipv4Kind(info.network), undefined],
              ]}
            />
          </div>
          <div className="mt-4">
            <OutputBox
              label="Binary breakdown"
              value={[
                `IP      ${ipv4Binary(parsed as number)}`,
                `Mask    ${ipv4Binary(info.mask)}`,
                `Network ${ipv4Binary(info.network)}`,
                `Bcast   ${ipv4Binary(info.broadcast)}`,
              ].join("\n")}
              rows={5}
            />
          </div>
          {info.prefix === 31 && (
            <p className="mt-3 text-xs text-muted">
              A /31 has no network or broadcast address — both addresses are usable (RFC 3021,
              point-to-point links).
            </p>
          )}
          {info.prefix === 32 && (
            <p className="mt-3 text-xs text-muted">
              A /32 is a single host route — the address itself is the network and the only host.
            </p>
          )}
        </div>
      )}
      <div className="mt-4">
        <ResetButton
          onClick={() => {
            setIp("192.168.1.0");
            setPrefix("24");
          }}
        />
      </div>
    </div>
  );
}

/* ── cidr-calculator ────────────────────────────────────────── */

function CidrCalculator() {
  const [cidr, setCidr] = useState("192.168.1.0/24");

  const parsed = useMemo(() => {
    const m = cidr.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
    if (!m) return null;
    const ip = parseIPv4(m[1] as string);
    const prefix = Number(m[2]);
    if (ip === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null;
    return { ip, prefix, entered: m[1] as string };
  }, [cidr]);

  const info = useMemo(
    () => (parsed ? subnetInfo(parsed.ip, parsed.prefix) : null),
    [parsed],
  );

  return (
    <div>
      <Field label="CIDR notation">
        <input
          value={cidr}
          onChange={(e) => setCidr(e.target.value)}
          placeholder="e.g. 192.168.1.0/24"
          className={inputCls}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      {cidr.trim() !== "" && !parsed && (
        <ErrorNote>
          Enter CIDR notation like 192.168.1.0/24 — an IPv4 address, a slash, and a prefix from
          0 to 32.
        </ErrorNote>
      )}
      {parsed && info && (
        <div className="mt-5">
          {parsed.entered !== ipv4ToString(info.network) && (
            <p className="mb-4 rounded-lg border border-[var(--v8-accent-2)]/30 bg-[var(--v8-accent-2)]/10 px-4 py-3 text-sm text-[var(--v8-accent-2)]">
              Note: {parsed.entered} is a host inside the block — the network address is{" "}
              {ipv4ToString(info.network)}.
            </p>
          )}
          <StatsGrid
            items={[
              ["Network", ipv4ToString(info.network)],
              ["Broadcast", ipv4ToString(info.broadcast)],
              ["Total addresses", info.total.toLocaleString()],
              ["Usable hosts", info.usable.toLocaleString()],
            ]}
          />
          <div className="mt-4">
            <KvTable
              rows={[
                ["CIDR", `${ipv4ToString(info.network)}/${info.prefix}`, `${ipv4ToString(info.network)}/${info.prefix}`],
                ["Subnet mask", ipv4ToString(info.mask), ipv4ToString(info.mask)],
                ["Wildcard mask", ipv4ToString(info.wildcard), ipv4ToString(info.wildcard)],
                ["First host", ipv4ToString(info.first), ipv4ToString(info.first)],
                ["Last host", ipv4ToString(info.last), ipv4ToString(info.last)],
                ["Host range", `${ipv4ToString(info.first)} – ${ipv4ToString(info.last)}`, undefined],
                ["IP class", ipv4Class(parsed.ip), undefined],
              ]}
            />
          </div>
          <div className="mt-4">
            <OutputBox
              label="Binary breakdown"
              value={[
                `IP      ${ipv4Binary(parsed.ip)}`,
                `Mask    ${ipv4Binary(info.mask)}  (/${info.prefix})`,
                `Network ${ipv4Binary(info.network)}`,
                `Bcast   ${ipv4Binary(info.broadcast)}`,
              ].join("\n")}
              rows={5}
            />
          </div>
        </div>
      )}
      <div className="mt-4">
        <ResetButton onClick={() => setCidr("192.168.1.0/24")} />
      </div>
    </div>
  );
}

/* ── ip-range-calculator ────────────────────────────────────── */

type RangeResult =
  | { error: string }
  | { error: null; start: number; end: number; total: number; cidrs: string[] };

function IpRangeCalculator() {
  const [start, setStart] = useState("192.168.1.10");
  const [end, setEnd] = useState("192.168.1.100");

  const result = useMemo<RangeResult | null>(() => {
    const s = parseIPv4(start.trim());
    const e = parseIPv4(end.trim());
    if (start.trim() === "" || end.trim() === "") return null;
    if (s === null || e === null) return { error: "Both ends must be valid IPv4 addresses." };
    if (s > e) return { error: "The start address must be less than or equal to the end address." };
    const total = e - s + 1;
    return { error: null, start: s, end: e, total, cidrs: rangeToCidrs(s, e) };
  }, [start, end]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start IP">
          <input
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="e.g. 192.168.1.10"
            className={inputCls}
            spellCheck={false}
            autoComplete="off"
          />
        </Field>
        <Field label="End IP">
          <input
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder="e.g. 192.168.1.100"
            className={inputCls}
            spellCheck={false}
            autoComplete="off"
          />
        </Field>
      </div>
      {result?.error && <ErrorNote>{result.error}</ErrorNote>}
      {result && result.error === null && (
        <div className="mt-5">
          <StatsGrid
            items={[
              ["Total addresses", result.total.toLocaleString()],
              ["CIDR blocks", String(result.cidrs.length)],
              ["First", ipv4ToString(result.start)],
              ["Last", ipv4ToString(result.end)],
            ]}
          />
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <label className={labelCls + " !mb-0"}>
                Minimal CIDR blocks covering the range ({result.cidrs.length})
              </label>
              <CopyButton text={result.cidrs.join("\n")} label="Copy list" />
            </div>
            <div className="max-h-64 overflow-auto rounded-xl border border-[#121212]/12 bg-[#f6f1e6] px-4 py-3 font-mono text-sm leading-relaxed text-[#163D2B]">
              {result.cidrs.map((c) => (
                <div key={c}>{c}</div>
              ))}
            </div>
            <div className="mt-3">
              <SecondaryButton onClick={() => downloadText(result.cidrs.join("\n") + "\n", "ip-range-cidrs.txt", "text/plain")}>
                Download list (.txt)
              </SecondaryButton>
            </div>
          </div>
          {result.total > 65536 && (
            <p className="mt-3 text-xs text-muted">
              This range holds {result.total.toLocaleString()} addresses — the list above is the
              minimal set of CIDR blocks that covers it exactly, with no extras.
            </p>
          )}
        </div>
      )}
      <div className="mt-4">
        <ResetButton
          onClick={() => {
            setStart("192.168.1.10");
            setEnd("192.168.1.100");
          }}
        />
      </div>
    </div>
  );
}

/* ── dns-lookup ─────────────────────────────────────────────── */

const DNS_TYPE_LABELS = DNS_TYPES.map(([n]) => n);

function DnsLookup() {
  const [domain, setDomain] = useState("google.com");
  const [type, setType] = useState<string>("A");
  const [answers, setAnswers] = useState<Array<{ type: string; data: string; ttl: number }> | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async () => {
    const d = domain.trim().toLowerCase().replace(/\.$/, "");
    if (!isValidDomain(d)) {
      setError("Enter a valid domain name, e.g. google.com.");
      setAnswers(null);
      setStatus(null);
      return;
    }
    setBusy(true);
    setError(null);
    setAnswers(null);
    setStatus(null);
    try {
      const types = type === "ALL" ? DNS_TYPES.map(([, v]) => v) : [DNS_TYPES.find(([n]) => n === type)?.[1] ?? 1];
      const responses = await Promise.all(
        types.map(async (t) => {
          try {
            return await dohQuery("https://dns.google/resolve", d, t);
          } catch (e) {
            return { Status: -1, Comment: e instanceof Error ? e.message : "Query failed." } as DohResponse;
          }
        }),
      );
      const merged: Array<{ type: string; data: string; ttl: number }> = [];
      let sawError = false;
      let sawNx = false;
      for (const r of responses) {
        if (r.Status === 3) sawNx = true;
        if (r.Status !== 0) {
          if (r.Status === -1) sawError = true;
          continue;
        }
        for (const a of r.Answer ?? []) {
          merged.push({ type: DNS_TYPE_NAME[a.type] ?? `TYPE${a.type}`, data: a.data, ttl: a.TTL });
        }
      }
      if (merged.length === 0) {
        if (sawNx) {
          setError(`"${d}" does not exist (NXDOMAIN) — check the spelling.`);
        } else if (sawError) {
          setError("The DNS service could not be reached. Check your connection and try again.");
        } else {
          setError(`No ${type === "ALL" ? "" : type + " "}records found for "${d}".`);
        }
        setAnswers(null);
        return;
      }
      setAnswers(merged);
      setStatus(`NOERROR — ${merged.length} record${merged.length === 1 ? "" : "s"} from Google Public DNS`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "DNS lookup failed.");
      setAnswers(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Domain name" className="min-w-56 flex-1">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void lookup();
            }}
            placeholder="e.g. google.com"
            className={inputCls}
            spellCheck={false}
            autoComplete="off"
          />
        </Field>
        <Field label="Record type" className="w-36">
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            {DNS_TYPE_LABELS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value="ALL">ALL</option>
          </select>
        </Field>
        <div className="pb-2.5">
          <PrimaryButton onClick={() => void lookup()} disabled={busy}>
            Look up
          </PrimaryButton>
        </div>
      </div>
      {busy && <BusyNote>Querying Google Public DNS for {domain.trim()}…</BusyNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {answers && (
        <div className="mt-5">
          <OkNote>{status}</OkNote>
          <div className="mt-4 overflow-hidden rounded-xl border border-[#121212]/12 bg-[#f6f1e6]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#121212]/10 text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Record</th>
                  <th className="px-4 py-2.5 text-right">TTL</th>
                </tr>
              </thead>
              <tbody>
                {answers.map((a, i) => (
                  <tr key={i} className="border-t border-[#121212]/5">
                    <td className="px-4 py-2.5 font-mono font-semibold text-[#163D2B]">{a.type}</td>
                    <td className="break-all px-4 py-2.5 font-mono text-[#163D2B]/90">{a.data}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted">{a.ttl}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <CopyButton
              text={answers.map((a) => `${a.type}\t${a.data}\t${a.ttl}`).join("\n")}
              label="Copy records"
            />
            <SecondaryButton
              onClick={() =>
                downloadText(
                  answers.map((a) => `${a.type}\t${a.data}\t${a.ttl}`).join("\n") + "\n",
                  `dns-${domain.trim()}.txt`,
                  "text/plain",
                )
              }
            >
              Download (.txt)
            </SecondaryButton>
          </div>
        </div>
      )}
      <div className="mt-4">
        <ResetButton
          onClick={() => {
            setDomain("google.com");
            setType("A");
            setAnswers(null);
            setError(null);
            setStatus(null);
          }}
        />
      </div>
      <p className="mt-3 text-xs text-muted">
        Records are fetched live from Google Public DNS over HTTPS (dns.google). “ALL” queries A,
        AAAA, MX, TXT, NS, CNAME and SOA in parallel.
      </p>
    </div>
  );
}

/* ── dns-propagation-checker ─────────────────────────────────── */

/* Two resolvers with documented browser-friendly JSON DoH endpoints.
   (Quad9's :5053 JSON endpoint was tried and is unreachable, and it is
   not in the site's CSP connect-src — so it is deliberately not used.) */
const PROPAGATION_RESOLVERS: Array<{ name: string; base: string; headers?: Record<string, string> }> = [
  { name: "Google (8.8.8.8)", base: "https://dns.google/resolve" },
  {
    name: "Cloudflare (1.1.1.1)",
    base: "https://cloudflare-dns.com/dns-query",
    headers: { Accept: "application/dns-json" },
  },
];

interface ResolverResult {
  name: string;
  state: "ok" | "empty" | "error";
  values: string[];
  note: string;
}

function DnsPropagationChecker() {
  const [domain, setDomain] = useState("google.com");
  const [type, setType] = useState<string>("A");
  const [results, setResults] = useState<ResolverResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    const d = domain.trim().toLowerCase().replace(/\.$/, "");
    if (!isValidDomain(d)) {
      setError("Enter a valid domain name, e.g. google.com.");
      setResults(null);
      return;
    }
    const typeNum = DNS_TYPES.find(([n]) => n === type)?.[1] ?? 1;
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const settled = await Promise.all(
        PROPAGATION_RESOLVERS.map(async (r): Promise<ResolverResult> => {
          try {
            const res = await dohQuery(r.base, d, typeNum, r.headers);
            if (res.Status === 3) return { name: r.name, state: "empty", values: [], note: "NXDOMAIN — domain does not exist" };
            if (res.Status !== 0) {
              return { name: r.name, state: "error", values: [], note: `Resolver error (${DOH_STATUS[res.Status] ?? `Status ${res.Status}`})` };
            }
            const vals = (res.Answer ?? []).map((a) => a.data);
            return vals.length > 0
              ? { name: r.name, state: "ok", values: vals, note: `${vals.length} record${vals.length === 1 ? "" : "s"}` }
              : { name: r.name, state: "empty", values: [], note: "No records of this type" };
          } catch (e) {
            return { name: r.name, state: "error", values: [], note: e instanceof Error ? e.message : "Resolver unreachable" };
          }
        }),
      );
      setResults(settled);
      if (settled.every((r) => r.state === "error")) {
        setError("Both resolvers failed to answer — check your connection and try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const consensus =
    results && results.some((r) => r.state === "ok")
      ? (() => {
          const okSets = results
            .filter((r) => r.state === "ok")
            .map((r) => [...r.values].sort().join("|"));
          const allSame = okSets.every((s) => s === okSets[0]);
          return allSame
            ? "Both resolvers agree — the record looks fully propagated."
            : "Resolvers disagree — the change is still propagating (or records genuinely differ).";
        })()
      : null;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Domain name" className="min-w-56 flex-1">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void check();
            }}
            placeholder="e.g. example.com"
            className={inputCls}
            spellCheck={false}
            autoComplete="off"
          />
        </Field>
        <Field label="Record type" className="w-36">
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            {DNS_TYPE_LABELS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <div className="pb-2.5">
          <PrimaryButton onClick={() => void check()} disabled={busy}>
            Check propagation
          </PrimaryButton>
        </div>
      </div>
      {busy && <BusyNote>Asking Google and Cloudflare for {type} records…</BusyNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {results && (
        <div className="mt-5 space-y-3">
          {consensus && <OkNote>{consensus}</OkNote>}
          {results.map((r) => (
            <div key={r.name} className="rounded-xl border border-[#121212]/12 bg-[#f6f1e6] px-4 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[#163D2B]">{r.name}</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    r.state === "ok" && "bg-[#163D2B]/10 text-[#163D2B]",
                    r.state === "empty" && "bg-amber-500/15 text-amber-700",
                    r.state === "error" && "bg-red-500/10 text-red-600",
                  )}
                >
                  {r.state === "ok" ? "✓ Answered" : r.state === "empty" ? "No record" : "Unavailable"}
                </span>
              </div>
              {r.values.length > 0 ? (
                <ul className="mt-2 space-y-1 font-mono text-sm text-[#163D2B]/90">
                  {r.values.map((v, i) => (
                    <li key={i} className="break-all">
                      {v}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 text-sm text-muted">{r.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="mt-4">
        <ResetButton
          onClick={() => {
            setDomain("google.com");
            setType("A");
            setResults(null);
            setError(null);
          }}
        />
      </div>
      <p className="mt-3 text-xs text-muted">
        Each resolver is queried live over DNS-over-HTTPS. Agreement across both means the
        record has spread; disagreement usually means a recent change is still propagating (DNS
        caches can take minutes to hours). A resolver that fails to answer is reported as
        unavailable, not as a missing record.
      </p>
    </div>
  );
}

/* ── domain-rdap-lookup ──────────────────────────────────────── */

interface RdapEntity {
  objectClassName?: string;
  roles?: string[];
  // Wire format is `vcardArray` (lowercase c, RFC 7483) — NOT `vCardArray`.
  vcardArray?: Array<unknown>;
  publicIds?: Array<{ type?: string; identifier?: string }>;
}

interface RdapEvent {
  eventAction?: string;
  eventDate?: string;
}

interface RdapResponse {
  objectClassName?: string;
  ldhName?: string;
  unicodeName?: string;
  status?: string[];
  entities?: RdapEntity[];
  events?: RdapEvent[];
  nameservers?: Array<{ ldhName?: string }>;
  port43?: string;
}

function vcardName(vcardArray: Array<unknown> | undefined): string | null {
  try {
    const vcard = vcardArray?.[1] as Array<unknown> | undefined;
    if (!Array.isArray(vcard)) return null;
    for (const prop of vcard) {
      const arr = prop as Array<unknown>;
      if (arr?.[0] === "fn" && typeof arr[3] === "string") return arr[3];
    }
    return null;
  } catch {
    return null;
  }
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function DomainRdapLookup() {
  const [domain, setDomain] = useState("google.com");
  const [data, setData] = useState<RdapResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async () => {
    const d = domain.trim().toLowerCase().replace(/\.$/, "");
    if (!isValidDomain(d)) {
      setError("Enter a valid domain name, e.g. google.com.");
      setData(null);
      return;
    }
    setBusy(true);
    setError(null);
    setData(null);
    try {
      const r = await fetchJson<RdapResponse>(`https://rdap.org/domain/${encodeURIComponent(d)}`, {
        timeoutMs: 15000,
      });
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "RDAP lookup failed.");
    } finally {
      setBusy(false);
    }
  };

  const registrar = useMemo(() => {
    if (!data?.entities) return null;
    const ent = data.entities.find((e) => e.roles?.includes("registrar"));
    if (!ent) return null;
    return vcardName(ent.vcardArray);
  }, [data]);

  const eventDate = (action: string): string | undefined =>
    data?.events?.find((e) => e.eventAction === action)?.eventDate;

  return (
    <div>
      <Field label="Domain name">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void lookup();
          }}
          placeholder="e.g. google.com"
          className={inputCls}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton onClick={() => void lookup()} disabled={busy}>
          Look up registration
        </PrimaryButton>
        <ResetButton
          onClick={() => {
            setDomain("google.com");
            setData(null);
            setError(null);
          }}
        />
      </div>
      {busy && <BusyNote>Querying RDAP (rdap.org) for {domain.trim()}…</BusyNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {data && (
        <div className="mt-5">
          <OkNote>Registration data for {data.ldhName ?? domain.trim()}.</OkNote>
          <div className="mt-4">
            <KvTable
              rows={[
                ["Domain", data.ldhName ?? domain.trim(), data.ldhName ?? domain.trim()],
                ["Registrar", registrar ?? "Not listed", undefined],
                ["Registered", fmtDate(eventDate("registration")), undefined],
                ["Expires", fmtDate(eventDate("expiration")), undefined],
                ["Last changed", fmtDate(eventDate("last changed")), undefined],
                ["Status", (data.status ?? []).join(", ") || "—", undefined],
                [
                  "Nameservers",
                  (data.nameservers ?? []).map((n) => n.ldhName).filter(Boolean).join(", ") || "—",
                  undefined,
                ],
                ["Port 43 (whois)", data.port43 ?? "—", undefined],
              ]}
            />
          </div>
          <div className="mt-4">
            <OutputBox
              label="Raw RDAP response (JSON)"
              value={JSON.stringify(data, null, 2)}
              rows={10}
            />
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-muted">
        Data comes live from rdap.org, which forwards the query to the domain’s authoritative RDAP
        server — the modern replacement for WHOIS. Personal contact details are redacted by
        registrars under privacy law, so they are not shown here.
      </p>
    </div>
  );
}

/* ── url-parser ─────────────────────────────────────────────── */

function UrlParser() {
  const [input, setInput] = useState("https://user:pass@example.com:8080/path/to/page?query=hello&lang=en#section");

  const result = useMemo(() => {
    const raw = input.trim();
    if (!raw) return null;
    let candidate = raw;
    let assumedScheme = false;
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
      candidate = `https://${candidate}`;
      assumedScheme = true;
    }
    try {
      const u = new URL(candidate);
      const params: Array<[string, string]> = [];
      u.searchParams.forEach((v, k) => params.push([k, v]));
      return { url: u, params, assumedScheme, error: null as string | null };
    } catch {
      return { url: null, params: [] as Array<[string, string]>, assumedScheme, error: "That is not a parseable URL. Check the spelling and include a scheme like https://." };
    }
  }, [input]);

  return (
    <div>
      <Field label="URL to parse">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. https://example.com:8080/path?query=hello#section"
          className={inputCls}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      {result?.error && <ErrorNote>{result.error}</ErrorNote>}
      {result?.assumedScheme && !result.error && (
        <p className="mt-3 rounded-lg border border-[var(--v8-accent-2)]/30 bg-[var(--v8-accent-2)]/10 px-4 py-3 text-sm text-[var(--v8-accent-2)]">
          No scheme was given, so https:// was assumed.
        </p>
      )}
      {result?.url && (
        <div className="mt-5">
          <KvTable
            rows={[
              ["Protocol", result.url.protocol, result.url.protocol],
              ["Username", result.url.username || "—", result.url.username || undefined],
              ["Password", result.url.password ? "••••••••" : "—", undefined],
              ["Hostname", result.url.hostname, result.url.hostname],
              ["Port", result.url.port || "(default)", result.url.port || undefined],
              ["Path", result.url.pathname, result.url.pathname],
              ["Query string", result.url.search || "—", result.url.search || undefined],
              ["Hash / fragment", result.url.hash || "—", result.url.hash || undefined],
              ["Origin", result.url.origin, result.url.origin],
              ["Full URL", result.url.href, result.url.href],
            ]}
          />
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <label className={labelCls + " !mb-0"}>
                Query parameters ({result.params.length})
              </label>
              {result.params.length > 0 && (
                <CopyButton text={result.params.map(([k, v]) => `${k}=${v}`).join("\n")} label="Copy all" />
              )}
            </div>
            {result.params.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-[#121212]/12 bg-[#f6f1e6]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#121212]/10 text-left text-xs uppercase tracking-wider text-muted">
                      <th className="px-4 py-2.5">Parameter</th>
                      <th className="px-4 py-2.5">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.params.map(([k, v], i) => (
                      <tr key={i} className="border-t border-[#121212]/5">
                        <td className="break-all px-4 py-2.5 font-mono font-semibold text-[#163D2B]">{k}</td>
                        <td className="break-all px-4 py-2.5 font-mono text-[#163D2B]/90">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-[#121212]/15 px-4 py-4 text-sm text-muted">
                This URL has no query parameters.
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <CopyButton text={result.url.href} label="Copy full URL" />
            <ResetButton onClick={() => setInput("https://user:pass@example.com:8080/path/to/page?query=hello&lang=en#section")} />
          </div>
        </div>
      )}
      {!result && (
        <p className="mt-4 text-sm text-muted">
          Paste any URL to break it into protocol, host, port, path, query parameters and hash —
          parsed locally with the browser’s own URL parser, nothing is sent anywhere.
        </p>
      )}
    </div>
  );
}

/* ── Registry ───────────────────────────────────────────────── */

export const networkTools: Record<string, ToolComponent> = {
  "what-is-my-ip": WhatIsMyIp,
  "ipv4-lookup": Ipv4Lookup,
  "ipv6-lookup": Ipv6Lookup,
  "ip-geolocation": IpGeolocation,
  "ip-validator": IpValidator,
  "subnet-calculator": SubnetCalculator,
  "cidr-calculator": CidrCalculator,
  "ip-range-calculator": IpRangeCalculator,
  "dns-lookup": DnsLookup,
  "dns-propagation-checker": DnsPropagationChecker,
  "domain-rdap-lookup": DomainRdapLookup,
  "asn-lookup": AsnLookup,
  "isp-lookup": IspLookup,
  "url-parser": UrlParser,
};
