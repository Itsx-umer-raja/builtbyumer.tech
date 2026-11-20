import type { ReactNode } from "react";

/**
 * Decorative environments for the ten Route 145 worlds.
 * CSS/SVG only, transform/opacity motion, no Three.js — the
 * decorations are pure atmosphere (aria-hidden); every tool
 * name, description and link lives in plain HTML in WorldShell.
 *
 * Motion classes (wv8-*) are defined in the <style> block in
 * WorldsSection.tsx and respect prefers-reduced-motion there.
 * Each decoration is positioned by its parent world section;
 * these components only render the floating pieces.
 */

function GhostWord({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="v8-outline pointer-events-none absolute -right-2 top-2 select-none font-anta text-[7rem] font-bold leading-none opacity-60 sm:text-[11rem]"
    >
      {children}
    </span>
  );
}

/** A floating document sheet with fake text lines + folded corner. */
function DocSheet({
  className = "",
  delay = "0s",
  duration = "8s",
}: {
  className?: string;
  delay?: string;
  duration?: string;
}) {
  return (
    <div className={`absolute ${className}`}>
      <div
        className="wv8-anim wv8-float rounded-xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] p-4 shadow-2xl"
        style={{ animationDelay: delay, animationDuration: duration }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--v8-accent)]" />
          <span className="h-2 w-16 rounded bg-[var(--v8-line-strong)]" />
        </div>
        <div className="mt-4 space-y-2">
          <span className="block h-1.5 w-32 rounded bg-[var(--v8-line-strong)]" />
          <span className="block h-1.5 w-24 rounded bg-[var(--v8-line-strong)]" />
          <span className="block h-1.5 w-28 rounded bg-[var(--v8-line-strong)]" />
          <span className="block h-1.5 w-16 rounded bg-[var(--v8-accent)] opacity-70" />
        </div>
      </div>
    </div>
  );
}

/** 1 · PDF World — floating documents, pages turning in space. */
export function PdfDecor() {
  return (
    <>
      <GhostWord>PDF</GhostWord>
      <DocSheet className="right-[6%] top-[16%] hidden rotate-[-8deg] md:block" />
      <DocSheet
        className="right-[22%] top-[46%] hidden rotate-[6deg] lg:block"
        delay="1.4s"
        duration="9.5s"
      />
      <DocSheet
        className="right-[2%] top-[58%] hidden rotate-[10deg] xl:block"
        delay="2.6s"
        duration="7.2s"
      />
      {/* Turning page — a sheet edge catching the violet light. */}
      <div
        aria-hidden
        className="wv8-anim wv8-float absolute right-[38%] top-[10%] hidden h-16 w-12 rotate-[-14deg] rounded-r-lg border border-[var(--v8-accent)] bg-[var(--v8-bg-2)] opacity-80 lg:block"
        style={{ animationDelay: "0.8s", animationDuration: "6.5s" }}
      />
    </>
  );
}

/** 2 · Image World — floating photo panels + pixel particles. */
export function ImageDecor() {
  const pixels = [
    { top: "12%", left: "62%", delay: "0s", color: "var(--v8-accent)" },
    { top: "22%", left: "88%", delay: "1.1s", color: "var(--v8-accent-2)" },
    { top: "38%", left: "70%", delay: "0.5s", color: "var(--v8-highlight)" },
    { top: "52%", left: "92%", delay: "1.8s", color: "var(--v8-accent)" },
    { top: "66%", left: "64%", delay: "2.4s", color: "var(--v8-accent-2)" },
    { top: "78%", left: "84%", delay: "0.9s", color: "var(--v8-highlight)" },
    { top: "8%", left: "76%", delay: "2.9s", color: "var(--v8-accent)" },
    { top: "44%", left: "58%", delay: "1.6s", color: "var(--v8-accent-2)" },
  ];
  return (
    <>
      <GhostWord>IMG</GhostWord>
      {pixels.map((p, i) => (
        <span
          key={i}
          aria-hidden
          className="wv8-anim wv8-blink absolute hidden h-2 w-2 md:block"
          style={{
            top: p.top,
            left: p.left,
            background: p.color,
            animationDelay: p.delay,
          }}
        />
      ))}
      {/* Photo panels — framed, slightly tilted, drifting. */}
      <div className="absolute right-[8%] top-[18%] hidden rotate-[5deg] md:block">
        <div
          className="wv8-anim wv8-float rounded-2xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] p-2"
          style={{ animationDuration: "8.5s" }}
        >
          <div className="flex h-20 w-28 items-end rounded-lg bg-[var(--v8-bg)] p-2">
            <span className="h-8 w-8 rounded-full bg-[var(--v8-accent)] opacity-80" />
            <span className="ml-2 h-4 w-12 rounded bg-[var(--v8-line-strong)]" />
          </div>
          <div className="mt-2 h-1.5 w-20 rounded bg-[var(--v8-line-strong)]" />
        </div>
      </div>
      <div className="absolute right-[26%] top-[52%] hidden rotate-[-7deg] lg:block">
        <div
          className="wv8-anim wv8-float rounded-2xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] p-2"
          style={{ animationDelay: "1.6s", animationDuration: "9.2s" }}
        >
          <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-[var(--v8-bg)]">
            <span className="h-6 w-6 rounded-sm bg-[var(--v8-accent-2)] opacity-80" />
          </div>
          <div className="mt-2 h-1.5 w-16 rounded bg-[var(--v8-line-strong)]" />
        </div>
      </div>
    </>
  );
}

/** 3 · QR & Barcode World — animated QR pattern, geometric structures. */
const QR_ROWS = [
  "1111110100111",
  "1000010110101",
  "1011010011101",
  "1011011100011",
  "1011010101010",
  "1000011010111",
  "1111110101101",
  "0000001100100",
  "1101010011110",
  "0110101100011",
  "1011100101010",
  "0100111011101",
  "1110100110101",
];

export function QrDecor() {
  // Finder squares (the three big corner blocks) stay solid;
  // a few data modules blink violet.
  const blinkers = new Set(["3-8", "5-10", "9-4", "11-9", "2-11"]);
  return (
    <>
      <GhostWord>QR</GhostWord>
      <div
        aria-hidden
        className="absolute right-[6%] top-[14%] hidden rotate-3 md:block"
      >
        <div className="wv8-anim wv8-float rounded-2xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] p-4">
          <div className="grid grid-cols-[repeat(13,0.55rem)] gap-[2px]">
            {QR_ROWS.flatMap((row, r) =>
              row.split("").map((cell, c) => {
                const key = `${r}-${c}`;
                const on = cell === "1";
                return (
                  <span
                    key={key}
                    className={
                      blinkers.has(key)
                        ? "wv8-anim wv8-blink h-[0.55rem] w-[0.55rem] rounded-[1px] bg-[var(--v8-accent)]"
                        : on
                          ? "h-[0.55rem] w-[0.55rem] rounded-[1px] bg-[var(--v8-text)]"
                          : "h-[0.55rem] w-[0.55rem] rounded-[1px] bg-transparent"
                    }
                  />
                );
              }),
            )}
          </div>
          <p className="mt-3 text-center font-anta text-[10px] tracking-[0.2em] text-[var(--v8-muted)]">
            SCAN ME
          </p>
        </div>
      </div>
      {/* Barcode slats drifting below the code. */}
      <div
        aria-hidden
        className="absolute right-[30%] top-[62%] hidden items-end gap-[3px] lg:flex"
      >
        {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2].map((w, i) => (
          <span
            key={i}
            className="wv8-anim wv8-blink h-10 bg-[var(--v8-text)] opacity-80"
            style={{ width: `${w * 2}px`, animationDelay: `${i * 0.25}s` }}
          />
        ))}
      </div>
    </>
  );
}

/** 4 · Network World — animated nodes, connections, data streams. */
export function NetworkDecor() {
  return (
    <>
      <GhostWord>NET</GhostWord>
      <svg
        aria-hidden
        viewBox="0 0 420 260"
        className="absolute -right-4 top-[10%] hidden h-64 w-[26rem] md:block"
        fill="none"
      >
        {/* Static links */}
        <g stroke="var(--v8-line-strong)" strokeWidth="1.5">
          <line x1="60" y1="60" x2="200" y2="40" />
          <line x1="200" y1="40" x2="340" y2="80" />
          <line x1="60" y1="60" x2="150" y2="170" />
          <line x1="200" y1="40" x2="150" y2="170" />
          <line x1="340" y1="80" x2="280" y2="200" />
          <line x1="150" y1="170" x2="280" y2="200" />
          <line x1="200" y1="40" x2="280" y2="200" />
        </g>
        {/* Data streams — dashes travelling along the links. */}
        <g stroke="var(--v8-accent-2)" strokeWidth="1.5" strokeDasharray="3 9">
          <line x1="60" y1="60" x2="200" y2="40" className="wv8-anim wv8-dash" />
          <line x1="200" y1="40" x2="340" y2="80" className="wv8-anim wv8-dash" />
          <line x1="60" y1="60" x2="150" y2="170" className="wv8-anim wv8-dash" />
          <line x1="340" y1="80" x2="280" y2="200" className="wv8-anim wv8-dash" />
          <line x1="150" y1="170" x2="280" y2="200" className="wv8-anim wv8-dash" />
        </g>
        {/* Nodes */}
        <g>
          <circle cx="60" cy="60" r="7" fill="var(--v8-bg-2)" stroke="var(--v8-accent)" strokeWidth="2" />
          <circle cx="200" cy="40" r="9" fill="var(--v8-accent)" className="wv8-anim wv8-blink" />
          <circle cx="340" cy="80" r="7" fill="var(--v8-bg-2)" stroke="var(--v8-accent-2)" strokeWidth="2" />
          <circle cx="150" cy="170" r="7" fill="var(--v8-bg-2)" stroke="var(--v8-accent)" strokeWidth="2" />
          <circle cx="280" cy="200" r="9" fill="var(--v8-bg-2)" stroke="var(--v8-highlight)" strokeWidth="2" />
        </g>
      </svg>
      <p
        aria-hidden
        className="absolute right-[10%] top-[72%] hidden font-grotesk text-xs uppercase tracking-[0.24em] text-[var(--v8-muted)] lg:block"
      >
        5 nodes · live
      </p>
    </>
  );
}

/** 5 · Developer World — code / terminal structures. */
export function DevDecor() {
  return (
    <>
      <GhostWord>{"</>"}</GhostWord>
      <div className="absolute right-[5%] top-[14%] hidden w-80 rotate-2 md:block">
        <div
          className="wv8-anim wv8-float rounded-2xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] p-4 font-grotesk text-[13px] leading-7"
          style={{ animationDuration: "9s" }}
        >
          <div className="mb-3 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--v8-accent)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--v8-accent-2)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--v8-highlight)]" />
            <span className="ml-2 text-[11px] uppercase tracking-[0.18em] text-[var(--v8-muted)]">
              terminal
            </span>
          </div>
          <p>
            <span className="text-[var(--v8-accent)]">const</span>{" "}
            <span className="text-[var(--v8-text)]">tools</span>{" "}
            <span className="text-[var(--v8-muted)]">=</span>{" "}
            <span className="text-[var(--v8-accent-2)]">await</span>{" "}
            <span className="text-[var(--v8-text)]">fetch</span>
            <span className="text-[var(--v8-muted)]">(</span>
            <span className="text-[var(--v8-highlight)]">"/tools"</span>
            <span className="text-[var(--v8-muted)]">)</span>
          </p>
          <p>
            <span className="text-[var(--v8-accent)]">tools</span>
            <span className="text-[var(--v8-muted)]">.</span>
            <span className="text-[var(--v8-text)]">filter</span>
            <span className="text-[var(--v8-muted)]">(</span>
            <span className="text-[var(--v8-text)]">t</span>{" "}
            <span className="text-[var(--v8-accent-2)]">=&gt;</span>{" "}
            <span className="text-[var(--v8-text)]">t.free</span>
            <span className="text-[var(--v8-muted)]">)</span>
          </p>
          <p>
            <span className="text-[var(--v8-muted)]">// 145 tools. 0 uploads.</span>
          </p>
          <p>
            <span className="text-[var(--v8-accent-2)]">$</span>{" "}
            <span className="text-[var(--v8-text)]">npm run build</span>{" "}
            <span className="wv8-anim wv8-blink ml-1 inline-block h-4 w-2 translate-y-0.5 bg-[var(--v8-accent)]" />
          </p>
        </div>
      </div>
      {/* Floating glyphs. */}
      <span
        aria-hidden
        className="wv8-anim wv8-float absolute right-[34%] top-[58%] hidden font-anta text-5xl text-[var(--v8-accent)] opacity-70 lg:block"
        style={{ animationDelay: "1.2s", animationDuration: "7s" }}
      >
        {"{ }"}
      </span>
      <span
        aria-hidden
        className="wv8-anim wv8-float absolute right-[8%] top-[64%] hidden font-anta text-4xl text-[var(--v8-accent-2)] opacity-60 lg:block"
        style={{ animationDelay: "2.2s", animationDuration: "8s" }}
      >
        {"< />"}
      </span>
    </>
  );
}

/** 6 · Text World — floating typography, animated characters. */
export function TextDecor() {
  return (
    <>
      <span
        aria-hidden
        className="wv8-anim wv8-float absolute right-[10%] top-[12%] hidden font-anta text-[6rem] leading-none text-[var(--v8-text)] opacity-90 md:block"
        style={{ animationDuration: "8s" }}
      >
        Aa
      </span>
      <span
        aria-hidden
        className="v8-outline pointer-events-none absolute right-[26%] top-[44%] hidden select-none font-anta text-[5rem] leading-none lg:block"
      >
        &amp;
      </span>
      <span
        aria-hidden
        className="wv8-anim wv8-float absolute right-[4%] top-[52%] hidden font-anta text-6xl leading-none text-[var(--v8-accent)] lg:block"
        style={{ animationDelay: "1.5s", animationDuration: "7.5s" }}
      >
        ?
      </span>
      <span
        aria-hidden
        className="wv8-anim wv8-float absolute right-[30%] top-[68%] hidden font-anta text-5xl leading-none text-[var(--v8-highlight)] opacity-80 xl:block"
        style={{ animationDelay: "2.5s", animationDuration: "9s" }}
      >
        ¶
      </span>
      <p
        aria-hidden
        className="absolute right-[8%] top-[78%] hidden font-grotesk text-lg italic text-[var(--v8-muted)] lg:block"
      >
        every word, counted.
      </p>
    </>
  );
}

/** 7 · Calculator World — floating numbers, geometric shapes, calculations. */
export function CalcDecor() {
  return (
    <>
      <GhostWord>42</GhostWord>
      {/* Keypad mockup */}
      <div className="absolute right-[8%] top-[16%] hidden rotate-[-4deg] md:block">
        <div
          className="wv8-anim wv8-float rounded-2xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] p-3"
          style={{ animationDuration: "8.8s" }}
        >
          <div className="rounded-lg bg-[var(--v8-bg)] px-3 py-2 text-right font-anta text-xl text-[var(--v8-accent-2)]">
            1,337 × 3
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "%", "="].map(
              (k) => (
                <span
                  key={k}
                  className={`flex h-8 w-8 items-center justify-center rounded-md font-anta text-sm ${
                    k === "="
                      ? "bg-[var(--v8-accent)] text-[var(--v8-bg)]"
                      : "bg-[var(--v8-bg)] text-[var(--v8-text)]"
                  }`}
                >
                  {k}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
      <span
        aria-hidden
        className="wv8-anim wv8-float absolute right-[30%] top-[58%] hidden font-anta text-6xl text-[var(--v8-accent)] opacity-80 lg:block"
        style={{ animationDelay: "1s", animationDuration: "7s" }}
      >
        %
      </span>
      <span
        aria-hidden
        className="wv8-anim wv8-float absolute right-[4%] top-[62%] hidden font-anta text-5xl text-[var(--v8-highlight)] opacity-70 lg:block"
        style={{ animationDelay: "2s", animationDuration: "8.4s" }}
      >
        π
      </span>
      <span
        aria-hidden
        className="wv8-anim wv8-float absolute right-[36%] top-[16%] hidden font-anta text-4xl text-[var(--v8-accent-2)] opacity-60 xl:block"
        style={{ animationDelay: "0.6s", animationDuration: "9.4s" }}
      >
        +
      </span>
    </>
  );
}

/** 8 · Data World — animated grids, structured information, data blocks. */
export function DataDecor() {
  const rows = [
    ["name", "city", "total"],
    ["ayesha", "lahore", "1,240"],
    ["bilal", "karachi", "986"],
    ["sana", "islamabad", "1,512"],
  ];
  return (
    <>
      <GhostWord>CSV</GhostWord>
      <div className="absolute right-[5%] top-[14%] hidden w-80 md:block">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)]">
          {/* Scanning row highlight — transform only. */}
          <div
            aria-hidden
            className="wv8-anim wv8-scan pointer-events-none absolute inset-x-0 top-0 h-9 border-b border-[var(--v8-accent)] bg-[color-mix(in_srgb,var(--v8-accent)_12%,transparent)]"
          />
          {rows.map((row, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-2.5 font-grotesk text-[13px] ${
                i === 0
                  ? "border-b border-[var(--v8-line-strong)] uppercase tracking-[0.14em] text-[var(--v8-muted)]"
                  : i === 2
                    ? "bg-[color-mix(in_srgb,var(--v8-accent)_12%,transparent)] text-[var(--v8-text)]"
                    : "text-[var(--v8-muted)]"
              }`}
            >
              <span>{row[0]}</span>
              <span>{row[1]}</span>
              <span className="font-anta text-[var(--v8-text)]">{row[2]}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Floating data blocks */}
      <div className="absolute right-[32%] top-[58%] hidden rotate-[-6deg] lg:block">
        <div
          className="wv8-anim wv8-float rounded-xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] px-3 py-2 font-grotesk text-xs text-[var(--v8-accent-2)]"
          style={{ animationDelay: "1.3s", animationDuration: "7.6s" }}
        >
          {"{ json }"}
        </div>
      </div>
      <div className="absolute right-[6%] top-[66%] hidden rotate-[5deg] lg:block">
        <div
          className="wv8-anim wv8-float rounded-xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] px-3 py-2 font-grotesk text-xs text-[var(--v8-highlight)]"
          style={{ animationDelay: "2.1s", animationDuration: "8.6s" }}
        >
          csv → xlsx
        </div>
      </div>
    </>
  );
}

/** 9 · Business World — premium document mockups: invoice + business card. */
export function BusinessDecor() {
  return (
    <>
      <GhostWord>INV</GhostWord>
      {/* Invoice mockup */}
      <div className="absolute right-[7%] top-[14%] hidden w-72 rotate-[4deg] md:block">
        <div
          className="wv8-anim wv8-float rounded-2xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] p-5"
          style={{ animationDuration: "9.2s" }}
        >
          <div className="flex items-center justify-between">
            <span className="font-anta text-sm tracking-[0.18em] text-[var(--v8-text)]">
              INVOICE
            </span>
            <span className="font-grotesk text-[11px] uppercase tracking-[0.14em] text-[var(--v8-muted)]">
              #1042
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between font-grotesk text-[13px] text-[var(--v8-muted)]">
              <span>Design services</span>
              <span className="text-[var(--v8-text)]">Rs 48,000</span>
            </div>
            <div className="flex justify-between font-grotesk text-[13px] text-[var(--v8-muted)]">
              <span>Hosting, 12 mo</span>
              <span className="text-[var(--v8-text)]">Rs 12,000</span>
            </div>
            <div className="flex justify-between border-t border-[var(--v8-line-strong)] pt-2 font-grotesk text-[13px] font-bold text-[var(--v8-text)]">
              <span>Total due</span>
              <span className="text-[var(--v8-accent)]">Rs 60,000</span>
            </div>
          </div>
          <span className="mt-4 inline-block rounded-full border border-[var(--v8-accent)] px-3 py-1 font-grotesk text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--v8-accent)]">
            Paid
          </span>
        </div>
      </div>
      {/* Business card mockup */}
      <div className="absolute right-[30%] top-[60%] hidden rotate-[-8deg] lg:block">
        <div
          className="wv8-anim wv8-float w-44 rounded-xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg)] p-4"
          style={{ animationDelay: "1.8s", animationDuration: "8s" }}
        >
          <p className="font-anta text-sm text-[var(--v8-text)]">UMER RAJA</p>
          <p className="mt-0.5 font-grotesk text-[11px] text-[var(--v8-muted)]">
            BuiltByUmer · Founder
          </p>
          <span className="mt-3 block h-1 w-10 rounded bg-[var(--v8-accent)]" />
        </div>
      </div>
    </>
  );
}

/** 10 · Productivity World — the fast lane: motion lines, checkmarks, time flow. */
export function ProductivityDecor() {
  const lanes = [
    { top: "16%", delay: "0s", duration: "2.4s", color: "var(--v8-accent)" },
    { top: "34%", delay: "0.7s", duration: "3.1s", color: "var(--v8-accent-2)" },
    { top: "54%", delay: "1.4s", duration: "2.7s", color: "var(--v8-highlight)" },
    { top: "72%", delay: "0.4s", duration: "3.4s", color: "var(--v8-accent)" },
  ];
  return (
    <>
      <GhostWord>GO</GhostWord>
      {/* Speed lanes */}
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[42%] md:block">
        {lanes.map((lane, i) => (
          <span
            key={i}
            className="wv8-anim wv8-speed absolute left-0 h-[3px] w-20 rounded-full"
            style={{
              top: lane.top,
              background: lane.color,
              animationDelay: lane.delay,
              animationDuration: lane.duration,
            }}
          />
        ))}
      </div>
      {/* Checkmark chips riding the lane */}
      <div className="absolute right-[16%] top-[24%] hidden lg:block">
        <div
          className="wv8-anim wv8-float flex items-center gap-2 rounded-full border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] px-3 py-2"
          style={{ animationDuration: "7.4s" }}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--v8-accent)] font-grotesk text-xs font-bold text-[var(--v8-bg)]">
            ✓
          </span>
          <span className="font-grotesk text-xs font-bold uppercase tracking-[0.14em] text-[var(--v8-text)]">
            Done
          </span>
        </div>
      </div>
      {/* Timer motif */}
      <div className="absolute right-[8%] top-[58%] hidden lg:block">
        <div
          className="wv8-anim wv8-float flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--v8-accent-2)]"
          style={{ animationDelay: "1.1s", animationDuration: "8.2s" }}
        >
          <span className="relative block h-10 w-10">
            <span className="absolute left-1/2 top-1/2 h-4 w-[2px] -translate-x-1/2 -translate-y-full bg-[var(--v8-text)]" />
            <span className="absolute left-1/2 top-1/2 h-3 w-[2px] origin-top -translate-x-1/2 rotate-[120deg] bg-[var(--v8-accent-2)]" />
            <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--v8-accent)]" />
          </span>
        </div>
      </div>
      <p
        aria-hidden
        className="absolute right-[10%] top-[84%] hidden font-grotesk text-lg italic text-[var(--v8-muted)] lg:block"
      >
        25 minutes on. 5 off. Repeat.
      </p>
    </>
  );
}
