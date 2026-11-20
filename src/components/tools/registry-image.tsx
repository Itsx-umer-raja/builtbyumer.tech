"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { ToolComponent } from "./registry";
import {
  BusyNote,
  CopyButton,
  DownloadButton,
  ErrorNote,
  Field,
  FileDrop,
  PrimaryButton,
  ResetButton,
  SecondaryButton,
  inputCls,
} from "./ui";
import { clamp, cn, downloadBlob, downloadText, formatBytes } from "@/lib/utils";
import {
  buildIco,
  canvasToBlob,
  closeDecoded,
  decodeImageBlob,
  drawRegionToCanvas,
  drawToCanvas,
  errText,
  fillBehind,
  FORMAT_EXT,
  formatLabel,
  imageSize,
  parseBase64Image,
  readAsDataUrl,
  rgbToHsl,
  rgbaToHex,
  stripExt,
  type DecodedImage,
  type ImageFormat,
} from "@/lib/images/canvas";
import { compressToTargetBytes, type LossyFormat } from "@/lib/images/exact";
import { parseImageMetadata, type ImageMetadata } from "@/lib/images/metadata";

/* ── Shared helpers ─────────────────────────────────────────── */

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.bmp";

function BehaviorNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-4 py-3 text-xs leading-relaxed text-muted">
      {children}
    </p>
  );
}

function FileMeta({ file }: { file: File }) {
  return (
    <p className="text-xs text-muted">
      {file.name} · {formatBytes(file.size)}
    </p>
  );
}

interface ResultInfo {
  blob: Blob;
  filename: string;
}

/** Object URL for a blob, revoked automatically on change/unmount. */
function usePreviewUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs the external object-URL lifecycle
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

function ResultPanel({
  result,
  originalSize,
  extraNote,
  onReset,
}: {
  result: ResultInfo;
  originalSize: number;
  extraNote?: string;
  onReset: () => void;
}) {
  const url = usePreviewUrl(result.blob);
  const saved = originalSize > 0 ? Math.round((1 - result.blob.size / originalSize) * 100) : 0;
  return (
    <div className="space-y-3">
      {url && (
        <div className="rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-4">
          <img src={url} alt="Result preview" className="mx-auto max-h-80 w-auto max-w-full rounded" />
        </div>
      )}
      <p className="text-sm text-muted">
        {formatBytes(originalSize)} →{" "}
        <span className="font-semibold text-cream">{formatBytes(result.blob.size)}</span>
        {saved !== 0 && (saved > 0 ? ` (${saved}% smaller)` : ` (${-saved}% larger)`)}
        {" · "}
        {result.filename}
      </p>
      {extraNote && <p className="text-xs text-muted">{extraNote}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <DownloadButton onClick={() => downloadBlob(result.blob, result.filename)} />
        <ResetButton onClick={onReset} />
      </div>
    </div>
  );
}

function SourcePreview({ file, maxHeightClass = "max-h-72" }: { file: File; maxHeightClass?: string }) {
  const url = usePreviewUrl(file);
  if (!url) return null;
  return (
    <div className="rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-3">
      <img src={url} alt="Source preview" className={cn("mx-auto w-auto max-w-full rounded", maxHeightClass)} />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </Field>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function QualitySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Field label={`Quality — ${Math.round(value * 100)}%`}>
      <input
        type="range"
        min={5}
        max={100}
        step={1}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full accent-lime"
      />
    </Field>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-cream">
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

const FORMAT_OPTIONS = (withAuto: boolean) => [
  ...(withAuto ? [{ value: "auto", label: "Keep original format" }] : []),
  { value: "image/png", label: "PNG" },
  { value: "image/jpeg", label: "JPG" },
  { value: "image/webp", label: "WEBP" },
];

function resolveFormat(selected: string, file: File): ImageFormat {
  if (selected !== "auto") return selected as ImageFormat;
  if (file.type === "image/png") return "image/png";
  if (file.type === "image/webp") return "image/webp";
  return "image/jpeg";
}

/* ══════════════════════════════════════════════════════════════
 * 1. Image Compressor
 * ══════════════════════════════════════════════════════════════ */

function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.75);
  const [format, setFormat] = useState("auto");
  const [maxDim, setMaxDim] = useState("");
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setBusy(false);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const img = await decodeImageBlob(file);
      const dims = imageSize(img);
      const cap = Number(maxDim) > 0 ? Number(maxDim) : 0;
      let w = dims.width;
      let h = dims.height;
      if (cap > 0 && Math.max(dims.width, dims.height) > cap) {
        const k = cap / Math.max(dims.width, dims.height);
        w = Math.max(1, Math.round(dims.width * k));
        h = Math.max(1, Math.round(dims.height * k));
      }
      const target = resolveFormat(format, file);
      const canvas = drawToCanvas(img, w, h);
      closeDecoded(img);
      const blob = await canvasToBlob(canvas, target, target === "image/png" ? undefined : quality);
      setResult({
        blob,
        filename: `${stripExt(file.name)}-compressed.${FORMAT_EXT[target]}`,
      });
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept={IMAGE_ACCEPT} onFiles={(fs) => setFile(fs[0])} label="Drop an image to compress" hint="Accepted: jpg, jpeg, png, webp, gif, bmp" />
      )}
      {file && (
        <>
          <FileMeta file={file} />
          <SourcePreview file={file} />
          <div className="grid gap-4 sm:grid-cols-3">
            <QualitySlider value={quality} onChange={setQuality} />
            <SelectField
              label="Output format"
              value={format}
              onChange={setFormat}
              options={FORMAT_OPTIONS(true)}
            />
            <NumberField
              label="Max dimension (px, optional)"
              value={maxDim}
              onChange={setMaxDim}
              min={16}
              max={12000}
              placeholder="e.g. 1920"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={run} disabled={busy}>
              Compress
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          {busy && <BusyNote>Re-encoding the image…</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && (
            <ResultPanel result={result} originalSize={file.size} onReset={reset} />
          )}
          <BehaviorNote>
            Everything happens on your device with the Canvas API. The quality slider only affects
            lossy formats (JPG / WEBP); PNG is re-encoded losslessly, so if your source is PNG the
            savings come from any downscaling you request — pick JPG or WEBP output for big wins.
          </BehaviorNote>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * 2–5. Compress to exact size (20 / 50 / 100 / 200 KB)
 * ══════════════════════════════════════════════════════════════ */

function ExactSizeCompressor({ targetBytes, label }: { targetBytes: number; label: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<LossyFormat>("image/jpeg");
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setDetail("");
    setStatus("");
    setError(null);
    setBusy(false);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setDetail("");
    try {
      if (file.size <= targetBytes) {
        setResult({ blob: file, filename: file.name });
        setDetail(
          `Your file is already ${formatBytes(file.size)} — under the ${label} target, so it was delivered unchanged with no re-encoding.`,
        );
        return;
      }
      const res = await compressToTargetBytes(file, targetBytes, format, setStatus);
      setResult({
        blob: res.blob,
        filename: `${stripExt(file.name)}-${label.replace(/\s+/g, "").toLowerCase()}.${FORMAT_EXT[format]}`,
      });
      if (res.hit) {
        setDetail(
          `Target reached in ${res.passes} automated passes — final quality ${Math.round(res.quality * 100)}%` +
            (res.scale < 1 ? `, resolution reduced to ${Math.round(res.scale * 100)}% of the original` : "") +
            ".",
        );
      } else {
        setDetail(
          `Closest achievable result: ${formatBytes(res.blob.size)} — still ${formatBytes(
            res.blob.size - targetBytes,
          )} above the ${label} target even after minimum quality and resolution reduction. Try a slightly larger target or a smaller source image.`,
        );
      }
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept={IMAGE_ACCEPT} onFiles={(fs) => setFile(fs[0])} label={`Drop an image to squeeze under ${label}`} hint="Accepted: jpg, jpeg, png, webp, gif, bmp" />
      )}
      {file && (
        <>
          <FileMeta file={file} />
          <SourcePreview file={file} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Output format"
              value={format}
              onChange={(v) => setFormat(v as LossyFormat)}
              options={[
                { value: "image/jpeg", label: "JPG (best size control)" },
                { value: "image/webp", label: "WEBP" },
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={run} disabled={busy}>
              Compress to {label}
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          {busy && <BusyNote>{status || "Working…"} This runs several passes and can take a moment for large images.</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && (
            <ResultPanel result={result} originalSize={file.size} extraNote={detail} onReset={reset} />
          )}
          <BehaviorNote>
            A binary search over encoding quality (and, if needed, resolution) runs entirely on your
            device using browser-image-compression with the Canvas API. Your file is never uploaded.
          </BehaviorNote>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * 6. Image Resizer
 * ══════════════════════════════════════════════════════════════ */

function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<DecodedImage | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const [mode, setMode] = useState<"exact" | "percent">("exact");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [percent, setPercent] = useState("50");
  const [lock, setLock] = useState(true);
  const [format, setFormat] = useState("auto");
  const [quality, setQuality] = useState(0.9);
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    closeDecoded(img);
    setImg(null);
    setDims(null);
    setFile(null);
    setResult(null);
    setError(null);
    setBusy(false);
  };

  const pick = async (f: File) => {
    reset();
    setFile(f);
    try {
      const decoded = await decodeImageBlob(f);
      const d = imageSize(decoded);
      setImg(decoded);
      setDims(d);
      setWidth(String(d.width));
      setHeight(String(d.height));
    } catch (e) {
      setFile(null);
      setError(errText(e));
    }
  };

  const setWidthLive = (v: string) => {
    setWidth(v);
    if (lock && dims && Number(v) > 0) {
      setHeight(String(Math.max(1, Math.round((Number(v) * dims.height) / dims.width))));
    }
  };

  const setHeightLive = (v: string) => {
    setHeight(v);
    if (lock && dims && Number(v) > 0) {
      setWidth(String(Math.max(1, Math.round((Number(v) * dims.width) / dims.height))));
    }
  };

  const run = async () => {
    if (!img || !dims || !file) return;
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      let w: number;
      let h: number;
      if (mode === "percent") {
        const p = clamp(Number(percent) || 0, 1, 500);
        w = Math.max(1, Math.round((dims.width * p) / 100));
        h = Math.max(1, Math.round((dims.height * p) / 100));
      } else {
        w = Math.round(Number(width));
        h = Math.round(Number(height));
        if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1 || w > 20000 || h > 20000) {
          throw new Error("Enter width and height between 1 and 20,000 pixels.");
        }
      }
      const target = resolveFormat(format, file);
      const canvas = drawToCanvas(img, w, h);
      const blob = await canvasToBlob(canvas, target, target === "image/png" ? undefined : quality);
      setResult({
        blob,
        filename: `${stripExt(file.name)}-${w}x${h}.${FORMAT_EXT[target]}`,
      });
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept={IMAGE_ACCEPT} onFiles={(fs) => pick(fs[0])} label="Drop an image to resize" hint="Accepted: jpg, jpeg, png, webp, gif, bmp" />
      )}
      {file && img && dims && (
        <>
          <FileMeta file={file} />
          <SourcePreview file={file} />
          <p className="text-sm text-muted">
            Original: {dims.width} × {dims.height} px
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              label="Resize mode"
              value={mode}
              onChange={(v) => setMode(v as "exact" | "percent")}
              options={[
                { value: "exact", label: "Exact pixels" },
                { value: "percent", label: "Percentage" },
              ]}
            />
            {mode === "exact" ? (
              <>
                <NumberField label="Width (px)" value={width} onChange={setWidthLive} min={1} max={20000} />
                <NumberField label="Height (px)" value={height} onChange={setHeightLive} min={1} max={20000} />
              </>
            ) : (
              <NumberField label="Scale (%)" value={percent} onChange={setPercent} min={1} max={500} />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {mode === "exact" && <Checkbox label="Lock aspect ratio" checked={lock} onChange={setLock} />}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Output format" value={format} onChange={setFormat} options={FORMAT_OPTIONS(true)} />
            <QualitySlider value={quality} onChange={setQuality} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={run} disabled={busy}>
              Resize
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          {busy && <BusyNote>Resizing…</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && <ResultPanel result={result} originalSize={file.size} onReset={reset} />}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * 7. Image Cropper
 * ══════════════════════════════════════════════════════════════ */

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type CropHandle = "move" | "nw" | "ne" | "sw" | "se";

interface CropDragState {
  mode: CropHandle;
  startX: number;
  startY: number;
  origin: CropRect;
}

const CROP_RATIOS: { key: string; label: string; value: number | null }[] = [
  { key: "free", label: "Free", value: null },
  { key: "1:1", label: "1:1", value: 1 },
  { key: "4:3", label: "4:3", value: 4 / 3 },
  { key: "3:4", label: "3:4", value: 3 / 4 },
  { key: "16:9", label: "16:9", value: 16 / 9 },
  { key: "9:16", label: "9:16", value: 9 / 16 },
  { key: "3:2", label: "3:2", value: 3 / 2 },
  { key: "2:3", label: "2:3", value: 2 / 3 },
];

const HANDLE_POS: Record<"nw" | "ne" | "sw" | "se", string> = {
  nw: "-left-1.5 -top-1.5 cursor-nwse-resize",
  ne: "-right-1.5 -top-1.5 cursor-nesw-resize",
  sw: "-left-1.5 -bottom-1.5 cursor-nesw-resize",
  se: "-right-1.5 -bottom-1.5 cursor-nwse-resize",
};

function ImageCropper() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<DecodedImage | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [aspect, setAspect] = useState("free");
  const [format, setFormat] = useState("image/png");
  const [quality, setQuality] = useState(0.9);
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<CropDragState | null>(null);
  const sourceUrl = usePreviewUrl(file);

  const reset = () => {
    closeDecoded(img);
    setImg(null);
    setDims(null);
    setCrop(null);
    setFile(null);
    setResult(null);
    setError(null);
    setBusy(false);
  };

  const pick = async (f: File) => {
    reset();
    setFile(f);
    try {
      const decoded = await decodeImageBlob(f);
      const d = imageSize(decoded);
      setImg(decoded);
      setDims(d);
      setCrop({ x: d.width * 0.1, y: d.height * 0.1, w: d.width * 0.8, h: d.height * 0.8 });
    } catch (e) {
      setFile(null);
      setError(errText(e));
    }
  };

  const setAspectKey = (key: string) => {
    setAspect(key);
    const value = CROP_RATIOS.find((r) => r.key === key)?.value ?? null;
    if (!value || !dims) return;
    let w = dims.width * 0.8;
    let h = w / value;
    if (h > dims.height * 0.8) {
      h = dims.height * 0.8;
      w = h * value;
    }
    setCrop({ x: (dims.width - w) / 2, y: (dims.height - h) / 2, w, h });
  };

  const toNatural = (clientX: number, clientY: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || !dims || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left) / rect.width) * dims.width,
      y: ((clientY - rect.top) / rect.height) * dims.height,
    };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!crop || !dims) return;
    const mode = (((e.target as HTMLElement).dataset.handle ?? "move") as CropHandle) || "move";
    const p = toNatural(e.clientX, e.clientY);
    dragRef.current = { mode, startX: p.x, startY: p.y, origin: { ...crop } };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !dims) return;
    const p = toNatural(e.clientX, e.clientY);
    const min = 16;
    const o = drag.origin;
    const right = o.x + o.w;
    const bottom = o.y + o.h;
    let x = o.x;
    let y = o.y;
    let w = o.w;
    let h = o.h;
    const dx = p.x - drag.startX;
    const dy = p.y - drag.startY;

    if (drag.mode === "move") {
      x = clamp(o.x + dx, 0, dims.width - o.w);
      y = clamp(o.y + dy, 0, dims.height - o.h);
    } else {
      if (drag.mode.includes("w")) {
        x = clamp(o.x + dx, 0, right - min);
        w = right - x;
      }
      if (drag.mode.includes("e")) {
        w = clamp(o.w + dx, min, dims.width - x);
      }
      if (drag.mode.includes("n")) {
        y = clamp(o.y + dy, 0, bottom - min);
        h = bottom - y;
      }
      if (drag.mode.includes("s")) {
        h = clamp(o.h + dy, min, dims.height - y);
      }
      const ar = CROP_RATIOS.find((r) => r.key === aspect)?.value ?? null;
      if (ar) {
        let nw = Math.max(min, w);
        let nh = nw / ar;
        if (nh > dims.height) {
          nh = dims.height;
          nw = nh * ar;
        }
        if (nw > dims.width) {
          nw = dims.width;
          nh = nw / ar;
        }
        w = nw;
        h = nh;
        if (drag.mode.includes("w")) x = right - w;
        if (drag.mode.includes("n")) y = bottom - h;
        x = clamp(x, 0, dims.width - w);
        y = clamp(y, 0, dims.height - h);
      }
    }
    setCrop({ x, y, w, h });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const apply = async () => {
    if (!img || !crop || !file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const w = Math.max(1, Math.round(crop.w));
      const h = Math.max(1, Math.round(crop.h));
      const target = format as ImageFormat;
      const canvas = drawRegionToCanvas(img, crop.x, crop.y, crop.w, crop.h, w, h);
      const blob = await canvasToBlob(canvas, target, target === "image/png" ? undefined : quality);
      setResult({ blob, filename: `${stripExt(file.name)}-cropped.${FORMAT_EXT[target]}` });
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept={IMAGE_ACCEPT} onFiles={(fs) => pick(fs[0])} label="Drop an image to crop" hint="Accepted: jpg, jpeg, png, webp, gif, bmp" />
      )}
      {file && img && dims && crop && (
        <>
          <FileMeta file={file} />
          <div className="flex justify-center">
            <div ref={frameRef} className="relative inline-block select-none" style={{ touchAction: "none" }}>
              <img src={sourceUrl ?? undefined} alt="Crop source" className="block max-h-96 max-w-full" draggable={false} />
              <div
                className="absolute inset-0 overflow-hidden"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <div
                  data-handle="move"
                  className="absolute cursor-move"
                  style={{
                    left: `${(crop.x / dims.width) * 100}%`,
                    top: `${(crop.y / dims.height) * 100}%`,
                    width: `${(crop.w / dims.width) * 100}%`,
                    height: `${(crop.h / dims.height) * 100}%`,
                    border: "1px solid rgba(255,255,255,0.85)",
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                  }}
                >
                  {(["nw", "ne", "sw", "se"] as const).map((h) => (
                    <div
                      key={h}
                      data-handle={h}
                      className={cn("absolute h-3 w-3 rounded-sm border border-white bg-lime", HANDLE_POS[h])}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted">
            Crop: {Math.round(crop.w)} × {Math.round(crop.h)} px at ({Math.round(crop.x)},{" "}
            {Math.round(crop.y)}) — drag inside to move, drag a corner to resize.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              label="Aspect ratio"
              value={aspect}
              onChange={setAspectKey}
              options={CROP_RATIOS.map((r) => ({ value: r.key, label: r.label }))}
            />
            <SelectField
              label="Output format"
              value={format}
              onChange={setFormat}
              options={FORMAT_OPTIONS(false)}
            />
            {format !== "image/png" && <QualitySlider value={quality} onChange={setQuality} />}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={apply} disabled={busy}>
              Crop &amp; download preview
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          {busy && <BusyNote>Cropping…</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && <ResultPanel result={result} originalSize={file.size} onReset={reset} />}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * 8–12. Format converters (JPG ⇄ PNG ⇄ WEBP)
 * ══════════════════════════════════════════════════════════════ */

interface ConvertConfig {
  target: ImageFormat;
  accept: string;
  expectedMime: string;
  expectedLabel: string;
  note: string;
  defaultQuality: number;
}

function ConvertTool({ config }: { config: ConvertConfig }) {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(config.defaultQuality);
  const [bg, setBg] = useState("#ffffff");
  const [mismatch, setMismatch] = useState<string | null>(null);
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setMismatch(null);
    setError(null);
    setBusy(false);
  };

  const pick = (fs: File[]) => {
    const f = fs[0];
    setFile(f);
    setResult(null);
    setError(null);
    setMismatch(
      f.type && f.type !== config.expectedMime
        ? `This file is ${f.type}, not ${config.expectedLabel} — it will still be converted to ${formatLabel(config.target)}.`
        : null,
    );
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const img = await decodeImageBlob(file);
      const dims = imageSize(img);
      const canvas = drawToCanvas(img, dims.width, dims.height);
      closeDecoded(img);
      if (config.target === "image/jpeg") {
        fillBehind(canvas, bg);
      }
      const blob = await canvasToBlob(
        canvas,
        config.target,
        config.target === "image/png" ? undefined : quality,
      );
      setResult({
        blob,
        filename: `${stripExt(file.name)}.${FORMAT_EXT[config.target]}`,
      });
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept={config.accept} onFiles={pick} label={`Drop a ${config.expectedLabel} image to convert`} hint={`Accepted: ${config.accept.replace(/\./g, "").split(",").join(", ")}`} />
      )}
      {file && (
        <>
          <FileMeta file={file} />
          {mismatch && <ErrorNote>{mismatch}</ErrorNote>}
          <SourcePreview file={file} />
          <div className="grid gap-4 sm:grid-cols-2">
            {config.target === "image/png" ? (
              <div />
            ) : (
              <QualitySlider value={quality} onChange={setQuality} />
            )}
            {config.target === "image/jpeg" && (
              <Field label="Background for transparent areas">
                <input
                  type="color"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  className="h-11 w-full cursor-pointer rounded-lg border border-[#121212]/15 bg-white p-1"
                />
              </Field>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={run} disabled={busy}>
              Convert to {formatLabel(config.target)}
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          {busy && <BusyNote>Converting…</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && <ResultPanel result={result} originalSize={file.size} onReset={reset} />}
          <BehaviorNote>{config.note}</BehaviorNote>
        </>
      )}
    </div>
  );
}

const JPG_TO_PNG: ConvertConfig = {
  target: "image/png",
  accept: ".jpg,.jpeg",
  expectedMime: "image/jpeg",
  expectedLabel: "JPG",
  defaultQuality: 0.9,
  note: "PNG is lossless, so the converted file keeps every pixel of the JPG exactly — it will usually be larger than the source. Transparency from the JPG is not applicable (JPG has no alpha channel).",
};

const PNG_TO_JPG: ConvertConfig = {
  target: "image/jpeg",
  accept: ".png",
  expectedMime: "image/png",
  expectedLabel: "PNG",
  defaultQuality: 0.9,
  note: "JPG has no transparency: any transparent areas of the PNG are flattened onto the background colour you pick (white by default).",
};

const WEBP_TO_JPG: ConvertConfig = {
  target: "image/jpeg",
  accept: ".webp",
  expectedMime: "image/webp",
  expectedLabel: "WEBP",
  defaultQuality: 0.9,
  note: "WEBP decodes fully in your browser; transparency is flattened onto the chosen background colour because JPG has no alpha channel.",
};

const JPG_TO_WEBP: ConvertConfig = {
  target: "image/webp",
  accept: ".jpg,.jpeg",
  expectedMime: "image/jpeg",
  expectedLabel: "JPG",
  defaultQuality: 0.8,
  note: "WEBP usually produces dramatically smaller files than JPG at the same visual quality. Try lowering the quality slider a little for extra savings.",
};

const PNG_TO_WEBP: ConvertConfig = {
  target: "image/webp",
  accept: ".png",
  expectedMime: "image/png",
  expectedLabel: "PNG",
  defaultQuality: 0.9,
  note: "WEBP keeps the alpha channel of your PNG intact while shrinking the download size.",
};

/* ══════════════════════════════════════════════════════════════
 * 13. Passport Photo Maker
 * ══════════════════════════════════════════════════════════════ */

const PASSPORT_SIZES = [
  { key: "35x45", label: "35 × 45 mm at 300 DPI (413 × 531 px)", w: 413, h: 531 },
  { key: "us2x2", label: "US 2 × 2 in at 300 DPI (600 × 600 px)", w: 600, h: 600 },
  { key: "px600", label: "600 × 600 px (digital upload)", w: 600, h: 600 },
];

function PassportPhotoMaker() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<DecodedImage | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const [sizeKey, setSizeKey] = useState("35x45");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [guides, setGuides] = useState(true);
  const [format, setFormat] = useState("image/jpeg");
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [sheet, setSheet] = useState<ResultInfo | null>(null);
  const [sheetNote, setSheetNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

  const size = PASSPORT_SIZES.find((s) => s.key === sizeKey) ?? PASSPORT_SIZES[0];
  const FRAME_W = 320;
  const frameH = FRAME_W * (size.h / size.w);

  const reset = () => {
    closeDecoded(img);
    setImg(null);
    setDims(null);
    setFile(null);
    setResult(null);
    setSheet(null);
    setSheetNote("");
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setError(null);
    setBusy(false);
  };

  const pick = async (f: File) => {
    reset();
    setFile(f);
    try {
      const decoded = await decodeImageBlob(f);
      const d = imageSize(decoded);
      setImg(decoded);
      setDims(d);
    } catch (e) {
      setFile(null);
      setError(errText(e));
    }
  };

  const changeSize = (key: string) => {
    setSizeKey(key);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const clampPan = (p: { x: number; y: number }, z: number, d: { width: number; height: number }) => {
    const cover = Math.max(FRAME_W / d.width, frameH / d.height);
    const maxX = Math.max(0, (d.width * cover * z - FRAME_W) / 2);
    const maxY = Math.max(0, (d.height * cover * z - frameH) / 2);
    return { x: clamp(p.x, -maxX, maxX), y: clamp(p.y, -maxY, maxY) };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !dims) return;
    setPan(
      clampPan(
        { x: drag.px + (e.clientX - drag.sx), y: drag.py + (e.clientY - drag.sy) },
        zoom,
        dims,
      ),
    );
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const apply = async () => {
    if (!img || !dims || !file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setSheet(null);
    setSheetNote("");
    try {
      const cover = Math.max(FRAME_W / dims.width, frameH / dims.height);
      const visScale = cover * zoom;
      const srcW = FRAME_W / visScale;
      const srcH = frameH / visScale;
      const cx = dims.width / 2 + pan.x / visScale;
      const cy = dims.height / 2 + pan.y / visScale;
      const sx = clamp(cx - srcW / 2, 0, dims.width - srcW);
      const sy = clamp(cy - srcH / 2, 0, dims.height - srcH);
      const canvas = drawRegionToCanvas(img, sx, sy, srcW, srcH, size.w, size.h);
      if (format === "image/jpeg") fillBehind(canvas, "#ffffff");

      const target = format as ImageFormat;
      const photoBlob = await canvasToBlob(canvas, target, target === "image/jpeg" ? 0.92 : undefined);
      setResult({
        blob: photoBlob,
        filename: `passport-photo-${size.key}.${FORMAT_EXT[target]}`,
      });

      // Print sheet: 10 × 15 cm at 300 DPI = 1181 × 1772 px, white background.
      const sheetCanvas = document.createElement("canvas");
      sheetCanvas.width = 1181;
      sheetCanvas.height = 1772;
      const ctx = sheetCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context is unavailable.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1181, 1772);
      const gap = 12;
      const cols = Math.max(1, Math.floor((1181 + gap) / (size.w + gap)));
      const rows = Math.max(1, Math.floor((1772 + gap) / (size.h + gap)));
      const count = Math.min(4, cols * rows);
      const gridRows = Math.ceil(count / cols);
      const gridW = cols * size.w + (cols - 1) * gap;
      const gridH = gridRows * size.h + (gridRows - 1) * gap;
      const ox = (1181 - gridW) / 2;
      const oy = (1772 - gridH) / 2;
      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        ctx.drawImage(canvas, ox + col * (size.w + gap), oy + row * (size.h + gap));
      }
      const sheetBlob = await canvasToBlob(sheetCanvas, "image/jpeg", 0.95);
      setSheet({ blob: sheetBlob, filename: `passport-print-sheet-${size.key}.jpg` });
      setSheetNote(
        `The 10 × 15 cm sheet fits ${count} photo${count === 1 ? "" : "s"} at this size (a ${cols} × ${gridRows} arrangement).`,
      );
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const sourceUrl = usePreviewUrl(file);

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept={IMAGE_ACCEPT} onFiles={(fs) => pick(fs[0])} label="Drop a portrait photo" hint="Accepted: jpg, jpeg, png, webp, gif, bmp" />
      )}
      {file && img && dims && (
        <>
          <FileMeta file={file} />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div
                  ref={frameRef}
                  className="relative cursor-move overflow-hidden bg-[#121212]/40"
                  style={{
                    width: FRAME_W,
                    height: frameH,
                    touchAction: "none",
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <img
                    src={sourceUrl ?? ""}
                    alt="Passport photo source"
                    draggable={false}
                    className="absolute left-1/2 top-1/2 max-w-none"
                    style={{
                      width: dims.width * Math.max(FRAME_W / dims.width, frameH / dims.height) * zoom,
                      height: dims.height * Math.max(FRAME_W / dims.width, frameH / dims.height) * zoom,
                      transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px)`,
                    }}
                  />
                  {guides && (
                    <svg
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <ellipse
                        cx="50"
                        cy="40"
                        rx="26"
                        ry="30"
                        fill="none"
                        stroke="rgba(255,255,255,0.75)"
                        strokeWidth="0.8"
                        strokeDasharray="3 2"
                      />
                      <line
                        x1="8"
                        y1="42"
                        x2="92"
                        y2="42"
                        stroke="rgba(255,255,255,0.75)"
                        strokeWidth="0.8"
                        strokeDasharray="3 2"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-center text-xs text-muted">
                Drag to position the face inside the frame; zoom to fit. Guides: head in the oval,
                eyes on the line.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Photo size"
                  value={sizeKey}
                  onChange={changeSize}
                  options={PASSPORT_SIZES.map((s) => ({ value: s.key, label: s.label }))}
                />
                <Field label={`Zoom — ${zoom.toFixed(2)}×`}>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => {
                      const z = Number(e.target.value);
                      setZoom(z);
                      if (dims) setPan((p) => clampPan(p, z, dims));
                    }}
                    className="w-full accent-lime"
                  />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <Checkbox label="Show guides" checked={guides} onChange={setGuides} />
              </div>
              <SelectField
                label="Photo output format"
                value={format}
                onChange={setFormat}
                options={[
                  { value: "image/jpeg", label: "JPG" },
                  { value: "image/png", label: "PNG" },
                ]}
              />
              <div className="flex flex-wrap items-center gap-3">
                <PrimaryButton onClick={apply} disabled={busy}>
                  Generate photo &amp; print sheet
                </PrimaryButton>
                <ResetButton onClick={reset} />
              </div>
            </div>
            <div className="space-y-4">
              {busy && <BusyNote>Rendering the photo and print sheet…</BusyNote>}
              {error && <ErrorNote>{error}</ErrorNote>}
              {result && (
                <ResultPanel result={result} originalSize={file.size} onReset={reset} />
              )}
              {sheet && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-cream">Print sheet (10 × 15 cm, 300 DPI)</p>
                  <p className="text-xs text-muted">{sheetNote}</p>
                  <DownloadButton onClick={() => downloadBlob(sheet.blob, sheet.filename)} label="Download print sheet" />
                </div>
              )}
            </div>
          </div>
          <BehaviorNote>
            Output sizes are computed at 300 DPI (35 × 45 mm → 413 × 531 px). The guide overlay is an
            approximate aid, not an official guarantee — always check the exact requirements of the
            document you are applying for. Everything is rendered on your device.
          </BehaviorNote>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * 14. Signature Resizer
 * ══════════════════════════════════════════════════════════════ */

const SIGNATURE_PRESETS = [
  { key: "140x60", label: "140 × 60 px", w: 140, h: 60 },
  { key: "200x70", label: "200 × 70 px", w: 200, h: 70 },
  { key: "256x64", label: "256 × 64 px", w: 256, h: 64 },
  { key: "320x90", label: "320 × 90 px", w: 320, h: 90 },
  { key: "custom", label: "Custom size", w: 0, h: 0 },
];

function SignatureResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<DecodedImage | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const [presetKey, setPresetKey] = useState("200x70");
  const [customW, setCustomW] = useState("250");
  const [customH, setCustomH] = useState("80");
  const [format, setFormat] = useState("image/jpeg");
  const [quality, setQuality] = useState(0.85);
  const [useTarget, setUseTarget] = useState(false);
  const [targetKb, setTargetKb] = useState("20");
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    closeDecoded(img);
    setImg(null);
    setDims(null);
    setFile(null);
    setResult(null);
    setDetail("");
    setError(null);
    setBusy(false);
  };

  const pick = async (f: File) => {
    reset();
    setFile(f);
    try {
      const decoded = await decodeImageBlob(f);
      const d = imageSize(decoded);
      setImg(decoded);
      setDims(d);
    } catch (e) {
      setFile(null);
      setError(errText(e));
    }
  };

  const run = async () => {
    if (!img || !dims || !file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setDetail("");
    try {
      const preset = SIGNATURE_PRESETS.find((p) => p.key === presetKey);
      const boxW = preset && preset.key !== "custom" ? preset.w : Math.round(Number(customW));
      const boxH = preset && preset.key !== "custom" ? preset.h : Math.round(Number(customH));
      if (!Number.isFinite(boxW) || !Number.isFinite(boxH) || boxW < 16 || boxH < 8 || boxW > 4000 || boxH > 4000) {
        throw new Error("Enter a target size between 16–4000 px wide and 8–4000 px tall.");
      }
      const k = Math.min(boxW / dims.width, boxH / dims.height);
      const w = Math.max(1, Math.round(dims.width * k));
      const h = Math.max(1, Math.round(dims.height * k));
      const target = format as ImageFormat;
      const canvas = drawToCanvas(img, w, h);
      if (target === "image/jpeg") fillBehind(canvas, "#ffffff");
      const baseBlob = await canvasToBlob(canvas, target, target === "image/png" ? undefined : quality);
      const kb = Number(targetKb);
      if (useTarget && kb > 0) {
        setStatus("Tuning quality to fit the size target…");
        const workFile = new File([baseBlob], `${stripExt(file.name)}-signature.jpg`, {
          type: "image/jpeg",
        });
        const res = await compressToTargetBytes(workFile, kb * 1024, "image/jpeg", setStatus);
        setResult({
          blob: res.blob,
          filename: `${stripExt(file.name)}-signature-${kb}kb.jpg`,
        });
        setDetail(
          res.hit
            ? `Target reached — final quality ${Math.round(res.quality * 100)}%.`
            : `Closest achievable: ${formatBytes(res.blob.size)} (target was ${kb} KB).`,
        );
      } else {
        setResult({
          blob: baseBlob,
          filename: `${stripExt(file.name)}-signature-${w}x${h}.${FORMAT_EXT[target]}`,
        });
      }
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept={IMAGE_ACCEPT} onFiles={(fs) => pick(fs[0])} label="Drop a scanned signature image" hint="Accepted: jpg, jpeg, png, webp, gif, bmp" />
      )}
      {file && img && dims && (
        <>
          <FileMeta file={file} />
          <SourcePreview file={file} maxHeightClass="max-h-48" />
          <p className="text-sm text-muted">
            Original: {dims.width} × {dims.height} px
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Target size"
              value={presetKey}
              onChange={setPresetKey}
              options={SIGNATURE_PRESETS.map((p) => ({ value: p.key, label: p.label }))}
            />
            {presetKey === "custom" && (
              <>
                <NumberField label="Custom width (px)" value={customW} onChange={setCustomW} min={16} max={4000} />
                <NumberField label="Custom height (px)" value={customH} onChange={setCustomH} min={8} max={4000} />
              </>
            )}
            <SelectField
              label="Output format"
              value={format}
              onChange={setFormat}
              options={[
                { value: "image/jpeg", label: "JPG (white background)" },
                { value: "image/png", label: "PNG (keeps transparency)" },
              ]}
            />
          </div>
          {format === "image/jpeg" && !useTarget && <QualitySlider value={quality} onChange={setQuality} />}
          <div className="flex flex-wrap items-center gap-6">
            <Checkbox label="Compress to a size target" checked={useTarget} onChange={setUseTarget} />
            {useTarget && (
              <div className="w-40">
                <NumberField label="Target (KB)" value={targetKb} onChange={setTargetKb} min={5} max={500} />
              </div>
            )}
          </div>
          {useTarget && (
            <p className="text-xs text-muted">
              Size-target mode always outputs JPG, because PNG cannot be tuned by quality.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={run} disabled={busy}>
              Resize signature
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          {busy && <BusyNote>{status || "Processing…"}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && <ResultPanel result={result} originalSize={file.size} extraNote={detail} onReset={reset} />}
          <BehaviorNote>
            The signature is scaled to fit inside the chosen box without distortion (aspect ratio is
            preserved, so the result may be slightly smaller than the box in one direction). JPG
            output flattens transparency onto a white background, which is what most government and
            bank forms expect.
          </BehaviorNote>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * 15. Image Rotator
 * ══════════════════════════════════════════════════════════════ */

const ROTATION_MODES = [
  { key: "90cw", label: "90° clockwise", angle: 90 },
  { key: "90ccw", label: "90° counter-clockwise", angle: -90 },
  { key: "180", label: "180°", angle: 180 },
  { key: "custom", label: "Custom angle", angle: null },
];

function ImageRotator() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<DecodedImage | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const [mode, setMode] = useState("90cw");
  const [custom, setCustom] = useState("15");
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [expand, setExpand] = useState(true);
  const [format, setFormat] = useState("auto");
  const [quality, setQuality] = useState(0.92);
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    closeDecoded(img);
    setImg(null);
    setDims(null);
    setFile(null);
    setResult(null);
    setError(null);
    setBusy(false);
  };

  const pick = async (f: File) => {
    reset();
    setFile(f);
    try {
      const decoded = await decodeImageBlob(f);
      setImg(decoded);
      setDims(imageSize(decoded));
    } catch (e) {
      setFile(null);
      setError(errText(e));
    }
  };

  const run = async () => {
    if (!img || !dims || !file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const modeDef = ROTATION_MODES.find((m) => m.key === mode);
      const angle = modeDef && modeDef.angle !== null ? modeDef.angle : clamp(Number(custom) || 0, -180, 180);
      const rad = (angle * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const dw = expand ? Math.round(dims.width * cos + dims.height * sin) : dims.width;
      const dh = expand ? Math.round(dims.width * sin + dims.height * cos) : dims.height;
      const canvas = document.createElement("canvas");
      canvas.width = dw;
      canvas.height = dh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context is unavailable.");
      ctx.translate(dw / 2, dh / 2);
      ctx.rotate(rad);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -dims.width / 2, -dims.height / 2, dims.width, dims.height);
      const target = resolveFormat(format, file);
      const blob = await canvasToBlob(canvas, target, target === "image/png" ? undefined : quality);
      setResult({
        blob,
        filename: `${stripExt(file.name)}-rotated.${FORMAT_EXT[target]}`,
      });
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept={IMAGE_ACCEPT} onFiles={(fs) => pick(fs[0])} label="Drop an image to rotate" hint="Accepted: jpg, jpeg, png, webp, gif, bmp" />
      )}
      {file && img && dims && (
        <>
          <FileMeta file={file} />
          <SourcePreview file={file} />
          <p className="text-sm text-muted">
            Original: {dims.width} × {dims.height} px
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Rotation"
              value={mode}
              onChange={setMode}
              options={ROTATION_MODES.map((m) => ({ value: m.key, label: m.label }))}
            />
            {mode === "custom" && (
              <NumberField label="Angle (−180 to 180)" value={custom} onChange={setCustom} min={-180} max={180} />
            )}
            <SelectField label="Output format" value={format} onChange={setFormat} options={FORMAT_OPTIONS(true)} />
            {format !== "image/png" && format !== "auto" && file.type !== "image/png" && (
              <QualitySlider value={quality} onChange={setQuality} />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Checkbox label="Flip horizontally" checked={flipH} onChange={setFlipH} />
            <Checkbox label="Flip vertically" checked={flipV} onChange={setFlipV} />
            <Checkbox label="Expand canvas for corners" checked={expand} onChange={setExpand} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={run} disabled={busy}>
              Apply rotation
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          {busy && <BusyNote>Rotating…</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && <ResultPanel result={result} originalSize={file.size} onReset={reset} />}
          <BehaviorNote>
            Quarter turns keep every pixel. For custom angles, “Expand canvas” grows the canvas to
            fit the rotated bounding box; unchecking it keeps the original size and crops the
            corners instead.
          </BehaviorNote>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * 16. Image to Base64
 * ══════════════════════════════════════════════════════════════ */

function ImageToBase64() {
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState("");
  const [style, setStyle] = useState("data-uri");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFile(null);
    setDataUrl("");
    setError(null);
    setBusy(false);
  };

  const pick = async (f: File) => {
    reset();
    setFile(f);
    setBusy(true);
    try {
      setDataUrl(await readAsDataUrl(f));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const base64 = dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : dataUrl;
  const mime = /^data:([^;,]+)/.exec(dataUrl)?.[1] ?? "";
  const output = useMemo(() => {
    if (!dataUrl) return "";
    if (style === "raw") return base64;
    if (style === "css") return `background-image: url("${dataUrl}");`;
    if (style === "html") return `<img src="${dataUrl}" alt="" />`;
    return dataUrl;
  }, [dataUrl, style, base64]);

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept={IMAGE_ACCEPT} onFiles={(fs) => pick(fs[0])} label="Drop an image to encode" hint="Accepted: jpg, jpeg, png, webp, gif, bmp" />
      )}
      {file && (
        <>
          <FileMeta file={file} />
          <SourcePreview file={file} maxHeightClass="max-h-48" />
          <SelectField
            label="Output style"
            value={style}
            onChange={setStyle}
            options={[
              { value: "data-uri", label: "Data URI (data:image/…;base64,…)" },
              { value: "raw", label: "Raw Base64 only" },
              { value: "css", label: "CSS background-image snippet" },
              { value: "html", label: "HTML <img> snippet" },
            ]}
          />
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Encoded output</span>
              {output && <CopyButton text={output} />}
            </div>
            <textarea
              readOnly
              value={output}
              rows={8}
              onFocus={(e) => e.currentTarget.select()}
              className={cn(inputCls, "resize-y font-mono")}
            />
          </div>
          {dataUrl && (
            <p className="text-sm text-muted">
              {mime || "unknown type"} · {formatBytes(file.size)} →{" "}
              <span className="text-cream">{formatBytes(output.length)}</span> as text (Base64 adds
              about 33%).
            </p>
          )}
          {output && (
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton onClick={() => downloadText(output, `${stripExt(file.name)}.base64.txt`)}>
                Download as .txt
              </PrimaryButton>
              <ResetButton onClick={reset} />
            </div>
          )}
          {busy && <BusyNote>Encoding…</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          <BehaviorNote>
            Encoding happens locally with FileReader. Data URIs are great for small icons and inline
            images, but browsers cannot cache them separately — keep inline images under ~100 KB.
          </BehaviorNote>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * 17. Base64 to Image
 * ══════════════════════════════════════════════════════════════ */

function Base64ToImage() {
  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState<{ blob: Blob; mime: string; ext: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = usePreviewUrl(decoded?.blob ?? null);

  const reset = () => {
    setInput("");
    setDecoded(null);
    setError(null);
  };

  const decode = () => {
    setError(null);
    setDecoded(null);
    try {
      setDecoded(parseBase64Image(input));
    } catch (e) {
      setError(errText(e));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
          Base64 input
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder="data:image/png;base64,iVBORw0KGgo…  (a data URI or raw Base64 both work)"
          className={cn(inputCls, "resize-y font-mono")}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton onClick={decode} disabled={!input.trim()}>
          Decode &amp; preview
        </PrimaryButton>
        <ResetButton onClick={reset} />
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      {decoded && (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-4">
            {url && <img src={url} alt="Decoded image" className="mx-auto max-h-80 w-auto max-w-full rounded" />}
          </div>
          <p className="text-sm text-muted">
            Type: <span className="text-cream">{decoded.mime}</span> ·{" "}
            {formatBytes(decoded.blob.size)}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <DownloadButton onClick={() => downloadBlob(decoded.blob, `decoded-image.${decoded.ext}`)} label={`Download .${decoded.ext}`} />
            <ResetButton onClick={reset} />
          </div>
        </div>
      )}
      <BehaviorNote>
        Decoding is done with the browser&apos;s native atob — nothing is uploaded. The real image
        type is detected from the file signature (magic bytes), so a missing or wrong data-URI prefix
        is not a problem.
      </BehaviorNote>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * 18. SVG to PNG
 * ══════════════════════════════════════════════════════════════ */

function SvgToPng() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<DecodedImage | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const [assumed, setAssumed] = useState(false);
  const [scale, setScale] = useState("2");
  const [bg, setBg] = useState("transparent");
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    closeDecoded(img);
    setImg(null);
    setDims(null);
    setAssumed(false);
    setFile(null);
    setResult(null);
    setError(null);
    setBusy(false);
  };

  const pick = async (f: File) => {
    reset();
    setFile(f);
    try {
      const decoded = await decodeImageBlob(f);
      const d = imageSize(decoded);
      if (d.width === 0 || d.height === 0) {
        // Dimensionless SVG: render at a sensible default canvas size.
        setDims({ width: 512, height: 512 });
        setAssumed(true);
      } else {
        setDims(d);
        setAssumed(false);
      }
      setImg(decoded);
    } catch (e) {
      setFile(null);
      setError(errText(e));
    }
  };

  const render = async () => {
    if (!img || !dims || !file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const k = Number(scale);
      const w = Math.min(8192, Math.round(dims.width * k));
      const h = Math.min(8192, Math.round(dims.height * k));
      const canvas = drawToCanvas(img, w, h);
      if (bg === "white") fillBehind(canvas, "#ffffff");
      const blob = await canvasToBlob(canvas, "image/png");
      setResult({ blob, filename: `${stripExt(file.name)}-${w}x${h}.png` });
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".svg" onFiles={(fs) => pick(fs[0])} label="Drop an SVG file to rasterise" hint="Accepted: svg" />
      )}
      {file && img && dims && (
        <>
          <FileMeta file={file} />
          <SourcePreview file={file} />
          <p className="text-sm text-muted">
            SVG size: {dims.width} × {dims.height} px
            {assumed && " (the SVG declares no intrinsic size, so 512 × 512 is assumed)"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Raster scale"
              value={scale}
              onChange={setScale}
              options={[
                { value: "1", label: "1× — same size" },
                { value: "2", label: "2× — retina" },
                { value: "4", label: "4× — print quality" },
              ]}
            />
            <SelectField
              label="Background"
              value={bg}
              onChange={setBg}
              options={[
                { value: "transparent", label: "Transparent" },
                { value: "white", label: "Solid white" },
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={render} disabled={busy}>
              Render PNG ({Math.min(8192, Math.round(dims.width * Number(scale)))} ×{" "}
              {Math.min(8192, Math.round(dims.height * Number(scale)))} px)
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          {busy && <BusyNote>Rasterising…</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && <ResultPanel result={result} originalSize={file.size} onReset={reset} />}
          <BehaviorNote>
            The SVG is rasterised by the browser&apos;s own renderer onto a canvas, so gradients,
            filters and fonts declared inside the SVG all render exactly as the browser shows them.
            External resources referenced by the SVG (remote images, webfonts) are not fetched.
          </BehaviorNote>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * 19. Image Color Picker
 * ══════════════════════════════════════════════════════════════ */

interface PickedColor {
  hex: string;
  rgb: string;
  hsl: string;
}

const MAX_SAMPLE_SIDE = 4000;

function ImageColorPicker() {
  const [file, setFile] = useState<File | null>(null);
  const sourceUrl = usePreviewUrl(file);
  const samplerRef = useRef<HTMLCanvasElement | null>(null);
  const [hover, setHover] = useState<PickedColor | null>(null);
  const [picked, setPicked] = useState<PickedColor[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    samplerRef.current = null;
    setFile(null);
    setHover(null);
    setPicked([]);
    setError(null);
    setBusy(false);
  };

  const pick = async (f: File) => {
    reset();
    setFile(f);
    setBusy(true);
    try {
      const img = await decodeImageBlob(f);
      const d = imageSize(img);
      const k = Math.min(1, MAX_SAMPLE_SIDE / Math.max(d.width, d.height));
      const canvas = drawToCanvas(
        img,
        Math.max(1, Math.round(d.width * k)),
        Math.max(1, Math.round(d.height * k)),
      );
      closeDecoded(img);
      samplerRef.current = canvas;
    } catch (e) {
      setFile(null);
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const sample = (clientX: number, clientY: number, el: HTMLElement): PickedColor | null => {
    const canvas = samplerRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const rect = el.getBoundingClientRect();
    const x = clamp(Math.round(((clientX - rect.left) / rect.width) * canvas.width), 0, canvas.width - 1);
    const y = clamp(Math.round(((clientY - rect.top) / rect.height) * canvas.height), 0, canvas.height - 1);
    const d = ctx.getImageData(x, y, 1, 1).data;
    const hsl = rgbToHsl(d[0], d[1], d[2]);
    return {
      hex: rgbaToHex(d[0], d[1], d[2]),
      rgb: `rgb(${d[0]}, ${d[1]}, ${d[2]})`,
      hsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
    };
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept={IMAGE_ACCEPT} onFiles={(fs) => pick(fs[0])} label="Drop an image to pick colours from" hint="Accepted: jpg, jpeg, png, webp, gif, bmp" />
      )}
      {file && (
        <>
          <FileMeta file={file} />
          <div className="rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-3">
            <img
              src={sourceUrl ?? ""}
              alt="Colour picker source — click to sample a pixel"
              className="mx-auto block max-h-[440px] w-auto max-w-full cursor-crosshair rounded"
              onMouseMove={(e) => setHover(sample(e.clientX, e.clientY, e.currentTarget))}
              onMouseLeave={() => setHover(null)}
              onClick={(e) => {
                const c = sample(e.clientX, e.clientY, e.currentTarget);
                if (c) setPicked((prev) => [c, ...prev].slice(0, 12));
              }}
            />
          </div>
          {hover && (
            <div className="flex items-center gap-3 text-sm text-muted">
              <span className="h-6 w-6 rounded border border-white/20" style={{ backgroundColor: hover.hex }} />
              Hovering: <span className="font-mono text-cream">{hover.hex}</span> — click to keep it.
            </div>
          )}
          {busy && <BusyNote>Preparing image…</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {picked.length > 0 && (
            <div className="space-y-2">
              {picked.map((c, i) => (
                <div key={`${c.hex}-${i}`} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-3 py-2">
                  <span className="h-8 w-8 shrink-0 rounded border border-white/20" style={{ backgroundColor: c.hex }} />
                  <span className="font-mono text-sm text-cream">{c.hex}</span>
                  <span className="font-mono text-xs text-muted">{c.rgb}</span>
                  <span className="font-mono text-xs text-muted">{c.hsl}</span>
                  <span className="grow" />
                  <CopyButton text={c.hex} label="HEX" />
                  <CopyButton text={c.rgb} label="RGB" />
                  <CopyButton text={c.hsl} label="HSL" />
                </div>
              ))}
              <ResetButton onClick={reset} />
            </div>
          )}
          <BehaviorNote>
            Colours are sampled from the pixel you click on a full-resolution canvas (images above
            {` ${MAX_SAMPLE_SIDE} `}px are proportionally downsampled for sampling). Everything runs
            locally; the last 12 picks are kept on screen.
          </BehaviorNote>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * 20. Favicon Generator
 * ══════════════════════════════════════════════════════════════ */

const FAVICON_SIZES = [16, 32, 48, 180, 192, 512];

const FAVICON_NAMES: Record<number, string> = {
  16: "favicon-16.png",
  32: "favicon-32.png",
  48: "favicon-48.png",
  180: "apple-touch-icon-180.png",
  192: "icon-192.png",
  512: "icon-512.png",
};

const FAVICON_HTML_SNIPPET = [
  '<link rel="icon" href="/favicon.ico" sizes="any" />',
  '<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />',
  '<link rel="apple-touch-icon" href="/apple-touch-icon-180.png" />',
  '<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />',
  '<link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512" />',
].join("\n");

function FaviconGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [fit, setFit] = useState("cover");
  const [previews, setPreviews] = useState<{ size: number; url: string; blob: Blob; filename: string }[]>([]);
  const [ico, setIco] = useState<ResultInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setPreviews([]);
    setIco(null);
    setError(null);
    setBusy(false);
  };

  const generate = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setPreviews([]);
    setIco(null);
    try {
      const img = await decodeImageBlob(file);
      const dims = imageSize(img);
      const master = document.createElement("canvas");
      master.width = 512;
      master.height = 512;
      const ctx = master.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context is unavailable.");
      if (fit === "cover" && dims.width > 0 && dims.height > 0) {
        const side = Math.min(dims.width, dims.height);
        ctx.drawImage(
          img,
          (dims.width - side) / 2,
          (dims.height - side) / 2,
          side,
          side,
          0,
          0,
          512,
          512,
        );
      } else {
        const k = Math.min(512 / dims.width, 512 / dims.height);
        const w = dims.width * k;
        const h = dims.height * k;
        ctx.drawImage(img, (512 - w) / 2, (512 - h) / 2, w, h);
      }
      closeDecoded(img);
      const out: { size: number; url: string; blob: Blob; filename: string }[] = [];
      for (const s of FAVICON_SIZES) {
        const canvas = drawToCanvas(master, s, s);
        const blob = await canvasToBlob(canvas, "image/png");
        out.push({ size: s, url: canvas.toDataURL("image/png"), blob, filename: FAVICON_NAMES[s] ?? `icon-${s}.png` });
      }
      setPreviews(out);
      const icoBlob = await buildIco(master, [16, 32, 48]);
      setIco({ blob: icoBlob, filename: "favicon.ico" });
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept={IMAGE_ACCEPT} onFiles={(fs) => setFile(fs[0])} label="Drop a square-ish image (logo, mark)" hint="Accepted: jpg, jpeg, png, webp, gif, bmp" />
      )}
      {file && (
        <>
          <FileMeta file={file} />
          <SourcePreview file={file} maxHeightClass="max-h-48" />
          <SelectField
            label="Fit mode for non-square sources"
            value={fit}
            onChange={setFit}
            options={[
              { value: "cover", label: "Centre-crop to square" },
              { value: "contain", label: "Fit whole image (letterbox)" },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={generate} disabled={busy}>
              Generate favicon set
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          {busy && <BusyNote>Rendering all sizes…</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {previews.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {previews.map((p) => (
                  <div key={p.size} className="rounded-lg border border-[#121212]/12 bg-[#f6f1e6] p-3 text-center">
                    <div
                      className="mx-auto mb-2 flex h-16 w-16 items-center justify-center"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)",
                        backgroundSize: "16px 16px",
                        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                        backgroundColor: "#1a1a1a",
                      }}
                    >
                      <img src={p.url} alt={`${p.size} px favicon preview`} className="max-h-16 max-w-16" />
                    </div>
                    <p className="mb-2 text-xs text-muted">
                      {p.size} × {p.size} · {formatBytes(p.blob.size)}
                    </p>
                    <SecondaryButton onClick={() => downloadBlob(p.blob, p.filename)} className="px-3 py-1.5 text-xs">
                      Download
                    </SecondaryButton>
                  </div>
                ))}
              </div>
              {ico && (
                <div className="flex flex-wrap items-center gap-3">
                  <DownloadButton onClick={() => downloadBlob(ico.blob, ico.filename)} label="Download favicon.ico (16/32/48)" />
                </div>
              )}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    HTML head snippet
                  </span>
                  <CopyButton text={FAVICON_HTML_SNIPPET} />
                </div>
                <pre className="overflow-x-auto rounded-lg border border-[#121212]/12 bg-white p-4 font-mono text-xs leading-relaxed text-cream">
                  {FAVICON_HTML_SNIPPET}
                </pre>
                <p className="mt-1 text-xs text-muted">
                  Drop the files in your site root (or /public) and paste the snippet into your
                  &lt;head&gt;.
                </p>
              </div>
            </div>
          )}
          <BehaviorNote>
            All sizes are rendered from a 512 px master with the Canvas API, and the .ico is a real
            ICO container embedding 16/32/48 px PNG frames — built locally, no upload.
          </BehaviorNote>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * 21. Image Metadata Viewer
 * ══════════════════════════════════════════════════════════════ */

function ImageMetadataViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<ImageMetadata | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setMeta(null);
    setError(null);
    setBusy(false);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      setMeta(parseImageMetadata(buffer));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const reportText = () => {
    if (!file || !meta) return "";
    const lines: string[] = [
      `Metadata report — ${file.name}`,
      `Detected format: ${meta.format}`,
      `File size: ${formatBytes(file.size)}`,
      `Declared MIME type: ${file.type || "—"}`,
      "",
      "Fields:",
      ...meta.fields.map((f) => `  ${f.label}: ${f.value}`),
    ];
    if (meta.textEntries.length > 0) {
      lines.push("", "Embedded text entries:");
      for (const t of meta.textEntries) lines.push(`  ${t.label}: ${t.value}`);
    }
    if (meta.notes.length > 0) {
      lines.push("", "Notes:");
      for (const n of meta.notes) lines.push(`  - ${n}`);
    }
    return lines.join("\n");
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept={IMAGE_ACCEPT} onFiles={(fs) => setFile(fs[0])} label="Drop an image to inspect its metadata" hint="Accepted: jpg, jpeg, png, webp, gif, bmp" />
      )}
      {file && !meta && (
        <>
          <FileMeta file={file} />
          <SourcePreview file={file} maxHeightClass="max-h-48" />
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={run} disabled={busy}>
              Read metadata
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          {busy && <BusyNote>Scanning the file bytes…</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
        </>
      )}
      {file && meta && (
        <>
          <div className="rounded-lg border border-[#121212]/12 bg-[#f6f1e6] p-4">
            <p className="text-sm font-semibold text-cream">
              {file.name} — {meta.format}
            </p>
            <p className="mt-1 text-xs text-muted">
              {formatBytes(file.size)} · declared MIME type: {file.type || "unknown"}
            </p>
          </div>
          {meta.fields.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-[#121212]/12">
              <table className="w-full text-sm">
                <tbody>
                  {meta.fields.map((f, i) => (
                    <tr key={`${f.label}-${i}`} className="border-b border-white/5 last:border-0">
                      <td className="w-1/3 bg-[#f6f1e6] px-4 py-2 align-top text-xs font-semibold uppercase tracking-wider text-muted">
                        {f.label}
                      </td>
                      <td className="px-4 py-2 text-cream">{f.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">No readable metadata fields were found in this file.</p>
          )}
          {meta.textEntries.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                Embedded text entries
              </p>
              <div className="space-y-1.5">
                {meta.textEntries.map((t, i) => (
                  <div key={`${t.label}-${i}`} className="rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-3 py-2 text-sm">
                    <span className="font-semibold text-cream">{t.label}</span>
                    <span className="text-muted"> — {t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {meta.notes.length > 0 && (
            <ul className="list-inside list-disc space-y-1 rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-4 py-3 text-xs leading-relaxed text-muted">
              {meta.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={() => downloadText(reportText(), `${stripExt(file.name)}-metadata.txt`)}>
              Download report (.txt)
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
        </>
      )}
      <BehaviorNote>
        EXIF (JPEG APP1) and PNG chunks are parsed byte-by-byte in TypeScript inside your browser —
        no EXIF library, no network. Maker notes, thumbnails, Photoshop resources and compressed text
        chunks are skipped rather than guessed; anything skipped is listed under Notes.
      </BehaviorNote>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * 22. Image OCR
 * ══════════════════════════════════════════════════════════════ */

function ImageOcr() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<{ terminate: () => Promise<unknown> } | null>(null);

  // Terminate a still-running worker if the component unmounts mid-job.
  useEffect(() => {
    return () => {
      void workerRef.current?.terminate().catch(() => undefined);
    };
  }, []);

  const reset = () => {
    if (workerRef.current) {
      void workerRef.current.terminate().catch(() => undefined);
      workerRef.current = null;
    }
    setFile(null);
    setText("");
    setConfidence(null);
    setStatus("");
    setProgress(0);
    setError(null);
    setBusy(false);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setText("");
    setConfidence(null);
    setProgress(0);
    try {
      type TesseractModule = typeof import("tesseract.js");
      const mod = (await import("tesseract.js")) as TesseractModule & {
        default?: TesseractModule;
      };
      const Tesseract = mod.default ?? mod;
      setStatus("Loading OCR engine…");
      const worker = await Tesseract.createWorker("eng", 1, {
        logger: (m) => {
          if (m.status) {
            setStatus(m.status.charAt(0).toUpperCase() + m.status.slice(1).replace(/_/g, " "));
          }
          if (typeof m.progress === "number") setProgress(m.progress);
        },
      });
      workerRef.current = worker;
      setStatus("Recognising text…");
      const { data } = await worker.recognize(file);
      setText(data.text);
      setConfidence(data.confidence);
      await worker.terminate();
      workerRef.current = null;
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
      setStatus("");
      setProgress(0);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept={IMAGE_ACCEPT} onFiles={(fs) => setFile(fs[0])} label="Drop an image containing text" hint="Accepted: jpg, jpeg, png, webp, gif, bmp" />
      )}
      {file && (
        <>
          <FileMeta file={file} />
          <SourcePreview file={file} maxHeightClass="max-h-48" />
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={run} disabled={busy}>
              Extract text
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          {busy && (
            <div className="space-y-2">
              <BusyNote>{status || "Working…"} The first run downloads the English language data and can take a minute.</BusyNote>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#121212]/10">
                <div
                  className="h-full rounded-full bg-lime transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          )}
          {error && <ErrorNote>{error}</ErrorNote>}
          {text !== "" && (
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Recognised text{confidence !== null ? ` — mean confidence ${Math.round(confidence)}%` : ""}
                  </span>
                  <CopyButton text={text} />
                </div>
                <textarea
                  readOnly
                  value={text}
                  rows={10}
                  onFocus={(e) => e.currentTarget.select()}
                  className={cn(inputCls, "resize-y font-mono")}
                />
              </div>
              <PrimaryButton onClick={() => downloadText(text, `${stripExt(file.name)}-ocr.txt`)}>
                Download .txt
              </PrimaryButton>
            </div>
          )}
          {text === "" && !busy && !error && (
            <p className="text-xs text-muted">The recognised text will appear here after processing.</p>
          )}
          <BehaviorNote>
            OCR runs on your device with Tesseract.js (English). The engine script and the eng
            traineddata file are fetched once from the Tesseract.js CDN and cached by your browser —
            this is the only network access the tool makes, and your image itself is never uploaded
            anywhere.
          </BehaviorNote>
        </>
      )}
    </div>
  );
}

/* ── Registry export ────────────────────────────────────────── */

export const imageTools: Record<string, ToolComponent> = {
  "image-compressor": ImageCompressor,
  "compress-to-20kb": () => <ExactSizeCompressor targetBytes={20 * 1024} label="20 KB" />,
  "compress-to-50kb": () => <ExactSizeCompressor targetBytes={50 * 1024} label="50 KB" />,
  "compress-to-100kb": () => <ExactSizeCompressor targetBytes={100 * 1024} label="100 KB" />,
  "compress-to-200kb": () => <ExactSizeCompressor targetBytes={200 * 1024} label="200 KB" />,
  "image-resizer": ImageResizer,
  "image-cropper": ImageCropper,
  "jpg-to-png": () => <ConvertTool config={JPG_TO_PNG} />,
  "png-to-jpg": () => <ConvertTool config={PNG_TO_JPG} />,
  "webp-to-jpg": () => <ConvertTool config={WEBP_TO_JPG} />,
  "jpg-to-webp": () => <ConvertTool config={JPG_TO_WEBP} />,
  "png-to-webp": () => <ConvertTool config={PNG_TO_WEBP} />,
  "passport-photo-maker": PassportPhotoMaker,
  "signature-resizer": SignatureResizer,
  "image-rotator": ImageRotator,
  "image-to-base64": ImageToBase64,
  "base64-to-image": Base64ToImage,
  "svg-to-png": SvgToPng,
  "image-color-picker": ImageColorPicker,
  "favicon-generator": FaviconGenerator,
  "image-metadata-viewer": ImageMetadataViewer,
  "image-ocr": ImageOcr,
};
