"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { TOOLS } from "@/data/tools";
import { clamp } from "@/lib/utils";

const FLY_IN = "/videos/mossline-flyin.mp4";
const HERO_ISLAND = "/images/mossline-hero-island.webp";
const ISLAND_CUTOUT = "/images/mossline-island-cutout.webp";
const SENSOR_MAST = "/images/mossline-sensor-mast.webp";
const ISLAND_CLOUDS = "/images/mossline-island-clouds.webp";

/** Scroll-progress ranges for the five beats. */
const RANGE = {
  hero: [0, 0.22],
  flyIn: [0.22, 0.5],
  features: [0.5, 0.68],
  station: [0.68, 0.86],
  solutions: [0.86, 1],
} as const;

const HOTSPOTS = [
  { label: "PDF Tools", href: "/pdf-tools", x: 30, y: 38, tip: "Merge, split, convert and edit PDF files right in the browser." },
  { label: "Image Processing", href: "/image-tools", x: 62, y: 30, tip: "Compress to an exact size, resize, crop and convert any format." },
  { label: "Developer Utilities", href: "/developer-tools", x: 47, y: 55, tip: "Formatters, encoders, hashes and generators for daily work." },
  { label: "Everyday Calculators", href: "/calculators", x: 72, y: 58, tip: "Loans, percentages, dates, units and currencies." },
] as const;

const SOLUTION_CARDS = [
  {
    img: SENSOR_MAST,
    title: "Document & PDF processing",
    text: "Merge reports, split invoices, stamp watermarks and turn images into shareable PDFs — without uploading your documents to anyone.",
    href: "/pdf-tools",
    alt: "Misty landscape with a slim sensor mast — document processing",
  },
  {
    img: HERO_ISLAND,
    title: "Image & media tools",
    text: "Compress photos to an exact kilobyte target, resize for forms, convert between JPG, PNG and WEBP and pull text out of scans.",
    href: "/image-tools",
    alt: "Floating moss islands over clouds — image tools",
  },
  {
    img: ISLAND_CLOUDS,
    title: "Developer & internet utilities",
    text: "Format JSON, decode JWTs, look up IPs and DNS records, and generate codes and keys — the daily toolkit, always open.",
    href: "/developer-tools",
    alt: "A floating island in the clouds — developer utilities",
  },
] as const;

const STORY_PARAGRAPH =
  "BuiltByUmer brings essential digital tools into one place, so you can process files, create documents and complete everyday tasks without installing unnecessary software.";

function sub(range: readonly [number, number] | readonly number[], p: number) {
  const [a, b] = range;
  return clamp((p - a) / (b - a), 0, 1);
}

/** Chip of the Mossline fixed navigation bar. */
function MosslineNav({ visible }: { visible: boolean }) {
  return (
    <div
      className={
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 " +
        (visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none")
      }
    >
      <nav
        aria-label="Story"
        className="grid grid-cols-[1fr_auto_1fr] items-center bg-[#E7EBE8]/85 backdrop-blur-md border-b border-black/5"
        style={{ padding: "22px 34px" }}
      >
        <Link href="/" className="flex items-center gap-2.5 justify-self-start" aria-label="BuiltByUmer home">
          {/* Hexagonal BuiltByUmer emblem adapted from the Mossline logo concept */}
          <svg width="26" height="28" viewBox="0 0 26 28" aria-hidden>
            <path d="M13 1 24.5 7.5v13L13 27 1.5 20.5v-13Z" fill="none" stroke="#10291A" strokeWidth="2" />
            <path d="M8.5 19V9h4.2a3 3 0 0 1 0 6H8.5m4.6 0 3.4 4" stroke="#10291A" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-tight text-[15px] font-semibold tracking-tight text-[#10291A]">
            BuiltByUmer
          </span>
        </Link>

        <div className="hidden items-center gap-9 text-[13px] font-medium text-[#2C4434] md:flex">
          <Link href="/tools" className="transition hover:text-[#10291A] hover:underline underline-offset-4">Solutions</Link>
          <a href="#story-features" className="transition hover:text-[#10291A] hover:underline underline-offset-4">Our Tech</a>
          <Link href="/portfolio" className="transition hover:text-[#10291A] hover:underline underline-offset-4">Portfolio</Link>
          <Link href="/about" className="transition hover:text-[#10291A] hover:underline underline-offset-4">Resources</Link>
        </div>

        <Link
          href="/contact"
          className="group flex items-center gap-2 justify-self-end text-[12px] font-semibold uppercase tracking-[.14em] text-[#10291A]"
        >
          Let&apos;s build
          <span className="grid h-6 w-6 place-items-center bg-[#C6F35C] transition-transform group-hover:translate-x-0.5" aria-hidden>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10291A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h16M14 6l6 6-6 6" />
            </svg>
          </span>
        </Link>
      </nav>
    </div>
  );
}

export function MosslineStory() {
  const storyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRef<HTMLDivElement>(null);

  const [navVisible, setNavVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [toolCount, setToolCount] = useState(0);
  const countedRef = useRef(false);
  const spRef = useRef(0);

  const words = useMemo(() => STORY_PARAGRAPH.split(" "), []);


  useEffect(() => {
    const story = storyRef.current;
    if (!story) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let p = 0;
    let sp = 0;
    let raf = 0;
    let last = performance.now();

    // Show the story navigation only while the story is on screen.
    const io = new IntersectionObserver(
      ([entry]) => setNavVisible(entry.isIntersecting),
      { rootMargin: "-80px 0px -40% 0px" },
    );
    io.observe(story);

    const measure = () => {
      const rect = story.getBoundingClientRect();
      const total = story.offsetHeight - window.innerHeight;
      p = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
    };

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      measure();

      // Spec smoothing: sp += (p - sp) * (1 - pow(.86, dt / 16.7))
      sp += (p - sp) * (1 - Math.pow(0.86, dt / 16.7));
      spRef.current = sp;

      // ── Video scrub (Beat 2) ──
      const v = videoRef.current;
      if (v && videoReady && !reduced) {
        const f = sub(RANGE.flyIn, sp);
        if (f > 0 && f < 1) {
          if (v.paused) v.play().catch(() => {});
          const target = f * (v.duration || 0);
          if (Math.abs(v.currentTime - target) > 0.12 && !v.seeking) {
            v.currentTime = target;
          }
        } else if (!v.paused) {
          v.pause();
        }
        // Cross-fade: visible only during the fly-in beat (smooth edges).
        v.style.opacity = String(clamp(Math.min(f * 6, (1 - f) * 6), 0, 1));
      }

      // ── Camera parallax (pointer) ──
      const cam = cameraRef.current;
      if (cam && !reduced) {
        const dx = (pointer.x / window.innerWidth - 0.5) * 18;
        const dy = (pointer.y / window.innerHeight - 0.5) * 12;
        cam.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
      }

      // ── Progress bar ──
      if (progressRef.current) {
        progressRef.current.style.height = `${(sp * 100).toFixed(2)}%`;
      }

      // ── Solutions slide-up ──
      const sol = solutionsRef.current;
      if (sol) {
        const f = sub(RANGE.solutions, sp);
        sol.style.transform = `translateY(${((1 - f) * 100).toFixed(2)}%)`;
      }

      // ── Hero island drift + fade ──
      const island = document.getElementById("moss-island-layer");
      if (island) {
        const f = sub(RANGE.hero, sp);
        const out = sub(RANGE.flyIn, sp);
        island.style.opacity = String(1 - out);
        island.style.transform = `scale(${(1.06 - f * 0.1 + out * 0.4).toFixed(4)}) translateY(${(f * -30).toFixed(1)}px)`;
      }

      // ── Cutout island rises after fly-in ──
      const cut = document.getElementById("moss-cutout-layer");
      if (cut) {
        const f = sub(RANGE.features, sp);
        const hold = 1 - Math.max(0, (sp - 0.8) / 0.2);
        cut.style.opacity = String(f * hold);
        cut.style.transform = `translateY(${((1 - f) * 60).toFixed(1)}px) scale(${(0.9 + f * 0.08).toFixed(3)})`;
      }

      raf = requestAnimationFrame(tick);
    };

    // Count-up of the REAL registered tool count (no fabricated stats).
    const countTimer = window.setInterval(() => {
      if (spRef.current > RANGE.station[0] && !countedRef.current) {
        countedRef.current = true;
        const t0 = performance.now();
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / 1200);
          setToolCount(Math.round(TOOLS.length * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      if (spRef.current < RANGE.features[0]) countedRef.current = false;
    }, 250);

    if (reduced) {
      // Static presentation: show settled island, no scrubbing.
      measure();
      sp = 1;
      const island = document.getElementById("moss-island-layer");
      if (island) island.style.opacity = "0";
      const cut = document.getElementById("moss-cutout-layer");
      if (cut) cut.style.opacity = "1";
      if (progressRef.current) progressRef.current.style.height = "100%";
      if (solutionsRef.current) solutionsRef.current.style.transform = "translateY(0)";
      if (!countedRef.current) {
        countedRef.current = true;
        setToolCount(TOOLS.length);
      }
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(countTimer);
      window.clearInterval(countTimer);
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
    };
  }, [videoReady]);

  return (
    <section id="story" ref={storyRef} className="relative h-[640vh] bg-[#E7EBE8]" aria-label="BuiltByUmer story">
      <MosslineNav visible={navVisible} />

      <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden bg-[#dfe3e0]">
        {/* ── Camera layers ── */}
        <div ref={cameraRef} className="absolute inset-0 will-change-transform">
          {/* Beat 1 — hero island */}
          <div id="moss-island-layer" className="absolute inset-0 will-change-transform">
            <img
              src={HERO_ISLAND}
              alt="Floating moss islands over a misty sky"
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>

          {/* Beat 2 — fly-in video, scrubbed by scroll */}
          {!videoFailed && (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500"
              style={{
                opacity: undefined,
              }}
              src={FLY_IN}
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              tabIndex={-1}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                v.pause();
                setVideoReady(true);
              }}
              onError={() => setVideoFailed(true)}
              aria-hidden="true"
            />
          )}

          {/* Beat 3+ — settled island cutout with small rocks */}
          <div
            id="moss-cutout-layer"
            className="absolute inset-0 flex items-center justify-center will-change-transform"
            style={{ opacity: 0 }}
          >
            <img
              src={ISLAND_CUTOUT}
              alt="Floating moss island cut-out with small rocks"
              className="max-h-[62svh] w-auto max-w-[80vw] object-contain drop-shadow-[0_40px_60px_rgba(16,41,26,0.25)]"
              draggable={false}
            />
          </div>
        </div>

        {/* ── Fog layers ── */}
        <div className="moss-fog pointer-events-none absolute inset-0" aria-hidden />
        <div className="moss-fog moss-fog-2 pointer-events-none absolute inset-0" aria-hidden />

        {/* ── Floating particles ── */}
        <div className="moss-particles pointer-events-none absolute inset-0" aria-hidden />

        {/* ── Beat 1 + 2 text ── */}
        <StoryTexts spRef={spRef} />

        {/* ── Beat 3 — progressive paragraph + hotspots ── */}
        <div
          id="story-features"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6"
        >
          <BeatBlock range={RANGE.features} spRef={spRef} fade="both">
            <p className="moss-prog mx-auto max-w-3xl text-center font-tight text-xl leading-relaxed text-[#10291A] sm:text-2xl">
              {words.map((w, i) => (
                <ProgressiveWord key={i} index={i} total={words.length} spRef={spRef} range={RANGE.features}>
                  {w}{" "}
                </ProgressiveWord>
              ))}
            </p>
          </BeatBlock>

          {/* Hotspots */}
          <div className="absolute inset-0 z-20">
            {HOTSPOTS.map((h, i) => (
              <Hotspot key={h.label} spot={h} index={i} spRef={spRef} />
            ))}
          </div>
        </div>

        {/* ── Beat 4 — glass tool station card ── */}
        <div className="absolute inset-0 z-30 flex items-center justify-center px-6">
          <BeatBlock range={RANGE.station} spRef={spRef} fade="both" className="w-full max-w-4xl">
            <div className="rounded-2xl border border-white/40 bg-[#F4F7F3]/25 p-7 shadow-[0_30px_80px_rgba(16,41,26,0.18)] backdrop-blur-xl sm:p-10">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#2C4434]">
                    Tool station
                  </p>
                  <h3 className="mt-2 font-tight text-3xl font-semibold text-[#10291A] sm:text-4xl">
                    One platform. Multiple possibilities.
                  </h3>
                </div>
                <div className="text-right">
                  <div className="font-tight text-5xl font-semibold text-[#10291A] tabular-nums">
                    {toolCount}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#2C4434]">
                    registered tools
                  </div>
                </div>
              </div>

              <ul className="mt-7 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "Free browser-based processing",
                  "No account required for basic tools",
                  "Multiple file formats",
                  "Privacy-focused processing",
                  "Mobile-friendly interface",
                ].map((f, i) => (
                  <li key={f} className="flex items-baseline gap-3 text-sm text-[#2C4434]">
                    <span className="font-mono text-xs text-[#10291A]/60">{String(i + 1).padStart(2, "0")}</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 rounded-full bg-[#10291A] px-6 py-3 text-sm font-semibold text-[#C6F35C] transition hover:bg-[#1A3927]"
                >
                  Browse the tool directory
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 12h16M14 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </div>
          </BeatBlock>
        </div>

        {/* ── Beat 5 — solutions slide-up ── */}
        <div
          ref={solutionsRef}
          className="absolute inset-0 z-40 will-change-transform"
          style={{ transform: "translateY(100%)" }}
        >
          <div className="h-full overflow-y-auto rounded-t-[28px] bg-[#F6F7F4] px-6 pb-16 pt-12 sm:px-10">
            <div className="mx-auto max-w-6xl">
              <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#2C4434]">
                Solutions
              </p>
              <h3 className="mt-2 max-w-xl font-tight text-3xl font-semibold text-[#10291A] sm:text-4xl">
                Everything you need to get work done.
              </h3>

              <div className="mt-8 grid gap-3.5 md:grid-cols-3">
                {SOLUTION_CARDS.map((c) => (
                  <SolutionCard key={c.title} card={c} />
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#10291A]/10 pt-6">
                <p className="text-sm text-[#2C4434]">
                  {TOOLS.length} tools across 10 categories — all free, all in your browser.
                </p>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 rounded-full bg-[#10291A] px-6 py-3 text-sm font-semibold text-[#C6F35C] transition hover:bg-[#1A3927]"
                >
                  Open the directory
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 12h16M14 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="absolute right-5 top-1/2 z-40 hidden h-40 w-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-[#10291A]/10 sm:block" aria-hidden>
          <div ref={progressRef} className="w-full bg-[#10291A]" style={{ height: "0%" }} />
        </div>
      </div>

      <style href="st-mosslinestory-1" precedence="high" dangerouslySetInnerHTML={{ __html: `
        .moss-fog {
          background:
            radial-gradient(60% 45% at 20% 80%, rgba(230, 236, 232, 0.9), transparent 70%),
            radial-gradient(55% 40% at 75% 85%, rgba(230, 236, 232, 0.8), transparent 70%);
          animation: moss-fog-drift 26s ease-in-out infinite alternate;
          mix-blend-mode: screen;
        }
        .moss-fog-2 {
          background:
            radial-gradient(50% 35% at 45% 90%, rgba(231, 235, 232, 0.85), transparent 72%);
          animation: moss-fog-drift 34s ease-in-out infinite alternate-reverse;
        }
        @keyframes moss-fog-drift {
          from {
            transform: translateX(-3%) scale(1.05);
          }
          to {
            transform: translateX(3%) scale(1.12);
          }
        }
        .moss-particles {
          background-image:
            radial-gradient(2px 2px at 12% 30%, rgba(16, 41, 26, 0.16), transparent 60%),
            radial-gradient(1.5px 1.5px at 30% 70%, rgba(16, 41, 26, 0.12), transparent 60%),
            radial-gradient(2px 2px at 55% 25%, rgba(16, 41, 26, 0.14), transparent 60%),
            radial-gradient(1.5px 1.5px at 70% 60%, rgba(16, 41, 26, 0.12), transparent 60%),
            radial-gradient(2px 2px at 85% 40%, rgba(16, 41, 26, 0.15), transparent 60%),
            radial-gradient(1.5px 1.5px at 42% 82%, rgba(16, 41, 26, 0.1), transparent 60%);
          animation: moss-particle-float 18s ease-in-out infinite alternate;
        }
        @keyframes moss-particle-float {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-24px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .moss-fog,
          .moss-fog-2,
          .moss-particles {
            animation: none;
          }
        }
      ` }} />
    </section>
  );
}

/* ── Beat text block with scroll-driven opacity ───────────── */

function BeatBlock({
  range,
  spRef,
  fade = "in",
  className,
  children,
}: {
  range: readonly number[];
  spRef: RefObject<number>;
  fade?: "in" | "both";
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const sp = spRef.current ?? 0;
      const f = sub(range, sp);
      const [a, b] = range;
      const width = b - a;
      // fade in over the first 35% of the beat, fade out over the last 20% when "both"
      const inO = Math.min(1, f / (width * 0.001 + 0.35));
      const outO = fade === "both" ? 1 - Math.max(0, (f - 0.8) / 0.2) : 1;
      const o = Math.max(0, Math.min(1, inO * outO));
      if (ref.current) {
        ref.current.style.opacity = String(o);
        ref.current.style.transform = `translateY(${((1 - inO) * 36).toFixed(1)}px)`;
        ref.current.style.pointerEvents = o > 0.5 ? "auto" : "none";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [range, fade, spRef]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}

/* ── Beat 1/2 headlines ───────────────────────────────────── */

function StoryTexts({ spRef }: { spRef: RefObject<number> }) {
  return (
    <>
      {/* Beat 1 — HERO */}
      <div className="pointer-events-none absolute inset-x-0 top-[16svh] z-10 flex flex-col items-center px-6 text-center">
        <BeatBlock range={RANGE.hero} spRef={spRef} fade="both">
          <span className="mb-5 inline-block rounded-full border border-[#10291A]/25 bg-[#F6F7F4]/60 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[.22em] text-[#10291A] backdrop-blur-sm">
            Built for everyday work
          </span>
          <h2 className="font-tight text-5xl font-semibold leading-[1.02] tracking-tight text-[#10291A] sm:text-6xl lg:text-7xl">
            Tools for the
            <br />
            digital world.
          </h2>
        </BeatBlock>
      </div>

      {/* Beat 2 — FLY-IN headline (sharpens as camera settles) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[14svh] z-10 flex flex-col items-center px-6 text-center">
        <BeatBlock range={RANGE.flyIn} spRef={spRef} fade="both">
          <h2
            className="font-tight text-4xl font-semibold leading-[1.05] tracking-tight text-[#10291A] sm:text-5xl"
            style={{ textShadow: "0 2px 24px rgba(230,235,232,0.9)" }}
          >
            From complicated tasks
            <br />
            to simple solutions.
          </h2>
        </BeatBlock>
      </div>
    </>
  );
}

/* ── Progressive word reveal ──────────────────────────────── */

function ProgressiveWord({
  index,
  total,
  spRef,
  range,
  children,
}: {
  index: number;
  total: number;
  spRef: RefObject<number>;
  range: readonly number[];
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const f = sub(range, spRef.current ?? 0);
      const start = 0.15 + (index / total) * 0.6;
      const o = clamp((f - start) / 0.08, 0, 1);
      if (ref.current) {
        ref.current.style.opacity = String(o);
        ref.current.style.filter = `blur(${((1 - o) * 4).toFixed(1)}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, total, range, spRef]);
  return (
    <span ref={ref} className="inline-block" style={{ opacity: 0 }}>
      {children}
    </span>
  );
}

/* ── Lime hotspot with tooltip ────────────────────────────── */

function Hotspot({
  spot,
  index,
  spRef,
}: {
  spot: (typeof HOTSPOTS)[number];
  index: number;
  spRef: RefObject<number>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const f = sub(RANGE.features, spRef.current ?? 0);
      const o = clamp((f - 0.55 - index * 0.06) / 0.08, 0, 1);
      if (ref.current) {
        ref.current.style.opacity = String(o);
        ref.current.style.transform = `scale(${(0.6 + o * 0.4).toFixed(3)})`;
        ref.current.style.pointerEvents = o > 0.6 ? "auto" : "none";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, spRef]);

  return (
    <div
      ref={ref}
      className="absolute"
      style={{ left: `${spot.x}%`, top: `${spot.y}%`, opacity: 0 }}
    >
      <div className="group relative -translate-x-1/2 -translate-y-1/2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          aria-label={spot.label}
          aria-expanded={open}
          className="relative grid h-11 w-11 place-items-center rounded-full bg-[#C6F35C] shadow-[0_10px_30px_rgba(169,221,58,0.45)] transition-transform hover:scale-110"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-[#C6F35C]/40" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#10291A]" aria-hidden />
        </button>

        <div
          className={
            "absolute left-1/2 top-full z-30 mt-3 w-60 -translate-x-1/2 rounded-xl border border-white/40 bg-[#F6F7F4]/95 p-4 shadow-xl backdrop-blur transition-all duration-200 " +
            (open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0")
          }
        >
          <Link href={spot.href} className="font-tight text-sm font-semibold text-[#10291A] hover:underline">
            {spot.label}
          </Link>
          <p className="mt-1.5 text-xs leading-relaxed text-[#2C4434]">{spot.tip}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Solutions card with pointer tilt ─────────────────────── */

function SolutionCard({ card }: { card: (typeof SOLUTION_CARDS)[number] }) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: ReactPointerEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia("(max-width: 820px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${(px * 12).toFixed(2)}deg) rotateX(${(-py * 12).toFixed(2)}deg)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "perspective(900px) rotateY(0) rotateX(0)";
  };

  return (
    <Link
      ref={ref}
      href={card.href}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group relative block h-[440px] overflow-hidden rounded-xl transition-transform duration-200 will-change-transform max-md:h-[340px]"
    >
      <img
        src={card.img}
        alt={card.alt}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.07]"
        draggable={false}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(16,41,26,0.55) 0%, rgba(16,41,26,0) 40%, rgba(16,41,26,0) 55%, rgba(16,41,26,0.72) 100%)",
        }}
        aria-hidden
      />

      <span className="absolute right-5 top-5 grid h-7 w-7 place-items-center rounded-full bg-[#C6F35C]" aria-hidden>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10291A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      </span>

      <div className="absolute inset-x-0 bottom-0 p-6">
        <h4 className="font-tight text-2xl font-semibold text-[#F6F7F4]">{card.title}</h4>
        <p className="mt-2 max-h-0 overflow-hidden text-sm leading-relaxed text-[#F6F7F4]/85 opacity-0 transition-all duration-500 group-hover:max-h-32 group-hover:opacity-100 max-md:max-h-32 max-md:opacity-100">
          {card.text}
        </p>
      </div>
    </Link>
  );
}
