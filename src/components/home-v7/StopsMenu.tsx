"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { CheckeredFlag } from "./Topo";
import { DETOUR_IDS, STOPS, type Stop } from "./routeData";
import { TOOL_MAP } from "@/data/tools";

/**
 * Stops menu — full-screen overlay, adapted from Expedia's States
 * menu. Huge condensed list of the ten stops (current stop in
 * vermillion), STOPS / DETOURS toggle — detours are the ten
 * most-used tools. Bottom: mini route-progress line with
 * checkered flags.
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
      className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[#fdf6e3]"
      role="dialog"
      aria-modal="true"
      aria-label="Stops and detours along Route 145"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-6 sm:px-8">
        <p className="font-antonio text-2xl font-bold uppercase tracking-wide text-[#2a2118]">
          Route <span className="text-[#ff4d00]">145</span>
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#2a2118] bg-white text-[#2a2118] transition-colors hover:border-[#ff4d00] hover:text-[#ff4d00]"
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
                ? "bg-[#ff4d00] text-white"
                : "border-2 border-[#2a2118]/25 bg-white text-[#2a2118]/70 hover:border-[#ff4d00] hover:text-[#ff4d00]"
            }`}
            aria-pressed={tab === t}
          >
            {t === "stops" ? "Stops — 10" : "Detours — 10"}
          </button>
        ))}
      </div>

      {tab === "stops" ? (
        <nav aria-label="Stops" className="mx-auto mt-6 w-full max-w-7xl flex-1 px-5 pb-10 sm:px-8">
          <p className="font-caveat text-4xl text-[#ff4d00]">States of the road</p>
          <ul className="mt-2">
            {STOPS.map((stop) => {
              const isCurrent = currentStop === stop.slug;
              const stamped = stamps.includes(stop.slug);
              return (
                <li key={stop.slug} className="border-b-2 border-[#2a2118]/12">
                  <button
                    type="button"
                    onClick={() => onPick(stop)}
                    className="group flex w-full items-baseline gap-4 py-4 text-left sm:gap-6 sm:py-5"
                  >
                    <span
                      className={`font-grotesk text-sm font-bold ${
                        isCurrent ? "text-[#ff4d00]" : "text-[#2a2118]/40"
                      }`}
                    >
                      {String(stop.index).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-antonio text-[clamp(1.9rem,6vw,4.2rem)] font-bold uppercase leading-none transition-colors ${
                        isCurrent
                          ? "text-[#ff4d00]"
                          : "text-[#2a2118] group-hover:text-[#ff4d00]"
                      }`}
                    >
                      {stop.name}
                    </span>
                    <span className="ml-auto hidden shrink-0 items-center gap-3 sm:flex">
                      <span className="font-caveat text-2xl text-[#2a2118]/55">
                        {stop.nickname}
                      </span>
                      <span className="font-grotesk text-xs font-bold uppercase tracking-[0.16em] text-[#2a2118]/50">
                        {stop.count} tools
                      </span>
                      {stamped && (
                        <span className="rounded-full bg-[#ff4d00] px-2.5 py-1 font-grotesk text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                          Stamped ✓
                        </span>
                      )}
                      <ArrowUpRight className="h-5 w-5 text-[#2a2118]/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#ff4d00]" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : (
        <nav aria-label="Detours" className="mx-auto mt-6 w-full max-w-7xl flex-1 px-5 pb-10 sm:px-8">
          <p className="font-caveat text-4xl text-[#ff4d00]">
            Worth pulling over for
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {detours.map((tool, i) => (
              <li key={tool.id}>
                <a
                  href={`/${tool.category}/${tool.id}`}
                  className="group flex items-center gap-4 rounded-2xl border-2 border-[#2a2118]/15 bg-white px-5 py-4 transition-colors hover:border-[#ff4d00]"
                >
                  <span className="font-antonio text-2xl font-bold text-[#ff4d00]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-grotesk text-base font-bold text-[#2a2118]">
                      {tool.title}
                    </span>
                    <span className="block truncate text-sm text-[#2a2118]/60">
                      {tool.description}
                    </span>
                  </span>
                  <ArrowUpRight className="ml-auto h-5 w-5 shrink-0 text-[#2a2118]/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#ff4d00]" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Mini route progress */}
      <div className="mx-auto w-full max-w-7xl px-5 pb-8 sm:px-8">
        <div className="flex items-center gap-3 border-t-2 border-[#2a2118] pt-5">
          <CheckeredFlag width={28} />
          <div className="relative h-0 flex-1 border-t-[3px] border-dotted border-[#2a2118]/25">
            <div
              className="absolute -top-[3px] left-0 h-0 border-t-[3px] border-dotted border-[#ff4d00]"
              style={{ width: `${(stamps.length / 10) * 100}%` }}
            />
          </div>
          <CheckeredFlag width={28} />
          <span className="font-grotesk text-xs font-bold uppercase tracking-[0.18em] text-[#2a2118]/60">
            Passport {stamps.length}/10
          </span>
        </div>
      </div>
    </div>
  );
}
