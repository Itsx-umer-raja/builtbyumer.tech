"use client";

import type { PDFFont } from "pdf-lib";

/* ── Page-range parsing ─────────────────────────────────────── */

/**
 * Parse a comma-separated list of page tokens ("1-3", "5", "2 - 4") into
 * groups of 1-based page numbers. Throws with a human-readable message.
 */
export function parseRangeGroups(input: string, pageCount: number): number[][] {
  const groups: number[][] = [];
  for (const rawPart of input.split(",")) {
    const part = rawPart.trim();
    if (!part) continue;
    const match = /^(\d+)\s*(?:-\s*(\d+))?$/.exec(part);
    if (!match) throw new Error(`"${part}" is not a valid page or range.`);
    const start = Number(match[1]);
    const end = match[2] !== undefined ? Number(match[2]) : start;
    if (start < 1 || end > pageCount || start > end) {
      throw new Error(`Range "${part}" is outside this document (1-${pageCount}).`);
    }
    const pages: number[] = [];
    for (let p = start; p <= end; p++) pages.push(p);
    groups.push(pages);
  }
  if (groups.length === 0) throw new Error("Enter at least one page or range.");
  return groups;
}

/** Parse a page selection into a sorted, de-duplicated list of 1-based pages. */
export function parsePageList(input: string, pageCount: number): number[] {
  const groups = parseRangeGroups(input, pageCount);
  const set = new Set<number>();
  for (const group of groups) for (const p of group) set.add(p);
  return [...set].sort((a, b) => a - b);
}

/* ── Text helpers ───────────────────────────────────────────── */

const WIN_ANSI_REPLACEMENTS: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201A": ",",
  "\u201B": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u201E": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2212": "-",
  "\u2026": "...",
  "\u2022": "-",
  "\u2023": "-",
  "\u2043": "-",
  "\u00A0": " ",
  "\u2007": " ",
  "\u202F": " ",
  "\u2009": " ",
  "\u200B": "",
  "\u00AD": "-",
  "\t": "    ",
};

const WIN_ANSI_EXTRA = new Set([
  0x20ac, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x0161,
  0x203a, 0x0153, 0x017e, 0x0178,
]);

/**
 * Standard PDF fonts only cover WinAnsi; map common Unicode punctuation to
 * close ASCII equivalents and drop anything else so pdf-lib never throws.
 */
export function sanitizeWinAnsi(text: string): string {
  let out = "";
  for (const ch of text) {
    const replacement = WIN_ANSI_REPLACEMENTS[ch];
    if (replacement !== undefined) {
      out += replacement;
      continue;
    }
    const code = ch.codePointAt(0) ?? 0;
    if (code === 10 || code === 13) {
      out += " ";
    } else if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.has(code)) {
      out += ch;
    } else {
      out += "?";
    }
  }
  return out;
}

/* ── Image decoding ─────────────────────────────────────────── */

export interface DecodedImage {
  /** Encoded image bytes (kept as JPEG/PNG when the format is natively embeddable). */
  bytes: Uint8Array;
  kind: "jpg" | "png";
  width: number;
  height: number;
}

/**
 * Read an uploaded image into bytes pdf-lib can embed. JPEG and PNG pass
 * through untouched; anything else (WEBP, GIF, BMP, AVIF…) is re-encoded
 * to PNG via a canvas.
 */
export async function decodeImageFile(file: File): Promise<DecodedImage> {
  const buffer = await file.arrayBuffer();
  const type = file.type || "";
  const isJpg = type === "image/jpeg" || type === "image/jpg";
  const isPng = type === "image/png";
  const bitmap = await createImageBitmap(new Blob([buffer], { type: type || "image/png" }));
  const width = bitmap.width;
  const height = bitmap.height;
  if (isJpg || isPng) {
    bitmap.close();
    return { bytes: new Uint8Array(buffer), kind: isJpg ? "jpg" : "png", width, height };
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser does not support canvas rendering.");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const pngBlob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(`Could not decode "${file.name}".`))), "image/png"),
  );
  return { bytes: new Uint8Array(await pngBlob.arrayBuffer()), kind: "png", width, height };
}

/* ── Images → PDF ───────────────────────────────────────────── */

export interface ImagesToPdfOptions {
  pageSize: "fit" | "a4" | "letter";
  orientation: "auto" | "portrait" | "landscape";
  marginPt: number;
}

const PAGE_SIZES = {
  a4: [595.28, 841.89] as const,
  letter: [612, 792] as const,
};

/** Build a PDF from decoded images, one image per page. */
export async function buildImagePdf(
  images: DecodedImage[],
  opts: ImagesToPdfOptions,
): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.setProducer("BuiltByUmer");
  for (const img of images) {
    const embedded = img.kind === "jpg" ? await pdf.embedJpg(img.bytes) : await pdf.embedPng(img.bytes);
    let pw: number;
    let ph: number;
    if (opts.pageSize === "fit") {
      pw = embedded.width;
      ph = embedded.height;
    } else {
      const [w0, h0] = PAGE_SIZES[opts.pageSize];
      const landscape =
        opts.orientation === "landscape" ||
        (opts.orientation === "auto" && embedded.width > embedded.height);
      pw = landscape ? h0 : w0;
      ph = landscape ? w0 : h0;
    }
    const page = pdf.addPage([pw, ph]);
    const margin = opts.pageSize === "fit" ? 0 : opts.marginPt;
    const maxW = Math.max(1, pw - margin * 2);
    const maxH = Math.max(1, ph - margin * 2);
    const scale = Math.min(maxW / embedded.width, maxH / embedded.height);
    const w = embedded.width * scale;
    const h = embedded.height * scale;
    page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }
  return pdf.save({ useObjectStreams: true });
}

/* ── Text layout → PDF ──────────────────────────────────────── */

export interface TextBlock {
  kind?: "text";
  text: string;
  size: number;
  bold?: boolean;
  mono?: boolean;
  bullet?: boolean;
  align?: "left" | "center";
  spaceBefore?: number;
}

export interface ImageBlock {
  kind: "image";
  bytes: Uint8Array;
  format: "jpg" | "png";
  spaceBefore?: number;
}

export type PdfBlock = TextBlock | ImageBlock;

export interface BlocksToPdfOptions {
  pageSize: "a4" | "letter";
  marginPt: number;
  /** Line height multiplier, default 1.35. */
  lineSpacing?: number;
  /** Use a monospace font for every block, default false. */
  mono?: boolean;
  title?: string;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const rawLine of text.split("\n")) {
    const words = rawLine.split(" ");
    let line = "";
    const push = (s: string) => {
      const trimmed = s.replace(/\s+$/, "");
      if (trimmed.length > 0 || out.length > 0) out.push(trimmed);
    };
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) {
        push(line);
        line = "";
      }
      // Hard-split words that are wider than a full line.
      let chunk = "";
      for (const ch of word) {
        if (chunk && font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
          push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      line = chunk;
    }
    push(line);
  }
  if (out.length === 0) out.push("");
  return out;
}

/** Flow styled text/image blocks onto PDF pages with automatic wrapping. */
export async function buildPdfFromBlocks(
  blocks: PdfBlock[],
  opts: BlocksToPdfOptions,
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.setProducer("BuiltByUmer");
  if (opts.title) pdf.setTitle(opts.title);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);
  const boldMono = await pdf.embedFont(StandardFonts.CourierBold);
  const [pw, ph] = opts.pageSize === "letter" ? PAGE_SIZES.letter : PAGE_SIZES.a4;
  const margin = opts.marginPt;
  const maxW = Math.max(1, pw - margin * 2);
  const spacing = opts.lineSpacing ?? 1.35;
  let page = pdf.addPage([pw, ph]);
  let y = ph - margin;
  let drawnOnPage = false;

  const newPage = () => {
    page = pdf.addPage([pw, ph]);
    y = ph - margin;
    drawnOnPage = false;
  };

  for (const block of blocks) {
    if (block.kind === "image") {
      if (block.spaceBefore) y -= block.spaceBefore;
      const img = block.format === "jpg" ? await pdf.embedJpg(block.bytes) : await pdf.embedPng(block.bytes);
      const pageH = ph - margin * 2;
      const scale = Math.min(maxW / img.width, pageH / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      if (y - h < margin) newPage();
      page.drawImage(img, { x: (pw - w) / 2, y: y - h, width: w, height: h });
      y -= h + 10;
      drawnOnPage = true;
      continue;
    }

    const useMono = block.mono || opts.mono === true;
    const font = useMono ? (block.bold ? boldMono : mono) : block.bold ? bold : regular;
    const size = block.size;
    const lineH = size * spacing;
    if (block.spaceBefore) y -= block.spaceBefore;
    const indent = block.bullet ? size * 1.6 : 0;
    const wrapped = wrapText(sanitizeWinAnsi(block.text), font, size, maxW - indent);
    for (let i = 0; i < wrapped.length; i++) {
      if (y - lineH < margin) newPage();
      const prefix = block.bullet && i === 0 ? "-  " : "";
      const lineText = prefix + wrapped[i];
      if (lineText.trim().length > 0) {
        let x = margin + indent;
        if (block.align === "center") {
          x = Math.max(margin, (pw - font.widthOfTextAtSize(wrapped[i], size)) / 2);
        }
        page.drawText(lineText, { x, y: y - size, size, font });
        drawnOnPage = true;
      }
      y -= lineH;
    }
  }

  // Drop a trailing page if nothing was drawn on it.
  if (!drawnOnPage && pdf.getPageCount() > 1) pdf.removePage(pdf.getPageCount() - 1);
  return pdf.save({ useObjectStreams: true });
}

/**
 * Convert plain text with lightweight Markdown conventions (#, ##, ###,
 * "- " bullets) into styled blocks for buildPdfFromBlocks.
 */
export function textToBlocks(
  text: string,
  fontSize: number,
  markdown: boolean,
): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  const normalized = text.replace(/\r\n?/g, "\n");
  if (!markdown) {
    for (const line of normalized.split("\n")) {
      blocks.push({ text: line, size: fontSize });
    }
    if (blocks.length === 0) blocks.push({ text: "", size: fontSize });
    return blocks;
  }
  for (const rawLine of normalized.split("\n")) {
    const line = rawLine.replace(/\s+$/, "");
    if (/^######\s/.test(line)) {
      blocks.push({ text: line.replace(/^######\s+/, ""), size: fontSize * 1.08, bold: true, spaceBefore: 8 });
    } else if (/^#####\s/.test(line)) {
      blocks.push({ text: line.replace(/^#####\s+/, ""), size: fontSize * 1.15, bold: true, spaceBefore: 8 });
    } else if (/^####\s/.test(line)) {
      blocks.push({ text: line.replace(/^####\s+/, ""), size: fontSize * 1.22, bold: true, spaceBefore: 8 });
    } else if (/^###\s/.test(line)) {
      blocks.push({ text: line.replace(/^###\s+/, ""), size: fontSize * 1.3, bold: true, spaceBefore: 10 });
    } else if (/^##\s/.test(line)) {
      blocks.push({ text: line.replace(/^##\s+/, ""), size: fontSize * 1.45, bold: true, spaceBefore: 12 });
    } else if (/^#\s/.test(line)) {
      blocks.push({ text: line.replace(/^#\s+/, ""), size: fontSize * 1.7, bold: true, spaceBefore: 12 });
    } else if (/^\s*[-*+]\s+/.test(line)) {
      blocks.push({ text: line.replace(/^\s*[-*+]\s+/, ""), size: fontSize, bullet: true });
    } else {
      blocks.push({ text: line, size: fontSize });
    }
  }
  if (blocks.length === 0) blocks.push({ text: "", size: fontSize });
  return blocks;
}

/* ── DOCX (Word) HTML → blocks, for Word → PDF ──────────────── */

async function dataUriToImageBlock(dataUri: string, spaceBefore = 8): Promise<ImageBlock | null> {
  if (!/^data:image\//i.test(dataUri)) return null;
  try {
    const res = await fetch(dataUri);
    const buffer = await res.arrayBuffer();
    let bytes = new Uint8Array(buffer);
    let format: "jpg" | "png";
    if (/^data:image\/png/i.test(dataUri)) {
      format = "png";
    } else if (/^data:image\/jpe?g/i.test(dataUri)) {
      format = "jpg";
    } else {
      // GIF / BMP / WEBP: re-encode to PNG through a canvas.
      const bitmap = await createImageBitmap(new Blob([buffer]));
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Image re-encode failed."))), "image/png"),
      );
      bytes = new Uint8Array(await blob.arrayBuffer());
      format = "png";
    }
    return { kind: "image", bytes, format, spaceBefore };
  } catch {
    return null;
  }
}

/**
 * Flatten the HTML mammoth produces from a .docx into layout blocks.
 * Headings, paragraphs, lists and images are kept; fine-grained styling
 * (fonts, colours, columns, table layout) is intentionally simplified.
 */
export async function blocksFromDocxHtml(html: string, baseSize: number): Promise<PdfBlock[]> {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const blocks: PdfBlock[] = [];
  const headingSizes = [
    baseSize * 1.8,
    baseSize * 1.5,
    baseSize * 1.3,
    baseSize * 1.15,
    baseSize * 1.05,
    baseSize,
  ];

  const handleImage = async (img: HTMLImageElement) => {
    const block = await dataUriToImageBlock(img.getAttribute("src") ?? "");
    if (block) blocks.push(block);
  };

  const pushText = (text: string) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean) blocks.push({ text: clean, size: baseSize });
  };

  for (const el of Array.from(dom.body.children)) {
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag[1]) - 1;
      const text = (el.textContent ?? "").trim();
      if (text) blocks.push({ text, size: headingSizes[level], bold: true, spaceBefore: 12 });
    } else if (tag === "ul" || tag === "ol") {
      const ordered = tag === "ol";
      let n = 1;
      for (const li of Array.from(el.children)) {
        if (li.tagName.toLowerCase() !== "li") continue;
        const text = (li.textContent ?? "").trim();
        if (!text) continue;
        if (ordered) blocks.push({ text: `${n}. ${text}`, size: baseSize });
        else blocks.push({ text, size: baseSize, bullet: true });
        n += 1;
      }
      blocks.push({ text: "", size: baseSize });
    } else if (tag === "p") {
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          pushText(child.textContent ?? "");
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const childEl = child as Element;
          if (childEl.tagName.toLowerCase() === "img") {
            await handleImage(childEl as HTMLImageElement);
          } else {
            pushText(childEl.textContent ?? "");
          }
        }
      }
      blocks.push({ text: "", size: baseSize });
    } else if (tag === "table") {
      for (const tr of Array.from(el.querySelectorAll("tr"))) {
        const cells = Array.from(tr.children).map((cell) => (cell.textContent ?? "").trim());
        const text = cells.filter(Boolean).join("   |   ");
        if (text) blocks.push({ text, size: baseSize, mono: true });
      }
      blocks.push({ text: "", size: baseSize });
    } else if (tag === "img") {
      await handleImage(el as HTMLImageElement);
    } else if (tag === "br") {
      blocks.push({ text: "", size: baseSize });
    } else {
      pushText(el.textContent ?? "");
    }
  }
  if (blocks.length === 0) blocks.push({ text: "(empty document)", size: baseSize });
  return blocks;
}
