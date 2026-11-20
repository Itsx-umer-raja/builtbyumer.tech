/**
 * Shared CSV helpers: an RFC 4180 parser/serializer, cell type inference
 * and JSON flattening used by the data conversion tools.
 */

export type Delimiter = "," | ";" | "\t";

/* ── Parsing (RFC 4180: quoted fields, "" escapes, CRLF) ─────── */

/**
 * Parse CSV text into rows of raw string cells.
 * Handles quoted fields containing delimiters, newlines and escaped quotes.
 */
export function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;
  const src = text.replace(/^\uFEFF/, ""); // strip BOM

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    // Skip fully-empty trailing rows produced by trailing newlines.
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = [];
      return;
    }
    pushCell();
    rows.push(row);
    row = [];
  };

  while (i < src.length) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        cell += c;
        i++;
      }
      continue;
    }
    if (c === '"' && cell === "") {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === delimiter) {
      pushCell();
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      pushRow();
      i++;
      continue;
    }
    cell += c;
    i++;
  }
  if (cell !== "" || row.length > 0) pushRow();
  return rows;
}

/* ── Serialising ─────────────────────────────────────────────── */

/** Escape a single CSV cell per RFC 4180 (quote only when needed). */
export function csvCell(value: string, delimiter: string, quoteAll = false): string {
  const needs =
    quoteAll ||
    value.includes('"') ||
    value.includes(delimiter) ||
    /[\r\n]/.test(value) ||
    value.trimStart().startsWith(" ") ||
    value.trimEnd().endsWith(" ");
  const escaped = value.replace(/"/g, '""');
  return needs ? `"${escaped}"` : escaped;
}

/** Serialise rows (cells are stringified) into CSV text. */
export function serializeCsv(
  rows: Array<Array<string | number | boolean>>,
  delimiter: string,
  quoteAll = false,
  lineEnding: "\r\n" | "\n" = "\r\n",
): string {
  return (
    rows
      .map((row) =>
        row
          .map((v) => csvCell(typeof v === "string" ? v : String(v), delimiter, quoteAll))
          .join(delimiter),
      )
      .join(lineEnding) + (rows.length > 0 ? lineEnding : "")
  );
}

/* ── Type inference (CSV → JSON) ─────────────────────────────── */

const NUMERIC_RE = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

/** Infer a JSON value from a raw CSV cell: boolean, number, null or string. */
export function inferValue(raw: string, enabled: boolean): string | number | boolean | null {
  if (!enabled) return raw;
  const v = raw.trim();
  if (v === "") return raw === "" ? "" : raw;
  const lower = v.toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;
  if (lower === "null") return null;
  // Numbers, but keep leading-zero strings ("007", "0300…") as text.
  if (NUMERIC_RE.test(v) && !/^[-+]?0\d/.test(v)) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return raw;
}

/* ── Rows ↔ objects ──────────────────────────────────────────── */

/** Build objects from a header row + data rows (deduplicates headers). */
export function rowsToObjects(
  headers: string[],
  rows: string[][],
): Array<Record<string, string>> {
  const seen = new Map<string, number>();
  const keys = headers.map((h) => {
    const base = h.trim() === "" ? "column" : h.trim();
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}_${n + 1}`;
  });
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    keys.forEach((k, idx) => {
      obj[k] = row[idx] ?? "";
    });
    return obj;
  });
}

/* ── JSON → CSV flattening ───────────────────────────────────── */

/**
 * Flatten a JSON value into CSV-ready cell text. Objects are flattened
 * into dot-keys; arrays become JSON strings.
 */
export function flattenCell(value: unknown, flattenObjects: boolean, prefix = ""): Record<string, string> {
  if (value === null || value === undefined) return { [prefix || "value"]: "" };
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") {
    return { [prefix || "value"]: String(value) };
  }
  if (Array.isArray(value)) {
    return { [prefix || "value"]: JSON.stringify(value) };
  }
  const obj = value as Record<string, unknown>;
  if (!flattenObjects) {
    return { [prefix || "value"]: JSON.stringify(obj) };
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v === null || v === undefined) {
      out[key] = "";
    } else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[key] = String(v);
    } else if (Array.isArray(v)) {
      out[key] = JSON.stringify(v);
    } else {
      Object.assign(out, flattenCell(v, flattenObjects, key));
    }
  }
  if (Object.keys(out).length === 0) out[prefix || "value"] = "";
  return out;
}

/** Normalise an arbitrary JSON array into a uniform list of flat records. */
export function jsonToRecords(
  input: unknown,
  flattenObjects: boolean,
): Array<Record<string, string>> {
  if (!Array.isArray(input)) {
    throw new Error("The JSON must be an array of objects, e.g. [{\"a\":1},{\"a\":2}].");
  }
  return input.map((item) => {
    // Objects are flattened; scalar / array entries become a "value" column.
    return flattenCell(item, flattenObjects);
  });
}

/** Ordered union of all keys across the records, in first-seen order. */
export function unionKeys(records: Array<Record<string, string>>): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    for (const k of Object.keys(r)) {
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
    }
  }
  return keys;
}
