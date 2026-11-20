/**
 * Shared canvas engine for the image tools batch.
 * Every operation runs entirely in the browser — no network, no uploads.
 */

export type ImageFormat = "image/png" | "image/jpeg" | "image/webp";

export type DecodedImage = ImageBitmap | HTMLImageElement;

export const FORMAT_EXT: Record<ImageFormat, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function formatLabel(format: ImageFormat): string {
  return format === "image/png" ? "PNG" : format === "image/jpeg" ? "JPG" : "WEBP";
}

export function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
};

/* ── Decoding ───────────────────────────────────────────────── */

/**
 * Decode a blob into something drawable. `createImageBitmap` is tried first;
 * some inputs (notably SVG without intrinsic dimensions) fail there, so an
 * <img> fallback keeps those working. The fallback blob URL is revoked once
 * the image has been decoded into memory.
 */
export async function decodeImageBlob(blob: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob);
    } catch {
      // fall through to the <img> path
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function imageSize(img: DecodedImage): { width: number; height: number } {
  if (typeof HTMLImageElement !== "undefined" && img instanceof HTMLImageElement) {
    return { width: img.naturalWidth, height: img.naturalHeight };
  }
  return { width: img.width, height: img.height };
}

export function closeDecoded(img: DecodedImage | null): void {
  if (img && typeof ImageBitmap !== "undefined" && img instanceof ImageBitmap) {
    img.close();
  }
}

/* ── Drawing & encoding ─────────────────────────────────────── */

export function drawToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is unavailable in this browser.");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function drawRegionToCanvas(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(dw));
  canvas.height = Math.max(1, Math.round(dh));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is unavailable in this browser.");
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Paint a solid colour underneath whatever is already on the canvas. */
export function fillBehind(canvas: HTMLCanvasElement, color: string): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Your browser could not encode this image."));
          return;
        }
        // Browsers silently fall back to PNG for unsupported targets — detect it.
        if (format !== "image/png" && blob.type !== format) {
          reject(
            new Error(
              `Your browser cannot encode ${formatLabel(format)} images. Try PNG or JPG output instead.`,
            ),
          );
          return;
        }
        resolve(blob);
      },
      format,
      quality,
    );
  });
}

/* ── ICO container (favicon generator) ──────────────────────── */

/** Build a real .ico file by embedding PNG frames for each size. */
export async function buildIco(source: CanvasImageSource, sizes: number[]): Promise<Blob> {
  const entries: { size: number; bytes: Uint8Array }[] = [];
  for (const size of sizes) {
    const canvas = drawToCanvas(source, size, size);
    const blob = await canvasToBlob(canvas, "image/png");
    entries.push({ size, bytes: new Uint8Array(await blob.arrayBuffer()) });
  }
  const headerSize = 6 + 16 * entries.length;
  const totalSize = headerSize + entries.reduce((n, e) => n + e.bytes.length, 0);
  const out = new Uint8Array(totalSize);
  const dv = new DataView(out.buffer);
  dv.setUint16(0, 0, true); // reserved
  dv.setUint16(2, 1, true); // type: icon
  dv.setUint16(4, entries.length, true);
  let offset = headerSize;
  entries.forEach((entry, i) => {
    const base = 6 + i * 16;
    const byte = entry.size >= 256 ? 0 : entry.size;
    dv.setUint8(base, byte);
    dv.setUint8(base + 1, byte);
    dv.setUint8(base + 2, 0); // palette colours
    dv.setUint8(base + 3, 0); // reserved
    dv.setUint16(base + 4, 1, true); // colour planes
    dv.setUint16(base + 6, 32, true); // bits per pixel
    dv.setUint32(base + 8, entry.bytes.length, true);
    dv.setUint32(base + 12, offset, true);
    out.set(entry.bytes, offset);
    offset += entry.bytes.length;
  });
  return new Blob([out.buffer as ArrayBuffer], { type: "image/x-icon" });
}

/* ── Colours ────────────────────────────────────────────────── */

export function rgbaToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

/* ── Base64 ─────────────────────────────────────────────────── */

export function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsDataURL(blob);
  });
}

function sniffImageType(bytes: Uint8Array): { mime: string; ext: string } | null {
  const b = (i: number) => bytes[i];
  if (
    bytes.length >= 8 &&
    b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (bytes.length >= 3 && b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (bytes.length >= 6 && b(0) === 0x47 && b(1) === 0x49 && b(2) === 0x46) {
    return { mime: "image/gif", ext: "gif" };
  }
  if (
    bytes.length >= 12 &&
    b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 &&
    b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  if (bytes.length >= 2 && b(0) === 0x42 && b(1) === 0x4d) {
    return { mime: "image/bmp", ext: "bmp" };
  }
  return null;
}

export interface ParsedBase64 {
  blob: Blob;
  mime: string;
  ext: string;
}

/** Decode a Base64 string (raw, or a data URI with or without a MIME prefix). */
export function parseBase64Image(input: string): ParsedBase64 {
  const trimmed = input.trim().replace(/\s+/g, "");
  if (!trimmed) throw new Error("Paste some Base64 data first.");
  let mime = "image/png";
  let b64 = trimmed;
  const dataUri = /^data:([^;,]+)?(;base64)?,/i.exec(trimmed);
  if (dataUri) {
    if (dataUri[1]) mime = dataUri[1].toLowerCase();
    b64 = trimmed.slice(dataUri[0].length);
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) {
    throw new Error(
      "That does not look like valid Base64 — only A–Z, a–z, 0–9, +, / and = padding are allowed.",
    );
  }
  let bytes: Uint8Array;
  try {
    const bin = atob(b64);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } catch {
    throw new Error("The Base64 payload could not be decoded — it appears to be malformed.");
  }
  const sniffed = sniffImageType(bytes);
  const finalMime = sniffed ? sniffed.mime : mime;
  if (!finalMime.startsWith("image/") && !sniffed) {
    throw new Error(`The decoded data is "${finalMime}", not an image.`);
  }
  const ext = sniffed ? sniffed.ext : EXT_BY_MIME[finalMime] ?? "png";
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: finalMime });
  return { blob, mime: finalMime, ext };
}
