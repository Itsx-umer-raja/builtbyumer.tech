"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Tool } from "@/data/tools";
import { CATEGORIES } from "@/data/categories";

/**
 * Live tool search. `variant` picks the palette: "dark" for the inner
 * /tools pages (V8 dark system, Phase 7), "light" for the white homepage
 * section that matches the Jack-style landing (untouched).
 */
export function ToolSearch({
  tools,
  variant = "dark",
}: {
  tools: Tool[];
  variant?: "dark" | "light";
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const light = variant === "light";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((t) => {
      if (category && t.category !== category) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.keywords ?? []).some((k) => k.toLowerCase().includes(q)) ||
        t.id.includes(q)
      );
    });
  }, [tools, query, category]);

  const inputCls = light
    ? "w-full rounded-full border-[1.5px] border-[rgba(12,12,12,0.2)] bg-white px-5 py-3.5 text-base text-[#0C0C0C] placeholder:text-[#0C0C0C]/40 focus:border-[#0C0C0C] focus:outline-none"
    : "w-full rounded-full border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] px-4 py-3.5 text-base text-[var(--v8-text)] placeholder:text-[var(--v8-muted)] focus:border-[var(--v8-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--v8-accent)]/40";

  const chip = (active: boolean) =>
    light
      ? "rounded-full border-2 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider transition " +
        (active
          ? "border-[#0C0C0C] bg-[#0C0C0C] text-[#121212]"
          : "border-[rgba(12,12,12,0.25)] text-[#0C0C0C]/70 hover:border-[#0C0C0C] hover:text-[#0C0C0C]")
      : "rounded-full border px-3.5 py-1.5 text-xs font-medium transition " +
        (active
          ? "border-[var(--v8-accent)] bg-[var(--v8-accent)] text-[var(--v8-bg)]"
          : "border-[var(--v8-line-strong)] text-[var(--v8-text)]/80 hover:border-[var(--v8-accent)] hover:text-[var(--v8-highlight)]");

  const card = light
    ? "tool-card-light block rounded-2xl border border-[rgba(12,12,12,0.15)] bg-white p-5"
    : "tool-card block rounded-xl border border-[var(--v8-line)] bg-[var(--v8-bg-2)] p-5";

  const empty = light
    ? "mt-10 text-center text-sm text-[#0C0C0C]/60"
    : "mt-10 text-center text-sm text-[var(--v8-muted)]";

  return (
    <div>
      <div className="relative">
        <Search
          className={
            "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 " +
            (light ? "text-[#0C0C0C]/50" : "text-[var(--v8-muted)]")
          }
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${tools.length} free tools — try "pdf", "compress", "json"…`}
          aria-label="Search tools"
          className={inputCls + (light ? " pl-11" : " pl-11 !py-3.5")}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={chip(category === null)}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setCategory(c.slug)}
            className={chip(category === c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <p className="font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--v8-muted)]">
          {results.length} {results.length === 1 ? "tool" : "tools"}
          {query.trim() ? ` matching “${query.trim()}”` : ""}
          {category
            ? ` · ${CATEGORIES.find((c) => c.slug === category)?.name}`
            : ""}
        </p>
      </div>

      {results.length === 0 ? (
        <p className={empty}>No tools match “{query}”. Try a shorter keyword.</p>
      ) : (
        <div className={"mt-6 grid gap-4 sm:grid-cols-2 " + (light ? "lg:grid-cols-3" : "lg:grid-cols-3")}>
          {results.map((t) => (
            <Link key={t.id} href={`/${t.category}/${t.id}`} className={card}>
              <h2
                className={
                  "text-base font-medium " +
                  (light ? "uppercase text-[#0C0C0C]" : "font-grotesk font-semibold text-[var(--v8-text)]")
                }
              >
                {t.title}
              </h2>
              <p
                className={
                  "mt-2 line-clamp-3 text-sm leading-relaxed " +
                  (light ? "text-[#0C0C0C]/60" : "text-[var(--v8-muted)]")
                }
              >
                {t.description}
              </p>
              <span
                className={
                  "mt-3 inline-block text-[11px] font-semibold uppercase tracking-widest " +
                  (light ? "text-[#0C0C0C]/50" : "font-grotesk text-[var(--v8-accent)]")
                }
              >
                {CATEGORIES.find((c) => c.slug === t.category)?.name}
              </span>
            </Link>
          ))}
        </div>
      )}

      <style href="st-toolsearch-1" precedence="high" dangerouslySetInnerHTML={{ __html: `
        .tool-card-light {
          transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease;
        }
        .tool-card-light:hover {
          transform: translateY(-3px);
          border-color: rgba(12, 12, 12, 0.85);
          box-shadow: 0 10px 30px rgba(12, 12, 12, 0.08);
        }
        @media (prefers-reduced-motion: reduce) {
          .tool-card-light {
            transition: none;
          }
        }
      ` }} />
    </div>
  );
}
