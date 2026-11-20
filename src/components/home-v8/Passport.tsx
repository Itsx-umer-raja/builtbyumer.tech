"use client";

import { useEffect } from "react";
import { Stamp, X } from "lucide-react";
import { STOPS } from "./routeData";

/**
 * Route passport — Expedia's keychain collection, adapted and
 * restyled into the V8 dark system. The counter (0/10) reflects
 * real clicks only: a stamp is earned by opening a stop (pin,
 * menu item, or category link). Stamps live in localStorage and
 * persist across reloads. Client-only and SSR-safe: the dialog
 * renders only when opened. Reimplemented from the V7 system.
 */
export function PassportDialog({
  open,
  stamps,
  onClose,
  onStartUsing,
  onPick,
}: {
  open: boolean;
  stamps: string[];
  onClose: () => void;
  onStartUsing: () => void;
  onPick: (slug: string) => void;
}) {
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

  const pct = stamps.length / 10;
  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Your Route 145 passport"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] p-6 sm:rounded-[2rem] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="v8-eyebrow">Collect them all</p>
            <h2 className="mt-2 font-anta text-4xl leading-none text-[var(--v8-text)]">
              Route passport
            </h2>
            <p className="mt-2 font-grotesk text-2xl italic text-[var(--v8-muted)]">
              Open a stop, earn its stamp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--v8-line-strong)] bg-white/[0.03] text-[var(--v8-text)] transition-colors hover:border-[var(--v8-accent)] hover:text-[var(--v8-highlight)]"
            aria-label="Close passport"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress ring */}
        <div className="mt-6 flex items-center gap-5">
          <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden>
            <circle cx="44" cy="44" r={R} fill="none" stroke="#f5f6ff" strokeOpacity="0.15" strokeWidth="7" />
            <circle
              cx="44"
              cy="44"
              r={R}
              fill="none"
              stroke="#8b7cff"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              transform="rotate(-90 44 44)"
            />
            <text
              x="44"
              y="50"
              textAnchor="middle"
              fontFamily="Anta, sans-serif"
              fontSize="20"
              fill="#f5f6ff"
            >
              {stamps.length}/10
            </text>
          </svg>
          <p className="text-sm leading-relaxed text-[var(--v8-muted)]">
            {stamps.length === 0
              ? "No stamps yet — tap any pin on the map to start your collection."
              : stamps.length === 10
                ? "The whole road, stamped. You drove every stop on Route 145."
                : `${stamps.length} of 10 stops stamped. ${10 - stamps.length} more to go — the road is waiting.`}
          </p>
        </div>

        <ul className="mt-6 space-y-2">
          {STOPS.map((stop) => {
            const stamped = stamps.includes(stop.slug);
            return (
              <li key={stop.slug}>
                <button
                  type="button"
                  onClick={() => onPick(stop.slug)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                    stamped
                      ? "border-[var(--v8-accent)] bg-[var(--v8-accent)]/10"
                      : "border-[var(--v8-line)] bg-white/[0.03] opacity-60 hover:opacity-100"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-anta text-sm ${
                      stamped
                        ? "bg-[var(--v8-accent)] text-[var(--v8-bg)]"
                        : "bg-white/10 text-[var(--v8-muted)]"
                    }`}
                  >
                    {stamped ? <Stamp className="h-4 w-4" /> : stop.index}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-grotesk text-sm font-bold text-[var(--v8-text)]">
                      {stop.name}
                    </span>
                    <span className="block truncate font-grotesk text-lg italic leading-tight text-[var(--v8-muted)]">
                      {stop.nickname}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 font-grotesk text-[10px] font-bold uppercase tracking-[0.14em] ${
                      stamped ? "text-[var(--v8-accent)]" : "text-[var(--v8-muted)]"
                    }`}
                  >
                    {stamped ? "Stamped ✓" : `${stop.count} tools`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={onStartUsing}
          className="v8-btn-primary mt-6 w-full rounded-full py-3.5 text-sm font-bold uppercase tracking-[0.14em] transition-colors"
        >
          Start using ↗
        </button>
      </div>
    </div>
  );
}
