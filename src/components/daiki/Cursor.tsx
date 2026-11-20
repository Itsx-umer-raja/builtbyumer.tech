"use client";

import { useEffect, useRef } from "react";

/** Custom cursor: small difference-blend dot that grows over interactive elements. */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    document.body.classList.add("dbu-has-cursor");

    let cx = 0;
    let cy = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a,button,.dbu-title,.dbu-plate")) {
        el.classList.add("dbu-big");
      }
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a,button,.dbu-title,.dbu-plate")) {
        el.classList.remove("dbu-big");
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    const loop = () => {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      el.style.transform = `translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.body.classList.remove("dbu-has-cursor");
    };
  }, []);

  return <div ref={ref} className="dbu-cursor" aria-hidden />;
}
