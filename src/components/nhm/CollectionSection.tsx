"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Code2, FileText, Image as ImageIcon } from "lucide-react";
import { SandTransitionImage } from "./SandTransitionImage";
import { Sculpture } from "./Sculpture";

const CHAPTERS = [
  {
    name: "PDF & Document Tools",
    description: "Merge, split, convert and organise your documents.",
    image: "/images/tools/pdf-tools.svg",
    href: "/pdf-tools",
  },
  {
    name: "Image & Photo Tools",
    description: "Compress, resize, crop and convert your images.",
    image: "/images/tools/image-tools.svg",
    href: "/image-tools",
  },
  {
    name: "QR & Barcode Tools",
    description: "Generate and scan QR codes and barcodes.",
    image: "/images/tools/qr-tools.svg",
    href: "/qr-tools",
  },
  {
    name: "Network & Internet Tools",
    description: "Explore IP addresses, DNS and network information.",
    image: "/images/tools/network-tools.svg",
    href: "/network-tools",
  },
  {
    name: "Developer Utilities",
    description: "Format JSON, encode text and simplify programming tasks.",
    image: "/images/tools/developer-tools.svg",
    href: "/developer-tools",
  },
] as const;

const CYCLE_MS = 3500;
const RESUME_MS = 6000;

export function CollectionSection() {
  const [activeChapter, setActiveChapter] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimer = useRef(0);

  // Auto-cycle every 3500ms unless paused by user interaction.
  useEffect(() => {
    if (isPaused) return;
    const id = window.setInterval(
      () => setActiveChapter((c) => (c + 1) % CHAPTERS.length),
      CYCLE_MS,
    );
    return () => window.clearInterval(id);
  }, [isPaused]);

  const interact = () => {
    setIsPaused(true);
    window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setIsPaused(false), RESUME_MS);
  };
  useEffect(() => () => window.clearTimeout(resumeTimer.current), []);

  const chapter = CHAPTERS[activeChapter];

  return (
    <section id="collection" className="relative w-full overflow-hidden bg-[#0a0a0a] text-white">
      {/* Sculpture overlapping upwards from the dark section */}
      <div className="pointer-events-none absolute -top-[200px] left-1/2 z-20 w-[92%] max-w-[1100px] -translate-x-1/2 md:-top-[380px]">
        <Sculpture className="w-full" />
      </div>

      <div className="relative px-8 pt-32 md:px-16 md:pt-48">
        {/* heading area */}
        <div className="mb-16 grid gap-10 xl:grid-cols-[1.4fr_1fr] xl:items-end">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl font-sans text-3xl font-medium leading-tight tracking-tight md:text-5xl"
          >
            Thousands of ways to make everyday digital work simpler.
          </motion.h2>

          <div>
            <div className="flex items-center gap-3">
              {[FileText, ImageIcon, Code2].map((Icon, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/30 text-white transition-colors duration-300 hover:border-white hover:bg-white hover:text-[#0a0a0a]"
                >
                  <Icon className="h-5 w-5" />
                </motion.span>
              ))}
            </div>
            <p className="mt-6 font-mono text-[11px] uppercase leading-relaxed tracking-[0.2em] text-[#888888]">
              Less complexity.
              <br />
              More productivity.
              <br />
              Better digital tools.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {["Free To Use", "Easy To Use", "Everyday Tools"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/25 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/80"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* two-column collection panel */}
        <div className="grid grid-cols-1 border-t border-white/10 lg:grid-cols-[35%_1fr]">
          {/* left — category artwork */}
          <div className="relative border-b border-white/10 p-6 md:p-10 lg:border-b-0 lg:border-r">
            <SandTransitionImage
              src={chapter.image}
              alt={chapter.name}
              className="max-w-[520px]"
            />
            {/* decorative stars */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.4, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute right-[18%] top-[10%] text-white"
              >
                ✦
              </motion.span>
              <motion.span
                animate={{ opacity: [1, 0.3, 1], scale: [1.3, 1, 1.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute bottom-[22%] left-[12%] text-[#C6F35C]"
              >
                ✦
              </motion.span>
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.6, repeat: Infinity }}
                className="absolute left-[45%] top-[6%] text-white/70"
              >
                ✦
              </motion.span>
            </div>
            {/* animated chapter counter */}
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-[#888888]">
              {String(activeChapter + 1).padStart(2, "0")} / {String(CHAPTERS.length).padStart(2, "0")}
            </p>
          </div>

          {/* right — chapter list */}
          <div
            onMouseEnter={interact}
            onFocus={interact}
            onTouchStart={interact}
          >
            {CHAPTERS.map((c, i) => {
              const active = i === activeChapter;
              return (
                <a
                  key={c.name}
                  href={c.href}
                  onClick={() => {
                    setActiveChapter(i);
                    interact();
                  }}
                  onMouseEnter={() => {
                    setActiveChapter(i);
                    interact();
                  }}
                  className="group block border-b border-white/10 last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-6 px-6 py-7 transition-colors duration-300 md:px-10 md:py-9">
                    <div>
                      <h3
                        className={
                          "font-sans text-xl font-medium uppercase tracking-tight transition-colors duration-300 sm:text-2xl md:text-4xl " +
                          (active ? "text-white" : "text-[#555555] group-hover:text-[#999999]")
                        }
                      >
                        {c.name}
                      </h3>
                      <motion.p
                        initial={false}
                        animate={{ opacity: active ? 1 : 0, height: active ? "auto" : 0 }}
                        transition={{ duration: 0.4 }}
                        className="overflow-hidden text-sm leading-relaxed text-[#999999]"
                      >
                        {active && <span className="mt-2 block max-w-md">{c.description}</span>}
                      </motion.p>
                    </div>
                    <motion.span
                      animate={active ? { x: [0, 6, 0], y: [0, -6, 0] } : { x: 0, y: 0 }}
                      transition={{ duration: 1.6, repeat: active ? Infinity : 0, ease: "easeInOut" }}
                      className={
                        "grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors duration-300 " +
                        (active
                          ? "border-white text-white"
                          : "border-white/20 text-[#555555] group-hover:border-white/50")
                      }
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </motion.span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* section footer */}
        <p className="px-2 pb-10 pt-16 font-mono text-[10px] uppercase tracking-[0.2em] text-[#888888] md:text-[11px]">
          Explore. Create. Simplify.
        </p>
      </div>
    </section>
  );
}
