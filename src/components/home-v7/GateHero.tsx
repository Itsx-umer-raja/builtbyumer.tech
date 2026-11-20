"use client";

import { ArrowDown, ChevronsDown } from "lucide-react";
import { Magnetic } from "../home-v2/Magnetic";

/**
 * Gate hero — the curtain, adapted from Expedia's Route 66 gate.
 * Full-screen dusk highway, hand-drawn inline SVG (no stock photo,
 * no fake photo), slow Ken Burns zoom, a vermillion dotted route
 * line drawn across the road. Script "100% free" over giant
 * condensed "ROUTE 145", "10 stops" below. Two entries, both land
 * on the map hub: START YOUR JOURNEY (smooth drive in) and ENTER
 * WITHOUT WAITING (jump straight there).
 */
export function GateHero({
  onEnter,
}: {
  onEnter: (mode: "drive" | "instant") => void;
}) {
  return (
    <section
      id="gate"
      className="relative flex min-h-svh flex-col overflow-hidden bg-[#3a2320]"
      aria-label="Route 145 — the gate"
    >
      {/* Dusk highway — hand-drawn SVG, slow zoom */}
      <div className="v7-kenburns absolute inset-0" aria-hidden>
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="v7-dusk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6c453" />
              <stop offset="38%" stopColor="#e07840" />
              <stop offset="68%" stopColor="#8a4a2e" />
              <stop offset="100%" stopColor="#3a2320" />
            </linearGradient>
            <linearGradient id="v7-road" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a3428" />
              <stop offset="100%" stopColor="#241a14" />
            </linearGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#v7-dusk)" />
          {/* Sun, low over the mesas */}
          <circle cx="720" cy="470" r="86" fill="#fdf6e3" opacity="0.92" />
          <circle cx="720" cy="470" r="130" fill="#fdf6e3" opacity="0.18" />
          {/* Far mesas */}
          <path
            d="M0 560 L120 500 L260 540 L420 470 L560 530 L760 460 L900 530 L1080 480 L1240 540 L1440 500 V900 H0 Z"
            fill="#5b3a28"
            opacity="0.85"
          />
          {/* Near mesas */}
          <path
            d="M0 640 L180 580 L340 630 L520 570 L700 640 L900 590 L1120 650 L1300 600 L1440 640 V900 H0 Z"
            fill="#3a2a1e"
          />
          {/* The road, in perspective */}
          <path d="M660 900 L700 620 L740 620 L780 900 Z" fill="url(#v7-road)" />
          <path
            d="M660 900 L700 620"
            stroke="#ff4d00"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M780 900 L740 620"
            stroke="#ff4d00"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M720 900 L720 630"
            stroke="#fdf6e3"
            strokeWidth="6"
            strokeDasharray="26 22"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* A small vehicle, heading for the horizon */}
          <g transform="translate(706 668) scale(0.55)">
            <path d="M4 30V12a4 4 0 0 1 4-4h38a4 4 0 0 1 4 4v18H4Z" fill="#fdf6e3" />
            <path d="M50 14h10l8 8v8H50V14Z" fill="#fdf6e3" />
            <rect x="4" y="30" width="64" height="3" fill="#ff4d00" />
            <circle cx="18" cy="33" r="5" fill="#fdf6e3" />
            <circle cx="54" cy="33" r="5" fill="#fdf6e3" />
          </g>
          {/* Warm haze over the road */}
          <rect
            width="1440"
            height="900"
            fill="#ff4d00"
            opacity="0.05"
          />
        </svg>
      </div>

      {/* Dotted route line drawn across the scene */}
      <svg
        className="pointer-events-none absolute inset-x-0 top-[58%] hidden h-8 w-full sm:block"
        viewBox="0 0 1440 32"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 16 H1440"
          fill="none"
          stroke="#ff4d00"
          strokeWidth="4"
          strokeDasharray="2 14"
          strokeLinecap="round"
          className="v7-route-draw"
        />
      </svg>

      {/* Copy */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-5 pb-24 pt-28 text-center">
        <p className="v7-eyebrow !text-[#fdf6e3]/80">
          Celebrating the open road — BuiltByUmer
        </p>
        <p className="mt-4 font-caveat text-4xl text-[#fdf6e3] sm:text-5xl">
          100% free
        </p>
        <h1 className="mt-1 font-antonio text-[clamp(4.2rem,17vw,13rem)] font-bold leading-[0.9] tracking-[0.01em] text-[#fdf6e3] drop-shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
          ROUTE 145
        </h1>
        <p className="mt-2 font-caveat text-4xl text-[#fdf6e3] sm:text-5xl">
          10 stops
        </p>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[#fdf6e3]/85 sm:text-lg">
          One road through 145 free tools — from a messy file to a finished
          job, with a stop for everything along the way.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <button
              type="button"
              onClick={() => onEnter("drive")}
              className="group inline-flex items-center gap-2 rounded-full bg-[#ff4d00] px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_12px_40px_rgba(255,77,0,0.45)] transition-colors hover:bg-[#e04400]"
            >
              Start your journey
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </button>
          </Magnetic>
          <Magnetic>
            <button
              type="button"
              onClick={() => onEnter("instant")}
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#fdf6e3]/70 bg-black/20 px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-[#fdf6e3] backdrop-blur transition-colors hover:border-[#fdf6e3] hover:bg-black/30"
            >
              Enter without waiting
            </button>
          </Magnetic>
        </div>
      </div>

      {/* Caption + scroll hint */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-end justify-between px-5 pb-6 sm:px-8">
        <p className="max-w-xs text-left text-xs leading-relaxed text-[#fdf6e3]/70">
          The Mother Road, rebuilt for files — every stop is a real tool,
          every mile is free.
        </p>
        <button
          type="button"
          onClick={() => onEnter("drive")}
          className="flex flex-col items-center gap-1 text-[#fdf6e3]/80 transition-colors hover:text-[#fdf6e3]"
          aria-label="Scroll to explore the route"
        >
          <span className="font-grotesk text-[11px] font-semibold uppercase tracking-[0.22em]">
            Scroll to explore
          </span>
          <ChevronsDown className="v7-bounce h-5 w-5" aria-hidden />
        </button>
      </div>
    </section>
  );
}
