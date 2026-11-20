"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { CheckeredFlag } from "./Topo";
import { DETOUR_IDS, STOPS, type Stop } from "./routeData";
import { TOOL_MAP } from "@/data/tools";

/**
 * Stops menu — full-screen overlay, adapted from Expedia's
 * States menu and restyled into the V8 dark system. Huge list
 * of the ten stops (current stop in violet), STOPS / DETOURS
 * toggle — detours are the ten most-used tools. Bottom: mini
 * route-progress line with checkered flags.
 * Reimplemented from the V7 system.
 */
export function StopsMenu({
  open,
  currentStop,
  stamps,
  onClose,
  onPick,
}: {
  open: boolean;
  currentStop: string | null;
  stamps: string[];
  onClose: () => void;
  onPick: (stop: Stop) => void;
}) {
  const [tab, setTab] = useState<"stops" | "detours">("stops");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const detours = DETOUR_IDS.map((id) => TOOL_MAP[id]).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[var(--v8-bg)]"
      role="dialog"
      aria-modal="true"
      aria-label="Stops and detours along Route 145"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-6 sm:px-8">
        <p className="font-anta text-2xl tracking-wide text-[var(--v8-text)]">
          Route <span className="text-[var(--v8-accent)]">145</span>
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--v8-line-strong)] bg-white/[0.03] text-[var(--v8-text)] transition-colors hover:border-[var(--v8-accent)] hover:text-[var(--v8-highlight)]"
          aria-label="Close the stops menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* STOPS / DETOURS toggle */}
      <div className="mx-auto mt-8 flex w-full max-w-7xl gap-3 px-5 sm:px-8">
        {(["stops", "detours"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-6 py-2.5 font-grotesk text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
              tab === t
                ? "bg-[var(--v8-accent)] text-[var(--v8-bg)]"
                : "border border-[var(--v8-line-strong)] bg-white/[0.03] text-[var(--v8-muted)] hover:border-[var(--v8-accent)] hover:text-[var(--v8-highlight)]"
            }`}
            aria-pressed={tab === t}
          >
            {t === "stops" ? "Stops — 10" : "Detours — 10"}
          </button>
        ))}
      </div>

      {tab === "stops" ? (
        <nav aria-label="Stops" className="mx-auto mt-6 w-full max-w-7xl flex-1 px-5 pb-10 sm:px-8">
          <p className="font-grotesk text-3xl italic text-[var(--v8-accent)]">
            States of the road
          </p>
          <ul className="mt-2">
            {STOPS.map((stop) => {
              const isCurrent = currentStop === stop.slug;
              const stamped = stamps.includes(stop.slug);
              return (
                <li key={stop.slug} className="border-b border-[var(--v8-line)]">
                  <button
                    type="button"
                    onClick={() => onPick(stop)}
                    className="group flex w-full items-baseline gap-4 py-4 text-left sm:gap-6 sm:py-5"
                  >
                    <span
                      className={`font-grotesk text-sm font-bold ${
                        isCurrent ? "text-[var(--v8-accent)]" : "text-[var(--v8-muted)]"
                      }`}
                    >
                      {String(stop.index).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-anta text-[clamp(1.9rem,6vw,4.2rem)] leading-none transition-colors ${
                        isCurrent
                          ? "text-[var(--v8-accent)]"
                          : "text-[var(--v8-text)] group-hover:text-[var(--v8-accent)]"
                      }`}
                    >
                      {stop.name}
                    </span>
                    <span className="ml-auto hidden shrink-0 items-center gap-3 sm:flex">
                      <span className="font-grotesk text-xl italic text-[var(--v8-muted)]">
                        {stop.nickname}
                      </span>
                      <span className="font-grotesk text-xs font-bold uppercase tracking-[0.16em] text-[var(--v8-muted)]">
                        {stop.count} tools
                      </span>
                      {stamped && (
                        <span className="rounded-full bg-[var(--v8-accent)] px-2.5 py-1 font-grotesk text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--v8-bg)]">
                          Stamped ✓
                        </span>
                      )}
                      <ArrowUpRight className="h-5 w-5 text-[var(--v8-muted)] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--v8-accent)]" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : (
        <nav aria-label="Detours" className="mx-auto mt-6 w-full max-w-7xl flex-1 px-5 pb-10 sm:px-8">
          <p className="font-grotesk text-3xl italic text-[var(--v8-accent)]">
            Worth pulling over for
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {detours.map((tool, i) => (
              <li key={tool.id}>
                <a
                  href={`/${tool.category}/${tool.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-[var(--v8-line)] bg-white/[0.03] px-5 py-4 transition-colors hover:border-[var(--v8-accent)]"
                >
                  <span className="font-anta text-2xl text-[var(--v8-accent)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-grotesk text-base font-bold text-[var(--v8-text)]">
                      {tool.title}
                    </span>
                    <span className="block truncate text-sm text-[var(--v8-muted)]">
                      {tool.description}
                    </span>
                  </span>
                  <ArrowUpRight className="ml-auto h-5 w-5 shrink-0 text-[var(--v8-muted)] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--v8-accent)]" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Mini route progress */}
      <div className="mx-auto w-full max-w-7xl px-5 pb-8 sm:px-8">
        <div className="flex items-center gap-3 border-t border-[var(--v8-line)] pt-5">
          <CheckeredFlag width={28} />
          <div className="relative h-0 flex-1 border-t-[3px] border-dotted border-white/20">
            <div
              className="absolute -top-[3px] left-0 h-0 border-t-[3px] border-dotted border-[var(--v8-accent)]"
              style={{ width: `${(stamps.length / 10) * 100}%` }}
            />
          </div>
          <CheckeredFlag width={28} />
          <span className="font-grotesk text-xs font-bold uppercase tracking-[0.18em] text-[var(--v8-muted)]">
            Passport {stamps.length}/10
          </span>
        </div>
      </div>
    </div>
  );
}
