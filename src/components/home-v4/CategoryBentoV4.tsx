"use client";

import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { TOOL_MAP, toolsByCategory } from "@/data/tools";
import { CATEGORY_ICONS } from "./icons";
import { EmberLine, SectionHeader } from "./SectionHeader";

/** Bento spans (md 6-col grid): big shelves first, trios after. */
const SPANS: Record<string, string> = {
  "pdf-tools": "md:col-span-3",
  "image-tools": "md:col-span-3",
  "developer-tools": "md:col-span-2",
  "text-tools": "md:col-span-2",
  calculators: "md:col-span-2",
  "network-tools": "md:col-span-3",
  "qr-tools": "md:col-span-3",
  "data-tools": "md:col-span-2",
  "business-tools": "md:col-span-2",
  "productivity-tools": "md:col-span-2",
};

/**
 * The three most reached-for tools in each category — flagship
 * tools from the registry, so every card tells the visitor what
 * is actually inside it.
 */
const TOP_TOOLS: Record<string, string[]> = {
  "pdf-tools": ["merge-pdf", "compress-pdf", "split-pdf"],
  "image-tools": ["image-compressor", "image-resizer", "jpg-to-png"],
  "qr-tools": ["qr-code-generator", "wifi-qr-generator", "barcode-generator"],
  "network-tools": ["what-is-my-ip", "dns-lookup", "subnet-calculator"],
  "developer-tools": ["json-formatter", "password-generator", "uuid-generator"],
  "text-tools": ["word-counter", "case-converter", "lorem-ipsum-generator"],
  calculators: ["age-calculator", "percentage-calculator", "unit-converter"],
  "data-tools": ["csv-to-json", "json-to-csv", "csv-to-excel"],
  "business-tools": ["invoice-generator", "quotation-generator", "receipt-generator"],
  "productivity-tools": ["pomodoro-timer", "stopwatch", "countdown-timer"],
};

/**
 * Category bento — all 10 real categories with their real counts.
 * The whole card is one link to the category page, and each card
 * lists its three most-used tools so it is scannable at a glance.
 * Dark glass cards with an ember glow on hover.
 */
export function CategoryBentoV4() {
  return (
    <section id="categories" className="relative scroll-mt-20 bg-black">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <SectionHeader
          index="02"
          eyebrow="The index"
          title={
            <>
              Ten toolboxes.
              <br />
              <EmberLine>Pick one.</EmberLine>
            </>
          }
          subline="Every category is a shelf of tools that run entirely in your browser. Nothing uploaded, nothing installed, nothing to sign up for."
        />

        <div
          data-stagger-group
          className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-6"
        >
          {CATEGORIES.map((cat) => {
            const tools = toolsByCategory(cat.slug);
            const Icon = CATEGORY_ICONS[cat.slug] ?? FileText;
            const top = (TOP_TOOLS[cat.slug] ?? [])
              .map((id) => TOOL_MAP[id])
              .filter(Boolean);
            return (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                data-stagger-item
                aria-label={`${cat.name} — ${tools.length} tools`}
                className={`group relative flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-[#ff9646]/50 hover:shadow-[0_20px_45px_rgba(255,77,0,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9646] sm:p-7 ${SPANS[cat.slug] ?? "md:col-span-2"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-colors duration-300 group-hover:border-[#ff4d00] group-hover:bg-[#ff4d00] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-grotesk text-xs font-semibold text-white/80 transition-colors duration-300 group-hover:border-[#ff9646]/60 group-hover:text-white">
                    <span className="font-anta text-sm tabular-nums text-white">
                      {tools.length}
                    </span>{" "}
                    tools
                  </span>
                </div>

                <h3 className="mt-5 font-grotesk text-2xl font-bold tracking-tight text-white">
                  {cat.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {cat.short}
                </p>

                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Most used
                </p>
                <p className="mt-2 flex flex-wrap gap-2">
                  {top.map((t) => (
                    <span
                      key={t!.id}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors duration-200 group-hover:border-[#ff9646]/50 group-hover:text-white"
                    >
                      {t!.title}
                    </span>
                  ))}
                </p>

                <span className="mt-6 inline-flex items-center gap-2 font-grotesk text-sm font-semibold text-white">
                  <span className="v4-link-line">Open {cat.name}</span>
                  <ArrowUpRight className="h-4 w-4 text-[#ff9646] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
