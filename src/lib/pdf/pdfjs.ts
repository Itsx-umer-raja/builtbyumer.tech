"use client";

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

type PdfJsModule = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJsModule> | null = null;

/**
 * Lazily load pdf.js in the browser and point it at a locally bundled worker.
 * Nothing is ever uploaded — all parsing and rendering happens on-device.
 */
export async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
      } catch {
        // Fallback: static copy served from public/.
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      }
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/** Open an in-memory PDF. Pass a fresh Uint8Array; pdf.js takes ownership. */
export async function openPdf(data: Uint8Array): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfJs();
  // pdf.js transfers the buffer to its worker, so hand it a copy.
  return pdfjs.getDocument({ data: data.slice() }).promise;
}

/** Render one PDF page onto a detached canvas at the given scale. */
export async function renderPageToCanvas(
  page: PDFPageProxy,
  scale: number,
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  await page.render({ canvas, viewport }).promise;
  return canvas;
}

/** Render a page of an in-memory PDF straight to a PNG data URL (for previews). */
export async function renderPdfPageToDataUrl(
  bytes: Uint8Array,
  pageNumber: number,
  scale = 1,
): Promise<string> {
  const pdf = await openPdf(bytes);
  const page = await pdf.getPage(Math.min(Math.max(1, pageNumber), pdf.numPages));
  const canvas = await renderPageToCanvas(page, scale);
  return canvas.toDataURL("image/png");
}

/** canvas.toBlob as a promise. */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/jpeg",
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not export canvas."))),
      type,
      quality,
    );
  });
}

/** Extract the text layer of every page, joining items into lines. */
export async function extractPdfPageTexts(
  pdf: PDFDocumentProxy,
  onProgress?: (page: number, total: number) => void,
): Promise<string[]> {
  const texts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(i, pdf.numPages);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      text += item.str;
      if (item.hasEOL) text += "\n";
    }
    texts.push(text.replace(/[ \t]+\n/g, "\n").trimEnd());
  }
  return texts;
}

/** Render thumbnails (PNG data URLs) of every page of an open PDF. */
export async function renderPdfThumbnails(
  pdf: PDFDocumentProxy,
  targetWidth = 140,
  onProgress?: (page: number, total: number) => void,
): Promise<{ dataUrl: string; width: number; height: number }[]> {
  const thumbs: { dataUrl: string; width: number; height: number }[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(i, pdf.numPages);
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = targetWidth / base.width;
    const canvas = await renderPageToCanvas(page, scale);
    thumbs.push({ dataUrl: canvas.toDataURL("image/png"), width: base.width, height: base.height });
  }
  return thumbs;
}
