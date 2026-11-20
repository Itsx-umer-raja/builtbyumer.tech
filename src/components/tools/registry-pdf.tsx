"use client";

import { useRef, useState, type ReactNode } from "react";
import type { ToolComponent } from "./registry";
import {
  BusyNote,
  CopyButton,
  DownloadButton,
  ErrorNote,
  Field,
  FileDrop,
  OkNote,
  PrimaryButton,
  ResetButton,
  SecondaryButton,
  inputCls,
} from "./ui";
import { cn, downloadBlob, formatBytes } from "@/lib/utils";
import {
  canvasToBlob,
  extractPdfPageTexts,
  openPdf,
  renderPageToCanvas,
  renderPdfPageToDataUrl,
  renderPdfThumbnails,
} from "@/lib/pdf/pdfjs";
import {
  blocksFromDocxHtml,
  buildImagePdf,
  buildPdfFromBlocks,
  decodeImageFile,
  parsePageList,
  parseRangeGroups,
  textToBlocks,
  type DecodedImage,
} from "@/lib/pdf/pdfbuild";
import {
  buildDocxFromImages,
  buildDocxFromText,
  buildPptxFromImages,
  buildXlsxFromAoa,
  bytesToBase64,
  type PptxSlideImage,
} from "@/lib/pdf/office";

/* ── Shared helpers ─────────────────────────────────────────── */

const PDF_MIME = "application/pdf";

function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function bytesToBlob(bytes: Uint8Array, mime: string): Blob {
  return new Blob([bytes.buffer as ArrayBuffer], { type: mime });
}

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function MiniButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-[#121212]/15 px-2.5 py-1.5 text-xs font-medium text-cream transition hover:border-[#163D2B]/50 hover:text-[#163D2B] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

interface FileItem {
  file: File;
  url: string;
}

function FileChip({
  item,
  index,
  total,
  onMove,
  onRemove,
}: {
  item: FileItem;
  index: number;
  total: number;
  onMove: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-3 py-2">
      <span className="w-6 shrink-0 text-center text-xs text-muted">{index + 1}</span>
      {item.file.type.startsWith("image/") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-cream">{item.file.name}</p>
        <p className="text-xs text-muted">{formatBytes(item.file.size)}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <MiniButton onClick={() => onMove(index, -1)} disabled={index === 0}>&uarr;</MiniButton>
        <MiniButton onClick={() => onMove(index, 1)} disabled={index === total - 1}>&darr;</MiniButton>
        <MiniButton onClick={() => onRemove(index)} disabled={total === 1}>&times;</MiniButton>
      </div>
    </div>
  );
}

/* ── PDF page → image (JPG / PNG) ───────────────────────────── */

interface PageImageResult {
  blob: Blob;
  url: string;
  page: number;
}

function makePdfToImages(format: "jpeg" | "png", ext: string) {
  return function PdfToImages() {
    const [file, setFile] = useState<File | null>(null);
    const [scale, setScale] = useState("1.5");
    const [results, setResults] = useState<PageImageResult[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const clearResults = (list: PageImageResult[]) => {
      for (const r of list) URL.revokeObjectURL(r.url);
    };

    const run = async () => {
      if (!file || busy) return;
      setBusy("Loading PDF…");
      setError(null);
      clearResults(results);
      setResults([]);
      try {
        const pdf = await openPdf(new Uint8Array(await file.arrayBuffer()));
        const out: PageImageResult[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          setBusy(`Rendering page ${i} of ${pdf.numPages}…`);
          const page = await pdf.getPage(i);
          const canvas = await renderPageToCanvas(page, Number(scale) || 1.5);
          const blob = await canvasToBlob(canvas, `image/${format}`, 0.92);
          out.push({ blob, url: URL.createObjectURL(blob), page: i });
        }
        setResults(out);
      } catch (e) {
        setError(errText(e));
      } finally {
        setBusy(null);
      }
    };

    const reset = () => {
      clearResults(results);
      setResults([]);
      setFile(null);
      setError(null);
    };

    const downloadAll = async () => {
      if (!file) return;
      const base = stripExt(file.name);
      for (const r of results) {
        downloadBlob(r.blob, `${base}-page-${r.page}.${ext}`);
        await wait(300);
      }
    };

    return (
      <div className="space-y-5">
        {!file && (
          <FileDrop
            accept=".pdf"
            onFiles={(fs) => setFile(fs[0])}
            label={`Drop a PDF to convert to ${ext.toUpperCase()} images`}
            hint="Accepted: pdf"
          />
        )}
        {file && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Resolution">
                <select value={scale} onChange={(e) => setScale(e.target.value)} className={cn(inputCls, "w-44")}>
                  <option value="1">Screen (1×)</option>
                  <option value="1.5">High (1.5×)</option>
                  <option value="2">Very high (2×)</option>
                  <option value="3">Print (3×)</option>
                </select>
              </Field>
              <PrimaryButton onClick={run} disabled={busy !== null}>
                Convert to {ext.toUpperCase()}
              </PrimaryButton>
              <SecondaryButton onClick={reset}>Choose another PDF</SecondaryButton>
            </div>
            <FileMeta file={file} />
            {busy && <BusyNote>{busy}</BusyNote>}
            {error && <ErrorNote>{error}</ErrorNote>}
            {results.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-muted">
                    {results.length} image{results.length === 1 ? "" : "s"} ready — each page is a separate {ext.toUpperCase()}
                  </p>
                  <PrimaryButton onClick={downloadAll}>Download all</PrimaryButton>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {results.map((r) => (
                    <div key={r.page} className="rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.url} alt={`Page ${r.page}`} className="mb-2 max-h-44 w-full rounded object-contain" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted">Page {r.page}</span>
                        <MiniButton onClick={() => downloadBlob(r.blob, `${stripExt(file.name)}-page-${r.page}.${ext}`)}>
                          Save
                        </MiniButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
}

/* ── Images → PDF (JPG / PNG / WEBP / mixed) ────────────────── */

interface BuiltPdf {
  bytes: Uint8Array;
  pages: number;
}

function makeImagesToPdf(
  accept: string,
  acceptedLabel: string,
  outputName: string,
  note?: string,
) {
  return function ImagesToPdf() {
    const [items, setItems] = useState<FileItem[]>([]);
    const [pageSize, setPageSize] = useState("a4");
    const [orientation, setOrientation] = useState("auto");
    const [margin, setMargin] = useState("24");
    const [result, setResult] = useState<BuiltPdf | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const addFiles = (files: File[]) => {
      setItems((prev) => [...prev, ...files.map((f) => ({ file: f, url: URL.createObjectURL(f) }))]);
      setResult(null);
      setPreview(null);
    };

    const move = (index: number, delta: number) => {
      setItems((prev) => {
        const next = [...prev];
        const j = index + delta;
        if (j < 0 || j >= next.length) return prev;
        const tmp = next[index];
        next[index] = next[j];
        next[j] = tmp;
        return next;
      });
      setResult(null);
      setPreview(null);
    };

    const remove = (index: number) => {
      URL.revokeObjectURL(items[index].url);
      setItems((prev) => prev.filter((_, i) => i !== index));
      setResult(null);
      setPreview(null);
    };

    const reset = () => {
      for (const it of items) URL.revokeObjectURL(it.url);
      setItems([]);
      setResult(null);
      setPreview(null);
      setError(null);
    };

    const generate = async () => {
      if (items.length === 0 || busy) return;
      setBusy("Reading images…");
      setError(null);
      setResult(null);
      setPreview(null);
      try {
        const decoded: DecodedImage[] = [];
        for (const it of items) {
          setBusy(`Processing ${it.file.name}…`);
          decoded.push(await decodeImageFile(it.file));
        }
        setBusy("Building PDF…");
        const bytes = await buildImagePdf(decoded, {
          pageSize: pageSize as "fit" | "a4" | "letter",
          orientation: orientation as "auto" | "portrait" | "landscape",
          marginPt: Math.max(0, Math.min(72, Number(margin) || 0)),
        });
        setResult({ bytes, pages: decoded.length });
        setBusy("Creating preview…");
        setPreview(await renderPdfPageToDataUrl(bytes, 1, 1));
      } catch (e) {
        setError(errText(e));
      } finally {
        setBusy(null);
      }
    };

    return (
      <div className="space-y-5">
        <FileDrop accept={accept} multiple onFiles={addFiles} label="Drop images here or click to browse" hint={`Accepted: ${acceptedLabel}`} />
        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted">
              {items.length} image{items.length === 1 ? "" : "s"} · pages follow this order
            </p>
            {items.map((it, i) => (
              <FileChip key={`${it.file.name}-${i}`} item={it} index={i} total={items.length} onMove={move} onRemove={remove} />
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Page size">
            <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} className={cn(inputCls, "w-44")}>
              <option value="fit">Fit to image</option>
              <option value="a4">A4</option>
              <option value="letter">US Letter</option>
            </select>
          </Field>
          <Field label="Orientation">
            <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className={cn(inputCls, "w-44")}>
              <option value="auto">Auto</option>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </Field>
          <Field label="Margin (pt)">
            <input
              type="number"
              min={0}
              max={72}
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              className={cn(inputCls, "w-32")}
              disabled={pageSize === "fit"}
            />
          </Field>
          <PrimaryButton onClick={generate} disabled={items.length === 0 || busy !== null}>
            Create PDF
          </PrimaryButton>
          {items.length > 0 && <ResetButton onClick={reset} />}
        </div>
        {note && <BehaviorNote>{note}</BehaviorNote>}
        {busy && <BusyNote>{busy}</BusyNote>}
        {error && <ErrorNote>{error}</ErrorNote>}
        {result && (
          <div className="space-y-4">
            <OkNote>
              PDF ready — {result.pages} page{result.pages === 1 ? "" : "s"} · {formatBytes(bytesToBlob(result.bytes, PDF_MIME).size)}
            </OkNote>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="First page preview" className="max-h-72 rounded-xl border border-[#121212]/12" />
            )}
            <DownloadButton onClick={() => downloadBlob(bytesToBlob(result.bytes, PDF_MIME), outputName)} label="Download PDF" />
          </div>
        )}
      </div>
    );
  };
}

/* ── Merge PDF ──────────────────────────────────────────────── */

function MergePdf() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [result, setResult] = useState<BuiltPdf | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (files: File[]) => {
    setItems((prev) => [...prev, ...files.map((f) => ({ file: f, url: URL.createObjectURL(f) }))]);
    setResult(null);
    setPreview(null);
  };

  const move = (index: number, delta: number) => {
    setItems((prev) => {
      const next = [...prev];
      const j = index + delta;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[j];
      next[j] = tmp;
      return next;
    });
    setResult(null);
    setPreview(null);
  };

  const remove = (index: number) => {
    URL.revokeObjectURL(items[index].url);
    setItems((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
    setPreview(null);
  };

  const reset = () => {
    for (const it of items) URL.revokeObjectURL(it.url);
    setItems([]);
    setResult(null);
    setPreview(null);
    setError(null);
  };

  const merge = async () => {
    if (items.length < 2 || busy) return;
    setBusy("Merging…");
    setError(null);
    setResult(null);
    setPreview(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const out = await PDFDocument.create();
      out.setProducer("BuiltByUmer");
      for (const it of items) {
        setBusy(`Adding ${it.file.name}…`);
        const src = await PDFDocument.load(new Uint8Array(await it.file.arrayBuffer()), { ignoreEncryption: true });
        const copied = await out.copyPages(src, src.getPageIndices());
        for (const page of copied) out.addPage(page);
      }
      const bytes = await out.save({ useObjectStreams: true });
      setResult({ bytes, pages: out.getPageCount() });
      setBusy("Creating preview…");
      setPreview(await renderPdfPageToDataUrl(bytes, 1, 1));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <FileDrop accept=".pdf" multiple onFiles={addFiles} label="Drop PDF files to merge" hint="Accepted: pdf" />
      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted">{items.length} PDFs · pages are appended in this order</p>
          {items.map((it, i) => (
            <FileChip key={`${it.file.name}-${i}`} item={it} index={i} total={items.length} onMove={move} onRemove={remove} />
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton onClick={merge} disabled={items.length < 2 || busy !== null}>
          Merge {items.length > 1 ? `${items.length} PDFs` : "PDF"}
        </PrimaryButton>
        {items.length > 0 && <ResetButton onClick={reset} />}
      </div>
      {items.length === 1 && <ErrorNote>Add at least two PDFs to merge.</ErrorNote>}
      {busy && <BusyNote>{busy}</BusyNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {result && (
        <div className="space-y-4">
          <OkNote>
            Merged PDF ready — {result.pages} pages · {formatBytes(bytesToBlob(result.bytes, PDF_MIME).size)}
          </OkNote>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="First page preview" className="max-h-72 rounded-xl border border-[#121212]/12" />
          )}
          <DownloadButton onClick={() => downloadBlob(bytesToBlob(result.bytes, PDF_MIME), "merged.pdf")} label="Download merged.pdf" />
        </div>
      )}
    </div>
  );
}

/* ── Split PDF ──────────────────────────────────────────────── */

interface SplitResult {
  name: string;
  blob: Blob;
}

function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState("each");
  const [ranges, setRanges] = useState("1-1");
  const [results, setResults] = useState<SplitResult[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setResults([]);
    setError(null);
  };

  const run = async () => {
    if (!file || busy) return;
    setBusy("Loading PDF…");
    setError(null);
    setResults([]);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const src = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { ignoreEncryption: true });
      const base = stripExt(file.name);
      const out: SplitResult[] = [];
      if (mode === "each") {
        for (let i = 0; i < src.getPageCount(); i++) {
          setBusy(`Extracting page ${i + 1} of ${src.getPageCount()}…`);
          const doc = await PDFDocument.create();
          const [page] = await doc.copyPages(src, [i]);
          doc.addPage(page);
          const bytes = await doc.save({ useObjectStreams: true });
          out.push({ name: `${base}-page-${i + 1}.pdf`, blob: bytesToBlob(bytes, PDF_MIME) });
        }
      } else {
        const groups = parseRangeGroups(ranges, src.getPageCount());
        for (const group of groups) {
          setBusy(`Building pages ${group[0]}-${group[group.length - 1]}…`);
          const doc = await PDFDocument.create();
          const copied = await doc.copyPages(src, group.map((p) => p - 1));
          for (const page of copied) doc.addPage(page);
          const bytes = await doc.save({ useObjectStreams: true });
          const label =
            group.length === 1 ? `page-${group[0]}` : `pages-${group[0]}-${group[group.length - 1]}`;
          out.push({ name: `${base}-${label}.pdf`, blob: bytesToBlob(bytes, PDF_MIME) });
        }
      }
      setResults(out);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  const downloadAll = async () => {
    for (const r of results) {
      downloadBlob(r.blob, r.name);
      await wait(300);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".pdf" onFiles={(fs) => setFile(fs[0])} label="Drop a PDF to split" hint="Accepted: pdf" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Split mode">
              <select value={mode} onChange={(e) => setMode(e.target.value)} className={cn(inputCls, "w-64")}>
                <option value="each">Every page as its own file</option>
                <option value="ranges">Custom page ranges</option>
              </select>
            </Field>
            {mode === "ranges" && (
              <Field label="Ranges (comma separated)">
                <input
                  type="text"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder="1-3, 5, 8-10"
                  className={cn(inputCls, "w-56")}
                />
              </Field>
            )}
            <PrimaryButton onClick={run} disabled={busy !== null}>
              Split PDF
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">
                  {results.length} document{results.length === 1 ? "" : "s"} created
                </p>
                <PrimaryButton onClick={downloadAll}>Download all</PrimaryButton>
              </div>
              {results.map((r) => (
                <div key={r.name} className="flex items-center justify-between rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-4 py-2.5">
                  <span className="truncate text-sm text-cream">{r.name}</span>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-muted">{formatBytes(r.blob.size)}</span>
                    <MiniButton onClick={() => downloadBlob(r.blob, r.name)}>Save</MiniButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Compress PDF ───────────────────────────────────────────── */

const COMPRESS_PRESETS = {
  light: { quality: 0.8, maxPx: 2200, label: "Light" },
  medium: { quality: 0.6, maxPx: 1600, label: "Medium" },
  strong: { quality: 0.4, maxPx: 1100, label: "Strong" },
} as const;

function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<"light" | "medium" | "strong">("medium");
  const [result, setResult] = useState<{ bytes: Uint8Array; originalSize: number } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setPreview(null);
    setError(null);
  };

  const run = async () => {
    if (!file || busy) return;
    setBusy("Loading PDF…");
    setError(null);
    setResult(null);
    setPreview(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const src = await openPdf(new Uint8Array(await file.arrayBuffer()));
      const preset = COMPRESS_PRESETS[level];
      const out = await PDFDocument.create();
      out.setProducer("BuiltByUmer");
      for (let i = 1; i <= src.numPages; i++) {
        setBusy(`Re-sampling page ${i} of ${src.numPages}…`);
        const page = await src.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.max(0.5, Math.min(preset.maxPx / Math.max(base.width, base.height), 2));
        const canvas = await renderPageToCanvas(page, scale);
        const blob = await canvasToBlob(canvas, "image/jpeg", preset.quality);
        const img = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
        const pdfPage = out.addPage([base.width, base.height]);
        pdfPage.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
      }
      const bytes = await out.save({ useObjectStreams: true });
      setResult({ bytes, originalSize: file.size });
      setBusy("Creating preview…");
      setPreview(await renderPdfPageToDataUrl(bytes, 1, 1));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  const saved =
    result === null
      ? null
      : Math.max(0, Math.round((1 - bytesToBlob(result.bytes, PDF_MIME).size / Math.max(1, result.originalSize)) * 100));

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".pdf" onFiles={(fs) => setFile(fs[0])} label="Drop a PDF to compress" hint="Accepted: pdf" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Compression level">
              <select value={level} onChange={(e) => setLevel(e.target.value as "light" | "medium" | "strong")} className={cn(inputCls, "w-44")}>
                <option value="light">Light (best quality)</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong (smallest)</option>
              </select>
            </Field>
            <PrimaryButton onClick={run} disabled={busy !== null}>
              Compress
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          <BehaviorNote>
            Each page is re-rendered and re-embedded as a resampled JPEG image at the chosen level (Light/Strong
            target ~2200/1100 px per page). Scanned and image-heavy PDFs shrink the most; pages become images, so
            text is no longer selectable and vector graphics are rasterised.
          </BehaviorNote>
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && (
            <div className="space-y-4">
              <OkNote>
                {formatBytes(result.originalSize)} &rarr; {formatBytes(bytesToBlob(result.bytes, PDF_MIME).size)}
                {saved !== null && saved > 0 ? ` · ${saved}% smaller` : " · could not shrink this PDF further at this level"}
              </OkNote>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="First page preview" className="max-h-72 rounded-xl border border-[#121212]/12" />
              )}
              <DownloadButton onClick={() => downloadBlob(bytesToBlob(result.bytes, PDF_MIME), `${stripExt(file.name)}-compressed.pdf`)} label="Download compressed PDF" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Rotate PDF ─────────────────────────────────────────────── */

function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState("90");
  const [mode, setMode] = useState("all");
  const [pagesInput, setPagesInput] = useState("1");
  const [result, setResult] = useState<BuiltPdf | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setPreview(null);
    setError(null);
  };

  const run = async () => {
    if (!file || busy) return;
    setBusy("Loading PDF…");
    setError(null);
    setResult(null);
    setPreview(null);
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const pdf = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { ignoreEncryption: true });
      const targets =
        mode === "all"
          ? pdf.getPageIndices()
          : parsePageList(pagesInput, pdf.getPageCount()).map((p) => p - 1);
      if (targets.length === 0) throw new Error("No pages selected — check the page range.");
      for (const idx of targets) {
        const page = pdf.getPage(idx);
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + Number(angle)) % 360));
      }
      const bytes = await pdf.save({ useObjectStreams: true });
      setResult({ bytes, pages: targets.length });
      setBusy("Creating preview…");
      setPreview(await renderPdfPageToDataUrl(bytes, 1, 1));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".pdf" onFiles={(fs) => setFile(fs[0])} label="Drop a PDF to rotate" hint="Accepted: pdf" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Rotation">
              <select value={angle} onChange={(e) => setAngle(e.target.value)} className={cn(inputCls, "w-40")}>
                <option value="90">90° clockwise</option>
                <option value="180">180°</option>
                <option value="270">270° (90° anticlockwise)</option>
              </select>
            </Field>
            <Field label="Pages">
              <select value={mode} onChange={(e) => setMode(e.target.value)} className={cn(inputCls, "w-40")}>
                <option value="all">All pages</option>
                <option value="range">Selected pages</option>
              </select>
            </Field>
            {mode === "range" && (
              <Field label="Which pages">
                <input
                  type="text"
                  value={pagesInput}
                  onChange={(e) => setPagesInput(e.target.value)}
                  placeholder="e.g. 1, 3-5"
                  className={cn(inputCls, "w-44")}
                />
              </Field>
            )}
            <PrimaryButton onClick={run} disabled={busy !== null}>
              Rotate
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && (
            <div className="space-y-4">
              <OkNote>
                Rotated {result.pages} page{result.pages === 1 ? "" : "s"} by {angle}°.
              </OkNote>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="First page preview" className="max-h-72 rounded-xl border border-[#121212]/12" />
              )}
              <DownloadButton onClick={() => downloadBlob(bytesToBlob(result.bytes, PDF_MIME), `${stripExt(file.name)}-rotated.pdf`)} label="Download rotated PDF" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Shared page-thumbnail picker (reorder / delete) ────────── */

interface ThumbPage {
  page: number;
  dataUrl: string;
}

function usePdfPages(file: File | null) {
  const bytesRef = useRef<Uint8Array | null>(null);
  const reset = () => {
    bytesRef.current = null;
  };
  const load = async (
    onBusy: (msg: string) => void,
  ): Promise<{ thumbs: ThumbPage[]; total: number }> => {
    if (!file) throw new Error("No file loaded.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    bytesRef.current = bytes;
    onBusy("Loading PDF…");
    const pdf = await openPdf(bytes);
    const thumbs = await renderPdfThumbnails(pdf, 150, (p, t) => onBusy(`Rendering page ${p} of ${t}…`));
    return {
      thumbs: thumbs.map((t, i) => ({ page: i + 1, dataUrl: t.dataUrl })),
      total: pdf.numPages,
    };
  };
  return { bytesRef, load, reset };
}

/* ── Reorder pages ──────────────────────────────────────────── */

function ReorderPages() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbs, setThumbs] = useState<ThumbPage[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [result, setResult] = useState<BuiltPdf | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);
  const pages = usePdfPages(file);

  const load = async () => {
    if (!file || busy) return;
    setError(null);
    setResult(null);
    setPreview(null);
    setOrder([]);
    try {
      const { thumbs: list, total } = await pages.load(setBusy);
      setThumbs(list);
      setOrder(Array.from({ length: total }, (_, i) => i + 1));
    } catch (e) {
      setError(errText(e));
      setBusy(null);
    }
  };

  const move = (index: number, delta: number) => {
    setOrder((prev) => {
      const j = index + delta;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[index];
      next[index] = next[j];
      next[j] = tmp;
      return next;
    });
    setResult(null);
    setPreview(null);
  };

  const dropOn = (index: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === index) return;
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setResult(null);
    setPreview(null);
  };

  const reset = () => {
    pages.reset();
    setFile(null);
    setThumbs([]);
    setOrder([]);
    setResult(null);
    setPreview(null);
    setError(null);
  };

  const save = async () => {
    if (!file || busy) return;
    setBusy("Rebuilding PDF…");
    setError(null);
    setResult(null);
    setPreview(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      if (!pages.bytesRef.current) throw new Error("Source PDF is gone — reload the file.");
      const src = await PDFDocument.load(pages.bytesRef.current, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      out.setProducer("BuiltByUmer");
      const copied = await out.copyPages(src, order.map((p) => p - 1));
      for (const page of copied) out.addPage(page);
      const bytes = await out.save({ useObjectStreams: true });
      setResult({ bytes, pages: order.length });
      setBusy("Creating preview…");
      setPreview(await renderPdfPageToDataUrl(bytes, 1, 1));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  const thumb = (page: number) => thumbs.find((t) => t.page === page)?.dataUrl ?? "";

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".pdf" onFiles={(fs) => setFile(fs[0])} label="Drop a PDF to reorder its pages" hint="Accepted: pdf" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            {thumbs.length === 0 && (
              <PrimaryButton onClick={load} disabled={busy !== null}>
                Load pages
              </PrimaryButton>
            )}
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {thumbs.length > 0 && (
            <div>
              <p className="mb-3 text-sm text-muted">
                Drag pages into a new order (or use the arrows), then rebuild the PDF.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {order.map((page, i) => (
                  <div
                    key={page}
                    draggable
                    onDragStart={() => {
                      dragIndex.current = i;
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      dropOn(i);
                    }}
                    className="cursor-grab rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-2 text-center active:cursor-grabbing"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(page)} alt={`Page ${page}`} className="mb-2 w-full rounded border border-[#121212]/12" />
                    <p className="mb-1.5 text-xs text-muted">
                      pos {i + 1} · page {page}
                    </p>
                    <div className="flex justify-center gap-1">
                      <MiniButton onClick={() => move(i, -1)} disabled={i === 0}>&larr;</MiniButton>
                      <MiniButton onClick={() => move(i, 1)} disabled={i === order.length - 1}>&rarr;</MiniButton>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <PrimaryButton onClick={save} disabled={busy !== null}>
                  Save new order
                </PrimaryButton>
              </div>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <OkNote>PDF rebuilt in the new order.</OkNote>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="First page preview" className="max-h-72 rounded-xl border border-[#121212]/12" />
              )}
              <DownloadButton onClick={() => downloadBlob(bytesToBlob(result.bytes, PDF_MIME), `${stripExt(file.name)}-reordered.pdf`)} label="Download reordered PDF" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Delete pages ───────────────────────────────────────────── */

function DeletePages() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbs, setThumbs] = useState<ThumbPage[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pagesInput, setPagesInput] = useState("");
  const [result, setResult] = useState<BuiltPdf | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pages = usePdfPages(file);

  const load = async () => {
    if (!file || busy) return;
    setError(null);
    setResult(null);
    setPreview(null);
    setSelected(new Set());
    try {
      const { thumbs: list } = await pages.load(setBusy);
      setThumbs(list);
    } catch (e) {
      setError(errText(e));
      setBusy(null);
    }
  };

  const toggle = (page: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(page)) next.delete(page);
      else next.add(page);
      return next;
    });
    setResult(null);
    setPreview(null);
  };

  const addFromInput = () => {
    if (!thumbs.length) return;
    try {
      const list = parsePageList(pagesInput, thumbs.length);
      setSelected((prev) => {
        const next = new Set(prev);
        for (const p of list) next.add(p);
        return next;
      });
      setResult(null);
      setPreview(null);
      setError(null);
    } catch (e) {
      setError(errText(e));
    }
  };

  const reset = () => {
    pages.reset();
    setFile(null);
    setThumbs([]);
    setSelected(new Set());
    setPagesInput("");
    setResult(null);
    setPreview(null);
    setError(null);
  };

  const run = async () => {
    if (!file || busy) return;
    const remaining = thumbs.map((t) => t.page).filter((p) => !selected.has(p));
    if (remaining.length === thumbs.length) {
      setError("Select at least one page to delete.");
      return;
    }
    setBusy("Rebuilding PDF…");
    setError(null);
    setResult(null);
    setPreview(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      if (!pages.bytesRef.current) throw new Error("Source PDF is gone — reload the file.");
      const src = await PDFDocument.load(pages.bytesRef.current, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      out.setProducer("BuiltByUmer");
      const copied = await out.copyPages(src, remaining.map((p) => p - 1));
      for (const page of copied) out.addPage(page);
      const bytes = await out.save({ useObjectStreams: true });
      setResult({ bytes, pages: remaining.length });
      setBusy("Creating preview…");
      setPreview(await renderPdfPageToDataUrl(bytes, 1, 1));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".pdf" onFiles={(fs) => setFile(fs[0])} label="Drop a PDF to delete pages from" hint="Accepted: pdf" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            {thumbs.length === 0 && (
              <PrimaryButton onClick={load} disabled={busy !== null}>
                Load pages
              </PrimaryButton>
            )}
            {thumbs.length > 0 && (
              <>
                <Field label="Add pages to delete">
                  <input
                    type="text"
                    value={pagesInput}
                    onChange={(e) => setPagesInput(e.target.value)}
                    placeholder="e.g. 2, 5-7"
                    className={cn(inputCls, "w-44")}
                  />
                </Field>
                <SecondaryButton onClick={addFromInput}>Add range</SecondaryButton>
              </>
            )}
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {thumbs.length > 0 && (
            <div>
              <p className="mb-3 text-sm text-muted">
                Click pages to mark them for deletion — {selected.size} of {thumbs.length} selected.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {thumbs.map((t) => {
                  const isSelected = selected.has(t.page);
                  return (
                    <button
                      type="button"
                      key={t.page}
                      onClick={() => toggle(t.page)}
                      className={cn(
                        "rounded-xl border bg-[#f6f1e6] p-2 text-center transition",
                        isSelected ? "border-red-400/70 ring-2 ring-red-400/40" : "border-[#121212]/12 hover:border-[#163D2B]/40",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.dataUrl} alt={`Page ${t.page}`} className={cn("mb-2 w-full rounded", isSelected && "opacity-50")} />
                      <p className={cn("text-xs", isSelected ? "text-red-300" : "text-muted")}>
                        {isSelected ? "Delete" : "Keep"} · page {t.page}
                      </p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5">
                <PrimaryButton onClick={run} disabled={busy !== null || selected.size === 0}>
                  Delete {selected.size} page{selected.size === 1 ? "" : "s"}
                </PrimaryButton>
              </div>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <OkNote>Done — {result.pages} page{result.pages === 1 ? "" : "s"} remain.</OkNote>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="First page preview" className="max-h-72 rounded-xl border border-[#121212]/12" />
              )}
              <DownloadButton onClick={() => downloadBlob(bytesToBlob(result.bytes, PDF_MIME), `${stripExt(file.name)}-trimmed.pdf`)} label="Download PDF" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Watermark PDF ──────────────────────────────────────────── */

function WatermarkPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState("48");
  const [opacity, setOpacity] = useState("0.25");
  const [color, setColor] = useState("gray");
  const [style, setStyle] = useState("diagonal");
  const [result, setResult] = useState<BuiltPdf | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setPreview(null);
    setError(null);
  };

  const run = async () => {
    if (!file || busy) return;
    const stamp = text.trim();
    if (!stamp) {
      setError("Enter the watermark text.");
      return;
    }
    setBusy("Loading PDF…");
    setError(null);
    setResult(null);
    setPreview(null);
    try {
      const { PDFDocument, StandardFonts, degrees, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { ignoreEncryption: true });
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const size = Math.max(8, Math.min(144, Number(fontSize) || 48));
      const op = Math.max(0.05, Math.min(1, Number(opacity) || 0.25));
      const colors: Record<string, ReturnType<typeof rgb>> = {
        gray: rgb(0.45, 0.45, 0.45),
        black: rgb(0, 0, 0),
        red: rgb(0.85, 0.15, 0.15),
        blue: rgb(0.15, 0.35, 0.8),
      };
      const paint = colors[color] ?? colors.gray;
      for (const page of pdf.getPages()) {
        const { width, height } = page.getSize();
        const tw = font.widthOfTextAtSize(stamp, size);
        if (style === "diagonal") {
          const angle = Math.PI / 4;
          const x = width / 2 - (tw / 2) * Math.cos(angle);
          const y = height / 2 - (tw / 2) * Math.sin(angle) - size * 0.35;
          page.drawText(stamp, { x, y, size, font, color: paint, opacity: op, rotate: degrees(45) });
        } else if (style === "center") {
          page.drawText(stamp, { x: (width - tw) / 2, y: height / 2 - size * 0.35, size, font, color: paint, opacity: op });
        } else {
          page.drawText(stamp, {
            x: (width - tw) / 2,
            y: 48,
            size: Math.min(size, 24),
            font,
            color: paint,
            opacity: op,
          });
        }
      }
      const bytes = await pdf.save({ useObjectStreams: true });
      setResult({ bytes, pages: pdf.getPageCount() });
      setBusy("Creating preview…");
      setPreview(await renderPdfPageToDataUrl(bytes, 1, 1));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".pdf" onFiles={(fs) => setFile(fs[0])} label="Drop a PDF to watermark" hint="Accepted: pdf" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Text">
              <input type="text" value={text} onChange={(e) => setText(e.target.value)} className={cn(inputCls, "w-52")} />
            </Field>
            <Field label="Placement">
              <select value={style} onChange={(e) => setStyle(e.target.value)} className={cn(inputCls, "w-44")}>
                <option value="diagonal">Diagonal (45°)</option>
                <option value="center">Centre of page</option>
                <option value="footer">Footer band</option>
              </select>
            </Field>
            <Field label="Colour">
              <select value={color} onChange={(e) => setColor(e.target.value)} className={cn(inputCls, "w-32")}>
                <option value="gray">Grey</option>
                <option value="black">Black</option>
                <option value="red">Red</option>
                <option value="blue">Blue</option>
              </select>
            </Field>
            <Field label="Font size">
              <input type="number" min={8} max={144} value={fontSize} onChange={(e) => setFontSize(e.target.value)} className={cn(inputCls, "w-24")} />
            </Field>
            <Field label="Opacity">
              <input type="number" min={0.05} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(e.target.value)} className={cn(inputCls, "w-24")} />
            </Field>
            <PrimaryButton onClick={run} disabled={busy !== null}>
              Add watermark
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && (
            <div className="space-y-4">
              <OkNote>Watermark stamped on {result.pages} page{result.pages === 1 ? "" : "s"}.</OkNote>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="First page preview" className="max-h-72 rounded-xl border border-[#121212]/12" />
              )}
              <DownloadButton onClick={() => downloadBlob(bytesToBlob(result.bytes, PDF_MIME), `${stripExt(file.name)}-watermarked.pdf`)} label="Download watermarked PDF" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Add page numbers ───────────────────────────────────────── */

function AddPageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState("bottom-center");
  const [format, setFormat] = useState("n");
  const [startAt, setStartAt] = useState("1");
  const [fontSize, setFontSize] = useState("11");
  const [result, setResult] = useState<BuiltPdf | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setPreview(null);
    setError(null);
  };

  const run = async () => {
    if (!file || busy) return;
    setBusy("Loading PDF…");
    setError(null);
    setResult(null);
    setPreview(null);
    try {
      const { PDFDocument, StandardFonts } = await import("pdf-lib");
      const pdf = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { ignoreEncryption: true });
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const size = Math.max(6, Math.min(36, Number(fontSize) || 11));
      const start = Number(startAt) || 1;
      const margin = 36;
      const pages = pdf.getPages();
      pages.forEach((page, i) => {
        const n = start + i;
        const total = start + pages.length - 1;
        const label =
          format === "n"
            ? `${n}`
            : format === "n/total"
              ? `${n} / ${total}`
              : `Page ${n} of ${total}`;
        const { width, height } = page.getSize();
        const tw = font.widthOfTextAtSize(label, size);
        const x = position.endsWith("left")
          ? margin
          : position.endsWith("right")
            ? width - margin - tw
            : (width - tw) / 2;
        const y = position.startsWith("top") ? height - margin - size : margin;
        page.drawText(label, { x, y, size, font });
      });
      const bytes = await pdf.save({ useObjectStreams: true });
      setResult({ bytes, pages: pages.length });
      setBusy("Creating preview…");
      setPreview(await renderPdfPageToDataUrl(bytes, 1, 1));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".pdf" onFiles={(fs) => setFile(fs[0])} label="Drop a PDF to add page numbers" hint="Accepted: pdf" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Position">
              <select value={position} onChange={(e) => setPosition(e.target.value)} className={cn(inputCls, "w-48")}>
                <option value="bottom-center">Bottom centre</option>
                <option value="bottom-right">Bottom right</option>
                <option value="bottom-left">Bottom left</option>
                <option value="top-center">Top centre</option>
                <option value="top-right">Top right</option>
                <option value="top-left">Top left</option>
              </select>
            </Field>
            <Field label="Format">
              <select value={format} onChange={(e) => setFormat(e.target.value)} className={cn(inputCls, "w-48")}>
                <option value="n">1</option>
                <option value="n/total">1 / N</option>
                <option value="page-n-of-total">Page 1 of N</option>
              </select>
            </Field>
            <Field label="Start at">
              <input type="number" min={1} value={startAt} onChange={(e) => setStartAt(e.target.value)} className={cn(inputCls, "w-24")} />
            </Field>
            <Field label="Font size">
              <input type="number" min={6} max={36} value={fontSize} onChange={(e) => setFontSize(e.target.value)} className={cn(inputCls, "w-24")} />
            </Field>
            <PrimaryButton onClick={run} disabled={busy !== null}>
              Add numbers
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && (
            <div className="space-y-4">
              <OkNote>Numbered {result.pages} page{result.pages === 1 ? "" : "s"}.</OkNote>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="First page preview" className="max-h-72 rounded-xl border border-[#121212]/12" />
              )}
              <DownloadButton onClick={() => downloadBlob(bytesToBlob(result.bytes, PDF_MIME), `${stripExt(file.name)}-numbered.pdf`)} label="Download numbered PDF" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── PDF viewer ─────────────────────────────────────────────── */

function PdfViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState("1.25");
  const [pages, setPages] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [goTo, setGoTo] = useState("1");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const render = async (scale: number) => {
    if (!file) return;
    setBusy("Loading PDF…");
    setError(null);
    setPages([]);
    try {
      const pdf = await openPdf(new Uint8Array(await file.arrayBuffer()));
      setTotal(pdf.numPages);
      const urls: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        setBusy(`Rendering page ${i} of ${pdf.numPages}…`);
        const page = await pdf.getPage(i);
        const canvas = await renderPageToCanvas(page, scale);
        urls.push(canvas.toDataURL("image/jpeg", 0.85));
        setPages([...urls]);
        await wait(0);
      }
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    setFile(null);
    setPages([]);
    setTotal(0);
    setError(null);
    setBusy(null);
  };

  const jump = () => {
    const n = Math.max(1, Math.min(total || 1, Number(goTo) || 1));
    document.getElementById(`pdf-viewer-page-${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".pdf" onFiles={(fs) => setFile(fs[0])} label="Drop a PDF to read it privately" hint="Accepted: pdf" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Zoom">
              <select
                value={zoom}
                onChange={(e) => {
                  setZoom(e.target.value);
                  if (file) void render(Number(e.target.value) || 1);
                }}
                className={cn(inputCls, "w-40")}
              >
                <option value="1">100%</option>
                <option value="1.25">125%</option>
                <option value="1.5">150%</option>
                <option value="2">200%</option>
              </select>
            </Field>
            <Field label="Go to page">
              <input
                type="number"
                min={1}
                value={goTo}
                onChange={(e) => setGoTo(e.target.value)}
                className={cn(inputCls, "w-24")}
              />
            </Field>
            <SecondaryButton onClick={jump} disabled={total === 0}>
              Jump
            </SecondaryButton>
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          {total > 0 && (
            <p className="text-sm text-muted">
              {total} page{total === 1 ? "" : "s"} — scrolls continuously; use the page box to jump.
            </p>
          )}
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          <div className="space-y-6">
            {pages.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                id={`pdf-viewer-page-${i + 1}`}
                src={src}
                alt={`Page ${i + 1}`}
                className="mx-auto max-w-full rounded-lg border border-[#121212]/12 bg-white"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Text extraction utilities ──────────────────────────────── */

function emptyText(pages: string[]): boolean {
  return pages.every((p) => p.trim().length === 0);
}

/* ── PDF text extractor ─────────────────────────────────────── */

function PdfTextExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [markers, setMarkers] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fullText = pages
    .map((t, i) => (markers ? `----- Page ${i + 1} -----\n${t}` : t))
    .join("\n\n");

  const reset = () => {
    setFile(null);
    setPages([]);
    setError(null);
  };

  const run = async () => {
    if (!file || busy) return;
    setBusy("Loading PDF…");
    setError(null);
    setPages([]);
    try {
      const pdf = await openPdf(new Uint8Array(await file.arrayBuffer()));
      const texts = await extractPdfPageTexts(pdf, (p, t) => setBusy(`Extracting text from page ${p} of ${t}…`));
      if (emptyText(texts)) {
        setError("No selectable text found — this PDF is probably a scan. OCR would be needed instead.");
      }
      setPages(texts);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  const wordCount = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".pdf" onFiles={(fs) => setFile(fs[0])} label="Drop a PDF to extract its text" hint="Accepted: pdf" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <PrimaryButton onClick={run} disabled={busy !== null}>
              Extract text
            </PrimaryButton>
            <label className="mb-2 flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={markers}
                onChange={(e) => setMarkers(e.target.checked)}
                className="h-4 w-4 accent-lime"
              />
              Include page markers
            </label>
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {pages.length > 0 && (
            <div className="space-y-4">
              <OkNote>
                Extracted text from {pages.length} page{pages.length === 1 ? "" : "s"} · {wordCount} words
              </OkNote>
              <textarea
                readOnly
                value={fullText}
                rows={14}
                className={cn(inputCls, "font-mono resize-y")}
              />
              <div className="flex flex-wrap items-center gap-3">
                <CopyButton text={fullText} label="Copy all" />
                <DownloadButton
                  onClick={() => downloadBlob(new Blob([fullText], { type: "text/plain" }), `${stripExt(file.name)}-text.txt`)}
                  label="Download .txt"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── PDF → TXT ──────────────────────────────────────────────── */

function PdfToTxt() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setPages([]);
    setResult(null);
    setError(null);
  };

  const run = async () => {
    if (!file || busy) return;
    setBusy("Loading PDF…");
    setError(null);
    setPages([]);
    setResult(null);
    try {
      const pdf = await openPdf(new Uint8Array(await file.arrayBuffer()));
      const texts = await extractPdfPageTexts(pdf, (p, t) => setBusy(`Reading page ${p} of ${t}…`));
      setPages(texts);
      const text = texts
        .map((t, i) => `===== Page ${i + 1} =====\n${t}`)
        .join("\n\n");
      setResult(text);
      if (emptyText(texts)) {
        setError("Heads up: no selectable text was found — this PDF is likely a scan, so the TXT file will be empty.");
      }
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".pdf" onFiles={(fs) => setFile(fs[0])} label="Drop a PDF to convert to plain text" hint="Accepted: pdf" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={run} disabled={busy !== null}>
              Convert to TXT
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result !== null && (
            <div className="space-y-4">
              <OkNote>
                {pages.length} page{pages.length === 1 ? "" : "s"} processed · {formatBytes(new Blob([result]).size)} of text
              </OkNote>
              <textarea readOnly value={result} rows={14} className={cn(inputCls, "font-mono resize-y")} />
              <div className="flex flex-wrap items-center gap-3">
                <CopyButton text={result} label="Copy all" />
                <DownloadButton
                  onClick={() => downloadBlob(new Blob([result], { type: "text/plain" }), `${stripExt(file.name)}.txt`)}
                  label="Download .txt"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── PDF → DOCX ─────────────────────────────────────────────── */

function PdfToDocx() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setPreviewText(null);
    setError(null);
  };

  const run = async () => {
    if (!file || busy) return;
    setBusy("Loading PDF…");
    setError(null);
    setResult(null);
    setPreviewText(null);
    try {
      const pdf = await openPdf(new Uint8Array(await file.arrayBuffer()));
      const texts = await extractPdfPageTexts(pdf, (p, t) => setBusy(`Extracting page ${p} of ${t}…`));
      if (emptyText(texts)) {
        throw new Error("No selectable text found — this PDF looks like a scan, so it cannot be converted to DOCX here.");
      }
      setBusy("Building Word document…");
      const blob = await buildDocxFromText(texts, stripExt(file.name));
      setResult(blob);
      setPreviewText(texts.join("\n\n").slice(0, 4000));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".pdf" onFiles={(fs) => setFile(fs[0])} label="Drop a PDF to convert to Word" hint="Accepted: pdf" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={run} disabled={busy !== null}>
              Convert to DOCX
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          <BehaviorNote>
            The .docx contains your PDF&apos;s text as flowing paragraphs (one section per page). Original fonts,
            columns, tables and images are not preserved — this is a text conversion, not a pixel-perfect layout clone.
          </BehaviorNote>
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && (
            <div className="space-y-4">
              <OkNote>
                Word document ready · {formatBytes(result.size)}
              </OkNote>
              {previewText && (
                <textarea readOnly value={previewText} rows={10} className={cn(inputCls, "font-mono resize-y")} />
              )}
              <DownloadButton onClick={() => downloadBlob(result, `${stripExt(file.name)}.docx`)} label="Download .docx" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── PDF → Excel ────────────────────────────────────────────── */

function detectTableRows(pages: string[]): string[][] {
  const rows: string[][] = [];
  pages.forEach((pageText, pageIndex) => {
    for (const rawLine of pageText.split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;
      const cells = line
        .split(/\t|\s{2,}/)
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      rows.push([String(pageIndex + 1), ...(cells.length > 0 ? cells : [line])]);
    }
  });
  return rows;
}

function PdfToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [rows, setRows] = useState<string[][]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setRows([]);
    setError(null);
  };

  const run = async () => {
    if (!file || busy) return;
    setBusy("Loading PDF…");
    setError(null);
    setResult(null);
    setRows([]);
    try {
      const pdf = await openPdf(new Uint8Array(await file.arrayBuffer()));
      const texts = await extractPdfPageTexts(pdf, (p, t) => setBusy(`Reading page ${p} of ${t}…`));
      if (emptyText(texts)) {
        throw new Error("No selectable text found — this PDF looks like a scan, so there is nothing to export.");
      }
      setBusy("Detecting table rows…");
      const detected = detectTableRows(texts);
      if (detected.length === 0) throw new Error("No text rows found to export.");
      const maxCols = Math.max(...detected.map((r) => r.length));
      const header = ["Page", ...Array.from({ length: maxCols - 1 }, (_, i) => `Column ${i + 1}`)];
      const aoa = [header, ...detected];
      setRows(detected.slice(0, 10));
      setBusy("Building workbook…");
      const blob = await buildXlsxFromAoa(aoa, "PDF Data");
      setResult(blob);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".pdf" onFiles={(fs) => setFile(fs[0])} label="Drop a PDF to export as Excel" hint="Accepted: pdf" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={run} disabled={busy !== null}>
              Export to Excel
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          <BehaviorNote>
            Column boundaries are inferred from wide gaps (2+ spaces or tabs) in the PDF text layer. Cleanly aligned
            tables split well; free-flowing paragraphs land in a single column. Scanned PDFs without text cannot be
            exported.
          </BehaviorNote>
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && (
            <div className="space-y-4">
              <OkNote>Workbook ready · {formatBytes(result.size)} · preview of the first rows:</OkNote>
              <div className="overflow-x-auto rounded-lg border border-[#121212]/12">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212]/10 text-muted">
                    <tr>
                      <th className="px-3 py-2">Page</th>
                      <th className="px-3 py-2">Cells…</th>
                    </tr>
                  </thead>
                  <tbody className="text-cream">
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-[#121212]/12">
                        <td className="px-3 py-1.5 text-muted">{r[0]}</td>
                        <td className="px-3 py-1.5">{r.slice(1).join("  |  ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DownloadButton onClick={() => downloadBlob(result, `${stripExt(file.name)}.xlsx`)} label="Download .xlsx" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── PDF → PowerPoint ───────────────────────────────────────── */

function PdfToPowerpoint() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setPreview(null);
    setError(null);
  };

  const run = async () => {
    if (!file || busy) return;
    setBusy("Loading PDF…");
    setError(null);
    setResult(null);
    setPreview(null);
    try {
      const pdf = await openPdf(new Uint8Array(await file.arrayBuffer()));
      const slides: PptxSlideImage[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        setBusy(`Rendering slide ${i} of ${pdf.numPages}…`);
        const page = await pdf.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.max(0.5, Math.min(1600 / Math.max(base.width, base.height), 2));
        const canvas = await renderPageToCanvas(page, scale);
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.85);
        slides.push({
          data: `image/jpeg;base64,${bytesToBase64(new Uint8Array(await blob.arrayBuffer()))}`,
          width: base.width,
          height: base.height,
        });
      }
      setBusy("Building PowerPoint deck…");
      const blob = await buildPptxFromImages(slides);
      setResult(blob);
      setBusy("Creating preview…");
      setPreview(await renderPdfPageToDataUrl(new Uint8Array(await file.arrayBuffer()), 1, 1));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".pdf" onFiles={(fs) => setFile(fs[0])} label="Drop a PDF to turn into a deck" hint="Accepted: pdf" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={run} disabled={busy !== null}>
              Create PowerPoint
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          <BehaviorNote>
            Each PDF page is placed as a full-slide picture on a 16:9 slide (one slide per page, page aspect kept and
            letterboxed). Slide content is not editable as text in PowerPoint.
          </BehaviorNote>
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && (
            <div className="space-y-4">
              <OkNote>Deck ready · {formatBytes(result.size)}</OkNote>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="First slide preview" className="max-h-72 rounded-xl border border-[#121212]/12" />
              )}
              <DownloadButton onClick={() => downloadBlob(result, `${stripExt(file.name)}.pptx`)} label="Download .pptx" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Text → PDF ─────────────────────────────────────────────── */

function TextToPdf() {
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState("11");
  const [margin, setMargin] = useState("56");
  const [pageSize, setPageSize] = useState("a4");
  const [mono, setMono] = useState(false);
  const [markdown, setMarkdown] = useState(true);
  const [result, setResult] = useState<BuiltPdf | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setText("");
    setResult(null);
    setPreview(null);
    setError(null);
  };

  const run = async () => {
    if (!text.trim() || busy) return;
    setBusy("Typesetting PDF…");
    setError(null);
    setResult(null);
    setPreview(null);
    try {
      const blocks = textToBlocks(text.replace(/\t/g, "    "), Math.max(6, Math.min(24, Number(fontSize) || 11)), markdown);
      const bytes = await buildPdfFromBlocks(blocks, {
        pageSize: pageSize as "a4" | "letter",
        marginPt: Math.max(18, Math.min(120, Number(margin) || 56)),
        mono,
        title: "BuiltByUmer document",
      });
      setResult({ bytes, pages: (await import("pdf-lib").then(({ PDFDocument }) => PDFDocument.load(bytes))).getPageCount() });
      setBusy("Creating preview…");
      setPreview(await renderPdfPageToDataUrl(bytes, 1, 1));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4">
        <Field label="Text (Markdown-style #, ## and - bullets are understood)">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder={"# Heading\n\nYour text goes here.\n\n- item one\n- item two"}
            className={cn(inputCls, "resize-y font-mono")}
          />
        </Field>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Font size">
            <input type="number" min={6} max={24} value={fontSize} onChange={(e) => setFontSize(e.target.value)} className={cn(inputCls, "w-24")} />
          </Field>
          <Field label="Margin (pt)">
            <input type="number" min={18} max={120} value={margin} onChange={(e) => setMargin(e.target.value)} className={cn(inputCls, "w-28")} />
          </Field>
          <Field label="Page size">
            <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} className={cn(inputCls, "w-36")}>
              <option value="a4">A4</option>
              <option value="letter">US Letter</option>
            </select>
          </Field>
          <PrimaryButton onClick={run} disabled={!text.trim() || busy !== null}>
            Create PDF
          </PrimaryButton>
          <ResetButton onClick={reset} />
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={mono} onChange={(e) => setMono(e.target.checked)} className="h-4 w-4 accent-lime" />
            Monospace font
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={markdown} onChange={(e) => setMarkdown(e.target.checked)} className="h-4 w-4 accent-lime" />
            Markdown-style headings &amp; bullets
          </label>
        </div>
        {busy && <BusyNote>{busy}</BusyNote>}
        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
      <div className="space-y-4">
        {result && (
          <>
            <OkNote>PDF ready · {result.pages} page{result.pages === 1 ? "" : "s"} · {formatBytes(bytesToBlob(result.bytes, PDF_MIME).size)}</OkNote>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="First page preview" className="max-h-96 rounded-xl border border-[#121212]/12" />
            )}
            <DownloadButton onClick={() => downloadBlob(bytesToBlob(result.bytes, PDF_MIME), "document.pdf")} label="Download document.pdf" />
          </>
        )}
        {!result && (
          <BehaviorNote>
            Set your text on the left, choose size, margin and page size, then create the PDF. # / ## / ### lines
            become bold headings, lines starting with &quot;- &quot; become bullets.
          </BehaviorNote>
        )}
      </div>
    </div>
  );
}

/* ── Image → DOCX ───────────────────────────────────────────── */

function ImageToDocx() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [onePerPage, setOnePerPage] = useState(true);
  const [result, setResult] = useState<Blob | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (files: File[]) => {
    setItems((prev) => [...prev, ...files.map((f) => ({ file: f, url: URL.createObjectURL(f) }))]);
    setResult(null);
  };

  const move = (index: number, delta: number) => {
    setItems((prev) => {
      const next = [...prev];
      const j = index + delta;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[j];
      next[j] = tmp;
      return next;
    });
    setResult(null);
  };

  const remove = (index: number) => {
    URL.revokeObjectURL(items[index].url);
    setItems((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const reset = () => {
    for (const it of items) URL.revokeObjectURL(it.url);
    setItems([]);
    setResult(null);
    setError(null);
  };

  const generate = async () => {
    if (items.length === 0 || busy) return;
    setBusy("Reading images…");
    setError(null);
    setResult(null);
    try {
      const decoded: DecodedImage[] = [];
      for (const it of items) {
        setBusy(`Processing ${it.file.name}…`);
        decoded.push(await decodeImageFile(it.file));
      }
      setBusy("Building Word document…");
      const blob = await buildDocxFromImages(decoded, onePerPage);
      setResult(blob);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <FileDrop
        accept=".jpg,.jpeg,.png,.webp,.gif,.bmp"
        multiple
        onFiles={addFiles}
        label="Drop images to place into a Word document"
        hint="Accepted: jpg, jpeg, png, webp, gif, bmp"
      />
      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted">{items.length} image{items.length === 1 ? "" : "s"} · inserted in this order</p>
          {items.map((it, i) => (
            <FileChip key={`${it.file.name}-${i}`} item={it} index={i} total={items.length} onMove={move} onRemove={remove} />
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={onePerPage} onChange={(e) => setOnePerPage(e.target.checked)} className="h-4 w-4 accent-lime" />
          One image per page (page break between images)
        </label>
        <PrimaryButton onClick={generate} disabled={items.length === 0 || busy !== null}>
          Create DOCX
        </PrimaryButton>
        {items.length > 0 && <ResetButton onClick={reset} />}
      </div>
      <BehaviorNote>
        Images are scaled to fit the printable page width. WEBP, GIF and BMP files are re-encoded to PNG first
        (Word&apos;s OOXML format does not accept them directly).
      </BehaviorNote>
      {busy && <BusyNote>{busy}</BusyNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {result && (
        <div className="space-y-4">
          <OkNote>Word document ready · {formatBytes(result.size)}</OkNote>
          <DownloadButton onClick={() => downloadBlob(result, "images.docx")} label="Download images.docx" />
        </div>
      )}
    </div>
  );
}

/* ── Word → PDF ─────────────────────────────────────────────── */

function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [fontSize, setFontSize] = useState("11");
  const [result, setResult] = useState<BuiltPdf | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setPreview(null);
    setError(null);
  };

  const run = async () => {
    if (!file || busy) return;
    setBusy("Reading document…");
    setError(null);
    setResult(null);
    setPreview(null);
    try {
      const mammoth = await import("mammoth");
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      setBusy("Laying out pages…");
      const blocks = await blocksFromDocxHtml(html, Math.max(8, Math.min(16, Number(fontSize) || 11)));
      const bytes = await buildPdfFromBlocks(blocks, {
        pageSize: "a4",
        marginPt: 56,
        title: stripExt(file.name),
      });
      setResult({ bytes, pages: (await import("pdf-lib").then(({ PDFDocument }) => PDFDocument.load(bytes))).getPageCount() });
      setBusy("Creating preview…");
      setPreview(await renderPdfPageToDataUrl(bytes, 1, 1));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop accept=".docx" onFiles={(fs) => setFile(fs[0])} label="Drop a Word document to convert to PDF" hint="Accepted: docx" />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Body font size">
              <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className={cn(inputCls, "w-40")}>
                <option value="10">10 pt</option>
                <option value="11">11 pt</option>
                <option value="12">12 pt</option>
              </select>
            </Field>
            <PrimaryButton onClick={run} disabled={busy !== null}>
              Convert to PDF
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          <BehaviorNote>
            Headings, paragraphs, bulleted/numbered lists, tables (flattened to text) and embedded images are converted
            onto A4 pages. Fonts, colours, columns, headers/footers and other advanced formatting are simplified — the
            conversion re-flows the content rather than copying the exact layout.
          </BehaviorNote>
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {result && (
            <div className="space-y-4">
              <OkNote>
                PDF ready · {result.pages} page{result.pages === 1 ? "" : "s"} · {formatBytes(bytesToBlob(result.bytes, PDF_MIME).size)}
              </OkNote>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="First page preview" className="max-h-72 rounded-xl border border-[#121212]/12" />
              )}
              <DownloadButton onClick={() => downloadBlob(bytesToBlob(result.bytes, PDF_MIME), `${stripExt(file.name)}.pdf`)} label="Download .pdf" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── PDF metadata viewer ────────────────────────────────────── */

interface MetaRow {
  label: string;
  value: string;
}

function PdfMetadataViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<MetaRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setRows([]);
    setError(null);
  };

  const run = async () => {
    if (!file || busy) return;
    setBusy("Reading metadata…");
    setError(null);
    setRows([]);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), {
        ignoreEncryption: true,
        updateMetadata: false,
      });
      const out: MetaRow[] = [];
      const add = (label: string, value: string | number | undefined | null) => {
        out.push({ label, value: value === undefined || value === null || String(value).length === 0 ? "—" : String(value) });
      };
      add("File", `${file.name} (${formatBytes(file.size)})`);
      add("Pages", pdf.getPageCount());
      add("Title", pdf.getTitle());
      add("Author", pdf.getAuthor());
      add("Subject", pdf.getSubject());
      add("Keywords", pdf.getKeywords());
      add("Creator", pdf.getCreator());
      add("Producer", pdf.getProducer());
      add("Created", pdf.getCreationDate()?.toLocaleString());
      add("Modified", pdf.getModificationDate()?.toLocaleString());
      const sizes = new Map<string, number>();
      for (const page of pdf.getPages()) {
        const { width, height } = page.getSize();
        const key = `${Math.round(width)} × ${Math.round(height)} pt`;
        sizes.set(key, (sizes.get(key) ?? 0) + 1);
      }
      for (const [key, count] of sizes) {
        add("Page size", count === 1 ? key : `${key} (${count} pages)`);
      }
      setRows(out);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop
          accept=".pdf"
          onFiles={(fs) => setFile(fs[0])}
          label="Drop a PDF to inspect its metadata"
          hint="Accepted: pdf"
        />
      )}
      {file && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={run} disabled={busy !== null}>
              Read metadata
            </PrimaryButton>
            <ResetButton onClick={reset} />
          </div>
          <FileMeta file={file} />
          {busy && <BusyNote>{busy}</BusyNote>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {rows.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-[#121212]/12">
              {rows.map((row, i) => (
                <div
                  key={row.label + i}
                  className={cn("flex gap-4 px-4 py-2.5 text-sm", i % 2 === 0 ? "bg-[#f6f1e6]" : "bg-[#121212]/5")}
                >
                  <span className="w-36 shrink-0 text-muted">{row.label}</span>
                  <span className="break-words text-cream">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Registry ───────────────────────────────────────────────── */

export const pdfTools: Record<string, ToolComponent> = {
  "pdf-to-jpg": makePdfToImages("jpeg", "jpg"),
  "pdf-to-png": makePdfToImages("png", "png"),
  "jpg-to-pdf": makeImagesToPdf(".jpg,.jpeg", "jpg, jpeg", "jpg-to-pdf.pdf"),
  "png-to-pdf": makeImagesToPdf(".png", "png", "png-to-pdf.pdf"),
  "webp-to-pdf": makeImagesToPdf(".webp", "webp", "webp-to-pdf.pdf", "WEBP is not natively supported by PDF, so each image is re-encoded to PNG through a canvas before embedding — visually identical, fully lossless except for the format change."),
  "image-to-pdf": makeImagesToPdf(".jpg,.jpeg,.png,.webp", "jpg, png, webp", "image-to-pdf.pdf", "JPG and PNG are embedded at full quality; WEBP images are re-encoded to PNG because PDF has no native WEBP support."),
  "merge-pdf": MergePdf,
  "split-pdf": SplitPdf,
  "compress-pdf": CompressPdf,
  "rotate-pdf": RotatePdf,
  "reorder-pages": ReorderPages,
  "delete-pages": DeletePages,
  "watermark-pdf": WatermarkPdf,
  "add-page-numbers": AddPageNumbers,
  "pdf-viewer": PdfViewer,
  "pdf-text-extractor": PdfTextExtractor,
  "pdf-to-docx": PdfToDocx,
  "pdf-to-txt": PdfToTxt,
  "pdf-to-excel": PdfToExcel,
  "pdf-to-powerpoint": PdfToPowerpoint,
  "text-to-pdf": TextToPdf,
  "image-to-docx": ImageToDocx,
  "word-to-pdf": WordToPdf,
  "pdf-metadata-viewer": PdfMetadataViewer,
};
