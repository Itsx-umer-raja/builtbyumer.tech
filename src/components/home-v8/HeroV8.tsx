"use client";

import {
  Component,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, ChevronDown } from "lucide-react";
import { SearchBarV8 } from "./SearchBarV8";
import type { SceneControls } from "./UniverseScene";

/**
 * The 3D universe is lazy-loaded (no SSR) and only mounted once
 * the hero is near the viewport, so it can never delay first
 * paint or the headline's LCP. The headline and the search are
 * plain server HTML — the 3D is decoration on top of them.
 */
const UniverseScene = dynamic(
  () => import("./UniverseScene").then((m) => m.UniverseScene),
  { ssr: false },
);

/** If the canvas throws (driver, context loss), the static
    composition underneath stays up — the hero never goes blank. */
class SceneErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    // The fallback composition is already rendered underneath.
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * 2D fallback + reduced-motion static frame: a composed SVG of
 * the same scene — road, portal ring, floating documents, QR
 * block, particles — so the hero is complete with no WebGL, no
 * canvas loop and no entrance animation. Always rendered in the
 * server HTML (under the canvas); the opaque canvas covers it
 * only while the 3D scene is live.
 */
function StaticUniverse() {
  return (
    <div
      data-v8-fallback
      className="absolute inset-0"
      role="img"
      aria-label="Illustration of a road leading through a dark digital universe toward a glowing portal"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <radialGradient id="v8-portal-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b7cff" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#8b7cff" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#8b7cff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="v8-road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#101525" />
            <stop offset="100%" stopColor="#1a2142" />
          </linearGradient>
        </defs>
        {/* Stars */}
        <g fill="#f5f6ff">
          {[
            [120, 90, 1.6], [240, 170, 1.2], [420, 70, 1.8], [560, 140, 1.1],
            [700, 80, 1.5], [860, 150, 1.2], [1020, 90, 1.7], [1120, 200, 1.1],
            [180, 300, 1.1], [940, 320, 1.3], [60, 480, 1.2], [1140, 470, 1.4],
            [330, 420, 1.1], [780, 430, 1.2], [520, 260, 1],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} opacity={0.7} />
          ))}
        </g>
        {/* Portal glow + ring */}
        <circle cx="600" cy="300" r="260" fill="url(#v8-portal-glow)" />
        <circle
          cx="600"
          cy="300"
          r="150"
          fill="none"
          stroke="#8b7cff"
          strokeWidth="7"
          opacity="0.95"
        />
        <circle
          cx="600"
          cy="300"
          r="124"
          fill="none"
          stroke="#36d9ff"
          strokeWidth="2.5"
          opacity="0.8"
        />
        <circle cx="600" cy="300" r="138" fill="#8b7cff" opacity="0.12" />
        {/* The road */}
        <path
          d="M 600 800 L 540 470 L 600 330 L 660 470 L 600 800 Z"
          fill="url(#v8-road)"
        />
        <path
          d="M 540 470 L 600 330"
          stroke="#8b7cff"
          strokeWidth="3"
          opacity="0.9"
        />
        <path
          d="M 660 470 L 600 330"
          stroke="#8b7cff"
          strokeWidth="3"
          opacity="0.9"
        />
        <g stroke="#f5f6ff" strokeWidth="5" strokeDasharray="22 18" opacity="0.85">
          <line x1="600" y1="780" x2="600" y2="470" />
        </g>
        {/* Floating documents */}
        <g>
          <rect x="180" y="180" width="86" height="112" rx="6" fill="#e8eaff" opacity="0.95" />
          <rect x="180" y="180" width="86" height="16" rx="6" fill="#8b7cff" />
          <rect x="196" y="212" width="54" height="6" fill="#101525" opacity="0.5" />
          <rect x="196" y="228" width="54" height="6" fill="#101525" opacity="0.35" />
          <rect x="196" y="244" width="40" height="6" fill="#101525" opacity="0.35" />
        </g>
        <g>
          <rect x="920" y="210" width="74" height="96" rx="6" fill="#e8eaff" opacity="0.9" />
          <rect x="920" y="210" width="74" height="14" rx="6" fill="#36d9ff" />
          <rect x="934" y="238" width="46" height="5" fill="#101525" opacity="0.5" />
          <rect x="934" y="252" width="46" height="5" fill="#101525" opacity="0.35" />
        </g>
        {/* Rotating image frames (static pose) */}
        <rect x="880" y="430" width="120" height="82" rx="8" fill="none" stroke="#c5a6ff" strokeWidth="4" />
        <rect x="896" y="444" width="88" height="54" rx="4" fill="#8b7cff" opacity="0.25" />
        <rect x="170" y="470" width="104" height="72" rx="8" fill="none" stroke="#36d9ff" strokeWidth="4" />
        <rect x="184" y="482" width="76" height="48" rx="4" fill="#36d9ff" opacity="0.22" />
        {/* QR block */}
        <g>
          <rect x="690" y="520" width="96" height="96" rx="8" fill="#070912" stroke="#36d9ff" strokeWidth="3" />
          <g fill="#36d9ff">
            <rect x="702" y="532" width="24" height="24" />
            <rect x="750" y="532" width="24" height="24" />
            <rect x="702" y="580" width="24" height="24" />
            <rect x="738" y="556" width="12" height="12" />
            <rect x="762" y="580" width="12" height="12" />
            <rect x="726" y="592" width="12" height="12" />
          </g>
        </g>
        {/* File-format symbols */}
        <polygon points="430,560 462,540 494,560 478,596 446,596" fill="#8b7cff" opacity="0.9" />
        <circle cx="330" cy="620" r="22" fill="none" stroke="#36d9ff" strokeWidth="5" />
        <circle cx="330" cy="620" r="8" fill="#c5a6ff" />
      </svg>
    </div>
  );
}

/**
 * V8 hero — the cinematic 3D universe. The purpose is in the
 * first second: giant Anta headline, one honest subline, the
 * live search as the dominant element, two clear CTAs. The 3D
 * road and portal live BEHIND the copy; the copy is plain
 * server HTML and never waits on the canvas.
 */
export function HeroV8({
  onNavigate,
  inputRef,
}: {
  onNavigate: (id: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webgl, setWebgl] = useState(false);
  const [compact, setCompact] = useState(false);
  const [canvasMounted, setCanvasMounted] = useState(false);
  const [canvasActive, setCanvasActive] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SceneControls>({ scroll: 0, px: 0, py: 0 });

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    setCompact(window.matchMedia("(max-width: 768px)").matches);
    // WebGL capability check — no canvas is created if this fails.
    try {
      const test = document.createElement("canvas");
      const ctx =
        test.getContext("webgl2") ?? test.getContext("webgl");
      setWebgl(Boolean(ctx));
    } catch {
      setWebgl(false);
    }
  }, []);

  // Mount the canvas only when the hero is near the viewport, and
  // run its loop only while it is actually visible. Reduced motion
  // or no WebGL never mounts it — the static frame is the visual.
  useEffect(() => {
    if (reducedMotion || !webgl) return;
    const el = canvasWrapRef.current;
    if (!el) return;
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCanvasMounted(true);
      },
      { rootMargin: "400px" },
    );
    const visible = new IntersectionObserver(
      ([entry]) => setCanvasActive(entry.isIntersecting),
      { threshold: 0 },
    );
    near.observe(el);
    visible.observe(el);
    return () => {
      near.disconnect();
      visible.disconnect();
    };
  }, [reducedMotion, webgl]);

  // Pointer parallax + scroll turn for the 3D scene. Both write
  // into a shared ref the R3F loop reads — no React re-renders.
  // Fine pointers only; skipped entirely for reduced motion.
  useEffect(() => {
    if (reducedMotion) return;
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (e: MouseEvent) => {
      const r = section.getBoundingClientRect();
      controlsRef.current.px = Math.max(
        -1,
        Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1),
      );
      controlsRef.current.py = Math.max(
        -1,
        Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1),
      );
    };
    const onScroll = () => {
      const r = section.getBoundingClientRect();
      controlsRef.current.scroll = Math.max(
        0,
        Math.min(1, -r.top / Math.max(1, r.height)),
      );
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reducedMotion]);

  const canvasLive = canvasMounted && webgl && !reducedMotion;

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative flex min-h-svh flex-col overflow-hidden pt-28 sm:pt-32"
      aria-label="BuiltByUmer — 145 tools, one digital universe"
    >
      {/* 3D universe (covers the fallback only while live) */}
      <div
        ref={canvasWrapRef}
        data-v8-canvas
        data-v8-canvas-live={canvasLive ? "true" : "false"}
        className="absolute inset-0"
        aria-hidden
      >
        <StaticUniverse />
        {canvasLive && (
          <div className="absolute inset-0">
            <SceneErrorBoundary>
              <UniverseScene
                controls={controlsRef.current}
                compact={compact}
                active={canvasActive}
              />
            </SceneErrorBoundary>
          </div>
        )}
      </div>

      {/* Readability veil — the copy sits on top of the scene */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(7,9,18,0.55)_78%,#070912_100%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 pb-16 text-center sm:px-8">
        <p className="v8-hero-fade v8-eyebrow">
          <span className="v8-dot">●</span> Route 145 — 10 stops · One road
        </p>

        <h1 className="mt-6 font-anta text-[clamp(2.6rem,8.5vw,6.2rem)] leading-[0.98] tracking-[0.01em] text-[var(--v8-text)]">
          <span className="block overflow-hidden pb-1">
            <span className="v8-hero-line block">145+ TOOLS.</span>
          </span>
          <span className="block overflow-hidden pb-1">
            <span className="v8-hero-line block">
              ONE{" "}
              <span className="text-[var(--v8-accent)]">DIGITAL</span>
            </span>
          </span>
          <span className="block overflow-hidden pb-1">
            <span className="v8-hero-line block">UNIVERSE.</span>
          </span>
        </h1>

        <p className="v8-hero-fade mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--v8-muted)] sm:text-lg">
          Convert, compress, create and calculate. Everything you
          need, in one place. Free, fast and private.
        </p>

        {/* Search — the fastest way in; never behind the 3D */}
        <div id="v8-search" className="v8-hero-fade mt-9 w-full max-w-2xl scroll-mt-32">
          <SearchBarV8 inputRef={inputRef} />
        </div>

        <div className="v8-hero-fade mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/tools"
            className="v8-btn-primary group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] transition-colors"
          >
            EXPLORE ALL TOOLS
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={() => onNavigate("#map")}
            className="v8-btn-ghost inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] transition-colors"
          >
            START YOUR JOURNEY
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        <p className="v8-hero-fade mt-8 font-grotesk text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--v8-muted)]/80">
          No account · No upload · Files never leave your device
        </p>
      </div>

      <button
        type="button"
        onClick={() => onNavigate("#map")}
        className="v8-hero-fade relative mx-auto mb-6 flex flex-col items-center gap-1 text-[var(--v8-muted)] transition-colors hover:text-[var(--v8-text)]"
        aria-label="Scroll to the Route 145 map"
      >
        <span className="font-grotesk text-[10px] font-bold uppercase tracking-[0.24em]">
          The road starts here
        </span>
        <ChevronDown className="v8-bounce h-5 w-5 text-[var(--v8-accent)]" aria-hidden />
      </button>
    </section>
  );
}
