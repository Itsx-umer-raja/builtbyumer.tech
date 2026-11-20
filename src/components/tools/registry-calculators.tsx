"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ToolComponent } from "./registry";
import { CopyButton, Field, PrimaryButton, SecondaryButton, inputCls, labelCls } from "./ui";
import { cn, fetchJsonWithTimeout } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════
   Shared helpers
   ════════════════════════════════════════════════════════════════ */

/** Parse a user-typed number. Returns null for empty or non-finite input. */
function parseNum(s: string): number | null {
  const t = s.trim().replace(/,/g, "");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const moneyFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function money(n: number): string {
  return moneyFmt.format(n);
}

function fmtCurrency(n: number, code: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(n);
  } catch {
    return `${fmtNum(n, 2)} ${code}`;
  }
}

function fmtNum(n: number, maxFrac = 2): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFrac }).format(n);
}

/** For unit conversions where magnitudes vary wildly — keeps 8 significant digits. */
function fmtSmart(n: number): string {
  if (n === 0) return "0";
  return new Intl.NumberFormat("en-US", { maximumSignificantDigits: 8 }).format(n);
}

function WarningNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
      {children}
    </p>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted">{children}</p>;
}

function FormulaNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-[#121212]/12 bg-white px-4 py-3 text-xs leading-relaxed text-muted">
      <span className="font-semibold text-cream">Formula — </span>
      {children}
    </p>
  );
}

function ModeTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<[T, string]>;
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "rounded-lg border px-4 py-1.5 text-sm font-medium transition",
            value === id
              ? "border-[#163D2B]/60 bg-[#163D2B]/10 text-[#163D2B]"
              : "border-[#121212]/15 text-muted hover:text-cream",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-cream">
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

function Stat({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#121212]/12 bg-[#f6f1e6] px-3 py-2.5 text-center",
        wide && "col-span-full",
      )}
    >
      <div className="truncate font-semibold text-[#163D2B]" title={value}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

/** Big highlighted result headline used across calculators. */
function ResultHeadline({ value, caption }: { value: string; caption: string }) {
  return (
    <div className="rounded-xl border border-[#163D2B]/30 bg-[#163D2B]/5 px-5 py-4">
      <div className="break-words text-3xl font-bold text-[#163D2B]">{value}</div>
      <div className="mt-1 text-sm text-muted">{caption}</div>
    </div>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#121212]/12 bg-[#f6f1e6]">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-[#121212]/12 text-left">
            {head.map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((cells, i) => (
            <tr key={i} className="transition hover:bg-white/5">
              {cells.map((c, j) => (
                <td
                  key={j}
                  className={cn(
                    "whitespace-nowrap px-4 py-2",
                    j === 0 ? "text-cream" : "text-right font-mono text-cream/90",
                  )}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Date / time parsing helpers ──────────────────────────────── */

function parseDateInput(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

function todayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Midnight-UTC day number, immune to DST shifts. */
function utcDay(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffYMD(from: Date, to: Date): { years: number; months: number; days: number } {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); // borrow from previous month length
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

function parseTimeInput(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function fmtHM(mins: number): string {
  return `${Math.floor(mins / 60)} h ${mins % 60} m`;
}

/* ── Loan amortisation (shared by loan + EMI) ─────────────────── */

function amortise(
  principal: number,
  annualRatePct: number,
  months: number,
): {
  payment: number;
  rows: Array<{ month: number; payment: number; interest: number; principal: number; balance: number }>;
  totalInterest: number;
  totalPaid: number;
} {
  const r = annualRatePct / 100 / 12;
  const payment =
    r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
  let balance = principal;
  let totalInterest = 0;
  const rows: Array<{ month: number; payment: number; interest: number; principal: number; balance: number }> = [];
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const principalPart = m === months ? balance : payment - interest; // final payment clears the loan exactly
    const paid = interest + principalPart;
    balance -= principalPart;
    totalInterest += interest;
    rows.push({ month: m, payment: paid, interest, principal: principalPart, balance: Math.max(balance, 0) });
  }
  return { payment, rows, totalInterest, totalPaid: principal + totalInterest };
}

function AmortisationBlock({
  payment,
  rows,
  totalInterest,
  totalPaid,
  principal,
  months,
  paymentLabel,
  formula,
}: {
  payment: number;
  rows: Array<{ month: number; payment: number; interest: number; principal: number; balance: number }>;
  totalInterest: number;
  totalPaid: number;
  principal: number;
  months: number;
  paymentLabel: string;
  formula: ReactNode;
}) {
  const shown = rows.slice(0, Math.min(12, months));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={paymentLabel} value={money(payment)} />
        <Stat label="Total paid" value={money(totalPaid)} />
        <Stat label="Total interest" value={money(totalInterest)} />
        <Stat
          label="Interest share"
          value={principal > 0 ? `${fmtNum((totalInterest / principal) * 100, 1)}% of loan` : "—"}
        />
      </div>
      <div>
        <div className="mb-2">
          <label className={labelCls + " !mb-0"}>
            First {shown.length} month{shown.length === 1 ? "" : "s"} — principal vs interest
          </label>
        </div>
        <DataTable
          head={["Month", "Payment", "Interest", "Principal", "Remaining balance"]}
          rows={shown.map((r) => [
            `Month ${r.month}`,
            money(r.payment),
            money(r.interest),
            money(r.principal),
            money(r.balance),
          ])}
        />
      </div>
      <FormulaNote>{formula}</FormulaNote>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Percentage Calculator
   ════════════════════════════════════════════════════════════════ */

type PctMode = "of" | "what" | "change";

function PercentageCalculator() {
  const [mode, setMode] = useState<PctMode>("of");
  const [x, setX] = useState("15");
  const [y, setY] = useState("80");

  const res = useMemo(() => {
    const a = parseNum(x);
    const b = parseNum(y);
    if (a === null || b === null) return null;
    if (mode === "of") {
      const value = (a / 100) * b;
      return {
        headline: fmtNum(value, 6),
        caption: `${fmtNum(a, 4)}% of ${fmtNum(b, 6)}`,
        formula: (
          <>
            X% of Y = X ÷ 100 × Y. Here: {fmtNum(a, 4)} ÷ 100 × {fmtNum(b, 6)} ={" "}
            {fmtNum(a / 100, 8)} × {fmtNum(b, 6)} = <strong>{fmtNum(value, 6)}</strong>.
          </>
        ),
        error: null as string | null,
      };
    }
    if (mode === "what") {
      if (b === 0) {
        return {
          headline: "",
          caption: "",
          formula: null,
          error: "Y cannot be zero — dividing by zero is undefined.",
        };
      }
      const p = (a / b) * 100;
      return {
        headline: `${fmtNum(p, 4)}%`,
        caption: `${fmtNum(a, 6)} out of ${fmtNum(b, 6)}`,
        formula: (
          <>
            X is what % of Y = X ÷ Y × 100. Here: {fmtNum(a, 6)} ÷ {fmtNum(b, 6)} × 100 ={" "}
            <strong>{fmtNum(p, 4)}%</strong>.
          </>
        ),
        error: null,
      };
    }
    if (a === 0) {
      return {
        headline: "",
        caption: "",
        formula: null,
        error: "Percentage change from zero is undefined — start from a non-zero value.",
      };
    }
    const change = ((b - a) / Math.abs(a)) * 100;
    const dir = change > 0 ? "increase" : change < 0 ? "decrease" : "no change";
    return {
      headline: `${fmtNum(Math.abs(change), 4)}% ${dir}`,
      caption: `from ${fmtNum(a, 6)} to ${fmtNum(b, 6)}`,
      formula: (
        <>
          % change = (new − old) ÷ |old| × 100. Here: ({fmtNum(b, 6)} − {fmtNum(a, 6)}) ÷{" "}
          {fmtNum(Math.abs(a), 6)} × 100 = <strong>{fmtNum(change, 4)}%</strong> — a{" "}
          {dir}.
        </>
      ),
      error: null,
    };
  }, [mode, x, y]);

  const labels: Record<PctMode, [string, string]> = {
    of: ["X — the percentage", "Y — the whole amount"],
    what: ["X — the part", "Y — the whole"],
    change: ["Old value", "New value"],
  };

  return (
    <div className="space-y-5">
      <ModeTabs<PctMode>
        tabs={[
          ["of", "X% of Y"],
          ["what", "X is what % of Y"],
          ["change", "% change"],
        ]}
        value={mode}
        onChange={setMode}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels[mode][0]}>
          <input
            type="number"
            value={x}
            onChange={(e) => setX(e.target.value)}
            className={inputCls}
            placeholder={mode === "of" ? "15" : mode === "what" ? "12" : "100"}
          />
        </Field>
        <Field label={labels[mode][1]}>
          <input
            type="number"
            value={y}
            onChange={(e) => setY(e.target.value)}
            className={inputCls}
            placeholder={mode === "of" ? "80" : mode === "what" ? "60" : "125"}
          />
        </Field>
      </div>
      {res === null && <Note>Fill both fields — the result updates live.</Note>}
      {res?.error && <WarningNote>{res.error}</WarningNote>}
      {res && !res.error && (
        <div className="space-y-4">
          <ResultHeadline value={res.headline} caption={res.caption} />
          {res.formula && <FormulaNote>{res.formula}</FormulaNote>}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Age Calculator
   ════════════════════════════════════════════════════════════════ */

function AgeCalculator() {
  const [dob, setDob] = useState("");
  const [asOf, setAsOf] = useState("");

  const res = useMemo(() => {
    if (!dob) return null;
    const birth = parseDateInput(dob);
    if (!birth) return { ok: false as const, error: "Enter a valid date of birth." };
    const at = asOf ? parseDateInput(asOf) : null;
    if (asOf && !at) return { ok: false as const, error: "The “age at” date is not a valid date." };
    const today = at ?? todayLocal();
    if (birth.getTime() > today.getTime()) {
      return { ok: false as const, error: "The date of birth is after the reference date." };
    }
    const ymd = diffYMD(birth, today);
    const totalDays = Math.round((utcDay(today) - utcDay(birth)) / 86400000);
    const thisYearBd = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    const nextBd =
      thisYearBd.getTime() < today.getTime()
        ? new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate())
        : thisYearBd;
    const daysUntil = Math.round((utcDay(nextBd) - utcDay(today)) / 86400000);
    return {
      ok: true as const,
      ymd,
      totalDays,
      totalWeeks: Math.floor(totalDays / 7),
      totalHours: totalDays * 24,
      nextBd,
      daysUntil,
      turning: nextBd.getFullYear() - birth.getFullYear(),
    };
  }, [dob, asOf]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of birth">
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Age at date (defaults to today)">
          <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className={inputCls} />
        </Field>
      </div>
      {res === null && <Note>Pick a date of birth — the age updates live.</Note>}
      {res && !res.ok && <WarningNote>{res.error}</WarningNote>}
      {res?.ok && (
        <div className="space-y-4">
          <ResultHeadline
            value={`${res.ymd.years} years, ${res.ymd.months} months, ${res.ymd.days} days`}
            caption="Exact age on the reference date"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total days lived" value={fmtNum(res.totalDays, 0)} />
            <Stat label="Total weeks" value={fmtNum(res.totalWeeks, 0)} />
            <Stat label="Total hours" value={fmtNum(res.totalHours, 0)} />
            <Stat
              label="Next birthday"
              value={res.daysUntil === 0 ? "Today!" : `in ${fmtNum(res.daysUntil, 0)} days`}
            />
          </div>
          <div className="rounded-xl border border-[#121212]/12 bg-[#f6f1e6] px-5 py-4 text-sm text-cream">
            Next birthday:{" "}
            <strong className="text-[#163D2B]">
              {res.nextBd.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </strong>{" "}
            — turning {res.turning}.
          </div>
          <FormulaNote>
            Years, months and days are counted on the calendar (borrowing the previous month&apos;s
            length when the day of month isn&apos;t reached yet). Total days is the exact day count
            between the two dates.
          </FormulaNote>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Date Difference
   ════════════════════════════════════════════════════════════════ */

function DateDifference() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [inclusive, setInclusive] = useState(false);

  const res = useMemo(() => {
    const a = from ? parseDateInput(from) : null;
    const b = to ? parseDateInput(to) : null;
    if (from && !a) return { ok: false as const, error: "The start date is not a valid date." };
    if (to && !b) return { ok: false as const, error: "The end date is not a valid date." };
    if (!a || !b) return null;
    const [start, end] = a.getTime() <= b.getTime() ? [a, b] : [b, a];
    const exclusive = Math.round((utcDay(end) - utcDay(start)) / 86400000);
    const days = exclusive + (inclusive ? 1 : 0);
    const ymd = diffYMD(start, end);
    return {
      ok: true as const,
      days,
      weeks: Math.floor(days / 7),
      weekRem: days % 7,
      ymd,
      totalMonths: ymd.years * 12 + ymd.months,
      hours: days * 24,
      swapped: a.getTime() > b.getTime(),
    };
  }, [from, to, inclusive]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
        </Field>
        <Field label="End date">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <CheckRow
        checked={inclusive}
        onChange={setInclusive}
        label="Count both end days (inclusive — add 1 day)"
      />
      {res === null && <Note>Pick two dates — the difference updates live.</Note>}
      {res && !res.ok && <WarningNote>{res.error}</WarningNote>}
      {res?.ok && (
        <div className="space-y-4">
          <ResultHeadline
            value={`${fmtNum(res.days, 0)} day${res.days === 1 ? "" : "s"}`}
            caption={`Between the two dates${res.swapped ? " (dates were reversed)" : ""}${inclusive ? ", inclusive" : ""}`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Weeks & days" value={`${res.weeks} w ${res.weekRem} d`} />
            <Stat
              label="Calendar span"
              value={`${res.ymd.years} y ${res.ymd.months} m ${res.ymd.days} d`}
            />
            <Stat label="Total months" value={fmtNum(res.totalMonths, 0)} />
            <Stat label="Total hours" value={fmtNum(res.hours, 0)} />
          </div>
          <FormulaNote>
            Day count = end date − start date{inclusive ? " + 1 (both end days included)" : ""}. The
            calendar span counts whole years and months first, then leftover days.
          </FormulaNote>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Time Duration
   ════════════════════════════════════════════════════════════════ */

function fmtClock(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")} (${h12}:${String(mm).padStart(2, "0")} ${ampm})`;
}

function TimeDuration() {
  const [mode, setMode] = useState<"span" | "offset">("span");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:30");
  const [direction, setDirection] = useState<"add" | "subtract">("add");
  const [addH, setAddH] = useState("2");
  const [addM, setAddM] = useState("45");

  const span = useMemo(() => {
    const s = parseTimeInput(start);
    const e = parseTimeInput(end);
    if (s === null || e === null) return null;
    let diff = e - s;
    const crosses = diff < 0;
    if (crosses) diff += 1440;
    return { diff, crosses, totalMin: diff, totalSec: diff * 60 };
  }, [start, end]);

  const offset = useMemo(() => {
    const s = parseTimeInput(start);
    const h = parseNum(addH);
    const m = parseNum(addM);
    if (s === null || h === null || m === null) return null;
    if (h < 0 || m < 0) return { ok: false as const, error: "Hours and minutes to apply cannot be negative." };
    const dur = Math.round(h * 60 + m);
    const raw = direction === "add" ? s + dur : s - dur;
    const result = ((raw % 1440) + 1440) % 1440;
    const daysShift = direction === "add" ? Math.floor((s + dur) / 1440) : dur > s ? Math.ceil((dur - s) / 1440) : 0;
    return { ok: true as const, dur, result, daysShift };
  }, [start, addH, addM, direction]);

  return (
    <div className="space-y-5">
      <ModeTabs<"span" | "offset">
        tabs={[
          ["span", "Between two times"],
          ["offset", "Add / subtract time"],
        ]}
        value={mode}
        onChange={setMode}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start time">
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
        </Field>
        {mode === "span" ? (
          <Field label="End time">
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
          </Field>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Field label="Hours">
              <input type="number" min={0} value={addH} onChange={(e) => setAddH(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Minutes">
              <input type="number" min={0} value={addM} onChange={(e) => setAddM(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Direction">
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value === "subtract" ? "subtract" : "add")}
                className={inputCls}
              >
                <option value="add">Add (+)</option>
                <option value="subtract">Subtract (−)</option>
              </select>
            </Field>
          </div>
        )}
      </div>

      {mode === "span" && (
        <>
          {span === null && <Note>Enter both times — the duration updates live.</Note>}
          {span && (
            <div className="space-y-4">
              <ResultHeadline
                value={fmtHM(span.diff)}
                caption={
                  span.crosses
                    ? "End time is on the next day (crosses midnight)"
                    : "Between the two times"
                }
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Total minutes" value={fmtNum(span.totalMin, 0)} />
                <Stat label="Total seconds" value={fmtNum(span.totalSec, 0)} />
                <Stat label="Decimal hours" value={fmtNum(span.diff / 60, 2)} />
                <Stat
                  label="Days + hours + minutes"
                  value={`${Math.floor(span.diff / 1440)} d ${Math.floor((span.diff % 1440) / 60)} h ${span.diff % 60} m`}
                />
              </div>
              <FormulaNote>
                Duration = end − start; if the end is earlier than the start, 24 hours are added
                (the span crosses midnight).
              </FormulaNote>
            </div>
          )}
        </>
      )}

      {mode === "offset" && (
        <>
          {offset === null && <Note>Enter a start time and the hours/minutes to apply.</Note>}
          {offset && !offset.ok && <WarningNote>{offset.error}</WarningNote>}
          {offset?.ok && (
            <div className="space-y-4">
              <ResultHeadline
                value={fmtClock(offset.result).split(" (")[0]}
                caption={fmtClock(offset.result).split(" (")[1]?.replace(")", "") ?? ""}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Applied duration" value={fmtHM(offset.dur)} />
                <Stat label="Result (24 h)" value={fmtClock(offset.result).split(" (")[0]} />
                <Stat
                  label="Total minutes"
                  value={fmtNum(((offset.result % 1440) + 1440) % 1440, 0)}
                />
                <Stat
                  label="Day shift"
                  value={
                    offset.daysShift === 0
                      ? "same day"
                      : `${offset.daysShift} day${offset.daysShift === 1 ? "" : "s"} ${direction === "add" ? "later" : "earlier"}`
                  }
                />
              </div>
              <FormulaNote>
                Result = start {direction === "add" ? "+" : "−"} duration, wrapped around the
                24-hour clock (mod 1440 minutes).
              </FormulaNote>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   GPA / CGPA (shared scale)
   ════════════════════════════════════════════════════════════════ */

const GRADE_SCALE: Array<[string, number]> = [
  ["A+", 4.0],
  ["A", 4.0],
  ["A-", 3.7],
  ["B+", 3.3],
  ["B", 3.0],
  ["B-", 2.7],
  ["C+", 2.3],
  ["C", 2.0],
  ["C-", 1.7],
  ["D+", 1.3],
  ["D", 1.0],
  ["D-", 0.7],
  ["F", 0.0],
];

const GRADE_POINTS: Record<string, number> = Object.fromEntries(GRADE_SCALE);

function ScaleTable() {
  return (
    <div>
      <div className="mb-2">
        <label className={labelCls + " !mb-0"}>4.0 scale mapping</label>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
        {GRADE_SCALE.map(([letter, pts]) => (
          <div
            key={letter}
            className="rounded-lg border border-[#121212]/12 bg-white px-3 py-2 text-center"
          >
            <div className="text-sm font-semibold text-cream">{letter}</div>
            <div className="text-xs text-[#163D2B]">{pts.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

let rowCounter = 0;
function nextRowId(): number {
  rowCounter += 1;
  return rowCounter;
}

/* ── GPA calculator ───────────────────────────────────────────── */

type CourseRow = { id: number; name: string; credits: string; grade: string };

function newCourseRow(): CourseRow {
  return { id: nextRowId(), name: "", credits: "3", grade: "A" };
}

function GpaCalculator() {
  const [rows, setRows] = useState<CourseRow[]>(() => [
    newCourseRow(),
    newCourseRow(),
    newCourseRow(),
    newCourseRow(),
  ]);

  const update = (id: number, patch: Partial<CourseRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const calc = useMemo(() => {
    let credits = 0;
    let points = 0;
    let skipped = 0;
    for (const r of rows) {
      const c = parseNum(r.credits);
      if (c === null || c <= 0) {
        skipped += 1;
        continue;
      }
      credits += c;
      points += GRADE_POINTS[r.grade] * c;
    }
    return { credits, points, gpa: credits > 0 ? points / credits : null, skipped };
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {rows.map((r, idx) => (
          <div key={r.id} className="grid grid-cols-[1fr_88px_110px_auto] items-center gap-3">
            <input
              type="text"
              value={r.name}
              onChange={(e) => update(r.id, { name: e.target.value })}
              placeholder={`Course ${idx + 1} (optional)`}
              className={inputCls}
            />
            <input
              type="number"
              min={0}
              step="0.5"
              value={r.credits}
              onChange={(e) => update(r.id, { credits: e.target.value })}
              placeholder="Credits"
              aria-label={`Credits for course ${idx + 1}`}
              className={inputCls}
            />
            <select
              value={r.grade}
              onChange={(e) => update(r.id, { grade: e.target.value })}
              aria-label={`Grade for course ${idx + 1}`}
              className={inputCls}
            >
              {GRADE_SCALE.map(([letter]) => (
                <option key={letter} value={letter}>
                  {letter}
                </option>
              ))}
            </select>
            <SecondaryButton
              onClick={() => remove(r.id)}
              disabled={rows.length <= 1}
              className="!px-3 !py-1.5 text-xs"
            >
              Remove
            </SecondaryButton>
          </div>
        ))}
      </div>
      <PrimaryButton onClick={() => setRows((prev) => [...prev, newCourseRow()])} className="!px-3 !py-1.5 text-xs">
        + Add course
      </PrimaryButton>

      {calc.gpa === null ? (
        <Note>Enter credit hours for at least one course — GPA updates live.</Note>
      ) : (
        <div className="space-y-4">
          <ResultHeadline
            value={calc.gpa.toFixed(2)}
            caption="Semester GPA on the 4.0 scale"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total credits" value={fmtNum(calc.credits, 1)} />
            <Stat label="Quality points" value={fmtNum(calc.points, 1)} />
            <Stat label="Courses counted" value={fmtNum(rows.length - calc.skipped, 0)} />
            <Stat
              label="Percentage equivalent"
              value={`${fmtNum((calc.gpa / 4) * 100, 1)}%`}
            />
          </div>
          {calc.skipped > 0 && (
            <WarningNote>
              {calc.skipped} row{calc.skipped === 1 ? "" : "s"} skipped — credit hours must be a
              positive number.
            </WarningNote>
          )}
          <FormulaNote>
            GPA = Σ (grade points × credits) ÷ Σ credits. Each letter grade is first mapped to
            points on the 4.0 scale below, then weighted by its credit hours.
          </FormulaNote>
        </div>
      )}
      <ScaleTable />
    </div>
  );
}

/* ── CGPA calculator ──────────────────────────────────────────── */

type SemesterRow = { id: number; name: string; credits: string; gpa: string };

function newSemesterRow(): SemesterRow {
  return { id: nextRowId(), name: "", credits: "18", gpa: "3.0" };
}

function CgpaCalculator() {
  const [rows, setRows] = useState<SemesterRow[]>(() => [
    newSemesterRow(),
    newSemesterRow(),
  ]);

  const update = (id: number, patch: Partial<SemesterRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const calc = useMemo(() => {
    let credits = 0;
    let points = 0;
    let skipped = 0;
    for (const r of rows) {
      const c = parseNum(r.credits);
      const g = parseNum(r.gpa);
      if (c === null || c <= 0 || g === null || g < 0 || g > 4) {
        skipped += 1;
        continue;
      }
      credits += c;
      points += g * c;
    }
    return { credits, points, cgpa: credits > 0 ? points / credits : null, skipped };
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {rows.map((r, idx) => (
          <div key={r.id} className="grid grid-cols-[1fr_88px_96px_auto] items-center gap-3">
            <input
              type="text"
              value={r.name}
              onChange={(e) => update(r.id, { name: e.target.value })}
              placeholder={`Semester ${idx + 1} (optional)`}
              className={inputCls}
            />
            <input
              type="number"
              min={0}
              step="0.5"
              value={r.credits}
              onChange={(e) => update(r.id, { credits: e.target.value })}
              placeholder="Credits"
              aria-label={`Credits for semester ${idx + 1}`}
              className={inputCls}
            />
            <input
              type="number"
              min={0}
              max={4}
              step="0.01"
              value={r.gpa}
              onChange={(e) => update(r.id, { gpa: e.target.value })}
              placeholder="GPA"
              aria-label={`GPA for semester ${idx + 1}`}
              className={inputCls}
            />
            <SecondaryButton
              onClick={() => remove(r.id)}
              disabled={rows.length <= 1}
              className="!px-3 !py-1.5 text-xs"
            >
              Remove
            </SecondaryButton>
          </div>
        ))}
      </div>
      <PrimaryButton onClick={() => setRows((prev) => [...prev, newSemesterRow()])} className="!px-3 !py-1.5 text-xs">
        + Add semester
      </PrimaryButton>

      {calc.cgpa === null ? (
        <Note>
          Enter credit hours and a GPA (0–4) for at least one semester — CGPA updates live.
        </Note>
      ) : (
        <div className="space-y-4">
          <ResultHeadline value={calc.cgpa.toFixed(2)} caption="Cumulative GPA, weighted by credits" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total credits" value={fmtNum(calc.credits, 1)} />
            <Stat label="Weighted points" value={fmtNum(calc.points, 1)} />
            <Stat label="Semesters counted" value={fmtNum(rows.length - calc.skipped, 0)} />
            <Stat label="Percentage equivalent" value={`${fmtNum((calc.cgpa / 4) * 100, 1)}%`} />
          </div>
          {calc.skipped > 0 && (
            <WarningNote>
              {calc.skipped} row{calc.skipped === 1 ? "" : "s"} skipped — credits must be positive
              and GPA between 0 and 4.
            </WarningNote>
          )}
          <FormulaNote>
            CGPA = Σ (semester GPA × semester credits) ÷ Σ credits — a credit-weighted average of
            the per-semester GPAs.
          </FormulaNote>
        </div>
      )}
      <ScaleTable />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Grade Calculator
   ════════════════════════════════════════════════════════════════ */

function letterFor(pct: number): string {
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}

type AssessRow = { id: number; name: string; weight: string; score: string };

function newAssessRow(): AssessRow {
  return { id: nextRowId(), name: "", weight: "", score: "" };
}

function GradeCalculator() {
  const [mode, setMode] = useState<"weighted" | "final">("weighted");
  const [rows, setRows] = useState<AssessRow[]>(() => [newAssessRow(), newAssessRow(), newAssessRow()]);
  const [current, setCurrent] = useState("74");
  const [finalWeight, setFinalWeight] = useState("30");
  const [target, setTarget] = useState("80");

  const update = (id: number, patch: Partial<AssessRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const weighted = useMemo(() => {
    let sumW = 0;
    let acc = 0;
    let skipped = 0;
    for (const r of rows) {
      const w = parseNum(r.weight);
      const s = parseNum(r.score);
      if (w === null || s === null || w <= 0) {
        skipped += 1;
        continue;
      }
      sumW += w;
      acc += s * w;
    }
    return {
      sumW,
      overall: sumW > 0 ? acc / sumW : null,
      skipped,
    };
  }, [rows]);

  const final = useMemo(() => {
    const c = parseNum(current);
    const fw = parseNum(finalWeight);
    const t = parseNum(target);
    if (c === null || fw === null || t === null) return null;
    if (fw <= 0 || fw > 100) return { ok: false as const, error: "Final exam weight must be between 0 and 100 percent." };
    const share = fw / 100;
    const required = (t - c * (1 - share)) / share;
    const maxPossible = c * (1 - share) + 100 * share;
    const worstCase = c * (1 - share);
    return { ok: true as const, required, maxPossible, worstCase };
  }, [current, finalWeight, target]);

  return (
    <div className="space-y-5">
      <ModeTabs<"weighted" | "final">
        tabs={[
          ["weighted", "Weighted grade"],
          ["final", "What do I need on the final?"],
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === "weighted" ? (
        <div className="space-y-5">
          <div className="space-y-3">
            {rows.map((r, idx) => (
              <div key={r.id} className="grid grid-cols-[1fr_96px_96px_auto] items-center gap-3">
                <input
                  type="text"
                  value={r.name}
                  onChange={(e) => update(r.id, { name: e.target.value })}
                  placeholder={`Assessment ${idx + 1} (e.g. Midterm)`}
                  className={inputCls}
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={r.weight}
                  onChange={(e) => update(r.id, { weight: e.target.value })}
                  placeholder="Weight %"
                  aria-label={`Weight for assessment ${idx + 1}`}
                  className={inputCls}
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={r.score}
                  onChange={(e) => update(r.id, { score: e.target.value })}
                  placeholder="Score %"
                  aria-label={`Score for assessment ${idx + 1}`}
                  className={inputCls}
                />
                <SecondaryButton
                  onClick={() => remove(r.id)}
                  disabled={rows.length <= 1}
                  className="!px-3 !py-1.5 text-xs"
                >
                  Remove
                </SecondaryButton>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={() => setRows((prev) => [...prev, newAssessRow()])} className="!px-3 !py-1.5 text-xs">
              + Add assessment
            </PrimaryButton>
            <span className="text-xs text-muted">
              Weights currently add up to {fmtNum(weighted.sumW, 1)}%
            </span>
          </div>
          {weighted.overall === null ? (
            <Note>Enter a weight and score for at least one assessment — the grade updates live.</Note>
          ) : (
            <div className="space-y-4">
              <ResultHeadline
                value={`${fmtNum(weighted.overall, 2)}%  ·  ${letterFor(weighted.overall)}`}
                caption="Overall weighted grade"
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Total weight" value={`${fmtNum(weighted.sumW, 1)}%`} />
                <Stat label="Letter grade" value={letterFor(weighted.overall)} />
                <Stat label="Assessments counted" value={fmtNum(rows.length - weighted.skipped, 0)} />
                <Stat
                  label="Share of 100%"
                  value={`${fmtNum((weighted.overall / 100) * (weighted.sumW / 100) * 100, 1)}%`}
                />
              </div>
              {Math.abs(weighted.sumW - 100) > 0.01 && (
                <WarningNote>
                  Weights add up to {fmtNum(weighted.sumW, 1)}%, not 100% — the overall grade is
                  normalised over the entered weight.
                </WarningNote>
              )}
              <FormulaNote>
                Overall = Σ (score × weight) ÷ Σ weights — each score is weighted by its share of
                the course.
              </FormulaNote>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Current grade so far (%)">
              <input type="number" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Final exam weight (% of course)">
              <input type="number" value={finalWeight} onChange={(e) => setFinalWeight(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Target overall grade (%)">
              <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className={inputCls} />
            </Field>
          </div>
          {final === null && <Note>Fill all three fields — the required score updates live.</Note>}
          {final && !final.ok && <WarningNote>{final.error}</WarningNote>}
          {final?.ok && (
            <div className="space-y-4">
              {final.required > 100 ? (
                <>
                  <ResultHeadline
                    value="Not reachable"
                    caption={`Even a perfect 100% on the final gives ${fmtNum(final.maxPossible, 2)}% overall`}
                  />
                </>
              ) : final.required <= 0 ? (
                <ResultHeadline
                  value="Already secured"
                  caption={`You would still hit the target with 0% on the final (worst case: ${fmtNum(final.worstCase, 2)}% overall)`}
                />
              ) : (
                <>
                  <ResultHeadline
                    value={`${fmtNum(final.required, 2)}%`}
                    caption={`Score needed on the final exam — grade ${letterFor(final.required)}`}
                  />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Required score" value={`${fmtNum(final.required, 2)}%`} />
                    <Stat label="Target" value={`${fmtNum(parseNum(target) ?? 0, 2)}%`} />
                    <Stat
                      label="Best possible"
                      value={`${fmtNum(final.maxPossible, 2)}% (${letterFor(final.maxPossible)})`}
                    />
                    <Stat
                      label="Final is worth"
                      value={`${fmtNum(parseNum(finalWeight) ?? 0, 1)}% of course`}
                    />
                  </div>
                </>
              )}
              <FormulaNote>
                Required = (target − current × (1 − final weight)) ÷ final weight. Your current
                grade keeps its share of the course, and the remainder must come from the final.
              </FormulaNote>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Discount Calculator
   ════════════════════════════════════════════════════════════════ */

function DiscountCalculator() {
  const [price, setPrice] = useState("120");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("25");

  const res = useMemo(() => {
    const p = parseNum(price);
    const v = parseNum(value);
    if (p === null || v === null) return null;
    if (p < 0 || v < 0) return { ok: false as const, error: "Price and discount cannot be negative." };
    const saving = type === "percent" ? (p * v) / 100 : v;
    const final = p - saving;
    return {
      ok: true as const,
      price: p,
      saving,
      final,
      exceeds: final < 0,
      effPct: p > 0 ? (saving / p) * 100 : null,
    };
  }, [price, type, value]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Original price ($)">
          <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Discount type">
          <select
            value={type}
            onChange={(e) => setType(e.target.value === "fixed" ? "fixed" : "percent")}
            className={inputCls}
          >
            <option value="percent">Percentage off (%)</option>
            <option value="fixed">Fixed amount off ($)</option>
          </select>
        </Field>
        <Field label={type === "percent" ? "Discount (%)" : "Discount amount ($)"}>
          <input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} className={inputCls} />
        </Field>
      </div>
      {res === null && <Note>Enter a price and a discount — the result updates live.</Note>}
      {res && !res.ok && <WarningNote>{res.error}</WarningNote>}
      {res?.ok && (
        <div className="space-y-4">
          <ResultHeadline
            value={money(Math.max(res.final, 0))}
            caption={`Final price — you save ${money(res.saving)}`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Original price" value={money(res.price)} />
            <Stat label="You save" value={money(res.saving)} />
            <Stat
              label="Effective discount"
              value={res.effPct !== null ? `${fmtNum(res.effPct, 2)}%` : "—"}
            />
            <Stat label="You pay" value={`${res.effPct !== null ? fmtNum(100 - res.effPct, 2) : "—"}% of original`} />
          </div>
          {res.exceeds && (
            <WarningNote>
              The discount is larger than the price — the final price would be negative, so it is
              shown as 0.
            </WarningNote>
          )}
          <FormulaNote>
            {type === "percent"
              ? `Final = price − (price × discount ÷ 100) = ${fmtNum(parseNum(price) ?? 0, 2)} − (${fmtNum(parseNum(price) ?? 0, 2)} × ${fmtNum(parseNum(value) ?? 0, 2)} ÷ 100).`
              : `Final = price − fixed discount = ${fmtNum(parseNum(price) ?? 0, 2)} − ${fmtNum(parseNum(value) ?? 0, 2)}.`}
          </FormulaNote>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Profit Margin Calculator
   ════════════════════════════════════════════════════════════════ */

type MarginMode = "costRevenue" | "costMargin" | "revenueMargin";

function ProfitMarginCalculator() {
  const [mode, setMode] = useState<MarginMode>("costRevenue");
  const [cost, setCost] = useState("80");
  const [revenue, setRevenue] = useState("100");
  const [margin, setMargin] = useState("20");

  const res = useMemo(() => {
    const c = parseNum(cost);
    const r = parseNum(revenue);
    const m = parseNum(margin);
    let outCost: number;
    let outRevenue: number;
    if (mode === "costRevenue") {
      if (c === null || r === null) return null;
      if (c < 0 || r < 0) return { ok: false as const, error: "Cost and revenue cannot be negative." };
      outCost = c;
      outRevenue = r;
    } else if (mode === "costMargin") {
      if (c === null || m === null) return null;
      if (c < 0) return { ok: false as const, error: "Cost cannot be negative." };
      if (m < 0 || m >= 100) return { ok: false as const, error: "Margin must be between 0 and 100 percent (exclusive of 100)." };
      outCost = c;
      outRevenue = c / (1 - m / 100);
    } else {
      if (r === null || m === null) return null;
      if (r < 0) return { ok: false as const, error: "Revenue cannot be negative." };
      if (m < 0 || m > 100) return { ok: false as const, error: "Margin must be between 0 and 100 percent." };
      outCost = r * (1 - m / 100);
      outRevenue = r;
    }
    const profit = outRevenue - outCost;
    return {
      ok: true as const,
      cost: outCost,
      revenue: outRevenue,
      profit,
      margin: outRevenue !== 0 ? (profit / outRevenue) * 100 : null,
      markup: outCost !== 0 ? (profit / outCost) * 100 : null,
    };
  }, [mode, cost, revenue, margin]);

  const labels: Record<MarginMode, [string, string]> = {
    costRevenue: ["Cost ($)", "Revenue ($)"],
    costMargin: ["Cost ($)", "Desired margin (%)"],
    revenueMargin: ["Revenue ($)", "Desired margin (%)"],
  };

  return (
    <div className="space-y-5">
      <ModeTabs<MarginMode>
        tabs={[
          ["costRevenue", "Cost + revenue"],
          ["costMargin", "Cost + margin"],
          ["revenueMargin", "Revenue + margin"],
        ]}
        value={mode}
        onChange={setMode}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels[mode][0]}>
          <input
            type="number"
            value={mode === "revenueMargin" ? revenue : cost}
            onChange={(e) => (mode === "revenueMargin" ? setRevenue(e.target.value) : setCost(e.target.value))}
            className={inputCls}
          />
        </Field>
        <Field label={labels[mode][1]}>
          <input
            type="number"
            value={mode === "costRevenue" ? revenue : margin}
            onChange={(e) => (mode === "costRevenue" ? setRevenue(e.target.value) : setMargin(e.target.value))}
            className={inputCls}
          />
        </Field>
      </div>
      {res === null && <Note>Enter the two values — profit, margin and markup update live.</Note>}
      {res && !res.ok && <WarningNote>{res.error}</WarningNote>}
      {res?.ok && (
        <div className="space-y-4">
          <ResultHeadline
            value={money(res.profit)}
            caption={`Profit — margin ${res.margin !== null ? `${fmtNum(res.margin, 2)}%` : "undefined (zero revenue)"}, markup ${res.markup !== null ? `${fmtNum(res.markup, 2)}%` : "undefined (zero cost)"}`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Cost" value={money(res.cost)} />
            <Stat label="Revenue" value={money(res.revenue)} />
            <Stat label="Profit" value={money(res.profit)} />
            <Stat label="Margin" value={res.margin !== null ? `${fmtNum(res.margin, 2)}%` : "—"} />
            <Stat label="Markup" value={res.markup !== null ? `${fmtNum(res.markup, 2)}%` : "—"} />
          </div>
          <FormulaNote>
            {mode === "costRevenue" && (
              <>
                Profit = revenue − cost · margin = profit ÷ revenue × 100 (share of the selling
                price) · markup = profit ÷ cost × 100 (added on top of cost).
              </>
            )}
            {mode === "costMargin" && (
              <>
                Revenue = cost ÷ (1 − margin ÷ 100) — the price at which the chosen share of the
                selling price is profit.
              </>
            )}
            {mode === "revenueMargin" && (
              <>
                Cost = revenue × (1 − margin ÷ 100) — what you can afford to spend while keeping
                the chosen margin.
              </>
            )}
          </FormulaNote>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Loan Calculator
   ════════════════════════════════════════════════════════════════ */

function LoanCalculator() {
  const [amount, setAmount] = useState("20000");
  const [rate, setRate] = useState("6.5");
  const [years, setYears] = useState("5");

  const calc = useMemo(() => {
    const p = parseNum(amount);
    const rAnnual = parseNum(rate);
    const y = parseNum(years);
    if (p === null || rAnnual === null || y === null) return null;
    if (p <= 0) return { ok: false as const, error: "Loan amount must be greater than zero." };
    if (rAnnual < 0) return { ok: false as const, error: "Interest rate cannot be negative." };
    const months = Math.round(y * 12);
    if (months < 1) return { ok: false as const, error: "The term must be at least one month." };
    if (months > 1200) return { ok: false as const, error: "The term is limited to 100 years (1200 months)." };
    const s = amortise(p, rAnnual, months);
    return { ok: true as const, ...s, months };
  }, [amount, rate, years]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Loan amount ($)">
          <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Annual interest rate (%)">
          <input type="number" min={0} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Term (years)">
          <input type="number" min={0} step="0.5" value={years} onChange={(e) => setYears(e.target.value)} className={inputCls} />
        </Field>
      </div>
      {calc === null && <Note>Enter the amount, rate and term — the schedule updates live.</Note>}
      {calc && !calc.ok && <WarningNote>{calc.error}</WarningNote>}
      {calc?.ok && (
        <AmortisationBlock
          payment={calc.payment}
          rows={calc.rows}
          totalInterest={calc.totalInterest}
          totalPaid={calc.totalPaid}
          principal={parseNum(amount) ?? 0}
          months={calc.months}
          paymentLabel="Monthly payment"
          formula={
            <>
              Monthly payment = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount,{" "}
              r = annual rate ÷ 12 ÷ 100 and n = {fmtNum(calc.months, 0)} monthly payments. Total
              interest is the sum of every month&apos;s interest charge.
            </>
          }
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   EMI Calculator
   ════════════════════════════════════════════════════════════════ */

function EmiCalculator() {
  const [amount, setAmount] = useState("500000");
  const [rate, setRate] = useState("8.5");
  const [tenure, setTenure] = useState("20");
  const [unit, setUnit] = useState<"years" | "months">("years");

  const calc = useMemo(() => {
    const p = parseNum(amount);
    const rAnnual = parseNum(rate);
    const t = parseNum(tenure);
    if (p === null || rAnnual === null || t === null) return null;
    if (p <= 0) return { ok: false as const, error: "Loan amount must be greater than zero." };
    if (rAnnual < 0) return { ok: false as const, error: "Interest rate cannot be negative." };
    const months = unit === "years" ? Math.round(t * 12) : Math.round(t);
    if (months < 1) return { ok: false as const, error: "The tenure must be at least one month." };
    if (months > 1200) return { ok: false as const, error: "The tenure is limited to 1200 months." };
    const s = amortise(p, rAnnual, months);
    return { ok: true as const, ...s, months };
  }, [amount, rate, tenure, unit]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Loan amount ($)">
          <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Annual interest rate (%)">
          <input type="number" min={0} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Tenure">
          <input type="number" min={0} value={tenure} onChange={(e) => setTenure(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Tenure unit">
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value === "months" ? "months" : "years")}
            className={inputCls}
          >
            <option value="years">Years</option>
            <option value="months">Months</option>
          </select>
        </Field>
      </div>
      {calc === null && <Note>Enter the amount, rate and tenure — the EMI updates live.</Note>}
      {calc && !calc.ok && <WarningNote>{calc.error}</WarningNote>}
      {calc?.ok && (
        <AmortisationBlock
          payment={calc.payment}
          rows={calc.rows}
          totalInterest={calc.totalInterest}
          totalPaid={calc.totalPaid}
          principal={parseNum(amount) ?? 0}
          months={calc.months}
          paymentLabel="Monthly EMI"
          formula={
            <>
              EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the principal, r = annual rate
              ÷ 12 ÷ 100 and n = {fmtNum(calc.months, 0)} monthly instalments. Every EMI pays the
              month&apos;s interest first; the rest reduces the principal.
            </>
          }
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Simple Interest Calculator
   ════════════════════════════════════════════════════════════════ */

function SimpleInterestCalculator() {
  const [principal, setPrincipal] = useState("10000");
  const [rate, setRate] = useState("5");
  const [time, setTime] = useState("3");
  const [unit, setUnit] = useState<"years" | "months">("years");

  const res = useMemo(() => {
    const p = parseNum(principal);
    const r = parseNum(rate);
    const t = parseNum(time);
    if (p === null || r === null || t === null) return null;
    if (p < 0 || r < 0 || t < 0) return { ok: false as const, error: "Values cannot be negative." };
    const years = unit === "years" ? t : t / 12;
    const interest = (p * r * years) / 100;
    return { ok: true as const, years, interest, total: p + interest, perYear: (p * r) / 100 };
  }, [principal, rate, time, unit]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Principal ($)">
          <input type="number" min={0} value={principal} onChange={(e) => setPrincipal(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Annual interest rate (%)">
          <input type="number" min={0} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Time">
          <input type="number" min={0} step="0.25" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Time unit">
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value === "months" ? "months" : "years")}
            className={inputCls}
          >
            <option value="years">Years</option>
            <option value="months">Months</option>
          </select>
        </Field>
      </div>
      {res === null && <Note>Enter principal, rate and time — the interest updates live.</Note>}
      {res && !res.ok && <WarningNote>{res.error}</WarningNote>}
      {res?.ok && (
        <div className="space-y-4">
          <ResultHeadline
            value={money(res.interest)}
            caption={`Simple interest over ${fmtNum(res.years, 2)} year${res.years === 1 ? "" : "s"}`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Final amount" value={money(res.total)} />
            <Stat label="Interest per year" value={money(res.perYear)} />
            <Stat label="Principal" value={money(parseNum(principal) ?? 0)} />
            <Stat
              label="Interest share"
              value={res.total > 0 ? `${fmtNum((res.interest / res.total) * 100, 1)}% of final` : "—"}
            />
          </div>
          <FormulaNote>
            Interest = principal × rate ÷ 100 × time. Time is in years{unit === "months" ? " (months are divided by 12)" : ""} and
            interest never compounds — it is charged only on the original principal. Final amount
            = principal + interest.
          </FormulaNote>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Compound Interest Calculator
   ════════════════════════════════════════════════════════════════ */

const COMPOUND_FREQ: Array<[string, number, string]> = [
  ["yearly", 1, "Yearly"],
  ["halfyearly", 2, "Half-yearly"],
  ["quarterly", 4, "Quarterly"],
  ["monthly", 12, "Monthly"],
  ["daily", 365, "Daily"],
];

function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState("10000");
  const [rate, setRate] = useState("7");
  const [years, setYears] = useState("10");
  const [freq, setFreq] = useState("monthly");

  const res = useMemo(() => {
    const p = parseNum(principal);
    const r = parseNum(rate);
    const t = parseNum(years);
    const freqDef = COMPOUND_FREQ.find(([id]) => id === freq) ?? COMPOUND_FREQ[0];
    const n = freqDef[1];
    if (p === null || r === null || t === null) return null;
    if (p <= 0) return { ok: false as const, error: "Principal must be greater than zero." };
    if (r < 0) return { ok: false as const, error: "Interest rate cannot be negative." };
    if (t <= 0) return { ok: false as const, error: "The number of years must be greater than zero." };
    const growth = 1 + r / (100 * n);
    const balanceAt = (y: number) => p * Math.pow(growth, n * y);
    const final = balanceAt(t);
    const rowCount = Math.min(Math.ceil(t), 60);
    const rows: ReactNode[][] = [];
    for (let i = 1; i <= rowCount; i++) {
      const y = Math.min(i, t);
      const bal = balanceAt(y);
      const prev = i === 1 ? p : balanceAt(Math.min(i - 1, t));
      rows.push([
        `Year ${fmtNum(y, 2)}`,
        money(bal),
        money(bal - prev),
        money(bal - p),
      ]);
    }
    return {
      ok: true as const,
      final,
      totalInterest: final - p,
      effective: (Math.pow(final / p, 1 / t) - 1) * 100,
      rows,
      truncated: Math.ceil(t) > 60,
      totalYears: Math.ceil(t),
      n,
      freqLabel: freqDef[2],
    };
  }, [principal, rate, years, freq]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Principal ($)">
          <input type="number" min={0} value={principal} onChange={(e) => setPrincipal(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Annual interest rate (%)">
          <input type="number" min={0} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Years">
          <input type="number" min={0} step="0.5" value={years} onChange={(e) => setYears(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Compounding">
          <select value={freq} onChange={(e) => setFreq(e.target.value)} className={inputCls}>
            {COMPOUND_FREQ.map(([id, , label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {res === null && <Note>Enter principal, rate and years — growth updates live.</Note>}
      {res && !res.ok && <WarningNote>{res.error}</WarningNote>}
      {res?.ok && (
        <div className="space-y-4">
          <ResultHeadline
            value={money(res.final)}
            caption={`Final balance — ${money(res.totalInterest)} interest earned`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Principal" value={money(parseNum(principal) ?? 0)} />
            <Stat label="Total interest" value={money(res.totalInterest)} />
            <Stat label="Effective annual yield" value={`${fmtNum(res.effective, 3)}%`} />
            <Stat label="Growth multiple" value={`${fmtNum(res.final / (parseNum(principal) || 1), 3)}×`} />
          </div>
          {res.truncated && (
            <WarningNote>
              Showing the first 60 of {fmtNum(res.totalYears, 0)} years — the table is capped to
              keep the page fast; the final balance above is still exact.
            </WarningNote>
          )}
          <DataTable
            head={["Year", "Balance", "Interest this year", "Cumulative interest"]}
            rows={res.rows}
          />
          <FormulaNote>
            Amount = principal × (1 + rate ÷ 100 ÷ n)^(n × years), compounded {res.freqLabel.toLowerCase()}{" "}
            (n = {res.n} per year). Each table row shows the balance at the end of that year.
          </FormulaNote>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Unit Converter
   ════════════════════════════════════════════════════════════════ */

type Unit = { id: string; label: string; factor: number };
type UnitCat = { id: string; label: string; units: Unit[] };

const UNIT_CATS: UnitCat[] = [
  {
    id: "length",
    label: "Length",
    units: [
      { id: "mm", label: "Millimetre (mm)", factor: 0.001 },
      { id: "cm", label: "Centimetre (cm)", factor: 0.01 },
      { id: "m", label: "Metre (m)", factor: 1 },
      { id: "km", label: "Kilometre (km)", factor: 1000 },
      { id: "in", label: "Inch (in)", factor: 0.0254 },
      { id: "ft", label: "Foot (ft)", factor: 0.3048 },
      { id: "yd", label: "Yard (yd)", factor: 0.9144 },
      { id: "mi", label: "Mile (mi)", factor: 1609.344 },
      { id: "nmi", label: "Nautical mile (nmi)", factor: 1852 },
    ],
  },
  {
    id: "weight",
    label: "Weight",
    units: [
      { id: "mg", label: "Milligram (mg)", factor: 1e-6 },
      { id: "g", label: "Gram (g)", factor: 0.001 },
      { id: "kg", label: "Kilogram (kg)", factor: 1 },
      { id: "t", label: "Tonne (t)", factor: 1000 },
      { id: "oz", label: "Ounce (oz)", factor: 0.028349523125 },
      { id: "lb", label: "Pound (lb)", factor: 0.45359237 },
      { id: "st", label: "Stone (st)", factor: 6.35029318 },
    ],
  },
  {
    id: "temperature",
    label: "Temperature",
    units: [
      { id: "c", label: "Celsius (°C)", factor: 1 },
      { id: "f", label: "Fahrenheit (°F)", factor: 1 },
      { id: "k", label: "Kelvin (K)", factor: 1 },
    ],
  },
  {
    id: "area",
    label: "Area",
    units: [
      { id: "mm2", label: "Square millimetre (mm²)", factor: 1e-6 },
      { id: "cm2", label: "Square centimetre (cm²)", factor: 1e-4 },
      { id: "m2", label: "Square metre (m²)", factor: 1 },
      { id: "ha", label: "Hectare (ha)", factor: 1e4 },
      { id: "km2", label: "Square kilometre (km²)", factor: 1e6 },
      { id: "in2", label: "Square inch (in²)", factor: 0.00064516 },
      { id: "ft2", label: "Square foot (ft²)", factor: 0.09290304 },
      { id: "ac", label: "Acre (ac)", factor: 4046.8564224 },
      { id: "mi2", label: "Square mile (mi²)", factor: 2589988.110336 },
    ],
  },
  {
    id: "volume",
    label: "Volume",
    units: [
      { id: "ml", label: "Millilitre (ml)", factor: 0.001 },
      { id: "l", label: "Litre (l)", factor: 1 },
      { id: "m3", label: "Cubic metre (m³)", factor: 1000 },
      { id: "tsp", label: "Teaspoon US (tsp)", factor: 0.00492892159375 },
      { id: "tbsp", label: "Tablespoon US (tbsp)", factor: 0.01478676478125 },
      { id: "floz", label: "Fluid ounce US (fl oz)", factor: 0.0295735295625 },
      { id: "cup", label: "Cup US (cup)", factor: 0.2365882365 },
      { id: "pt", label: "Pint US (pt)", factor: 0.473176473 },
      { id: "qt", label: "Quart US (qt)", factor: 0.946352946 },
      { id: "gal", label: "Gallon US (gal)", factor: 3.785411784 },
    ],
  },
  {
    id: "speed",
    label: "Speed",
    units: [
      { id: "ms", label: "Metre/second (m/s)", factor: 1 },
      { id: "kmh", label: "Kilometre/hour (km/h)", factor: 1 / 3.6 },
      { id: "mph", label: "Mile/hour (mph)", factor: 0.44704 },
      { id: "kn", label: "Knot (kn)", factor: 0.5144444444444445 },
      { id: "fts", label: "Foot/second (ft/s)", factor: 0.3048 },
    ],
  },
  {
    id: "data",
    label: "Data size",
    units: [
      { id: "bit", label: "Bit (b)", factor: 0.125 },
      { id: "b", label: "Byte (B)", factor: 1 },
      { id: "kb", label: "Kilobyte (KB, 1000)", factor: 1e3 },
      { id: "mb", label: "Megabyte (MB, 1000²)", factor: 1e6 },
      { id: "gb", label: "Gigabyte (GB, 1000³)", factor: 1e9 },
      { id: "tb", label: "Terabyte (TB, 1000⁴)", factor: 1e12 },
      { id: "kib", label: "Kibibyte (KiB, 1024)", factor: 1024 },
      { id: "mib", label: "Mebibyte (MiB, 1024²)", factor: 1048576 },
      { id: "gib", label: "Gibibyte (GiB, 1024³)", factor: 1073741824 },
      { id: "tib", label: "Tebibyte (TiB, 1024⁴)", factor: 1099511627776 },
    ],
  },
];

function tempConvert(v: number, from: string, to: string): number {
  let c: number;
  if (from === "f") c = ((v - 32) * 5) / 9;
  else if (from === "k") c = v - 273.15;
  else c = v;
  if (to === "f") return (c * 9) / 5 + 32;
  if (to === "k") return c + 273.15;
  return c;
}

function unitLabel(cat: UnitCat, id: string): string {
  return cat.units.find((u) => u.id === id)?.label ?? id;
}

function UnitConverter() {
  const [catId, setCatId] = useState("length");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("ft");
  const [val, setVal] = useState("1");

  const cat = UNIT_CATS.find((c) => c.id === catId) ?? UNIT_CATS[0];
  const isTemp = cat.id === "temperature";

  const changeCat = (id: string) => {
    const next = UNIT_CATS.find((c) => c.id === id);
    if (!next) return;
    setCatId(id);
    setFrom(next.units[0].id);
    setTo(next.units[1] ? next.units[1].id : next.units[0].id);
  };

  const v = parseNum(val);
  const converted =
    v === null
      ? null
      : isTemp
        ? tempConvert(v, from, to)
        : (v * (cat.units.find((u) => u.id === from)?.factor ?? 1)) /
          (cat.units.find((u) => u.id === to)?.factor ?? 1);

  return (
    <div className="space-y-5">
      <Field label="Category">
        <select value={catId} onChange={(e) => changeCat(e.target.value)} className={inputCls + " sm:w-64"}>
          {UNIT_CATS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Value">
          <input type="number" value={val} onChange={(e) => setVal(e.target.value)} className={inputCls} />
        </Field>
        <Field label="From">
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls}>
            {cat.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="To">
          <select value={to} onChange={(e) => setTo(e.target.value)} className={inputCls}>
            {cat.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {v === null || converted === null ? (
        <Note>Enter a value — every conversion updates live.</Note>
      ) : (
        <div className="space-y-4">
          <ResultHeadline
            value={`${fmtSmart(v)} ${unitLabel(cat, from).replace(/\s*\(.*\)$/, "")} = ${fmtSmart(converted)} ${unitLabel(cat, to).replace(/\s*\(.*\)$/, "")}`}
            caption={`${cat.label} conversion`}
          />
          <DataTable
            head={[`${fmtSmart(v)} in every ${cat.label.toLowerCase()} unit`, "Value"]}
            rows={cat.units.map((u) => [
              u.label,
              isTemp
                ? fmtSmart(tempConvert(v, from, u.id))
                : fmtSmart((v * (cat.units.find((x) => x.id === from)?.factor ?? 1)) / u.factor),
            ])}
          />
          <FormulaNote>
            {isTemp
              ? "Temperature uses offsets, not factors: °F = °C × 9⁄5 + 32, K = °C + 273.15 — the input is first converted to Celsius, then to the target scale."
              : `Value × factor(${from}) ÷ factor(${to}) — every unit is converted through its base-unit factor.`}
          </FormulaNote>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Currency Converter
   ════════════════════════════════════════════════════════════════ */

const CURRENCIES = [
  "AUD", "BGN", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP",
  "HKD", "HUF", "IDR", "ILS", "INR", "ISK", "JPY", "KRW", "MXN", "MYR",
  "NOK", "NZD", "PHP", "PLN", "RON", "SEK", "SGD", "THB", "TRY", "USD", "ZAR",
];

const CURRENCY_NAMES: Record<string, string> = {
  AUD: "Australian dollar", BGN: "Bulgarian lev", BRL: "Brazilian real",
  CAD: "Canadian dollar", CHF: "Swiss franc", CNY: "Chinese yuan",
  CZK: "Czech koruna", DKK: "Danish krone", EUR: "Euro", GBP: "British pound",
  HKD: "Hong Kong dollar", HUF: "Hungarian forint", IDR: "Indonesian rupiah",
  ILS: "Israeli shekel", INR: "Indian rupee", ISK: "Icelandic krona",
  JPY: "Japanese yen", KRW: "South Korean won", MXN: "Mexican peso",
  MYR: "Malaysian ringgit", NOK: "Norwegian krone", NZD: "New Zealand dollar",
  PHP: "Philippine peso", PLN: "Polish zloty", RON: "Romanian leu",
  SEK: "Swedish krona", SGD: "Singapore dollar", THB: "Thai baht",
  TRY: "Turkish lira", USD: "US dollar", ZAR: "South African rand",
};

type FrankfurterResponse = { amount: number; base: string; date: string; rates: Record<string, number> };
type RateSet = { base: string; date: string; rates: Record<string, number>; fetchedAt: number };

/** In-memory cache of the last response per base currency. */
const rateCache = new Map<string, RateSet>();
const RATE_TTL_MS = 60 * 60 * 1000;

function CurrencyConverter() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateSet, setRateSet] = useState<RateSet | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const cached = rateCache.get(from);
    if (cached && Date.now() - cached.fetchedAt < RATE_TTL_MS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs from the external rate cache
      setRateSet(cached);
      setStatus("ready");
      setRateError(null);
      return;
    }
    setStatus("loading");
    fetchJsonWithTimeout<FrankfurterResponse>(
      `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(from)}`,
    )
      .then((data) => {
        if (cancelled) return;
        const rs: RateSet = { base: from, date: data.date, rates: data.rates, fetchedAt: Date.now() };
        rateCache.set(from, rs);
        setRateSet(rs);
        setStatus("ready");
        setRateError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setRateError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [from, tick]);

  const amt = parseNum(amount);
  const rate =
    from === to
      ? 1
      : rateSet && rateSet.base === from
        ? (rateSet.rates[to] ?? null)
        : null;
  const converted = amt !== null && rate !== null ? amt * rate : null;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Amount">
          <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
        </Field>
        <Field label="From">
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c} — {CURRENCY_NAMES[c] ?? c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="To">
          <select value={to} onChange={(e) => setTo(e.target.value)} className={inputCls}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c} — {CURRENCY_NAMES[c] ?? c}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SecondaryButton onClick={swap}>⇄ Swap currencies</SecondaryButton>
        <span className="text-xs text-muted">ECB daily reference rates via api.frankfurter.dev — no API key needed.</span>
      </div>

      {status === "loading" && (
        <p className="rounded-lg border border-[#163D2B]/25 bg-[#163D2B]/5 px-4 py-3 text-sm text-[#163D2B]">
          Fetching the latest {from} rates…
        </p>
      )}
      {status === "error" && (
        <div className="space-y-3">
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Could not load exchange rates{rateError ? ` (${rateError})` : ""}. Check your
            connection and try again — cached rates will be reused when available.
          </p>
          <PrimaryButton onClick={() => setTick((t) => t + 1)}>Try again</PrimaryButton>
        </div>
      )}

      {amt !== null && rate !== null && converted !== null && (
        <div className="space-y-4">
          <ResultHeadline
            value={fmtCurrency(converted, to)}
            caption={`${fmtNum(amt, 2)} ${from} converted at the latest ECB reference rate`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Exchange rate" value={`1 ${from} = ${fmtSmart(rate)} ${to}`} />
            <Stat label="Inverse rate" value={`1 ${to} = ${fmtSmart(1 / rate)} ${from}`} />
            <Stat label="Amount" value={`${fmtNum(amt, 2)} ${from}`} />
            <Stat label="Rate date" value={rateSet?.date ?? "—"} />
          </div>
          <FormulaNote>
            Converted = amount × rate. Rates for the {from} base are fetched once and cached in
            memory for an hour; the figures come from the European Central Bank&apos;s daily
            reference rates.
          </FormulaNote>
          {converted !== 0 && (
            <CopyButton
              text={`${fmtCurrency(converted, to)} (${fmtNum(amt, 2)} ${from} = ${fmtSmart(converted)} ${to} at ${rateSet?.date ?? "latest"} ECB rate)`}
              label="Copy result"
            />
          )}
        </div>
      )}
      {status === "ready" && rate === null && from !== to && (
        <WarningNote>
          {to} is missing from the latest rate table for base {from} — try swapping or picking
          another currency.
        </WarningNote>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Time Zone Converter
   ════════════════════════════════════════════════════════════════ */

const CURATED_ZONES = [
  "UTC",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Istanbul", "Europe/Moscow",
  "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Dhaka", "Asia/Bangkok",
  "Asia/Singapore", "Asia/Hong_Kong", "Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul",
  "Australia/Sydney", "Australia/Perth", "Pacific/Auckland",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Mexico_City", "America/Sao_Paulo", "America/Toronto",
  "Africa/Cairo", "Africa/Lagos", "Africa/Johannesburg", "Africa/Nairobi",
];

const TIME_ZONES: string[] = (() => {
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("timeZone");
    }
  } catch {
    // fall through to the curated list
  }
  return CURATED_ZONES;
})();

/** Offset (ms) of `zone` at instant `d`, derived from Intl parts. */
function zoneOffsetMinutes(d: Date, zone: string): number | null {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = dtf.formatToParts(d);
    const get = (t: string): number =>
      Number(parts.find((p) => p.type === t)?.value ?? "0");
    const asUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour") % 24,
      get("minute"),
      get("second"),
    );
    return Math.round((asUtc - d.getTime()) / 60000);
  } catch {
    return null;
  }
}

function fmtOffset(mins: number): string {
  const sign = mins < 0 ? "−" : "+";
  const m = Math.abs(mins);
  return `UTC${sign}${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function fmtInZone(d: Date, zone: string): string | null {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return null;
  }
}

function TimeZoneConverter() {
  const [dt, setDt] = useState("");
  const [fromZone, setFromZone] = useState("UTC");
  const [toZone, setToZone] = useState("Europe/London");

  const useNow = () => {
    const n = new Date();
    const pad = (v: number) => String(v).padStart(2, "0");
    setDt(
      `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`,
    );
  };

  const res = useMemo(() => {
    if (!dt) return null;
    const instant = new Date(dt);
    if (Number.isNaN(instant.getTime())) return { ok: false as const, error: "Enter a valid date and time." };
    const fromTime = fmtInZone(instant, fromZone);
    const toTime = fmtInZone(instant, toZone);
    if (fromTime === null || toTime === null) {
      return { ok: false as const, error: "One of the selected zones is not available in this browser." };
    }
    const fromOff = zoneOffsetMinutes(instant, fromZone);
    const toOff = zoneOffsetMinutes(instant, toZone);
    if (fromOff === null || toOff === null) {
      return { ok: false as const, error: "Could not determine the UTC offset for one of the zones." };
    }
    const diff = toOff - fromOff;
    return {
      ok: true as const,
      fromTime,
      toTime,
      fromOff,
      toOff,
      diff,
    };
  }, [dt, fromZone, toZone]);

  const diffText = (mins: number): string => {
    if (mins === 0) return "same time";
    const abs = Math.abs(mins);
    return `${Math.floor(abs / 60)} h ${abs % 60} m ${mins > 0 ? "ahead" : "behind"}`;
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Date & time (at the source zone)">
          <input type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Source zone">
          <select value={fromZone} onChange={(e) => setFromZone(e.target.value)} className={inputCls}>
            {TIME_ZONES.map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Target zone">
          <select value={toZone} onChange={(e) => setToZone(e.target.value)} className={inputCls}>
            {TIME_ZONES.map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <SecondaryButton onClick={useNow}>Use current time</SecondaryButton>
      {res === null && (
        <Note>
          Pick a date and time — the converted time in the target zone updates live, using the
          browser&apos;s IANA time zone database ({fmtNum(TIME_ZONES.length, 0)} zones).
        </Note>
      )}
      {res && !res.ok && <WarningNote>{res.error}</WarningNote>}
      {res?.ok && (
        <div className="space-y-4">
          <ResultHeadline value={res.toTime} caption={`In the target zone (${toZone.replace(/_/g, " ")})`} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Source time" value={res.fromTime} wide />
            <Stat label="Source offset" value={fmtOffset(res.fromOff)} />
            <Stat label="Target offset" value={fmtOffset(res.toOff)} />
            <Stat label="Difference" value={diffText(res.diff)} />
          </div>
          <FormulaNote>
            The entered date and time are interpreted in the source zone, then converted to the
            same instant in the target zone via the Intl API — daylight-saving offsets for that
            exact date are applied automatically.
          </FormulaNote>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Salary Calculator
   ════════════════════════════════════════════════════════════════ */

type SalaryBasis = "annual" | "monthly" | "weekly" | "daily" | "hourly";

function SalaryCalculator() {
  const [amount, setAmount] = useState("60000");
  const [basis, setBasis] = useState<SalaryBasis>("annual");
  const [daysPerWeek, setDaysPerWeek] = useState("5");
  const [hoursPerDay, setHoursPerDay] = useState("8");

  const res = useMemo(() => {
    const a = parseNum(amount);
    const d = parseNum(daysPerWeek);
    const h = parseNum(hoursPerDay);
    if (a === null || d === null || h === null) return null;
    if (a < 0) return { ok: false as const, error: "The salary cannot be negative." };
    if (d <= 0 || d > 7) return { ok: false as const, error: "Working days per week must be between 1 and 7." };
    if (h <= 0 || h > 24) return { ok: false as const, error: "Hours per day must be between 1 and 24." };
    const WEEKS = 52;
    const workDays = d * WEEKS;
    const workHours = workDays * h;
    const annual =
      basis === "annual"
        ? a
        : basis === "monthly"
          ? a * 12
          : basis === "weekly"
            ? a * WEEKS
            : basis === "daily"
              ? a * workDays
              : a * workHours;
    return {
      ok: true as const,
      annual,
      monthly: annual / 12,
      weekly: annual / WEEKS,
      daily: annual / workDays,
      hourly: annual / workHours,
      workDays,
      workHours,
      d,
      h,
    };
  }, [amount, basis, daysPerWeek, hoursPerDay]);

  const basisLabels: Array<[SalaryBasis, string]> = [
    ["annual", "Annual"],
    ["monthly", "Monthly"],
    ["weekly", "Weekly"],
    ["daily", "Daily"],
    ["hourly", "Hourly"],
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Salary amount ($)">
          <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
        </Field>
        <Field label="I entered this as">
          <select
            value={basis}
            onChange={(e) => setBasis(e.target.value as SalaryBasis)}
            className={inputCls}
          >
            {basisLabels.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Working days / week">
          <input type="number" min={1} max={7} value={daysPerWeek} onChange={(e) => setDaysPerWeek(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Hours / day">
          <input type="number" min={1} max={24} value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} className={inputCls} />
        </Field>
      </div>
      {res === null && <Note>Enter a salary amount — every equivalent updates live.</Note>}
      {res && !res.ok && <WarningNote>{res.error}</WarningNote>}
      {res?.ok && (
        <div className="space-y-4">
          <ResultHeadline
            value={`${money(res.annual)} / year`}
            caption={`Equivalent to ${money(res.hourly)} per hour over ${fmtNum(res.workDays, 0)} working days a year`}
          />
          <DataTable
            head={["Period", "Amount"]}
            rows={[
              ["Annual", money(res.annual)],
              ["Monthly", money(res.monthly)],
              ["Weekly", money(res.weekly)],
              ["Daily", money(res.daily)],
              ["Hourly", money(res.hourly)],
            ]}
          />
          <FormulaNote>
            Annual = entered amount × {basis === "annual" ? "1" : basis === "monthly" ? "12 months" : basis === "weekly" ? "52 weeks" : basis === "daily" ? `52 × ${fmtNum(res.d, 1)} working days` : `52 × ${fmtNum(res.d, 1)} days × ${fmtNum(res.h, 1)} hours`}{" "}
            · weekly = annual ÷ 52 · daily = weekly ÷ {fmtNum(res.d, 1)} · hourly = daily ÷{" "}
            {fmtNum(res.h, 1)}. That is {fmtNum(res.workDays, 0)} working days and{" "}
            {fmtNum(res.workHours, 0)} working hours per year. Gross figures — taxes are not
            deducted.
          </FormulaNote>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Registry
   ════════════════════════════════════════════════════════════════ */

export const calculatorsTools: Record<string, ToolComponent> = {
  "percentage-calculator": PercentageCalculator,
  "age-calculator": AgeCalculator,
  "date-difference": DateDifference,
  "time-duration": TimeDuration,
  "gpa-calculator": GpaCalculator,
  "cgpa-calculator": CgpaCalculator,
  "grade-calculator": GradeCalculator,
  "discount-calculator": DiscountCalculator,
  "profit-margin-calculator": ProfitMarginCalculator,
  "loan-calculator": LoanCalculator,
  "emi-calculator": EmiCalculator,
  "simple-interest-calculator": SimpleInterestCalculator,
  "compound-interest-calculator": CompoundInterestCalculator,
  "unit-converter": UnitConverter,
  "currency-converter": CurrencyConverter,
  "time-zone-converter": TimeZoneConverter,
  "salary-calculator": SalaryCalculator,
};
