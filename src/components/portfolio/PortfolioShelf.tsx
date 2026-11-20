"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORIES, type Category } from "@/data/categories";
import { TOOLS } from "@/data/tools";

/**
 * ToolArchiveShelf — the filmography-style shelf, rebuilt as a tool archive.
 * Every tape is a BuiltByUmer tool category; the turned tape faces you with
 * its cover, and opening a record lists every tool inside that category.
 */

const COPIES = 3;
const N = CATEGORIES.length;
const TOTAL = N * COPIES;
const SAFE_LOW = N;
const SAFE_HIGH = N * 2;

const EASE = "cubic-bezier(.2,.8,.2,1)";
const OPEN_EASE = "cubic-bezier(.76,0,.18,1)";

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

/** Shortest signed distance between two entry indexes on the ring. */
function ringDelta(from: number, to: number) {
  return ((((to - from) % N) + N + N / 2) % N) - N / 2;
}

interface TapeLayout {
  H: number;
  ws: number;
  d: number;
  gap: number;
}

function computeLayout(): TapeLayout {
  const isMobile = window.matchMedia("(max-width: 820px)").matches;
  const H = isMobile
    ? Math.min(window.innerWidth * 0.6, window.innerHeight * 0.4)
    : Math.min(window.innerHeight * 0.46, window.innerWidth * 0.31);
  return {
    H,
    ws: (H * 142) / 840,
    d: (H * 474) / 900,
    gap: H * 0.03,
  };
}

interface ToolRecord extends Category {
  count: number;
  tint: string;
  paper: string;
}

/** Aged tape-shell colours, cycled so the shelf reads like a worn rack. */
const TINTS: Array<{ tint: string; paper: string }> = [
  { tint: "#2e4436", paper: "#e9e2d0" },
  { tint: "#33312e", paper: "#ece5d3" },
  { tint: "#7d3a2d", paper: "#eae0cc" },
  { tint: "#33506b", paper: "#e7e4d6" },
  { tint: "#4a5a3a", paper: "#ede6d2" },
  { tint: "#55504a", paper: "#ebe4d0" },
  { tint: "#1f3fb0", paper: "#e9e2d0" },
  { tint: "#5c4a3a", paper: "#ece4d1" },
  { tint: "#243d3d", paper: "#e8e1cf" },
  { tint: "#5a3a50", paper: "#ebe3d1" },
];

const RECORDS: ToolRecord[] = CATEGORIES.map((c, i) => ({
  ...c,
  count: TOOLS.filter((t) => t.category === c.slug).length,
  tint: TINTS[i % TINTS.length].tint,
  paper: TINTS[i % TINTS.length].paper,
}));

function toolsOf(slug: string) {
  return TOOLS.filter((t) => t.category === slug);
}

/* ── Cover artwork (shared by the tape face and the detail sheet) ── */

function CoverArt({ record }: { record: ToolRecord }) {
  return (
    <div
      className="vhs-cover-art"
      style={{ background: record.paper, ["--tint" as string]: record.tint }}
      aria-hidden
    >
      <p className="vhs-cover-kicker">A BuiltByUmer tool</p>
      <div className="vhs-cover-title">
        <span>{record.name}</span>
      </div>
      <div
        className="vhs-cover-artwork"
        style={{ backgroundImage: `url(/images/tools/${record.slug}.svg)` }}
      />
      <div className="vhs-cover-foot">
        <span className="vhs-cover-brand">UMER</span>
        <span className="vhs-cover-badge">FREE</span>
      </div>
      <style href="st-toolarchive-cover" precedence="high" dangerouslySetInnerHTML={{ __html: `
        .vhs-cover-art {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          padding: calc(var(--vhs-w, 190px) * 0.09);
          --ink: #17150f;
        }
        .vhs-cover-art::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(105deg, rgba(0,0,0,.08) 0%, transparent 22%, transparent 78%, rgba(0,0,0,.1) 100%),
            radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,.35), transparent 60%);
          pointer-events: none;
        }
        .vhs-cover-kicker {
          position: relative;
          font-size: calc(var(--vhs-w, 190px) * 0.052);
          font-weight: 600;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--ink);
          opacity: 0.75;
          margin: 0;
        }
        .vhs-cover-title {
          position: relative;
          margin-top: calc(var(--vhs-w, 190px) * 0.06);
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 700;
          font-size: calc(var(--vhs-w, 190px) * 0.17);
          line-height: 1.04;
          letter-spacing: -0.01em;
          text-transform: uppercase;
          color: var(--ink);
          transform: scaleY(1.06);
          transform-origin: top left;
        }
        .vhs-cover-artwork {
          position: relative;
          flex: 1;
          margin-top: calc(var(--vhs-w, 190px) * 0.08);
          border: 1px solid rgba(23, 21, 15, 0.55);
          background-size: cover;
          background-position: center;
          filter: grayscale(1) sepia(0.28) contrast(1.12) brightness(1.02);
          mix-blend-mode: multiply;
        }
        .vhs-cover-foot {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: calc(var(--vhs-w, 190px) * 0.08);
          color: var(--ink);
        }
        .vhs-cover-brand {
          font-size: calc(var(--vhs-w, 190px) * 0.06);
          font-weight: 700;
          letter-spacing: 0.3em;
        }
        .vhs-cover-badge {
          font-size: calc(var(--vhs-w, 190px) * 0.055);
          font-weight: 700;
          letter-spacing: 0.14em;
          border: 1px solid var(--ink);
          padding: 0.2em 0.5em;
          border-radius: 2px;
        }
      ` }} />
    </div>
  );
}

/* ── Custom circular cursor ───────────────────────────────── */

type CursorMode = "default" | "tape" | "open" | "button";

function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    // Reading the pointer capability is an external-system check; the state
    // mirrors it once on mount so the cursor only renders on fine pointers.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFine(mq.matches);
    if (!mq.matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let x = -100;
    let y = -100;
    let tx = -100;
    let ty = -100;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const el = e.target as HTMLElement | null;
      const mode: CursorMode = el?.closest("[data-cursor='open']")
        ? "open"
        : el?.closest("[data-cursor='tape']")
          ? "tape"
          : el?.closest("[data-cursor='button']")
            ? "button"
            : "default";
      const c = ref.current;
      if (c) c.dataset.mode = mode;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const tick = () => {
      const k = reduced ? 1 : 0.22;
      x += (tx - x) * k;
      y += (ty - y) * k;
      const c = ref.current;
      if (c) c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!fine) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className="vhs-cursor pointer-events-none fixed left-0 top-0 z-[80]"
      data-mode="default"
    >
      <style href="st-toolarchive-cursor" precedence="high" dangerouslySetInnerHTML={{ __html: `
        .vhs-cursor {
          width: 58px;
          height: 58px;
        }
        .vhs-cursor::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 999px;
          border: 1.5px solid #141414;
          background: transparent;
          transition: all 0.22s ${EASE};
        }
        .vhs-cursor[data-mode="tape"]::before,
        .vhs-cursor[data-mode="button"]::before {
          inset: 17px;
        }
        .vhs-cursor[data-mode="open"]::before {
          inset: 0;
          border-color: #1f3fb0;
          background: #1f3fb0;
        }
        .vhs-cursor[data-mode="open"]::after {
          content: "OPEN";
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-family: var(--font-inter-tight), sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #f4f2ed;
        }
        @media (prefers-reduced-motion: reduce) {
          .vhs-cursor::before {
            transition: none;
          }
        }
      ` }} />
    </div>
  );
}

/* ── Caption with mask reveals ────────────────────────────── */

function Caption({ record }: { record: ToolRecord }) {
  return (
    <div className="mt-10 text-center">
      <div className="overflow-hidden">
        <h2
          key={`t-${record.slug}`}
          className="vhs-mask-slide font-serif text-3xl text-[#141414] sm:text-4xl"
        >
          {record.name}
        </h2>
      </div>
      <div className="overflow-hidden">
        <p
          key={`c-${record.slug}`}
          className="vhs-mask-slide-slow text-[13px] font-medium uppercase tracking-[.18em] text-[#6D6A63]"
          style={{ animationDelay: "90ms" }}
        >
          {record.count} tools · free · runs in your browser
        </p>
      </div>
      <style href="st-toolarchive-caption" precedence="high" dangerouslySetInnerHTML={{ __html: `
        .vhs-mask-slide {
          animation: vhs-rise 650ms ${EASE} both;
        }
        .vhs-mask-slide-slow {
          animation: vhs-rise 650ms ${EASE} both;
        }
        @keyframes vhs-rise {
          from {
            transform: translateY(110%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .vhs-mask-slide,
          .vhs-mask-slide-slow {
            animation: none;
          }
        }
      ` }} />
    </div>
  );
}

/* ── Detail overlay (Web Animations API) ──────────────────── */

function DetailOverlay({
  record,
  rect,
  onClose,
}: {
  record: ToolRecord;
  rect: DOMRect;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const tools = useMemo(() => toolsOf(record.slug), [record.slug]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Expand from the selected tape's cover rect to the full viewport.
    const anim = panel.animate(
      [
        {
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          borderRadius: "8px",
        },
        {
          top: "0px",
          left: "0px",
          width: `${vw}px`,
          height: `${vh}px`,
          borderRadius: "0px",
        },
      ],
      { duration: 1050, easing: OPEN_EASE, fill: "forwards" },
    );
    return () => anim.cancel();
  }, [rect]);

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    const panel = panelRef.current;
    if (!panel) return onClose();
    const anim = panel.animate(
      [
        { top: "0px", left: "0px", width: "100vw", height: "100vh", borderRadius: "0px" },
        {
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          borderRadius: "8px",
        },
      ],
      { duration: 850, easing: OPEN_EASE, fill: "forwards" },
    );
    anim.onfinish = () => onClose();
    anim.oncancel = () => onClose();
  }, [closing, onClose, rect]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={record.name}>
      <div
        className="absolute inset-0 bg-[#141414]/40"
        style={{ opacity: closing ? 0 : 1, transition: `opacity 500ms ${EASE}` }}
        onClick={close}
        aria-hidden
      />
      <div
        ref={panelRef}
        className="absolute overflow-hidden bg-[#F4F2ED] shadow-2xl"
        style={{ top: 0, left: 0, width: "100vw", height: "100vh" }}
      >
        <div className="vhs-sheet-inner mx-auto flex h-full max-w-5xl flex-col overflow-y-auto px-6 pb-12 pt-8 sm:px-12">
          <div className="flex items-center justify-between border-b border-[#141414]/20 pb-5">
            <span className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#1F3FB0]">
              BuiltByUmer · Tool archive
            </span>
            <button
              type="button"
              onClick={close}
              data-cursor="button"
              className="rounded-full border border-[#141414]/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[.14em] text-[#141414] transition hover:bg-[#141414] hover:text-[#F4F2ED]"
            >
              Close
            </button>
          </div>

          <div className="mt-8 grid gap-10 md:grid-cols-[1fr_1.15fr]">
            <div className="vhs-ink-reveal">
              <div
                role="img"
                aria-label={`${record.name} cover artwork`}
                className="relative aspect-[347/659] w-full max-w-sm rounded-sm shadow-xl overflow-hidden"
                style={{ ["--vhs-w" as string]: "320px" }}
              >
                <CoverArt record={record} />
              </div>
            </div>

            <div>
              <div className="overflow-hidden">
                <p
                  className="vhs-mask-slide text-[11px] font-semibold uppercase tracking-[.22em] text-[#6D6A63]"
                  style={{ animationDelay: "300ms" }}
                >
                  {record.slug} · {record.count} tools
                </p>
              </div>
              <div className="overflow-hidden">
                <h2
                  className="vhs-ink-title vhs-mask-slide mt-3 font-serif text-4xl text-[#141414] sm:text-5xl"
                  style={{ animationDelay: "380ms" }}
                >
                  {record.name}
                </h2>
              </div>
              <div className="overflow-hidden">
                <p
                  className="vhs-mask-slide mt-5 max-w-md font-serif text-[15px] leading-relaxed text-[#141414]/85"
                  style={{ animationDelay: "480ms" }}
                >
                  {record.description}
                </p>
              </div>

              <div className="vhs-mask-slide mt-7" style={{ animationDelay: "560ms" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#6D6A63]">
                  On this tape — {record.count} tools
                </p>
                <ul className="vhs-tool-list mt-3 max-h-[38vh] overflow-y-auto pr-2">
                  {tools.map((t, i) => (
                    <li key={t.id}>
                      <Link
                        href={`/${record.slug}/${t.id}`}
                        data-cursor="button"
                        className="group flex items-baseline gap-3 border-b border-[#141414]/10 py-2.5 transition hover:bg-[#141414]/[0.04]"
                      >
                        <span className="w-6 flex-none font-mono text-[10px] text-[#6D6A63]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 text-sm font-medium text-[#141414]">{t.title}</span>
                        <span className="text-[#1F3FB0] opacity-0 transition group-hover:opacity-100">↗</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={`/${record.slug}`}
                  data-cursor="button"
                  className="inline-block rounded-md bg-[#1F3FB0] px-5 py-2.5 text-xs font-semibold uppercase tracking-[.16em] text-[#F4F2ED] transition hover:-translate-y-px"
                >
                  Open the {record.name} shelf →
                </Link>
                <Link
                  href="/tools"
                  data-cursor="button"
                  className="text-xs font-semibold uppercase tracking-[.14em] text-[#141414]/70 hover:text-[#141414] hover:underline underline-offset-4"
                >
                  All {TOOLS.length} tools
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Ragged ink reveal filter */}
        <svg className="absolute h-0 w-0" aria-hidden focusable="false">
          <filter id="vhs-ink">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.05" numOctaves="3" result="noise" seed="7" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        <style href="st-toolarchive-ink" precedence="high" dangerouslySetInnerHTML={{ __html: `
          .vhs-ink-title {
            filter: url(#vhs-ink);
            animation-fill-mode: both;
          }
          .vhs-ink-reveal {
            animation: vhs-ink-in 900ms ${EASE} both;
            animation-delay: 250ms;
          }
          @keyframes vhs-ink-in {
            from {
              opacity: 0;
              filter: url(#vhs-ink) blur(6px);
            }
            to {
              opacity: 1;
              filter: none;
            }
          }
          .vhs-tool-list {
            scrollbar-width: thin;
            scrollbar-color: rgba(20, 20, 20, 0.3) transparent;
          }
          .vhs-tool-list::-webkit-scrollbar {
            width: 6px;
          }
          .vhs-tool-list::-webkit-scrollbar-thumb {
            background: rgba(20, 20, 20, 0.25);
            border-radius: 999px;
          }
          @media (prefers-reduced-motion: reduce) {
            .vhs-mask-slide,
            .vhs-ink-reveal {
              animation: none !important;
            }
            .vhs-ink-title {
              filter: none;
            }
          }
        ` }} />
      </div>
    </div>
  );
}

/* ── Main shelf experience ────────────────────────────────── */

export function PortfolioShelf() {
  const shelfRef = useRef<HTMLDivElement>(null);
  const tapesRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const layoutRef = useRef<TapeLayout>({ H: 320, ws: 54, d: 168, gap: 9.6 });
  const sRef = useRef(N + 0.0); // virtual scroll position, kept in [N, 2N)
  const tRef = useRef(N + 0.0); // spring target
  const draggingRef = useRef(false);
  const hoverRef = useRef<number | null>(null);
  const [sel, setSel] = useState(0);
  const selRef = useRef(0);
  const [detail, setDetail] = useState<{ record: ToolRecord; rect: DOMRect } | null>(null);

  // Measure layout on resize and expose geometry as CSS vars for the tape faces.
  useEffect(() => {
    const measure = () => {
      const l = computeLayout();
      layoutRef.current = l;
      const root = document.documentElement;
      root.style.setProperty("--vhs-h", `${l.H.toFixed(1)}px`);
      root.style.setProperty("--vhs-ws", `${l.ws.toFixed(1)}px`);
      root.style.setProperty("--vhs-w", `${l.d.toFixed(1)}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // The single rAF loop driving the shelf.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let inView = true;

    const io = new IntersectionObserver(([en]) => (inView = en.isIntersecting));
    if (shelfRef.current) io.observe(shelfRef.current);

    const tick = (now: number) => {
      if (inView) {
        const dt = Math.min(64, now - last);
        const k = draggingRef.current ? 18 : reduced ? 30 : 5.2;
        const s = sRef.current;
        const T = tRef.current;
        let next = s + (T - s) * (1 - Math.exp(-k * (dt / 1000)));
        if (Math.abs(T - next) < 1e-4) next = T;
        // Normalise into the safe middle band so wrapping stays offscreen.
        while (next < SAFE_LOW) next += N;
        while (next >= SAFE_HIGH) next -= N;
        sRef.current = next;

        const { H, ws, d, gap } = layoutRef.current;
        const step = ws + gap;
        const shelf = shelfRef.current;
        const shelfW = shelf ? shelf.clientWidth : window.innerWidth;
        const centerX = shelfW / 2 - ws / 2;

        const selIdx = Math.round(next);
        const newSel = mod(selIdx, N);
        if (newSel !== selRef.current) {
          selRef.current = newSel;
          setSel(newSel);
        }

        const hoverIdx = hoverRef.current;
        const pushSpan = Math.max(0, d - ws);

        for (let i = 0; i < TOTAL; i++) {
          const el = tapesRef.current.get(i);
          if (!el) continue;
          const rel = i - next;
          if (Math.abs(rel) > 8) {
            el.style.visibility = "hidden";
            continue;
          }
          el.style.visibility = "visible";

          const entryIdx = mod(i, N);
          const isSelected = entryIdx === newSel && Math.abs(rel) < 0.5;
          const w = Math.max(0, 1 - Math.abs(i - next) * 0.45);

          // Neighbour push while a tape is turned.
          const dir = Math.sign(rel) || 1;
          const push = pushSpan * 0.55 * w * (isSelected ? 1 : 0.85);

          const rot = isSelected ? -85.5 * Math.min(1, w) : 0;
          const lift = hoverIdx === i && !isSelected ? -H * 0.045 : 0;
          const forward = isSelected ? H * 0.2 * w : 0;
          const rise = isSelected ? -H * 0.03 * w : 0;
          const tilt = isSelected ? -4.5 * w : 0;

          el.style.transform =
            `translate3d(${(centerX + rel * step + dir * push * (rel === 0 ? 0 : 1)).toFixed(2)}px, ` +
            `${(lift + rise).toFixed(2)}px, ${forward.toFixed(2)}px) ` +
            `rotateY(${rot.toFixed(2)}deg) rotateX(${tilt.toFixed(2)}deg)`;
          el.style.zIndex = String(1000 - Math.round(Math.abs(rel) * 10));

          // Cover shading follows how angled the tape is.
          const shade = 0.08 + Math.min(1, Math.abs(rot) / 90) * (Math.abs(rot) > 60 ? 0.05 : 0.3);
          const coverShade = el.querySelector<HTMLElement>(".vhs-shade");
          if (coverShade) coverShade.style.opacity = shade.toFixed(3);
          const spineShade = el.querySelector<HTMLElement>(".vhs-spine-shade");
          if (spineShade) spineShade.style.opacity = (isSelected ? 0.45 * (1 - w) + 0.05 : 0.05).toFixed(3);

          el.dataset.selected = isSelected ? "true" : "false";
        }
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const navigate = useCallback((delta: number) => {
    tRef.current = Math.round(tRef.current) + delta;
  }, []);

  const goToEntry = useCallback((entryIdx: number) => {
    const cur = Math.round(sRef.current);
    const curEntry = mod(cur, N);
    const delta = ringDelta(curEntry, entryIdx);
    tRef.current = cur + delta;
  }, []);

  const openSelected = useCallback(() => {
    const idx = selRef.current;
    const record = RECORDS[idx];
    if (!record) return;
    // Find a rendered tape element for this record (any copy) to anchor the open animation.
    for (let i = 0; i < TOTAL; i++) {
      const el = tapesRef.current.get(i);
      if (el && mod(i, N) === idx && el.dataset.selected === "true") {
        const cover = el.querySelector<HTMLElement>(".vhs-cover-face");
        const rect = (cover ?? el).getBoundingClientRect();
        setDetail({ record, rect });
        return;
      }
    }
    setDetail({ record, rect: new DOMRect(window.innerWidth / 2 - 120, window.innerHeight / 2 - 180, 240, 360) });
  }, []);

  // Wheel / drag / keyboard / touch.
  useEffect(() => {
    const shelf = shelfRef.current;
    if (!shelf) return;

    const onWheel = (e: WheelEvent) => {
      if (detail) return;
      e.preventDefault();
      tRef.current += e.deltaY * 0.0035;
    };
    shelf.addEventListener("wheel", onWheel, { passive: false });

    let startX = 0;
    let startS = 0;
    let moved = 0;
    const onDown = (e: PointerEvent) => {
      if (detail) return;
      if ((e.target as HTMLElement).closest("[data-cursor='button']")) return;
      startX = e.clientX;
      startS = tRef.current;
      moved = 0;
      draggingRef.current = true;
    };
    const onMoveDrag = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const { ws, gap } = layoutRef.current;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      tRef.current = startS - dx / (ws + gap);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      // Snap to the nearest tape unless it was a click on a tape.
      if (moved < 6) return;
      tRef.current = Math.round(tRef.current);
    };
    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest(".vhs-tape") as HTMLElement | null;
      if (el?.dataset.index) hoverRef.current = Number(el.dataset.index);
      else hoverRef.current = null;
    };
    const onLeave = () => {
      hoverRef.current = null;
    };

    const onClick = (e: MouseEvent) => {
      if (moved >= 6) return;
      const tapeEl = (e.target as HTMLElement).closest(".vhs-tape") as HTMLElement | null;
      if (!tapeEl?.dataset.index) return;
      const idx = Number(tapeEl.dataset.index);
      const entryIdx = mod(idx, N);
      if (entryIdx === selRef.current && tapeEl.dataset.selected === "true") {
        openSelected();
      } else {
        goToEntry(entryIdx);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (detail) return;
      if (e.key === "ArrowLeft") navigate(-1);
      else if (e.key === "ArrowRight") navigate(1);
      else if (e.key === "Enter") openSelected();
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMoveDrag);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointerover", onOver);
    window.addEventListener("pointerleave", onLeave);
    shelf.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);

    return () => {
      shelf.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMoveDrag);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerleave", onLeave);
      shelf.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [detail, navigate, goToEntry, openSelected]);

  const record = RECORDS[sel] ?? RECORDS[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#EDEBE6] text-[#141414]">
      <CustomCursor />

      {/* ── Masthead ── */}
      <header className="mx-auto max-w-6xl px-6 pt-10 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#141414]/90 pb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.3em] text-[#6D6A63]">
              BuiltByUmer
            </p>
            <h1 className="mt-2 font-serif text-4xl leading-none tracking-tight sm:text-6xl">
              The Tool Archive
            </h1>
          </div>
          <div className="max-w-xs text-right">
            <p className="text-[13px] leading-relaxed text-[#6D6A63]">
              Every tool, filed like tapes on a shelf — one tape per category. Drag, scroll or use
              the arrow keys. Press Enter to open a record and see its tools.
            </p>
          </div>
        </div>

        {/* Jump-to tabs: one per shelf */}
        <div className="mt-6 flex flex-wrap gap-2">
          {RECORDS.map((r, i) => (
            <button
              key={r.slug}
              type="button"
              data-cursor="button"
              onClick={() => goToEntry(i)}
              className={
                "rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[.14em] transition " +
                (sel === i
                  ? "border-[#141414] bg-[#141414] text-[#F4F2ED]"
                  : "border-[#141414]/25 text-[#6D6A63] hover:border-[#141414] hover:text-[#141414]")
              }
            >
              {r.name}
            </button>
          ))}
        </div>
      </header>

      {/* ── Shelf ── */}
      <div
        ref={shelfRef}
        className="relative mt-14 h-[52vh] min-h-[380px] select-none overflow-hidden"
        style={{ perspective: "2200px", perspectiveOrigin: "50% 50%" }}
        role="listbox"
        aria-label="Tool category tapes"
      >
        {/* Shelf ground line */}
        <div
          className="absolute left-0 right-0"
          style={{ top: "calc(50% + var(--vhs-h, 320px) / 2)", height: 1, background: "rgba(20,20,20,.9)" }}
          aria-hidden
        />

        {Array.from({ length: TOTAL }, (_, i) => {
          const r = RECORDS[mod(i, N)];
          return (
            <Tape
              key={i}
              index={i}
              record={r}
              register={(el) => {
                if (el) tapesRef.current.set(i, el);
                else tapesRef.current.delete(i);
              }}
            />
          );
        })}
      </div>

      {/* ── Caption ── */}
      {record && <Caption record={record} />}

      {/* ── Controls ── */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          data-cursor="button"
          onClick={() => navigate(-1)}
          aria-label="Previous category"
          className="grid h-11 w-11 place-items-center rounded-full border border-[#141414]/30 text-[#141414] transition hover:bg-[#141414] hover:text-[#F4F2ED]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 12H4M10 6l-6 6 6 6" />
          </svg>
        </button>
        <button
          type="button"
          data-cursor="button"
          onClick={openSelected}
          className="rounded-full bg-[#1F3FB0] px-6 py-2.5 text-xs font-semibold uppercase tracking-[.16em] text-[#F4F2ED] transition hover:-translate-y-px"
        >
          Open record
        </button>
        <button
          type="button"
          data-cursor="button"
          onClick={() => navigate(1)}
          aria-label="Next category"
          className="grid h-11 w-11 place-items-center rounded-full border border-[#141414]/30 text-[#141414] transition hover:bg-[#141414] hover:text-[#F4F2ED]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12h16M14 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <p className="mx-auto mt-10 max-w-xl pb-16 text-center text-xs leading-relaxed text-[#6D6A63]">
        Each tape is a tool category from BuiltByUmer. Open a record to see every tool on it —{" "}
        {TOOLS.length} free utilities, all running entirely in your browser.
      </p>

      {/* ── Paper grain (above shelf, below detail) ── */}
      <div className="vhs-grain pointer-events-none fixed inset-0 z-50" aria-hidden />

      {/* ── Detail overlay ── */}
      {detail && <DetailOverlay record={detail.record} rect={detail.rect} onClose={() => setDetail(null)} />}

      <style href="st-toolarchive-shell" precedence="high" dangerouslySetInnerHTML={{ __html: `
        :root {
          --vhs-h: 320px;
        }
        .vhs-grain {
          background-image: url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.06'/></svg>`,
          )}");
          background-size: 220px 220px;
          mix-blend-mode: multiply;
          z-index: 50;
        }
        @media (max-width: 820px) {
          :root {
            --vhs-h: 240px;
          }
        }
      ` }} />
    </div>
  );
}

/* ── A single 3D tape ─────────────────────────────────────── */

function Tape({
  index,
  record,
  register,
}: {
  index: number;
  record: ToolRecord;
  register: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={register}
      data-index={index}
      className="vhs-tape absolute left-0 top-1/2"
      role="option"
      aria-selected={false}
      aria-label={record.name}
      style={{
        height: "var(--vhs-h, 320px)",
        width: "var(--vhs-ws, 54px)",
        transformStyle: "preserve-3d",
        marginLeft: "calc(var(--vhs-ws, 54px) / -2)",
        marginTop: "calc(var(--vhs-h, 320px) / -2)",
        willChange: "transform",
      }}
    >
      {/* Spine face (front) */}
      <div
        className="vhs-spine absolute inset-0 overflow-hidden rounded-[3px]"
        style={{ background: record.tint, backfaceVisibility: "hidden" }}
      >
        <div
          className="vhs-spine-art"
          style={{ backgroundImage: `url(/images/tools/${record.slug}.svg)` }}
          aria-hidden
        />
        <div className="vhs-spine-title" aria-hidden>
          <span>{record.name}</span>
        </div>
        <div className="vhs-spine-foot" aria-hidden>
          <span className="vhs-spine-brand">UMER</span>
          <span className="vhs-spine-badge">TOOLS</span>
        </div>
        <div className="vhs-spine-shade absolute inset-0 bg-black" style={{ opacity: 0.05 }} aria-hidden />
        <style href="st-toolarchive-spine" precedence="high" dangerouslySetInnerHTML={{ __html: `
          .vhs-spine {
            color: rgba(244, 242, 237, 0.92);
          }
          .vhs-spine-art {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 26%;
            background-size: cover;
            background-position: center;
            filter: grayscale(1) contrast(1.05) brightness(0.9);
            opacity: 0.8;
            border-bottom: 1px solid rgba(244, 242, 237, 0.28);
          }
          .vhs-spine-title {
            position: absolute;
            top: 30%;
            bottom: 22%;
            left: 0;
            right: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .vhs-spine-title span {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            font-family: Georgia, "Times New Roman", serif;
            font-weight: 700;
            font-size: calc(var(--vhs-ws, 54px) * 0.3);
            letter-spacing: 0.06em;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .vhs-spine-foot {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: calc(var(--vhs-ws, 54px) * 0.1);
            padding-bottom: calc(var(--vhs-ws, 54px) * 0.14);
          }
          .vhs-spine-brand {
            font-size: calc(var(--vhs-ws, 54px) * 0.17);
            font-weight: 700;
            letter-spacing: 0.18em;
          }
          .vhs-spine-badge {
            font-size: calc(var(--vhs-ws, 54px) * 0.13);
            font-weight: 700;
            letter-spacing: 0.12em;
            border: 1px solid rgba(244, 242, 237, 0.7);
            padding: 0.15em 0.4em;
            border-radius: 2px;
          }
        ` }} />
      </div>

      {/* Cover face (right-hand side) */}
      <div
        className="vhs-cover-face absolute top-0 left-full overflow-hidden rounded-[3px] bg-[#141414]"
        data-cursor="open"
        style={{
          width: "var(--vhs-w, 190px)",
          height: "100%",
          transformOrigin: "left center",
          transform: "rotateY(90deg)",
        }}
      >
        <CoverArt record={record} />
        <div className="vhs-shade absolute inset-0 bg-black" style={{ opacity: 0.1 }} aria-hidden />
      </div>

      {/* Soft shadow under the tape */}
      <div
        className="absolute -bottom-2 left-1/2 h-3 w-[160%] -translate-x-1/2 rounded-full bg-black/25 blur-md"
        aria-hidden
      />
    </div>
  );
}
