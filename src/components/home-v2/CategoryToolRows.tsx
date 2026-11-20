"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import type { Tool } from "@/data/tools";

/**
 * Category tool list as hover/tap-expanding rows (Stage 2) — the
 * CategoryIndex pattern from the homepage, listing every real tool
 * in the category with its real description. First row open by
 * default; rows also link straight through to the tool.
 */
export function CategoryToolRows({
  tools,
  category,
}: {
  tools: Tool[];
  category: string;
}) {
  const [open, setOpen] = useState<string>(tools[0]?.id ?? "");

  return (
    <div className="border-t border-hv-line">
      {tools.map((t, i) => {
        const isOpen = open === t.id;
        return (
          <div
            key={t.id}
            className={`border-b border-hv-line transition-colors duration-300 ${
              isOpen ? "bg-hv-surface" : "hover:bg-hv-bg-2"
            }`}
            onMouseEnter={() => setOpen(t.id)}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? "" : t.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-2 py-5 text-left sm:gap-6 sm:px-4"
            >
              <span className="w-8 shrink-0 font-mono text-xs text-hv-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block font-grotesk text-xl font-bold tracking-tight transition-colors duration-300 sm:text-2xl ${
                    isOpen ? "text-hv-ink" : "text-hv-ink/85"
                  }`}
                >
                  {t.title}
                </span>
                <span className="mt-1 hidden text-sm text-hv-muted md:block">
                  {t.description}
                </span>
              </span>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                  isOpen
                    ? "rotate-45 border-hv-accent bg-hv-accent text-hv-ink"
                    : "border-hv-line-strong text-hv-ink"
                }`}
                aria-hidden
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-4 px-2 pb-6 pl-[3.25rem] sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:pl-[4.5rem]">
                    <p className="max-w-xl text-sm leading-relaxed text-hv-muted md:hidden">
                      {t.description}
                    </p>
                    <p className="hidden max-w-xl text-sm leading-relaxed text-hv-muted md:block">
                      Free · Runs in your browser · Nothing uploaded.
                    </p>
                    <Link
                      href={`/${category}/${t.id}`}
                      className="group inline-flex shrink-0 items-center gap-2 font-grotesk text-sm font-semibold text-hv-ink"
                    >
                      <span className="hv-link-line">Open {t.title}</span>
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
  );
}
