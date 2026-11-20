"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { TOOLS } from "@/data/tools";
import { CATEGORIES } from "@/data/categories";

/**
 * "What's in the box" — the premium 3D card cylinder from the reference,
 * where every card is one BuiltByUmer category: the front shows the
 * category film + how many tools it holds, the back lists the actual
 * tools. The physics (continuous progress, magnetic dwell, smoothstep
 * side push, perspective-aware peek, volumetric thickness, mouse tilt
 * with inertia) follows the supplied source.
 */

const CARD_VIDEOS = [
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_030111_a9e15665-d379-4a7f-8116-695bbe452ad1.mp4",
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_171347_f640c30d-ec21-426a-98bc-77e07c2c60cb.mp4",
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4",
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4",
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_115655_b4d9cd77-feed-43cd-a198-af78ebdf1f7a.mp4",
];

interface CardInfo {
  category: string;
  href: string;
  name: string;
  tag: string;
}

const CARDS: CardInfo[] = [
  { category: "pdf-tools", href: "/pdf-tools", name: "PDF SUITE", tag: "Documents" },
  { category: "image-tools", href: "/image-tools", name: "IMAGE LAB", tag: "Photos" },
  { category: "qr-tools", href: "/qr-tools", name: "QR STUDIO", tag: "Codes" },
  { category: "developer-tools", href: "/developer-tools", name: "DEV KIT", tag: "Code" },
  { category: "calculators", href: "/calculators", name: "NUMBERS", tag: "Daily math" },
];

function toolsOf(category: string) {
  return TOOLS.filter((t) => t.category === category);
}

/** Volumetric thickness slices (30% reduced, from the reference). */
const THICKNESS = [-1.47, -0.73, 0, 0.73, 1.47];

function BUMark() {
  return (
    <svg className="w-9 h-10" viewBox="0 0 34 36" fill="none" aria-hidden>
      <path d="M17 1 32 9.5v17L17 35 2 26.5v-17Z" stroke="white" strokeWidth="2" fill="none" />
      <path
        d="M11 25V11h5.4a3.4 3.4 0 0 1 0 6.8H11m5.2 0 3.8 4.6"
        stroke="#C6F35C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function ToolCardCarousel() {
  const cardsRefs = useRef<Array<HTMLDivElement | null>>([]);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const frameId = useRef(0);
  const progress = useRef(0);
  const visibleRef = useRef(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const metricsRef = useRef({ cardW: 336, cardH: 211, h: 900 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const ry = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      mouse.current.targetX = Math.max(-1, Math.min(1, rx));
      mouse.current.targetY = Math.max(-1, Math.min(1, ry));
    };
    const handleMouseLeave = () => {
      mouse.current.targetX = 0;
      mouse.current.targetY = 0;
    };
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    const measure = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let cardW = Math.round(w * 0.16 + 130);
      const heightFactor = Math.min(1.0, Math.max(0.65, h / 850));
      cardW = Math.round(cardW * heightFactor);
      cardW = Math.min(336, Math.max(150, cardW));
      const cardH = Math.round(cardW / 1.5925);
      metricsRef.current = { cardW, cardH, h };
    };
    measure();
    window.addEventListener("resize", measure);

    const renderLoop = () => {
      progress.current += 0.0016;
      mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.08;
      mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.08;

      const { cardW, cardH, h } = metricsRef.current;
      const cardCount = CARDS.length;
      const continuousProgress = progress.current;
      const roundedIndex = Math.round(continuousProgress);
      const diffFromRound = continuousProgress - roundedIndex;

      // Magnetic dwell at the front centre, then accelerate to the next card.
      const easedDiff =
        (Math.sign(diffFromRound) * Math.pow(Math.abs(diffFromRound) * 2, 4.2)) / 2;
      const virtualActiveIndex = roundedIndex + easedDiff;

      for (let i = 0; i < cardCount; i++) {
        const card = cardsRefs.current[i];
        if (!card) continue;

        let offset = i - virtualActiveIndex;
        const halfCount = cardCount / 2;
        while (offset > halfCount) offset -= cardCount;
        while (offset < -halfCount) offset += cardCount;

        const absOffset = Math.abs(offset);
        const sign = Math.sign(offset);

        if (absOffset > 3.0) {
          card.style.visibility = "hidden";
          continue;
        }
        card.style.visibility = "visible";

        const gap = 36;
        const peekAmount = -55;
        const D = 1350;

        let y = 0;
        let z = 0;
        let rot = 0;

        if (absOffset <= 1) {
          const t = absOffset;
          const easedT = t * t * (3 - 2 * t);
          const targetY = cardH + gap;
          y = -sign * (easedT * targetY);
          z = 400 + easedT * (220 - 400);
          rot = easedT * 132;
        } else if (absOffset <= 2) {
          const t = absOffset - 1;
          const easedT = t * t * (3 - 2 * t);
          const yStart = cardH + gap;
          const zStart = 220;
          const rotStart = 132;
          const zEnd = -60;
          const rotEnd = 175;
          const sEnd = D / (D - zEnd);
          const yEnd = (h / 2 - peekAmount) / sEnd - cardH / 2;
          const currentY = yStart + easedT * (yEnd - yStart);
          y = -sign * currentY;
          z = zStart + easedT * (zEnd - zStart);
          rot = rotStart + easedT * (rotEnd - rotStart);
        } else {
          const t = Math.min(absOffset - 2, 1);
          const easedT = t * t * (3 - 2 * t);
          const zStart = -60;
          const rotStart = 175;
          const zEnd3 = -250;
          const rotEnd3 = 195;
          const sEnd2 = D / (D - zStart);
          const yEnd2 = (h / 2 - peekAmount) / sEnd2 - cardH / 2;
          const sEnd3 = D / (D - zEnd3);
          const yEnd3 = (h / 2 + 100) / sEnd3 + cardH / 2;
          const currentY = yEnd2 + easedT * (yEnd3 - yEnd2);
          y = -sign * currentY;
          z = zStart + easedT * (zEnd3 - zStart);
          rot = rotStart + easedT * (rotEnd3 - rotStart);
        }

        const localCardRotation = -sign * rot;
        const centerFactor = Math.max(0, 1 - absOffset);
        const maxTiltY = 15;
        const maxTiltX = 12;
        const activeTiltX = -mouse.current.y * maxTiltX * centerFactor;
        const activeTiltY = mouse.current.x * maxTiltY * centerFactor;
        const totalRotX = localCardRotation + activeTiltX;
        const totalRotY = activeTiltY;

        card.style.zIndex = Math.round(z).toString();
        card.style.transform = `translateY(${y.toFixed(2)}px) translateZ(${z.toFixed(2)}px) rotateX(${totalRotX.toFixed(2)}deg) rotateY(${totalRotY.toFixed(2)}deg) rotateZ(-3deg)`;

        // Only the front card decodes video — the rest pause (perf).
        const v = videoRefs.current[i];
        if (v) {
          if (absOffset < 0.6) {
            if (v.paused) v.play().catch(() => {});
          } else if (!v.paused) {
            v.pause();
          }
        }
      }
    };

    const tick = () => {
      if (visibleRef.current) renderLoop();
      frameId.current = requestAnimationFrame(tick);
    };
    frameId.current = requestAnimationFrame(tick);

    // only burn frames while the carousel is on screen
    const io = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
    });
    io.observe(rootRef.current!);

    return () => {
      cancelAnimationFrame(frameId.current);
      io.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative h-[200px] lg:h-[100svh] w-full overflow-hidden bg-black select-none">
      {/* corner labels */}
      <p className="absolute left-4 top-4 z-10 font-mono text-[9px] uppercase tracking-[0.18em] text-white/50 sm:left-6 sm:top-6 md:left-12 md:top-8">
        (04) What&apos;s inside
      </p>
      <p className="absolute right-4 top-4 z-10 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35 sm:right-6 sm:top-6 md:right-12 md:top-8">
        {CATEGORIES.length} categories · {TOOLS.length} tools
      </p>

      {/* 3D perspective camera space */}
      <div
        className="relative flex h-full w-full items-center justify-center"
        style={{ perspective: "1350px" }}
      >
        <div
          className="absolute"
          style={{
            width: "336px",
            height: "211px",
            transformStyle: "preserve-3d",
          }}
        >
          {CARDS.map((info, i) => {
            const tools = toolsOf(info.category);
            const videoSrc = CARD_VIDEOS[i % CARD_VIDEOS.length];
            return (
              <div
                key={info.category}
                ref={(el) => {
                  cardsRefs.current[i] = el;
                }}
                className="absolute inset-0"
                style={{
                  width: "336px",
                  height: "211px",
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "visible",
                }}
              >
                {THICKNESS.map((zOffset, layerIdx) => {
                  const isFrontFace = layerIdx === THICKNESS.length - 1;
                  const isBackFace = layerIdx === 0;

                  // middle structural slice
                  if (!isFrontFace && !isBackFace) {
                    return (
                      <div
                        key={layerIdx}
                        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[16px] border border-[#808080]"
                        style={{ backgroundColor: "#808080", transform: `translateZ(${zOffset}px)` }}
                      />
                    );
                  }

                  if (isFrontFace) {
                    return (
                      <div
                        key={layerIdx}
                        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[16px] border border-white/15"
                        style={{
                          backgroundColor: "#0f0f0f",
                          transform: `translateZ(${zOffset}px)`,
                          backfaceVisibility: "hidden",
                          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)",
                        }}
                      >
                        <video
                          ref={(el) => {
                            videoRefs.current[i] = el;
                          }}
                          src={videoSrc}
                          preload="metadata"
                          muted
                          loop
                          playsInline
                          className="absolute inset-0 h-full w-full rounded-[16px] object-cover"
                        />
                        <div className="absolute inset-0 z-10 h-full w-full bg-black/25 p-5 text-white sm:p-6">
                          {/* BuiltByUmer mark — top right */}
                          <div className="absolute right-5 top-5 opacity-95 sm:right-6 sm:top-6">
                            <BUMark />
                          </div>
                          {/* category name — tells what's on the card */}
                          <div className="absolute left-5 top-5 sm:left-6 sm:top-6">
                            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/60">
                              {info.tag}
                            </p>
                            <p className="mt-1 text-lg font-semibold uppercase tracking-tight sm:text-xl">
                              {info.name}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-[#C6F35C]">
                              {tools.length} TOOLS
                            </p>
                          </div>
                          {/* metallic chip — mid left */}
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 sm:left-6">
                            <svg className="h-6 w-6 sm:h-[29px] sm:w-[29px]" viewBox="0 0 60 60" fill="none" aria-hidden>
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M20 8H40V14C40.0016 14.5299 40.2128 15.0377 40.5875 15.4125C40.9623 15.7872 41.4701 15.9984 42 16H59V24H42C41.4701 24.0016 40.9623 24.2128 40.5875 24.5875C40.2128 24.9623 40.0016 25.4701 40 26V52H20V8ZM18 8H8.00039C4.47435 8 1.56576 10.6083 1.08 14H18V8ZM1 16V24V26V34V36V44H18V36H1V34H18V26H1V24H18V16H1ZM1.08 46C1.56576 49.3917 4.47435 52 8.00039 52H18V46H1.08ZM42 14V8H52.0004C55.5264 8 58.4342 10.6084 58.92 14H42ZM59 26H42V34H59V26ZM59 36H42V44H59V36ZM52.0004 52H42V46H58.92C58.4342 49.3916 55.5264 52 52.0004 52Z"
                                fill={`url(#cardChip${i})`}
                              />
                              <defs>
                                <linearGradient id={`cardChip${i}`} x1="30" y1="8" x2="30" y2="52" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="white" />
                                  <stop offset="1" stopColor="#999999" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                          {/* intersecting circles — bottom right */}
                          <div className="absolute bottom-5 right-5 flex -space-x-3 items-center opacity-90 sm:bottom-6 sm:right-6">
                            <div className="h-5 w-5 rounded-full border border-white/10 bg-white/20 backdrop-blur-[1px] sm:h-6 sm:w-6" />
                            <div className="h-5 w-5 rounded-full border border-white/10 bg-white/35 backdrop-blur-[1px] sm:h-6 sm:w-6" />
                          </div>
                        </div>
                        {/* real hit area */}
                        <Link
                          href={info.href}
                          className="absolute inset-0 z-20"
                          aria-label={`Open ${info.name}`}
                        />
                      </div>
                    );
                  }

                  if (isBackFace) {
                    return (
                      <div
                        key={layerIdx}
                        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[16px] border border-white/15"
                        style={{
                          backgroundColor: "#0f0f0f",
                          transform: `translateZ(${zOffset}px) rotateX(180deg)`,
                          backfaceVisibility: "hidden",
                          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)",
                        }}
                      >
                        {/* back background — static gradient (a second video decode per card is wasteful) */}
                        <div
                          className="pointer-events-none absolute inset-0"
                          style={{
                            background:
                              "radial-gradient(120% 120% at 20% 10%, rgba(198,243,92,0.10) 0%, rgba(10,10,12,0.95) 55%), linear-gradient(160deg, #1c1c1e 0%, #060607 100%)",
                          }}
                        />
                        <div className="absolute left-0 right-0 top-4 z-10 h-7 bg-black/85 backdrop-blur-md sm:top-5 sm:h-9" />
                        <div
                          className="absolute bottom-4 left-4 z-20 flex flex-col gap-1 text-left sm:bottom-5 sm:left-6"
                          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                        >
                          {tools.slice(0, 3).map((t, ti) => (
                            <div
                              key={t.id}
                              className="font-mono text-[10px] font-medium tracking-[0.12em] text-white sm:text-[11px]"
                            >
                              <span className="text-[#C6F35C]">{String(ti + 1).padStart(2, "0")}</span>{" "}
                              {t.title.toUpperCase()}
                            </div>
                          ))}
                          <div className="mt-1 font-mono text-[8px] font-medium tracking-[0.14em] text-white/60 sm:text-[9px]">
                            +{tools.length - 3} MORE — TAP TO OPEN
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        /* Carousel scale on mobile */
        @media (max-width: 640px) {
          .relative.flex.items-center.justify-center > .absolute {
            transform: scale(0.5);
          }
        }
        @media (max-width: 480px) {
          .relative.flex.items-center.justify-center > .absolute {
            transform: scale(0.4);
          }
        }
        @media (max-width: 400px) {
          .relative.flex.items-center.justify-center > .absolute {
            transform: scale(0.35);
          }
        }
      `}</style>
    </div>
  );
}
