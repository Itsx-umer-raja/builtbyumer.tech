"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Code2,
  FileText,
  Image as ImageIcon,
  QrCode,
  Search,
  X,
} from "lucide-react";
import { AnimatedRays } from "@/components/ui/animated-rays";
import { CATEGORY_MAP } from "@/data/categories";
import { TOOLS } from "@/data/tools";
import { Magnetic } from "../home-v2/Magnetic";

const HEADLINE_LINES: Array<Array<{ text: string; accent?: boolean; serif?: boolean }>> = [
  [{ text: "Every tool" }],
  [
    { text: "you " },
    { text: "need.", accent: true, serif: true },
  ],
  [
    { text: "One " },
    { text: "destination.", serif: true },
  ],
];

/** Floating chips — real tools, gentle CSS float, desktop only. */
const CHIPS = [
  {
    title: "Merge PDF",
    href: "/pdf-tools/merge-pdf",
    icon: FileText,
    pos: "right-[6%] top-[19%]",
    rot: "3deg",
    delay: "0.4s",
  },
  {
    title: "QR Code Generator",
    href: "/qr-tools/qr-code-generator",
    icon: QrCode,
    pos: "left-[4%] top-[30%]",
    rot: "-4deg",
    delay: "1.2s",
  },
  {
    title: "Image Compressor",
    href: "/image-tools/image-compressor",
    icon: ImageIcon,
    pos: "right-[10%] top-[58%]",
    rot: "-2deg",
    delay: "2s",
  },
  {
    title: "JSON Formatter",
    href: "/developer-tools/json-formatter",
    icon: Code2,
    pos: "left-[7%] top-[64%]",
    rot: "2.5deg",
    delay: "0.8s",
  },
];

/**
 * Kinetic-type hero on light paper: huge Fraunces/Grotesk headline
 * rising word-by-word out of masks, AnimatedRays ambient layer
 * (desktop only, low opacity), a cursor spotlight (fine pointers
 * only), floating tool chips, and live search over the real
 * 145-tool registry. The headline is plain server HTML — the rise
 * is transform-only and starts on mount, never a fade-in.
 */
export function HeroV3({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

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

  // Close the search panel on outside click / Escape
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Cursor spotlight — fine pointers only, transform only, rAF lerp
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

  const goFirst = () => {
    if (results.length > 0) {
      window.location.href = `/${results[0].category}/${results[0].id}`;
    }
  };

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative flex min-h-svh flex-col justify-end overflow-hidden pb-8 pt-28 sm:pt-32"
    >
      {/* Animated rays — ambient only, desktop, low opacity */}
      <div className="pointer-events-none absolute inset-0 hidden opacity-25 md:block" aria-hidden>
        <AnimatedRays />
      </div>
      {/* Cursor spotlight — fine pointers only */}
      <div
        ref={spotRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 hidden h-[520px] w-[520px] rounded-full [@media(pointer:fine)]:block"
        style={{
          background:
            "radial-gradient(circle, rgba(255,77,0,0.10) 0%, rgba(255,77,0,0.04) 40%, transparent 70%)",
        }}
      />
      {/* Legibility fade at the bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#faf8f2] to-transparent"
        aria-hidden
      />

      {/* Floating tool chips — desktop only */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        {CHIPS.map((c) => (
          <div key={c.title} className={`absolute ${c.pos}`}>
            <div
              className="v3-float pointer-events-auto"
              style={{ "--v3-chip-rot": c.rot, animationDelay: c.delay } as CSSProperties}
            >
              <Link
                href={c.href}
                className="flex items-center gap-2 rounded-full border border-v3-line bg-white/90 px-4 py-2.5 text-sm font-semibold text-v3-ink shadow-[0_8px_24px_rgba(22,22,19,0.08)] backdrop-blur transition-colors duration-200 hover:border-v3-accent hover:text-v3-accent"
              >
                <c.icon className="h-4 w-4 text-v3-accent" />
                {c.title}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="v3-hero-fade mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="v3-eyebrow">
            <span className="v3-dot">●</span> 145 free tools — no accounts, no uploads
          </span>
          <span className="hidden h-px w-16 bg-v3-ink/25 sm:block" />
          <span className="v3-eyebrow">Runs 100% in your browser</span>
        </div>

        <h1 className="font-grotesk text-[clamp(3.1rem,11vw,10rem)] font-bold leading-[0.92] tracking-[-0.03em] text-v3-ink">
          {HEADLINE_LINES.map((line, li) => (
            <span key={li} className="block overflow-hidden pb-1">
              <span className="v3-hero-line block will-change-transform">
                {line.map((w, wi) => (
                  <span
                    key={wi}
                    className={
                      w.serif
                        ? `font-fraunces font-medium italic tracking-normal ${w.accent ? "text-v3-accent" : ""}`
                        : ""
                    }
                  >
                    {w.text}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </h1>

        <p className="v3-hero-fade mt-6 max-w-md text-base leading-relaxed text-v3-muted sm:text-lg">
          Merge PDFs, compress images, generate QR codes, format JSON —
          ten toolboxes, one address. Your files never leave your device.
        </p>

        {/* Live tool search */}
        <div ref={searchRef} className="v3-hero-fade relative mt-8 max-w-xl">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              goFirst();
            }}
          >
            <div className="flex items-center gap-3 rounded-full border border-v3-line bg-white px-5 py-1.5 shadow-[0_10px_30px_rgba(22,22,19,0.07)] transition-colors focus-within:border-v3-accent">
              <Search className="h-5 w-5 shrink-0 text-v3-muted" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Search 145 tools — try “merge pdf”…"
                aria-label="Search tools"
                className="h-11 w-full min-w-0 bg-transparent text-base text-v3-ink outline-none placeholder:text-v3-muted/70"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setOpen(false);
                  }}
                  aria-label="Clear search"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-v3-ink/5 text-v3-muted transition-colors hover:bg-v3-ink/10 hover:text-v3-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {open && results.length > 0 && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-v3-line bg-white shadow-[0_20px_50px_rgba(22,22,19,0.14)]">
              <ul>
                {results.map((t) => (
                  <li key={t.id} className="border-b border-v3-line/60 last:border-b-0">
                    <Link
                      href={`/${t.category}/${t.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-v3-bg"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-v3-ink">
                          {t.title}
                        </span>
                        <span className="block truncate text-xs text-v3-muted">
                          {CATEGORY_MAP[t.category]?.name ?? t.category}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-v3-accent" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/tools"
                className="block bg-v3-bg px-5 py-3 text-center text-sm font-semibold text-v3-accent transition-colors hover:bg-v3-accent hover:text-white"
              >
                Browse all 145 tools →
              </Link>
            </div>
          )}
          {open && query.trim().length >= 2 && results.length === 0 && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-v3-line bg-white px-5 py-4 text-sm text-v3-muted shadow-[0_20px_50px_rgba(22,22,19,0.14)]">
              No tool matches “{query.trim()}” yet —{" "}
              <Link href="/tools" className="font-semibold text-v3-accent">
                browse all tools
              </Link>
              .
            </div>
          )}
        </div>

        <div className="v3-hero-fade mt-8 flex flex-wrap items-center gap-3">
          <Magnetic>
            <Link
              href="/tools"
              className="group inline-flex items-center gap-2 rounded-full bg-v3-accent px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-v3-accent-2"
            >
              Explore all 145 tools
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Magnetic>
          <Magnetic>
            <button
              type="button"
              onClick={() => onNavigate("#categories")}
              className="inline-flex items-center gap-2 rounded-full border border-v3-ink/25 bg-white/60 px-6 py-3.5 text-sm font-semibold text-v3-ink transition-colors duration-300 hover:border-v3-ink/60 hover:bg-white"
            >
              Browse categories
              <ArrowDown className="h-4 w-4" />
            </button>
          </Magnetic>
        </div>

        <div className="v3-hero-fade mt-10 flex items-center justify-between border-t border-v3-line pt-4">
          <p className="v3-eyebrow">Scroll — the toolbox is below</p>
          <p className="v3-eyebrow hidden sm:block">
            PDF <span className="text-v3-accent">·</span> Image{" "}
            <span className="text-v3-accent">·</span> QR{" "}
            <span className="text-v3-accent">·</span> Dev{" "}
            <span className="text-v3-accent">·</span> +6 more
          </p>
          <div className="v3-spin-slow flex h-10 w-10 items-center justify-center rounded-full border border-v3-ink/25 font-fraunces text-lg italic text-v3-accent">
            ↓
          </div>
        </div>
      </div>
    </section>
  );
}
