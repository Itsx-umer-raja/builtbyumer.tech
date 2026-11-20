"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_MAP } from "@/data/categories";
import { TOOL_MAP } from "@/data/tools";

const FEATURED_IDS = [
  "merge-pdf",
  "compress-pdf",
  "image-compressor",
  "qr-code-generator",
  "json-formatter",
  "password-generator",
  "word-counter",
  "percentage-calculator",
  "csv-to-json",
  "invoice-generator",
  "what-is-my-ip",
  "pomodoro-timer",
];

/** Featured tools — 12 real tools with real descriptions and routes. */
export function FeaturedTools() {
  const tools = FEATURED_IDS.map((id) => TOOL_MAP[id]).filter(Boolean);

  return (
    <section id="featured" className="relative scroll-mt-20 border-t border-hv-line bg-hv-bg-2">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div data-hv-reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="hv-eyebrow">
              <span className="hv-dot">●</span> 02 — Most reached-for
            </p>
            <h2 className="mt-4 font-grotesk text-4xl font-bold leading-[0.95] tracking-tight text-hv-ink sm:text-6xl">
              The ones people
              <br />
              <em className="font-fraunces font-medium italic text-hv-accent">
                come back for.
              </em>
            </h2>
          </div>
          <Link
            href="/tools"
            data-cursor="view"
            className="group inline-flex items-center gap-2 rounded-full border border-hv-ink/25 px-5 py-3 text-sm font-semibold text-hv-ink transition-colors duration-300 hover:border-hv-accent hover:text-hv-accent"
          >
            All 145 tools
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-hv-line bg-hv-line sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t, i) => {
            const cat = CATEGORY_MAP[t.category];
            return (
              <Link
                key={t.id}
                href={`/${t.category}/${t.id}`}
                data-cursor="view"
                data-hv-reveal
                className="group relative flex min-h-[190px] flex-col justify-between bg-hv-bg-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-hv-surface sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-xs text-hv-muted">
                    {String(i + 1).padStart(2, "0")} / {cat?.name ?? t.category}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-hv-line-strong text-hv-muted transition-all duration-300 group-hover:rotate-45 group-hover:border-hv-accent group-hover:bg-hv-accent group-hover:text-hv-ink">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <h3 className="font-grotesk text-xl font-bold tracking-tight text-hv-ink transition-transform duration-300 group-hover:translate-x-1 sm:text-2xl">
                    {t.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-hv-muted">
                    {t.description}
                  </p>
                </div>
                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-hv-accent transition-[width] duration-500 ease-out group-hover:w-full" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
