"use client";

import Link from "next/link";
import { List, Search, Stamp } from "lucide-react";
import { RouteShield } from "./Topo";

/**
 * Fixed top bar — the one piece of chrome that is always on screen,
 * so the journey never hides the tools. Cream bar (works over the
 * dark gate and the cream map alike): wordmark left, ROUTE 145
 * centre, STOPS menu + passport counter + search trigger right.
 * z-50 sits above the loading ritual (z-40) on purpose.
 */
export function HeaderV7({
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
    <header className="fixed inset-x-0 top-0 z-50 border-b-2 border-[#2a2118] bg-[#fdf6e3]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-[68px] sm:px-8">
        <Link
          href="#gate"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="BuiltByUmer — back to the gate"
        >
          <RouteShield width={30} />
          <span className="font-antonio text-xl font-bold tracking-wide text-[#2a2118]">
            Built<span className="text-[#ff4d00]">ByUmer</span>
          </span>
        </Link>

        <p className="hidden font-grotesk text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2a2118]/60 md:block">
          Route <span className="text-[#ff4d00]">145</span> — 145 tools · 10
          stops · One road
        </p>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#2a2118] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#2a2118] transition-colors hover:border-[#ff4d00] hover:text-[#ff4d00]"
            aria-label="Open the stops menu"
          >
            <List className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Stops</span>
          </button>
          <button
            type="button"
            onClick={onOpenPassport}
            className="inline-flex items-center gap-2 rounded-full bg-[#ff4d00] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#e04400]"
            aria-label={`Open your route passport, ${stamps} of 10 stamps collected`}
          >
            <Stamp className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Passport</span>
            <span className="rounded-full bg-white/25 px-2 py-0.5">
              {stamps}/10
            </span>
          </button>
          <button
            type="button"
            onClick={onFocusSearch}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#2a2118] bg-white text-[#2a2118] transition-colors hover:border-[#ff4d00] hover:text-[#ff4d00]"
            aria-label="Search tools (Ctrl+K)"
          >
            <Search className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
