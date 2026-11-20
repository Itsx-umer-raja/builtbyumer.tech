"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { TOOLS } from "@/data/tools";

const STATS = [
  { value: TOOLS.length, suffix: "", label: "Free tools", note: "across every everyday job" },
  { value: 10, suffix: "", label: "Categories", note: "PDF to productivity" },
  { value: 181, suffix: "", label: "Pages", note: "indexed, fast, no bloat" },
  { value: 100, suffix: "%", label: "In-browser", note: "zero uploads, zero accounts" },
];

/** One counter — rolls 0 → target with AnimatedNumber once in view. */
function Stat({ value, suffix, label, note }: (typeof STATS)[number]) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (inView) setCurrent(value);
  }, [inView, value]);

  return (
    <div ref={ref}>
      <div className="flex items-baseline font-anta text-5xl tracking-tight text-[#141412] sm:text-6xl">
        <AnimatedNumber value={current} className="inline-flex" />
        {suffix && <span>{suffix}</span>}
        <span className="text-[#ff4d00]">.</span>
      </div>
      <p className="mt-3 font-grotesk text-sm font-semibold uppercase tracking-[0.14em] text-[#141412]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[#141412]/55">{note}</p>
    </div>
  );
}

/**
 * Proof band — the numbers, on paper with a vermillion rule, just
 * before the closing CTA so the visitor's last impression before
 * acting is the scale of it.
 */
export function StatsV5() {
  return (
    <section className="relative border-y-2 border-[#141412] bg-white">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="v5-reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="v5-eyebrow">
              <span className="text-[#ff4d00]">●</span> The numbers
            </p>
            <h2 className="mt-4 font-anta text-4xl leading-[1.02] tracking-[0.01em] text-[#141412] sm:text-5xl">
              Free, private, <span className="text-[#ff4d00]">instant.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#141412]/60 sm:text-base">
            No accounts, no uploads, no watermarks. The whole point of
            BuiltByUmer, in four numbers.
          </p>
        </div>
        <div
          data-stagger-group
          className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4"
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              data-stagger-item
              className={`border-l-2 border-[#141412]/15 pl-5 ${i === 0 ? "max-lg:border-l-0 max-lg:pl-0" : ""} ${i === 2 ? "max-lg:border-l-0 max-lg:pl-0" : ""}`}
            >
              <Stat {...s} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
