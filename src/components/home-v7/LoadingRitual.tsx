"use client";

import { useEffect, useRef, useState } from "react";
import { RouteShield, TopoDefs } from "./Topo";
import { TRIVIA } from "./routeData";

/**
 * Loading ritual, adapted from Expedia's Route 66 loader: cream
 * topo paper, a counting percent, a dotted route line with the
 * shield, rotating TRUE trivia. Fast (~1.2s) and skippable — click
 * anywhere to dismiss. The sticky header stays above it (z-50),
 * so search is reachable at all times. Reduced motion skips the
 * ritual entirely (parent renders nothing).
 */
export function LoadingRitual({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [trivia, setTrivia] = useState(0);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    const start = performance.now();
    const DURATION = 1200;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      // Ease out so the last stretch feels quick, not stuck.
      setPct(Math.round((1 - Math.pow(1 - p, 2)) * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };
    raf = requestAnimationFrame(tick);
    const triviaTimer = window.setInterval(
      () => setTrivia((t) => (t + 1) % TRIVIA.length),
      450,
    );
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(triviaTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Skip loading — enter Route 145"
      onClick={finish}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") finish();
      }}
      className="fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-center bg-[#fdf6e3]"
    >
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <TopoDefs id="v7-ritual-topo" />
        <rect width="100%" height="100%" fill="url(#v7-ritual-topo)" />
      </svg>

      <div className="relative flex flex-col items-center px-6 text-center">
        <RouteShield width={76} />
        <p className="v7-eyebrow mt-6">Loading the road</p>
        <p className="mt-2 font-antonio text-[clamp(4rem,14vw,8rem)] font-bold leading-none text-[#2a2118]">
          {pct}
          <span className="text-[#ff4d00]">%</span>
        </p>

        {/* Dotted route line, filling as the percent climbs */}
        <div className="relative mt-8 h-0 w-64 border-t-[3px] border-dotted border-[#2a2118]/25 sm:w-80">
          <div
            className="absolute -top-[3px] left-0 h-0 border-t-[3px] border-dotted border-[#ff4d00] transition-[width] duration-100"
            style={{ width: `${pct}%` }}
          />
          <span
            className="absolute -top-[7px] h-[11px] w-[11px] -translate-x-1/2 rounded-full border-2 border-[#fdf6e3] bg-[#ff4d00] transition-[left] duration-100"
            style={{ left: `${pct}%` }}
          />
        </div>

        <p className="mt-6 font-caveat text-2xl text-[#2a2118]/70 sm:text-3xl">
          Did you know — {TRIVIA[trivia]}
        </p>
        <p className="v7-eyebrow mt-8">Click anywhere to skip</p>
      </div>
    </div>
  );
}
