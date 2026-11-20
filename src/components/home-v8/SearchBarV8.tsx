"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
import { CATEGORY_MAP } from "@/data/categories";
import { TOOLS, TOOL_MAP } from "@/data/tools";

/**
 * The proven V4.1/V5 live tool search, restyled into the V8 dark
 * system. Big input, Ctrl/⌘K or "/" to focus (handled by the
 * parent, which owns the input ref), arrow-key navigation, Enter
 * to open, Esc to close. The parent passes its inputRef so the
 * sticky bar and the header can focus this input from anywhere.
 * Reimplemented from the V7 system — home-v8 never imports
 * from home-v7.
 */

export const SEARCH_CHIPS = [
  "merge-pdf",
  "compress-pdf",
  "image-compressor",
  "qr-code-generator",
  "password-generator",
  "json-formatter",
];

export const SearchBarV8 = forwardRef<
  HTMLInputElement,
  { inputRef: RefObject<HTMLInputElement | null>; id?: string }
>(function SearchBarV8({ inputRef, id = "v8-search" }, _ref) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMac, setIsMac] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(window.navigator.platform));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return TOOLS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.keywords ?? []).some((k) => k.toLowerCase().includes(q)),
    ).slice(0, 8);
  }, [query]);

  // Close the panel on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goTo = (index: number) => {
    const t = results[index] ?? results[0];
    if (t) window.location.href = `/${t.category}/${t.id}`;
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length > 0) {
        setOpen(true);
        setActiveIndex((i) => (i + 1) % results.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length > 0) {
        setOpen(true);
        setActiveIndex((i) => (i - 1 + results.length) % results.length);
      }
    } else if (e.key === "Enter") {
      if (open && results.length > 0) {
        e.preventDefault();
        goTo(activeIndex < 0 ? 0 : activeIndex);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goTo(activeIndex < 0 ? 0 : activeIndex);
        }}
      >
        <div className="v8-glass relative flex items-center gap-3 rounded-full px-5 py-2 shadow-[0_18px_45px_rgba(0,0,0,0.45)] transition-shadow focus-within:border-[var(--v8-accent)] focus-within:shadow-[0_18px_50px_rgba(139,124,255,0.35)]">
          <Search className="h-5 w-5 shrink-0 text-[var(--v8-muted)]" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            role="combobox"
            aria-expanded={open && results.length > 0}
            aria-controls={`${id}-list`}
            aria-activedescendant={
              activeIndex >= 0 && results[activeIndex]
                ? `${id}-option-${results[activeIndex].id}`
                : undefined
            }
            aria-label="Search tools"
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onInputKeyDown}
            placeholder="Search 145 tools — try “merge pdf”…"
            className="h-14 w-full min-w-0 bg-transparent text-base text-[var(--v8-text)] outline-none placeholder:text-[var(--v8-muted)] sm:text-lg"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveIndex(-1);
                setOpen(false);
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[var(--v8-muted)] transition-colors hover:bg-white/10 hover:text-[var(--v8-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-[var(--v8-line)] bg-white/5 px-2 py-1 font-grotesk font-semibold text-[11px] text-[var(--v8-muted)] sm:flex">
            {isMac ? "⌘" : "Ctrl"} K
          </kbd>
        </div>
      </form>

      {open && results.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] text-left shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          <ul role="listbox" id={`${id}-list`} aria-label="Matching tools">
            {results.map((t, i) => (
              <li
                key={t.id}
                role="option"
                id={`${id}-option-${t.id}`}
                aria-selected={i === activeIndex}
                className="border-b border-[var(--v8-line)] last:border-b-0"
              >
                <Link
                  href={`/${t.category}/${t.id}`}
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
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--v8-accent)]" />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/tools"
            className="block bg-[var(--v8-accent)] px-5 py-3 text-center text-sm font-semibold text-[var(--v8-bg)] transition-colors hover:bg-[var(--v8-highlight)]"
          >
            Browse all 145 tools →
          </Link>
        </div>
      )}
      {open && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] px-5 py-4 text-left text-sm text-[var(--v8-muted)] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          No tool matches “{query.trim()}” yet —{" "}
          <Link href="/tools" className="font-semibold text-[var(--v8-accent)]">
            browse all tools
          </Link>
          .
        </div>
      )}

      {/* One-tap popular chips */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-grotesk font-semibold text-[11px] uppercase tracking-[0.2em] text-[var(--v8-muted)]">
          Popular
        </span>
        {SEARCH_CHIPS.map((chipId) => {
          const tool = TOOL_MAP[chipId];
          if (!tool) return null;
          return (
            <Link
              key={chipId}
              href={`/${tool.category}/${tool.id}`}
              className="rounded-full border border-[var(--v8-line-strong)] bg-white/[0.03] px-4 py-2 text-sm font-medium text-[var(--v8-text)]/85 transition-colors duration-200 hover:border-[var(--v8-accent)] hover:bg-[var(--v8-accent)] hover:text-[var(--v8-bg)]"
            >
              {tool.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
});
