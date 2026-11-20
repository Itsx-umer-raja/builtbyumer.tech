"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Search, X } from "lucide-react";
import { CATEGORY_MAP } from "@/data/categories";
import { TOOLS, TOOL_MAP } from "@/data/tools";
import { BorderBeam } from "@/components/ui/border-beam";
import { Magnetic } from "../home-v2/Magnetic";
import { StaticBlocks } from "./StaticBlocks";
import type { SceneControls } from "./ToolBlocksScene";

/**
 * The 3D canvas is lazy-loaded (no SSR) and only mounted once
 * the hero is near the viewport, so it can never delay first
 * paint or the headline's LCP.
 */
const ToolBlocksScene = dynamic(
  () => import("./ToolBlocksScene").then((m) => m.ToolBlocksScene),
  { ssr: false },
);

const HEADLINE_LINES: Array<Array<{ text: string; vermillion?: boolean }>> = [
  [{ text: "145 free tools." }],
  [{ text: "Zero uploads.", vermillion: true }],
  [{ text: "One destination." }],
];

/** One-tap chips under the search — the most opened tools. */
const SEARCH_CHIPS = [
  "merge-pdf",
  "compress-pdf",
  "image-compressor",
  "qr-code-generator",
  "password-generator",
  "json-formatter",
];

/**
 * V5 hero — editorial split. Left: the purpose, in the first
 * second — giant Anta headline, one honest subline, the live
 * search as the dominant element, clear CTAs. Right: the toolbox
 * in 3D — the same three colours as floating blocks, turning
 * with the pointer and the scroll. Paper background, ink type,
 * vermillion only where it earns attention. The headline is plain
 * server HTML; the rise is transform-only and starts on mount.
 */
export function HeroV5({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [compact, setCompact] = useState(false);
  const [canvasMounted, setCanvasMounted] = useState(false);
  const [canvasActive, setCanvasActive] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<SceneControls>({ scroll: 0, px: 0, py: 0 });

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    setIsMac(/Mac|iPhone|iPad/.test(window.navigator.platform));
    setCompact(window.matchMedia("(max-width: 768px)").matches);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return TOOLS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.keywords ?? []).some((k) => k.toLowerCase().includes(q)),
    ).slice(0, 8);
  }, [query]);

  // Close the search panel on outside click; Ctrl/⌘K or "/" focuses
  // it, Escape closes it.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Mount the canvas only when the hero is near the viewport, and
  // run its loop only while it is actually visible. Reduced motion
  // never mounts it — the static frame is the hero visual.
  useEffect(() => {
    if (reducedMotion) return;
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
  }, [reducedMotion]);

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
      const p = -r.top / Math.max(1, r.height - window.innerHeight);
      controlsRef.current.scroll = Math.max(0, Math.min(1, p));
    };
    section.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      section.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reducedMotion]);

  const goTo = (index: number) => {
    const t = results[index] ?? results[0];
    if (t) window.location.href = `/${t.category}/${t.id}`;
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length > 0) {
        setOpen(true);
        setActiveIndex((i) => (i + 1) % results.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length > 0) {
        setOpen(true);
        setActiveIndex((i) => (i - 1 + results.length) % results.length);
      }
    } else if (e.key === "Enter") {
      if (open && results.length > 0) {
        e.preventDefault();
        goTo(activeIndex < 0 ? 0 : activeIndex);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative overflow-hidden bg-[#faf8f2]"
    >
      {/* Index rule */}
      <div className="mx-auto max-w-7xl px-5 pt-24 sm:px-8 lg:pt-32">
        <div className="flex items-center justify-between border-b-2 border-[#141412] pb-4">
          <p className="v5-eyebrow">
            <span className="text-[#ff4d00]">●</span> BuiltByUmer — Free
            online tools
          </p>
          <p className="v5-eyebrow hidden sm:block">01 — The toolbox</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:pb-24 lg:pt-14">
        {/* ── Left: purpose, search, CTAs ── */}
        <div className="lg:col-span-7">
          <h1 className="font-anta text-[clamp(3rem,9vw,6.8rem)] leading-[0.98] tracking-[0.01em] text-[#141412]">
            {HEADLINE_LINES.map((line, li) => (
              <span key={li} className="block overflow-hidden pb-1">
                <span className="v5-hero-line block will-change-transform">
                  {line.map((w, wi) =>
                    w.vermillion ? (
                      <span key={wi} className="text-[#ff4d00]">
                        {w.text}
                      </span>
                    ) : (
                      <span key={wi}>{w.text}</span>
                    ),
                  )}
                </span>
              </span>
            ))}
          </h1>

          <p className="v5-hero-fade mt-6 max-w-xl text-base leading-relaxed text-[#141412]/70 sm:text-lg">
            Convert, compress, generate and calculate — 145 tools that run
            entirely in your browser. Nothing uploaded, nothing installed,
            no account.
          </p>

          {/* Live tool search — the dominant hero element */}
          <div ref={searchRef} className="v5-hero-fade relative mt-9 w-full max-w-2xl">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                goTo(activeIndex < 0 ? 0 : activeIndex);
              }}
            >
              <div className="relative flex items-center gap-3 rounded-full border-2 border-[#141412] bg-white px-5 py-2 shadow-[0_18px_45px_rgba(22,22,19,0.12)] transition-shadow focus-within:shadow-[0_18px_50px_rgba(255,77,0,0.25)]">
                {!reducedMotion && (
                  <BorderBeam
                    size={140}
                    duration={6}
                    colorFrom="#ff9646"
                    colorTo="#ff4d00"
                    borderWidth={1.5}
                  />
                )}
                <Search className="h-5 w-5 shrink-0 text-[#141412]/50" aria-hidden />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  role="combobox"
                  aria-expanded={open && results.length > 0}
                  aria-controls="v5-search-list"
                  aria-activedescendant={
                    activeIndex >= 0 && results[activeIndex]
                      ? `v5-search-option-${results[activeIndex].id}`
                      : undefined
                  }
                  aria-label="Search tools"
                  autoComplete="off"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(-1);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  onKeyDown={onInputKeyDown}
                  placeholder="Search 145 tools — try “merge pdf”…"
                  className="h-14 w-full min-w-0 bg-transparent text-base text-[#141412] outline-none placeholder:text-[#141412]/40 sm:text-lg"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setActiveIndex(-1);
                      setOpen(false);
                      inputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#141412]/5 text-[#141412]/60 transition-colors hover:bg-[#141412]/10 hover:text-[#141412]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-[#141412]/15 bg-[#141412]/5 px-2 py-1 font-grotesk font-semibold text-[11px] text-[#141412]/60 sm:flex">
                  {isMac ? "⌘" : "Ctrl"} K
                </kbd>
              </div>
            </form>

            {open && results.length > 0 && (
              <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border-2 border-[#141412] bg-white text-left shadow-[0_24px_60px_rgba(22,22,19,0.18)]">
                <ul role="listbox" id="v5-search-list" aria-label="Matching tools">
                  {results.map((t, i) => (
                    <li
                      key={t.id}
                      role="option"
                      id={`v5-search-option-${t.id}`}
                      aria-selected={i === activeIndex}
                      className="border-b border-[#141412]/10 last:border-b-0"
                    >
                      <Link
                        href={`/${t.category}/${t.id}`}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`flex items-center justify-between gap-4 px-5 py-3 transition-colors ${
                          i === activeIndex
                            ? "border-l-4 border-[#ff4d00] bg-[#ff4d00]/10"
                            : "border-l-4 border-transparent hover:bg-[#141412]/[0.04]"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[#141412]">
                            {t.title}
                          </span>
                          <span className="block truncate text-xs text-[#141412]/55">
                            {CATEGORY_MAP[t.category]?.name ?? t.category}
                          </span>
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-[#ff4d00]" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/tools"
                  className="block bg-[#141412] px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#ff4d00]"
                >
                  Browse all 145 tools →
                </Link>
              </div>
            )}
            {open && query.trim().length >= 2 && results.length === 0 && (
              <div className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border-2 border-[#141412] bg-white px-5 py-4 text-left text-sm text-[#141412]/60 shadow-[0_24px_60px_rgba(22,22,19,0.18)]">
                No tool matches “{query.trim()}” yet —{" "}
                <Link href="/tools" className="font-semibold text-[#ff4d00]">
                  browse all tools
                </Link>
                .
              </div>
            )}
          </div>

          {/* One-tap popular chips */}
          <div className="v5-hero-fade mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 font-grotesk font-semibold text-[11px] uppercase tracking-[0.2em] text-[#141412]/45">
              Popular
            </span>
            {SEARCH_CHIPS.map((id) => {
              const tool = TOOL_MAP[id];
              if (!tool) return null;
              return (
                <Link
                  key={id}
                  href={`/${tool.category}/${tool.id}`}
                  className="rounded-full border border-[#141412]/20 bg-white px-4 py-2 text-sm font-medium text-[#141412]/80 transition-colors duration-200 hover:border-[#ff4d00] hover:bg-[#ff4d00] hover:text-white"
                >
                  {tool.title}
                </Link>
              );
            })}
          </div>

          <div className="v5-hero-fade mt-9 flex flex-wrap items-center gap-3">
            <Magnetic>
              <Link
                href="/tools"
                className="group inline-flex items-center gap-2 rounded-full bg-[#141412] px-7 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#ff4d00]"
              >
                Explore all tools
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Magnetic>
            <Magnetic>
              <button
                type="button"
                onClick={() => onNavigate("#how")}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#141412] bg-transparent px-7 py-3.5 text-sm font-semibold text-[#141412] transition-colors duration-300 hover:border-[#ff4d00] hover:text-[#ff4d00]"
              >
                How it works
                <ArrowDown className="h-4 w-4" />
              </button>
            </Magnetic>
          </div>
        </div>

        {/* ── Right: the toolbox in 3D ── */}
        <div className="lg:col-span-5">
          <div
            ref={canvasWrapRef}
            className="relative h-[380px] w-full overflow-hidden rounded-3xl border-2 border-[#141412] bg-white sm:h-[480px] lg:h-[600px]"
          >
            <StaticBlocks />
            {!reducedMotion && canvasMounted && (
              <div className="absolute inset-0">
                <ToolBlocksScene
                  controls={controlsRef.current}
                  compact={compact}
                  active={canvasActive}
                />
              </div>
            )}
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/85 px-4 py-1.5 font-grotesk font-semibold text-[11px] uppercase tracking-[0.18em] text-[#141412]/70 backdrop-blur">
              The toolbox, in 3D — move your cursor · scroll to turn it
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="font-grotesk font-semibold text-[11px] uppercase tracking-[0.2em] text-[#141412]/45">
              Fig. 01 — Ten toolboxes, one page
            </p>
            <p className="font-grotesk font-semibold text-[11px] uppercase tracking-[0.2em] text-[#ff4d00]">
              WebGL · 60fps
            </p>
          </div>
        </div>
      </div>

      {/* Bottom rule */}
      <div className="mx-auto max-w-7xl px-5 pb-8 sm:px-8">
        <div className="flex items-center justify-between border-t-2 border-[#141412] pt-4">
          <p className="v5-eyebrow">Scroll — the toolbox is below</p>
          <p className="v5-eyebrow hidden sm:block">
            PDF · Image · QR · Dev · +6 more
          </p>
        </div>
      </div>
    </section>
  );
}
