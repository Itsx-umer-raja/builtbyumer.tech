"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { toolsByCategory } from "@/data/tools";
import { CATEGORY_ICONS } from "../home-v4/icons";
import { SectionHeaderV5, VermillionLine } from "./SectionHeaderV5";

/**
 * The categories as an editorial index — ten numbered rows, not
 * cards. Each row: index number, big Anta name, live count, the
 * three most-used tools, and an arrow. Hover inverts the row to
 * ink with a vermillion arrow. The whole row is one link to the
 * real category page. Counts and tools come from the live
 * registry, never hard-coded.
 */
export function CategoryIndexV5() {
  return (
    <section id="categories" className="relative scroll-mt-20 bg-[#faf8f2]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <SectionHeaderV5
          index="03"
          eyebrow="The index"
          title={
            <>
              Ten toolboxes.
              <br />
              <VermillionLine>Pick one.</VermillionLine>
            </>
          }
          subline="Every category is a shelf of tools that run entirely in your browser. Nothing uploaded, nothing installed, nothing to sign up for."
        />

        <div data-stagger-group className="mt-12 border-t-2 border-[#141412]">
          {CATEGORIES.map((cat, i) => {
            const tools = toolsByCategory(cat.slug);
            const Icon = CATEGORY_ICONS[cat.slug] ?? ArrowUpRight;
            return (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                data-stagger-item
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-[#141412]/15 px-2 py-6 transition-colors duration-300 hover:bg-[#141412] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4d00] sm:grid-cols-[auto_1fr_auto_auto] sm:gap-8 sm:px-4 sm:py-7"
              >
                <span className="font-anta text-lg text-[#141412]/35 transition-colors duration-300 group-hover:text-white/40 sm:text-xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-3">
                    <Icon className="h-6 w-6 shrink-0 text-[#141412] transition-colors duration-300 group-hover:text-[#ff4d00] sm:h-7 sm:w-7" />
                    <span className="font-anta text-2xl leading-none tracking-[0.01em] text-[#141412] transition-colors duration-300 group-hover:text-white sm:text-4xl">
                      {cat.name}
                    </span>
                    <span className="rounded-full border border-[#141412]/20 px-2.5 py-0.5 font-grotesk text-xs font-semibold text-[#141412]/70 transition-colors duration-300 group-hover:border-white/30 group-hover:text-white/80">
                      {tools.length} tools
                    </span>
                  </span>
                  <span className="mt-2 block truncate text-sm text-[#141412]/55 transition-colors duration-300 group-hover:text-white/60">
                    {tools.slice(0, 3).map((t) => t.title).join(" · ")}
                  </span>
                </span>
                <span className="hidden text-sm leading-relaxed text-[#141412]/55 transition-colors duration-300 group-hover:text-white/60 md:block md:max-w-[240px]">
                  {cat.short}
                </span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#141412]/20 text-[#141412] transition-all duration-300 group-hover:rotate-45 group-hover:border-[#ff4d00] group-hover:bg-[#ff4d00] group-hover:text-white">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
