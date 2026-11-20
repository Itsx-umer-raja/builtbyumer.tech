/**
 * Shared helpers for decoding QR codes and barcodes from user-supplied
 * images. Everything happens locally in the browser — no network calls.
 */

/** Max dimension we keep when sampling an uploaded image (keeps decoding fast). */
const MAX_SAMPLE_DIM = 1800;

/** Load an image file (or clipboard blob) into an HTMLImageElement. */
export function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image file."));
    };
    img.src = url;
  });
}

/**
 * Draw an image (or video frame) into a fresh offscreen canvas, downscaling
 * if it is huge, and return the pixel data for a decoder.
 */
export function getImageData(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  maxDim = MAX_SAMPLE_DIM,
): ImageData | null {
  const srcW =
    source instanceof HTMLVideoElement
      ? source.videoWidth
      : source instanceof HTMLCanvasElement
        ? source.width
        : source.naturalWidth;
  const srcH =
    source instanceof HTMLVideoElement
      ? source.videoHeight
      : source instanceof HTMLCanvasElement
        ? source.height
        : source.naturalHeight;
  if (!srcW || !srcH) return null;

  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/**
 * Extract a File (image) from a clipboard DataTransfer, if present.
 */
export function imageFileFromClipboard(dt: DataTransfer | null): File | null {
  if (!dt) return null;
  const items = Array.from(dt.items ?? []);
  for (const item of items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const f = item.getAsFile();
      if (f) return f;
    }
  }
  if (dt.files && dt.files.length > 0) {
    const f = Array.from(dt.files).find((x) => x.type.startsWith("image/"));
    if (f) return f;
  }
  return null;
}
