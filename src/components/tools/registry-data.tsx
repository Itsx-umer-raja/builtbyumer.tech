"use client";

import type { ToolComponent } from "./registry";
import { useState } from "react";
import {
  CopyButton,
  DownloadButton,
  ErrorNote,
  Field,
  FileDrop,
  OkNote,
  PrimaryButton,
  ResetButton,
  TextArea,
  inputCls,
  labelCls,
} from "./ui";
import { cn, downloadBlob, downloadText } from "@/lib/utils";
import {
  inferValue,
  jsonToRecords,
  parseCsv,
  rowsToObjects,
  serializeCsv,
  unionKeys,
  type Delimiter,
} from "@/lib/data/csv";
import { jsonToXml, xmlToJson } from "@/lib/data/xml";

/* ════════════════════════════════════════════════════════════════
   Shared UI helpers (data tools)
   ════════════════════════════════════════════════════════════════ */

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-3 py-2.5 text-center">
      <div className="text-lg font-semibold text-[#163D2B]">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

const DELIMS: Array<[Delimiter, string]> = [
  [",", "Comma ( , )"],
  [";", "Semicolon ( ; )"],
  ["\t", "Tab"],
];

function DelimiterSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls + " w-44"}>
      {DELIMS.map(([d, label]) => (
        <option key={d} value={d}>
          {label}
        </option>
      ))}
    </select>
  );
}

function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, "") || "converted";
}

/** Unknown cell (from xlsx) → CSV-safe string. */
function cellToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/* ════════════════════════════════════════════════════════════════
   CSV ↔ JSON converters
   ════════════════════════════════════════════════════════════════ */

/* ── CSV to JSON ─────────────────────────────────────────────── */

/** Guess the delimiter: the candidate that yields the most columns. */
function detectDelimiter(text: string): Delimiter {
  let best: Delimiter = ",";
  let bestCols = 0;
  for (const [d] of DELIMS) {
    const rows = parseCsv(text.split(/\r?\n/)[0] ?? "", d);
    const cols = rows[0]?.length ?? 0;
    if (cols > bestCols) {
      bestCols = cols;
      best = d;
    }
  }
  return best;
}

function CsvToJson() {
  const [input, setInput] = useState("");
  const [delimiter, setDelimiter] = useState("auto");
  const [hasHeaders, setHasHeaders] = useState(true);
  const [inferTypes, setInferTypes] = useState(true);
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState<{ rows: number; cols: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<string | null>(null);

  const convert = () => {
    setError(null);
    setStats(null);
    try {
      const delim = delimiter === "auto" ? detectDelimiter(input) : delimiter;
      const rows = parseCsv(input, delim);
      if (rows.length === 0) throw new Error("The input contains no data.");
      const headers = hasHeaders ? rows[0] : rows[0].map((_, i) => `column_${i + 1}`);
      const dataRows = hasHeaders ? rows.slice(1) : rows;
      const objects = rowsToObjects(headers, dataRows).map((obj) => {
        const typed: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) typed[k] = inferValue(v, inferTypes);
        return typed;
      });
      setOutput(JSON.stringify(objects, null, 2) + "\n");
      setStats({ rows: dataRows.length, cols: headers.length });
    } catch (e) {
      setOutput("");
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const reset = () => {
    setInput("");
    setOutput("");
    setStats(null);
    setError(null);
    setFileInfo(null);
    setDelimiter("auto");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls + " !mb-0"}>CSV input</label>
          {fileInfo && <span className="text-xs text-muted">{fileInfo}</span>}
        </div>
        <TextArea
          value={input}
          onChange={setInput}
          rows={12}
          placeholder={'name,age,active\n"Alice, Jr",30,true\nBob,25,false'}
        />
        <div className="mt-3">
          <FileDrop
            accept=".csv,.tsv,.txt"
            onFiles={(files) => {
              reset();
              files[0]
                .text()
                .then((t) => {
                  setInput(t);
                  setFileInfo(files[0].name);
                })
                .catch(() => setError(`Could not read "${files[0].name}".`));
            }}
            label="Or load a CSV / TSV file"
            hint="Accepted: csv, tsv, txt · parsed locally"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Field label="Delimiter">
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className={inputCls + " w-44"}
            >
              <option value="auto">Auto-detect</option>
              {DELIMS.map(([d, label]) => (
                <option key={d} value={d}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <div className="pb-2.5">
            <CheckRow checked={hasHeaders} onChange={setHasHeaders} label="First row is a header" />
            <CheckRow checked={inferTypes} onChange={setInferTypes} label="Infer types (numbers, booleans)" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <PrimaryButton onClick={convert} disabled={!input.trim()}>
            Convert to JSON
          </PrimaryButton>
          <ResetButton onClick={reset} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls + " !mb-0"}>JSON output</label>
          {output && <CopyButton text={output} />}
        </div>
        <TextArea value={output} onChange={() => {}} rows={12} placeholder="Converted JSON appears here" />
        {stats && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat label="Data rows" value={String(stats.rows)} />
            <Stat label="Columns" value={String(stats.cols)} />
          </div>
        )}
        {output && (
          <div className="mt-3">
            <DownloadButton
              onClick={() => downloadText(output, "converted.json", "application/json")}
              label="Download .json"
            />
          </div>
        )}
        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
    </div>
  );
}

/* ── JSON to CSV ─────────────────────────────────────────────── */

function JsonToCsv() {
  const [input, setInput] = useState("");
  const [delimiter, setDelimiter] = useState<Delimiter>(",");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [flatten, setFlatten] = useState(true);
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState<{ rows: number; cols: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convert = () => {
    setError(null);
    setStats(null);
    try {
      let parsed: unknown = JSON.parse(input);
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
        parsed = [parsed]; // single object → one-row CSV
      }
      const records = jsonToRecords(parsed, flatten);
      const keys = unionKeys(records);
      const rows: string[][] = [];
      if (includeHeader) rows.push(keys);
      for (const r of records) rows.push(keys.map((k) => r[k] ?? ""));
      setOutput(serializeCsv(rows, delimiter));
      setStats({ rows: records.length, cols: keys.length });
    } catch (e) {
      setOutput("");
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const reset = () => {
    setInput("");
    setOutput("");
    setStats(null);
    setError(null);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <label className={labelCls}>JSON input (array of objects)</label>
        <TextArea
          value={input}
          onChange={setInput}
          rows={12}
          placeholder={'[\n  { "name": "Alice", "age": 30 },\n  { "name": "Bob", "age": 25 }\n]'}
        />
        <div className="mt-3">
          <FileDrop
            accept=".json,.txt"
            onFiles={(files) => {
              reset();
              files[0]
                .text()
                .then((t) => setInput(t))
                .catch(() => setError(`Could not read "${files[0].name}".`));
            }}
            label="Or load a JSON file"
            hint="Accepted: json, txt · parsed locally"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Field label="Delimiter">
            <DelimiterSelect value={delimiter} onChange={(v) => setDelimiter(v as Delimiter)} />
          </Field>
          <div className="pb-2.5">
            <CheckRow checked={includeHeader} onChange={setIncludeHeader} label="Include header row" />
            <CheckRow
              checked={flatten}
              onChange={setFlatten}
              label="Flatten nested objects (dot keys)"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <PrimaryButton onClick={convert} disabled={!input.trim()}>
            Convert to CSV
          </PrimaryButton>
          <ResetButton onClick={reset} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls + " !mb-0"}>CSV output</label>
          {output && <CopyButton text={output} />}
        </div>
        <TextArea value={output} onChange={() => {}} rows={12} placeholder="Converted CSV appears here" />
        {stats && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat label="Data rows" value={String(stats.rows)} />
            <Stat label="Columns" value={String(stats.cols)} />
          </div>
        )}
        {output && (
          <div className="mt-3">
            <DownloadButton
              onClick={() => downloadText(output, "converted.csv", "text/csv")}
              label="Download .csv"
            />
          </div>
        )}
        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CSV ↔ Excel (xlsx / SheetJS)
   ════════════════════════════════════════════════════════════════ */

/* ── CSV to Excel ────────────────────────────────────────────── */

function CsvToExcel() {
  const [mode, setMode] = useState("file");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [delimiter, setDelimiter] = useState<Delimiter>(",");
  const [hasHeaders, setHasHeaders] = useState(true);
  const [typedCells, setTypedCells] = useState(true);
  const [sheetName, setSheetName] = useState("Sheet1");
  const [busy, setBusy] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setText("");
    setFile(null);
    setFileError(null);
    setOkMsg(null);
    setError(null);
  };

  const download = async () => {
    setError(null);
    setOkMsg(null);
    setBusy(true);
    try {
      const csvText = mode === "file" ? await (file as File).text() : text;
      const rows = parseCsv(csvText, delimiter);
      if (rows.length === 0) throw new Error("The input contains no data.");
      const aoa: Array<Array<string | number | boolean | null>> = rows.map((row) => {
        if (!typedCells) return row;
        const start = hasHeaders && row === rows[0];
        return row.map((cell) => (start ? cell : inferValue(cell, true)));
      });
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      // Sensible column widths from the longest cell per column.
      const colWidths = rows[0]?.map((_, c) => ({
        wch: Math.min(60, Math.max(8, ...rows.slice(0, 200).map((r) => (r[c] ?? "").length + 2))),
      }));
      ws["!cols"] = colWidths;
      const wb = XLSX.utils.book_new();
      const name = (sheetName.trim() || "Sheet1").replace(/[[\]:*?/\\]/g, "_").slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, name);
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const fname = mode === "file" && file ? `${baseName(file.name)}.xlsx` : "converted.xlsx";
      downloadBlob(
        new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        fname,
      );
      setOkMsg(`Saved ${fname} — ${rows.length} row${rows.length === 1 ? "" : "s"}, ${rows[0]?.length ?? 0} column${rows[0]?.length === 1 ? "" : "s"}.`);
    } catch (e) {
      setOkMsg(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <ModeTabs
        tabs={[
          ["file", "Upload file"],
          ["paste", "Paste CSV"],
        ]}
        value={mode}
        onChange={(id) => {
          setMode(id);
          reset();
        }}
      />
      {mode === "file" ? (
        <div className="mt-5">
          <FileDrop
            accept=".csv,.tsv,.txt"
            onFiles={(files) => {
              reset();
              setFile(files[0]);
            }}
            label="Drop a CSV file to convert to Excel"
            hint="Accepted: csv, tsv, txt · converted locally"
          />
          {file && (
            <p className="mt-3 text-sm text-[#163D2B]">
              {file.name} · {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
          {fileError && <ErrorNote>{fileError}</ErrorNote>}
        </div>
      ) : (
        <div className="mt-5">
          <label className={labelCls}>CSV text</label>
          <TextArea
            value={text}
            onChange={setText}
            rows={8}
            placeholder={"name,price\nWidget,9.99\nGadget,24.5"}
          />
        </div>
      )}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Delimiter">
          <DelimiterSelect value={delimiter} onChange={(v) => setDelimiter(v as Delimiter)} />
        </Field>
        <Field label="Sheet name">
          <input
            type="text"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            className={inputCls}
            maxLength={31}
            placeholder="Sheet1"
          />
        </Field>
        <div className="pb-1">
          <label className={labelCls}>Cells</label>
          <CheckRow checked={hasHeaders} onChange={setHasHeaders} label="First row is a header" />
          <CheckRow
            checked={typedCells}
            onChange={setTypedCells}
            label="Typed cells (numbers, booleans)"
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton
          onClick={download}
          disabled={busy || (mode === "file" ? !file : !text.trim())}
        >
          {busy ? "Converting…" : "Download .xlsx"}
        </PrimaryButton>
        <ResetButton onClick={reset} />
      </div>
      {okMsg && <OkNote>{okMsg}</OkNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      <p className="mt-3 text-xs text-muted">
        Produces a real .xlsx workbook via SheetJS. With typed cells enabled, numeric and
        true/false values are stored as proper Excel types instead of text, and column widths are
        sized from the data.
      </p>
    </div>
  );
}

/* ── Excel to CSV ────────────────────────────────────────────── */

function ExcelToCsv() {
  const [workbook, setWorkbook] = useState<{
    sheetNames: string[];
    rowsFor: (sheet: string) => unknown[][];
  } | null>(null);
  const [fileName, setFileName] = useState("");
  const [sheet, setSheet] = useState("");
  const [delimiter, setDelimiter] = useState<Delimiter>(",");
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState<{ rows: number; cols: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFiles = (files: File[]) => {
    setError(null);
    setOutput("");
    setStats(null);
    const f = files[0];
    setFileName(f.name);
    f.arrayBuffer()
      .then(async (buf) => {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(new Uint8Array(buf), { type: "array", cellDates: true });
        const cache = new Map<string, unknown[][]>();
        const rowsFor = (sheetName: string): unknown[][] => {
          const cached = cache.get(sheetName);
          if (cached) return cached;
          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
            header: 1,
            raw: true,
            defval: "",
            blankrows: false,
          });
          cache.set(sheetName, rows);
          return rows;
        };
        setWorkbook({ sheetNames: wb.SheetNames, rowsFor });
        setSheet(wb.SheetNames[0] ?? "");
      })
      .catch((e: unknown) => {
        setWorkbook(null);
        setError(
          e instanceof Error
            ? `Could not read the workbook: ${e.message}`
            : "Could not read the workbook.",
        );
      });
  };

  const convert = () => {
    if (!workbook || !sheet) return;
    setError(null);
    try {
      const raw = workbook.rowsFor(sheet);
      const rows = raw.map((row) => row.map(cellToString));
      if (rows.length === 0) throw new Error("The selected sheet is empty.");
      setOutput(serializeCsv(rows, delimiter));
      setStats({ rows: rows.length, cols: Math.max(...rows.map((r) => r.length)) });
    } catch (e) {
      setOutput("");
      setStats(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const reset = () => {
    setWorkbook(null);
    setFileName("");
    setSheet("");
    setOutput("");
    setStats(null);
    setError(null);
  };

  return (
    <div>
      <FileDrop
        accept=".xlsx,.xlsm,.xls"
        onFiles={onFiles}
        label="Drop an Excel workbook to extract CSV"
        hint="Accepted: xlsx, xlsm, xls · read locally"
      />
      {fileName && !workbook && <p className="mt-3 text-sm text-[#163D2B]">Reading {fileName}…</p>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {workbook && (
        <>
          <div className="mt-5 flex flex-wrap items-end gap-4">
            <Field label={`Sheet — ${workbook.sheetNames.length} found`}>
              <select
                value={sheet}
                onChange={(e) => {
                  setSheet(e.target.value);
                  setOutput("");
                  setStats(null);
                }}
                className={inputCls + " w-56"}
              >
                {workbook.sheetNames.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Delimiter">
              <DelimiterSelect value={delimiter} onChange={(v) => setDelimiter(v as Delimiter)} />
            </Field>
            <div className="flex items-center gap-3 pb-1">
              <PrimaryButton onClick={convert} disabled={!sheet}>
                Convert sheet
              </PrimaryButton>
              <ResetButton onClick={reset} />
            </div>
          </div>
          {output && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls + " !mb-0"}>
                  CSV — sheet “{sheet}” from {fileName}
                </label>
                <CopyButton text={output} />
              </div>
              <TextArea value={output} onChange={() => {}} rows={12} />
              {stats && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Stat label="Rows" value={String(stats.rows)} />
                  <Stat label="Columns" value={String(stats.cols)} />
                </div>
              )}
              <div className="mt-3">
                <DownloadButton
                  onClick={() =>
                    downloadText(output, `${baseName(fileName)}-${sheet || "sheet"}.csv`, "text/csv")
                  }
                  label="Download .csv"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   JSON ↔ XML converters
   ════════════════════════════════════════════════════════════════ */

/* ── JSON to XML ─────────────────────────────────────────────── */

function JsonToXmlTool() {
  const [input, setInput] = useState("");
  const [root, setRoot] = useState("root");
  const [pretty, setPretty] = useState(true);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const convert = () => {
    setError(null);
    try {
      const parsed: unknown = JSON.parse(input);
      setOutput(jsonToXml(parsed, root.trim() || "root", { pretty }));
    } catch (e) {
      setOutput("");
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const reset = () => {
    setInput("");
    setOutput("");
    setError(null);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <label className={labelCls}>JSON input</label>
        <TextArea
          value={input}
          onChange={setInput}
          rows={12}
          placeholder={'{\n  "book": { "@attributes": { "id": "7" }, "title": "Dune" }\n}'}
        />
        <div className="mt-3">
          <FileDrop
            accept=".json,.txt"
            onFiles={(files) => {
              reset();
              files[0]
                .text()
                .then(setInput)
                .catch(() => setError(`Could not read "${files[0].name}".`));
            }}
            label="Or load a JSON file"
            hint="Accepted: json, txt · converted locally"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Field label="Root element">
            <input
              type="text"
              value={root}
              onChange={(e) => setRoot(e.target.value)}
              className={inputCls + " w-44"}
              placeholder="root"
            />
          </Field>
          <div className="pb-2.5">
            <CheckRow checked={pretty} onChange={setPretty} label="Indent output" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <PrimaryButton onClick={convert} disabled={!input.trim()}>
            Convert to XML
          </PrimaryButton>
          <ResetButton onClick={reset} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Objects become elements, arrays become repeated elements, and an{" "}
          <code className="font-mono text-cream">&quot;@attributes&quot;</code> key becomes XML
          attributes. Use <code className="font-mono text-cream">&quot;#text&quot;</code> to mix
          text content with attributes.
        </p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls + " !mb-0"}>XML output</label>
          {output && <CopyButton text={output} />}
        </div>
        <TextArea value={output} onChange={() => {}} rows={12} placeholder="Converted XML appears here" />
        {output && (
          <div className="mt-3">
            <DownloadButton
              onClick={() => downloadText(output, "converted.xml", "application/xml")}
              label="Download .xml"
            />
          </div>
        )}
        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
    </div>
  );
}

/* ── XML to JSON ─────────────────────────────────────────────── */

function XmlToJsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [rootName, setRootName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convert = () => {
    setError(null);
    setRootName(null);
    try {
      const { root, json } = xmlToJson(input);
      setOutput(JSON.stringify(json, null, 2) + "\n");
      setRootName(root);
    } catch (e) {
      setOutput("");
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const reset = () => {
    setInput("");
    setOutput("");
    setRootName(null);
    setError(null);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <label className={labelCls}>XML input</label>
        <TextArea
          value={input}
          onChange={setInput}
          rows={12}
          placeholder={'<?xml version="1.0"?>\n<catalog book="1">\n  <title>Dune</title>\n</catalog>'}
        />
        <div className="mt-3">
          <FileDrop
            accept=".xml,.txt"
            onFiles={(files) => {
              reset();
              files[0]
                .text()
                .then(setInput)
                .catch(() => setError(`Could not read "${files[0].name}".`));
            }}
            label="Or load an XML file"
            hint="Accepted: xml, txt · parsed locally"
          />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <PrimaryButton onClick={convert} disabled={!input.trim()}>
            Convert to JSON
          </PrimaryButton>
          <ResetButton onClick={reset} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Attributes are preserved under{" "}
          <code className="font-mono text-cream">&quot;@attributes&quot;</code>, repeated sibling
          elements become arrays, and CDATA / entity references are decoded.
        </p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls + " !mb-0"}>JSON output</label>
          {output && <CopyButton text={output} />}
        </div>
        <TextArea value={output} onChange={() => {}} rows={12} placeholder="Converted JSON appears here" />
        {rootName && (
          <div className="mt-3">
            <Stat label="Root element" value={`<${rootName}>`} />
          </div>
        )}
        {output && (
          <div className="mt-3">
            <DownloadButton
              onClick={() => downloadText(output, "converted.json", "application/json")}
              label="Download .json"
            />
          </div>
        )}
        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Registry
   ════════════════════════════════════════════════════════════════ */

export const dataTools: Record<string, ToolComponent> = {
  "csv-to-json": CsvToJson,
  "json-to-csv": JsonToCsv,
  "csv-to-excel": CsvToExcel,
  "excel-to-csv": ExcelToCsv,
  "json-to-xml": JsonToXmlTool,
  "xml-to-json": XmlToJsonTool,
};
