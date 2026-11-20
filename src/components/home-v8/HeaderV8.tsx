"use client";

import Link from "next/link";
import { List, Search, Stamp } from "lucide-react";
import { RouteShield } from "./Topo";

/**
 * Fixed top bar — the one piece of chrome that is always on
 * screen, so the journey never hides the tools. Dark glass
 * (works over the 3D hero and every section alike): wordmark
 * left, ROUTE 145 centre, STOPS menu + passport counter +
 * search trigger right. z-50 sits above the loading ritual
 * (z-40) on purpose. Reimplemented from the V7 system.
 */
export function HeaderV8({
  stamps,
  onOpenMenu,
  onOpenPassport,
  onFocusSearch,
}: {
  stamps: number;
  onOpenMenu: () => void;
  onOpenPassport: () => void;
  onFocusSearch: () => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--v8-line)] bg-[var(--v8-bg)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-[68px] sm:px-8">
        <Link
          href="#hero"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="BuiltByUmer — back to the top"
        >
          <RouteShield width={30} />
          <span className="font-anta text-xl tracking-wide text-[var(--v8-text)]">
            Built<span className="text-[var(--v8-accent)]">ByUmer</span>
          </span>
        </Link>

        <p className="hidden font-grotesk text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--v8-muted)] md:block">
          Route <span className="text-[var(--v8-accent)]">145</span> — 145
          tools · 10 stops · One road
        </p>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--v8-line-strong)] bg-white/[0.03] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--v8-text)] transition-colors hover:border-[var(--v8-accent)] hover:text-[var(--v8-highlight)]"
            aria-label="Open the stops menu"
          >
            <List className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Stops</span>
          </button>
          <button
            type="button"
            onClick={onOpenPassport}
            className="v8-btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors"
            aria-label={`Open your route passport, ${stamps} of 10 stamps collected`}
          >
            <Stamp className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Passport</span>
            <span className="rounded-full bg-black/25 px-2 py-0.5">
              {stamps}/10
            </span>
          </button>
          <button
            type="button"
            onClick={onFocusSearch}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--v8-line-strong)] bg-white/[0.03] text-[var(--v8-text)] transition-colors hover:border-[var(--v8-accent)] hover:text-[var(--v8-highlight)]"
            aria-label="Search tools (Ctrl+K)"
          >
            <Search className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
