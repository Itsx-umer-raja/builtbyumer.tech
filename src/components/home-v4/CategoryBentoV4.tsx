"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Calculator,
  Code2,
  Database,
  FileText,
  Globe,
  Image as ImageIcon,
  QrCode,
  Timer,
  Type as TypeIcon,
} from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { toolsByCategory } from "@/data/tools";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "pdf-tools": FileText,
  "image-tools": ImageIcon,
  "qr-tools": QrCode,
  "network-tools": Globe,
  "developer-tools": Code2,
  "text-tools": TypeIcon,
  calculators: Calculator,
  "data-tools": Database,
  "business-tools": Briefcase,
  "productivity-tools": Timer,
};

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
 * Category bento — all 10 real categories with their real counts,
 * sample tools and links to the real category routes. Counts come
 * from the live registry, never hard-coded. Dark glass cards with
 * an ember glow on hover.
 */
export function CategoryBentoV4() {
  return (
    <section id="categories" className="relative scroll-mt-20 bg-black">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="v4-reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="v4-eyebrow">
              <span className="v4-dot">●</span> 01 — The index
            </p>
            <h2 className="mt-4 font-anta text-4xl leading-[1.05] tracking-[0.01em] text-white sm:text-6xl">
              Ten toolboxes.
              <br />
              <span className="bg-gradient-to-r from-[#ff9646] to-[#ff4d00] bg-clip-text text-transparent">
                Pick one.
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/55 sm:text-base">
            Every category is a shelf of tools that run entirely in your
            browser. Nothing uploaded, nothing installed, nothing to sign up for.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-6">
          {CATEGORIES.map((cat) => {
            const tools = toolsByCategory(cat.slug);
            const Icon = ICONS[cat.slug] ?? FileText;
            return (
              <article
                key={cat.slug}
                className={`v4-reveal group relative flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-[#ff9646]/50 hover:shadow-[0_20px_45px_rgba(255,77,0,0.18)] sm:p-7 ${SPANS[cat.slug] ?? "md:col-span-2"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-colors duration-300 group-hover:border-[#ff4d00] group-hover:bg-[#ff4d00] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-anta text-2xl tabular-nums text-white">
                    {tools.length}
                    <span className="ml-1 font-grotesk text-sm font-semibold text-white/50">
                      tools
                    </span>
                  </span>
                </div>

                <h3 className="mt-5 font-grotesk text-2xl font-bold tracking-tight text-white">
                  {cat.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {cat.short}
                </p>

                <p className="mt-4 flex flex-wrap gap-2">
                  {tools.slice(0, 3).map((t) => (
                    <Link
                      key={t.id}
                      href={`/${t.category}/${t.id}`}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors duration-200 hover:border-[#ff9646] hover:text-[#ff9646]"
                    >
                      {t.title}
                    </Link>
                  ))}
                </p>

                <Link
                  href={`/${cat.slug}`}
                  className="mt-6 inline-flex items-center gap-2 font-grotesk text-sm font-semibold text-white"
                >
                  <span className="v4-link-line">Open {cat.name}</span>
                  <ArrowUpRight className="h-4 w-4 text-[#ff9646] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
