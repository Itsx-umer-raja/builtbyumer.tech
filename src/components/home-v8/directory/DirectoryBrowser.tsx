"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, History, Search, TrendingUp, Trash2, X } from "lucide-react";
import { CATEGORIES, CATEGORY_MAP } from "@/data/categories";
import { TOOLS, toolsByCategory, type Tool } from "@/data/tools";
import { STORIES } from "../routeData";
import { ToolCard } from "./ToolCard";
import { useRecentTools } from "./useRecentTools";

/**
 * The shared tool-discovery interface (Phase 6), used by both
 * the homepage DirectorySection and the standalone /tools page.
 *
 * - Search matches title, description, keywords and category
 *   name, case-insensitive, live as you type; multi-word
 *   queries match every word (AND).
 * - Category filter: All + the 10 real categories, real counts.
 * - Popular row: the 10 most-used tools (routeData STORIES,
 *   TOOL 001–010, registry order), labelled as such.
 * - Recently opened: localStorage only, only tools actually
 *   opened from this directory, max 6, most-recent first.
 * - Keyboard: the search is a combobox with a listbox of the
 *   top 8 matches — ArrowUp/Down to move, Enter to open,
 *   Esc to clear. Every card is a plain link, so Tab reaches
 *   every tool too.
 *
 * `animate` is true only on the homepage, where HomeV8's GSAP
 * runs. On /tools there is no GSAP, so no .v8-reveal classes
 * are added there (they would stay hidden without it).
 * Reveal classes go only on always-mounted wrapper nodes —
 * never on filtered/conditional items, which re-render and
 * would otherwise be stuck at the CSS initial hidden state.
 */

const ALL = "all";

function matches(tool: Tool, words: string[]): boolean {
  const category = CATEGORY_MAP[tool.category];
  const haystack = [
    tool.title,
    tool.description,
    ...(tool.keywords ?? []),
    category?.name ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return words.every((w) => haystack.includes(w));
}

export function DirectoryBrowser({
  animate = false,
  searchId = "directory-search",
}: {
  animate?: boolean;
  searchId?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [listOpen, setListOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mounted: recentMounted, tools: recentTools, record, clear: clearRecent } = useRecentTools();

  const words = useMemo(
    () => query.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  );

  const filtered = useMemo(() => {
    let list = TOOLS;
    if (category !== ALL) list = list.filter((t) => t.category === category);
    if (words.length > 0) list = list.filter((t) => matches(t, words));
    return list;
  }, [category, words]);

  const suggestions = useMemo(() => {
    if (words.length === 0) return [];
    return TOOLS.filter((t) => matches(t, words)).slice(0, 8);
  }, [words]);

  const browseMode = words.length === 0 && category === ALL;
  const reveal = animate ? "v8-reveal" : undefined;

  // Close the suggestion listbox on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      ) {
        setListOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const clearAll = () => {
    setQuery("");
    setCategory(ALL);
    setListOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const openSuggestion = (index: number) => {
    const tool = suggestions[index] ?? suggestions[0];
    if (!tool) return;
    record(tool.id);
    window.location.href = `/${tool.category}/${tool.id}`;
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setListOpen(true);
        setActiveIndex((i) => (i + 1) % suggestions.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setListOpen(true);
        setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
      }
    } else if (e.key === "Enter") {
      if (listOpen && suggestions.length > 0) {
        e.preventDefault();
        openSuggestion(activeIndex < 0 ? 0 : activeIndex);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      clearAll();
    }
  };

  const listboxOpen = listOpen && suggestions.length > 0;

  return (
    <div>
      {/* ── Search + category filter ─────────────────────────── */}
      <div className={reveal}>
        <div ref={searchWrapRef} className="relative w-full">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (suggestions.length > 0) openSuggestion(activeIndex < 0 ? 0 : activeIndex);
            }}
          >
            <label htmlFor={searchId} className="sr-only">
              Search all {TOOLS.length} tools
            </label>
            <div className="v8-glass relative flex items-center gap-3 rounded-full px-5 py-2 transition-shadow focus-within:border-[var(--v8-accent)]">
              <Search className="h-5 w-5 shrink-0 text-[var(--v8-muted)]" aria-hidden />
              <input
                ref={inputRef}
                id={searchId}
                type="search"
                value={query}
                role="combobox"
                aria-expanded={listboxOpen}
                aria-controls={`${searchId}-list`}
                aria-activedescendant={
                  activeIndex >= 0 && suggestions[activeIndex]
                    ? `${searchId}-option-${suggestions[activeIndex].id}`
                    : undefined
                }
                aria-label={`Search all ${TOOLS.length} tools by name, description or keyword`}
                autoComplete="off"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(-1);
                  setListOpen(true);
                }}
                onFocus={() => setListOpen(true)}
                onKeyDown={onInputKeyDown}
                placeholder={`Search ${TOOLS.length} tools — try “merge pdf”…`}
                className="h-12 w-full min-w-0 bg-transparent text-base text-[var(--v8-text)] outline-none placeholder:text-[var(--v8-muted)] sm:h-14 sm:text-lg"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearAll}
                  aria-label="Clear search"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[var(--v8-muted)] transition-colors hover:bg-white/10 hover:text-[var(--v8-text)]"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
              <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-[var(--v8-line)] bg-white/5 px-2 py-1 font-grotesk font-semibold text-[11px] text-[var(--v8-muted)] sm:flex">
                Esc to clear
              </kbd>
            </div>
          </form>

          {/* Suggestion listbox — top 8 matches, arrow-key navigable. */}
          {listboxOpen && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] text-left shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
              <ul role="listbox" id={`${searchId}-list`} aria-label="Matching tools">
                {suggestions.map((t, i) => (
                  <li
                    key={t.id}
                    role="option"
                    id={`${searchId}-option-${t.id}`}
                    aria-selected={i === activeIndex}
                    className="border-b border-[var(--v8-line)] last:border-b-0"
                  >
                    <Link
                      href={`/${t.category}/${t.id}`}
                      onClick={() => record(t.id)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex items-center justify-between gap-4 px-5 py-3 transition-colors ${
                        i === activeIndex
                          ? "border-l-4 border-[var(--v8-accent)] bg-[var(--v8-accent)]/15"
                          : "border-l-4 border-transparent hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[var(--v8-text)]">
                          {t.title}
                        </span>
                        <span className="block truncate text-xs text-[var(--v8-muted)]">
                          {CATEGORY_MAP[t.category]?.name ?? t.category}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--v8-accent)]" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {listOpen && words.length > 0 && suggestions.length === 0 && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] px-5 py-4 text-left text-sm text-[var(--v8-muted)] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
              No tool matches “{query.trim()}” —{" "}
              <button
                type="button"
                onClick={clearAll}
                className="font-semibold text-[var(--v8-accent)] underline-offset-2 hover:underline"
              >
                browse all tools
              </button>
              .
            </div>
          )}
        </div>

        {/* Category filter — All + 10 real categories, real counts. */}
        <div
          className="mt-6 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter tools by category"
        >
          <button
            type="button"
            onClick={() => setCategory(ALL)}
            aria-pressed={category === ALL}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
              category === ALL
                ? "border-[var(--v8-accent)] bg-[var(--v8-accent)] text-[var(--v8-bg)]"
                : "border-[var(--v8-line-strong)] bg-white/[0.03] text-[var(--v8-text)]/85 hover:border-[var(--v8-accent)]"
            }`}
          >
            All tools · {TOOLS.length}
          </button>
          {CATEGORIES.map((c) => {
            const count = toolsByCategory(c.slug).length;
            const active = category === c.slug;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategory(active ? ALL : c.slug)}
                aria-pressed={active}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "border-[var(--v8-accent)] bg-[var(--v8-accent)] text-[var(--v8-bg)]"
                    : "border-[var(--v8-line-strong)] bg-white/[0.03] text-[var(--v8-text)]/85 hover:border-[var(--v8-accent)]"
                }`}
              >
                {c.name} · {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Result count ─────────────────────────────────────── */}
      <p className="mt-8 text-sm text-[var(--v8-muted)]" aria-live="polite">
        {browseMode ? (
          <>
            Showing all <strong className="font-semibold text-[var(--v8-text)]">{TOOLS.length} tools</strong>{" "}
            across {CATEGORIES.length} categories.
          </>
        ) : (
          <>
            Showing <strong className="font-semibold text-[var(--v8-text)]">{filtered.length}</strong> of{" "}
            {TOOLS.length} tools
            {category !== ALL ? (
              <>
                {" "}in <strong className="font-semibold text-[var(--v8-text)]">{CATEGORY_MAP[category]?.name}</strong>
              </>
            ) : null}
            {words.length > 0 ? (
              <>
                {" "}matching “{query.trim()}”
              </>
            ) : null}
            .
          </>
        )}
      </p>

      {/* ── Popular + recently opened (browse mode only) ─────── */}
      {browseMode && (
        <>
          <div className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--v8-line)] pb-4">
              <h3 className="flex items-center gap-2 font-grotesk text-xl font-bold tracking-tight text-[var(--v8-text)] sm:text-2xl">
                <TrendingUp className="h-5 w-5 text-[var(--v8-accent)]" aria-hidden />
                Most used on the route
              </h3>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--v8-muted)]">
                The 10 tools travellers open most
              </p>
            </div>
            <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {STORIES.map((story) => (
                <li key={story.tool.id}>
                  <Link
                    href={`/${story.tool.category}/${story.tool.id}`}
                    onClick={() => record(story.tool.id)}
                    className="v8-glass-soft group flex h-full flex-col rounded-2xl p-4 transition-colors duration-300 hover:border-[var(--v8-accent)]"
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-anta text-xs tracking-wide text-[var(--v8-accent)]">
                        TOOL {story.num}
                      </span>
                      <ArrowUpRight
                        className="h-4 w-4 text-[var(--v8-muted)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--v8-accent)]"
                        aria-hidden
                      />
                    </span>
                    <span className="mt-2.5 block text-sm font-semibold leading-snug text-[var(--v8-text)]">
                      {story.tool.title}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--v8-muted)]">
                      {CATEGORY_MAP[story.tool.category]?.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--v8-line)] pb-4">
              <h3 className="flex items-center gap-2 font-grotesk text-xl font-bold tracking-tight text-[var(--v8-text)] sm:text-2xl">
                <History className="h-5 w-5 text-[var(--v8-accent)]" aria-hidden />
                Recently opened
              </h3>
              {recentMounted && recentTools.length > 0 && (
                <button
                  type="button"
                  onClick={clearRecent}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--v8-muted)] transition-colors hover:text-[var(--v8-text)]"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Clear history
                </button>
              )}
            </div>
            {!recentMounted || recentTools.length === 0 ? (
              <p className="mt-5 text-sm leading-relaxed text-[var(--v8-muted)]">
                Nothing opened yet — the last tools you open from this directory will show up here.
              </p>
            ) : (
              <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentTools.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      href={`/${tool.category}/${tool.id}`}
                      onClick={() => record(tool.id)}
                      className="v8-glass-soft group flex h-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 transition-colors duration-300 hover:border-[var(--v8-accent)]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[var(--v8-text)]">
                          {tool.title}
                        </span>
                        <span className="block truncate text-xs text-[var(--v8-muted)]">
                          {CATEGORY_MAP[tool.category]?.name ?? tool.category}
                        </span>
                      </span>
                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 text-[var(--v8-muted)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--v8-accent)]"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}

      {/* ── The directory — all tools, crawlable HTML ────────── */}
      <div className={reveal}>
        {filtered.length === 0 ? (
          <div className="v8-glass-soft mt-10 rounded-3xl p-8 text-center sm:p-12">
            <p className="font-anta text-2xl text-[var(--v8-text)] sm:text-3xl">
              No tool matches “{query.trim()}”
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--v8-muted)]">
              Try a different word — “pdf”, “image”, “qr”, “password” — or clear the search and
              browse all {TOOLS.length} tools by category.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="v8-btn-primary mt-6 inline-flex items-center rounded-full px-6 py-3 text-sm font-bold"
            >
              Browse all tools
            </button>
          </div>
        ) : browseMode ? (
          <div className="mt-12 space-y-14">
            {CATEGORIES.map((c) => {
              const tools = toolsByCategory(c.slug);
              return (
                <section key={c.slug} aria-label={c.name}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--v8-line)] pb-4">
                    <h3 className="font-grotesk text-2xl font-bold tracking-tight text-[var(--v8-text)]">
                      {c.name}{" "}
                      <span className="font-anta text-sm font-normal text-[var(--v8-accent)]">
                        {String(tools.length).padStart(2, "0")}
                      </span>
                    </h3>
                    <Link
                      href={`/${c.slug}`}
                      className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--v8-text)]"
                    >
                      <span className="v8-link-line">Open {c.name}</span>
                      <ArrowUpRight
                        className="h-4 w-4 text-[var(--v8-accent)] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden
                      />
                    </Link>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--v8-muted)]">{c.short}</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} onOpen={record} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onOpen={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
