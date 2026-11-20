"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Download, MousePointerClick, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: MousePointerClick,
    title: "Find it",
    copy: "Search the index or browse a category. Every tool is one click away — no menus inside menus, no sign-up wall before you even see it.",
    proof: "145 tools · 10 categories",
  },
  {
    n: "02",
    icon: ShieldCheck,
    title: "Use it in your browser",
    copy: "Your files are processed on your own device, in the tab you already have open. Nothing is uploaded, nothing is stored, nothing is sold.",
    proof: "0 uploads · 0 accounts",
  },
  {
    n: "03",
    icon: Download,
    title: "Download — done",
    copy: "Take the result and get on with your day. No watermark, no trial timer, no “upgrade to export” trap. Free means free.",
    proof: "0 cost · 0 watermark",
  },
];

/**
 * How it works — a scroll-driven story. A vermillion progress line
 * grows as the section scrolls through the viewport; steps reveal in turn.
 * (No sticky/pin: the global stylesheet forces overflow-x hidden on
 * ancestors, which breaks sticky positioning — the progress line gives
 * the same scroll-driven feel without the fragility.)
 */
export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "end 0.55"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section id="how" className="relative scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div data-hv-reveal>
          <p className="hv-eyebrow">
            <span className="hv-dot">●</span> 03 — How it works
          </p>
          <h2 className="mt-4 max-w-2xl font-grotesk text-4xl font-bold leading-[0.95] tracking-tight text-hv-ink sm:text-6xl">
            Three steps.
            <br />
            <em className="font-fraunces font-medium italic text-hv-accent">
              Nothing uploaded.
            </em>
          </h2>
        </div>

        <div ref={ref} className="relative mt-14">
          <div className="absolute bottom-0 left-[27px] top-0 w-px bg-hv-line sm:left-[39px]" aria-hidden />
          <motion.div
            className="absolute left-[27px] top-0 w-px origin-top bg-hv-accent sm:left-[39px]"
            style={{ scaleY: progress, height: "100%" }}
            aria-hidden
          />
          <div className="space-y-12 sm:space-y-16">
            {STEPS.map((s) => (
              <div key={s.n} data-hv-reveal className="relative flex gap-5 sm:gap-8">
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-hv-accent bg-hv-bg text-hv-accent sm:h-20 sm:w-20">
                  <s.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <div className="min-w-0 pt-1 sm:pt-2">
                  <p className="font-fraunces text-5xl italic leading-none text-hv-ink/20 sm:text-7xl">
                    {s.n}
                  </p>
                  <h3 className="mt-3 font-grotesk text-2xl font-bold tracking-tight text-hv-ink sm:text-4xl">
                    {s.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-hv-muted sm:text-base">
                    {s.copy}
                  </p>
                  <p className="mt-4 inline-block rounded-full border border-hv-accent/50 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-hv-accent">
                    {s.proof}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
