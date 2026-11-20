/**
 * Local, dependency-free 1D barcode decoder for still images.
 *
 * Supported symbologies: EAN-13, UPC-A, EAN-8, Code 128, Code 39.
 *
 * Approach: binarise the image (global Otsu threshold), sample many rows,
 * convert each row into black/white run lengths, reconstruct module-level
 * bit strings (EAN family) or symbol patterns (Code 128 / Code 39), and run
 * symbology-specific structured decoders. Results that pass checksums are
 * voted on across rows. All processing happens on-device.
 *
 * Tables cross-checked against Wikipedia (EAN-13, Code 39 element charts),
 * the ZXing EAN-13 first-digit parity implementation and the Code 128 spec.
 */

export interface BarcodeResult {
  text: string;
  format: "EAN-13" | "UPC-A" | "EAN-8" | "Code 128" | "Code 39";
}

/* ── EAN family encoding tables ─────────────────────────────── */

// L (odd parity) 7-bit codes, digit 0-9. Bit 1 = dark bar module.
const EAN_L = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011",
];
// G (even parity) 7-bit codes.
const EAN_G = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111",
];
// R codes (bitwise complement of L).
const EAN_R = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100",
];

// First-digit parity patterns for EAN-13 (six left digits).
const EAN13_PARITY = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL",
];

/* ── Code 128 tables ────────────────────────────────────────── */

// Canonical Code 128 width patterns (bar,space,bar,space,bar,space), 11 modules.
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232",
];
const CODE128_STOP = "2331112";
const CODE128_LOOKUP = new Map<string, number>(CODE128_PATTERNS.map((p, v) => [p, v]));

function code128Char(value: number, codeSet: "A" | "B" | "C"): string | null {
  if (codeSet === "C") return value >= 0 && value <= 99 ? String(value).padStart(2, "0") : null;
  if (codeSet === "B") return value >= 0 && value <= 94 ? String.fromCharCode(value + 32) : null;
  // Code set A
  if (value <= 64) return String.fromCharCode(value + 32);
  if (value <= 95) return String.fromCharCode(value - 64); // control characters
  return null;
}

/* ── Code 39 tables ─────────────────────────────────────────── */

// Five bars, two wide (weights 1,2,4,7,0); 0 = all narrow (used by $ / + %).
const CODE39_BARS: Record<number, string> = {
  0: "00000",
  1: "10001", 2: "01001", 3: "11000", 4: "00101", 5: "10100",
  6: "01100", 7: "00011", 8: "10010", 9: "01010", 10: "00110",
};
// Four spaces, one wide — wide position selects the character group —
// plus the four symbols that have three wide spaces instead.
const CODE39_SPACES: string[] = [
  "1000", // pos 1: U-Z, -, ., space, *
  "0100", // pos 2: digits
  "0010", // pos 3: A-J
  "0001", // pos 4: K-T
  "1110", // $ (three wide spaces)
  "1101", // /
  "1011", // +
  "0111", // %
];

const CODE39_TABLE = new Map<string, string>();
(function buildCode39() {
  const put = (ch: string, bars: number, spaces: number) => {
    let pattern = "";
    for (let i = 0; i < 5; i++) {
      pattern += CODE39_BARS[bars][i];
      if (i < 4) pattern += CODE39_SPACES[spaces][i];
    }
    CODE39_TABLE.set(pattern, ch);
  };
  for (let d = 1; d <= 9; d++) put(String(d), d, 1);
  put("0", 10, 1);
  for (let i = 0; i < 10; i++) put(String.fromCharCode(65 + i), i + 1, 2); // A-J
  for (let i = 0; i < 10; i++) put(String.fromCharCode(75 + i), i + 1, 3); // K-T
  const lastGroup = ["U", "V", "W", "X", "Y", "Z", "-", ".", " ", "*"];
  for (let i = 0; i < lastGroup.length; i++) put(lastGroup[i], i + 1, 0);
  put("$", 0, 4);
  put("/", 0, 5);
  put("+", 0, 6);
  put("%", 0, 7);
})();

/* ── Row runs / binarisation ────────────────────────────────── */

interface Run {
  dark: boolean;
  width: number;
}

/**
 * Extract run lengths from a single grayscale row using sub-pixel threshold
 * crossings. The threshold is the midpoint between the row's 10th and 90th
 * gray percentiles (robust to noise, blur and lighting bias), and crossings
 * are linearly interpolated, so blurred edges still land on the correct
 * module grid. Widths are fractional.
 */
function grayRowRuns(gray: Uint8Array, w: number, y: number): Run[] | null {
  const row: number[] = new Array<number>(w);
  for (let x = 0; x < w; x++) row[x] = gray[y * w + x];
  const sorted = [...row].sort((a, b) => a - b);
  const p10 = sorted[Math.floor(w * 0.1)];
  const p90 = sorted[Math.floor(w * 0.9)];
  const threshold = (p10 + p90) / 2;

  const transitions: number[] = [];
  let dark = row[0] < threshold;
  for (let x = 1; x < w; x++) {
    const isDark = row[x] < threshold;
    if (isDark !== dark) {
      const g0 = row[x - 1];
      const g1 = row[x];
      const frac = g1 === g0 ? 0.5 : Math.min(1, Math.max(0, (threshold - g0) / (g1 - g0)));
      transitions.push(x - 1 + frac);
      dark = isDark;
    }
  }

  const runs: Run[] = [];
  let prev = 0;
  let runDark = row[0] < threshold;
  for (const t of transitions) {
    runs.push({ dark: runDark, width: t - prev });
    runDark = !runDark;
    prev = t;
  }
  runs.push({ dark: runDark, width: w - prev });

  // Trim quiet-zone white runs at the edges.
  while (runs.length > 0 && !runs[0].dark) runs.shift();
  while (runs.length > 0 && !runs[runs.length - 1].dark) runs.pop();
  if (runs.length < 10) return null;
  return runs;
}

/** Remove noise slivers (< 35% of the median run) and merge their neighbours. */
function removeSlivers(runs: Run[]): Run[] {
  if (runs.length < 8) return runs;
  const widths = runs.map((r) => r.width).sort((a, b) => a - b);
  const median = widths[Math.floor(widths.length / 2)];
  const out: Run[] = [];
  for (const r of runs) {
    if (r.width < median * 0.35 && out.length > 0) {
      // Merge into the previous run (neighbours always share polarity).
      out[out.length - 1].width += r.width;
      continue;
    }
    out.push({ ...r });
  }
  return out;
}

/** Drop leading/trailing runs far wider than the median (photo borders etc.). */
function trimBorderRuns(runs: Run[]): Run[] {
  if (runs.length < 8) return runs;
  const widths = runs.map((r) => r.width).sort((a, b) => a - b);
  const median = widths[Math.floor(widths.length / 2)];
  const tooWide = median * 8;
  let start = 0;
  let end = runs.length;
  while (start < end && runs[start].width > tooWide) start++;
  while (end > start && runs[end - 1].width > tooWide) end--;
  return runs.slice(start, end);
}

/** Convert runs to whole modules given a module size; null when inconsistent. */
function runsToModules(runs: Run[], moduleSize: number, tolerance: number): number[] | null {
  const counts: number[] = [];
  for (const r of runs) {
    const ratio = r.width / moduleSize;
    const n = Math.round(ratio);
    if (n < 1 || Math.abs(ratio - n) > tolerance) return null;
    counts.push(n);
  }
  return counts;
}

/**
 * Reconstruct the module bit string ("1" = dark) from run counts. Runs always
 * start with a dark run because quiet-zone whites are trimmed.
 */
function modulesToBits(counts: number[]): string {
  let bits = "";
  for (let i = 0; i < counts.length; i++) bits += (i % 2 === 0 ? "1" : "0").repeat(counts[i]);
  return bits;
}

/** Candidate module sizes for the variable-width symbologies. */
function candidateModules(runs: Run[]): number[] {
  const widths = runs.map((r) => r.width).sort((a, b) => a - b);
  const min = widths[0];
  const median = widths[Math.floor(widths.length / 2)];
  const candidates = [min, median / 2, median].filter((m) => m > 0.5);
  return Array.from(new Set(candidates.map((m) => Math.round(m * 100) / 100)));
}

/* ── EAN-13 / UPC-A / EAN-8 ─────────────────────────────────── */

/*
 * EAN symbols are decoded from the module bit string, not from individual
 * runs, because dark runs merge across digit/centre-guard boundaries.
 * EAN-13: 101 + 6×7 (L/G) + 10101 + 6×7 (R) + 101 = 95 modules.
 * EAN-8:  101 + 4×7 (L)   + 10101 + 4×7 (R) + 101 = 67 modules.
 */
function decodeEanFamily(bits: string, digits: 13 | 8): string | null {
  if (digits === 13) {
    if (bits.length !== 95 || bits.startsWith("101") === false || bits.endsWith("101") === false) {
      return null;
    }
    const left = bits.slice(3, 45);
    const center = bits.slice(45, 50);
    const right = bits.slice(50, 92);
    if (center !== "10101") return null;

    const parities: Array<"L" | "G"> = [];
    const leftDigits: number[] = [];
    for (let d = 0; d < 6; d++) {
      const chunk = left.slice(d * 7, d * 7 + 7);
      const ld = EAN_L.indexOf(chunk);
      if (ld >= 0) {
        parities.push("L");
        leftDigits.push(ld);
        continue;
      }
      const gd = EAN_G.indexOf(chunk);
      if (gd >= 0) {
        parities.push("G");
        leftDigits.push(gd);
        continue;
      }
      return null;
    }
    const rightDigits: number[] = [];
    for (let d = 0; d < 6; d++) {
      const chunk = right.slice(d * 7, d * 7 + 7);
      const digit = EAN_R.indexOf(chunk);
      if (digit < 0) return null;
      rightDigits.push(digit);
    }
    // The parity of the left half encodes the (otherwise invisible) first digit.
    const first = EAN13_PARITY.indexOf(parities.join(""));
    if (first < 0) return null;
    const all = [first, ...leftDigits, ...rightDigits];
    if (!ean13ChecksumValid(all)) return null;
    // A leading zero means the symbol is a UPC-A.
    return first === 0 ? all.slice(1).join("") : all.join("");
  }

  // EAN-8
  if (bits.length !== 67 || bits.startsWith("101") === false || bits.endsWith("101") === false) {
    return null;
  }
  const left = bits.slice(3, 31);
  const center = bits.slice(31, 36);
  const right = bits.slice(36, 64);
  if (center !== "10101") return null;

  const leftDigits: number[] = [];
  for (let d = 0; d < 4; d++) {
    const digit = EAN_L.indexOf(left.slice(d * 7, d * 7 + 7));
    if (digit < 0) return null;
    leftDigits.push(digit);
  }
  const rightDigits: number[] = [];
  for (let d = 0; d < 4; d++) {
    const digit = EAN_R.indexOf(right.slice(d * 7, d * 7 + 7));
    if (digit < 0) return null;
    rightDigits.push(digit);
  }
  const all = [...leftDigits, ...rightDigits];
  return ean8ChecksumValid(all) ? all.join("") : null;
}

function ean13ChecksumValid(d: number[]): boolean {
  if (d.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += d[i] * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10 === d[12];
}

function ean8ChecksumValid(d: number[]): boolean {
  if (d.length !== 8) return false;
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += d[i] * (i % 2 === 0 ? 3 : 1);
  return (10 - (sum % 10)) % 10 === d[7];
}

/* ── Code 128 ───────────────────────────────────────────────── */

function parseCode128Modules(m: number[]): string | null {
  const symbols: number[] = [];
  let i = 0;
  while (i < m.length) {
    const remaining = m.length - i;
    if (remaining < 6) return null;
    if (remaining === 7 && m.slice(i, i + 7).join("") === CODE128_STOP) {
      i += 7;
      break;
    }
    const value = CODE128_LOOKUP.get(m.slice(i, i + 6).join(""));
    if (value === undefined) return null;
    symbols.push(value);
    i += 6;
  }
  if (i !== m.length) return null; // trailing garbage
  if (symbols.length < 3) return null; // start + payload + checksum

  const start = symbols[0];
  const check = symbols[symbols.length - 1];
  const body = symbols.slice(1, -1);
  if (start < 103 || start > 105) return null;
  if (check !== code128Checksum(start, body)) return null;

  let codeSet: "A" | "B" | "C" = start === 103 ? "A" : start === 104 ? "B" : "C";
  let out = "";
  for (let k = 0; k < body.length; k++) {
    const v = body[k];
    if (v === 99) {
      // CODE C switch (from A or B).
      codeSet = "C";
      continue;
    }
    if (v === 100) {
      // CODE B switch (from A or C).
      codeSet = "B";
      continue;
    }
    if (v === 101) {
      // CODE A switch (from B or C).
      codeSet = "A";
      continue;
    }
    if (v === 97) {
      // SHIFT: interpret the next value in the other alphanumeric set.
      const next = body[++k];
      if (next === undefined) return null;
      const other: "A" | "B" = codeSet === "A" ? "B" : "A";
      const ch = code128Char(next, other);
      if (ch === null) return null;
      out += ch;
      continue;
    }
    // FNC1 (102), FNC2 (96), FNC3 (95), FNC4 (98): not represented as text.
    if (v >= 95 && v <= 102) continue;
    const ch = code128Char(v, codeSet);
    if (ch === null) return null;
    out += ch;
  }
  return out.length > 0 ? out : null;
}

function decodeCode128(runs: Run[]): string | null {
  for (const moduleSize of candidateModules(runs)) {
    const m = runsToModules(runs, moduleSize, 0.45);
    if (!m) continue;
    // Symbols are 6 runs; the stop symbol adds one extra 2-module bar (7 runs).
    if (m.length % 6 !== 0 && m.length % 6 !== 1) continue;
    const text = parseCode128Modules(m);
    if (text) return text;
  }
  return null;
}

function code128Checksum(start: number, body: number[]): number {
  let sum = start;
  for (let i = 0; i < body.length; i++) sum += body[i] * (i + 1);
  return sum % 103;
}

/* ── Code 39 ────────────────────────────────────────────────── */

function parseCode39Modules(m: number[]): string | null {
  // Each character: 9 runs (starting with a bar) + a narrow separator space,
  // except the last character which has no trailing separator.
  if (m.length % 10 !== 9) return null;
  let out = "";
  let i = 0;
  while (i < m.length) {
    if (m.length - i < 9) return null;
    let pattern = "";
    for (let k = 0; k < 9; k++) pattern += m[i + k] >= 2 ? "1" : "0";
    const ch = CODE39_TABLE.get(pattern);
    if (ch === undefined) return null;
    out += ch;
    i += 9;
    if (i < m.length) {
      if (m[i] !== 1) return null; // separator must be a narrow space
      i += 1;
    }
  }
  if (!out.startsWith("*") || !out.endsWith("*") || out.length < 3) return null;
  return out.slice(1, -1);
}

function decodeCode39(runs: Run[]): string | null {
  for (const moduleSize of candidateModules(runs)) {
    const m = runsToModules(runs, moduleSize, 0.5);
    if (!m) continue;
    const text = parseCode39Modules(m);
    if (text) return text;
  }
  return null;
}

/* ── Top-level decode ───────────────────────────────────────── */

function tryDecodeRow(rawRuns: Run[]): BarcodeResult | null {
  const runs = removeSlivers(trimBorderRuns(rawRuns));
  const total = runs.reduce((s, r) => s + r.width, 0);
  if (total < 40) return null;

  // EAN family: module size is derived from the exact symbol length.
  for (const [totalModules, digits] of [
    [95, 13],
    [67, 8],
  ] as const) {
    const moduleSize = total / totalModules;
    if (moduleSize < 1) continue;
    const m = runsToModules(runs, moduleSize, 0.45);
    if (!m) continue;
    const bits = modulesToBits(m);
    const text = decodeEanFamily(bits, digits);
    if (text) {
      return { text, format: digits === 8 ? "EAN-8" : text.length === 12 ? "UPC-A" : "EAN-13" };
    }
  }

  const c128 = decodeCode128(runs);
  if (c128) return { text: c128, format: "Code 128" };
  const c39 = decodeCode39(runs);
  if (c39) return { text: c39, format: "Code 39" };
  return null;
}

/**
 * Decode a 1D barcode from pixel data. Returns null when no supported
 * symbology is recognised; never throws.
 */
export function decodeBarcode1D(data: ImageData): BarcodeResult | null {
  const w = data.width;
  const h = data.height;
  if (w < 40 || h < 8) return null;

  // Grayscale.
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const j = i * 4;
    gray[i] = (data.data[j] * 299 + data.data[j + 1] * 587 + data.data[j + 2] * 114) / 1000;
  }
  // Sample rows across the middle 70% of the image and vote on results.
  const rowCandidates = 25;
  const top = Math.floor(h * 0.15);
  const bottom = Math.max(top + 1, Math.floor(h * 0.85));
  const votes = new Map<string, { count: number; result: BarcodeResult }>();

  for (let r = 0; r < rowCandidates; r++) {
    const y = Math.min(h - 1, top + Math.floor(((bottom - top) * r) / rowCandidates));
    const rawRuns = grayRowRuns(gray, w, y);
    if (!rawRuns) continue;
    const runs = rawRuns;
    if (!runs) continue;
    const found = tryDecodeRow(runs);
    if (!found) continue;
    const key = `${found.format}:${found.text}`;
    const entry = votes.get(key);
    if (entry) entry.count++;
    else votes.set(key, { count: 1, result: found });
  }

  // Most-agreed result wins; ties prefer checksummed symbologies over Code 39.
  let best: { count: number; result: BarcodeResult } | null = null;
  for (const entry of votes.values()) {
    if (
      !best ||
      entry.count > best.count ||
      (entry.count === best.count &&
        entry.result.format !== "Code 39" &&
        best.result.format === "Code 39")
    ) {
      best = entry;
    }
  }
  return best ? best.result : null;
}
