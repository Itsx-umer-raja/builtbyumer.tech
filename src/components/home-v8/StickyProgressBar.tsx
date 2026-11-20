"use client";

import { ArrowUpRight } from "lucide-react";
import { RouteShield } from "./Topo";

/**
 * Sticky progress bar — appears once you have scrolled past
 * the hero, adapted from Expedia's "EXPLORING ILLINOIS" bar
 * and restyled into the V8 dark system. Left: where you are on
 * the route. Centre: the MAP — WORLDS — DIRECTORY rail with a
 * filling dot. Right: START USING, which focuses the search.
 * Fixed, so it never traps scroll; it hides again near the top
 * of the page. Reimplemented from the V7 system.
 */
export function StickyProgressBar({
  visible,
  currentLabel,
  progress,
  onFocusSearch,
}: {
  visible: boolean;
  currentLabel: string;
  progress: number; // 0..1 overall scroll progress
  onFocusSearch: () => void;
}) {
  return (
    <div
      className={`fixed inset-x-0 top-16 z-40 transition-transform duration-300 sm:top-[68px] ${
        visible ? "translate-y-0" : "-translate-y-[120%]"
      }`}
      aria-hidden={!visible}
    >
      <div className="border-b border-[var(--v8-line)] bg-[var(--v8-bg)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-4 px-4 sm:px-8">
          <span className="flex min-w-0 items-center gap-2.5">
            <RouteShield width={22} />
            <span className="truncate font-grotesk text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--v8-muted)]">
              Exploring —{" "}
              <span className="text-[var(--v8-accent)]">{currentLabel}</span>
            </span>
          </span>

          {/* MAP — WORLDS — DIRECTORY rail */}
          <span className="relative mx-auto hidden flex-1 items-center md:flex">
            <span className="flex w-full items-center justify-between font-grotesk text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--v8-muted)]">
              <span>Map</span>
              <span>Worlds</span>
              <span>Directory</span>
            </span>
            <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded bg-white/10">
              <span
                className="block h-full rounded bg-[var(--v8-accent)] transition-[width] duration-150"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </span>
            <span
              className="absolute -bottom-[7px] h-[11px] w-[11px] -translate-x-1/2 rounded-full border-2 border-[var(--v8-bg)] bg-[var(--v8-accent)] transition-[left] duration-150"
              style={{ left: `${Math.round(progress * 100)}%` }}
            />
          </span>

          <button
            type="button"
            onClick={onFocusSearch}
            tabIndex={visible ? 0 : -1}
            className="v8-btn-primary ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors md:ml-0"
          >
            Start using
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
