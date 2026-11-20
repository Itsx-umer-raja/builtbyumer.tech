"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom cursor: vermillion dot + trailing ring. The ring grows over
 * links/buttons and shows a label over [data-cursor="view"] targets.
 * Never rendered on touch devices or with reduced motion.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<"default" | "hover" | "view">("default");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEnabled(true);

    const pos = { x: -100, y: -100 };
    const ring = { x: -100, y: -100 };
    let raf = 0;
    let lastMode: string | null = null;

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      setVisible(true);
      const t = (e.target as HTMLElement | null)?.closest?.(
        "[data-cursor], a, button",
      ) as HTMLElement | null;
      const next =
        t?.dataset?.cursor === "view"
          ? "view"
          : t
            ? "hover"
            : "default";
      if (next !== lastMode) {
        lastMode = next;
        setMode(next as "default" | "hover" | "view");
      }
    };
    const onLeave = () => setVisible(false);

    const loop = () => {
      ring.x += (pos.x - ring.x) * 0.16;
      ring.y += (pos.y - ring.y) * 0.16;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.x}px, ${ring.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  const ringSize = mode === "view" ? 76 : mode === "hover" ? 52 : 36;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] hidden [@media(pointer:fine)]:block"
      style={{ opacity: visible ? 1 : 0, transition: "opacity .3s" }}
    >
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-2 w-2 rounded-full bg-hv-accent"
      />
      <div
        ref={ringRef}
        className="fixed left-0 top-0 flex items-center justify-center rounded-full border border-hv-ink/50 bg-hv-ink/[0.03] backdrop-blur-[1px] transition-[width,height,background-color,border-color] duration-300 ease-out"
        style={{
          width: ringSize,
          height: ringSize,
          backgroundColor:
            mode === "view" ? "var(--hv-accent)" : "rgba(242,239,231,0.03)",
          borderColor:
            mode === "view" ? "var(--hv-accent)" : "rgba(242,239,231,0.5)",
        }}
      >
        <span
          ref={labelRef}
          className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-hv-ink transition-opacity duration-200"
          style={{ opacity: mode === "view" ? 1 : 0 }}
        >
          Open
        </span>
      </div>
    </div>
  );
}
