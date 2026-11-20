"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { HeroCanvas } from "./HeroCanvas";
import { Magnetic } from "./Magnetic";

const line: Variants = {
  hidden: { y: "110%" },
  show: (i: number) => ({
    y: 0,
    transition: { duration: 0.9, delay: 0.08 + i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

/** Kinetic-type hero: huge Fraunces/Space Grotesk headline over the WebGL field. */
export function Hero({
  active,
  onNavigate,
}: {
  active: boolean;
  onNavigate: (id: string) => void;
}) {
  return (
    <section id="top" className="relative flex min-h-svh flex-col justify-end overflow-hidden pb-8 pt-28 sm:pt-32">
      {/* WebGL sculpture field */}
      <HeroCanvas />
      {/* legibility gradient + grain */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_85%,transparent_30%,rgba(10,10,8,0.55)_78%,#0a0a08_100%)]" />
      <div className="hv-grain pointer-events-none absolute inset-0" />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={active ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2"
        >
          <span className="hv-eyebrow">
            <span className="hv-dot">●</span> 145 free tools — no accounts, no uploads
          </span>
          <span className="hidden h-px w-16 bg-hv-ink/25 sm:block" />
          <span className="hv-eyebrow">Runs 100% in your browser</span>
        </motion.div>

        <h1 className="font-grotesk text-[clamp(3.1rem,11.5vw,10.5rem)] font-bold leading-[0.92] tracking-[-0.03em] text-hv-ink">
          <span className="block overflow-hidden pb-1">
            <motion.span
              className="block"
              variants={line}
              custom={0}
              initial="hidden"
              animate={active ? "show" : "hidden"}
            >
              Every tool
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-1">
            <motion.span
              className="block"
              variants={line}
              custom={1}
              initial="hidden"
              animate={active ? "show" : "hidden"}
            >
              you{" "}
              <em className="font-fraunces font-medium italic tracking-normal text-hv-accent">
                need.
              </em>
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-2">
            <motion.span
              className="block"
              variants={line}
              custom={2}
              initial="hidden"
              animate={active ? "show" : "hidden"}
            >
              One{" "}
              <em className="font-fraunces font-medium italic tracking-normal">
                destination.
              </em>
            </motion.span>
          </span>
        </h1>

        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={active ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="max-w-md text-base leading-relaxed text-hv-muted sm:text-lg"
          >
            Merge PDFs, compress images, generate QR codes, format JSON —
            ten toolboxes, one address. Your files never leave your device.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={active ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <Link
                href="/tools"
                data-cursor="view"
                className="group inline-flex items-center gap-2 rounded-full bg-hv-accent px-6 py-3.5 text-sm font-semibold text-hv-ink transition-colors duration-300 hover:bg-hv-accent-2"
              >
                Explore all 145 tools
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Magnetic>
            <Magnetic>
              <button
                type="button"
                onClick={() => onNavigate("#categories")}
                className="inline-flex items-center gap-2 rounded-full border border-hv-ink/25 px-6 py-3.5 text-sm font-semibold text-hv-ink transition-colors duration-300 hover:border-hv-ink/60 hover:bg-hv-ink/5"
              >
                Browse categories
                <ArrowDown className="h-4 w-4" />
              </button>
            </Magnetic>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-10 flex items-center justify-between border-t border-hv-line pt-4"
        >
          <p className="hv-eyebrow">Scroll — the toolbox is below</p>
          <p className="hv-eyebrow hidden sm:block">
            PDF <span className="text-hv-accent">·</span> Image{" "}
            <span className="text-hv-accent">·</span> QR{" "}
            <span className="text-hv-accent">·</span> Dev{" "}
            <span className="text-hv-accent">·</span> +6 more
          </p>
          <div className="hv-spin-slow flex h-10 w-10 items-center justify-center rounded-full border border-hv-ink/25 font-fraunces text-lg italic text-hv-accent">
            ↓
          </div>
        </motion.div>
      </div>
    </section>
  );
}
