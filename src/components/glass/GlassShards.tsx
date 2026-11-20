"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * "Cut in glass" — the Facet reference rebuilt as a DOM/CSS scene:
 * five smoked-glass shards cut from one dark page, the slab tilting
 * toward the cursor, shards lifting on hover, cut lines breathing, and
 * "See the specs →" shattering the page into the five-terms view.
 * No WebGL — it renders identically on every device.
 */

const TERMS = [
  { term: "PDF & Documents", def: "Twenty-four tools that merge, split, convert, rotate, watermark and read PDFs — every page processed locally in your browser.", href: "/pdf-tools" },
  { term: "Image & Photo", def: "Compress a photo to an exact kilobyte target, resize, crop, convert formats and read text off screenshots with on-device OCR.", href: "/image-tools" },
  { term: "QR & Barcodes", def: "Generate codes for links, Wi-Fi, contacts and payments, then verify them by scanning uploads or your camera.", href: "/qr-tools" },
  { term: "Network & Internet", def: "Look up your public IP, resolve DNS records through public resolvers and plan IPv4 subnets with real math.", href: "/network-tools" },
  { term: "Developer Utilities", def: "Format JSON and friends, encode Base64, hash with SHA-2, test regular expressions and decode JWTs.", href: "/developer-tools" },
];

/* Shard geometry in panel-normalised coords (x right, y down) — from the reference cut pattern. */
const CUTS = [
  {
    name: "PDF & Documents",
    count: 24,
    href: "/pdf-tools",
    // bounding box + clip polygon
    box: { left: 0, top: 0, w: 0.385, h: 1 },
    clip: "polygon(0% 0%, 100% 0%, 38.5% 72%, 34% 100%, 0% 100%)",
    base: { x: -1, y: -1 },
  },
  {
    name: "Image & Photo",
    count: 22,
    href: "/image-tools",
    box: { left: 0.22, top: 0, w: 0.295, h: 0.72 },
    clip: "polygon(0% 0%, 100% 0%, 100% 86%, 71% 100%, 0% 72%)",
    base: { x: 0, y: -1 },
  },
  {
    name: "QR & Barcodes",
    count: 11,
    href: "/qr-tools",
    box: { left: 0.515, top: 0, w: 0.485, h: 0.62 },
    clip: "polygon(0% 0%, 67% 0%, 100% 79%, 100% 100% is not needed)",
    base: { x: 1, y: -1 },
  },
  {
    name: "Developer",
    count: 26,
    href: "/developer-tools",
    box: { left: 0.34, top: 0.49, w: 0.525, h: 0.51 },
    clip: "polygon(18% 0%, 73% 0%, 100% 73%, 0% 100%)",
    base: { x: 0, y: 1 },
  },
  {
    name: "Network",
    count: 14,
    href: "/network-tools",
    box: { left: 0.716, top: 0.49, w: 0.284, h: 0.51 },
    clip: "polygon(43% 0%, 100% 0%, 100% 100%, 0% 100%)",
    base: { x: 1, y: 1 },
  },
];

// Fix the QR shard clip (it must follow tBC → tCE → J2 → J1)
CUTS[2].clip = "polygon(0% 0%, 67% 0%, 100% 79%, 0% 100%)";

export function GlassShards() {
  const slabRef = useRef<HTMLDivElement>(null);
  const shardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [night] = useState(false);
  const [shattered, setShattered] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  /* tilt toward cursor + breathing drift + shatter flight, one rAF loop */
  useEffect(() => {
    const slab = slabRef.current;
    if (!slab) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tilt = { x: 0, y: 0, tx: -1.2, ty: 0.8 };
    const pos = CUTS.map(() => ({ x: 0, y: 0 }));
    let raf = 0;
    let last = performance.now();

    // shatter state per shard
    const fly = CUTS.map(() => ({
      active: false,
      t: 0,
      delay: 0,
      dir: 1 as 1 | -1,
      vx: 0,
      vy: 0,
      vz: 0,
      rot: 0,
      rx: 0,
      start: { x: 0, y: 0 },
    }));

    const onMove = (e: PointerEvent) => {
      const r = slab.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      tilt.tx = px * 7 - 1.2;
      tilt.ty = -(py * 5.5) + 0.8;
    };
    const onLeave = () => {
      tilt.tx = -1.2;
      tilt.ty = 0.8;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    const onShatter = () => {
      if (shattered) return;
      setShattered(true);
      const now = performance.now();
      CUTS.forEach((c, i) => {
        const f = fly[i];
        f.active = true;
        f.t = 0;
        f.delay = i * 0.035;
        f.dir = 1;
        f.start = { x: pos[i].x, y: pos[i].y };
        f.vx = (Math.random() - 0.5) * 900 * (c.base.x || 1);
        f.vy = 420 + Math.random() * 380;
        f.vz = 200 + Math.random() * 300;
        f.rot = (Math.random() - 0.5) * 60;
        f.rx = (Math.random() - 0.5) * 40;
        void now;
      });
    };
    const onBack = () => {
      if (!shattered) return;
      setShattered(false);
      CUTS.forEach((c, i) => {
        const f = fly[i];
        if (!f.active) return;
        f.dir = -1;
        f.delay = i * 0.03;
        f.t = 0;
      });
    };
    window.addEventListener("dbu-shatter", onShatter);
    window.addEventListener("dbu-back", onBack);

    const easeInCubic = (t: number) => t * t * t;
    const easeOutBack = (t: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = (nowMs: number) => {
      const dt = Math.min(0.05, (nowMs - last) / 1000);
      last = nowMs;
      const t = nowMs / 1000;

      if (!reduced && !shattered) {
        tilt.x += (tilt.tx - tilt.x) * Math.min(1, dt / 0.3);
        tilt.y += (tilt.ty - tilt.y) * Math.min(1, dt / 0.3);
      }

      // breathing drift
      if (!shattered) {
        CUTS.forEach((c, i) => {
          pos[i].x = Math.sin(t * (0.1 + i * 0.017) * Math.PI * 2 + i * 1.3) * 7;
          pos[i].y = Math.sin(t * (0.09 + i * 0.013) * Math.PI * 2 + i * 2.1) * 9;
        });
      }

      // hover lift
      const hoverLift = hovered !== null ? -14 : 0;

      // apply transforms
      CUTS.forEach((c, i) => {
        const el = shardRefs.current[i];
        if (!el) return;
        const f = fly[i];
        if (f.active) {
          f.t += dt;
          const tt = Math.max(0, f.t - f.delay);
          if (f.dir === 1) {
            const k = Math.min(1, tt / 0.72);
            const e = easeInCubic(k);
            const x = f.start.x + f.vx * e * 0.72;
            const y = f.start.y + f.vy * e * 0.72 * 0.4;
            const z = f.vz * e;
            const rot = f.rot * e;
            el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) rotateX(${f.rx * e}deg)`;
            el.style.opacity = String(1 - e * 0.55);
            if (k >= 1) f.active = false;
          } else {
            const k = Math.min(1, tt / 0.72);
            const e = easeOutBack(k);
            const x = lerp(f.start.x, pos[i].x, e);
            const y = lerp(f.start.y, pos[i].y, e);
            el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(f.rot * (1 - e)).toFixed(2)}deg) rotateX(${(f.rx * (1 - e)).toFixed(2)}deg)`;
            el.style.opacity = String(1);
            if (k >= 1) f.active = false;
          }
        } else if (!shattered) {
          const lift = hovered === i ? hoverLift : 0;
          el.style.transform = `translate3d(${pos[i].x.toFixed(2)}px, ${pos[i].y.toFixed(2)}px, ${lift}px)`;
          el.style.opacity = "1";
        }
      });

      if (!reduced) {
        slab.style.transform = `rotateX(${tilt.y.toFixed(2)}deg) rotateY(${tilt.x.toFixed(2)}deg)`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("dbu-shatter", onShatter);
      window.removeEventListener("dbu-back", onBack);
    };
  }, [shattered, hovered]);

  const doShatter = () => {
    window.dispatchEvent(new Event("dbu-shatter"));
    window.setTimeout(() => window.dispatchEvent(new Event("dbu-shown")), 280);
  };
  const doBack = () => window.dispatchEvent(new Event("dbu-back"));

  return (
    <section
      className="relative min-h-[100svh] w-full overflow-hidden bg-[#050507]"
      aria-label="The toolbox in glass"
    >
      <div
        className="flex min-h-[100svh] flex-col justify-center"
        style={{ padding: "8.5vh 5.5%" }}
      >
        {/* shard panel */}
        <div
          ref={slabRef}
          className="relative flex-1"
          style={{ minHeight: "62vh", transformStyle: "preserve-3d", perspective: "1600px" }}
        >
          {/* glass shards */}
          {CUTS.map((c, i) => (
            <div
              key={c.name}
              ref={(el) => {
                shardRefs.current[i] = el;
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="absolute"
              style={{
                left: `${c.box.left * 100}%`,
                top: `${c.box.top * 100}%`,
                width: `${c.box.w * 100}%`,
                height: `${c.box.h * 100}%`,
              }}
            >
              {/* glass surface — the only clipped layer */}
              <div
                className="dbu-shard absolute inset-0"
                style={{ clipPath: c.clip }}
                aria-hidden
              />
              {/* content — never clipped, so labels always read in full */}
              <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-7">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#163D2B]">
                  {String(i + 1).padStart(2, "0")} — {c.count} tools
                </p>
                <p className="mt-2 text-base font-semibold uppercase tracking-tight text-[#121212] sm:text-xl">
                  {c.name}
                </p>
                <Link href={c.href} className="mt-2 text-[11px] text-[#121212]/60 underline-offset-4 hover:text-[#121212] hover:underline">
                  Open category ↗
                </Link>
              </div>
            </div>
          ))}

          {/* printed hero content over the hero shard — none; shards speak for themselves */}

          {/* actions */}
          <div className="absolute z-20 flex items-center gap-5 sm:left-9 sm:bottom-9 max-sm:left-6 max-sm:bottom-6">
            <Link
              href="/tools"
              className="rounded-md bg-[#e8e8ec] px-5 py-3 text-xs font-semibold text-[#121212] transition-colors hover:bg-[#36d67e] hover:text-[#050507]"
            >
              Open the directory
            </Link>
            <button
              type="button"
              onClick={doShatter}
              className="text-xs font-semibold text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              See the specs →
            </button>
          </div>
        </div>
      </div>

      {/* definitions view */}
      <div
        className={
          "absolute inset-0 z-30 bg-black transition-opacity duration-[400ms] " +
          (shattered ? "opacity-100" : "pointer-events-none opacity-0")
        }
      >
        <div className="absolute left-[8%] top-[20%] w-[84%] md:left-[32.4%] md:w-[33.9%]">
          <h2 className="text-2xl font-semibold tracking-[-0.022em] text-white md:text-[1.36vw]">
            The toolbox, in five terms.
          </h2>
          <div className="mt-4 space-y-4 md:mt-[1.05vw] md:space-y-[1.05vw]">
            {TERMS.map((t) => (
              <p key={t.term} className="text-sm leading-[1.72] text-white/60 md:text-[0.73vw]">
                <Link href={t.href} className="font-semibold text-white hover:underline">
                  {t.term}
                </Link>
                <span> — {t.def}</span>
              </p>
            ))}
          </div>
          <button
            type="button"
            onClick={doBack}
            className="mt-8 inline-flex items-center justify-center rounded-xl border border-white/15 bg-[#17171b]/80 px-6 py-3 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-[#24243a] hover:text-[#b9abff] md:text-[0.66vw]"
          >
            ← Back
          </button>
        </div>
      </div>

      <style href="st-glassshards-1" precedence="high" dangerouslySetInnerHTML={{ __html: `
        .dbu-shard {
          /* white frosted glass */
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.72) 0%,
            rgba(255, 255, 255, 0.42) 50%,
            rgba(255, 255, 255, 0.55) 100%
          );
          backdrop-filter: blur(12px) saturate(1.15);
          border: 1px solid rgba(255, 255, 255, 0.75);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 0 40px rgba(255, 255, 255, 0.25),
            0 30px 70px rgba(0, 0, 0, 0.55);
          transition:
            border-color 0.4s var(--ease, cubic-bezier(0.19, 1, 0.22, 1)),
            background 0.4s var(--ease, cubic-bezier(0.19, 1, 0.22, 1));
          will-change: transform;
        }
        .dbu-shard:hover {
          border-color: rgba(255, 255, 255, 1);
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.85) 0%,
            rgba(255, 255, 255, 0.55) 50%,
            rgba(255, 255, 255, 0.7) 100%
          );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 1),
            inset 0 0 50px rgba(255, 255, 255, 0.4),
            0 40px 90px rgba(0, 0, 0, 0.55),
            0 0 60px rgba(255, 255, 255, 0.2);
        }
      ` }} />

      {/* keep the night prop referenced — the glass is always dark */}
      <span className="hidden">{String(night)}</span>
    </section>
  );
}
