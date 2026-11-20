"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { VehicleIcon } from "./Topo";
import { VEHICLES, type VehicleKind } from "./routeData";

/**
 * Choose your ride — Expedia's SWAP VEHICLE sheet, adapted and
 * restyled into the V8 dark system. Three simple SVG vehicles;
 * the chosen one travels the map road and persists in
 * localStorage. Reimplemented from the V7 system.
 */
export function VehiclePicker({
  open,
  vehicle,
  onSelect,
  onClose,
}: {
  open: boolean;
  vehicle: VehicleKind;
  onSelect: (kind: VehicleKind) => void;
  onClose: () => void;
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

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Choose your ride"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-[2rem] border border-[var(--v8-line-strong)] bg-[var(--v8-bg-2)] p-6 sm:rounded-[2rem] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="v8-eyebrow">Swap vehicle</p>
            <h2 className="mt-2 font-anta text-4xl leading-none text-[var(--v8-text)]">
              Choose your ride
            </h2>
            <p className="mt-2 font-grotesk text-2xl italic text-[var(--v8-muted)]">
              It follows you down the whole road.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--v8-line-strong)] bg-white/[0.03] text-[var(--v8-text)] transition-colors hover:border-[var(--v8-accent)] hover:text-[var(--v8-highlight)]"
            aria-label="Close vehicle picker"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="mt-6 space-y-3">
          {VEHICLES.map((v) => {
            const selected = vehicle === v.kind;
            return (
              <li key={v.kind}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(v.kind);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-colors ${
                    selected
                      ? "border-[var(--v8-accent)] bg-[var(--v8-accent)]/10"
                      : "border-[var(--v8-line)] bg-white/[0.03] hover:border-[var(--v8-accent)]"
                  }`}
                  aria-pressed={selected}
                >
                  <VehicleIcon kind={v.kind} width={76} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-grotesk text-base font-bold text-[var(--v8-text)]">
                      {v.label}
                    </span>
                    <span className="block font-grotesk text-lg italic leading-tight text-[var(--v8-muted)]">
                      {v.blurb}
                    </span>
                  </span>
                  {selected && (
                    <span className="shrink-0 rounded-full bg-[var(--v8-accent)] px-2.5 py-1 font-grotesk text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--v8-bg)]">
                      Driving ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
