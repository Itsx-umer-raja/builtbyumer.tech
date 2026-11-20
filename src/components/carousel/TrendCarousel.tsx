"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, type CSSProperties } from "react";
import { CATEGORIES } from "@/data/categories";
import { TOOLS } from "@/data/tools";

/**
 * TrendCarousel — a square 1:1 swipeable carousel (drag, arrows, dots,
 * keys) presenting the tool categories like a design-trend post: a cover
 * with a scrolling band of category plates, ten category slides with
 * justified copy + draggable moodboard collages, and a closing CTA card.
 * Everything is sized in em where 1em = 1% of the square's side.
 */

type Piece = [slug: string, left: number, top: number, w: number, h: number, fx?: number, fy?: number];

const PIECES: Piece[][] = [
  /* 01 PDF */ [["pdf-tools", 9, 25, 25.5, 34], ["developer-tools", 18, 53, 15, 19], ["image-tools", 66, 20, 25, 27], ["qr-tools", 50, 36, 27, 36]],
  /* 02 Image */ [["image-tools", 8.5, 23, 22, 30], ["qr-tools", 27, 40, 21, 27], ["data-tools", 51, 23, 32, 41], ["text-tools", 69, 57, 25, 34]],
  /* 03 QR */ [["qr-tools", 8, 23, 24, 36], ["developer-tools", 28.5, 29, 24, 40], ["business-tools", 69, 20, 19, 25], ["network-tools", 63, 54, 27, 36]],
  /* 04 Network */ [["network-tools", 8, 43.5, 36, 22], ["developer-tools", 33, 26, 22, 31], ["data-tools", 77, 21, 15.5, 18], ["business-tools", 63, 51, 28, 32]],
  /* 05 Developer */ [["developer-tools", 8, 22, 29, 32], ["data-tools", 36, 40, 22, 27], ["qr-tools", 64, 20, 30, 31], ["text-tools", 69, 52, 27, 44]],
  /* 06 Text */ [["text-tools", 8.5, 25, 24, 33], ["business-tools", 30, 42, 21, 26], ["pdf-tools", 52, 20, 30, 38], ["developer-tools", 70, 55, 24, 32]],
  /* 07 Calculators */ [["calculators", 8, 40, 34, 26], ["data-tools", 34, 24, 22, 30], ["business-tools", 58, 42, 26, 33], ["productivity-tools", 76, 20, 17, 20]],
  /* 08 Data */ [["data-tools", 9, 22, 28, 34], ["calculators", 40, 38, 20, 27], ["business-tools", 64, 20, 28, 30], ["productivity-tools", 66, 55, 26, 34]],
  /* 09 Business */ [["business-tools", 8, 24, 26, 34], ["productivity-tools", 36, 40, 22, 26], ["data-tools", 62, 22, 27, 30], ["calculators", 70, 54, 24, 32]],
  /* 10 Productivity */ [["productivity-tools", 8, 23, 27, 35], ["calculators", 37, 42, 20, 25], ["text-tools", 63, 21, 28, 32], ["business-tools", 67, 53, 25, 33]],
];

const BAND_SLUGS = ["pdf-tools", "image-tools", "qr-tools", "network-tools", "developer-tools", "text-tools", "calculators", "data-tools"];

const COPY = [
  "Merge, split, convert and compress PDFs without installing anything. Fill forms, extract pages, add watermarks and sign documents — every operation runs locally in your browser, so your files never leave your device.",
  "Compress images to an exact size in KB, convert between formats, resize, crop and remove backgrounds. Batch jobs finish in seconds and the quality stays exactly where you set it.",
  "Generate QR codes for links, Wi-Fi, vCards and payments, then scan any barcode straight from the camera. Clean, print-ready output with the colours and size you choose.",
  "Look up any IP, check DNS records, trace routes, test port connectivity and inspect HTTP headers — the network tools developers keep open in a second tab.",
  "Format JSON, base64, URLs and timestamps, diff text, hash files and convert code. Built for people who live in a terminal but like a nice window.",
  "Slugify, case-convert, count, clean and transform text in one click. Perfect for writers, students and anyone who pastes the same paragraph ten times a day.",
  "Percentage, loan, date, BMI, unit and currency calculators that give the answer with the working shown — no pop-ups, no ads, no rounding surprises.",
  "Convert JSON, CSV, YAML and SQL, prettify minified payloads and inspect data structures locally — even the big ones — without uploading anything to a stranger's server.",
  "Invoices, invoices numbers, GST maths, EMI schedules and quick business documents you can generate, fill and download in under a minute.",
  "Pomodoro timers, habit counters, reminders and small utilities that keep the day on track — the tab you keep pinned all afternoon.",
];

function headLines(name: string): [string, string] {
  const words = name.split(" ");
  if (words.length === 1) return [words[0], ""];
  return [words[0], words.slice(1).join(" ")];
}

export function TrendCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const postRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const SLIDES = 2 + CATEGORIES.length; // cover + categories + end card

  useEffect(() => {
    const section = sectionRef.current;
    const post = postRef.current;
    const track = trackRef.current;
    const dots = dotsRef.current;
    if (!section || !post || !track || !dots) return;
    const slides = Array.from(track.children) as HTMLElement[];
    const prevBtn = prevRef.current;
    const nextBtn = nextRef.current;
    const band = bandRef.current;
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      new URLSearchParams(window.location.search).get("motion") !== "full";

    let S = 1;
    let cur = 0;
    let offset = 0; // live drag offset in px
    let inView = false;

    function size() {
      const r = section!.getBoundingClientRect();
      S = Math.max(280, Math.min(r.width * 0.94, r.height * 0.9));
      post!.style.width = S + "px";
      post!.style.height = S + "px";
      post!.style.fontSize = S / 100 + "px";
      place(false);
    }

    function place(animate: boolean) {
      const x = -cur * S + offset;
      track!.style.transition = animate && !reduced ? "transform .62s cubic-bezier(.22,.8,.2,1)" : "none";
      track!.style.transform = "translateX(" + x + "px)";
    }

    function markOn() {
      slides.forEach((s, i) => s.classList.toggle("on", i === cur));
      post!.classList.toggle("light", cur > 0 && cur < slides.length - 1);
    }

    function syncChrome() {
      Array.from(dots!.children).forEach((d, i) => d.classList.toggle("act", i === cur));
      if (prevBtn) prevBtn.disabled = cur === 0;
      if (nextBtn) nextBtn.disabled = cur === slides.length - 1;
    }

    function go(i: number) {
      cur = Math.max(0, Math.min(slides.length - 1, i));
      offset = 0;
      place(true);
      markOn();
      syncChrome();
    }

    /* dots */
    for (let i = 0; i < slides.length; i++) {
      const d = document.createElement("button");
      d.type = "button";
      d.setAttribute("aria-label", "Go to slide " + (i + 1));
      d.addEventListener("click", () => go(i));
      dots.appendChild(d);
    }

    /* swipe */
    let downX = 0;
    let downY = 0;
    let downT = 0;
    let locked: "h" | "v" | null = null;
    let dragging = false;

    function onDown(e: PointerEvent) {
      const t = e.target as HTMLElement;
      if (t.closest(".tr-arrow, .tr-dots, .tr-piece, .tr-cta a, .tr-band")) return;
      dragging = true;
      locked = null;
      downX = e.clientX;
      downY = e.clientY;
      downT = performance.now();
      post!.setPointerCapture?.(e.pointerId);
      post!.style.cursor = "grabbing";
    }
    function onMove(e: PointerEvent) {
      if (!dragging) return;
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (!locked) {
        if (Math.hypot(dx, dy) < 6) return;
        locked = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }
      if (locked !== "h") return;
      let x = dx;
      if ((cur === 0 && dx > 0) || (cur === slides.length - 1 && dx < 0)) x = dx * 0.28;
      offset = x;
      place(false);
    }
    function onUp(e: PointerEvent) {
      if (!dragging) return;
      dragging = false;
      post!.style.cursor = "grab";
      const dx = e.clientX - downX;
      const dt = performance.now() - downT;
      const speed = Math.abs(dx) / Math.max(dt, 1);
      if (locked === "h" && (Math.abs(dx) > S * 0.18 || speed > 0.45)) {
        go(cur + (dx < 0 ? 1 : -1));
      } else {
        offset = 0;
        place(true);
      }
      locked = null;
    }
    post.addEventListener("pointerdown", onDown);
    post.addEventListener("pointermove", onMove);
    post.addEventListener("pointerup", onUp);
    post.addEventListener("pointercancel", onUp);

    /* keys */
    const onKey = (e: KeyboardEvent) => {
      if (!inView) return;
      if (e.key === "ArrowLeft") go(cur - 1);
      if (e.key === "ArrowRight") go(cur + 1);
    };
    window.addEventListener("keydown", onKey);

    /* piece drag — moodboard */
    slides.forEach((slide) => {
      const pieces = slide.querySelectorAll<HTMLElement>(".tr-piece");
      pieces.forEach((p) => {
        let px = 0;
        let py = 0;
        let live = false;
        p.addEventListener("pointerdown", (e: PointerEvent) => {
          if ((slide as HTMLElement).dataset.i !== String(cur)) return;
          e.stopPropagation();
          live = true;
          px = e.clientX;
          py = e.clientY;
          p.classList.add("lift");
          p.setPointerCapture?.(e.pointerId);
        });
        p.addEventListener("pointermove", (e: PointerEvent) => {
          if (!live) return;
          const dx = e.clientX - px;
          const dy = e.clientY - py;
          px = e.clientX;
          py = e.clientY;
          const r = slide.getBoundingClientRect();
          const left = parseFloat(p.style.left) || 0;
          const top = parseFloat(p.style.top) || 0;
          p.style.left = Math.max(-8, Math.min(88, left + (dx / r.width) * 100)) + "%";
          p.style.top = Math.max(-6, Math.min(82, top + (dy / r.height) * 100)) + "%";
          p.style.setProperty("--tilt", Math.max(-6, Math.min(6, dx / 40)) + "deg");
        });
        const drop = () => {
          if (!live) return;
          live = false;
          p.classList.remove("lift");
          p.style.setProperty("--tilt", "0deg");
        };
        p.addEventListener("pointerup", drop);
        p.addEventListener("pointercancel", drop);
      });
    });

    /* cover band motion */
    let raf = 0;
    let last = performance.now();
    let off = 0;
    let spd = 1;
    let bandHover = false;
    if (band) {
      band.addEventListener("pointerenter", () => (bandHover = true));
      band.addEventListener("pointerleave", () => (bandHover = false));
    }
    function bandLoop(now: number) {
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      if (band && inView) {
        const target = bandHover ? 0.22 : 1;
        spd += (target - spd) * Math.min(1, dt * 3);
        const unit = (29.4 + 0.55) * (S / 100);
        const loop = unit * BAND_SLUGS.length;
        if (!reduced) {
          off = (off + (unit / 2.05) * spd * dt) % loop;
          band.firstElementChild &&
            ((band.firstElementChild as HTMLElement).style.transform = "translateX(" + -off + "px)");
        }
      }
      raf = requestAnimationFrame(bandLoop);
    }
    raf = requestAnimationFrame(bandLoop);

    const io = new IntersectionObserver(([en]) => {
      inView = en.isIntersecting;
      if (inView && !slides[0].classList.contains("seen")) {
        slides[0].classList.add("seen");
      }
    });
    io.observe(post);

    size();
    markOn();
    syncChrome();
    const ro = new ResizeObserver(() => size());
    ro.observe(section);
    window.addEventListener("resize", size);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      post.removeEventListener("pointerdown", onDown);
      post.removeEventListener("pointermove", onMove);
      post.removeEventListener("pointerup", onUp);
      post.removeEventListener("pointercancel", onUp);
    };
  }, [SLIDES]);

  const toolCount = (slug: string) => TOOLS.filter((t) => t.category === slug).length;

  return (
    <section ref={sectionRef} className="tr-wrap" id="categories" aria-label="Tool categories carousel">
      <p className="tr-tag">
        <span className="tr-chip">Categories</span>
        <span className="tr-dim">Drag, swipe or use the arrows — the cards inside are draggable too</span>
      </p>
      <div ref={postRef} className="tr-post" role="region" aria-label="Categories carousel">
        <div ref={trackRef} className="tr-track">
          {/* ── cover ── */}
          <div className="tr-slide tr-cover" data-i={0}>
            <p className="tr-kick">Built by Umer</p>
            <p className="tr-big" aria-hidden>
              Tools
            </p>
            <img className="tr-cut" alt="" src="/images/mossline-island-cutout.webp" draggable={false} />
            <p className="tr-script">every one free</p>
            <p className="tr-side">No sign<br />up ever</p>
            <div className="tr-band" ref={bandRef}>
              <div className="tr-row">
                {BAND_SLUGS.map((s) => (
                  <div
                    className="tr-card"
                    key={"a" + s}
                    style={{
                      backgroundImage: `url(/images/tools/${s}.svg)`,
                    }}
                  />
                ))}
                {BAND_SLUGS.map((s) => (
                  <div
                    className="tr-card"
                    key={"b" + s}
                    style={{
                      backgroundImage: `url(/images/tools/${s}.svg)`,
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="tr-found">Nothing<br />to install.</p>
            <p className="tr-nts">Pick a<br />category</p>
            <svg className="tr-arrow-line" viewBox="0 0 100 40" aria-hidden>
              <path d="M0 20H96M78 4l18 16-18 16" />
            </svg>
          </div>

          {/* ── category slides ── */}
          {CATEGORIES.map((c, idx) => {
            const [l1, l2] = headLines(c.name);
            return (
              <div className="tr-slide tr-trend" data-i={idx + 1} key={c.slug}>
                <p className="tr-copy">{COPY[idx]}</p>
                <p className="tr-num">{String(idx + 1).padStart(2, "0")}</p>
                <h3 className="tr-head">
                  <span className="tr-mask">
                    <i>{l1}</i>
                  </span>
                  <span className="tr-mask">
                    <i>{l2}</i>
                  </span>
                </h3>
                {PIECES[idx].map(([slug, left, top, w, h], k) => (
                  <div
                    className="tr-piece"
                    key={slug + k}
                    style={
                      {
                        left: left + "%",
                        top: top + "%",
                        width: w + "%",
                        height: h + "%",
                        backgroundImage: `url(/images/tools/${slug}.svg)`,
                        transitionDelay: `calc(.12s + ${k * 0.09}s)`,
                        "--r": `${k % 2 === 0 ? -2 : 2}deg`,
                      } as CSSProperties
                    }
                  />
                ))}
                {idx === 0 && <span className="tr-box" aria-hidden />}
                {idx === 1 && (
                  <svg className="tr-scribble" viewBox="0 0 100 80" aria-hidden>
                    <path d="M8 60C30 10 40 70 55 25S80 50 92 12" />
                    <path d="M14 72C34 30 52 66 68 30" />
                  </svg>
                )}
                <a className="tr-open" href={`/${c.slug}`}>
                  {toolCount(c.slug)} tools — open ↗
                </a>
              </div>
            );
          })}

          {/* ── end card ── */}
          <div className="tr-slide tr-end" data-i={SLIDES - 1}>
            <span className="tr-grid-v" aria-hidden />
            <span className="tr-grid-h" aria-hidden />
            <h3 className="tr-endhead">
              Which one belongs<br />in your<br />workflow?
            </h3>
            <p className="tr-endcopy">
              Every category is free, private and runs entirely in your browser. Pick a category,
              open a tool and get it done — no accounts, no uploads, nothing to pay for.
            </p>
            <p className="tr-cta">
              <a href="/tools">
                <span>Explore the tools</span>
                <svg viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden>
                  <path
                    pathLength="1"
                    d="M150 14C112 2 34 6 12 30c-18 20 22 38 82 38 62 0 104-12 102-32C194 16 140 8 96 10 58 12 28 20 22 28"
                  />
                </svg>
              </a>
            </p>
            <p className="tr-brand">BUILTBYUMER.</p>
          </div>
        </div>

        <button ref={prevRef} type="button" className="tr-arrow tr-arrow-l" aria-label="Previous slide">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button ref={nextRef} type="button" className="tr-arrow tr-arrow-r" aria-label="Next slide">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div ref={dotsRef} className="tr-dots" aria-hidden />
      </div>
      <style href="st-trendcarousel-1" precedence="high" dangerouslySetInnerHTML={{ __html: `
        .tr-wrap {
          position: relative;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
          padding: clamp(60px, 8vh, 100px) 12px 44px;
          background:
            radial-gradient(120% 100% at 50% 0%, #f2f1ed 0%, #eceae4 60%, #e3e0d8 100%);
          overflow: hidden;
        }
        .tr-tag {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 8px 14px;
          max-width: min(92vw, 900px);
          text-align: center;
          font-size: 13px;
          color: #121212;
        }
        .tr-chip {
          border: 1px solid #121212;
          background: #121212;
          color: #eceae4;
          border-radius: 999px;
          padding: 5px 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 11px;
        }
        .tr-dim {
          color: #12121266;
          font-size: 12.5px;
        }
        .tr-post {
          position: relative;
          overflow: hidden;
          background: #eceae4;
          border-radius: 10px;
          box-shadow: 0 30px 80px rgba(18, 18, 18, 0.18);
          touch-action: pan-y;
          cursor: grab;
          font-family: var(--font-inter-tight), sans-serif;
        }
        .tr-post:active {
          cursor: grabbing;
        }
        .tr-track {
          position: absolute;
          inset: 0;
          display: flex;
          will-change: transform;
        }
        .tr-slide {
          position: relative;
          flex: 0 0 100%;
          height: 100%;
          overflow: hidden;
          background: #eceae4;
        }

        /* ── cover ── */
        .tr-cover {
          background: #163d2b;
          color: #f4f2ec;
        }
        .tr-cover p,
        .tr-cover .tr-script {
          position: absolute;
          font-weight: 300;
          text-transform: uppercase;
          line-height: 1.16;
          letter-spacing: 0.01em;
          pointer-events: none;
        }
        .tr-kick {
          left: 5.4%;
          top: 8.6%;
          font-size: 2.55em;
        }
        .tr-big {
          left: 4.6%;
          top: 11.4%;
          font-size: 11.2em;
          letter-spacing: -0.025em;
          line-height: 1;
        }
        .tr-cut {
          position: absolute;
          left: 30%;
          top: 6%;
          width: 58%;
          pointer-events: none;
          filter: drop-shadow(0 1.6em 3em rgba(0, 0, 0, 0.35));
        }
        .tr-cover .tr-script {
          left: auto;
          right: 6.2%;
          top: 5%;
          font-family: var(--font-instrument-serif), Georgia, "Times New Roman", serif;
          font-style: italic;
          font-weight: 400;
          font-size: 6.2em;
          line-height: 1;
          letter-spacing: 0.01em;
          text-transform: none;
          text-align: right;
          color: #cfe89f;
          text-shadow: 0 0.06em 0.3em rgba(10, 24, 14, 0.45);
        }
        .tr-side {
          right: 6.2%;
          top: 27.6%;
          text-align: right;
          font-size: 3.05em;
        }
        .tr-band {
          position: absolute;
          left: 0;
          right: 0;
          top: 39.4%;
          height: 29.4%;
          overflow: hidden;
          pointer-events: auto;
        }
        .tr-row {
          display: flex;
          gap: 0.55em;
          height: 100%;
          width: max-content;
        }
        .tr-card {
          width: 29.4em;
          height: 100%;
          flex: none;
          background-size: cover;
          background-position: center;
          border-radius: 0.6em;
        }
        .tr-found {
          left: 5.2% !important;
          top: 72.4% !important;
          font-size: 3.05em;
        }
        .tr-nts {
          left: 78.6% !important;
          top: 72.4% !important;
          font-size: 3.05em;
        }
        .tr-arrow-line {
          position: absolute;
          right: 6.5%;
          bottom: 5.6%;
          width: 9.5%;
          pointer-events: none;
        }
        .tr-arrow-line path {
          stroke: #f4f2ec;
          stroke-width: 1.6;
          fill: none;
        }

        /* ── trend slides ── */
        .tr-trend {
          color: #121212;
        }
        .tr-copy {
          position: absolute;
          left: 7.6%;
          right: 7.6%;
          top: 7.4%;
          font-size: 2.06em;
          line-height: 1.3;
          font-weight: 300;
          text-align: justify;
          color: #121212d9;
        }
        .tr-num {
          position: absolute;
          left: 7.6%;
          top: 64.6%;
          font-size: 2.6em;
          font-weight: 500;
          color: #3c7a4e;
        }
        .tr-head {
          position: absolute;
          left: 7.4%;
          top: 69.4%;
          z-index: 1;
          font-size: 8.4em;
          font-weight: 500;
          text-transform: uppercase;
          line-height: 1.06;
          letter-spacing: -0.015em;
          margin: 0;
        }
        .tr-mask {
          display: block;
          overflow: hidden;
        }
        .tr-mask i {
          display: block;
          font-style: normal;
          transform: translateY(108%);
          transition: none;
        }
        .tr-slide.on .tr-mask:nth-child(1) i {
          transform: none;
          transition: transform 0.9s cubic-bezier(0.2, 0.75, 0.2, 1);
        }
        .tr-slide.on .tr-mask:nth-child(2) i {
          transform: none;
          transition: transform 0.9s cubic-bezier(0.2, 0.75, 0.2, 1) 0.08s;
        }
        .tr-piece {
          position: absolute;
          background-size: cover;
          background-position: center;
          box-shadow: 0 0.4em 1.4em rgba(0, 0, 0, 0.12);
          border-radius: 0.5em;
          cursor: move;
          touch-action: none;
          clip-path: inset(100% 0 0 0);
          transform: rotate(var(--r, 0deg)) scale(var(--lift, 1));
          transition: clip-path 0.8s cubic-bezier(0.65, 0, 0.25, 1);
          will-change: transform;
        }
        .tr-slide.on .tr-piece {
          clip-path: inset(0 0 0 0);
        }
        .tr-piece.lift {
          box-shadow: 0 2.2em 4em rgba(0, 0, 0, 0.24);
          transform: rotate(var(--tilt, 0deg)) scale(1.05);
          z-index: 6;
        }
        .tr-box {
          position: absolute;
          left: 33%;
          top: 46%;
          width: 9%;
          height: 9%;
          border: 1px solid #b9c94a;
          pointer-events: none;
        }
        .tr-scribble {
          position: absolute;
          left: 21%;
          top: 20%;
          width: 17%;
          height: 14%;
          pointer-events: none;
        }
        .tr-scribble path {
          stroke: #a5b53a;
          stroke-width: 6;
          stroke-linecap: round;
          fill: none;
        }
        .tr-open {
          position: absolute;
          left: 7.6%;
          bottom: 4.6%;
          z-index: 2;
          font-size: 1.9em;
          font-weight: 500;
          color: #163d2b;
          text-decoration: none;
          border-bottom: 1px solid #163d2b55;
          padding-bottom: 0.2em;
        }
        .tr-open:hover {
          border-color: #163d2b;
        }

        /* ── end card ── */
        .tr-end {
          background: linear-gradient(180deg, #8fae3e 0%, #b9d370 48%, #e6f0cf 100%);
          color: #f6f8ec;
        }
        .tr-grid-v,
        .tr-grid-h {
          position: absolute;
          background: rgba(255, 255, 255, 0.22);
          pointer-events: none;
        }
        .tr-grid-v {
          left: 8.6%;
          top: 0;
          bottom: 0;
          width: 1px;
        }
        .tr-grid-h {
          top: 42%;
          left: 0;
          right: 0;
          height: 1px;
        }
        .tr-endhead {
          position: absolute;
          left: 13.4%;
          top: 10%;
          font-size: 7.4em;
          font-weight: 400;
          line-height: 1.08;
          text-transform: uppercase;
          letter-spacing: -0.01em;
          margin: 0;
        }
        .tr-endcopy {
          position: absolute;
          left: 13.4%;
          width: 55%;
          top: 50.4%;
          font-size: 3.2em;
          line-height: 1.24;
          font-weight: 300;
          text-align: justify;
          color: rgba(250, 252, 240, 0.92);
        }
        .tr-cta {
          position: absolute;
          left: 13.4%;
          top: 83.6%;
          font-size: 3.4em;
          font-weight: 400;
          text-transform: uppercase;
          margin: 0;
        }
        .tr-cta a {
          position: relative;
          display: inline-block;
          color: #f9fbea;
          text-decoration: none;
          cursor: pointer;
        }
        .tr-cta a:hover {
          animation: tr-wiggle 0.5s ease-in-out;
        }
        .tr-cta svg {
          position: absolute;
          left: -20%;
          top: -62%;
          width: 150%;
          height: 220%;
          pointer-events: none;
        }
        .tr-cta svg path {
          stroke: #f6f8ec;
          stroke-width: 3.2;
          stroke-linecap: round;
          fill: none;
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
        }
        .tr-slide.on .tr-cta svg path {
          animation: tr-draw 1.1s cubic-bezier(0.6, 0, 0.2, 1) 0.35s forwards;
        }
        @keyframes tr-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes tr-wiggle {
          0%,
          100% {
            transform: rotate(0);
          }
          25% {
            transform: rotate(-2deg);
          }
          75% {
            transform: rotate(2deg);
          }
        }
        .tr-brand {
          position: absolute;
          right: 6.6%;
          top: 84.6%;
          font-size: 2.7em;
          font-weight: 500;
          letter-spacing: 0.18em;
          margin: 0;
          color: #f6f8ec;
        }

        /* ── chrome ── */
        .tr-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 6.4em;
          height: 6.4em;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.88);
          border: 0;
          display: grid;
          place-items: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.3s, transform 0.15s;
          z-index: 5;
          box-shadow: 0 0.4em 1.6em rgba(0, 0, 0, 0.14);
        }
        .tr-arrow svg {
          width: 42%;
          height: 42%;
          fill: none;
          stroke: #121212;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .tr-post:hover .tr-arrow:not(:disabled) {
          opacity: 1;
        }
        .tr-arrow:active {
          transform: translateY(-50%) scale(0.92);
        }
        .tr-arrow:disabled {
          cursor: default;
        }
        .tr-arrow-l {
          left: 2.4%;
        }
        .tr-arrow-r {
          right: 2.4%;
        }
        .tr-dots {
          position: absolute;
          left: 50%;
          bottom: 2.6%;
          transform: translateX(-50%);
          display: flex;
          gap: 1.1em;
          z-index: 5;
        }
        .tr-dots button {
          width: 1.25em;
          height: 1.25em;
          border-radius: 50%;
          border: 0;
          padding: 0;
          background: rgba(255, 255, 255, 0.55);
          cursor: pointer;
          transition: transform 0.25s, background 0.25s;
        }
        .tr-dots button.act {
          background: #fff;
          transform: scale(1.25);
        }
        .tr-post.light .tr-dots button {
          background: rgba(0, 0, 0, 0.18);
        }
        .tr-post.light .tr-dots button.act {
          background: #121212;
        }
        @media (prefers-reduced-motion: reduce) {
          .tr-mask i {
            transform: none !important;
          }
          .tr-piece {
            clip-path: none !important;
          }
        }
        @media (max-width: 640px) {
          .tr-wrap {
            min-height: auto;
            padding: 20px 8px 16px;
            gap: 10px;
          }
          .tr-post {
            border-radius: 8px;
            touch-action: pan-y;
          }
          .tr-arrow {
            width: 44px;
            height: 44px;
            min-width: 44px;
            min-height: 44px;
            opacity: 1;
            touch-action: manipulation;
          }
          .tr-dots {
            gap: 8px;
            padding: 8px 16px;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .tr-dots::-webkit-scrollbar {
            display: none;
          }
          .tr-dots button {
            /* clamp(12px, 3.5vw, 18px) visible dot, 44px tap target via padding */
            width: clamp(12px, 3.5vw, 18px);
            height: clamp(12px, 3.5vw, 18px);
            padding: 13px;
            box-sizing: content-box;
            min-width: 0;
            min-height: 0;
            flex: 0 0 auto;
            background: rgba(255, 255, 255, 0.55);
            border-radius: 50%;
          }
          .tr-dots button.act {
            background: #fff;
            transform: none;
          }
          .tr-dots button:hover {
            transform: scale(1.1);
          }
          /* Labels: prevent overflow, add letter-spacing control */
          .tr-found,
          .tr-nts {
            font-size: clamp(10px, 2.5vw, 16px) !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
          }
          .tr-found {
            left: 4% !important;
            top: auto !important;
            bottom: 14% !important;
            text-align: left !important;
          }
          .tr-nts {
            left: auto !important;
            right: 4% !important;
            top: auto !important;
            bottom: 14% !important;
            text-align: right !important;
          }
          .tr-arrow-line {
            display: none !important;
          }
          .tr-tag {
            flex-direction: column;
            gap: 6px;
          }
        }
      ` }} />
    </section>
  );
}
