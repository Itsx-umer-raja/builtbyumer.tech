"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckeredFlag, TopoDefs, VehicleIcon } from "./Topo";
import { STOPS, type VehicleKind } from "./routeData";

gsap.registerPlugin(ScrollTrigger);

/**
 * Drive outro — Expedia's 3D drive, rebuilt light. A scroll-driven
 * SVG section: as the section travels through the viewport the
 * vehicle drives the full road past all ten stops and the route
 * line draws itself. Scroll = progress, no pinning, no WebGL, no
 * scroll-jacking — the section scrolls normally and releases
 * cleanly. Reduced motion: the vehicle sits at DONE with the
 * line fully drawn.
 */

const ROAD_D =
  "M 40 210 C 220 140, 340 250, 520 180 S 820 130, 980 190 S 1140 150, 1160 160";

const FALLBACK_DOTS: Array<{ x: number; y: number }> = [
  { x: 40, y: 210 },
  { x: 190, y: 165 },
  { x: 330, y: 215 },
  { x: 470, y: 185 },
  { x: 600, y: 160 },
  { x: 730, y: 150 },
  { x: 860, y: 165 },
  { x: 980, y: 188 },
  { x: 1090, y: 165 },
  { x: 1160, y: 160 },
];

export function DriveOutro({
  vehicle,
  reducedMotion,
  onStartUsing,
}: {
  vehicle: VehicleKind;
  reducedMotion: boolean;
  onStartUsing: () => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const travelledRef = useRef<SVGPathElement>(null);
  const vehicleRef = useRef<SVGGElement>(null);
  const [dots, setDots] = useState(FALLBACK_DOTS);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const L = path.getTotalLength();
    setDots(
      STOPS.map((s) => {
        const pt = path.getPointAtLength(s.pinT * L);
        return { x: pt.x, y: pt.y };
      }),
    );
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const path = pathRef.current;
    const travelled = travelledRef.current;
    const vehicleEl = vehicleRef.current;
    if (!section || !path || !travelled || !vehicleEl) return;
    const L = path.getTotalLength();
    travelled.style.strokeDasharray = `${L}`;
    const apply = (p: number) => {
      const pt = path.getPointAtLength(Math.max(0, Math.min(1, p)) * L);
      const ahead = path.getPointAtLength(Math.min(L, p * L + 2));
      const angle =
        (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
      vehicleEl.setAttribute(
        "transform",
        `translate(${pt.x} ${pt.y}) rotate(${angle})`,
      );
      travelled.style.strokeDashoffset = `${L * (1 - Math.max(0, Math.min(1, p)))}`;
    };
    if (reducedMotion) {
      apply(1);
      return;
    }
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.4,
      onUpdate: (self) => apply(self.progress),
    });
    apply(0);
    return () => {
      st.kill();
    };
  }, [reducedMotion]);

  return (
    <section
      id="outro"
      ref={sectionRef}
      className="v7-topo-bg relative overflow-hidden bg-[#fdf6e3] py-16 sm:py-24"
      aria-label="Drive the whole road"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="v7-reveal text-center">
          <p className="v7-eyebrow">The long way home</p>
          <p className="mt-3 font-caveat text-4xl text-[#ff4d00] sm:text-5xl">
            You drove the whole road
          </p>
          <h2 className="mx-auto mt-1 max-w-4xl font-antonio text-[clamp(2.6rem,8vw,5.5rem)] font-bold uppercase leading-[0.95] text-[#2a2118]">
            Ten stops. One road. Zero uploads.
          </h2>
        </div>

        {/* The road, driven by scroll */}
        <div className="relative mt-10 overflow-hidden rounded-[2rem] border-2 border-[#2a2118] bg-[#f6efdb] shadow-[0_24px_60px_rgba(42,33,24,0.14)]">
          <svg
            viewBox="0 0 1200 300"
            className="block h-auto w-full"
            role="img"
            aria-label="The full Route 145 road with all ten stops"
          >
            <TopoDefs id="v7-outro-topo" />
            <rect width="1200" height="300" fill="url(#v7-outro-topo)" />
            <path
              d={ROAD_D}
              fill="none"
              stroke="#2a2118"
              strokeWidth="14"
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
            {dots.map((d, i) => (
              <g key={STOPS[i].slug}>
                <circle
                  cx={d.x}
                  cy={d.y}
                  r="11"
                  fill="#fdf6e3"
                  stroke="#2a2118"
                  strokeWidth="2.5"
                />
                <text
                  x={d.x}
                  y={d.y + 4.5}
                  textAnchor="middle"
                  fontFamily="Antonio, sans-serif"
                  fontSize="11"
                  fontWeight="700"
                  fill="#ff4d00"
                >
                  {i + 1}
                </text>
              </g>
            ))}
            <g ref={vehicleRef} transform="translate(40 210)">
              <svg x={-34} y={-19} width={68} height={38} overflow="visible">
                <VehicleIcon kind={vehicle} width={68} />
              </svg>
            </g>
          </svg>
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <CheckeredFlag width={26} />
            <span className="rounded-full bg-[#2a2118] px-2.5 py-1 font-grotesk text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              Start
            </span>
          </div>
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <span className="rounded-full bg-[#ff4d00] px-2.5 py-1 font-grotesk text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              Done
            </span>
            <CheckeredFlag width={26} />
          </div>
        </div>

        <div className="v7-reveal mt-8 text-center">
          <p className="mx-auto max-w-xl text-base leading-relaxed text-[#2a2118]/70">
            That was the whole road — every stop, every tool, still free.
            Pick a stop above, or just search for the tool you need.
          </p>
          <button
            type="button"
            onClick={onStartUsing}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff4d00] px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_12px_40px_rgba(255,77,0,0.4)] transition-colors hover:bg-[#e04400]"
          >
            Start using ↗
          </button>
        </div>
      </div>
    </section>
  );
}
