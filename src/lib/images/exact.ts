/**
 * Exact-size image compression: binary-searches the JPEG/WEBP quality via
 * browser-image-compression until the encoded size fits the target; if the
 * target still cannot be reached at minimum quality, progressively downscales
 * the resolution and searches again. Runs with `useWebWorker: false` so no
 * script is fetched from any CDN — everything stays local.
 */

import {
  canvasToBlob,
  closeDecoded,
  decodeImageBlob,
  drawToCanvas,
  imageSize,
} from "./canvas";

export type LossyFormat = "image/jpeg" | "image/webp";

export interface ExactCompressResult {
  blob: Blob;
  /** Quality of the returned encode, 0–1. */
  quality: number;
  /** Resolution scale relative to the original, 0–1. */
  scale: number;
  /** True when the result is at or under the target size. */
  hit: boolean;
  passes: number;
}

type ImageCompressionFn = typeof import("browser-image-compression")["default"];

interface Candidate {
  blob: Blob;
  quality: number;
  scale: number;
}

const MAX_ROUNDS = 6;
const SEARCH_ITERATIONS = 8;

async function encodeAt(
  compress: ImageCompressionFn,
  file: File,
  quality: number,
  format: LossyFormat,
): Promise<File> {
  return compress(file, {
    useWebWorker: false,
    initialQuality: quality,
    fileType: format,
  });
}

export async function compressToTargetBytes(
  file: File,
  targetBytes: number,
  format: LossyFormat,
  onStatus?: (message: string) => void,
): Promise<ExactCompressResult> {
  const compress = (await import("browser-image-compression")).default;
  const natural = await decodeImageBlob(file);
  const dims = imageSize(natural);
  closeDecoded(natural);

  let scale = 1;
  let bestUnder: { blob: Blob; quality: number; scale: number } | null = null;
  let bestOver: { blob: Blob; quality: number; scale: number; size: number } | null = null;
  let passes = 0;

  for (let round = 0; round < MAX_ROUNDS && !bestUnder; round++) {
    let workFile = file;
    if (scale < 1) {
      onStatus?.(`Downscaling to ${Math.round(scale * 100)}% of the original resolution…`);
      const img = await decodeImageBlob(file);
      const w = Math.max(16, Math.round(dims.width * scale));
      const h = Math.max(16, Math.round(dims.height * scale));
      const canvas = drawToCanvas(img, w, h);
      closeDecoded(img);
      const scaledBlob = await canvasToBlob(canvas, format, 0.95);
      workFile = new File([scaledBlob], file.name, { type: format });
    }

    let lo = 0.03;
    let hi = 0.95;
    for (let iter = 0; iter < SEARCH_ITERATIONS && lo <= hi; iter++) {
      const q = lo + (hi - lo) / 2;
      passes++;
      onStatus?.(
        `Pass ${passes}: encoding at ${Math.round(q * 100)}% quality` +
          (scale < 1 ? ` · ${Math.round(scale * 100)}% resolution` : "") +
          "…",
      );
      const out = await encodeAt(compress, workFile, q, format);
      if (out.size <= targetBytes) {
        if (!bestUnder || out.size > bestUnder.blob.size) {
          bestUnder = { blob: out, quality: q, scale };
        }
        lo = q + 0.02; // try to push quality higher while still fitting
      } else {
        if (!bestOver || out.size < bestOver.size) {
          bestOver = { blob: out, quality: q, scale, size: out.size };
        }
        hi = q - 0.02;
      }
    }

    if (!bestUnder && bestOver) {
      scale *= Math.max(0.35, Math.min(0.9, Math.sqrt(targetBytes / bestOver.size)));
    }
  }

  // Type assertions reset control-flow narrowing, which TS loses across nested loops.
  const under = bestUnder as Candidate | null;
  if (under) {
    return {
      blob: under.blob,
      quality: under.quality,
      scale: under.scale,
      hit: true,
      passes,
    };
  }
  const over = bestOver as (Candidate & { size: number }) | null;
  if (over) {
    return {
      blob: over.blob,
      quality: over.quality,
      scale: over.scale,
      hit: false,
      passes,
    };
  }
  // Degenerate fallback: a single minimum-quality encode.
  const out = await encodeAt(compress, file, 0.03, format);
  return { blob: out, quality: 0.03, scale: 1, hit: out.size <= targetBytes, passes: passes + 1 };
}
