"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { initHeroParticles } from "./particles";

const HERO_VIDEO =
  "https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/cloudinarry%20to%20cloudflare/202606021731-e_hqa6sn.mp4";

/**
 * Fernhollow Night Flower Valley — the BuiltByUmer landing hero.
 *
 * Structure, spacing logic and interaction style follow the supplied
 * Fernhollow interface reference (unit system: --u). The authorised
 * Three.js valley engine is NOT present in this project, so the supplied
 * MP4 is the real hero background and the atmosphere is recreated with a
 * lightweight 2D canvas particle layer (see ./particles.ts).
 */
export function FernhollowHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [videoOk, setVideoOk] = useState(true);
  const [soundNote, setSoundNote] = useState(false);

  useEffect(() => {
    const video = document.getElementById("hero-video") as HTMLVideoElement | null;

    const reveal = () => setReady(true);
    if (video) {
      video.addEventListener("playing", reveal, { once: true });
      video.addEventListener("error", () => {
        setVideoOk(false);
        reveal();
      }, { once: true });
      if (video.readyState >= 2) reveal();
    }
    const fallbackTimer = window.setTimeout(reveal, 3500);
    video?.play().catch(() => setVideoOk(false));

    const handle = containerRef.current ? initHeroParticles(containerRef.current) : null;
    return () => {
      window.clearTimeout(fallbackTimer);
      handle?.destroy();
    };
  }, []);

  return (
    <section
      className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-black"
      aria-label="BuiltByUmer hero"
    >
      {/* ── Background layer ── */}
      <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {videoOk ? (
          <video
            id="hero-video"
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            src={HERO_VIDEO}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_10%,#1A3927_0%,#10291A_45%,#0B100D_100%)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.15)_45%,rgba(0,0,0,.65))]" />
      </div>

      {/* ── Interface layer ── */}
      <div
        className={
          "pointer-events-none absolute inset-0 z-20 transition-opacity duration-[1600ms] ease-out " +
          (ready ? "opacity-100" : "opacity-0")
        }
      >
        <header className="fern-header absolute inset-x-0 top-0 flex items-center justify-between">
          <Link
            href="/"
            aria-label="BuiltByUmer"
            className="text-[calc(26*var(--u))] font-medium tracking-[-.02em] text-[#F5EFE2]"
          >
            BuiltByUmer
          </Link>
          <nav
            aria-label="Main"
            className="fern-nav flex items-center gap-[calc(44*var(--u))] text-[calc(14.5*var(--u))] font-medium uppercase tracking-[.16em] text-[#F5EFE2]"
          >
            <Link className="fern-link transition-opacity hover:opacity-60" href="/tools">Tools</Link>
            <Link className="fern-link transition-opacity hover:opacity-60" href="/tools">Categories</Link>
            <Link className="fern-link transition-opacity hover:opacity-60" href="/portfolio">Portfolio</Link>
            <Link className="fern-link transition-opacity hover:opacity-60" href="/about">About</Link>
            <Link
              className="inline-flex h-[calc(46*var(--u))] items-center rounded-full bg-[#F5EFE2] px-[calc(26*var(--u))] text-[#151510] transition-transform hover:-translate-y-px"
              href="/tools"
            >
              Explore Tools
            </Link>
          </nav>
        </header>

        <div className="fern-hero absolute inset-x-0 top-1/2 flex -translate-y-[46%] flex-col items-center text-center">
          <h1 className="fern-headline whitespace-nowrap text-[calc(158*var(--u))] font-display leading-[.92] tracking-[-.012em] text-[#F5EFE2]">
            Every tool. One destination.
          </h1>
          <p className="fern-cap mt-[calc(48*var(--u))] text-[calc(20*var(--u))] leading-[1.3] text-[#F5EFE2]">
            Convert without limits.
            <br />
            Create without complexity.
            <br />
            Built for everyday work.
          </p>
          <Link
            href="/tools"
            aria-label="Explore all tools"
            className="mt-[calc(34*var(--u))] grid h-[calc(58*var(--u))] w-[calc(58*var(--u))] place-items-center rounded-full border-[1.5px] border-[#F5EFE2] text-[#F5EFE2] transition-colors hover:bg-[#F5EFE2] hover:text-[#151510]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[calc(22*var(--u))] w-[calc(22*var(--u))]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 12h16M14 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        <div className="fern-corner absolute bottom-[calc(44*var(--u))] right-[calc(44*var(--u))] flex items-center gap-[calc(18*var(--u))] text-[calc(12.5*var(--u))] font-medium uppercase tracking-[.16em] text-[#F5EFE2]">
          <span>Explore the tools</span>
          <i className="h-[calc(26*var(--u))] w-px bg-[#F5EFE2]/45" aria-hidden />
          <button
            type="button"
            className="fern-sound grid h-[calc(28*var(--u))] w-[calc(28*var(--u))] place-items-center"
            aria-pressed="false"
            aria-label="Background sound"
            title="Ambient sound comes with the original valley engine"
            onClick={() => {
              setSoundNote(true);
              window.setTimeout(() => setSoundNote(false), 2600);
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-full w-full"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5Z" />
              <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" className="opacity-40" />
            </svg>
            {soundNote && (
              <span className="pointer-events-none absolute bottom-[130%] right-0 whitespace-nowrap rounded-md bg-black/70 px-3 py-1.5 text-[11px] normal-case tracking-normal text-[#F5EFE2]/90">
                Ambient sound ships with the original valley engine
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Loader ── */}
      <div
        className={
          "pointer-events-none fixed inset-0 z-30 grid place-items-center bg-black transition-opacity duration-1000 " +
          (ready ? "opacity-0" : "opacity-100")
        }
        aria-hidden="true"
      >
        <span className="fern-dot h-[calc(9*var(--u))] w-[calc(9*var(--u))] min-h-[6px] min-w-[6px] animate-[fern-pulse_1.2s_ease-in-out_infinite] rounded-full bg-[#F5EFE2]" />
      </div>

      <style href="st-fernhollowhero-1" precedence="high" dangerouslySetInnerHTML={{ __html: `
        .fern-header {
          padding: calc(24 * var(--u)) calc(44 * var(--u)) 0;
        }
        .fern-headline {
          font-family: var(--font-antonio), "Arial Narrow", sans-serif;
          font-weight: 400;
        }
        .fern-cap,
        .fern-note {
          font-family: var(--font-manrope), system-ui, sans-serif;
        }
        .fern-sound {
          position: relative;
        }
        @keyframes fern-pulse {
          50% {
            transform: scale(0.4);
            opacity: 0.4;
          }
        }
        @media (max-width: 820px) {
          .fern-header {
            padding: 18px 18px 0;
          }
          .fern-nav > .fern-link {
            display: none;
          }
          .fern-nav > a:last-child {
            height: 40px;
            padding: 0 18px;
            font-size: 12px;
          }
          .fern-hero {
            left: 20px;
            right: 20px;
          }
          .fern-headline {
            font-size: clamp(64px, 19vw, 96px);
            white-space: normal;
          }
          .fern-cap {
            font-size: 17px;
          }
          .fern-corner {
            left: 20px;
            right: 20px;
            bottom: 30px;
            justify-content: center;
            font-size: 11px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .fern-dot {
            animation: none;
          }
        }
      ` }} />
    </section>
  );
}
