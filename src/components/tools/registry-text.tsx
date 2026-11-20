"use client";

import type { ToolComponent } from "./registry";
import { useMemo, useState, type ReactNode } from "react";
import { diffLines } from "diff";
import { marked } from "marked";
import {
  TextArea,
  CopyButton,
  ResetButton,
  PrimaryButton,
  DownloadButton,
  Field,
  inputCls,
  labelCls,
} from "./ui";
import { downloadText, cn } from "@/lib/utils";

/* ── Shared local primitives ────────────────────────────────── */

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-3 py-3 text-center">
      <div className="text-2xl font-semibold text-[#163D2B]">{value}</div>
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-cream">
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

function DownloadRow({
  value,
  filename,
  mime = "text/plain",
  label = "Download .txt",
}: {
  value: string;
  filename: string;
  mime?: string;
  label?: string;
}) {
  if (!value) return null;
  return (
    <div className="mt-3">
      <DownloadButton onClick={() => downloadText(value, filename, mime)} label={label} />
    </div>
  );
}

/* ── word-counter (exemplar) ────────────────────────────────── */

function WordCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const sentences = trimmed ? trimmed.split(/[.!?]+(?=\s|$)/).filter((s) => s.trim()).length : 0;
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
    const lines = text ? text.split("\n").length : 0;
    const readingTimeMin = Math.max(words > 0 ? 1 : 0, Math.round(words / 200));
    return {
      words,
      chars: text.length,
      charsNoSpaces: text.replace(/\s/g, "").length,
      sentences,
      paragraphs,
      lines,
      readingTimeMin,
    };
  }, [text]);

  const items: Array<[string, string | number]> = [
    ["Words", stats.words],
    ["Characters", stats.chars],
    ["Characters (no spaces)", stats.charsNoSpaces],
    ["Sentences", stats.sentences],
    ["Paragraphs", stats.paragraphs],
    ["Lines", stats.lines],
    ["Reading time", stats.readingTimeMin > 0 ? `${stats.readingTimeMin} min` : "—"],
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-3 py-3 text-center"
          >
            <div className="text-2xl font-semibold text-[#163D2B]">{value}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-muted">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls + " !mb-0"}>Your text</label>
          {text && <CopyButton text={text} />}
        </div>
        <TextArea value={text} onChange={setText} rows={10} placeholder="Type or paste text here — counts update live" />
        <div className="mt-3">
          <ResetButton onClick={() => setText("")} />
        </div>
      </div>
    </div>
  );
}

/* ── character-counter ──────────────────────────────────────── */

function CharacterCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    return {
      chars: text.length,
      charsNoSpaces: text.replace(/\s/g, "").length,
      letters: (text.match(/[^\W\d_]/g) ?? []).length,
      digits: (text.match(/\d/g) ?? []).length,
      words: trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0,
      lines: text ? text.split("\n").length : 0,
      paragraphs: trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0,
    };
  }, [text]);

  const items: Array<[string, string | number]> = [
    ["Characters", stats.chars],
    ["No spaces", stats.charsNoSpaces],
    ["Letters", stats.letters],
    ["Digits", stats.digits],
    ["Words", stats.words],
    ["Lines", stats.lines],
    ["Paragraphs", stats.paragraphs],
  ];

  return (
    <div>
      <StatsGrid items={items} />
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between">
          <label className={labelCls + " !mb-0"}>Your text</label>
          {text && <CopyButton text={text} />}
        </div>
        <TextArea
          value={text}
          onChange={setText}
          rows={10}
          placeholder="Type or paste text here — counts update live"
        />
        <div className="mt-3">
          <ResetButton onClick={() => setText("")} />
        </div>
      </div>
    </div>
  );
}

/* ── sentence-counter ───────────────────────────────────────── */

const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "mt", "vs", "etc", "eg", "ie",
  "approx", "fig", "inc", "ltd", "co", "corp", "dept", "est", "capt", "sgt", "rev",
  "hon", "gen", "col", "lt", "sen", "rep", "gov", "no", "vol", "pp", "ed", "al",
  "cf", "ca", "cent", "phd", "md", "mba", "ave", "blvd", "rd", "jan", "feb", "mar",
  "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
]);

const DOT_MASK = "\u0001";

/** Split into sentences while not breaking on common abbreviations and initials. */
function splitSentences(text: string): string[] {
  const masked = text.replace(/\b([A-Za-z]+)\./g, (match, word: string) => {
    if (word.length === 1 || ABBREVIATIONS.has(word.toLowerCase())) {
      return `${word}${DOT_MASK}`;
    }
    return match;
  });
  return masked
    .split(/(?<=[.!?])["')\]]*\s+/)
    .map((s) => s.replaceAll(DOT_MASK, ".").trim())
    .filter((s) => s.length > 0);
}

function SentenceCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const sentences = splitSentences(text);
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const count = sentences.length;
    const avg = count > 0 ? Math.round((words / count) * 10) / 10 : 0;
    return { sentences, count, words, avg };
  }, [text]);

  return (
    <div>
      <StatsGrid
        items={[
          ["Sentences", stats.count],
          ["Words", stats.words],
          ["Avg words / sentence", stats.avg],
          ["Characters", text.length],
        ]}
      />
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between">
          <label className={labelCls + " !mb-0"}>Your text</label>
          {text && <CopyButton text={text} />}
        </div>
        <TextArea
          value={text}
          onChange={setText}
          rows={10}
          placeholder={'Paste text here — "e.g.", "Dr." and initials are handled correctly'}
        />
        <div className="mt-3">
          <ResetButton onClick={() => setText("")} />
        </div>
      </div>
      {stats.sentences.length > 0 && (
        <div className="mt-5">
          <div className={labelCls}>Detected sentences ({stats.count})</div>
          <ol className="list-decimal space-y-2 pl-6 text-sm leading-relaxed text-cream/90">
            {stats.sentences.slice(0, 50).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          {stats.count > 50 && (
            <p className="mt-2 text-xs text-muted">…and {stats.count - 50} more.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── paragraph-counter ──────────────────────────────────────── */

function ParagraphCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [];
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const count = paragraphs.length;
    const avg = count > 0 ? Math.round((words / count) * 10) / 10 : 0;
    const longest = paragraphs.reduce((max, p) => Math.max(max, p.split(/\s+/).filter(Boolean).length), 0);
    return { count, words, avg, longest, paragraphs };
  }, [text]);

  return (
    <div>
      <StatsGrid
        items={[
          ["Paragraphs", stats.count],
          ["Words", stats.words],
          ["Avg words / paragraph", stats.avg],
          ["Longest paragraph", stats.longest],
        ]}
      />
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between">
          <label className={labelCls + " !mb-0"}>Your text</label>
          {text && <CopyButton text={text} />}
        </div>
        <TextArea
          value={text}
          onChange={setText}
          rows={10}
          placeholder="Paste text here — paragraphs are separated by blank lines"
        />
        <div className="mt-3">
          <ResetButton onClick={() => setText("")} />
        </div>
      </div>
      {stats.paragraphs.length > 0 && (
        <div className="mt-5">
          <div className={labelCls}>Paragraph previews</div>
          <div className="space-y-3">
            {stats.paragraphs.slice(0, 12).map((p, i) => {
              const pw = p.split(/\s+/).filter(Boolean).length;
              const preview = p.length > 180 ? p.slice(0, 180) + "…" : p;
              return (
                <div key={i} className="rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-4 py-3">
                  <div className="text-xs font-semibold text-[#163D2B]">
                    Paragraph {i + 1} · {pw} words
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-cream/90">{preview}</p>
                </div>
              );
            })}
          </div>
          {stats.count > 12 && (
            <p className="mt-2 text-xs text-muted">…and {stats.count - 12} more.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── case-converter ─────────────────────────────────────────── */

type CaseMode =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "alternating";

const CASE_MODES: Array<[CaseMode, string]> = [
  ["upper", "UPPERCASE"],
  ["lower", "lowercase"],
  ["title", "Title Case"],
  ["sentence", "Sentence case"],
  ["camel", "camelCase"],
  ["pascal", "PascalCase"],
  ["snake", "snake_case"],
  ["kebab", "kebab-case"],
  ["alternating", "aLtErNaTiNg"],
];

function convertCase(text: string, mode: CaseMode): string {
  const words = text.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const cap = (w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w);
  switch (mode) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.toLowerCase().replace(/(^|\s)(\S)/g, (m, sep, ch) => sep + ch.toUpperCase());
    case "sentence":
      return text
        .toLowerCase()
        .replace(/(^\s*|[.!?]\s+|\n+)([a-z])/g, (m, sep, ch) => sep + ch.toUpperCase());
    case "camel":
      return words.map((w, i) => (i === 0 ? w.toLowerCase() : cap(w))).join("");
    case "pascal":
      return words.map(cap).join("");
    case "snake":
      return words.map((w) => w.toLowerCase()).join("_");
    case "kebab":
      return words.map((w) => w.toLowerCase()).join("-");
    case "alternating": {
      let i = 0;
      return text
        .split("")
        .map((ch) => {
          if (!/[a-zA-Z]/.test(ch)) return ch;
          const out = i % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase();
          i++;
          return out;
        })
        .join("");
    }
  }
}

function CaseConverter() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CaseMode>("upper");

  const output = useMemo(() => convertCase(text, mode), [text, mode]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {CASE_MODES.map(([value, label]) => (
          <Chip key={value} active={mode === value} onClick={() => setMode(value)}>
            {label}
          </Chip>
        ))}
      </div>
      <Field label="Input text">
        <TextArea
          value={text}
          onChange={setText}
          rows={7}
          placeholder="Type or paste text here — the converted result updates live"
        />
      </Field>
      <div className="mt-5">
        <OutputBox value={output} label="Converted text" rows={7} />
        <div className="mt-3 flex items-center gap-3">
          <ResetButton onClick={() => setText("")} />
        </div>
        <DownloadRow value={output} filename="converted-text.txt" />
      </div>
    </div>
  );
}

/* ── text-reverser ──────────────────────────────────────────── */

type ReverseMode = "characters" | "words" | "lines";

function TextReverser() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<ReverseMode | null>(null);

  const apply = (m: ReverseMode) => {
    setMode(m);
    if (m === "characters") setOutput([...input].reverse().join(""));
    else if (m === "words") setOutput(input.split(/(\s+)/).reverse().join(""));
    else setOutput(input.split("\n").reverse().join("\n"));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["characters", "words", "lines"] as ReverseMode[]).map((m) => (
          <Chip key={m} active={mode === m} onClick={() => apply(m)}>
            Reverse {m}
          </Chip>
        ))}
      </div>
      <Field label="Input text">
        <TextArea
          value={input}
          onChange={setInput}
          rows={8}
          placeholder="Type or paste text here, then pick a reverse mode"
        />
      </Field>
      <div className="mt-5">
        <OutputBox value={output} label="Reversed text" rows={8} />
        <div className="mt-3">
          <ResetButton
            onClick={() => {
              setInput("");
              setOutput("");
              setMode(null);
            }}
          />
        </div>
        <DownloadRow value={output} filename="reversed-text.txt" />
      </div>
    </div>
  );
}

/* ── duplicate-line-remover ─────────────────────────────────── */

function DuplicateLineRemover() {
  const [text, setText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(true);

  const result = useMemo(() => {
    const lines = text.split("\n");
    const seen = new Set<string>();
    const kept: string[] = [];
    let removed = 0;
    for (const line of lines) {
      if (line.trim() === "") {
        kept.push(line);
        continue;
      }
      const key = caseSensitive ? line : line.toLowerCase();
      if (seen.has(key)) {
        removed++;
      } else {
        seen.add(key);
        kept.push(line);
      }
    }
    return { output: kept.join("\n"), total: lines.length, removed };
  }, [text, caseSensitive]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-5">
        <Toggle
          label="Case-sensitive matching"
          checked={caseSensitive}
          onChange={setCaseSensitive}
        />
        <span className="text-xs text-muted">
          {result.removed} duplicate {result.removed === 1 ? "line" : "lines"} removed
        </span>
      </div>
      <StatsGrid
        items={[
          ["Input lines", result.total],
          ["Duplicates removed", result.removed],
          ["Unique lines kept", result.total - result.removed],
        ]}
      />
      <div className="mt-5">
        <Field label="Input lines">
          <TextArea
            value={text}
            onChange={setText}
            rows={9}
            placeholder="Paste lines here — duplicates are removed live"
          />
        </Field>
        <div className="mt-5">
          <OutputBox value={result.output} label="Deduplicated lines" rows={9} />
          <div className="mt-3">
            <ResetButton onClick={() => setText("")} />
          </div>
          <DownloadRow value={result.output} filename="deduplicated.txt" />
        </div>
      </div>
    </div>
  );
}

/* ── extra-space-remover ────────────────────────────────────── */

function cleanSpaces(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function ExtraSpaceRemover() {
  const [text, setText] = useState("");

  const result = useMemo(() => {
    const output = cleanSpaces(text);
    const inputLines = text.split("\n");
    const outputLines = output.split("\n");
    const linesChanged = inputLines.filter((line, i) => {
      const cleaned = outputLines[i] ?? "";
      return line !== cleaned;
    }).length;
    return { output, removed: Math.max(0, text.length - output.length), linesChanged };
  }, [text]);

  return (
    <div>
      <StatsGrid
        items={[
          ["Original characters", text.length],
          ["Cleaned characters", result.output.length],
          ["Characters removed", result.removed],
          ["Lines changed", result.linesChanged],
        ]}
      />
      <div className="mt-5">
        <Field label="Input text">
          <TextArea
            value={text}
            onChange={setText}
            rows={9}
            placeholder="Paste messy text here — extra spaces and blank lines are cleaned live"
          />
        </Field>
        <div className="mt-5">
          <OutputBox value={result.output} label="Cleaned text" rows={9} />
          <div className="mt-3">
            <ResetButton onClick={() => setText("")} />
          </div>
          <DownloadRow value={result.output} filename="cleaned-text.txt" />
        </div>
      </div>
    </div>
  );
}

/* ── text-sorter ────────────────────────────────────────────── */

type SortMode = "alpha" | "numeric" | "length";

function leadingNumber(line: string): number | null {
  const m = line.match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function TextSorter() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<SortMode>("alpha");
  const [desc, setDesc] = useState(false);
  const [caseInsensitive, setCaseInsensitive] = useState(true);
  const [dedupe, setDedupe] = useState(false);

  const output = useMemo(() => {
    let lines = text.split("\n").filter((l) => l.trim() !== "");
    if (dedupe) {
      const seen = new Set<string>();
      lines = lines.filter((l) => {
        const key = l.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    const dir = desc ? -1 : 1;
    const cmpAlpha = (a: string, b: string): number =>
      caseInsensitive
        ? a.localeCompare(b, undefined, { sensitivity: "base" })
        : a < b
          ? -1
          : a > b
            ? 1
            : 0;
    lines.sort((a, b) => {
      let c: number;
      if (mode === "numeric") {
        const na = leadingNumber(a);
        const nb = leadingNumber(b);
        if (na === null && nb === null) c = cmpAlpha(a, b);
        else if (na === null) c = 1;
        else if (nb === null) c = -1;
        else c = na - nb;
      } else if (mode === "length") {
        c = a.length - b.length;
        if (c === 0) c = cmpAlpha(a, b);
      } else {
        c = cmpAlpha(a, b);
      }
      return c * dir;
    });
    return lines.join("\n");
  }, [text, mode, desc, caseInsensitive, dedupe]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["alpha", "numeric", "length"] as SortMode[]).map((m) => (
          <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
            {m === "alpha" ? "Alphabetical" : m === "numeric" ? "Numeric" : "Length"}
          </Chip>
        ))}
        <span className="mx-1 h-5 w-px bg-[#121212]/10" aria-hidden />
        <Chip active={!desc} onClick={() => setDesc(false)}>
          Ascending
        </Chip>
        <Chip active={desc} onClick={() => setDesc(true)}>
          Descending
        </Chip>
        <span className="mx-1 h-5 w-px bg-[#121212]/10" aria-hidden />
        <Toggle label="Case-insensitive" checked={caseInsensitive} onChange={setCaseInsensitive} />
        <Toggle label="Remove duplicates" checked={dedupe} onChange={setDedupe} />
      </div>
      <Field label="Input lines">
        <TextArea
          value={text}
          onChange={setText}
          rows={9}
          placeholder="Paste one item per line — sorting updates live"
        />
      </Field>
      <div className="mt-5">
        <OutputBox value={output} label="Sorted lines" rows={9} />
        <div className="mt-3">
          <ResetButton onClick={() => setText("")} />
        </div>
        <DownloadRow value={output} filename="sorted-lines.txt" />
      </div>
    </div>
  );
}

/* ── lorem-ipsum-generator ──────────────────────────────────── */

const LOREM_WORDS = [
  "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt",
  "ut", "labore", "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam",
  "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex",
  "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit",
  "voluptate", "velit", "esse", "cillum", "eu", "fugiat", "nulla", "pariatur",
  "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "culpa",
  "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum",
];

function pickWord(): string {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function randomSentence(): string {
  const n = 8 + Math.floor(Math.random() * 7);
  const words = Array.from({ length: n }, pickWord);
  const s = words.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

const LOREM_OPENING_SENTENCE =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

const LOREM_OPENING_PARAGRAPH =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

type LoremMode = "paragraphs" | "sentences" | "words";

function generateLorem(mode: LoremMode, count: number): string {
  const n = Math.max(1, Math.min(mode === "words" ? 500 : 50, count));
  if (mode === "words") {
    const opening = ["lorem", "ipsum", "dolor", "sit", "amet"];
    const rest = Array.from({ length: Math.max(0, n - opening.length) }, pickWord);
    return [...opening, ...rest].slice(0, n).join(" ");
  }
  if (mode === "sentences") {
    const extra = Array.from({ length: Math.max(0, n - 1) }, randomSentence);
    return [LOREM_OPENING_SENTENCE, ...extra].slice(0, n).join(" ");
  }
  const extra = Array.from({ length: Math.max(0, n - 1) }, () => {
    const sentences = Array.from({ length: 4 + Math.floor(Math.random() * 3) }, randomSentence);
    return sentences.join(" ");
  });
  return [LOREM_OPENING_PARAGRAPH, ...extra].slice(0, n).join("\n\n");
}

function LoremIpsumGenerator() {
  const [mode, setMode] = useState<LoremMode>("paragraphs");
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState("");

  const generate = () => setOutput(generateLorem(mode, count));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["paragraphs", "sentences", "words"] as LoremMode[]).map((m) => (
          <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </Chip>
        ))}
        <input
          type="number"
          min={1}
          max={mode === "words" ? 500 : 50}
          value={count}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            setCount(Number.isNaN(v) ? 1 : Math.max(1, v));
          }}
          className={inputCls + " w-24"}
          aria-label={`Number of ${mode}`}
        />
        <PrimaryButton onClick={generate}>Generate</PrimaryButton>
      </div>
      <OutputBox value={output} label="Generated text" rows={12} />
      <div className="mt-3">
        <ResetButton onClick={() => setOutput("")} />
      </div>
      <DownloadRow value={output} filename="lorem-ipsum.txt" />
    </div>
  );
}

/* ── slug-generator ─────────────────────────────────────────── */

function slugify(input: string, sep: "-" | "_"): string {
  const dash = sep === "-" ? "\\-" : sep;
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/gi, "ss")
    .replace(/æ/gi, "ae")
    .replace(/œ/gi, "oe")
    .replace(/ø/gi, "o")
    .replace(/đ/gi, "d")
    .replace(/ł/gi, "l")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, sep)
    .replace(new RegExp(`^${dash}+|${dash}+$`, "g"), "");
}

function SlugGenerator() {
  const [title, setTitle] = useState("");
  const [sep, setSep] = useState<"-" | "_">("-");

  const slug = useMemo(() => slugify(title, sep), [title, sep]);

  return (
    <div>
      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Crème Brûlée — 5 Easy Recipes!"
          className={inputCls}
          spellCheck={false}
        />
      </Field>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={labelCls + " !mb-0"}>Separator</span>
        <Chip active={sep === "-"} onClick={() => setSep("-")}>
          Dash (-)
        </Chip>
        <Chip active={sep === "_"} onClick={() => setSep("_")}>
          Underscore (_)
        </Chip>
      </div>
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between">
          <label className={labelCls + " !mb-0"}>Slug (live preview)</label>
          {slug && <CopyButton text={slug} />}
        </div>
        <div className="min-h-14 rounded-lg border border-[#121212]/15 bg-white px-4 py-3.5">
          {slug ? (
            <span className="break-all font-mono text-sm text-[#163D2B]">{slug}</span>
          ) : (
            <span className="text-sm text-muted/60">your-clean-slug-appears-here</span>
          )}
        </div>
        {slug && (
          <p className="mt-2 text-xs text-muted">
            {slug.length} characters · {sep === "-" ? "hyphenated" : "underscored"}
          </p>
        )}
        <div className="mt-3">
          <ResetButton onClick={() => setTitle("")} />
        </div>
      </div>
    </div>
  );
}

/* ── diff-checker ───────────────────────────────────────────── */

type DiffKind = "added" | "removed" | "same";

interface DiffRow {
  kind: DiffKind;
  text: string;
  oldNo: number | null;
  newNo: number | null;
}

interface DiffResult {
  rows: DiffRow[];
  added: number;
  removed: number;
  same: number;
}

function computeDiff(oldText: string, newText: string): DiffResult {
  const changes = diffLines(oldText, newText);
  const rows: DiffRow[] = [];
  let oldNo = 0;
  let newNo = 0;
  let added = 0;
  let removed = 0;
  let same = 0;
  for (const change of changes) {
    if (change.value === "") continue;
    const lines = change.value.replace(/\n$/, "").split("\n");
    for (const line of lines) {
      if (change.added) {
        newNo++;
        added++;
        rows.push({ kind: "added", text: line, oldNo: null, newNo });
      } else if (change.removed) {
        oldNo++;
        removed++;
        rows.push({ kind: "removed", text: line, oldNo, newNo: null });
      } else {
        oldNo++;
        newNo++;
        same++;
        rows.push({ kind: "same", text: line, oldNo, newNo });
      }
    }
  }
  return { rows, added, removed, same };
}

function DiffChecker() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [onlyChanges, setOnlyChanges] = useState(false);

  const result = useMemo(
    () =>
      oldText === "" && newText === ""
        ? { rows: [], added: 0, removed: 0, same: 0 }
        : computeDiff(oldText, newText),
    [oldText, newText],
  );
  const visibleRows = useMemo(
    () => (onlyChanges ? result.rows.filter((r) => r.kind !== "same") : result.rows),
    [result.rows, onlyChanges],
  );

  const patch = useMemo(() => {
    if (oldText === "" && newText === "") return "";
    const changes = diffLines(oldText, newText);
    return changes
      .map((c) => (c.added ? "+" : c.removed ? "-" : " ") + c.value)
      .join("");
  }, [oldText, newText]);

  const hasDiff = oldText.length > 0 || newText.length > 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-5">
        <Toggle label="Hide unchanged lines" checked={onlyChanges} onChange={setOnlyChanges} />
        <span className="text-xs text-muted">
          {result.added} added · {result.removed} removed · {result.same} unchanged
        </span>
      </div>
      <StatsGrid
        items={[
          ["Added lines", result.added],
          ["Removed lines", result.removed],
          ["Unchanged", result.same],
          ["Total changes", result.added + result.removed],
        ]}
      />
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Field label="Original text">
          <TextArea value={oldText} onChange={setOldText} rows={10} placeholder="Original version" />
        </Field>
        <Field label="Changed text">
          <TextArea value={newText} onChange={setNewText} rows={10} placeholder="New version" />
        </Field>
      </div>
      <div className="mt-5">
        <div className={labelCls}>Line-by-line comparison</div>
        {hasDiff ? (
          <div className="max-h-96 overflow-auto rounded-lg border border-[#121212]/12 bg-white font-mono text-sm">
            {visibleRows.map((r, i) => (
              <div
                key={i}
                className={cn(
                  "flex whitespace-pre px-2 py-0.5",
                  r.kind === "added" && "bg-green-500/10 text-green-300",
                  r.kind === "removed" && "bg-red-500/10 text-red-300",
                  r.kind === "same" && "text-cream/75",
                )}
              >
                <span className="w-10 shrink-0 select-none pr-2 text-right text-muted/50">
                  {r.oldNo ?? ""}
                </span>
                <span className="w-10 shrink-0 select-none pr-2 text-right text-muted/50">
                  {r.newNo ?? ""}
                </span>
                <span className="w-4 shrink-0 select-none">
                  {r.kind === "added" ? "+" : r.kind === "removed" ? "-" : " "}
                </span>
                <span className="break-all">{r.text === "" ? " " : r.text}</span>
              </div>
            ))}
            {visibleRows.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted">No changed lines — the texts match.</p>
            )}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-[#121212]/15 px-4 py-6 text-center text-sm text-muted">
            Paste two texts above to compare them line by line.
          </p>
        )}
        {patch && (
          <div className="mt-3">
            <DownloadButton
              onClick={() => downloadText(patch, "changes.diff", "text/x-diff")}
              label="Download .diff"
            />
          </div>
        )}
        <div className="mt-3">
          <ResetButton
            onClick={() => {
              setOldText("");
              setNewText("");
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── markdown-editor ────────────────────────────────────────── */

const MD_PREVIEW_CSS = `
.md-preview { color: #f5efe2; line-height: 1.65; font-size: 0.95rem; overflow-wrap: break-word; }
.md-preview h1 { font-size: 1.75rem; font-weight: 700; margin: 1.2rem 0 0.6rem; color: #c6f35c; }
.md-preview h2 { font-size: 1.4rem; font-weight: 700; margin: 1.1rem 0 0.5rem; color: #c6f35c; }
.md-preview h3 { font-size: 1.15rem; font-weight: 600; margin: 1rem 0 0.4rem; color: #f5efe2; }
.md-preview h4, .md-preview h5, .md-preview h6 { font-size: 1rem; font-weight: 600; margin: 0.9rem 0 0.4rem; }
.md-preview p { margin: 0.6rem 0; }
.md-preview ul { margin: 0.6rem 0; padding-left: 1.5rem; list-style: disc; }
.md-preview ol { margin: 0.6rem 0; padding-left: 1.5rem; list-style: decimal; }
.md-preview li { margin: 0.25rem 0; }
.md-preview a { color: #c6f35c; text-decoration: underline; }
.md-preview code { background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 0.1rem 0.35rem; font-size: 0.85em; font-family: var(--font-jetbrains), ui-monospace, monospace; }
.md-preview pre { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0.9rem; overflow-x: auto; margin: 0.8rem 0; }
.md-preview pre code { background: transparent; border: none; padding: 0; font-size: 0.85rem; }
.md-preview blockquote { border-left: 3px solid #c6f35c; margin: 0.8rem 0; padding: 0.2rem 0 0.2rem 0.9rem; color: #a8b5aa; }
.md-preview table { border-collapse: collapse; margin: 0.8rem 0; width: 100%; display: block; overflow-x: auto; }
.md-preview th, .md-preview td { border: 1px solid rgba(255,255,255,0.15); padding: 0.4rem 0.6rem; text-align: left; }
.md-preview th { background: rgba(198,243,92,0.08); }
.md-preview hr { border: none; border-top: 1px solid rgba(255,255,255,0.15); margin: 1.2rem 0; }
.md-preview img { max-width: 100%; border-radius: 8px; }
.md-preview > :first-child { margin-top: 0; }
`;

const MD_SAMPLE = `# Welcome

Write **Markdown** on the left and see it rendered *live* on the right.

## What you can do

- Format text with **bold**, *italic* and \`inline code\`
- Build lists, tables and blockquotes
- Copy the generated HTML with one click

> Everything runs locally in your browser.

\`\`\`js
console.log("hello world");
\`\`\`

| Feature | Status |
| ------- | ------ |
| Live preview | Ready |
| Copy HTML | Ready |
`;

function MarkdownEditor() {
  const [md, setMd] = useState(MD_SAMPLE);

  const html = useMemo(() => {
    try {
      return marked.parse(md, { gfm: true, breaks: true, async: false });
    } catch {
      return "";
    }
  }, [md]);

  return (
    <div>
      <style>{MD_PREVIEW_CSS}</style>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={labelCls + " !mb-0"}>Markdown</label>
            <CopyButton text={md} label="Copy Markdown" />
          </div>
          <TextArea
            value={md}
            onChange={setMd}
            rows={20}
            className="min-h-96"
            placeholder="Write Markdown here"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={labelCls + " !mb-0"}>Preview</label>
            {html && <CopyButton text={html} label="Copy HTML" />}
          </div>
          <div
            className="md-preview min-h-96 overflow-y-auto rounded-lg border border-[#121212]/15 bg-white px-5 py-4"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ResetButton onClick={() => setMd(MD_SAMPLE)} />
        <ResetButton onClick={() => setMd("")} />
        {md && (
          <DownloadButton onClick={() => downloadText(md, "document.md", "text/markdown")} label="Download .md" />
        )}
        {html && (
          <DownloadButton
            onClick={() => downloadText(html, "document.html", "text/html")}
            label="Download HTML"
          />
        )}
      </div>
    </div>
  );
}

/* ── html-entity-encoder ────────────────────────────────────── */

const NAMED_ENCODE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "\u00a0": "&nbsp;",
  "©": "&copy;",
  "®": "&reg;",
  "™": "&trade;",
  "…": "&hellip;",
  "—": "&mdash;",
  "–": "&ndash;",
  "‘": "&lsquo;",
  "’": "&rsquo;",
  "“": "&ldquo;",
  "”": "&rdquo;",
};

function encodeEntities(text: string, encodeNonAscii: boolean): string {
  let out = "";
  for (const ch of text) {
    const named = NAMED_ENCODE[ch];
    if (named !== undefined) {
      out += named;
      continue;
    }
    const cp = ch.codePointAt(0) ?? 0;
    if (encodeNonAscii && cp > 127) {
      out += `&#${cp};`;
    } else {
      out += ch;
    }
  }
  return out;
}

function HtmlEntityEncoder() {
  const [text, setText] = useState("");
  const [encodeNonAscii, setEncodeNonAscii] = useState(true);

  const output = useMemo(() => encodeEntities(text, encodeNonAscii), [text, encodeNonAscii]);

  const entityCount = useMemo(() => (output.match(/&[#a-zA-Z0-9]+;/g) ?? []).length, [output]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-5">
        <Toggle
          label="Convert non-ASCII characters to numeric entities"
          checked={encodeNonAscii}
          onChange={setEncodeNonAscii}
        />
        <span className="text-xs text-muted">{entityCount} entities produced</span>
      </div>
      <Field label="Raw text">
        <TextArea
          value={text}
          onChange={setText}
          rows={8}
          placeholder='e.g. 5 < 10 & "quotes" — encoded live'
        />
      </Field>
      <div className="mt-5">
        <OutputBox value={output} label="Encoded text" rows={8} />
        <div className="mt-3">
          <ResetButton onClick={() => setText("")} />
        </div>
        <DownloadRow value={output} filename="encoded-entities.txt" />
      </div>
    </div>
  );
}

/* ── html-entity-decoder ────────────────────────────────────── */

const NAMED_DECODE: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0",
  copy: "©", reg: "®", trade: "™", hellip: "…", mdash: "—", ndash: "–",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»",
  deg: "°", plusmn: "±", times: "×", divide: "÷", frac12: "½", frac14: "¼", frac34: "¾",
  cent: "¢", pound: "£", yen: "¥", euro: "€", sect: "§", para: "¶", middot: "·",
  bull: "•", dagger: "†", Dagger: "‡", prime: "′", Prime: "″",
  larr: "←", rarr: "→", uarr: "↑", darr: "↓", harr: "↔",
  ne: "≠", le: "≤", ge: "≥", infin: "∞", minus: "−", ensp: " ", emsp: " ",
  eacute: "é", egrave: "è", agrave: "à", ccedil: "ç", uuml: "ü", ouml: "ö", auml: "ä",
  ntilde: "ñ", szlig: "ß", aacute: "á", iacute: "í", oacute: "ó", uacute: "ú",
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", pi: "π", omega: "ω", mu: "μ",
};

interface DecodeResult {
  text: string;
  resolved: number;
  remaining: number;
}

function decodeEntities(text: string): DecodeResult {
  let resolved = 0;
  const decoded = text.replace(
    /&(?:#x([0-9a-fA-F]+)|#([0-9]+)|([a-zA-Z][a-zA-Z0-9]*));/g,
    (match, hex: string, dec: string, name: string) => {
      try {
        if (hex !== undefined) {
          resolved++;
          return String.fromCodePoint(parseInt(hex, 16));
        }
        if (dec !== undefined) {
          resolved++;
          return String.fromCodePoint(parseInt(dec, 10));
        }
        const v = NAMED_DECODE[name];
        if (v !== undefined) {
          resolved++;
          return v;
        }
      } catch {
        // Invalid code point (e.g. out of Unicode range) — fall through.
      }
      return match;
    },
  );
  const remaining = (decoded.match(/&(?:#[0-9]+;|#[xX][0-9a-fA-F]+;|[a-zA-Z][a-zA-Z0-9]*;)/g) ?? []).length;
  return { text: decoded, resolved, remaining };
}

function HtmlEntityDecoder() {
  const [text, setText] = useState("");

  const result = useMemo(() => decodeEntities(text), [text]);

  return (
    <div>
      <div className="mb-4">
        <span className="text-xs text-muted">
          {result.resolved} entities decoded{result.remaining > 0 ? ` · ${result.remaining} unresolved` : ""}
        </span>
      </div>
      <Field label="Encoded text">
        <TextArea
          value={text}
          onChange={setText}
          rows={8}
          placeholder="e.g. &lt;p&gt;Hello &amp;amp; welcome&lt;/p&gt; — decoded live"
        />
      </Field>
      <div className="mt-5">
        <OutputBox value={result.text} label="Decoded text" rows={8} />
        <div className="mt-3">
          <ResetButton onClick={() => setText("")} />
        </div>
        <DownloadRow value={result.text} filename="decoded-text.txt" />
      </div>
    </div>
  );
}

/* ── Registry ───────────────────────────────────────────────── */

export const textTools: Record<string, ToolComponent> = {
  "word-counter": WordCounter,
  "character-counter": CharacterCounter,
  "sentence-counter": SentenceCounter,
  "paragraph-counter": ParagraphCounter,
  "case-converter": CaseConverter,
  "text-reverser": TextReverser,
  "duplicate-line-remover": DuplicateLineRemover,
  "extra-space-remover": ExtraSpaceRemover,
  "text-sorter": TextSorter,
  "lorem-ipsum-generator": LoremIpsumGenerator,
  "slug-generator": SlugGenerator,
  "diff-checker": DiffChecker,
  "markdown-editor": MarkdownEditor,
  "html-entity-encoder": HtmlEntityEncoder,
  "html-entity-decoder": HtmlEntityDecoder,
};
