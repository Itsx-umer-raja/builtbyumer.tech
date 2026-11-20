"use client";

import Link from "next/link";
import { ArrowUpRight, Calculator, KeyRound, Type as TypeIcon } from "lucide-react";
import { TOOL_MAP } from "@/data/tools";
import { SectionHeaderV5, VermillionLine } from "./SectionHeaderV5";

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

export function PlaygroundV5() {
  const tools = PLAYGROUND.map((p) => ({ ...p, tool: TOOL_MAP[p.id] })).filter(
    (p) => p.tool,
  );

  return (
    <section id="playground" className="relative scroll-mt-20 bg-[#faf8f2]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <SectionHeaderV5
          index="05"
          eyebrow="Try one now"
          title={
            <>
              Don&apos;t take our word.
              <br />
              <VermillionLine>Try one.</VermillionLine>
            </>
          }
          subline="Three favourites, one click away. They open on their own page — free, private, and already loaded."
        />

        <div data-stagger-group className="mt-12 grid gap-4 md:grid-cols-3">
          {tools.map((p) => (
            <Link
              key={p.id}
              href={`/${p.tool!.category}/${p.tool!.id}`}
              data-stagger-item
              className="group relative flex flex-col rounded-3xl border-2 border-[#141412] bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 hover:bg-[#141412] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d00] sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#141412]/15 bg-[#141412]/[0.04] text-[#141412] transition-colors duration-300 group-hover:border-[#ff4d00] group-hover:bg-[#ff4d00] group-hover:text-white">
                  <p.icon className="h-5 w-5" />
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#141412]/20 text-[#141412] transition-all duration-300 group-hover:rotate-45 group-hover:border-[#ff4d00] group-hover:bg-[#ff4d00] group-hover:text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <h3 className="mt-5 font-grotesk text-2xl font-bold tracking-tight text-[#141412] transition-colors duration-300 group-hover:text-white">
                {p.tool!.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#141412]/60 transition-colors duration-300 group-hover:text-white/65">
                {p.tool!.description}
              </p>
              <p className="mt-3 text-sm text-[#141412]/80 transition-colors duration-300 group-hover:text-white/85">{p.teaser}</p>
              <p className="mt-4 border-t border-[#141412]/15 pt-4 font-grotesk font-semibold text-xs uppercase tracking-[0.14em] text-[#ff4d00] transition-colors duration-300 group-hover:border-white/15">
                {p.example}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 font-grotesk text-sm font-semibold text-[#141412] transition-colors duration-300 group-hover:text-white">
                <span className="v5-link-line">Open {p.tool!.title}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
