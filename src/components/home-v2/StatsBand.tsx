"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { TOOLS } from "@/data/tools";

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {val}
      {suffix}
    </span>
  );
}

const STATS = [
  { value: TOOLS.length, suffix: "", label: "Free tools", note: "across every everyday job" },
  { value: 10, suffix: "", label: "Categories", note: "PDF to productivity" },
  { value: 179, suffix: "", label: "Static pages", note: "indexed, fast, no bloat" },
  { value: 100, suffix: "%", label: "In-browser", note: "zero uploads, zero accounts" },
];

/** Animated stats band — numbers count up as it scrolls into view. */
export function StatsBand() {
  return (
    <section className="relative border-b border-hv-line">
      <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            data-hv-reveal
            className={`px-5 py-10 sm:px-8 sm:py-12 ${
              i > 0 ? "border-l border-hv-line" : ""
            } ${i === 2 ? "max-lg:border-l-0 max-lg:border-t max-lg:border-hv-line" : ""} ${
              i === 3 ? "max-lg:border-t max-lg:border-hv-line" : ""
            }`}
          >
            <p className="font-grotesk text-5xl font-bold tracking-tight text-hv-ink sm:text-6xl">
              <CountUp to={s.value} suffix={s.suffix} />
              <span className="text-hv-accent">.</span>
            </p>
            <p className="mt-3 font-grotesk text-sm font-semibold uppercase tracking-[0.14em] text-hv-ink">
              {s.label}
            </p>
            <p className="mt-1 text-sm text-hv-muted">{s.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
