"use client";

import { useEffect, useRef, useState } from "react";
import { CheckeredFlag, TopoDefs, VehicleIcon } from "./Topo";
import { STOPS, type Stop, type VehicleKind } from "./routeData";

/**
 * Hub map — the home, one viewport. An illustrated SVG topo map
 * with one drawn road from START to DONE, ten pins (the categories
 * as towns), and a small vehicle that travels the road as you
 * scroll the journey. Pins are real buttons: clicking one jumps
 * straight to that stop and earns its passport stamp.
 *
 * Deliberately SVG, not WebGL — Expedia's own 3D diorama choked
 * on the page; the SVG map delivers the same mechanic lighter
 * and faster. The vehicle and the travelled line are written
 * straight to the DOM (no React re-renders on scroll).
 */

const ROAD_D =
  "M 60 620 C 220 600, 260 480, 420 470 C 580 460, 600 600, 760 580 C 920 560, 940 420, 1060 380 C 1100 365, 1130 350, 1160 330";

/** Rough pin spots along the road, used before the path is measured. */
const FALLBACK_PINS: Array<{ x: number; y: number }> = [
  { x: 70, y: 620 },
  { x: 250, y: 545 },
  { x: 395, y: 478 },
  { x: 555, y: 495 },
  { x: 700, y: 560 },
  { x: 850, y: 545 },
  { x: 975, y: 470 },
  { x: 1055, y: 392 },
  { x: 1120, y: 352 },
  { x: 1155, y: 330 },
];

export function HubMap({
  vehicle,
  reducedMotion,
  onPinClick,
  onOpenVehicle,
}: {
  vehicle: VehicleKind;
  reducedMotion: boolean;
  onPinClick: (stop: Stop) => void;
  onOpenVehicle: () => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const travelledRef = useRef<SVGPathElement>(null);
  const vehicleRef = useRef<SVGGElement>(null);
  const [pins, setPins] = useState(FALLBACK_PINS);

  // Measure the road once mounted; place pins exactly on it.
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const L = path.getTotalLength();
    setPins(
      STOPS.map((s) => {
        const pt = path.getPointAtLength(s.pinT * L);
        return { x: pt.x, y: pt.y };
      }),
    );
  }, []);

  // Scroll drives the vehicle + the travelled line, from the hub
  // down to the last stop. Written straight to the DOM.
  useEffect(() => {
    if (reducedMotion) return;
    const path = pathRef.current;
    const travelled = travelledRef.current;
    const vehicleEl = vehicleRef.current;
    const section = sectionRef.current;
    if (!path || !travelled || !vehicleEl || !section) return;
    const L = path.getTotalLength();
    travelled.style.strokeDasharray = `${L}`;
    let raf = 0;
    let queued = false;
    const update = () => {
      queued = false;
      const last = document.getElementById("stop-productivity-tools");
      const start = section.offsetTop;
      const end = last
        ? last.offsetTop + last.offsetHeight
        : start + window.innerHeight * 6;
      const p = Math.max(
        0,
        Math.min(
          1,
          (window.scrollY + window.innerHeight * 0.5 - start) /
            Math.max(1, end - start),
        ),
      );
      const pt = path.getPointAtLength(p * L);
      const ahead = path.getPointAtLength(Math.min(L, p * L + 2));
      const angle =
        (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
      vehicleEl.setAttribute(
        "transform",
        `translate(${pt.x} ${pt.y}) rotate(${angle})`,
      );
      travelled.style.strokeDashoffset = `${L * (1 - p)}`;
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reducedMotion]);

  return (
    <section
      id="map"
      ref={sectionRef}
      className="relative flex min-h-svh flex-col overflow-hidden bg-[#fdf6e3] pb-10 pt-24"
      aria-label="Route 145 map — pick a town"
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <TopoDefs id="v7-hub-topo" />
        <rect width="100%" height="100%" fill="url(#v7-hub-topo)" />
      </svg>

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-[#2a2118] pb-4">
          <div>
            <p className="v7-eyebrow">Stop 00 — The map</p>
            <h2 className="mt-2 font-antonio text-4xl font-bold uppercase leading-none text-[#2a2118] sm:text-6xl">
              Pick a town. <span className="text-[#ff4d00]">Any town.</span>
            </h2>
          </div>
          <p className="max-w-xs font-caveat text-2xl leading-tight text-[#2a2118]/70">
            Ten stops, one road — tap a pin and drive straight there.
          </p>
        </div>
      </div>

      {/* The map */}
      <div className="relative mx-auto mt-6 w-full max-w-7xl flex-1 px-2 sm:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border-2 border-[#2a2118] bg-[#f6efdb] shadow-[0_24px_60px_rgba(42,33,24,0.14)]">
          <svg
            viewBox="0 0 1200 720"
            className="block h-auto w-full"
            role="img"
            aria-label="Illustrated map of Route 145 with ten town pins"
          >
            <TopoDefs id="v7-map-topo" />
            <rect width="1200" height="720" fill="url(#v7-map-topo)" />
            {/* Soft land blobs */}
            <ellipse cx="300" cy="180" rx="260" ry="120" fill="#e9dfc4" opacity="0.7" />
            <ellipse cx="950" cy="560" rx="280" ry="130" fill="#e9dfc4" opacity="0.7" />
            {/* The road */}
            <path
              d={ROAD_D}
              fill="none"
              stroke="#2a2118"
              strokeWidth="16"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path
              d={ROAD_D}
              fill="none"
              stroke="#fdf6e3"
              strokeWidth="2.5"
              strokeDasharray="14 12"
              strokeLinecap="round"
            />
            {/* Travelled stretch, drawn by scroll */}
            <path
              ref={travelledRef}
              d={ROAD_D}
              fill="none"
              stroke="#ff4d00"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.95"
            />
            <path ref={pathRef} d={ROAD_D} fill="none" stroke="none" />
            {/* The vehicle (positioned imperatively) */}
            <g ref={vehicleRef} transform="translate(70 620)">
              <svg x={-34} y={-19} width={68} height={38} overflow="visible">
                <VehicleIcon kind={vehicle} width={68} />
              </svg>
            </g>
          </svg>

          {/* START / DONE flags */}
          <div className="absolute left-[3%] top-[78%] flex flex-col items-center gap-1">
            <CheckeredFlag width={30} />
            <span className="rounded-full bg-[#2a2118] px-2.5 py-1 font-grotesk text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              Start
            </span>
          </div>
          <div className="absolute right-[2%] top-[38%] flex flex-col items-center gap-1">
            <CheckeredFlag width={30} />
            <span className="rounded-full bg-[#ff4d00] px-2.5 py-1 font-grotesk text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              Done
            </span>
          </div>

          {/* Town pins */}
          {STOPS.map((stop, i) => {
            const pos = pins[i] ?? FALLBACK_PINS[i];
            return (
              <button
                key={stop.slug}
                type="button"
                onClick={() => onPinClick(stop)}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(pos.x / 1200) * 100}%`,
                  top: `${(pos.y / 720) * 100}%`,
                }}
                aria-label={`Stop ${stop.index}: ${stop.name} — ${stop.count} tools`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#2a2118] bg-[#ff4d00] font-antonio text-sm font-bold text-white shadow-[0_6px_16px_rgba(42,33,24,0.35)] transition-transform duration-200 group-hover:scale-125 sm:h-10 sm:w-10 sm:text-base">
                  {stop.index}
                </span>
                <span className="pointer-events-none absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2a2118] px-3 py-1 font-grotesk text-[11px] font-bold uppercase tracking-[0.14em] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:block">
                  {stop.name} · {stop.count}
                </span>
              </button>
            );
          })}

          {/* Swap vehicle */}
          <button
            type="button"
            onClick={onOpenVehicle}
            className="absolute bottom-4 right-4 rounded-full border-2 border-[#2a2118] bg-white px-4 py-2.5 font-grotesk text-[11px] font-bold uppercase tracking-[0.16em] text-[#2a2118] shadow-[0_8px_20px_rgba(42,33,24,0.18)] transition-colors hover:border-[#ff4d00] hover:text-[#ff4d00]"
          >
            Swap vehicle ↗
          </button>
        </div>

        <p className="mt-4 flex items-center justify-between">
          <span className="font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2a2118]/50">
            Fig. 01 — The whole road, at a glance
          </span>
          <span className="font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff4d00]">
            Scroll — the car follows you
          </span>
        </p>
      </div>
    </section>
  );
}
