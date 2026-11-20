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
 * from the live registry, never hard-coded.
 */
export function CategoryBento() {
  return (
    <section id="categories" className="relative scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div data-v3-reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="v3-eyebrow">
              <span className="v3-dot">●</span> 01 — The index
            </p>
            <h2 className="mt-4 font-grotesk text-4xl font-bold leading-[0.95] tracking-tight text-v3-ink sm:text-6xl">
              Ten toolboxes.
              <br />
              <em className="font-fraunces font-medium italic text-v3-accent">
                Pick one.
              </em>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-v3-muted sm:text-base">
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
                data-v3-reveal
                className={`group relative flex flex-col rounded-3xl border border-v3-line bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-v3-accent/60 hover:shadow-[0_20px_45px_rgba(22,22,19,0.10)] sm:p-7 ${SPANS[cat.slug] ?? "md:col-span-2"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-v3-line bg-v3-bg text-v3-ink transition-colors duration-300 group-hover:border-v3-accent group-hover:bg-v3-accent group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-grotesk text-2xl font-bold tabular-nums text-v3-ink">
                    {tools.length}
                    <span className="ml-1 text-sm font-semibold text-v3-muted">
                      tools
                    </span>
                  </span>
                </div>

                <h3 className="mt-5 font-grotesk text-2xl font-bold tracking-tight text-v3-ink">
                  {cat.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-v3-muted">
                  {cat.short}
                </p>

                <p className="mt-4 flex flex-wrap gap-2">
                  {tools.slice(0, 3).map((t) => (
                    <Link
                      key={t.id}
                      href={`/${t.category}/${t.id}`}
                      className="rounded-full border border-v3-line px-3 py-1.5 text-xs font-medium text-v3-ink/85 transition-colors duration-200 hover:border-v3-accent hover:text-v3-accent"
                    >
                      {t.title}
                    </Link>
                  ))}
                </p>

                <Link
                  href={`/${cat.slug}`}
                  className="mt-6 inline-flex items-center gap-2 font-grotesk text-sm font-semibold text-v3-ink"
                >
                  <span className="v3-link-line">Open {cat.name}</span>
                  <ArrowUpRight className="h-4 w-4 text-v3-accent transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
