"use client";

import type { ToolComponent } from "./registry";
import { useEffect, useMemo, useState } from "react";
import {
  DownloadButton,
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
import { downloadBlob, downloadText } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════
   Shared document-builder helpers (invoice / quotation / receipt)
   ════════════════════════════════════════════════════════════════ */

type DocKind = "invoice" | "quotation" | "receipt";

interface LineItem {
  id: number;
  desc: string;
  qty: number;
  price: number;
}

interface DocConfig {
  kind: DocKind;
  title: string;
  numberLabel: string;
  dateLabel: string;
  refLabel: string | null; // e.g. "Due Date" / "Valid Until" (receipt has none)
  clientLabel: string;
  defaultNumber: string;
  refOffsetDays: number;
}

const DOC_CONFIG: Record<DocKind, DocConfig> = {
  invoice: {
    kind: "invoice",
    title: "INVOICE",
    numberLabel: "Invoice No.",
    dateLabel: "Invoice Date",
    refLabel: "Due Date",
    clientLabel: "Billed To",
    defaultNumber: "INV-001",
    refOffsetDays: 14,
  },
  quotation: {
    kind: "quotation",
    title: "QUOTATION",
    numberLabel: "Quote No.",
    dateLabel: "Quote Date",
    refLabel: "Valid Until",
    clientLabel: "Prepared For",
    defaultNumber: "QUO-001",
    refOffsetDays: 30,
  },
  receipt: {
    kind: "receipt",
    title: "RECEIPT",
    numberLabel: "Receipt No.",
    dateLabel: "Date",
    refLabel: null,
    clientLabel: "Received From",
    defaultNumber: "RCT-001",
    refOffsetDays: 0,
  },
};

interface DocForm {
  docNumber: string;
  date: string;
  refDate: string;
  senderName: string;
  senderDetails: string;
  clientName: string;
  clientDetails: string;
  currency: string;
  items: LineItem[];
  taxPct: string;
  discount: string;
  paymentMethod: string;
  amountPaid: string;
  notes: string;
  terms: string;
}

let itemId = 4;
const newItem = (): LineItem => ({ id: ++itemId, desc: "", qty: 1, price: 0 });

function isoPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function initialForm(kind: DocKind, withDates = true): DocForm {
  const cfg = DOC_CONFIG[kind];
  return {
    docNumber: cfg.defaultNumber,
    date: withDates ? isoPlusDays(0) : "",
    refDate: withDates && cfg.refLabel ? isoPlusDays(cfg.refOffsetDays) : "",
    senderName: "",
    senderDetails: "",
    clientName: "",
    clientDetails: "",
    currency: "$",
    items: [
      { id: 1, desc: "", qty: 1, price: 0 },
      { id: 2, desc: "", qty: 1, price: 0 },
    ],
    taxPct: "0",
    discount: "0",
    paymentMethod: "",
    amountPaid: "",
    notes: "",
    terms: "",
  };
}

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function fmtMoney(n: number, currency: string): string {
  return `${currency}${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escMultiline(s: string): string {
  return esc(s).replace(/\r?\n/g, "<br/>");
}

interface Totals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

function computeTotals(f: DocForm): Totals {
  const subtotal = f.items.reduce((sum, it) => sum + num(String(it.qty)) * num(String(it.price)), 0);
  const discount = Math.min(num(f.discount), subtotal);
  const tax = ((subtotal - discount) * num(f.taxPct)) / 100;
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}

/* ── HTML document body (shared by preview, print and download) ── */

function buildDocBody(f: DocForm, kind: DocKind): string {
  const cfg = DOC_CONFIG[kind];
  const t = computeTotals(f);
  const cur = f.currency.trim() || "$";
  const rows = f.items
    .filter((it) => it.desc.trim() !== "" || it.qty !== 0 || it.price !== 0)
    .map(
      (it, i) => `
      <tr>
        <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;color:#666;">${i + 1}</td>
        <td style="padding:8px 10px;border:1px solid #ddd;">${esc(it.desc) || "<span style='color:#999'>&mdash;</span>"}</td>
        <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;">${esc(String(it.qty))}</td>
        <td style="padding:8px 10px;border:1px solid #ddd;text-align:right;">${fmtMoney(it.price, cur)}</td>
        <td style="padding:8px 10px;border:1px solid #ddd;text-align:right;">${fmtMoney(it.qty * it.price, cur)}</td>
      </tr>`,
    )
    .join("");

  const metaRows = [
    `<div style="margin-bottom:4px;"><span style="color:#666;">${cfg.numberLabel}:</span> <strong>${esc(f.docNumber)}</strong></div>`,
    `<div style="margin-bottom:4px;"><span style="color:#666;">${cfg.dateLabel}:</span> ${fmtDate(f.date)}</div>`,
    cfg.refLabel && f.refDate
      ? `<div style="margin-bottom:4px;"><span style="color:#666;">${cfg.refLabel}:</span> ${fmtDate(f.refDate)}</div>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const totalsRows = [
    `<tr><td style="padding:6px 10px;color:#666;">Subtotal</td><td style="padding:6px 10px;text-align:right;">${fmtMoney(t.subtotal, cur)}</td></tr>`,
    t.discount > 0
      ? `<tr><td style="padding:6px 10px;color:#666;">Discount</td><td style="padding:6px 10px;text-align:right;">&minus;${fmtMoney(t.discount, cur)}</td></tr>`
      : "",
    t.tax > 0 || num(f.taxPct) > 0
      ? `<tr><td style="padding:6px 10px;color:#666;">Tax (${esc(String(num(f.taxPct)))}%)</td><td style="padding:6px 10px;text-align:right;">${fmtMoney(t.tax, cur)}</td></tr>`
      : "",
    `<tr><td style="padding:8px 10px;border-top:2px solid #1a1a1a;font-weight:bold;">Total</td><td style="padding:8px 10px;border-top:2px solid #1a1a1a;text-align:right;font-weight:bold;font-size:16px;">${fmtMoney(t.total, cur)}</td></tr>`,
  ]
    .filter(Boolean)
    .join("");

  const paymentBlock =
    kind === "receipt"
      ? `<div style="margin-top:18px;font-size:13px;border:1px solid #ddd;border-radius:6px;padding:12px 14px;">
           <div><span style="color:#666;">Payment method:</span> <strong>${esc(f.paymentMethod) || "—"}</strong></div>
           <div style="margin-top:4px;"><span style="color:#666;">Amount paid:</span> <strong>${fmtMoney(f.amountPaid.trim() === "" ? t.total : num(f.amountPaid), cur)}</strong></div>
         </div>`
      : "";

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;background:#fff;max-width:720px;margin:0 auto;padding:36px 40px;box-sizing:border-box;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1a1a1a;padding-bottom:16px;">
      <div>
        <div style="font-size:26px;font-weight:bold;letter-spacing:2px;">${cfg.title}</div>
        <div style="margin-top:6px;font-size:13px;color:#444;">${esc(f.senderName) || "Your business name"}</div>
        <div style="margin-top:4px;font-size:12px;color:#666;">${escMultiline(f.senderDetails)}</div>
      </div>
      <div style="text-align:right;font-size:13px;">${metaRows}</div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-top:24px;">
      <div style="font-size:13px;">
        <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:6px;">${cfg.clientLabel}</div>
        <div style="font-weight:bold;">${esc(f.clientName) || "Client name"}</div>
        <div style="margin-top:4px;color:#666;">${escMultiline(f.clientDetails)}</div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-top:24px;font-size:13px;">
      <thead>
        <tr style="background:#1a1a1a;color:#fff;">
          <th style="padding:8px 10px;text-align:center;width:34px;">#</th>
          <th style="padding:8px 10px;text-align:left;">Description</th>
          <th style="padding:8px 10px;text-align:center;width:70px;">Qty</th>
          <th style="padding:8px 10px;text-align:right;width:110px;">Unit Price</th>
          <th style="padding:8px 10px;text-align:right;width:110px;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="5" style="padding:16px;text-align:center;color:#999;border:1px solid #ddd;">No items yet</td></tr>`}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;margin-top:16px;">
      <table style="border-collapse:collapse;font-size:13px;min-width:280px;">
        <tbody>${totalsRows}</tbody>
      </table>
    </div>

    ${paymentBlock}

    ${f.notes ? `<div style="margin-top:28px;font-size:13px;"><div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:6px;">Notes</div><div style="white-space:pre-wrap;">${esc(f.notes)}</div></div>` : ""}
    ${f.terms ? `<div style="margin-top:20px;font-size:13px;"><div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:6px;">Terms &amp; Conditions</div><div style="white-space:pre-wrap;">${esc(f.terms)}</div></div>` : ""}

    <div style="margin-top:36px;padding-top:12px;border-top:1px solid #ddd;font-size:11px;color:#999;text-align:center;">
      Generated with BuiltByUmer &middot; ${cfg.title.charAt(0) + cfg.title.slice(1).toLowerCase()} ${esc(f.docNumber)}
    </div>
  </div>`;
}

function buildFullHtml(f: DocForm, kind: DocKind): string {
  const cfg = DOC_CONFIG[kind];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${cfg.title} ${esc(f.docNumber)}</title>
<style>
  @page { margin: 12mm; }
  html, body { margin: 0; padding: 0; background: #fff; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
${buildDocBody(f, kind)}
</body>
</html>`;
}

/* ── Printing via a hidden iframe (browser's Save as PDF) ─────── */

function printHtml(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
    window.setTimeout(() => iframe.remove(), 3000);
  };
}

/* ── DOCX export via the docx package ─────────────────────────── */

async function downloadDocx(f: DocForm, kind: DocKind): Promise<void> {
  const cfg = DOC_CONFIG[kind];
  const t = computeTotals(f);
  const cur = f.currency.trim() || "$";
  const docx = await import("docx");
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
  } = docx;

  const p = (text: string, opts: Partial<{ bold: boolean; size: number; color: string; after: number; align: (typeof AlignmentType)[keyof typeof AlignmentType] }> = {}) =>
    new Paragraph({
      alignment: opts.align,
      spacing: { after: opts.after ?? 80 },
      children: [
        new TextRun({ text, bold: opts.bold ?? false, size: opts.size ?? 22, color: opts.color }),
      ],
    });

  const cell = (text: string, opts: Partial<{ bold: boolean; align: (typeof AlignmentType)[keyof typeof AlignmentType]; width: number }> = {}) =>
    new TableCell({
      width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
      children: [
        new Paragraph({
          alignment: opts.align,
          children: [new TextRun({ text, bold: opts.bold ?? false, size: 20 })],
        }),
      ],
    });

  const visible = f.items.filter((it) => it.desc.trim() !== "" || num(String(it.qty)) || num(String(it.price)));
  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell("#", { bold: true, width: 6 }),
          cell("Description", { bold: true, width: 46 }),
          cell("Qty", { bold: true, align: AlignmentType.CENTER, width: 12 }),
          cell("Unit Price", { bold: true, align: AlignmentType.RIGHT, width: 18 }),
          cell("Amount", { bold: true, align: AlignmentType.RIGHT, width: 18 }),
        ],
      }),
      ...(visible.length > 0
        ? visible.map(
            (it, i) =>
              new TableRow({
                children: [
                  cell(String(i + 1)),
                  cell(it.desc || "—"),
                  cell(String(it.qty), { align: AlignmentType.CENTER }),
                  cell(fmtMoney(it.price, cur), { align: AlignmentType.RIGHT }),
                  cell(fmtMoney(it.qty * it.price, cur), { align: AlignmentType.RIGHT }),
                ],
              }),
          )
        : [
            new TableRow({
              children: [cell("No items yet", { width: 100 })],
            }),
          ]),
    ],
  });

  const metaLines = [
    `${cfg.numberLabel}: ${f.docNumber}`,
    `${cfg.dateLabel}: ${fmtDate(f.date)}`,
    ...(cfg.refLabel && f.refDate ? [`${cfg.refLabel}: ${fmtDate(f.refDate)}`] : []),
  ];

  const paidLines =
    kind === "receipt"
      ? [
          p(`Payment method: ${f.paymentMethod.trim() || "—"}`, { bold: false }),
          p(`Amount paid: ${fmtMoney(f.amountPaid.trim() === "" ? t.total : num(f.amountPaid), cur)}`, { bold: true }),
        ]
      : [];

  const doc = new Document({
    sections: [
      {
        children: [
          p(cfg.title, { bold: true, size: 40, after: 200 }),
          p(f.senderName || "Your business name", { bold: true, size: 24 }),
          ...f.senderDetails
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => p(line, { size: 20, color: "666666" })),
          ...metaLines.map((line) => p(line, { size: 20, color: "666666" })),
          p(`${cfg.clientLabel}: ${f.clientName || "Client name"}`, { bold: true, after: 40 }),
          ...f.clientDetails
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => p(line, { size: 20, color: "666666" })),
          new Paragraph({ spacing: { after: 160 }, children: [] }),
          itemsTable,
          new Paragraph({ spacing: { after: 120 }, children: [] }),
          p(`Subtotal: ${fmtMoney(t.subtotal, cur)}`, { align: AlignmentType.RIGHT }),
          ...(t.discount > 0 ? [p(`Discount: -${fmtMoney(t.discount, cur)}`, { align: AlignmentType.RIGHT })] : []),
          ...(num(f.taxPct) > 0 ? [p(`Tax (${num(f.taxPct)}%): ${fmtMoney(t.tax, cur)}`, { align: AlignmentType.RIGHT })] : []),
          p(`Total: ${fmtMoney(t.total, cur)}`, { align: AlignmentType.RIGHT, bold: true, size: 26 }),
          ...paidLines,
          ...(f.notes
            ? [p("Notes", { bold: true, after: 40 }), ...f.notes.split(/\r?\n/).map((line) => p(line, { size: 20 }))]
            : []),
          ...(f.terms
            ? [p("Terms & Conditions", { bold: true, after: 40 }), ...f.terms.split(/\r?\n/).map((line) => p(line, { size: 20 }))]
            : []),
          p("Generated with BuiltByUmer", { size: 16, color: "999999", after: 0 }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${f.docNumber.trim() || cfg.defaultNumber}.docx`);
}

/* ════════════════════════════════════════════════════════════════
   Invoice / Quotation / Receipt generator (shared component)
   ════════════════════════════════════════════════════════════════ */

function DocumentGenerator({ kind }: { kind: DocKind }) {
  const cfg = DOC_CONFIG[kind];
  const [f, setF] = useState<DocForm>(() => initialForm(kind, false));
  // Dates default to today only after mount (prerender has no stable clock).
  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only client init
  useEffect(() => setF(initialForm(kind)), [kind]);
  const [busyDocx, setBusyDocx] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const set = (patch: Partial<DocForm>) => setF((prev) => ({ ...prev, ...patch }));
  const setItem = (id: number, patch: Partial<LineItem>) =>
    setF((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  const addItem = () => setF((prev) => ({ ...prev, items: [...prev.items, newItem()] }));
  const removeItem = (id: number) =>
    setF((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((it) => it.id !== id) : prev.items,
    }));

  const totals = useMemo(() => computeTotals(f), [f]);
  const preview = useMemo(() => buildDocBody(f, kind), [f, kind]);
  const fullHtml = useMemo(() => buildFullHtml(f, kind), [f, kind]);

  const numCls = inputCls + " [&::-webkit-inner-spin-button]:appearance-none";

  const exportDocx = async () => {
    setBusyDocx(true);
    setDocxError(null);
    setOkMsg(null);
    try {
      await downloadDocx(f, kind);
      setOkMsg(`${f.docNumber || cfg.defaultNumber}.docx downloaded — open it in Word, Google Docs or LibreOffice.`);
    } catch (e) {
      setDocxError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyDocx(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      {/* ── Form ── */}
      <div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={cfg.numberLabel}>
            <input type="text" value={f.docNumber} onChange={(e) => set({ docNumber: e.target.value })} className={inputCls} placeholder={cfg.defaultNumber} />
          </Field>
          <Field label={cfg.dateLabel}>
            <input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} className={inputCls} />
          </Field>
          {cfg.refLabel && (
            <Field label={cfg.refLabel}>
              <input type="date" value={f.refDate} onChange={(e) => set({ refDate: e.target.value })} className={inputCls} />
            </Field>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Your business (sender)">
            <input type="text" value={f.senderName} onChange={(e) => set({ senderName: e.target.value })} className={inputCls} placeholder="BuiltByUmer Ltd" />
          </Field>
          <Field label={`${cfg.clientLabel} (client)`}>
            <input type="text" value={f.clientName} onChange={(e) => set({ clientName: e.target.value })} className={inputCls} placeholder="Acme Corp" />
          </Field>
          <Field label="Sender details (address, phone…)">
            <TextArea value={f.senderDetails} onChange={(v) => set({ senderDetails: v })} rows={3} placeholder={"12 Main Street\nCity, Country\n+1 555 0100"} />
          </Field>
          <Field label="Client details (address, email…)">
            <TextArea value={f.clientDetails} onChange={(v) => set({ clientDetails: v })} rows={3} placeholder={"99 Office Road\nbilling@acme.com"} />
          </Field>
        </div>

        {/* Items */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <label className={labelCls + " !mb-0"}>Items</label>
            <SecondaryButton onClick={addItem} className="!px-3 !py-1.5 text-xs">
              + Add item
            </SecondaryButton>
          </div>
          <div className="space-y-2">
            {f.items.map((it, i) => (
              <div key={it.id} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-center text-xs text-muted">{i + 1}</span>
                <input
                  type="text"
                  value={it.desc}
                  onChange={(e) => setItem(it.id, { desc: e.target.value })}
                  className={inputCls + " flex-1"}
                  placeholder="Description of work or product"
                />
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={it.qty}
                  onChange={(e) => setItem(it.id, { qty: Number(e.target.value) || 0 })}
                  className={numCls + " w-16 shrink-0 text-center"}
                  aria-label="Quantity"
                />
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={it.price}
                  onChange={(e) => setItem(it.id, { price: Number(e.target.value) || 0 })}
                  className={numCls + " w-24 shrink-0 text-right"}
                  aria-label="Unit price"
                />
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  disabled={f.items.length <= 1}
                  aria-label="Remove item"
                  className="shrink-0 rounded-lg border border-[#121212]/15 px-2.5 py-2 text-xs text-muted transition hover:border-red-400/50 hover:text-red-300 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Field label="Tax %">
            <input type="number" min={0} step="any" value={f.taxPct} onChange={(e) => set({ taxPct: e.target.value })} className={numCls} placeholder="0" />
          </Field>
          <Field label={`Discount (${f.currency.trim() || "$"})`}>
            <input type="number" min={0} step="any" value={f.discount} onChange={(e) => set({ discount: e.target.value })} className={numCls} placeholder="0" />
          </Field>
          <Field label="Currency symbol">
            <input type="text" value={f.currency} onChange={(e) => set({ currency: e.target.value })} className={inputCls} maxLength={4} placeholder="$" />
          </Field>
          {kind === "receipt" ? (
            <Field label="Payment method">
              <input type="text" value={f.paymentMethod} onChange={(e) => set({ paymentMethod: e.target.value })} className={inputCls} placeholder="Cash / Bank transfer" />
            </Field>
          ) : (
            <div />
          )}
        </div>
        {kind === "receipt" && (
          <div className="mt-4">
            <Field label="Amount paid (leave empty to use the total)">
              <input type="number" min={0} step="any" value={f.amountPaid} onChange={(e) => set({ amountPaid: e.target.value })} className={numCls} placeholder={totals.total.toFixed(2)} />
            </Field>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Notes (optional)">
            <TextArea value={f.notes} onChange={(v) => set({ notes: v })} rows={3} placeholder="Thank you for your business!" />
          </Field>
          <Field label="Terms & conditions (optional)">
            <TextArea value={f.terms} onChange={(v) => set({ terms: v })} rows={3} placeholder="Payment due within 14 days…" />
          </Field>
        </div>

        <div className="mt-6 rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-4 py-3 text-sm">
          <div className="flex justify-between text-muted"><span>Subtotal</span><span>{fmtMoney(totals.subtotal, f.currency.trim() || "$")}</span></div>
          {totals.discount > 0 && (
            <div className="mt-1 flex justify-between text-muted"><span>Discount</span><span>&minus;{fmtMoney(totals.discount, f.currency.trim() || "$")}</span></div>
          )}
          {num(f.taxPct) > 0 && (
            <div className="mt-1 flex justify-between text-muted"><span>Tax ({num(f.taxPct)}%)</span><span>{fmtMoney(totals.tax, f.currency.trim() || "$")}</span></div>
          )}
          <div className="mt-2 flex justify-between border-t border-[#121212]/12 pt-2 text-base font-semibold text-[#163D2B]">
            <span>Total</span><span>{fmtMoney(totals.total, f.currency.trim() || "$")}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={() => printHtml(fullHtml)}>
            Print / Save as PDF
          </PrimaryButton>
          <DownloadButton
            onClick={() => downloadText(fullHtml, `${(f.docNumber || cfg.defaultNumber).trim()}.html`, "text/html")}
            label="Download HTML"
          />
          <SecondaryButton onClick={exportDocx} disabled={busyDocx}>
            {busyDocx ? "Building .docx…" : "Download .docx"}
          </SecondaryButton>
          <ResetButton
            onClick={() => {
              setF(initialForm(kind));
              setOkMsg(null);
              setDocxError(null);
            }}
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          “Print / Save as PDF” opens your browser’s print dialog — choose{" "}
          <strong className="text-cream">“Save as PDF”</strong> as the destination to get a PDF file.
        </p>
        {okMsg && <OkNote>{okMsg}</OkNote>}
        {docxError && <ErrorNote>Could not build the .docx: {docxError}</ErrorNote>}
      </div>

      {/* ── Live preview ── */}
      <div>
        <label className={labelCls}>Live preview</label>
        <div className="max-h-[640px] overflow-auto rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-4">
          <div
            className="mx-auto max-w-[720px] rounded-lg bg-white shadow-xl"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          The preview uses the same markup that is printed and downloaded, so what you see is what
          you get.
        </p>
      </div>
    </div>
  );
}

const InvoiceGenerator = () => <DocumentGenerator kind="invoice" />;
const QuotationGenerator = () => <DocumentGenerator kind="quotation" />;
const ReceiptGenerator = () => <DocumentGenerator kind="receipt" />;

/* ════════════════════════════════════════════════════════════════
   Business Card Maker
   ════════════════════════════════════════════════════════════════ */

interface CardForm {
  name: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  accent: string;
  darkBack: boolean;
  showBack: boolean;
}

const CARD_W_PX = 336; // 3.5 in at 96 dpi
const CARD_H_PX = 192; // 2 in at 96 dpi

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "BB";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function buildCardInner(c: CardForm, side: "front" | "back", w: number, h: number): string {
  const accent = esc(c.accent);
  const font = "font-family:Arial,Helvetica,sans-serif;";
  const pad = Math.round(w * 0.075);
  const scale = w / CARD_W_PX;

  if (side === "front") {
    return `
    <div style="${font}width:${w}px;height:${h}px;box-sizing:border-box;background:#fff;color:#1a1a1a;position:relative;overflow:hidden;border:1px solid #ddd;">
      <div style="position:absolute;left:0;top:0;bottom:0;width:${Math.round(10 * scale)}px;background:${accent};"></div>
      <div style="position:absolute;top:${Math.round(pad)}px;right:${Math.round(pad)}px;width:${Math.round(52 * scale)}px;height:${Math.round(52 * scale)}px;border-radius:50%;background:${accent};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${Math.round(20 * scale)}px;letter-spacing:1px;">${esc(initials(c.name))}</div>
      <div style="position:absolute;left:${Math.round(pad + 14 * scale)}px;top:${Math.round(h * 0.24)}px;">
        ${c.company ? `<div style="font-size:${Math.round(12 * scale)}px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${accent};">${esc(c.company)}</div>` : ""}
        <div style="margin-top:${Math.round(8 * scale)}px;font-size:${Math.round(22 * scale)}px;font-weight:bold;">${esc(c.name) || "Your Name"}</div>
        ${c.jobTitle ? `<div style="margin-top:${Math.round(4 * scale)}px;font-size:${Math.round(12 * scale)}px;color:#555;">${esc(c.jobTitle)}</div>` : ""}
        <div style="margin-top:${Math.round(14 * scale)}px;height:1px;width:${Math.round(90 * scale)}px;background:#ddd;"></div>
        ${c.website ? `<div style="margin-top:${Math.round(10 * scale)}px;font-size:${Math.round(11 * scale)}px;color:${accent};">${esc(c.website)}</div>` : ""}
      </div>
    </div>`;
  }

  const bg = c.darkBack ? accent : "#fff";
  const fg = c.darkBack ? "#fff" : "#1a1a1a";
  const muted = c.darkBack ? "rgba(255,255,255,0.75)" : "#666";
  const row = (label: string, value: string) =>
    value
      ? `<div style="display:flex;gap:${Math.round(8 * scale)}px;font-size:${Math.round(11 * scale)}px;line-height:1.7;">
           <span style="width:${Math.round(58 * scale)}px;flex-shrink:0;color:${muted};text-transform:uppercase;letter-spacing:1px;font-size:${Math.round(9 * scale)}px;padding-top:2px;">${esc(label)}</span>
           <span style="color:${fg};">${esc(value)}</span>
         </div>`
      : "";
  return `
  <div style="${font}width:${w}px;height:${h}px;box-sizing:border-box;background:${bg};color:${fg};position:relative;overflow:hidden;border:1px solid #ddd;">
    <div style="position:absolute;left:0;top:0;right:0;height:${Math.round(8 * scale)}px;background:${c.darkBack ? "rgba(255,255,255,0.25)" : accent};"></div>
    <div style="position:absolute;left:${Math.round(pad)}px;right:${Math.round(pad)}px;top:${Math.round(h * 0.24)}px;">
      <div style="font-size:${Math.round(13 * scale)}px;font-weight:bold;letter-spacing:1px;margin-bottom:${Math.round(10 * scale)}px;color:${c.darkBack ? "#fff" : accent};">${esc(c.name) || "Your Name"}${c.company ? ` &middot; ${esc(c.company)}` : ""}</div>
      ${row("Phone", c.phone)}
      ${row("Email", c.email)}
      ${row("Website", c.website)}
      ${row("Address", c.address)}
    </div>
  </div>`;
}

function buildCardPage(c: CardForm): string {
  const front = buildCardInner(c, "front", CARD_W_PX, CARD_H_PX);
  const back = buildCardInner(c, "back", CARD_W_PX, CARD_H_PX);
  return front + back;
}

function buildCardPrintHtml(c: CardForm): string {
  // Print layout uses real inches so the card fills an exact 3.5 × 2 in page.
  const printCard = (side: "front" | "back") =>
    buildCardInner(c, side, 336, 192).replace(/width:336px/, "width:3.5in").replace(/height:192px/, "height:2in");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Business card — ${esc(c.name || "Your Name")}</title>
<style>
  @page { size: 3.5in 2in; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .card-page { page-break-after: always; }
  .card-page > div { display: block; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="card-page">${printCard("front")}</div>
${c.showBack ? `<div class="card-page">${printCard("back")}</div>` : ""}
</body>
</html>`;
}

function BusinessCardMaker() {
  const [c, setC] = useState<CardForm>({
    name: "",
    jobTitle: "",
    company: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    accent: "#65a30d",
    darkBack: true,
    showBack: true,
  });
  const set = (patch: Partial<CardForm>) => setC((prev) => ({ ...prev, ...patch }));

  const preview = useMemo(() => buildCardPage(c), [c]);
  const printHtmlStr = useMemo(() => buildCardPrintHtml(c), [c]);

  const hasContent = c.name.trim() !== "" || c.company.trim() !== "";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input type="text" value={c.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} placeholder="Umer Raja" />
          </Field>
          <Field label="Job title">
            <input type="text" value={c.jobTitle} onChange={(e) => set({ jobTitle: e.target.value })} className={inputCls} placeholder="Founder & Developer" />
          </Field>
          <Field label="Company">
            <input type="text" value={c.company} onChange={(e) => set({ company: e.target.value })} className={inputCls} placeholder="BuiltByUmer" />
          </Field>
          <Field label="Accent colour">
            <input
              type="color"
              value={c.accent}
              onChange={(e) => set({ accent: e.target.value })}
              aria-label="Accent colour"
              className="h-10 w-full cursor-pointer rounded-lg border border-[#121212]/15 bg-transparent"
            />
          </Field>
          <Field label="Phone">
            <input type="text" value={c.phone} onChange={(e) => set({ phone: e.target.value })} className={inputCls} placeholder="+1 555 0100" />
          </Field>
          <Field label="Email">
            <input type="text" value={c.email} onChange={(e) => set({ email: e.target.value })} className={inputCls} placeholder="hello@builtbyumer.com" />
          </Field>
          <Field label="Website">
            <input type="text" value={c.website} onChange={(e) => set({ website: e.target.value })} className={inputCls} placeholder="builtbyumer.com" />
          </Field>
          <Field label="Address">
            <input type="text" value={c.address} onChange={(e) => set({ address: e.target.value })} className={inputCls} placeholder="12 Main Street, City" />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-cream">
            <input type="checkbox" checked={c.showBack} onChange={(e) => set({ showBack: e.target.checked })} className="h-4 w-4 accent-lime" />
            Include back side
          </label>
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-cream">
            <input type="checkbox" checked={c.darkBack} onChange={(e) => set({ darkBack: e.target.checked })} className="h-4 w-4 accent-lime" />
            Dark accent back side
          </label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={() => printHtml(printHtmlStr)} disabled={!hasContent}>
            Print / Save as PDF
          </PrimaryButton>
          <DownloadButton
            onClick={() => downloadText(printHtmlStr, "business-card.html", "text/html")}
            label="Download HTML"
            disabled={!hasContent}
          />
          <ResetButton onClick={() => setC({ name: "", jobTitle: "", company: "", phone: "", email: "", website: "", address: "", accent: "#65a30d", darkBack: true, showBack: true })} />
        </div>
        <p className="mt-3 text-xs text-muted">
          The card is laid out at exactly <strong className="text-cream">3.5 × 2 inches</strong>. In
          the print dialog, choose <strong className="text-cream">“Save as PDF”</strong> and set
          paper size / margins to “None” for a print-ready file. Each side prints on its own page.
        </p>
      </div>

      <div>
        <label className={labelCls}>Preview — 3.5 &times; 2 in per side</label>
        <div className="flex flex-col gap-6 rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-5">
          <div className="overflow-x-auto">
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted">Front</div>
            <div className="w-fit shadow-xl" dangerouslySetInnerHTML={{ __html: buildCardInner(c, "front", CARD_W_PX, CARD_H_PX) }} />
          </div>
          {c.showBack && (
            <div className="overflow-x-auto">
              <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted">Back</div>
              <div className="w-fit shadow-xl" dangerouslySetInnerHTML={{ __html: buildCardInner(c, "back", CARD_W_PX, CARD_H_PX) }} />
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">
          The downloaded HTML and print output use the exact same markup at true inch dimensions.
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Registry
   ════════════════════════════════════════════════════════════════ */

export const businessTools: Record<string, ToolComponent> = {
  "invoice-generator": InvoiceGenerator,
  "quotation-generator": QuotationGenerator,
  "receipt-generator": ReceiptGenerator,
  "business-card-maker": BusinessCardMaker,
};
