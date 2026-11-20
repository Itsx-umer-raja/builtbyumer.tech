"use client";

import type { ToolComponent } from "./registry";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  CopyButton,
  DownloadButton,
  ErrorNote,
  Field,
  FileDrop,
  OkNote,
  PrimaryButton,
  ResetButton,
  SecondaryButton,
  TextArea,
  inputCls,
  labelCls,
} from "./ui";
import { cn, clamp, downloadBlob, downloadText, formatBytes } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════
   Shared helpers
   ════════════════════════════════════════════════════════════════ */

function WarningNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
      <span>{children}</span>
    </p>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-cream">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-lime"
      />
      {label}
    </label>
  );
}

function ModeTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<[string, string]>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "rounded-lg border px-4 py-1.5 text-sm font-medium transition",
            value === id
              ? "border-[#163D2B]/60 bg-[#163D2B]/10 text-[#163D2B]"
              : "border-[#121212]/15 text-muted hover:text-cream",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-3 py-2.5 text-center">
      <div className="text-lg font-semibold text-[#163D2B]">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

function SizeStats({ before, after }: { before: string; after: string }) {
  const b = new TextEncoder().encode(before).length;
  const a = new TextEncoder().encode(after).length;
  const saved = b > 0 ? Math.max(0, Math.round(((b - a) / b) * 100)) : 0;
  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat label="Original" value={formatBytes(b)} />
      <Stat label="Result" value={formatBytes(a)} />
      <Stat label="Saved" value={`${saved}%`} />
    </div>
  );
}

/** Index just past the closing quote of a string literal starting at `start`. */
function findStringEnd(src: string, start: number): number {
  const quote = src[start];
  let i = start + 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === quote) return i + 1;
    if (c === "\n") return i; // unterminated — bail before the newline
    i++;
  }
  return src.length;
}

/* ── Markup (XML / HTML) tokenising and re-indentation ─────────── */

type MarkupKind =
  | "text"
  | "comment"
  | "cdata"
  | "pi"
  | "doctype"
  | "open"
  | "close"
  | "selfclose";

type MarkupToken = { kind: MarkupKind; name: string; raw: string };

const MARKUP_RE =
  /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/[^>]*>|<(?:"[^"]*"|'[^']*'|[^>])*>/g;

const HTML_VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "param", "source", "track", "wbr",
]);

const HTML_INLINE = new Set([
  "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn", "em",
  "i", "kbd", "mark", "q", "rp", "rt", "s", "samp", "small", "span", "strong",
  "sub", "sup", "time", "u", "var", "wbr", "img", "label", "button", "select",
  "textarea", "input",
]);

const MARKUP_PRESERVE = new Set(["script", "style", "pre", "textarea"]);

function tokenizeMarkup(src: string, isHtml: boolean): MarkupToken[] {
  const tokens: MarkupToken[] = [];
  let last = 0;
  for (const m of src.matchAll(MARKUP_RE)) {
    const idx = m.index;
    if (idx < last) continue; // inside a folded preserve block
    if (idx > last) tokens.push({ kind: "text", name: "", raw: src.slice(last, idx) });
    const raw = m[0];
    let kind: MarkupKind;
    let name = "";
    if (raw.startsWith("<!--")) kind = "comment";
    else if (raw.startsWith("<![CDATA[")) kind = "cdata";
    else if (raw.startsWith("<?")) kind = "pi";
    else if (raw.startsWith("<!")) kind = "doctype";
    else if (raw.startsWith("</")) {
      kind = "close";
      name = (raw.slice(2).match(/[a-zA-Z][a-zA-Z0-9:_-]*/) ?? [""])[0].toLowerCase();
    } else {
      name = (raw.slice(1).match(/[a-zA-Z][a-zA-Z0-9:_-]*/) ?? [""])[0].toLowerCase();
      kind = raw.endsWith("/>") ? "selfclose" : "open";
    }
    // Fold script/style/pre/textarea content (and their close tag region) into
    // the open token so their raw content is never re-tokenised or re-indented.
    if (isHtml && kind === "open" && !raw.endsWith("/>") && MARKUP_PRESERVE.has(name)) {
      const restStart = idx + raw.length;
      const rest = src.slice(restStart);
      const closeIdx = rest.search(new RegExp(`</${name}[\\s>]`, "i"));
      const endIdx = closeIdx === -1 ? src.length : restStart + closeIdx;
      tokens.push({ kind: "open", name, raw: src.slice(idx, endIdx) });
      last = endIdx;
      continue;
    }
    tokens.push({ kind, name, raw });
    last = idx + raw.length;
  }
  if (last < src.length) tokens.push({ kind: "text", name: "", raw: src.slice(last) });
  return tokens;
}

function reindentMarkup(src: string, isHtml: boolean): string {
  const tokens = tokenizeMarkup(src, isHtml);
  const voidEls = isHtml ? HTML_VOID : new Set<string>();
  const lines: string[] = [];
  let depth = 0;
  for (const t of tokens) {
    const pad = "  ".repeat(depth);
    if (t.kind === "text") {
      const text = t.raw.replace(/\s+/g, " ").trim();
      if (text) lines.push(pad + text);
      continue;
    }
    if (t.kind === "close") {
      depth = Math.max(0, depth - 1);
      lines.push("  ".repeat(depth) + t.raw.trim());
      continue;
    }
    if (t.kind === "open" && isHtml && MARKUP_PRESERVE.has(t.name)) {
      lines.push(pad + t.raw.replace(/\n+$/, ""));
      depth++;
      continue;
    }
    lines.push(pad + t.raw.trim());
    if (t.kind === "open" && !voidEls.has(t.name)) depth++;
  }
  return lines.length > 0 ? lines.join("\n") + "\n" : "";
}

/** Basic well-formedness check; returns a human-readable problem or null. */
function checkMarkup(src: string, isHtml: boolean): string | null {
  const tokens = tokenizeMarkup(src, isHtml);
  const voidEls = isHtml ? HTML_VOID : new Set<string>();
  const stack: string[] = [];
  for (const t of tokens) {
    if (t.kind === "open" && !voidEls.has(t.name) && !t.raw.endsWith("/>")) {
      stack.push(t.name);
    } else if (t.kind === "close") {
      if (stack.length === 0 || stack[stack.length - 1] !== t.name) {
        return `Mismatched closing tag </${t.name || "?"}>`;
      }
      stack.pop();
    }
  }
  if (!isHtml && stack.length > 0) return `Unclosed tag <${stack[stack.length - 1]}>`;
  return null;
}

/* ── CSS formatting / minification ─────────────────────────────── */

function formatCss(input: string): string {
  const lines: string[] = [];
  let cur = "";
  let depth = 0;
  let i = 0;
  const flush = () => {
    const t = cur.trim();
    cur = "";
    if (t) lines.push("  ".repeat(depth) + t);
  };
  while (i < input.length) {
    const ch = input[i];
    if (ch === "/" && input[i + 1] === "*") {
      const end = input.indexOf("*/", i + 2);
      const comment = end === -1 ? input.slice(i) : input.slice(i, end + 2);
      flush();
      lines.push("  ".repeat(depth) + comment);
      i += comment.length;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const end = findStringEnd(input, i);
      cur += input.slice(i, end);
      i = end;
      continue;
    }
    if (ch === "{") {
      const sel = cur.trim();
      cur = "";
      lines.push("  ".repeat(depth) + (sel ? `${sel} {` : "{"));
      depth++;
      i++;
      continue;
    }
    if (ch === "}") {
      flush();
      depth = Math.max(0, depth - 1);
      lines.push("  ".repeat(depth) + "}");
      i++;
      continue;
    }
    if (ch === ";") {
      cur += ";";
      flush();
      i++;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  flush();
  return lines.length > 0 ? lines.join("\n") + "\n" : "";
}

function minifyCss(input: string): string {
  let out = "";
  let expectDecl = false; // next colon is a property/value separator
  let i = 0;
  const isWs = (c: string) => /\s/.test(c);
  while (i < input.length) {
    const ch = input[i];
    if (ch === "/" && input[i + 1] === "*") {
      const end = input.indexOf("*/", i + 2);
      i = end === -1 ? input.length : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const end = findStringEnd(input, i);
      out += input.slice(i, end);
      i = end;
      continue;
    }
    if (isWs(ch)) {
      let j = i;
      while (j < input.length && isWs(input[j])) j++;
      const next = input[j];
      const prev = out.slice(-1);
      const skipBefore = next === "" || "{};,>)".includes(next);
      const skipAfter = prev === "" || "{};,>(".includes(prev);
      if (!skipBefore && !skipAfter) out += " ";
      i = j;
      continue;
    }
    if (ch === "{") {
      expectDecl = true;
      out += "{";
      i++;
      continue;
    }
    if (ch === "}") {
      expectDecl = true;
      out += "}";
      i++;
      continue;
    }
    if (ch === ";") {
      expectDecl = true;
      out += ";";
      i++;
      continue;
    }
    if (ch === ",") {
      out += ",";
      i++;
      continue;
    }
    if (ch === ">") {
      out = out.replace(/ $/, "");
      out += ">";
      i++;
      while (i < input.length && isWs(input[i])) i++;
      continue;
    }
    if (ch === ":" && expectDecl) {
      out = out.replace(/ $/, "");
      expectDecl = false;
      out += ":";
      i++;
      while (i < input.length && isWs(input[i])) i++;
      continue;
    }
    out += ch;
    i++;
  }
  // Drop the final semicolon before each closing brace.
  let res = "";
  for (let k = 0; k < out.length; k++) {
    if (out[k] === ";") {
      let m = k + 1;
      while (m < out.length && /\s/.test(out[m])) m++;
      if (out[m] === "}") continue;
    }
    res += out[k];
  }
  return res;
}

/* ── JavaScript scanning / formatting / conservative minification ┐ */

type JsToken = {
  type: "word" | "char" | "string" | "template" | "regex" | "comment";
  text: string;
};

const JS_WORD_RE = /[A-Za-z0-9_$.]/;
const JS_REGEX_KEYWORDS = new Set([
  "return", "typeof", "instanceof", "in", "of", "new", "delete", "void",
  "case", "do", "else", "yield", "await", "throw",
]);

function scanTemplate(src: string, start: number): number {
  const stack: string[] = ["`"];
  let i = start + 1;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    const top = stack[stack.length - 1];
    if (top === "`") {
      if (ch === "`") {
        stack.pop();
        i++;
        if (stack.length === 0) return i;
        continue;
      }
      if (ch === "$" && src[i + 1] === "{") {
        stack.push("{");
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (ch === "{") stack.push("{");
    else if (ch === "}") stack.pop();
    else if (ch === "`") stack.push("`");
    else if (ch === '"' || ch === "'") i = findStringEnd(src, i) - 1;
    i++;
  }
  return src.length;
}

function scanRegex(src: string, start: number): number {
  let i = start + 1;
  let inClass = false;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === "[") inClass = true;
    else if (ch === "]") inClass = false;
    else if (ch === "/" && !inClass) {
      i++;
      while (i < src.length && /[a-z]/i.test(src[i])) i++;
      return i;
    } else if (ch === "\n") return i;
    i++;
  }
  return src.length;
}

function tokenizeJs(src: string): JsToken[] {
  const tokens: JsToken[] = [];
  let prev = ""; // last meaningful non-comment code char
  let prevWord = "";
  const regexAllowed = () =>
    prev === "" ||
    "(,=:[!&|?{};+-*/%^~<>=:".includes(prev) ||
    JS_REGEX_KEYWORDS.has(prevWord);
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"' || ch === "'") {
      const end = findStringEnd(src, i);
      tokens.push({ type: "string", text: src.slice(i, end) });
      prev = ch;
      prevWord = "";
      i = end;
      continue;
    }
    if (ch === "`") {
      const end = scanTemplate(src, i);
      tokens.push({ type: "template", text: src.slice(i, end) });
      prev = "`";
      prevWord = "";
      i = end;
      continue;
    }
    if (ch === "/") {
      if (src[i + 1] === "/") {
        const nl = src.indexOf("\n", i);
        const end = nl === -1 ? src.length : nl;
        tokens.push({ type: "comment", text: src.slice(i, end) });
        i = end;
        continue;
      }
      if (src[i + 1] === "*") {
        const close = src.indexOf("*/", i + 2);
        const end = close === -1 ? src.length : close + 2;
        tokens.push({ type: "comment", text: src.slice(i, end) });
        i = end;
        continue;
      }
      if (regexAllowed()) {
        const end = scanRegex(src, i);
        tokens.push({ type: "regex", text: src.slice(i, end) });
        prev = "/";
        prevWord = "";
        i = end;
        continue;
      }
      tokens.push({ type: "char", text: "/" });
      prev = "/";
      prevWord = "";
      i++;
      continue;
    }
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (JS_WORD_RE.test(ch)) {
      let j = i;
      while (j < src.length && JS_WORD_RE.test(src[j])) j++;
      const word = src.slice(i, j);
      tokens.push({ type: "word", text: word });
      prev = word[word.length - 1];
      prevWord = word;
      i = j;
      continue;
    }
    tokens.push({ type: "char", text: ch });
    prev = ch;
    prevWord = "";
    i++;
  }
  return tokens;
}

function formatJs(src: string): string {
  const pieces = tokenizeJs(src);
  const lines: string[] = [];
  let depth = 0;
  let paren = 0;
  let cur = "";
  const flush = () => {
    const t = cur.trim();
    cur = "";
    if (t) lines.push("  ".repeat(depth) + t);
  };
  const nextText = (idx: number): string => {
    for (let k = idx + 1; k < pieces.length; k++) {
      const t = pieces[k];
      if (t.type === "comment") continue;
      return t.text;
    }
    return "";
  };
  for (let idx = 0; idx < pieces.length; idx++) {
    const tok = pieces[idx];
    if (tok.type === "comment") {
      cur += tok.text;
      if (tok.text.startsWith("//")) flush();
      continue;
    }
    if (tok.type === "char") {
      const ch = tok.text;
      if (ch === "{" && paren === 0) {
        cur += "{";
        flush();
        depth++;
        continue;
      }
      if (ch === "}") {
        if (paren === 0) {
          flush();
          depth = Math.max(0, depth - 1);
          cur = "  ".repeat(depth) + "}";
          const nxt = nextText(idx);
          const first = nxt.charAt(0);
          const stick =
            first === ";" ||
            first === "," ||
            first === ")" ||
            first === "]" ||
            first === "." ||
            first === ":" ||
            /^(else|catch|finally|while)\b/.test(nxt);
          if (!stick) flush();
          continue;
        }
        cur += "}";
        continue;
      }
      if (ch === "(" || ch === "[") {
        paren++;
        cur += ch;
        continue;
      }
      if (ch === ")" || ch === "]") {
        paren = Math.max(0, paren - 1);
        cur += ch;
        continue;
      }
      if (ch === ";") {
        cur += ";";
        if (paren === 0) flush();
        continue;
      }
      cur += ch;
      continue;
    }
    cur += tok.text;
  }
  flush();
  return lines.length > 0 ? lines.join("\n") + "\n" : "";
}

function minifyJs(src: string): string {
  const tokens = tokenizeJs(src);
  let out = "";
  const needSpace = (a: string, b: string) => {
    if (!a || !b) return false;
    if (JS_WORD_RE.test(a) && JS_WORD_RE.test(b)) return true;
    if ((a === "+" && b === "+") || (a === "-" && b === "-")) return true;
    return false;
  };
  for (const t of tokens) {
    if (t.type === "comment") {
      if (t.text.startsWith("/*!")) out += t.text; // keep licence comments
      continue;
    }
    if (out && needSpace(out.slice(-1), t.text.charAt(0))) out += " ";
    out += t.text;
  }
  return out;
}

/* ── Base64 / hashing helpers ──────────────────────────────────── */

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(input: string): Uint8Array {
  const clean = input
    .replace(/^data:[^,]*,/, "")
    .replace(/\s+/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = clean + "=".repeat((4 - (clean.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function digestHex(algo: "SHA-256" | "SHA-384" | "SHA-512", data: ArrayBuffer): Promise<string> {
  const buf = await crypto.subtle.digest(algo, data);
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

/** Uniform random integer in [0, maxExclusive) via rejection sampling. */
function randomInt(maxExclusive: number): number {
  const limit = Math.floor(4294967296 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let v: number;
  do {
    crypto.getRandomValues(buf);
    v = buf[0];
  } while (v >= limit);
  return v % maxExclusive;
}

function escapeAttr(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function relTime(ms: number): string {
  const diff = ms - Date.now();
  const mins = Math.round(Math.abs(diff) / 60000);
  if (mins < 1) return diff >= 0 ? "in less than a minute" : "less than a minute ago";
  const hours = Math.round(mins / 60);
  const days = Math.round(hours / 24);
  const span = days > 1 ? `${days} days` : hours > 1 ? `${hours} hours` : `${mins} minutes`;
  return diff >= 0 ? `in ${span}` : `${span} ago`;
}

/* ════════════════════════════════════════════════════════════════
   Tools
   ════════════════════════════════════════════════════════════════ */

/* ── JSON formatter (exemplar, unchanged) ──────────────────────── */

function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState("2");
  const [error, setError] = useState<string | null>(null);

  const format = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent === "tab" ? "\t" : Number(indent)));
      setError(null);
    } catch (e) {
      setOutput("");
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <label className={labelCls}>JSON input</label>
        <TextArea value={input} onChange={setInput} placeholder='{"hello":"world"}' rows={12} />
        <div className="mt-3 flex items-center gap-3">
          <label className={labelCls + " !mb-0"}>Indent</label>
          <select
            value={indent}
            onChange={(e) => setIndent(e.target.value)}
            className={inputCls + " w-28"}
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tabs</option>
          </select>
          <PrimaryButton onClick={format} disabled={!input.trim()}>
            Format
          </PrimaryButton>
          <ResetButton
            onClick={() => {
              setInput("");
              setOutput("");
              setError(null);
            }}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls + " !mb-0"}>Formatted output</label>
          {output && <CopyButton text={output} />}
        </div>
        <TextArea value={output} onChange={setOutput} rows={12} placeholder="Formatted JSON appears here" />
        {output && (
          <div className="mt-3">
            <PrimaryButton onClick={() => downloadText(output, "formatted.json", "application/json")}>
              Download .json
            </PrimaryButton>
          </div>
        )}
        {error && <ErrorNote>Invalid JSON: {error}</ErrorNote>}
      </div>
    </div>
  );
}

/* ── JSON validator ────────────────────────────────────────────── */

function JsonValidator() {
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    const src = input;
    if (!src.trim()) return null;
    try {
      const parsed: unknown = JSON.parse(src);
      return { ok: true as const, parsed };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      let line: number | null = null;
      let col: number | null = null;
      const lc = msg.match(/line (\d+) column (\d+)/i);
      const pm = msg.match(/position (\d+)/i);
      if (lc) {
        line = Number(lc[1]);
        col = Number(lc[2]);
      } else if (pm) {
        const pos = Math.min(Number(pm[1]), src.length);
        const upto = src.slice(0, pos);
        line = upto.split("\n").length;
        col = pos - upto.lastIndexOf("\n");
      }
      return { ok: false as const, msg, line, col };
    }
  }, [input]);

  const parsed = result && result.ok ? result.parsed : null;
  const typeName = (v: unknown) =>
    Array.isArray(v) ? "array" : v === null ? "null" : typeof v;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className={labelCls + " !mb-0"}>JSON to validate</label>
        {input && <CopyButton text={input} />}
      </div>
      <TextArea
        value={input}
        onChange={setInput}
        rows={12}
        placeholder="Paste JSON — validation runs automatically as you type"
      />
      {result === null && (
        <p className="mt-3 text-xs text-muted">Waiting for input — validation runs live.</p>
      )}
      {result && result.ok && (
        <OkNote>
          Valid JSON — top-level {typeName(result.parsed)},{" "}
          {formatBytes(new TextEncoder().encode(input).length)}.
        </OkNote>
      )}
      {result && !result.ok && (
        <ErrorNote>
          Invalid JSON: {result.msg}
          {result.line !== null && (
            <>
              {" "}— line {result.line}
              {result.col !== null ? `, column ${result.col}` : ""}
            </>
          )}
        </ErrorNote>
      )}
      {parsed !== null && Array.isArray(parsed) && (
        <p className="mt-3 text-xs text-muted">
          Top-level array with {parsed.length} item{parsed.length === 1 ? "" : "s"}.
        </p>
      )}
    </div>
  );
}

/* ── Generic transform tool factory (formatters & minifiers) ───── */

function createTransformTool(spec: {
  action: string;
  run: (input: string) => string;
  warn?: (input: string) => string | null;
  filename: string;
  mime: string;
  note?: string;
  stats?: boolean;
  placeholder?: string;
  outputLabel?: string;
}) {
  function Tool() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);

    const apply = () => {
      try {
        setOutput(spec.run(input));
        setError(null);
        setWarning(spec.warn ? spec.warn(input) : null);
      } catch (e) {
        setOutput("");
        setWarning(null);
        setError(e instanceof Error ? e.message : String(e));
      }
    };

    const reset = () => {
      setInput("");
      setOutput("");
      setError(null);
      setWarning(null);
    };

    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label className={labelCls}>Input</label>
          <TextArea value={input} onChange={setInput} rows={12} placeholder={spec.placeholder} />
          <div className="mt-3 flex items-center gap-3">
            <PrimaryButton onClick={apply} disabled={!input.trim()}>
              {spec.action}
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          {spec.note && <p className="mt-3 text-xs leading-relaxed text-muted">{spec.note}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls + " !mb-0"}>{spec.outputLabel ?? "Output"}</label>
            {output && <CopyButton text={output} />}
          </div>
          <TextArea value={output} onChange={setOutput} rows={12} placeholder="Result appears here" />
          {spec.stats && input.trim() !== "" && output !== "" && (
            <div className="mt-3">
              <SizeStats before={input} after={output} />
            </div>
          )}
          {output && (
            <div className="mt-3">
              <DownloadButton
                onClick={() => downloadText(output, spec.filename, spec.mime)}
                label={`Download ${spec.filename}`}
              />
            </div>
          )}
          {warning && <WarningNote>{warning}</WarningNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
        </div>
      </div>
    );
  }
  return Tool;
}

const XmlFormatter = createTransformTool({
  action: "Format",
  run: (s) => reindentMarkup(s, false),
  warn: (s) => checkMarkup(s, false),
  filename: "formatted.xml",
  mime: "application/xml",
  placeholder: "<root><item id='1'>value</item></root>",
});

const HtmlFormatter = createTransformTool({
  action: "Format",
  run: (s) => reindentMarkup(s, true),
  warn: (s) => checkMarkup(s, true),
  filename: "formatted.html",
  mime: "text/html",
  placeholder: "<!DOCTYPE html><html><body><p>Hello</p></body></html>",
  note: "Content of <script>, <style>, <pre> and <textarea> is preserved as-is, and void elements (<br>, <img>, …) never break the indentation.",
});

const CssFormatter = createTransformTool({
  action: "Format",
  run: formatCss,
  filename: "formatted.css",
  mime: "text/css",
  placeholder: "body{margin:0;color:#111}",
});

const JsFormatter = createTransformTool({
  action: "Format",
  run: formatJs,
  filename: "formatted.js",
  mime: "text/javascript",
  placeholder: "function a(){if(x){b();}}",
  note: "Bracket-aware re-indentation for quick readability passes — this is not a full AST formatter.",
});

const JsonMinifier = createTransformTool({
  action: "Minify",
  run: (s) => JSON.stringify(JSON.parse(s)),
  stats: true,
  filename: "minified.json",
  mime: "application/json",
  placeholder: '{ "hello":  "world" }',
});

const HtmlMinifier = createTransformTool({
  action: "Minify",
  run: minifyHtml,
  stats: true,
  filename: "minified.html",
  mime: "text/html",
  note: "Comments are stripped (conditional comments are kept) and whitespace between tags is collapsed intelligently. Content of <pre> and <textarea> is preserved.",
});

const CssMinifier = createTransformTool({
  action: "Minify",
  run: minifyCss,
  stats: true,
  filename: "minified.css",
  mime: "text/css",
  note: "Removes comments, collapses whitespace, tightens separators and drops the final semicolon of each block. Quoted string values are never touched.",
});

const JsMinifier = createTransformTool({
  action: "Minify",
  run: minifyJs,
  stats: true,
  filename: "minified.js",
  mime: "text/javascript",
  note: "Conservative minifier: strips comments and collapses whitespace without renaming identifiers or restructuring code. Always test the result before shipping.",
});

/* ── HTML minifier implementation ──────────────────────────────── */

function minifyHtml(src: string): string {
  const tokens = tokenizeMarkup(src, true);
  const isTag = (tk: MarkupToken | undefined) =>
    !!tk && (tk.kind === "open" || tk.kind === "close" || tk.kind === "selfclose");
  const blockTag = (tk: MarkupToken | undefined) =>
    isTag(tk) && tk !== undefined && !HTML_INLINE.has(tk.name);
  let out = "";
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prevTk = tokens[i - 1];
    const nextTk = tokens[i + 1];
    if (t.kind === "comment") {
      if (t.raw.startsWith("<!--[if") || t.raw.startsWith("<!--!")) out += t.raw;
      continue;
    }
    if (t.kind === "text") {
      if (/^\s*$/.test(t.raw)) {
        // Whitespace-only run between tags: drop it when both neighbours are
        // block-level tags, otherwise keep one space to preserve inline text.
        if (!blockTag(prevTk) || !blockTag(nextTk)) out += " ";
        continue;
      }
      if (/^\s/.test(t.raw) && !blockTag(prevTk)) out += " ";
      out += t.raw.replace(/\s+/g, " ").trim();
      if (/\s$/.test(t.raw) && !blockTag(nextTk)) out += " ";
      continue;
    }
    out += t.raw;
  }
  return out.trim();
}

/* ── URL encoder / decoder ─────────────────────────────────────── */

function createUrlTool(kind: "encode" | "decode") {
  function Tool() {
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("component");
    const result = useMemo(() => {
      if (!input) return null;
      try {
        const out =
          kind === "encode"
            ? mode === "component"
              ? encodeURIComponent(input)
              : encodeURI(input)
            : mode === "component"
              ? decodeURIComponent(input)
              : decodeURI(input);
        return { out, error: null as string | null };
      } catch (e) {
        return { out: "", error: e instanceof Error ? e.message : String(e) };
      }
    }, [input, mode]);

    const enc = kind === "encode";
    return (
      <div>
        <label className={labelCls}>{enc ? "Plain text" : "Encoded URL / text"}</label>
        <TextArea
          value={input}
          onChange={setInput}
          rows={8}
          placeholder={enc ? "Text to encode — e.g. hello world & more" : "e.g. hello%20world%20%26%20more"}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className={labelCls + " !mb-0"}>Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className={inputCls + " w-72"}
          >
            <option value="component">
              {enc ? "encodeURIComponent (strict)" : "decodeURIComponent (strict)"}
            </option>
            <option value="uri">
              {enc ? "encodeURI (keeps :/?#[]@ etc.)" : "decodeURI (keeps :/?#[]@ etc.)"}
            </option>
          </select>
          <ResetButton
            onClick={() => {
              setInput("");
              setMode("component");
            }}
          />
        </div>
        {result !== null && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls + " !mb-0"}>{enc ? "Encoded output" : "Decoded output"}</label>
              {result.out && <CopyButton text={result.out} />}
            </div>
            <TextArea value={result.out} onChange={() => {}} rows={8} placeholder="Result appears here live" />
          </div>
        )}
        {result?.error && <ErrorNote>{result.error}</ErrorNote>}
      </div>
    );
  }
  return Tool;
}

const UrlEncoder = createUrlTool("encode");
const UrlDecoder = createUrlTool("decode");

/* ── Base64 encoder ────────────────────────────────────────────── */

function Base64Encoder() {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [dataUri, setDataUri] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; mime: string; base64: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const textB64 = useMemo(() => {
    if (!text) return "";
    return bytesToBase64(new TextEncoder().encode(text));
  }, [text]);

  const output =
    mode === "text"
      ? dataUri && textB64
        ? `data:text/plain;charset=utf-8;base64,${textB64}`
        : textB64
      : (fileInfo?.base64 ?? "");

  const onFiles = (files: File[]) => {
    const f = files[0];
    setError(null);
    f.arrayBuffer()
      .then((buf) =>
        setFileInfo({
          name: f.name,
          mime: f.type || "application/octet-stream",
          base64: bytesToBase64(new Uint8Array(buf)),
        }),
      )
      .catch(() => setError(`Could not read "${f.name}".`));
  };

  return (
    <div>
      <ModeTabs
        tabs={[
          ["text", "Text"],
          ["file", "File"],
        ]}
        value={mode}
        onChange={(id) => setMode(id)}
      />
      {error && <ErrorNote>{error}</ErrorNote>}
      {mode === "text" ? (
        <div className="mt-5">
          <label className={labelCls}>Text to encode</label>
          <TextArea value={text} onChange={setText} rows={8} placeholder="Any Unicode text — emoji and accents included" />
          <div className="mt-3 flex items-center gap-5">
            <CheckRow
              checked={dataUri}
              onChange={setDataUri}
              label="Prefix with data: URI header"
            />
            <ResetButton
              onClick={() => {
                setText("");
                setDataUri(false);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <FileDrop accept="*/*" onFiles={onFiles} label="Drop any file to encode" hint="Any file type · encoded locally" />
          {fileInfo && (
            <p className="mt-3 text-xs text-muted">
              {fileInfo.name} · {fileInfo.mime} ·{" "}
              {formatBytes(new TextEncoder().encode(fileInfo.base64).length)} of Base64
            </p>
          )}
        </div>
      )}
      {output && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls + " !mb-0"}>Base64 output</label>
            <CopyButton text={output} />
          </div>
          <TextArea value={output} onChange={() => {}} rows={8} />
          <div className="mt-3">
            <DownloadButton
              onClick={() => downloadText(output, mode === "file" && fileInfo ? `${fileInfo.name}.base64.txt` : "encoded-base64.txt", "text/plain")}
              label="Download Base64 (.txt)"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Base64 decoder ────────────────────────────────────────────── */

function Base64Decoder() {
  const [input, setInput] = useState("");
  const [filename, setFilename] = useState("decoded.bin");
  const [fileError, setFileError] = useState<string | null>(null);

  const decoded = useMemo(() => {
    const src = input.trim();
    if (!src) return null;
    try {
      return { bytes: base64ToBytes(src), error: null as string | null };
    } catch (e) {
      return { bytes: null, error: e instanceof Error ? e.message : "Invalid Base64 input" };
    }
  }, [input]);

  const textPreview = useMemo(() => {
    if (!decoded?.bytes) return null;
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(decoded.bytes);
    } catch {
      return null; // not valid UTF-8 — treat as binary
    }
  }, [decoded]);

  const download = () => {
    const bytes = decoded?.bytes;
    if (!bytes) return;
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    downloadBlob(new Blob([buffer], { type: "application/octet-stream" }), filename.trim() || "decoded.bin");
  };

  return (
    <div>
      <label className={labelCls}>Base64 input (plain, whitespace or data: URI)</label>
      <TextArea
        value={input}
        onChange={setInput}
        rows={8}
        placeholder="Paste Base64 here — decoding runs automatically"
      />
      <div className="mt-4">
        <FileDrop
          accept=".txt,.b64,.base64"
          onFiles={(files) => {
            setFileError(null);
            files[0]
              .text()
              .then((t) => setInput(t.trim()))
              .catch(() => setFileError(`Could not read "${files[0].name}".`));
          }}
          label="Or load a file containing Base64"
          hint="Accepted: txt, b64, base64"
        />
      </div>
      {fileError && <ErrorNote>{fileError}</ErrorNote>}
      {decoded?.error && <ErrorNote>Invalid Base64: {decoded.error}</ErrorNote>}
      {decoded?.bytes && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls + " !mb-0"}>
              Decoded — {formatBytes(decoded.bytes.byteLength)}
            </label>
            {textPreview !== null && <CopyButton text={textPreview} />}
          </div>
          {textPreview !== null ? (
            <TextArea value={textPreview} onChange={() => {}} rows={8} />
          ) : (
            <p className="rounded-lg border border-[#121212]/12 bg-white px-4 py-3 text-sm text-muted">
              Binary content — it cannot be shown as text. Download it below to inspect.
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className={labelCls}>Download filename</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className={inputCls + " w-64 font-mono"}
              />
            </div>
            <DownloadButton onClick={download} label="Download decoded file" />
            <ResetButton
              onClick={() => {
                setInput("");
                setFileError(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── UUID generator ────────────────────────────────────────────── */

function UuidGenerator() {
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [output, setOutput] = useState("");

  const generate = () => {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      const id = crypto.randomUUID();
      list.push(uppercase ? id.toUpperCase() : id);
    }
    setOutput(list.join("\n"));
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className={labelCls}>How many</label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className={inputCls + " w-32"}
          >
            {[1, 5, 10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="pb-2.5">
          <CheckRow checked={uppercase} onChange={setUppercase} label="Uppercase" />
        </div>
        <PrimaryButton onClick={generate}>Generate</PrimaryButton>
        <ResetButton onClick={() => setOutput("")} />
      </div>
      {output && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls + " !mb-0"}>
              {count} RFC 4122 v4 UUID{count === 1 ? "" : "s"} — crypto.randomUUID()
            </label>
            <CopyButton text={output} label="Copy all" />
          </div>
          <TextArea value={output} onChange={() => {}} rows={Math.min(12, Math.max(4, count + 1))} />
          <div className="mt-3">
            <DownloadButton
              onClick={() => downloadText(output, "uuids.txt", "text/plain")}
              label="Download .txt"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Password generator ────────────────────────────────────────── */

const PW_SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/~",
};
const PW_AMBIGUOUS = "Il1O0o|";

function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
  const [quantity, setQuantity] = useState(5);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [entropy, setEntropy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = () => {
    let pool = "";
    if (opts.lower) pool += PW_SETS.lower;
    if (opts.upper) pool += PW_SETS.upper;
    if (opts.digits) pool += PW_SETS.digits;
    if (opts.symbols) pool += PW_SETS.symbols;
    if (excludeAmbiguous) {
      pool = Array.from(pool)
        .filter((c) => !PW_AMBIGUOUS.includes(c))
        .join("");
    }
    if (!pool) {
      setError("Select at least one character set.");
      setPasswords([]);
      setEntropy(null);
      return;
    }
    setError(null);
    const list: string[] = [];
    for (let n = 0; n < quantity; n++) {
      let pw = "";
      for (let i = 0; i < length; i++) pw += pool[randomInt(pool.length)];
      list.push(pw);
    }
    setPasswords(list);
    setEntropy(length * Math.log2(pool.length));
  };

  const strength =
    entropy === null
      ? null
      : entropy < 40
        ? "Weak"
        : entropy < 60
          ? "Good"
          : entropy < 80
            ? "Strong"
            : "Very strong";

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={`Length — ${length}`}>
          <input
            type="range"
            min={4}
            max={128}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full accent-lime"
          />
        </Field>
        <Field label="Quantity">
          <select
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className={inputCls}
          >
            {[1, 5, 10].map((n) => (
              <option key={n} value={n}>
                {n} password{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </Field>
        <div className="pb-1">
          <label className={labelCls}>Character sets</label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <CheckRow checked={opts.lower} onChange={(v) => setOpts({ ...opts, lower: v })} label="a–z" />
            <CheckRow checked={opts.upper} onChange={(v) => setOpts({ ...opts, upper: v })} label="A–Z" />
            <CheckRow checked={opts.digits} onChange={(v) => setOpts({ ...opts, digits: v })} label="0–9" />
            <CheckRow checked={opts.symbols} onChange={(v) => setOpts({ ...opts, symbols: v })} label="!@#$…" />
          </div>
        </div>
        <div className="pb-1">
          <label className={labelCls}>Options</label>
          <CheckRow
            checked={excludeAmbiguous}
            onChange={setExcludeAmbiguous}
            label="Exclude look-alikes (I l 1 O 0 o)"
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton onClick={generate}>Generate</PrimaryButton>
        <ResetButton
          onClick={() => {
            setPasswords([]);
            setEntropy(null);
            setError(null);
          }}
        />
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      {passwords.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls + " !mb-0"}>Generated with crypto.getRandomValues()</label>
            <CopyButton text={passwords.join("\n")} label="Copy all" />
          </div>
          <div className="space-y-2">
            {passwords.map((pw, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#121212]/12 bg-white px-4 py-2.5"
              >
                <code className="break-all font-mono text-sm text-[#163D2B]">{pw}</code>
                <CopyButton text={pw} />
              </div>
            ))}
          </div>
          {strength && (
            <p className="mt-3 text-xs text-muted">
              ≈ {entropy!.toFixed(0)} bits of entropy at {length} characters —{" "}
              <span className="font-semibold text-[#163D2B]">{strength}</span>. Longer passwords are
              exponentially harder to crack.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── SHA-256 / SHA-384 / SHA-512 (shared factory) ──────────────── */

function createShaTool(algo: "SHA-256" | "SHA-384" | "SHA-512") {
  function ShaTool() {
    const [mode, setMode] = useState("text");
    const [text, setText] = useState("");
    const [digest, setDigest] = useState("");
    const [fileInfo, setFileInfo] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hashText = () => {
      setBusy(true);
      setError(null);
      setFileInfo(null);
      digestHex(algo, new TextEncoder().encode(text).buffer as ArrayBuffer)
        .then(setDigest)
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
        .finally(() => setBusy(false));
    };

    const hashFile = (files: File[]) => {
      const f = files[0];
      setBusy(true);
      setError(null);
      setDigest("");
      f.arrayBuffer()
        .then((buf) => digestHex(algo, buf))
        .then((d) => {
          setFileInfo(`${f.name} (${formatBytes(f.size)})`);
          setDigest(d);
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
        .finally(() => setBusy(false));
    };

    return (
      <div>
        <ModeTabs
          tabs={[
            ["text", "Text"],
            ["file", "File"],
          ]}
          value={mode}
          onChange={(id) => {
            setMode(id);
            setDigest("");
            setFileInfo(null);
            setError(null);
          }}
        />
        {mode === "text" ? (
          <div className="mt-5">
            <label className={labelCls}>Text to hash</label>
            <TextArea value={text} onChange={setText} rows={8} placeholder="Type or paste text — hashed locally with Web Crypto" />
            <div className="mt-3 flex items-center gap-3">
              <PrimaryButton onClick={hashText} disabled={!text.trim() || busy}>
                Compute {algo}
              </PrimaryButton>
              <ResetButton
                onClick={() => {
                  setText("");
                  setDigest("");
                  setError(null);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <FileDrop
              accept="*/*"
              onFiles={hashFile}
              label="Drop any file to hash it"
              hint="Any file type · nothing is uploaded"
            />
          </div>
        )}
        {busy && <p className="mt-3 text-sm text-[#163D2B]">Computing…</p>}
        {error && <ErrorNote>{error}</ErrorNote>}
        {digest && (
          <div className="mt-5 rounded-lg border border-[#121212]/12 bg-white px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {algo} digest{fileInfo ? ` — ${fileInfo}` : ""}
              </span>
              <CopyButton text={digest} />
            </div>
            <p className="break-all font-mono text-sm text-[#163D2B]">{digest}</p>
          </div>
        )}
      </div>
    );
  }
  return ShaTool;
}

const Sha256Tool = createShaTool("SHA-256");
const Sha384Tool = createShaTool("SHA-384");
const Sha512Tool = createShaTool("SHA-512");

/* ── Regex tester ──────────────────────────────────────────────── */

type RegexMatch = {
  index: number;
  text: string;
  groups: string[];
  named: Record<string, string>;
};

function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");

  const toggleFlag = (f: string) =>
    setFlags((cur) => (cur.includes(f) ? cur.replace(f, "") : cur + f));

  const evaluated = useMemo(() => {
    if (!pattern) return { error: null as string | null, matches: [] as RegexMatch[] };
    let re: RegExp;
    try {
      re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e), matches: [] };
    }
    const matches: RegexMatch[] = [];
    let guard = 0;
    let m: RegExpExecArray | null = re.exec(text);
    while (m !== null && guard < 1000) {
      matches.push({
        index: m.index,
        text: m[0],
        groups: m.slice(1).map((g) => (g === undefined ? "" : g)),
        named: (m.groups ?? {}) as Record<string, string>,
      });
      guard++;
      if (m[0] === "") {
        re.lastIndex++;
        if (re.lastIndex > text.length) break;
      }
      if (!flags.includes("g")) break;
      m = re.exec(text);
    }
    return { error: null, matches };
  }, [pattern, flags, text]);

  const segments = useMemo(() => {
    const segs: Array<{ text: string; match: boolean }> = [];
    let pos = 0;
    for (const m of evaluated.matches) {
      if (m.index > pos) segs.push({ text: text.slice(pos, m.index), match: false });
      if (m.text) segs.push({ text: m.text, match: true });
      pos = m.index + m.text.length;
    }
    if (pos < text.length) segs.push({ text: text.slice(pos), match: false });
    return segs;
  }, [evaluated.matches, text]);

  const flagList: Array<[string, string]> = [
    ["g", "global"],
    ["i", "ignore case"],
    ["m", "multiline"],
    ["s", "dotall"],
    ["u", "unicode"],
    ["y", "sticky"],
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Regular expression">
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="\b\w+@\w+\.\w+\b"
            className={inputCls + " font-mono"}
            spellCheck={false}
          />
        </Field>
        <div className="flex flex-wrap gap-x-4 gap-y-2 pb-2">
          {flagList.map(([f, label]) => (
            <CheckRow key={f} checked={flags.includes(f)} onChange={() => toggleFlag(f)} label={label} />
          ))}
        </div>
      </div>
      <div className="mt-4">
        <label className={labelCls}>Test text</label>
        <TextArea value={text} onChange={setText} rows={8} placeholder="Paste the text to test against — matches update live" />
      </div>
      {evaluated.error && <ErrorNote>Invalid regular expression: {evaluated.error}</ErrorNote>}
      {!evaluated.error && pattern && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls + " !mb-0"}>
              Highlight — {evaluated.matches.length} match{evaluated.matches.length === 1 ? "" : "es"}
            </label>
          </div>
          <div className="min-h-16 rounded-lg border border-[#121212]/12 bg-white px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-cream">
            {segments.map((s, i) =>
              s.match ? (
                <span key={i} className="rounded-sm bg-lime/30 px-0.5 text-[#163D2B]">
                  {s.text}
                </span>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </div>
        </div>
      )}
      {!evaluated.error && evaluated.matches.length > 0 && (
        <div className="mt-5 space-y-2">
          <label className={labelCls}>Match details</label>
          {evaluated.matches.map((m, i) => (
            <div key={i} className="rounded-lg border border-[#121212]/12 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-semibold text-[#163D2B]">#{i + 1}</span>
                <span className="text-xs text-muted">at index {m.index}</span>
                <code className="break-all font-mono text-cream">{m.text || "(empty match)"}</code>
              </div>
              {m.groups.some((g) => g !== "") && (
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  {m.groups.map((g, gi) => (
                    <span key={gi}>
                      group {gi + 1}: <code className="font-mono text-cream">{g || "(empty)"}</code>
                    </span>
                  ))}
                </div>
              )}
              {Object.keys(m.named).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  {Object.entries(m.named).map(([k, v]) => (
                    <span key={k}>
                      {k}: <code className="font-mono text-cream">{v || "(empty)"}</code>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── JWT decoder ───────────────────────────────────────────────── */

function b64urlDecode(part: string): string {
  const b = part.replace(/-/g, "+").replace(/_/g, "/");
  return new TextDecoder().decode(base64ToBytes(b));
}

type JwtDecoded =
  | { error: string }
  | { header: unknown; payload: unknown; signature: string | null };

function JwtDecoder() {
  const [token, setToken] = useState("");

  const decoded = useMemo<JwtDecoded | null>(() => {
    const t = token.trim().replace(/^Bearer\s+/i, "");
    if (!t) return null;
    const parts = t.split(".");
    if (parts.length < 2) {
      return { error: "A JWT needs at least two dot-separated parts: header.payload[.signature]." };
    }
    try {
      return {
        header: JSON.parse(b64urlDecode(parts[0])),
        payload: JSON.parse(b64urlDecode(parts[1])),
        signature: parts[2] ?? null,
      };
    } catch (e) {
      return { error: `Could not decode token: ${e instanceof Error ? e.message : String(e)}` };
    }
  }, [token]);

  const okResult = decoded !== null && !("error" in decoded) ? decoded : null;
  const ok = okResult !== null;
  const claims =
    okResult && typeof okResult.payload === "object" && okResult.payload !== null
      ? (okResult.payload as Record<string, unknown>)
      : null;
  const header =
    okResult && typeof okResult.header === "object" && okResult.header !== null
      ? (okResult.header as Record<string, unknown>)
      : null;

  const expClaim = claims && typeof claims.exp === "number" ? claims.exp : null;
  // Expiry is inherently time-dependent; recomputed on every decode/render.
  // eslint-disable-next-line react-hooks/purity -- live expiry status is the feature
  const expired = expClaim !== null && expClaim * 1000 < Date.now();

  const dateClaims: Array<[string, number]> = [];
  if (claims) {
    for (const key of ["exp", "iat", "nbf"] as const) {
      const v = claims[key];
      if (typeof v === "number") dateClaims.push([key, v]);
    }
  }

  return (
    <div>
      <label className={labelCls}>JWT token</label>
      <TextArea
        value={token}
        onChange={setToken}
        rows={5}
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSJ9.signature"
        className="break-all"
      />
      <ResetButton onClick={() => setToken("")} />
      <div className="mt-3" />
      {decoded && "error" in decoded && <ErrorNote>{decoded.error}</ErrorNote>}
      {okResult && (
        <>
          <WarningNote>
            Decoded entirely in your browser. The signature is <strong>not verified</strong> — never
            trust a decoded token for security decisions without server-side verification.
          </WarningNote>
          {expired && (
            <ErrorNote>
              This token expired {relTime((expClaim as number) * 1000)} (
              {new Date((expClaim as number) * 1000).toLocaleString()}).
            </ErrorNote>
          )}
          {header && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls + " !mb-0"}>Header</label>
                <CopyButton text={JSON.stringify(okResult.header, null, 2)} />
              </div>
              <pre className="overflow-x-auto rounded-lg border border-[#121212]/12 bg-white px-4 py-3 font-mono text-xs leading-relaxed text-cream">
                {JSON.stringify(okResult.header, null, 2)}
              </pre>
            </div>
          )}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls + " !mb-0"}>Payload</label>
              <CopyButton text={JSON.stringify(okResult.payload, null, 2)} />
            </div>
            <pre className="overflow-x-auto rounded-lg border border-[#121212]/12 bg-white px-4 py-3 font-mono text-xs leading-relaxed text-cream">
              {JSON.stringify(okResult.payload, null, 2)}
            </pre>
          </div>
          {dateClaims.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {dateClaims.map(([key, v]) => (
                <div key={key} className="rounded-lg border border-[#121212]/12 bg-white px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wider text-muted">{key}</div>
                  <div className="mt-1 text-sm text-cream">{new Date(v * 1000).toLocaleString()}</div>
                  <div className="mt-0.5 text-xs text-[#163D2B]">{relTime(v * 1000)}</div>
                </div>
              ))}
            </div>
          )}
          {okResult.signature && (
            <p className="mt-4 break-all rounded-lg border border-[#121212]/12 bg-white px-4 py-3 font-mono text-xs text-muted">
              signature: {okResult.signature}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ── HTML previewer ────────────────────────────────────────────── */

function HtmlPreviewer() {
  const [html, setHtml] = useState("");
  const [height, setHeight] = useState(420);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className={labelCls + " !mb-0"}>HTML source</label>
        {html && <CopyButton text={html} />}
      </div>
      <TextArea
        value={html}
        onChange={setHtml}
        rows={10}
        placeholder={"<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Hello</h1>\n  </body>\n</html>"}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className={labelCls + " !mb-0"}>Preview height</label>
        <select
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          className={inputCls + " w-32"}
        >
          {[320, 420, 600, 800].map((h) => (
            <option key={h} value={h}>
              {h} px
            </option>
          ))}
        </select>
        <DownloadButton
          onClick={() => downloadText(html, "preview.html", "text/html")}
          label="Download .html"
          disabled={!html.trim()}
        />
        <ResetButton onClick={() => setHtml("")} />
      </div>
      <div className="mt-4 rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-2">
        <iframe
          title="HTML preview"
          sandbox="allow-sandbox"
          srcDoc={html}
          className="w-full rounded-lg border-0 bg-white"
          style={{ height }}
        />
      </div>
      <p className="mt-3 text-xs text-muted">
        Rendered inside a fully sandboxed iframe — scripts, forms, pop-ups and navigation are
        disabled for safety. The preview updates live as you type.
      </p>
    </div>
  );
}

/* ── CSS gradient generator ────────────────────────────────────── */

type GradientStop = { id: number; color: string; pos: number };

function CssGradientGenerator() {
  const [type, setType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState(135);
  const [shape, setShape] = useState<"ellipse" | "circle">("ellipse");
  const [stops, setStops] = useState<GradientStop[]>([
    { id: 1, color: "#84cc16", pos: 0 },
    { id: 2, color: "#0ea5e9", pos: 100 },
  ]);

  const sorted = [...stops].sort((a, b) => clamp(a.pos, 0, 100) - clamp(b.pos, 0, 100));
  const stopsCss = sorted.map((s) => `${s.color} ${clamp(s.pos, 0, 100)}%`).join(", ");
  const gradient =
    type === "linear"
      ? `linear-gradient(${angle}deg, ${stopsCss})`
      : `radial-gradient(${shape}, ${stopsCss})`;
  const css = `background-image: ${gradient};`;

  const updateStop = (id: number, patch: Partial<GradientStop>) =>
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const addStop = () =>
    setStops((prev) => [...prev, { id: Date.now(), color: "#f5f5f4", pos: 50 }]);
  const removeStop = (id: number) =>
    setStops((prev) => (prev.length > 2 ? prev.filter((s) => s.id !== id) : prev));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value === "radial" ? "radial" : "linear")}
              className={inputCls + " w-36"}
            >
              <option value="linear">Linear</option>
              <option value="radial">Radial</option>
            </select>
          </Field>
          {type === "linear" ? (
            <Field label={`Angle — ${angle}°`}>
              <input
                type="range"
                min={0}
                max={360}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-44 accent-lime"
              />
            </Field>
          ) : (
            <Field label="Shape">
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value === "circle" ? "circle" : "ellipse")}
                className={inputCls + " w-36"}
              >
                <option value="ellipse">Ellipse</option>
                <option value="circle">Circle</option>
              </select>
            </Field>
          )}
          <div className="pb-1">
            <PrimaryButton onClick={addStop} className="!px-3 !py-1.5 text-xs">
              + Add stop
            </PrimaryButton>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {stops.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <input
                type="color"
                value={s.color}
                onChange={(e) => updateStop(s.id, { color: e.target.value })}
                aria-label={`Stop colour (${s.color})`}
                className="h-9 w-12 cursor-pointer rounded border border-[#121212]/15 bg-transparent"
              />
              <input
                type="range"
                min={0}
                max={100}
                value={clamp(s.pos, 0, 100)}
                onChange={(e) => updateStop(s.id, { pos: Number(e.target.value) })}
                className="flex-1 accent-lime"
                aria-label={`Stop position (${clamp(s.pos, 0, 100)}%)`}
              />
              <span className="w-12 text-right font-mono text-xs text-muted">
                {clamp(s.pos, 0, 100)}%
              </span>
              <SecondaryButton
                onClick={() => removeStop(s.id)}
                disabled={stops.length <= 2}
                className="!px-3 !py-1.5 text-xs"
              >
                Remove
              </SecondaryButton>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          Stops are sorted by position in the generated CSS. At least two stops are required.
        </p>
      </div>
      <div>
        <label className={labelCls}>Preview</label>
        <div
          className="h-44 rounded-xl border border-[#121212]/12"
          style={{ background: gradient }}
          role="img"
          aria-label="Live gradient preview"
        />
        <div className="mt-4 flex items-center justify-between mb-1.5">
          <label className={labelCls + " !mb-0"}>CSS</label>
          <CopyButton text={css} />
        </div>
        <pre className="overflow-x-auto rounded-lg border border-[#121212]/12 bg-white px-4 py-3 font-mono text-sm text-[#163D2B]">
          {css}
        </pre>
        <div className="mt-3">
          <DownloadButton onClick={() => downloadText(css, "gradient.css", "text/css")} label="Download .css" />
        </div>
      </div>
    </div>
  );
}

/* ── Meta tag generator ────────────────────────────────────────── */

function MetaTagGenerator() {
  const [f, setF] = useState({
    title: "",
    description: "",
    url: "",
    image: "",
    siteName: "",
    type: "website",
    author: "",
    robots: "index, follow",
    twitterCard: "summary_large_image",
    themeColor: "",
    charset: true,
    viewport: true,
  });
  const set = (patch: Partial<typeof f>) => setF({ ...f, ...patch });

  const output = useMemo(() => {
    const a = escapeAttr;
    const lines: string[] = [];
    if (f.charset) lines.push('<meta charset="UTF-8" />');
    if (f.viewport) lines.push('<meta name="viewport" content="width=device-width, initial-scale=1" />');
    if (f.title.trim()) {
      lines.push(`<title>${a(f.title.trim())}</title>`);
      lines.push(`<meta property="og:title" content="${a(f.title.trim())}" />`);
      lines.push(`<meta name="twitter:title" content="${a(f.title.trim())}" />`);
    }
    if (f.description.trim()) {
      lines.push(`<meta name="description" content="${a(f.description.trim())}" />`);
      lines.push(`<meta property="og:description" content="${a(f.description.trim())}" />`);
      lines.push(`<meta name="twitter:description" content="${a(f.description.trim())}" />`);
    }
    if (f.url.trim()) {
      lines.push(`<link rel="canonical" href="${a(f.url.trim())}" />`);
      lines.push(`<meta property="og:url" content="${a(f.url.trim())}" />`);
    }
    if (f.image.trim()) {
      lines.push(`<meta property="og:image" content="${a(f.image.trim())}" />`);
      lines.push(`<meta name="twitter:image" content="${a(f.image.trim())}" />`);
    }
    if (f.siteName.trim()) lines.push(`<meta property="og:site_name" content="${a(f.siteName.trim())}" />`);
    lines.push(`<meta property="og:type" content="${a(f.type)}" />`);
    lines.push(`<meta name="twitter:card" content="${a(f.twitterCard)}" />`);
    if (f.author.trim()) lines.push(`<meta name="author" content="${a(f.author.trim())}" />`);
    lines.push(`<meta name="robots" content="${a(f.robots)}" />`);
    if (f.themeColor.trim()) lines.push(`<meta name="theme-color" content="${a(f.themeColor.trim())}" />`);
    return lines.join("\n") + "\n";
  }, [f]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Page title">
          <input type="text" value={f.title} onChange={(e) => set({ title: e.target.value })} className={inputCls} placeholder="My awesome site" />
        </Field>
        <Field label="Description">
          <input type="text" value={f.description} onChange={(e) => set({ description: e.target.value })} className={inputCls} placeholder="A short summary of the page" />
        </Field>
        <Field label="Canonical URL">
          <input type="text" value={f.url} onChange={(e) => set({ url: e.target.value })} className={inputCls} placeholder="https://example.com/page" />
        </Field>
        <Field label="Social image URL">
          <input type="text" value={f.image} onChange={(e) => set({ image: e.target.value })} className={inputCls} placeholder="https://example.com/og-image.png" />
        </Field>
        <Field label="Site name">
          <input type="text" value={f.siteName} onChange={(e) => set({ siteName: e.target.value })} className={inputCls} placeholder="Example Co" />
        </Field>
        <Field label="OG type">
          <select value={f.type} onChange={(e) => set({ type: e.target.value })} className={inputCls}>
            {["website", "article", "product", "profile"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Twitter card">
          <select value={f.twitterCard} onChange={(e) => set({ twitterCard: e.target.value })} className={inputCls}>
            {["summary", "summary_large_image"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Robots">
          <select value={f.robots} onChange={(e) => set({ robots: e.target.value })} className={inputCls}>
            {["index, follow", "noindex, follow", "index, nofollow", "noindex, nofollow"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Author">
          <input type="text" value={f.author} onChange={(e) => set({ author: e.target.value })} className={inputCls} placeholder="Jane Doe" />
        </Field>
        <Field label="Theme colour">
          <input type="color" value={f.themeColor || "#000000"} onChange={(e) => set({ themeColor: e.target.value })} className="h-10 w-full cursor-pointer rounded-lg border border-[#121212]/15 bg-transparent" />
        </Field>
        <div className="sm:col-span-2 flex flex-wrap gap-x-6 gap-y-2 pt-1">
          <CheckRow checked={f.charset} onChange={(v) => set({ charset: v })} label="Include charset meta" />
          <CheckRow checked={f.viewport} onChange={(v) => set({ viewport: v })} label="Include viewport meta" />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls + " !mb-0"}>Meta tags — paste into your &lt;head&gt;</label>
          <CopyButton text={output} />
        </div>
        <TextArea value={output} onChange={() => {}} rows={16} placeholder="Fill the form — tags appear here live" />
        {output && (
          <div className="mt-3">
            <DownloadButton onClick={() => downloadText(output, "meta-tags.html", "text/html")} label="Download .html" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Robots.txt generator ──────────────────────────────────────── */

function RobotsTxtGenerator() {
  const [ua, setUa] = useState("*");
  const [disallow, setDisallow] = useState("");
  const [allow, setAllow] = useState("");
  const [crawlDelay, setCrawlDelay] = useState("");
  const [sitemap, setSitemap] = useState("");

  const output = useMemo(() => {
    const lines: string[] = [`User-agent: ${ua.trim() || "*"}`];
    const dLines = disallow.split("\n").map((s) => s.trim()).filter(Boolean);
    if (dLines.length === 0) lines.push("Disallow:");
    else for (const d of dLines) lines.push(`Disallow: ${d}`);
    for (const a of allow.split("\n").map((s) => s.trim()).filter(Boolean)) lines.push(`Allow: ${a}`);
    const delay = Number(crawlDelay);
    if (crawlDelay.trim() !== "" && Number.isFinite(delay) && delay > 0) {
      lines.push(`Crawl-delay: ${delay}`);
    }
    if (sitemap.trim()) lines.push(`Sitemap: ${sitemap.trim()}`);
    return lines.join("\n") + "\n";
  }, [ua, disallow, allow, crawlDelay, sitemap]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="grid gap-4">
        <Field label="User-agent">
          <input type="text" value={ua} onChange={(e) => setUa(e.target.value)} className={inputCls} placeholder="*" />
        </Field>
        <Field label="Disallow paths (one per line — empty means allow everything)">
          <TextArea value={disallow} onChange={setDisallow} rows={4} placeholder={"/private\n/admin"} />
        </Field>
        <Field label="Allow paths (one per line)">
          <TextArea value={allow} onChange={setAllow} rows={3} placeholder={"/public"} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Crawl-delay (seconds, optional)">
            <input type="number" min={0} value={crawlDelay} onChange={(e) => setCrawlDelay(e.target.value)} className={inputCls} placeholder="10" />
          </Field>
          <Field label="Sitemap URL (optional)">
            <input type="text" value={sitemap} onChange={(e) => setSitemap(e.target.value)} className={inputCls} placeholder="https://example.com/sitemap.xml" />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SecondaryButton onClick={() => setDisallow("")}>Allow everything</SecondaryButton>
          <SecondaryButton onClick={() => setDisallow("/")}>Block everything</SecondaryButton>
          <ResetButton
            onClick={() => {
              setUa("*");
              setDisallow("");
              setAllow("");
              setCrawlDelay("");
              setSitemap("");
            }}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls + " !mb-0"}>robots.txt</label>
          <CopyButton text={output} />
        </div>
        <TextArea value={output} onChange={() => {}} rows={12} />
        <div className="mt-3">
          <DownloadButton onClick={() => downloadText(output, "robots.txt", "text/plain")} label="Download robots.txt" />
        </div>
        <p className="mt-3 text-xs text-muted">
          Upload this file to the root of your domain (https://example.com/robots.txt). Crawl-delay
          is respected by most crawlers but ignored by Google.
        </p>
      </div>
    </div>
  );
}

/* ── Sitemap generator ─────────────────────────────────────────── */

function SitemapGenerator() {
  const [urlsText, setUrlsText] = useState("");
  const [lastmod, setLastmod] = useState("");
  const [changefreq, setChangefreq] = useState("");
  const [priority, setPriority] = useState("");

  const parsed = useMemo(() => {
    const entries: Array<{ url: string; error: string | null }> = [];
    for (const raw of urlsText.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(line) ? line : `https://${line}`;
      try {
        entries.push({ url: new URL(candidate).toString(), error: null });
      } catch {
        entries.push({ url: line, error: "not a valid URL" });
      }
    }
    return entries;
  }, [urlsText]);

  const valid = parsed.filter((e) => e.error === null);
  const invalid = parsed.filter((e) => e.error !== null);

  const xml = useMemo(() => {
    if (valid.length === 0) return "";
    const esc = (v: string) =>
      v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];
    for (const e of valid) {
      lines.push("  <url>");
      lines.push(`    <loc>${esc(e.url)}</loc>`);
      if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
      if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
      if (priority) lines.push(`    <priority>${priority}</priority>`);
      lines.push("  </url>");
    }
    lines.push("</urlset>");
    return lines.join("\n") + "\n";
  }, [valid, lastmod, changefreq, priority]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <Field label="URLs — one per line (protocol optional)">
          <TextArea
            value={urlsText}
            onChange={setUrlsText}
            rows={10}
            placeholder={"https://example.com/\nhttps://example.com/about\nexample.com/contact"}
          />
        </Field>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Last modified (all URLs)">
            <input type="date" value={lastmod} onChange={(e) => setLastmod(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Change frequency">
            <select value={changefreq} onChange={(e) => setChangefreq(e.target.value)} className={inputCls}>
              <option value="">— none —</option>
              {["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
              <option value="">— none —</option>
              {["1.0", "0.9", "0.8", "0.7", "0.6", "0.5", "0.4", "0.3", "0.2", "0.1", "0.0"].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <ResetButton
            onClick={() => {
              setUrlsText("");
              setLastmod("");
              setChangefreq("");
              setPriority("");
            }}
          />
        </div>
        {invalid.length > 0 && (
          <WarningNote>
            {invalid.length} line{invalid.length === 1 ? "" : "s"} could not be parsed as a URL:{" "}
            {invalid.map((e) => e.url).join(", ")} — they were skipped.
          </WarningNote>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls + " !mb-0"}>
            sitemap.xml — {valid.length} URL{valid.length === 1 ? "" : "s"}
          </label>
          {xml && <CopyButton text={xml} />}
        </div>
        <TextArea value={xml} onChange={() => {}} rows={14} placeholder="Paste URLs — the sitemap XML appears here live" />
        {xml && (
          <div className="mt-3">
            <DownloadButton onClick={() => downloadText(xml, "sitemap.xml", "application/xml")} label="Download sitemap.xml" />
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          Host the file at your domain root and reference it from robots.txt. The sitemap protocol
          limit is 50,000 URLs per file.
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Registry
   ════════════════════════════════════════════════════════════════ */

export const developerTools: Record<string, ToolComponent> = {
  "json-formatter": JsonFormatter,
  "json-validator": JsonValidator,
  "json-minifier": JsonMinifier,
  "xml-formatter": XmlFormatter,
  "html-formatter": HtmlFormatter,
  "css-formatter": CssFormatter,
  "javascript-formatter": JsFormatter,
  "html-minifier": HtmlMinifier,
  "css-minifier": CssMinifier,
  "javascript-minifier": JsMinifier,
  "base64-encoder": Base64Encoder,
  "base64-decoder": Base64Decoder,
  "url-encoder": UrlEncoder,
  "url-decoder": UrlDecoder,
  "uuid-generator": UuidGenerator,
  "password-generator": PasswordGenerator,
  "sha-256-generator": Sha256Tool,
  "sha-384-generator": Sha384Tool,
  "sha-512-generator": Sha512Tool,
  "regex-tester": RegexTester,
  "jwt-decoder": JwtDecoder,
  "html-previewer": HtmlPreviewer,
  "css-gradient-generator": CssGradientGenerator,
  "meta-tag-generator": MetaTagGenerator,
  "robots-txt-generator": RobotsTxtGenerator,
  "sitemap-generator": SitemapGenerator,
};
