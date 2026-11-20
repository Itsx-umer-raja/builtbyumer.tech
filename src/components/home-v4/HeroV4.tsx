"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Code2,
  FileText,
  Image as ImageIcon,
  QrCode,
  Search,
  Sun,
  X,
} from "lucide-react";
import { CATEGORY_MAP } from "@/data/categories";
import { TOOLS, TOOL_MAP } from "@/data/tools";
import { BorderBeam } from "@/components/ui/border-beam";
import { Magnetic } from "../home-v2/Magnetic";

/**
 * Synthora hero media (MotionSites "Synthora Hero" prompt — the
 * design authority for this page). The molten-orange ring is real
 * media: a still plate underneath, a muted 4s loop laid over it
 * with identical sizing. Nothing in the glow is drawn or animated
 * in code. If the video fails, the plate stays; if the plate fails
 * too, the ember floor gradient underneath remains.
 */
const GLOW_PLATE =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/7e2a7695-c32b-4179-9c90-cae865819272.jpg";
const GLOW_VIDEO =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/6ad9485f-ab40-444b-bd3c-40dcb9bd0e2f.mp4";

const HEADLINE_LINES: Array<Array<{ text: string; ember?: boolean }>> = [
  [{ text: "Every tool" }],
  [
    { text: "you " },
    { text: "need.", ember: true },
  ],
  [
    { text: "One " },
    { text: "destination.", ember: true },
  ],
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

/** Floating tool chips drifting over the ring (desktop only). */
const FLOAT_CHIPS = [
  {
    id: "merge-pdf",
    icon: FileText,
    className: "left-[4%] bottom-[26%]",
    duration: "6s",
    delay: "0s",
  },
  {
    id: "image-compressor",
    icon: ImageIcon,
    className: "left-[11%] bottom-[13%]",
    duration: "7s",
    delay: "1.2s",
  },
  {
    id: "qr-code-generator",
    icon: QrCode,
    className: "right-[4%] bottom-[29%]",
    duration: "6.5s",
    delay: "0.6s",
  },
  {
    id: "json-formatter",
    icon: Code2,
    className: "right-[11%] bottom-[15%]",
    duration: "7.5s",
    delay: "1.8s",
  },
];

/**
 * Synthora hero for BuiltByUmer: pure black page, the molten-orange
 * ring rising from the bottom edge, centred Anta headline, ember-glass
 * badge and buttons — and the live search as the dominant element,
 * with full keyboard navigation (Ctrl/⌘K to focus, ↑↓ to move,
 * Enter to open, Esc to close). The headline is plain server HTML —
 * the rise is transform-only and starts on mount, never a fade-in.
 */
export function HeroV4({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    setIsMac(/Mac|iPhone|iPad/.test(window.navigator.platform));
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

  // Cursor glow — fine pointers only, transform only, rAF lerp
  useEffect(() => {
    const section = sectionRef.current;
    const spot = spotRef.current;
    if (!section || !spot) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = { x: -600, y: -600 };
    const pos = { x: -600, y: -600 };
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = section.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
    };
    const loop = () => {
      pos.x += (target.x - pos.x) * 0.12;
      pos.y += (target.y - pos.y) * 0.12;
      spot.style.transform = `translate(${pos.x - 260}px, ${pos.y - 260}px)`;
      raf = requestAnimationFrame(loop);
    };
    section.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      section.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

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
      className="relative flex min-h-svh flex-col overflow-hidden bg-black"
    >
      {/* Ember floor gradient under the glow (Synthora spec) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[42%] opacity-70"
        style={{
          background:
            "linear-gradient(to top, rgb(255,150,40) 0%, rgba(160,50,0,0.45) 38%, transparent 100%)",
        }}
        aria-hidden
      />
      {/* The burning ring — real media, pinned to the bottom edge */}
      <div className="v4-glow z-[1]" aria-hidden>
        {!imgFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={GLOW_PLATE}
            alt=""
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover object-bottom"
          />
        )}
        {!reducedMotion && !videoFailed && (
          <video
            className={`v4-glow-video absolute inset-0 h-full w-full object-cover object-bottom ${videoReady ? "is-ready" : ""}`}
            src={GLOW_VIDEO}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            onLoadedData={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
          />
        )}
      </div>
      {/* Cursor glow — fine pointers only */}
      <div
        ref={spotRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-[2] hidden h-[520px] w-[520px] rounded-full [@media(pointer:fine)]:block"
        style={{
          background:
            "radial-gradient(circle, rgba(255,150,70,0.14) 0%, rgba(255,150,70,0.05) 40%, transparent 70%)",
        }}
      />
      {/* Floating tool chips drifting over the ring — desktop only */}
      {FLOAT_CHIPS.map((c) => {
        const tool = TOOL_MAP[c.id];
        if (!tool) return null;
        return (
          <Link
            key={c.id}
            href={`/${tool.category}/${tool.id}`}
            aria-label={`Open ${tool.title}`}
            className={`v4-float absolute z-10 hidden items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 py-2.5 text-sm font-medium text-white/90 backdrop-blur-md transition-colors duration-300 hover:border-[#ff9646] hover:text-white lg:flex ${c.className}`}
            style={{ animationDuration: c.duration, animationDelay: c.delay }}
          >
            <c.icon className="h-4 w-4 text-[#ff9646]" aria-hidden />
            {tool.title}
          </Link>
        );
      })}
      {/* Legibility fade behind the bottom bar */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/70 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-5 pb-44 pt-28 text-center sm:px-8 sm:pb-56">
        {/* Ember-glass badge */}
        <div
          className="v4-badge inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium text-white/90 will-change-transform"
          style={{
            background: "rgba(220,110,40,.16)",
            border: "1px solid rgba(255,150,70,.3)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-[#030103]">
            145 tools
          </span>
          <span>No signup · No upload</span>
          <Sun className="h-4 w-4 text-[#FAD53E]" aria-hidden />
        </div>

        <h1 className="mt-7 font-anta text-[clamp(2.7rem,8.5vw,7.5rem)] leading-[1.04] tracking-[0.01em] text-white">
          {HEADLINE_LINES.map((line, li) => (
            <span key={li} className="block overflow-hidden pb-1">
              <span className="v4-hero-line block will-change-transform">
                {line.map((w, wi) =>
                  w.ember ? (
                    <span
                      key={wi}
                      className="bg-gradient-to-r from-[#ff9646] via-[#ff6a1a] to-[#ff4d00] bg-clip-text text-transparent"
                    >
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

        <p className="v4-hero-fade mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
          145 free browser-based tools — convert documents, compress images,
          create QR codes and simplify everyday digital work. No accounts,
          no uploads.
        </p>

        {/* Live tool search — the dominant hero element */}
        <div ref={searchRef} className="v4-hero-fade relative mt-10 w-full max-w-2xl">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              goTo(activeIndex < 0 ? 0 : activeIndex);
            }}
          >
            <div className="relative flex items-center gap-3 rounded-full border border-white/20 bg-white/[0.07] px-5 py-2 shadow-[0_0_60px_rgba(255,77,0,0.18)] backdrop-blur-md transition-colors focus-within:border-[#ff9646] focus-within:shadow-[0_0_70px_rgba(255,77,0,0.3)]">
              {!reducedMotion && (
                <BorderBeam
                  size={140}
                  duration={6}
                  colorFrom="#ff9646"
                  colorTo="#ff4d00"
                  borderWidth={1.5}
                />
              )}
              <Search className="h-5 w-5 shrink-0 text-white/50" aria-hidden />
              <input
                ref={inputRef}
                type="search"
                value={query}
                role="combobox"
                aria-expanded={open && results.length > 0}
                aria-controls="v4-search-list"
                aria-activedescendant={
                  activeIndex >= 0 && results[activeIndex]
                    ? `v4-search-option-${results[activeIndex].id}`
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
                className="h-14 w-full min-w-0 bg-transparent text-base text-white outline-none placeholder:text-white/40 sm:text-lg"
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
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-white/15 bg-white/5 px-2 py-1 font-mono text-[11px] text-white/60 sm:flex">
                {isMac ? "⌘" : "Ctrl"} K
              </kbd>
            </div>
          </form>

          {open && results.length > 0 && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] text-left shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
              <ul role="listbox" id="v4-search-list" aria-label="Matching tools">
                {results.map((t, i) => (
                  <li
                    key={t.id}
                    role="option"
                    id={`v4-search-option-${t.id}`}
                    aria-selected={i === activeIndex}
                    className="border-b border-white/[0.06] last:border-b-0"
                  >
                    <Link
                      href={`/${t.category}/${t.id}`}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex items-center justify-between gap-4 px-5 py-3 transition-colors ${
                        i === activeIndex
                          ? "border-l-2 border-[#ff4d00] bg-white/10"
                          : "border-l-2 border-transparent hover:bg-white/5"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">
                          {t.title}
                        </span>
                        <span className="block truncate text-xs text-white/50">
                          {CATEGORY_MAP[t.category]?.name ?? t.category}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[#ff9646]" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/tools"
                className="block bg-white/[0.04] px-5 py-3 text-center text-sm font-semibold text-[#ff9646] transition-colors hover:bg-[#ff4d00] hover:text-white"
              >
                Browse all 145 tools →
              </Link>
            </div>
          )}
          {open && query.trim().length >= 2 && results.length === 0 && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-white/10 bg-[#0c0c0c] px-5 py-4 text-left text-sm text-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
              No tool matches “{query.trim()}” yet —{" "}
              <Link href="/tools" className="font-semibold text-[#ff9646]">
                browse all tools
              </Link>
              .
            </div>
          )}
        </div>

        {/* One-tap popular chips */}
        <div className="v4-hero-fade mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
            Popular
          </span>
          {SEARCH_CHIPS.map((id) => {
            const tool = TOOL_MAP[id];
            if (!tool) return null;
            return (
              <Link
                key={id}
                href={`/${tool.category}/${tool.id}`}
                className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 backdrop-blur transition-colors duration-200 hover:border-[#ff9646] hover:bg-white/[0.08] hover:text-white"
              >
                {tool.title}
              </Link>
            );
          })}
        </div>

        <div className="v4-hero-fade mt-9 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <Link
              href="/tools"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#030103] transition-shadow duration-300 hover:shadow-[0_0_40px_rgba(255,77,0,0.45)]"
            >
              Explore tools
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Magnetic>
          <Magnetic>
            <button
              type="button"
              onClick={() => onNavigate("#how")}
              className="v4-glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[rgba(255,150,70,0.32)]"
            >
              How it works
              <ArrowDown className="h-4 w-4" />
            </button>
          </Magnetic>
        </div>
      </div>

      {/* Bottom bar over the ring */}
      <div className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 pb-5 sm:px-8">
        <p className="v4-eyebrow">Scroll — the toolbox is below</p>
        <p className="v4-eyebrow hidden sm:block">
          PDF <span className="text-[#ff9646]">·</span> Image{" "}
          <span className="text-[#ff9646]">·</span> QR{" "}
          <span className="text-[#ff9646]">·</span> Dev{" "}
          <span className="text-[#ff9646]">·</span> +6 more
        </p>
        <div className="v4-spin-slow flex h-10 w-10 items-center justify-center rounded-full border border-white/25 font-anta text-lg text-[#ff9646]">
          ↓
        </div>
      </div>
    </section>
  );
}
