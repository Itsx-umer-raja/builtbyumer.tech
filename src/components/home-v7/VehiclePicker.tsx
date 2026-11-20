"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { VehicleIcon } from "./Topo";
import { VEHICLES, type VehicleKind } from "./routeData";

/**
 * Choose your ride — Expedia's SWAP VEHICLE sheet, adapted.
 * Three simple SVG vehicles; the chosen one travels the map road
 * and the drive outro, and persists in localStorage.
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
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#2a2118]/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Choose your ride"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-[2rem] border-2 border-[#2a2118] bg-[#fdf6e3] p-6 sm:rounded-[2rem] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="v7-eyebrow">Swap vehicle</p>
            <h2 className="mt-2 font-antonio text-4xl font-bold uppercase leading-none text-[#2a2118]">
              Choose your ride
            </h2>
            <p className="mt-2 font-caveat text-2xl text-[#2a2118]/70">
              It follows you down the whole road.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#2a2118] bg-white text-[#2a2118] transition-colors hover:border-[#ff4d00] hover:text-[#ff4d00]"
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
                  className={`flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-colors ${
                    selected
                      ? "border-[#ff4d00] bg-[#ff4d00]/10"
                      : "border-[#2a2118]/12 bg-white hover:border-[#ff4d00]"
                  }`}
                  aria-pressed={selected}
                >
                  <VehicleIcon kind={v.kind} width={76} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-grotesk text-base font-bold text-[#2a2118]">
                      {v.label}
                    </span>
                    <span className="block font-caveat text-xl leading-tight text-[#2a2118]/60">
                      {v.blurb}
                    </span>
                  </span>
                  {selected && (
                    <span className="shrink-0 rounded-full bg-[#ff4d00] px-2.5 py-1 font-grotesk text-[10px] font-bold uppercase tracking-[0.14em] text-white">
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
