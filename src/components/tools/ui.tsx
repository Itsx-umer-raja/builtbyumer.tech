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
          "dropzone rounded-xl px-6 py-10 text-center cursor-pointer select-none bg-[#f6f1e6]",
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
        <Upload className="mx-auto mb-3 h-8 w-8 text-[#163D2B]" aria-hidden />
        <p className="text-sm font-medium text-cream">{label}</p>
        <p className="mt-1 text-xs text-muted">
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
        "inline-flex items-center gap-2 rounded-lg bg-lime px-5 py-2.5 text-sm font-semibold text-[#163D2B] transition hover:bg-lime-2 disabled:opacity-40 disabled:cursor-not-allowed",
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
        "inline-flex items-center gap-2 rounded-lg border border-[#121212]/15 px-5 py-2.5 text-sm font-medium text-cream transition hover:border-[#163D2B]/50 hover:text-[#163D2B] disabled:opacity-40 disabled:cursor-not-allowed",
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
      className="inline-flex items-center gap-1.5 rounded-md border border-[#121212]/15 px-3 py-1.5 text-xs font-medium text-cream transition hover:border-[#163D2B]/50 hover:text-[#163D2B]"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[#163D2B]" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}

/* ── Status ─────────────────────────────────────────────────── */

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function BusyNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 flex items-center gap-2 rounded-lg border border-[#163D2B]/25 bg-[#163D2B]/5 px-4 py-3 text-sm text-[#163D2B]">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function OkNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-lg border border-[#163D2B]/30 bg-[#163D2B]/10 px-4 py-3 text-sm text-[#163D2B]">
      <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/* ── Inputs ─────────────────────────────────────────────────── */

export const inputCls =
  "w-full rounded-lg border border-[#121212]/15 bg-white px-4 py-2.5 text-sm text-cream placeholder:text-muted focus:border-[#163D2B]/60 focus:outline-none";

export const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted";

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
