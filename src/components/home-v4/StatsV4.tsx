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
      <div className="flex items-baseline font-anta text-5xl tracking-tight text-white sm:text-6xl">
        <AnimatedNumber value={current} className="inline-flex" />
        {suffix && <span>{suffix}</span>}
        <span className="text-[#ff4d00]">.</span>
      </div>
      <p className="mt-3 font-grotesk text-sm font-semibold uppercase tracking-[0.14em] text-white">
        {label}
      </p>
      <p className="mt-1 text-sm text-white/50">{note}</p>
    </div>
  );
}

/** Animated stats band — counters roll up as it scrolls into view. */
export function StatsV4() {
  return (
    <section className="relative bg-black">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-5 pb-8 pt-4 sm:px-8 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`v4-reveal border-l-2 border-white/10 pl-5 ${i === 0 ? "max-lg:border-l-0 max-lg:pl-0" : ""} ${i === 2 ? "max-lg:border-l-0 max-lg:pl-0" : ""}`}
          >
            <Stat {...s} />
          </div>
        ))}
      </div>
    </section>
  );
}
