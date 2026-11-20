/**
 * Lightweight atmospheric particle layer for the Fernhollow hero.
 *
 * The authorised Three.js valley engine is not available in this project,
 * so per the specification this recreates a modest particle + cursor
 * atmosphere with a plain 2D canvas: glowing dust motes that drift,
 * parallax with the pointer and scatter around the cursor.
 */

export interface ParticleHandle {
  destroy: () => void;
}

interface Mote {
  x: number;
  y: number;
  z: number; // depth 0..1 — drives size, speed and parallax
  vx: number;
  vy: number;
  phase: number;
}

export function initHeroParticles(container: HTMLElement): ParticleHandle {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy: () => canvas.remove() };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 820px)").matches;
  const COUNT = isMobile ? 40 : 110;

  let w = 0;
  let h = 0;
  let dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = container.clientWidth;
    h = container.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const motes: Mote[] = Array.from({ length: COUNT }, () => {
    const z = Math.random();
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      z,
      vx: (Math.random() - 0.5) * 0.16 * (0.4 + z),
      vy: -0.06 - Math.random() * 0.22 * (0.4 + z),
      phase: Math.random() * Math.PI * 2,
    };
  });

  const pointer = { x: -9999, y: -9999, px: 0, py: 0 };
  const onPointer = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
  };
  const onLeave = () => {
    pointer.x = -9999;
    pointer.y = -9999;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
  container.addEventListener("pointerleave", onLeave);

  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  let raf = 0;
  let t = 0;

  const draw = () => {
    t += 0.016;
    // Parallax eases toward the pointer.
    pointer.px += (pointer.x - pointer.px) * 0.04;
    pointer.py += (pointer.y - pointer.py) * 0.04;

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    for (const m of motes) {
      if (!reduced) {
        m.x += m.vx + Math.sin(t * 0.6 + m.phase) * 0.08;
        m.y += m.vy;
        // Cursor repulsion
        const dx = m.x - pointer.px;
        const dy = m.y - pointer.py;
        const d2 = dx * dx + dy * dy;
        const R = 130;
        if (d2 < R * R && d2 > 1) {
          const d = Math.sqrt(d2);
          const f = ((R - d) / R) * 1.6;
          m.x += (dx / d) * f;
          m.y += (dy / d) * f;
        }
      }
      if (m.y < -20) m.y = h + 20;
      if (m.x < -20) m.x = w + 20;
      if (m.x > w + 20) m.x = -20;

      const tw = 0.55 + 0.45 * Math.sin(t * 1.4 + m.phase * 3);
      const r = 0.8 + m.z * 2.4;
      const px = m.x + (pointer.px - w / 2) * 0.02 * m.z;
      const py = m.y + (pointer.py - h / 2) * 0.02 * m.z;

      const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 6);
      const alpha = (0.10 + m.z * 0.22) * tw;
      glow.addColorStop(0, `rgba(245,239,226,${alpha.toFixed(3)})`);
      glow.addColorStop(0.4, `rgba(198,243,92,${(alpha * 0.35).toFixed(3)})`);
      glow.addColorStop(1, "rgba(198,243,92,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, r * 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(245,239,226,${(alpha * 1.6).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
    raf = requestAnimationFrame(draw);
  };

  if (!reduced) {
    raf = requestAnimationFrame(draw);
  } else {
    draw();
    cancelAnimationFrame(raf);
  }

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else if (!reduced) {
      raf = requestAnimationFrame(draw);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.remove();
    },
  };
}
