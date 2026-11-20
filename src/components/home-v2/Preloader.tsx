"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const WORDS = ["FREE", "PRIVATE", "INSTANT", "145 TOOLS"];

/**
 * Preloader: wordmark + cycling words + 0→100 counter, then slides
 * away. Calls onDone once the count finishes.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setCount(100);
      const t = setTimeout(onDone, 250);
      return () => clearTimeout(t);
    }
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      // ease-out so the last numbers linger like a real load
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(onDone, 220);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(
      () => setWordIdx((i) => (i + 1) % WORDS.length),
      380,
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (count >= 100) setDone(true);
  }, [count]);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col justify-between bg-hv-bg px-5 py-6 sm:px-10 sm:py-8"
      exit={{ y: "-100%" }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      aria-hidden={done}
    >
      <div className="flex items-center justify-between">
        <p className="font-grotesk text-lg font-bold tracking-tight text-hv-ink">
          Built<span className="text-hv-accent">ByUmer</span>
          <span className="align-super text-[10px] text-hv-muted">®</span>
        </p>
        <p className="hv-eyebrow">
          <span className="hv-dot">●</span> Loading the toolbox
        </p>
      </div>

      <div className="flex flex-col items-start gap-3">
        <div className="h-7 overflow-hidden">
          <motion.p
            key={wordIdx}
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="font-fraunces text-2xl italic text-hv-muted"
          >
            {WORDS[wordIdx]} —
          </motion.p>
        </div>
        <p className="font-fraunces text-[clamp(3rem,10vw,7rem)] leading-[0.9] text-hv-ink">
          Every tool.
          <br />
          <span className="italic text-hv-accent">One destination.</span>
        </p>
      </div>

      <div className="flex items-end justify-between gap-6">
        <div className="h-px flex-1 bg-hv-ink/15">
          <div
            className="h-px bg-hv-accent transition-[width] duration-100 ease-linear"
            style={{ width: `${count}%` }}
          />
        </div>
        <p className="font-grotesk text-6xl font-bold tabular-nums leading-none text-hv-ink sm:text-7xl">
          {count}
          <span className="text-hv-accent">%</span>
        </p>
      </div>
    </motion.div>
  );
}
