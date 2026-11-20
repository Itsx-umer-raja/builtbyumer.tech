"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
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
import { TOOLS, toolsByCategory } from "@/data/tools";

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

/**
 * Category showcase — an interactive index of expanding rows.
 * Hover (desktop) or tap (mobile) opens a row: description, sample
 * tools, count, and the link to the real category route.
 */
export function CategoryIndex() {
  const [open, setOpen] = useState<string>("pdf-tools");

  return (
    <section id="categories" className="relative scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div data-hv-reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="hv-eyebrow">
              <span className="hv-dot">●</span> 01 — The index
            </p>
            <h2 className="mt-4 font-grotesk text-4xl font-bold leading-[0.95] tracking-tight text-hv-ink sm:text-6xl">
              Ten toolboxes.
              <br />
              <em className="font-fraunces font-medium italic text-hv-accent">
                Pick one.
              </em>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-hv-muted sm:text-base">
            Every category is a shelf of tools that run entirely in your
            browser. Hover a row to peek inside — tap it on mobile.
          </p>
        </div>

        <div className="mt-12 border-t border-hv-line">
          {CATEGORIES.map((cat, i) => {
            const tools = toolsByCategory(cat.slug);
            const Icon = ICONS[cat.slug] ?? FileText;
            const isOpen = open === cat.slug;
            return (
              <div
                key={cat.slug}
                data-hv-reveal
                className={`border-b border-hv-line transition-colors duration-300 ${
                  isOpen ? "bg-hv-surface" : "hover:bg-hv-bg-2"
                }`}
                onMouseEnter={() => setOpen(cat.slug)}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? "" : cat.slug)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 px-2 py-5 text-left sm:gap-8 sm:px-4 sm:py-6"
                >
                  <span className="w-8 shrink-0 font-mono text-xs text-hv-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                      isOpen
                        ? "border-hv-accent bg-hv-accent text-hv-ink"
                        : "border-hv-line-strong text-hv-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate font-grotesk text-2xl font-bold tracking-tight transition-all duration-300 sm:text-4xl ${
                        isOpen ? "translate-x-1 text-hv-ink sm:translate-x-2" : "text-hv-ink/85"
                      }`}
                    >
                      {cat.name}
                    </span>
                    <span className="mt-1 hidden text-sm text-hv-muted md:block">
                      {cat.short}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right sm:block">
                    <span className="block font-grotesk text-2xl font-bold tabular-nums text-hv-ink">
                      {tools.length}
                      <span className="text-hv-accent text-lg"> tools</span>
                    </span>
                  </span>
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isOpen
                        ? "rotate-45 border-hv-accent bg-hv-accent text-hv-ink"
                        : "border-hv-line-strong text-hv-ink"
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-5 px-2 pb-7 pl-[4.25rem] sm:flex-row sm:items-end sm:justify-between sm:px-4 sm:pl-[7.5rem]">
                        <div className="max-w-xl">
                          <p className="text-sm leading-relaxed text-hv-muted sm:text-base">
                            {cat.description}
                          </p>
                          <p className="mt-4 flex flex-wrap gap-2">
                            {tools.slice(0, 4).map((t) => (
                              <Link
                                key={t.id}
                                href={`/${t.category}/${t.id}`}
                                data-cursor="view"
                                className="rounded-full border border-hv-line-strong px-3 py-1.5 text-xs font-medium text-hv-ink/85 transition-colors duration-200 hover:border-hv-accent hover:text-hv-accent"
                              >
                                {t.title}
                              </Link>
                            ))}
                            {tools.length > 4 && (
                              <span className="rounded-full border border-dashed border-hv-line-strong px-3 py-1.5 text-xs font-medium text-hv-muted">
                                +{tools.length - 4} more
                              </span>
                            )}
                          </p>
                        </div>
                        <Link
                          href={`/${cat.slug}`}
                          data-cursor="view"
                          className="group inline-flex shrink-0 items-center gap-2 font-grotesk text-sm font-semibold text-hv-ink"
                        >
                          <span className="hv-link-line">
                            Open {cat.name}
                          </span>
                          <ArrowUpRight className="h-4 w-4 text-hv-accent transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
