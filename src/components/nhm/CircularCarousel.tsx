"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";

export interface CircularCarouselItem {
  src?: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  href?: string;
  icon?: ReactNode;
  accent?: string;
}

export interface CircularCarouselProps {
  items: CircularCarouselItem[];
  preset?: "flat" | "cylinder" | "helix";
  intro?: "rise" | "fade" | "zoom" | "none";
  cardWidth?: number;
  aspectRatio?: number;
  /** drift speed — maps to roughly speed/40 cards per second */
  speed?: number;
  captions?: boolean;
  /** extra spacing between cards, in px */
  gap?: number;
  /** scene rotateX in degrees */
  tilt?: number;
  /** ring curvature multiplier (1 = natural cylinder) */
  curve?: number;
  perspective?: number;
  autoplay?: "drift" | "step" | "none" | false;
  /** seconds between steps (step mode) */
  interval?: number;
  direction?: "left" | "right";
  /** velocity retention on drag release, 0..1 per frame */
  momentum?: number;
  snap?: boolean;
  pauseOnHover?: boolean;
  focusOnClick?: boolean;
  draggable?: boolean;
  /** image parallax inside the card, 0..1 */
  parallax?: number;
  /** side-card shrink, 0..1 */
  stretch?: number;
  fadeColor?: string;
  /** how strongly far cards fade into fadeColor, 0..1 */
  depthFade?: number;
  /** constant inner vignette strength, 0..1 */
  innerShade?: number;
  cornerRadius?: number;
  style?: CSSProperties;
  className?: string;
}

/**
 * A wrapped-window 3D carousel: only the cards near the front are laid out
 * on the visible arc of the cylinder (a full 145-card ring would be a flat
 * wall), while the position advances continuously through the whole list —
 * so every item comes around. One rAF loop drives everything with direct
 * DOM writes; React state is not touched per frame.
 */
export function CircularCarousel({
  items,
  preset = "cylinder",
  intro = "none",
  cardWidth = 220,
  aspectRatio = 1,
  speed = 14,
  captions = false,
  gap = 0,
  tilt = 0,
  curve = 1,
  perspective = 2500,
  autoplay = "none",
  interval = 3,
  direction = "left",
  momentum = 0.6,
  snap = false,
  pauseOnHover = false,
  focusOnClick = false,
  draggable = false,
  parallax = 0,
  stretch = 0,
  fadeColor = "#000000",
  depthFade = 0,
  innerShade = 0,
  cornerRadius = 12,
  style,
  className,
}: CircularCarouselProps) {
  const N = Math.max(1, items.length);
  const VISIBLE = Math.min(N, 10); // cards laid out around the front arc
  const arcLen = cardWidth + gap; // arc length per card
  const baseRadius = Math.max(480, (cardWidth * VISIBLE) / (2 * Math.PI) * (2 * Math.PI) / (2 * Math.PI));
  const R = useMemo(() => {
    if (preset === "flat") return 100000;
    // Radius that gives a pleasing drum for VISIBLE cards at this card size.
    const r = cardWidth * (VISIBLE / 2) / Math.sin(Math.PI / VISIBLE) / 1.9;
    return Math.max(500, r * Math.max(0.25, curve));
  }, [preset, cardWidth, VISIBLE, curve]);
  void baseRadius;

  const phiPerCard = Math.min(0.42, arcLen / R); // radians of arc per card

  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const shadeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const parallaxRefs = useRef<Array<HTMLDivElement | null>>([]);

  const posRef = useRef(0); // continuous position in card units
  const velRef = useRef(0); // cards per second
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const focusTargetRef = useRef<number | null>(null);
  const stepAccRef = useRef(0);
  const visibleRef = useRef(true);

  const dirSign = direction === "left" ? -1 : 1;
  const cardHeight = Math.round(cardWidth * aspectRatio);

  /* ── Single rAF loop ── */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const wrap = (d: number) => {
      // signed wrapped distance in card units, (‑N/2, N/2]
      return ((((d % N) + N) % N) + N / 2) % N - N / 2;
    };

    const tick = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;

      if (!visibleRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }

      if (!draggingRef.current && !pausedRef.current) {
        const pos = posRef.current;
        const vel = velRef.current;

        if (Math.abs(vel) > 0.002) {
          // momentum decay
          velRef.current = vel * Math.pow(momentum, dt * 60);
          posRef.current = pos + velRef.current * dt;
        } else if (focusTargetRef.current !== null) {
          const delta = wrap(focusTargetRef.current - pos);
          if (Math.abs(delta) < 0.002) {
            posRef.current = focusTargetRef.current;
            focusTargetRef.current = null;
          } else {
            posRef.current = pos + delta * Math.min(1, 1 - Math.exp(-9 * dt));
          }
        } else if (snap) {
          const target = Math.round(pos);
          const delta = target - pos;
          if (Math.abs(delta) > 0.001) {
            posRef.current = pos + delta * Math.min(1, 1 - Math.exp(-7 * dt));
          }
        } else if (autoplay === "drift") {
          posRef.current = pos + dirSign * (speed / 40) * dt;
        }
      }

      if (
        !pausedRef.current &&
        autoplay === "step" &&
        focusTargetRef.current === null &&
        !draggingRef.current
      ) {
        acc += dt;
        if (acc >= interval) {
          acc = 0;
          focusTargetRef.current = Math.round(posRef.current) + dirSign;
        }
      }

      // Lay out the visible window
      const pos = posRef.current;
      for (let i = 0; i < N; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;
        const d = wrap(i - pos);
        if (Math.abs(d) > VISIBLE) {
          if (card.style.visibility !== "hidden") card.style.visibility = "hidden";
          continue;
        }
        if (card.style.visibility !== "visible") card.style.visibility = "visible";

        const phi = d * phiPerCard; // radians around the drum
        const frontness = Math.cos(phi);

        const x = preset === "flat" ? d * arcLen : Math.sin(phi) * R;
        const z = preset === "flat" ? 0 : R * (Math.cos(phi) - 1);
        const rotY = preset === "flat" ? 0 : (-phi * 180) / Math.PI;
        const y =
          preset === "helix" ? Math.sin(i * 1.7) * 26 : Math.sin(d * 0.6) * 6;

        card.style.transform =
          `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${rotY.toFixed(3)}deg)`;

        const scale = 1 - stretch * (1 - frontness) * 0.18;
        card.style.scale = scale !== 1 ? scale.toFixed(4) : "";

        const shade = shadeRefs.current[i];
        if (shade) {
          shade.style.opacity = (depthFade * Math.max(0, 1 - (frontness + 1) / 2)).toFixed(3);
        }

        const px = parallaxRefs.current[i];
        if (px) {
          px.style.transform = `translateX(${(Math.sin(phi) * cardWidth * parallax * 0.5).toFixed(2)}px)`;
        }
      }

      raf = requestAnimationFrame(tick);
    };
    // Only burn frames while the drum is on screen.
    const io = new IntersectionObserver(([en]) => (visibleRef.current = en.isIntersecting));
    if (sceneRef.current) io.observe(sceneRef.current);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [N, VISIBLE, arcLen, R, phiPerCard, preset, momentum, snap, autoplay, dirSign, speed, interval, stretch, depthFade, parallax, cardWidth]);

  /* ── Dragging ── */
  const lastDragX = useRef(0);
  const lastDragT = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!draggable) return;
      draggingRef.current = true;
      velRef.current = 0;
      focusTargetRef.current = null;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      lastDragX.current = e.clientX;
      lastDragT.current = performance.now();
    },
    [draggable],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const now = performance.now();
    const dx = e.clientX - lastDragX.current;
    const dt = Math.max(1, now - lastDragT.current);
    lastDragX.current = e.clientX;
    lastDragT.current = now;
    posRef.current += dx / arcLen;
    velRef.current = dx / arcLen / dt * 1000; // cards per second
  }, [arcLen]);

  const onPointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (Math.abs(velRef.current) < 0.05) velRef.current = 0;
  }, []);

  const isFront = useCallback(
    (index: number) => {
      const d = ((((index - posRef.current) % N) + N + N / 2) % N) - N / 2;
      return Math.abs(d) < 0.5;
    },
    [N],
  );

  const onItemClick = useCallback(
    (e: React.MouseEvent, index: number, href?: string) => {
      if (focusOnClick && !isFront(index)) {
        e.preventDefault();
        focusTargetRef.current = Math.round(posRef.current) + ((((index - Math.round(posRef.current)) % N) + N + N / 2) % N) - N / 2 + Math.round(posRef.current);
        return;
      }
      if (!href) e.preventDefault();
    },
    [focusOnClick, isFront, N],
  );

  const introMotion =
    intro === "rise"
      ? { initial: { opacity: 0, y: 90 }, whileInView: { opacity: 1, y: 0 } }
      : intro === "fade"
        ? { initial: { opacity: 0 }, whileInView: { opacity: 1 } }
        : intro === "zoom"
          ? { initial: { opacity: 0, scale: 0.85 }, whileInView: { opacity: 1, scale: 1 } }
          : null;

  const Wrapper = (introMotion ? motion.div : "div") as "div";
  const wrapperProps: Record<string, unknown> = introMotion
    ? {
        ...introMotion,
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={className}
      style={{ position: "relative", width: "100%", overflow: "hidden", ...style }}
      onMouseEnter={() => {
        if (pauseOnHover) pausedRef.current = true;
      }}
      onMouseLeave={() => {
        if (pauseOnHover) pausedRef.current = false;
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        ref={sceneRef}
        style={{
          position: "relative",
          height: cardHeight + 140,
          perspective: `${perspective}px`,
          perspectiveOrigin: "50% 45%",
          touchAction: draggable ? "pan-y" : "auto",
          cursor: draggable ? "grab" : "default",
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            style={{
              position: "absolute",
              left: `calc(50% - ${cardWidth / 2}px)`,
              top: `calc(50% - ${cardHeight / 2 + 10}px)`,
              width: cardWidth,
              height: cardHeight,
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
          >
            <a
              href={item.href ?? "#"}
              onClick={(e) => onItemClick(e, i, item.href)}
              draggable={false}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                borderRadius: cornerRadius,
                overflow: "hidden",
                position: "relative",
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.14)",
                textDecoration: "none",
                userSelect: "none",
                WebkitUserDrag: "none",
              } as CSSProperties}
            >
              {item.src ? (
                <div
                  ref={(el) => {
                    parallaxRefs.current[i] = el;
                  }}
                  style={{ position: "absolute", inset: 0, willChange: "transform" }}
                >
                  <img
                    src={item.src}
                    alt={item.alt ?? item.title ?? ""}
                    loading="lazy"
                    draggable={false}
                    style={{ width: "112%", height: "100%", objectFit: "cover", marginLeft: "-6%" }}
                  />
                </div>
              ) : (
                <div
                  ref={(el) => {
                    parallaxRefs.current[i] = el;
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    background: "linear-gradient(165deg, #1e1e1e 0%, #0a0a0a 65%, #163D2B 170%)",
                    padding: 12,
                    willChange: "transform",
                  }}
                >
                  <span style={{ color: item.accent ?? "#C6F35C", display: "flex" }}>
                    {item.icon}
                  </span>
                  <span
                    style={{
                      color: "#fcfcfc",
                      fontSize: Math.max(10, Math.min(14, cardWidth * 0.066)),
                      fontWeight: 500,
                      textAlign: "center",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.title}
                  </span>
                  <span
                    style={{
                      color: "rgba(252,252,252,0.45)",
                      fontSize: 9,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    {item.subtitle}
                  </span>
                </div>
              )}

              {captions && item.src && item.title && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: "28px 12px 10px",
                    background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.75))",
                    color: "#fcfcfc",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.title}</div>
                  {item.subtitle && (
                    <div
                      style={{
                        fontSize: 10,
                        opacity: 0.65,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.subtitle}
                    </div>
                  )}
                </div>
              )}

              {innerShade > 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: cornerRadius,
                    pointerEvents: "none",
                    background:
                      "radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(0,0,0,0.9) 100%)",
                    opacity: innerShade,
                  }}
                />
              )}
              <div
                ref={(el) => {
                  shadeRefs.current[i] = el;
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: cornerRadius,
                  pointerEvents: "none",
                  background: fadeColor,
                  opacity: 0,
                }}
              />
            </a>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}
