"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TOOLS } from "@/data/tools";

/**
 * ClosingSection — the landing's final act: a full-width field of breathing
 * lime dots (canvas), a glass FAQ accordion, and a glass footer panel.
 * Adapted from the Solace reference into the site's ink/forest/lime palette.
 */

const FAQS: Array<[string, string]> = [
  [
    "Which tools can I use right now?",
    `All ${TOOLS.length} tools are live today across PDF, image, QR, network, developer, text, calculator, data, business and productivity categories — nothing is a waitlist.`,
  ],
  [
    "Do I need an account or a subscription?",
    "No. Every tool runs free with no sign-up: open a tool, drop in your file or numbers, and you are done in seconds.",
  ],
  [
    "Is my data safe here?",
    "Everything runs locally in your browser. Files never leave your device, nothing is uploaded to a server, and nothing is stored.",
  ],
  [
    "Do the tools work on my phone?",
    "Yes — every tool works in any modern browser on desktop, tablet and mobile, with the same speed and no app to install.",
  ],
];

const C0 = [146, 180, 56];
const C1 = [198, 243, 92];
const C2 = [232, 240, 205];

export function ClosingSection() {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    const cv = cvRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const g = ctx as CanvasRenderingContext2D;
    const calm =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      new URLSearchParams(window.location.search).get("motion") !== "full";

    let W = 0;
    let H = 0;
    let dpr = 1;
    let step = 0;
    let cols = 0;
    let rows = 0;
    let seed: number[][] = [];
    let mx = -9999;
    let my = -9999;
    let tmx = -9999;
    let tmy = -9999;

    const hash = (i: number, j: number) => {
      const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
      return h - Math.floor(h);
    };

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv!.clientWidth;
      H = cv!.clientHeight;
      cv!.width = W * dpr;
      cv!.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      step = Math.max(14, Math.min(W / 1600, H / 940) * 20.5);
      cols = Math.ceil(W / step) + 1;
      rows = Math.ceil(H / step) + 1;
      seed = [];
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) seed.push([hash(i, j), hash(i + 71, j + 13), hash(i + 9, j + 97)]);
    }
    size();
    const ro = new ResizeObserver(size);
    ro.observe(wrap);

    const onMove = (e: PointerEvent) => {
      const r = cv!.getBoundingClientRect();
      tmx = e.clientX - r.left;
      tmy = e.clientY - r.top;
    };
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", () => {
      tmx = -9999;
      tmy = -9999;
    });

    const mix = (a: number[], b: number[], t: number) =>
      a.map((v, k) => Math.round(v + (b[k] - v) * t));

    let raf = 0;
    let inView = false;
    const io = new IntersectionObserver(([en]) => (inView = en.isIntersecting));
    io.observe(wrap);

    function draw(t: number) {
      g.clearRect(0, 0, W, H);
      mx += (tmx - mx) * 0.12;
      my += (tmy - my) * 0.12;
      const top = H * 0.1;
      const full = H * 0.36;
      const R = step * 0.37;
      for (let j = 0; j < rows; j++) {
        const y = j * step + step * 0.5;
        if (y < top - step * 2) continue;
        const v = Math.min(1, Math.max(0, (y - top) / (full - top)));
        const col =
          v < 0.55
            ? mix(C0, C1, v / 0.55)
            : mix(C1, C2, ((v - 0.55) / 0.45) * 0.85 + Math.max(0, (y - H * 0.9) / (H * 0.1)) * 0.15);
        g.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
        for (let i = 0; i < cols; i++) {
          const x = i * step + step * 0.5;
          const [a, b, c] = seed[j * cols + i] ?? [0.5, 0.5, 1];
          const wave = calm
            ? 0.7
            : 0.5 + 0.5 * Math.sin(t * (1.6 + b * 2.6) + a * 6.283 + Math.sin(t * 0.7 + i * 0.21 + j * 0.13) * 1.4);
          const keep = Math.min(1, v * 1.6 + 0.12) - a * 0.6;
          if (keep <= 0 && c > 0.08) continue;
          let s = (0.42 + 0.58 * Math.pow(wave, 1.3)) * Math.min(1, 0.5 + v * 0.6) * (keep > 0 ? 1 : 0.8);
          const dx = x - mx;
          const dy = y - my;
          const hov = Math.exp(-(dx * dx + dy * dy) / (step * step * 22));
          s = Math.min(1.05, s + hov * 0.7);
          const r = R * s;
          if (r < 0.6) continue;
          g.beginPath();
          g.arc(x, y, r, 0, 6.2832);
          g.fill();
        }
      }
    }

    let frameNo = 0;
    function loop(ms: number) {
      if (inView) if ((frameNo++ & 1) === 0) draw(ms / 1000);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section ref={wrapRef} className="cl-wrap" id="faq" aria-label="Questions and footer">
      <canvas ref={cvRef} className="cl-dots" aria-hidden />
      <div className="cl-inner">
        <h2 className="cl-head">Questions, answered</h2>
        <div className="cl-faq">
          {FAQS.map(([q, a], i) => (
            <div className={"cl-q" + (open === i ? " open" : "")} key={q}>
              <button
                type="button"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                {q}
                <svg viewBox="0 0 14 14" aria-hidden>
                  <path d="M3 5l4 4 4-4" />
                </svg>
              </button>
              <div className="cl-a">
                <div>
                  <p>{a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="cl-foot">
          <div className="cl-brandcol">
            <p className="cl-brand">
              <span className="cl-mark" aria-hidden>
                <svg viewBox="0 0 34 36" fill="none">
                  <path d="M17 1 32 9.5v17L17 35 2 26.5v-17Z" stroke="#121212" strokeWidth="2.4" />
                  <path
                    d="M12 24V12h4.2a3 3 0 0 1 0 6h-4.2m0 0h4.6a3 3 0 0 1 0 6h-4.6"
                    stroke="#121212"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              BuiltByUmer
            </p>
            <p className="cl-tag">
              Every tool. One destination. {TOOLS.length} free utilities that run entirely in your
              browser — nothing uploaded, nothing installed, nothing to pay for.
            </p>
            <p className="cl-copy">© 2026 Umer Raja · BuiltByUmer · All rights reserved · builtbyumer.tech</p>
          </div>
          <div className="cl-cols">
            <div>
              <h3>Product</h3>
              <ul>
                <li><Link href="/tools">All tools</Link></li>
                <li><Link href="/pdf-tools">PDF tools</Link></li>
                <li><Link href="/image-tools">Image tools</Link></li>
                <li><Link href="/qr-tools">QR tools</Link></li>
                <li><Link href="/developer-tools">Developer tools</Link></li>
              </ul>
            </div>
            <div>
              <h3>Categories</h3>
              <ul>
                <li><Link href="/text-tools">Text tools</Link></li>
                <li><Link href="/network-tools">Network tools</Link></li>
                <li><Link href="/calculators">Calculators</Link></li>
                <li><Link href="/data-tools">Data tools</Link></li>
                <li><Link href="/business-tools">Business tools</Link></li>
              </ul>
            </div>
            <div>
              <h3>Company</h3>
              <ul>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/portfolio">Portfolio</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/privacy-policy">Privacy</Link></li>
                <li><Link href="/terms-of-service">Terms</Link></li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
      <style href="st-closingsection-1" precedence="high" dangerouslySetInnerHTML={{ __html: `
        .cl-wrap {
          position: relative;
          min-height: 100svh;
          overflow: hidden;
          background: #0c0c0c;
        }
        .cl-dots {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }
        .cl-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100svh;
          padding: 64px 28px 28px;
        }
        .cl-head {
          font-size: 40px;
          font-weight: 600;
          letter-spacing: -0.02em;
          text-align: center;
          color: #f2f6e6;
          margin: 0;
        }
        .cl-faq {
          width: 688px;
          max-width: 100%;
          margin-top: 22px;
          padding: 4px 21px;
          background: rgba(20, 26, 16, 0.72);
          border: 1px solid rgba(198, 243, 92, 0.16);
          border-radius: 6px;
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .cl-q {
          border-bottom: 1px solid rgba(198, 243, 92, 0.14);
        }
        .cl-q:last-child {
          border-bottom: 0;
        }
        .cl-q button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          width: 100%;
          padding: 17px 0;
          background: none;
          border: 0;
          cursor: pointer;
          text-align: left;
          color: #eef3df;
          font: inherit;
          font-size: 17px;
          font-weight: 500;
          letter-spacing: -0.005em;
        }
        .cl-q svg {
          flex: none;
          width: 14px;
          height: 14px;
          fill: none;
          stroke: #c6f35c;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .cl-q.open svg {
          transform: rotate(180deg);
        }
        .cl-a {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .cl-q.open .cl-a {
          grid-template-rows: 1fr;
        }
        .cl-a > div {
          overflow: hidden;
        }
        .cl-a p {
          padding: 0 20px 20px 0;
          margin: 0;
          font-size: 15px;
          line-height: 1.6;
          color: #b9c9a2;
        }
        .cl-foot {
          margin-top: auto;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 40px;
          padding: 46px 64px 44px;
          background: linear-gradient(180deg, rgba(16, 22, 14, 0.86), rgba(24, 46, 30, 0.84));
          border: 1px solid rgba(198, 243, 92, 0.12);
          border-radius: 6px;
          backdrop-filter: blur(12px);
        }
        .cl-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 0;
          font-size: 25px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #f2f6e6;
        }
        .cl-mark {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          background: #f2f6e6;
          border-radius: 4px;
        }
        .cl-mark svg {
          width: 60%;
          height: 62%;
        }
        .cl-tag {
          margin: 20px 0 0;
          max-width: 440px;
          font-size: 15px;
          line-height: 1.6;
          color: #c9d8b0;
        }
        .cl-copy {
          margin: 26px 0 0;
          font-size: 14px;
          color: #9fb18a;
        }
        .cl-cols {
          display: grid;
          grid-template-columns: repeat(3, 196px);
          gap: 8px;
        }
        .cl-cols h3 {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 16px;
          color: #eef3df;
        }
        .cl-cols ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .cl-cols li {
          margin-bottom: 11px;
        }
        .cl-cols a {
          font-size: 14.5px;
          color: #b9c9a2;
          text-decoration: none;
          transition: color 0.2s;
        }
        .cl-cols a:hover {
          color: #c6f35c;
        }
        @media (max-width: 820px) {
          .cl-wrap {
            min-height: auto !important;
            overflow: hidden;
          }
          .cl-inner {
            padding: 16px 14px 14px;
            min-height: auto !important;
          }
          .cl-head {
            font-size: 20px;
          }
          .cl-faq {
            width: 100%;
            margin-top: 10px;
          }
          .cl-q button {
            padding: 12px 0;
            font-size: 13px;
            min-height: 44px;
            touch-action: manipulation;
          }
          .cl-foot {
            grid-template-columns: 1fr;
            padding: 16px 14px;
            margin-top: 16px;
            gap: 16px;
          }
          .cl-brand {
            font-size: 16px;
          }
          .cl-mark {
            width: 28px;
            height: 28px;
          }
          .cl-tag {
            font-size: 12px;
            margin-top: 10px;
          }
          .cl-copy {
            font-size: 10px;
            margin-top: 10px;
          }
          .cl-cols {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px 8px;
          }
          .cl-cols ul li {
            margin-bottom: 6px;
          }
          .cl-cols a {
            min-height: 44px;
            display: flex;
            align-items: center;
          }
        }
      ` }} />
    </section>
  );
}
