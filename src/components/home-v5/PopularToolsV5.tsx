"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TOOL_MAP } from "@/data/tools";
import { CATEGORY_ICONS } from "../home-v4/icons";
import { SectionHeaderV5, VermillionLine } from "./SectionHeaderV5";

/**
 * Quick-access strip — the 10 most reached-for tools, one tap away.
 * Real tools, real routes, real descriptions from the registry.
 * Paper cards with ink borders; hover inverts to ink with a
 * vermillion icon chip. Snap-scrolling row on phones, 2×5 grid
 * from sm up.
 */
const POPULAR_IDS = [
  "merge-pdf",
  "compress-pdf",
  "image-compressor",
  "qr-code-generator",
  "password-generator",
  "json-formatter",
  "word-counter",
  "image-resizer",
  "age-calculator",
  "unit-converter",
];

export function PopularToolsV5() {
  const tools = POPULAR_IDS.map((id) => TOOL_MAP[id]).filter(Boolean);

  return (
    <section id="popular" className="relative scroll-mt-20 bg-[#faf8f2]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <SectionHeaderV5
          index="02"
          eyebrow="Popular right now"
          title={
            <>
              The ones everyone
              <br />
              <VermillionLine>reaches for.</VermillionLine>
            </>
          }
          subline="No searching, no scrolling. The ten tools people open most — tap one and you are in."
        />

        <div
          data-stagger-group
          className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden"
        >
          {tools.map((t) => {
            const Icon = CATEGORY_ICONS[t!.category] ?? ArrowUpRight;
            return (
              <Link
                key={t!.id}
                href={`/${t!.category}/${t!.id}`}
                data-stagger-item
                className="group relative flex w-[248px] shrink-0 snap-start flex-col rounded-3xl border-2 border-[#141412] bg-white p-5 transition-all duration-300 hover:-translate-y-1.5 hover:bg-[#141412] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d00] sm:w-auto sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#141412]/15 bg-[#141412]/[0.04] text-[#141412] transition-colors duration-300 group-hover:border-[#ff4d00] group-hover:bg-[#ff4d00] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[#141412]/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#ff4d00]" />
                </div>
                <h3 className="mt-4 font-grotesk text-lg font-bold leading-snug tracking-tight text-[#141412] transition-colors duration-300 group-hover:text-white">
                  {t!.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#141412]/60 transition-colors duration-300 group-hover:text-white/65">
                  {t!.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
