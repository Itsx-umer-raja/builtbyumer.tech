"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useSpring } from "framer-motion";
import { Download, MousePointerClick, ShieldCheck } from "lucide-react";
import { EmberLine, SectionHeader } from "./SectionHeader";

const STEPS = [
  {
    n: "01",
    icon: MousePointerClick,
    title: "Pick a tool",
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

function Step({ s }: { s: (typeof STEPS)[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref, { margin: "-35% 0px -35% 0px" });
  return (
    <div ref={ref} data-stagger-item className="relative flex gap-5 sm:gap-8">
      <div
        className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border transition-colors duration-500 sm:h-20 sm:w-20 ${
          active
            ? "border-[#ff4d00] bg-[#ff4d00] text-white"
            : "border-white/15 bg-white/5 text-[#ff9646]"
        }`}
      >
        <s.icon className="h-6 w-6 sm:h-8 sm:w-8" />
      </div>
      <div className="min-w-0 pt-1 sm:pt-2">
        <p className="font-anta text-5xl leading-none text-white/15 sm:text-7xl">
          {s.n}
        </p>
        <h3 className="mt-3 font-grotesk text-2xl font-bold tracking-tight text-white sm:text-4xl">
          {s.title}
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
          {s.copy}
        </p>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-[#ff9646]">
          {s.proof}
        </p>
      </div>
    </div>
  );
}

/**
 * How it works — a scroll-driven story in three beats. An ember
 * progress line grows as the section scrolls through the viewport
 * and each beat lights up in turn.
 *
 * NOTE: true sticky pinning is deliberately not used here. The
 * site's global stylesheet forces overflow-x:hidden on html/body,
 * which breaks position:sticky and GSAP pinning. The progress-line
 * pattern is the codebase's proven alternative — the same
 * scroll-driven feel without the fragility.
 */
export function HowItWorksV4() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "end 0.55"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section id="how" className="relative scroll-mt-20 bg-black">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <SectionHeader
          index="03"
          eyebrow="How it works"
          title={
            <>
              Three steps.
              <br />
              <EmberLine>Nothing uploaded.</EmberLine>
            </>
          }
          subline="No accounts. No uploads. No waiting. The tool opens, does the job, and the result is yours."
        />

        <div ref={ref} data-stagger-group className="relative mt-14">
          <div className="absolute bottom-0 left-[27px] top-0 w-px bg-white/10 sm:left-[39px]" aria-hidden />
          <motion.div
            className="absolute left-[27px] top-0 w-px origin-top bg-[#ff4d00] sm:left-[39px]"
            style={{ scaleY: progress, height: "100%" }}
            aria-hidden
          />
          <div className="space-y-12 sm:space-y-16">
            {STEPS.map((s) => (
              <Step key={s.n} s={s} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
