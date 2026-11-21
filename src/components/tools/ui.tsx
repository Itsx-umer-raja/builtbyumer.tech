"use client";

import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { Upload, Check, Copy, AlertCircle, Loader2, RotateCcw, Download } from "lucide-react";
import { cn, copyToClipboard, formatBytes } from "@/lib/utils";

/* ── File drop / browse ─────────────────────────────────────── */
/* Phase 7: V8 dark cinematic restyle. Same props, same
   validation, same keyboard contract (role=button, tabIndex,
   Enter/Space) — only the palette changed. The dashed border
   and drag-over state live in .route-145 .dropzone in
   globals.css; the fills below are explicit --v8-* colours. */

export function FileDrop({
  accept,
  multiple = false,
  onFiles,
  label = "Drop files here or click to browse",
  hint,
  maxSizeMb = 100,
}: {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
  maxSizeMb?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const files = Array.from(list);
      const limit = maxSizeMb * 1024 * 1024;
      const bad = files.find((f) => f.size > limit);
      if (bad) {
        setError(
          `"${bad.name}" is ${formatBytes(bad.size)} — the limit is ${maxSizeMb} MB.`,
        );
        return;
      }
      setError(null);
      onFiles(multiple ? files : [files[0]]);
    },
    [multiple, onFiles, maxSizeMb],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handle(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "dropzone rounded-xl bg-[var(--v8-bg-2)] px-6 py-10 text-center cursor-pointer select-none",
          drag && "drag",
        )}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        <Upload className="mx-auto mb-3 h-8 w-8 text-[var(--v8-accent-2)]" aria-hidden />
        <p className="text-sm font-medium text-[var(--v8-text)]">{label}</p>
        <p className="mt-1 text-xs text-[var(--v8-muted)]">
          {hint ?? `Accepted: ${accept.replace(/\./g, "").split(",").join(", ")}`}
          {" · "}
          {`Max ${maxSizeMb} MB per file`}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            handle(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
    </div>
  );
}

/* ── Buttons ────────────────────────────────────────────────── */
/* Phase 7: V8 system. Primary = .v8-btn-primary (violet fill,
   near-black text); Secondary = .v8-btn-ghost (hairline).
   Same exports, same props, same disabled contract. */

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "v8-btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition hover:bg-[var(--v8-highlight)] disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "v8-btn-ghost inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DownloadButton({
  onClick,
  label = "Download",
  disabled,
}: {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <PrimaryButton onClick={onClick} disabled={disabled}>
      <Download className="h-4 w-4" aria-hidden />
      {label}
    </PrimaryButton>
  );
}

export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <SecondaryButton onClick={onClick}>
      <RotateCcw className="h-4 w-4" aria-hidden />
      Reset
    </SecondaryButton>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        copyToClipboard(text)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => {})
      }
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--v8-line-strong)] px-3 py-1.5 text-xs font-medium text-[var(--v8-text)] transition hover:border-[var(--v8-accent)] hover:text-[var(--v8-highlight)]"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[var(--v8-accent-2)]" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}

/* ── Status ─────────────────────────────────────────────────── */
/* Phase 7: V8 system. Errors stay honest and visible — red on
   dark, role="alert". Busy/Ok use the V8 neutrals + cyan
   (there is no green in the V8 palette); nothing here ever
   fakes a success state. */

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function BusyNote({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] px-4 py-3 text-sm text-[var(--v8-muted)]">
      <Loader2 className="h-4 w-4 animate-spin text-[var(--v8-accent-2)]" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function OkNote({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--v8-accent-2)]/30 bg-[var(--v8-accent-2)]/10 px-4 py-3 text-sm text-[var(--v8-accent-2)]">
      <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/* ── Inputs ─────────────────────────────────────────────────── */
/* Phase 7: V8 dark fields — raised-surface background, hairline
   border, violet focus border + soft focus ring. Muted text
   #A3A9BD on #070912 is AAA, per the V8 system. */

export const inputCls =
  "w-full rounded-lg border border-[var(--v8-line-strong)] bg-[var(--v8-bg)] px-4 py-2.5 text-sm text-[var(--v8-text)] placeholder:text-[var(--v8-muted)] focus:border-[var(--v8-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--v8-accent)]/40";

export const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--v8-muted)]";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 8,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      spellCheck={false}
      className={cn(inputCls, "font-mono resize-y", className)}
    />
  );
}
