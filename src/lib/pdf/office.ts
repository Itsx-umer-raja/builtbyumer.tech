"use client";

import type { DecodedImage } from "./pdfbuild";

/* ── DOCX (Word) builders ───────────────────────────────────── */

type DocxModule = typeof import("docx");

/**
 * Build a .docx whose body is the extracted text of each PDF page as
 * flowing paragraphs (one page break between pages). This is NOT a
 * pixel-perfect conversion — layout, fonts and images are not preserved.
 */
export async function buildDocxFromText(pages: string[], title?: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, PageBreak } = (await import("docx")) as DocxModule;
  const paragraphs: import("docx").Paragraph[] = [];
  pages.forEach((pageText, pageIndex) => {
    if (pageIndex > 0) paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
    const lines = pageText.split("\n");
    if (lines.every((l) => l.trim().length === 0)) {
      paragraphs.push(new Paragraph({ children: [new TextRun("")] }));
      return;
    }
    for (const line of lines) {
      paragraphs.push(new Paragraph({ children: [new TextRun(line)] }));
    }
  });
  const doc = new Document({
    ...(title ? { title } : {}),
    sections: [{ children: paragraphs }],
  });
  return Packer.toBlob(doc);
}

/**
 * Build a .docx containing the given images, scaled to fit the printable
 * page width (~6.2 in). Optionally one image per page.
 */
export async function buildDocxFromImages(images: DecodedImage[], onePerPage: boolean): Promise<Blob> {
  const { Document, Packer, Paragraph, ImageRun, PageBreak } = (await import("docx")) as DocxModule;
  const children: import("docx").Paragraph[] = [];
  const maxPx = 620; // ≈ 6.2 in at 96 dpi, the usable width of a Letter/A4 page.
  images.forEach((img, index) => {
    if (onePerPage && index > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
    const scale = Math.min(maxPx / img.width, 1);
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            type: img.kind,
            data: img.bytes,
            transformation: {
              width: Math.max(1, Math.round(img.width * scale)),
              height: Math.max(1, Math.round(img.height * scale)),
            },
          }),
        ],
      }),
    );
  });
  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}

/* ── XLSX builder ───────────────────────────────────────────── */

/** Build a one-sheet .xlsx workbook from an array of arrays. */
export async function buildXlsxFromAoa(
  rows: (string | number)[][],
  sheetName = "Extracted",
): Promise<Blob> {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31) || "Sheet1");
  const out = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/* ── PPTX builder ───────────────────────────────────────────── */

export interface PptxSlideImage {
  /** "image/jpeg;base64,…" payload for pptxgenjs `data`. */
  data: string;
  width: number;
  height: number;
}

/**
 * Build a 16:9 .pptx deck where every slide is one full-bleed image.
 * Slides are pictures — the underlying text is not editable in PowerPoint.
 */
export async function buildPptxFromImages(slides: PptxSlideImage[]): Promise<Blob> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "BuiltByUmer";
  const SLIDE_W = 10;
  const SLIDE_H = 5.625;
  for (const slide of slides) {
    const s = pptx.addSlide();
    const scale = Math.min(SLIDE_W / slide.width, SLIDE_H / slide.height);
    const w = slide.width * scale;
    const h = slide.height * scale;
    s.addImage({
      data: slide.data,
      x: (SLIDE_W - w) / 2,
      y: (SLIDE_H - h) / 2,
      w,
      h,
    });
  }
  const out = await pptx.write({ outputType: "blob" });
  if (!(out instanceof Blob)) throw new Error("Unexpected PowerPoint output format.");
  return out;
}

/* ── Misc ───────────────────────────────────────────────────── */

/** Base64-encode bytes (chunked so huge pages do not blow the call stack). */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
