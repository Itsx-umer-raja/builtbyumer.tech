"use client";

import type { ToolComponent } from "./registry";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toCanvas } from "qrcode";
import jsQR from "jsqr";
import JsBarcode from "jsbarcode";
import { QrCode, ScanLine, Camera, ShieldCheck, Wifi, MessageCircle, CircleUser, Mail, Smartphone, Barcode as BarcodeIcon } from "lucide-react";
import {
  BusyNote,
  CopyButton,
  ErrorNote,
  Field,
  OkNote,
  PrimaryButton,
  ResetButton,
  SecondaryButton,
  TextArea,
  inputCls,
  labelCls,
} from "./ui";
import { cn, downloadBlob } from "@/lib/utils";
import { decodeBarcode1D } from "@/lib/qr/barcode1d";
import {
  getImageData,
  imageFileFromClipboard,
  loadImageFromBlob,
} from "@/lib/qr/decode-image";

/* ══ Shared bits ══════════════════════════════════════════════ */
/* Phase 7: V8 dark restyle of the shared QR-family chrome only
   (PrivacyNote, PayloadBox via inputCls, QrGenerator preview
   panel + colour swatches, FileDropArea, ImageDecodeTool hint).
   Payload builders, decoding and download logic are untouched.
   The QR canvas itself keeps its own light background (chosen
   by the user, default white) so codes stay scannable. */

function PrivacyNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--v8-line)] bg-[var(--v8-bg-2)] px-4 py-3 text-xs text-[var(--v8-muted)]">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--v8-accent-2)]" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

function PayloadBox({ payload }: { payload: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className={labelCls + " !mb-0"}>Encoded payload</label>
        <CopyButton text={payload} />
      </div>
      <textarea
        readOnly
        value={payload}
        rows={4}
        spellCheck={false}
        className={cn(inputCls, "font-mono resize-y break-all")}
      />
    </div>
  );
}

/* ══ Shared QR generator (used by the 7 generator tools) ══════ */

type FieldType = "text" | "tel" | "url" | "email" | "textarea" | "select";

interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  /** Render full-width (textareas). */
  wide?: boolean;
}

interface QrToolConfig {
  fields: FieldDef[];
  defaults: Record<string, string>;
  /** Builds the QR payload. Returns "" for "not enough input yet", throws for validation errors. */
  build: (values: Record<string, string>) => string;
  fileBase: string;
  icon: ReactNode;
}

type EcLevel = "L" | "M" | "Q" | "H";

function QrField({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  if (def.type === "textarea") {
    return (
      <Field label={def.label}>
        <TextArea value={value} onChange={onChange} placeholder={def.placeholder} rows={4} />
      </Field>
    );
  }
  if (def.type === "select") {
    return (
      <Field label={def.label}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        >
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    );
  }
  return (
    <Field label={def.label}>
      <input
        type={def.type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={def.placeholder}
        className={inputCls}
        spellCheck={false}
      />
    </Field>
  );
}

const selectFrom = (options: Array<{ value: string; label: string }>) => ({
  type: "select" as const,
  options,
});

function QrGenerator({ config }: { config: QrToolConfig }) {
  const [values, setValues] = useState<Record<string, string>>(config.defaults);
  const [size, setSize] = useState("384");
  const [ec, setEc] = useState<EcLevel>("M");
  const [margin, setMargin] = useState("4");
  const [dark, setDark] = useState("#000000");
  const [light, setLight] = useState("#ffffff");
  const [drawError, setDrawError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const payload = useMemo(() => {
    try {
      return { text: config.build(values), error: null as string | null };
    } catch (e) {
      return { text: "", error: e instanceof Error ? e.message : String(e) };
    }
  }, [config, values]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload.text) return;
    let cancelled = false;
    toCanvas(canvas, payload.text, {
      errorCorrectionLevel: ec,
      margin: Number(margin),
      width: Number(size),
      color: { dark, light },
    }).then(
      () => {
        if (!cancelled) setDrawError(null);
      },
      (err: unknown) => {
        if (!cancelled) {
          setDrawError(err instanceof Error ? err.message : "Could not render the QR code.");
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [payload.text, ec, margin, size, dark, light]);

  const set = (key: string) => (v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const reset = () => {
    setValues(config.defaults);
    setSize("384");
    setEc("M");
    setMargin("4");
    setDark("#000000");
    setLight("#ffffff");
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !payload.text) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${config.fileBase}.png`);
    }, "image/png");
  };

  const ready = Boolean(payload.text) && !payload.error;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="grid gap-4 sm:grid-cols-2">
          {config.fields.map((f) => (
            <div key={f.key} className={cn(f.wide && "sm:col-span-2")}>
              <QrField def={f} value={values[f.key] ?? ""} onChange={set(f.key)} />
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Size">
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className={inputCls}
            >
              <option value="256">256 px</option>
              <option value="384">384 px</option>
              <option value="512">512 px</option>
              <option value="768">768 px</option>
            </select>
          </Field>
          <Field label="Error correction">
            <select
              value={ec}
              onChange={(e) => setEc(e.target.value as EcLevel)}
              className={inputCls}
            >
              <option value="L">Low (~7%)</option>
              <option value="M">Medium (~15%)</option>
              <option value="Q">Quartile (~25%)</option>
              <option value="H">High (~30%)</option>
            </select>
          </Field>
          <Field label="Quiet zone">
            <select
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              className={inputCls}
            >
              <option value="0">None</option>
              <option value="2">Small (2)</option>
              <option value="4">Standard (4)</option>
              <option value="6">Large (6)</option>
            </select>
          </Field>
          <div className="flex items-end gap-4">
            <Field label="Foreground">
              <input
                type="color"
                value={dark}
                onChange={(e) => setDark(e.target.value)}
                className="h-[42px] w-16 cursor-pointer rounded-lg border border-[var(--v8-line-strong)] bg-transparent p-1"
                aria-label="Foreground colour"
              />
            </Field>
            <Field label="Background">
              <input
                type="color"
                value={light}
                onChange={(e) => setLight(e.target.value)}
                className="h-[42px] w-16 cursor-pointer rounded-lg border border-[var(--v8-line-strong)] bg-transparent p-1"
                aria-label="Background colour"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ResetButton onClick={reset} />
        </div>
      </div>

      <div>
        <div className="mb-3 flex min-h-[260px] items-center justify-center rounded-xl border border-[var(--v8-line)] bg-[var(--v8-bg-2)] p-6">
          {ready ? (
            <canvas
              ref={canvasRef}
              className="h-auto max-w-full rounded-lg bg-white"
              style={{ width: "min(100%, " + size + "px)", imageRendering: "pixelated" }}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center text-[var(--v8-muted)]">
              {config.icon}
              <p className="max-w-xs text-sm">
                Fill in the fields on the left — the QR code appears here as you type.
              </p>
            </div>
          )}
        </div>

        {payload.error && <ErrorNote>{payload.error}</ErrorNote>}
        {ready && drawError && <ErrorNote>{drawError}</ErrorNote>}

        {ready && (
          <>
            <PayloadBox payload={payload.text} />
            <div className="mt-3">
              <PrimaryButton onClick={downloadPng}>Download PNG</PrimaryButton>
            </div>
          </>
        )}

        <PrivacyNote>
          Generated entirely in your browser — nothing you type is sent to any server.
          Downloaded PNGs use your chosen colours and can be printed or embedded freely.
        </PrivacyNote>
      </div>
    </div>
  );
}

/* ── Payload builders ───────────────────────────────────────── */

function requireValue(values: Record<string, string>, key: string, message: string): string {
  const v = values[key]?.trim() ?? "";
  if (!v) throw new Error(message);
  return v;
}

/* ══ qr-code-generator ════════════════════════════════════════ */

const TEXT_QR_CONFIG: QrToolConfig = {
  fileBase: "qr-code",
  icon: <QrCode className="h-10 w-10 text-[var(--v8-accent-2)]" aria-hidden />,
  fields: [
    {
      key: "text",
      label: "Text or link",
      type: "textarea",
      wide: true,
      placeholder: "Any text, link, message — whatever you want to encode.",
    },
  ],
  defaults: { text: "" },
  build: (v) => {
    const text = requireValue(v, "text", "Enter some text to encode.");
    return text;
  },
};

/* ══ url-qr-generator ═════════════════════════════════════════ */

const URL_QR_CONFIG: QrToolConfig = {
  fileBase: "url-qr",
  icon: <QrCode className="h-10 w-10 text-[var(--v8-accent-2)]" aria-hidden />,
  fields: [
    {
      key: "url",
      label: "Web address",
      type: "url",
      wide: true,
      placeholder: "example.com/page — https:// is added automatically",
    },
  ],
  defaults: { url: "" },
  build: (v) => {
    let url = requireValue(v, "url", "Enter a web address to encode.");
    if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = `https://${url}`;
    try {
      return new URL(url).toString();
    } catch {
      throw new Error("That does not look like a valid URL.");
    }
  },
};

/* ══ wifi-qr-generator ════════════════════════════════════════ */

/** Escape the reserved characters of the WIFI: URI format. */
function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

const WIFI_QR_CONFIG: QrToolConfig = {
  fileBase: "wifi-qr",
  icon: <Wifi className="h-10 w-10 text-[var(--v8-accent-2)]" aria-hidden />,
  fields: [
    { key: "ssid", label: "Network name (SSID)", placeholder: "MyNetwork" },
    {
      ...selectFrom([
        { value: "WPA", label: "WPA / WPA2 / WPA3" },
        { value: "WEP", label: "WEP (legacy)" },
        { value: "nopass", label: "Open (no password)" },
      ]),
      key: "security",
      label: "Security",
    },
    { key: "password", label: "Password", placeholder: "Network password" },
    {
      ...selectFrom([
        { value: "no", label: "Visible network" },
        { value: "yes", label: "Hidden network" },
      ]),
      key: "hidden",
      label: "Visibility",
    },
  ],
  defaults: { ssid: "", password: "", security: "WPA", hidden: "no" },
  build: (v) => {
    const ssid = requireValue(v, "ssid", "Enter the network name (SSID).");
    const security = v.security || "WPA";
    let payload = `WIFI:T:${security};S:${escapeWifi(ssid)};`;
    if (security !== "nopass") {
      const password = getString(v, "password");
      if (!password) throw new Error("Enter the network password.");
      payload += `P:${escapeWifi(password)};`;
    }
    if (v.hidden === "yes") payload += "H:true;";
    return payload + ";";
  },
};

// Tiny helper so the builder stays readable without extra indirection.
function getString(values: Record<string, string>, key: string): string {
  return values[key] ?? "";
}

/* ══ whatsapp-qr-generator ════════════════════════════════════ */

const WHATSAPP_QR_CONFIG: QrToolConfig = {
  fileBase: "whatsapp-qr",
  icon: <MessageCircle className="h-10 w-10 text-[var(--v8-accent-2)]" aria-hidden />,
  fields: [
    {
      key: "phone",
      label: "Number (with country code, digits only)",
      type: "tel",
      placeholder: "e.g. 15551234567",
    },
    {
      key: "message",
      label: "Pre-filled message (optional)",
      type: "textarea",
      wide: true,
      placeholder: "Hi! I scanned your QR code…",
    },
  ],
  defaults: { phone: "", message: "" },
  build: (v) => {
    const digits = requireValue(v, "phone", "Enter the WhatsApp number (with country code).").replace(
      /\D/g,
      "",
    );
    if (!digits) throw new Error("The number must contain digits.");
    const message = getString(v, "message").trim();
    return message
      ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${digits}`;
  },
};

/* ══ contact-qr-generator (vCard 3.0) ═════════════════════════ */

function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const CONTACT_QR_CONFIG: QrToolConfig = {
  fileBase: "contact-qr",
  icon: <CircleUser className="h-10 w-10 text-[var(--v8-accent-2)]" aria-hidden />,
  fields: [
    { key: "firstName", label: "First name", placeholder: "Umer" },
    { key: "lastName", label: "Last name", placeholder: "Raja" },
    { key: "org", label: "Organisation (optional)", placeholder: "BuiltByUmer" },
    { key: "title", label: "Job title (optional)", placeholder: "Developer" },
    { key: "phone", label: "Phone (optional)", type: "tel", placeholder: "+1 555 123 4567" },
    { key: "email", label: "Email (optional)", type: "email", placeholder: "you@example.com" },
    { key: "website", label: "Website (optional)", type: "url", placeholder: "https://…" },
    {
      key: "note",
      label: "Note (optional)",
      type: "textarea",
      wide: true,
      placeholder: "Anything you want stored with the contact.",
    },
  ],
  defaults: {
    firstName: "",
    lastName: "",
    org: "",
    title: "",
    phone: "",
    email: "",
    website: "",
    note: "",
  },
  build: (v) => {
    const first = getString(v, "firstName").trim();
    const last = getString(v, "lastName").trim();
    if (!first && !last) throw new Error("Enter at least a first or last name.");
    const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${escapeVCard(last)};${escapeVCard(first)};;;`];
    const fn = [first, last].filter(Boolean).join(" ");
    lines.push(`FN:${escapeVCard(fn)}`);
    const org = getString(v, "org").trim();
    if (org) lines.push(`ORG:${escapeVCard(org)}`);
    const title = getString(v, "title").trim();
    if (title) lines.push(`TITLE:${escapeVCard(title)}`);
    const phone = getString(v, "phone").trim();
    if (phone) lines.push(`TEL;TYPE=CELL:${escapeVCard(phone)}`);
    const email = getString(v, "email").trim();
    if (email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(email)}`);
    const website = getString(v, "website").trim();
    if (website) lines.push(`URL:${escapeVCard(website)}`);
    const note = getString(v, "note").trim();
    if (note) lines.push(`NOTE:${escapeVCard(note)}`);
    lines.push("END:VCARD");
    return lines.join("\n");
  },
};

/* ══ email-qr-generator ═══════════════════════════════════════ */

const EMAIL_QR_CONFIG: QrToolConfig = {
  fileBase: "email-qr",
  icon: <Mail className="h-10 w-10 text-[var(--v8-accent-2)]" aria-hidden />,
  fields: [
    { key: "to", label: "Recipient", type: "email", placeholder: "you@example.com" },
    { key: "subject", label: "Subject (optional)", placeholder: "Hello!" },
    {
      key: "body",
      label: "Body (optional)",
      type: "textarea",
      wide: true,
      placeholder: "Pre-fill the email body…",
    },
  ],
  defaults: { to: "", subject: "", body: "" },
  build: (v) => {
    const to = requireValue(v, "to", "Enter the recipient email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new Error("Enter a valid email address.");
    }
    const params = new URLSearchParams();
    const subject = getString(v, "subject").trim();
    if (subject) params.set("subject", subject);
    const body = getString(v, "body");
    if (body.trim()) params.set("body", body);
    const query = params.toString();
    return query ? `mailto:${to}?${query}` : `mailto:${to}`;
  },
};

/* ══ phone-qr-generator ═══════════════════════════════════════ */

const PHONE_QR_CONFIG: QrToolConfig = {
  fileBase: "phone-qr",
  icon: <Smartphone className="h-10 w-10 text-[var(--v8-accent-2)]" aria-hidden />,
  fields: [
    {
      key: "phone",
      label: "Phone number",
      type: "tel",
      wide: true,
      placeholder: "+1 555 123 4567",
    },
  ],
  defaults: { phone: "" },
  build: (v) => {
    const phone = requireValue(v, "phone", "Enter a phone number to dial.");
    const cleaned = phone.replace(/\s+/g, "");
    if (!/\+?\d/.test(cleaned)) throw new Error("The number must contain digits.");
    return `tel:${cleaned}`;
  },
};

/* ══ Shared image-decode UI (qr-code-scanner / barcode-scanner) ══ */

type DecodeResult = { text: string; format: string };

function ImageDecodeTool({
  decode,
  emptyMessage,
  formatsHint,
}: {
  decode: (data: ImageData) => DecodeResult | null;
  emptyMessage: string;
  formatsHint: string;
}) {
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setBusy(true);
      setError(null);
      setResult(null);
      try {
        const img = await loadImageFromBlob(file);
        const data = getImageData(img);
        const found = data ? decode(data) : null;
        if (found) setResult(found);
        else setError(emptyMessage);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not read that image.");
      } finally {
        setBusy(false);
      }
      // Show a small preview and clean up the previous object URL.
      const url = URL.createObjectURL(file);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = url;
      setPreviewUrl(url);
    },
    [decode, emptyMessage],
  );

  // Support pasting images straight from the clipboard.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = imageFileFromClipboard(e.clipboardData);
      if (file) void handleFiles([file]);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  // Revoke the preview object URL on unmount.
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const reset = () => {
    setResult(null);
    setError(null);
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreviewUrl(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <FileDropArea onFiles={(files) => void handleFiles(files)} />
        <p className="mt-2 text-xs text-[var(--v8-muted)]">{formatsHint} You can also paste an image with Ctrl+V.</p>
        {previewUrl && (
          <div className="mt-4">
            <label className={labelCls}>Scanned image</label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Uploaded scan"
              className="max-h-56 rounded-lg border border-[#121212]/12"
            />
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SecondaryButton onClick={reset}>
            Reset
          </SecondaryButton>
        </div>
        {busy && <BusyNote>Decoding…</BusyNote>}
        {error && <ErrorNote>{error}</ErrorNote>}
      </div>

      <div>
        {result ? (
          <>
            <div className="mb-1.5 flex items-center justify-between">
              <label className={labelCls + " !mb-0"}>Decoded content</label>
              <CopyButton text={result.text} />
            </div>
            <textarea
              readOnly
              value={result.text}
              rows={8}
              spellCheck={false}
              className={cn(inputCls, "font-mono resize-y break-all")}
            />
            <p className="mt-2 text-xs text-[var(--v8-muted)]">
              Symbology: <span className="font-semibold text-[var(--v8-accent-2)]">{result.format}</span>
            </p>
            <OkNote>Decoded successfully — everything stayed on your device.</OkNote>
          </>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-[var(--v8-line)] bg-[var(--v8-bg-2)] p-6 text-center text-[var(--v8-muted)]">
            <ScanLine className="h-10 w-10 text-[var(--v8-accent-2)]" aria-hidden />
            <p className="max-w-xs text-sm">
              Drop in a photo or screenshot and the decoded value appears here.
            </p>
          </div>
        )}
        <PrivacyNote>
          Your image is decoded locally in the browser — it is never uploaded anywhere.
        </PrivacyNote>
      </div>
    </div>
  );
}

/* Minimal inline drop area (image files only). */
function FileDropArea({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
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
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (e.dataTransfer.files.length > 0) onFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <ScanLine className="mx-auto mb-3 h-8 w-8 text-[var(--v8-accent-2)]" aria-hidden />
      <p className="text-sm font-medium text-[var(--v8-text)]">Drop an image here or click to browse</p>
      <p className="mt-1 text-xs text-[var(--v8-muted)]">Accepted: PNG, JPG, WEBP, GIF · Max 100 MB</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) onFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ══ qr-code-scanner ══════════════════════════════════════════ */

const decodeQrImage = (data: ImageData): DecodeResult | null => {
  const code = jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });
  return code ? { text: code.data, format: "QR Code" } : null;
};

function QrCodeScanner() {
  return (
    <ImageDecodeTool
      decode={decodeQrImage}
      emptyMessage="No QR code found in that image. Make sure the whole code is visible, sharp and evenly lit."
      formatsHint="Scans standard QR codes."
    />
  );
}

/* ══ barcode-scanner ══════════════════════════════════════════ */

const decodeBarcodeImage = (data: ImageData): DecodeResult | null => {
  const barcode = decodeBarcode1D(data);
  if (barcode) return { text: barcode.text, format: barcode.format };
  // Bonus: some product shots contain a QR code instead of a 1D barcode.
  const qr = jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });
  return qr ? { text: qr.data, format: "QR Code" } : null;
};

function BarcodeScanner() {
  return (
    <ImageDecodeTool
      decode={decodeBarcodeImage}
      emptyMessage="No supported barcode found (EAN-13, UPC-A, EAN-8, Code 128, Code 39). Try a sharper, well-lit photo taken straight on."
      formatsHint="Reads EAN-13, UPC-A, EAN-8, Code 128 and Code 39."
    />
  );
}

/* ══ camera-qr-scanner ════════════════════════════════════════ */

function CameraQrScanner() {
  const [phase, setPhase] = useState<
    "idle" | "starting" | "scanning" | "found" | "denied" | "error"
  >("idle");
  const [result, setResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Continuous jsQR scanning on video frames while the camera is live.
  // The rAF loop lives in an effect so it is always cancelled on phase
  // change or unmount.
  useEffect(() => {
    if (phase !== "scanning") return;
    let raf = 0;
    const loop = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        if (!workCanvasRef.current) workCanvasRef.current = document.createElement("canvas");
        const data = getImageData(video, 640);
        if (data) {
          const code = jsQR(data.data, data.width, data.height, {
            inversionAttempts: "attemptBoth",
          });
          if (code && code.data) {
            setResult(code.data);
            setPhase("found");
            stopCamera(); // stop streaming once a code is read
            return;
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, stopCamera]);

  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("error");
      setErrorMsg("This browser does not support camera access.");
      return;
    }
    if (!window.isSecureContext) {
      setPhase("error");
      setErrorMsg(
        "Camera access only works on HTTPS or localhost. Open this page over a secure connection.",
      );
      return;
    }
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          /* autoplay rejection is harmless; the stream is still live */
        }
      }
      setPhase("scanning");
    } catch (err) {
      const e = err as DOMException;
      if (e.name === "NotAllowedError" || e.name === "SecurityError") {
        setPhase("denied");
        setErrorMsg(
          "Camera permission was denied. Allow camera access in your browser settings and try again.",
        );
      } else if (e.name === "NotFoundError" || e.name === "OverconstrainedError") {
        setPhase("error");
        setErrorMsg("No usable camera was found on this device.");
      } else {
        setPhase("error");
        setErrorMsg(e.message || "Could not start the camera.");
      }
    }
  }, []);

  // Always stop tracks on unmount.
  useEffect(() => stopCamera, [stopCamera]);

  const showVideo = phase === "starting" || phase === "scanning";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-xl border border-[#121212]/12 bg-white">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className={cn("w-full max-w-md rounded-xl", !showVideo && "hidden")}
          />
          {!showVideo && (
            <div className="flex flex-col items-center gap-3 p-6 text-center text-muted">
              <Camera className="h-10 w-10 text-[#163D2B]" aria-hidden />
              <p className="max-w-xs text-sm">
                {phase === "found"
                  ? "Code captured — the camera has been stopped."
                  : "Point your camera at a QR code to scan it live."}
              </p>
            </div>
          )}
          {phase === "scanning" && (
            <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-[#163D2B]/60" />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {phase === "scanning" ? (
            <SecondaryButton
              onClick={() => {
                stopCamera();
                setPhase("idle");
              }}
            >
              Stop camera
            </SecondaryButton>
          ) : (
            <PrimaryButton onClick={() => void startCamera()} disabled={phase === "starting"}>
              {phase === "found" ? "Scan again" : "Start camera"}
            </PrimaryButton>
          )}
        </div>

        {(phase === "starting" || phase === "scanning") && (
          <BusyNote>
            {phase === "starting" ? "Starting camera…" : "Looking for a QR code…"}
          </BusyNote>
        )}
        {errorMsg && <ErrorNote>{errorMsg}</ErrorNote>}
      </div>

      <div>
        {phase === "found" && result ? (
          <>
            <div className="mb-1.5 flex items-center justify-between">
              <label className={labelCls + " !mb-0"}>Decoded content</label>
              <CopyButton text={result} />
            </div>
            <textarea
              readOnly
              value={result}
              rows={8}
              spellCheck={false}
              className={cn(inputCls, "font-mono resize-y break-all")}
            />
            <OkNote>Code captured — the camera was stopped immediately.</OkNote>
          </>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-[#121212]/12 bg-white p-6 text-center text-muted">
            <ScanLine className="h-10 w-10 text-[#163D2B]" aria-hidden />
            <p className="max-w-xs text-sm">
              Hold a QR code steady in front of the camera until it locks on.
            </p>
          </div>
        )}
        <PrivacyNote>
          Frames are analysed on your device in real time and never leave the browser. Live
          camera scanning requires HTTPS or localhost.
        </PrivacyNote>
      </div>
    </div>
  );
}

/* ══ barcode-generator ════════════════════════════════════════ */

const BARCODE_FORMATS = [
  { value: "CODE128", label: "Code 128 (any ASCII text)" },
  { value: "CODE39", label: "Code 39 (A-Z, 0-9, - . $ / + % space)" },
  { value: "EAN13", label: "EAN-13 (12 or 13 digits)" },
  { value: "EAN8", label: "EAN-8 (7 or 8 digits)" },
  { value: "UPC", label: "UPC-A (11 or 12 digits)" },
] as const;

function validateBarcodeText(format: string, raw: string): string | null {
  const text = raw.trim();
  if (!text) return "Enter the value to encode.";
  switch (format) {
    case "CODE128":
      if (!/^[\x20-\x7e]+$/.test(text)) return "Code 128 supports printable ASCII characters only.";
      return null;
    case "CODE39":
      if (!/^[0-9A-Z\-. $/+%]+$/i.test(text)) return "Code 39 supports A-Z, 0-9, spaces and - . $ / + %";
      return null;
    case "EAN13":
      if (!/^\d{12}$|^\d{13}$/.test(text)) return "EAN-13 needs 12 digits (check digit is computed) or all 13 digits.";
      return null;
    case "EAN8":
      if (!/^\d{7}$|^\d{8}$/.test(text)) return "EAN-8 needs 7 digits (check digit is computed) or all 8 digits.";
      return null;
    case "UPC":
      if (!/^\d{11}$|^\d{12}$/.test(text)) return "UPC-A needs 11 digits (check digit is computed) or all 12 digits.";
      return null;
    default:
      return null;
  }
}

function BarcodeGenerator() {
  const [text, setText] = useState("");
  const [format, setFormat] = useState("CODE128");
  const [barWidth, setBarWidth] = useState("2");
  const [height, setHeight] = useState("80");
  const [showValue, setShowValue] = useState(true);
  const [lineColor, setLineColor] = useState("#000000");
  const [background, setBackground] = useState("#ffffff");
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const validationError = useMemo(() => validateBarcodeText(format, text), [format, text]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || validationError || !text.trim()) return;
    // JsBarcode reports validity through the callback instead of throwing.
    JsBarcode(canvas, text.trim(), {
      format,
      width: Number(barWidth),
      height: Number(height),
      displayValue: showValue,
      lineColor,
      background,
      margin: 10,
      fontSize: 16,
      valid: (valid: boolean) => {
        setError(
          valid
            ? null
            : "That value is not valid for this symbology (check digit mismatch?). Try entering the digits without the final check digit.",
        );
      },
    });
  }, [text, format, barWidth, height, showValue, lineColor, background, validationError]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || validationError) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `barcode-${format.toLowerCase()}.png`);
    }, "image/png");
  };

  const ready = Boolean(text.trim()) && !validationError && !error;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="grid gap-4">
          <Field label="Value to encode">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. BUILTBYUMER-2026 or 4006381333931"
              className={inputCls}
              spellCheck={false}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Symbology">
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className={inputCls}
              >
                {BARCODE_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Module width">
              <select
                value={barWidth}
                onChange={(e) => setBarWidth(e.target.value)}
                className={inputCls}
              >
                <option value="1">1 px</option>
                <option value="2">2 px</option>
                <option value="3">3 px</option>
                <option value="4">4 px</option>
              </select>
            </Field>
            <Field label="Height">
              <select
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className={inputCls}
              >
                <option value="50">50 px</option>
                <option value="80">80 px</option>
                <option value="120">120 px</option>
                <option value="160">160 px</option>
              </select>
            </Field>
            <div className="flex items-end gap-6">
              <Field label="Bar colour">
                <input
                  type="color"
                  value={lineColor}
                  onChange={(e) => setLineColor(e.target.value)}
                  className="h-[42px] w-16 cursor-pointer rounded-lg border border-[var(--v8-line-strong)] bg-transparent p-1"
                  aria-label="Bar colour"
                />
              </Field>
              <Field label="Background">
                <input
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="h-[42px] w-16 cursor-pointer rounded-lg border border-[var(--v8-line-strong)] bg-transparent p-1"
                  aria-label="Barcode background colour"
                />
              </Field>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--v8-text)] sm:col-span-2">
              <input
                type="checkbox"
                checked={showValue}
                onChange={(e) => setShowValue(e.target.checked)}
                className="h-4 w-4 accent-[#8b7cff]"
              />
              Show the value as human-readable text under the bars
            </label>
          </div>
          {validationError && <ErrorNote>{validationError}</ErrorNote>}
          {!validationError && error && <ErrorNote>{error}</ErrorNote>}
          <div className="flex flex-wrap items-center gap-3">
            <ResetButton
              onClick={() => {
                setText("");
                setFormat("CODE128");
                setBarWidth("2");
                setHeight("80");
                setShowValue(true);
                setLineColor("#000000");
                setBackground("#ffffff");
                setError(null);
              }}
            />
            {ready && <PrimaryButton onClick={downloadPng}>Download PNG</PrimaryButton>}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex min-h-[260px] items-center justify-center rounded-xl border border-[var(--v8-line)] bg-[var(--v8-bg-2)] p-6">
          {ready ? (
            <canvas ref={canvasRef} className="h-auto max-w-full rounded-lg bg-white" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center text-[var(--v8-muted)]">
              <BarcodeIcon className="h-10 w-10 text-[var(--v8-accent-2)]" aria-hidden />
              <p className="max-w-xs text-sm">
                Enter a value and pick a symbology — the barcode preview appears here.
              </p>
            </div>
          )}
        </div>
        {ready && <PayloadBox payload={text.trim()} />}
        <PrivacyNote>
          Barcodes are rendered locally with JsBarcode — nothing leaves your browser. PNG
          downloads keep the exact colours you picked.
        </PrivacyNote>
      </div>
    </div>
  );
}

/* ══ Tool wrappers (no props) ═════════════════════════════════ */

function TextQrTool() {
  return <QrGenerator config={TEXT_QR_CONFIG} />;
}
function UrlQrTool() {
  return <QrGenerator config={URL_QR_CONFIG} />;
}
function WifiQrTool() {
  return <QrGenerator config={WIFI_QR_CONFIG} />;
}
function WhatsappQrTool() {
  return <QrGenerator config={WHATSAPP_QR_CONFIG} />;
}
function ContactQrTool() {
  return <QrGenerator config={CONTACT_QR_CONFIG} />;
}
function EmailQrTool() {
  return <QrGenerator config={EMAIL_QR_CONFIG} />;
}
function PhoneQrTool() {
  return <QrGenerator config={PHONE_QR_CONFIG} />;
}

/* ══ Registry ═════════════════════════════════════════════════ */

export const qrTools: Record<string, ToolComponent> = {
  "qr-code-generator": TextQrTool,
  "qr-code-scanner": QrCodeScanner,
  "camera-qr-scanner": CameraQrScanner,
  "url-qr-generator": UrlQrTool,
  "wifi-qr-generator": WifiQrTool,
  "whatsapp-qr-generator": WhatsappQrTool,
  "contact-qr-generator": ContactQrTool,
  "email-qr-generator": EmailQrTool,
  "phone-qr-generator": PhoneQrTool,
  "barcode-generator": BarcodeGenerator,
  "barcode-scanner": BarcodeScanner,
};
