"use client";

import Link from "next/link";
import { ArrowUpRight, Calculator, KeyRound, Type as TypeIcon } from "lucide-react";
import { TOOL_MAP } from "@/data/tools";

/**
 * Playground teaser — three of the most reached-for tools as
 * link cards. Link only: the tools themselves live on their own
 * pages and are never reimplemented here.
 */
const PLAYGROUND = [
  {
    id: "word-counter",
    icon: TypeIcon,
    teaser: "Type or paste — words, characters and reading time update as you go.",
    example: "“The quick brown fox…” → 4 words",
  },
  {
    id: "password-generator",
    icon: KeyRound,
    teaser: "Strong random passwords in one click, generated on your device.",
    example: "16 characters · symbols on",
  },
  {
    id: "unit-converter",
    icon: Calculator,
    teaser: "Length, weight, temperature, area, volume, speed and data size.",
    example: "70 kg → 154.32 lb",
  },
];

export function PlaygroundV4() {
  const tools = PLAYGROUND.map((p) => ({ ...p, tool: TOOL_MAP[p.id] })).filter(
    (p) => p.tool,
  );

  return (
    <section id="playground" className="relative scroll-mt-20 bg-black">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="v4-reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="v4-eyebrow">
              <span className="v4-dot">●</span> 03 — Try one now
            </p>
            <h2 className="mt-4 font-anta text-4xl leading-[1.05] tracking-[0.01em] text-white sm:text-6xl">
              Don&apos;t take our word.
              <br />
              <span className="bg-gradient-to-r from-[#ff9646] to-[#ff4d00] bg-clip-text text-transparent">
                Try one.
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/55 sm:text-base">
            Three favourites, one click away. They open on their own page —
            free, private, and already loaded.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {tools.map((p) => (
            <Link
              key={p.id}
              href={`/${p.tool!.category}/${p.tool!.id}`}
              className="v4-reveal group relative flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-[#ff9646]/50 hover:shadow-[0_20px_45px_rgba(255,77,0,0.18)] sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-colors duration-300 group-hover:border-[#ff4d00] group-hover:bg-[#ff4d00] group-hover:text-white">
                  <p.icon className="h-5 w-5" />
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition-all duration-300 group-hover:rotate-45 group-hover:border-[#ff4d00] group-hover:bg-[#ff4d00] group-hover:text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <h3 className="mt-5 font-grotesk text-2xl font-bold tracking-tight text-white">
                {p.tool!.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {p.tool!.description}
              </p>
              <p className="mt-3 text-sm text-white/80">{p.teaser}</p>
              <p className="mt-4 border-t border-white/10 pt-4 font-mono text-xs uppercase tracking-[0.14em] text-[#ff9646]">
                {p.example}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 font-grotesk text-sm font-semibold text-white">
                <span className="v4-link-line">Open {p.tool!.title}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
