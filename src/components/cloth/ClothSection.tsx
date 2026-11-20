"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";

const CLOTH_IMG =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/9212999e-7a4a-4f70-bc34-e4e1c4533b81.jpg";

/**
 * Holographic cloth hero — a verlet cloth simulation (pins, wind, grab,
 * carry) rendered as a textured mesh on a 2D canvas via per-cell affine
 * texture mapping. Same physics model as the reference, no WebGL needed.
 */
export function ClothSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [noCloth, setNoCloth] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const cv = canvas;
    let disposed = false;

    const markBroken = () => {
      if (!disposed) setNoCloth(true);
    };
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      new URLSearchParams(window.location.search).get("motion") !== "full";

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      markBroken();
      return;
    }
    const g = ctx as CanvasRenderingContext2D;

    /* ── cloth state ── */
    const COLS = 30;
    const ROWS = 26;
    const N = COLS * ROWS;
    const SIZE = 0.9;
    const ASP = 1.12;
    const CH = SIZE;
    const CW = SIZE * ASP;
    const SPREAD = 0.98;
    const PINROLL = (5.5 * Math.PI) / 180;
    const FLUTTER = 0.35;
    const DAMPING = 0.3;
    const CRUMPLE = 0.55;
    const GRAB_R = 0.1;
    const CARRY_R = 0.2;
    const GRAVITY = 2.6;
    const TILT = (-10 * Math.PI) / 180;
    const TURN = (-12 * Math.PI) / 180;
    const PERSP = 0.45;
    const MAX_SPEED = 12;
    const STEPS = 5;
    const CAM = Math.exp(Math.log(18) * (1 - PERSP) + Math.log(1.7) * PERSP);

    const pos = new Float32Array(N * 3);
    const prev = new Float32Array(N * 3);
    const rest = new Float32Array(N * 3);
    const flat = new Float32Array(N * 2);
    const pinned = new Uint8Array(N);
    const restPin = new Float32Array(N * 2);
    const weights = new Float32Array(N);

    const ridge = (x: number) => Math.sqrt(Math.sin(x) * Math.sin(x) + 0.03) - 0.64;
    const crease = (u: number, v: number) =>
      CRUMPLE *
      0.045 *
      CH *
      (ridge(2.7 * u + 2.9 * v + 0.7) +
        0.8 * ridge(-2.6 * u + 3.3 * v + 2.1) +
        0.5 * Math.sin(4.9 * u - 1.4 * v + 2.2) +
        0.55 * ridge(1.1 * u + 6.4 * v + 1.3) +
        0.4 * ridge(8.3 * u + 3.9 * v + 0.2) +
        0.3 * ridge(-5.7 * u + 9.1 * v + 1.6));

    const half = 0.5 * CW * SPREAD;
    const topY = 0.5 * CH;
    const pinL = { x: -half * Math.cos(PINROLL), y: topY + half * Math.sin(PINROLL) };
    const pinR = { x: half * Math.cos(PINROLL), y: topY - half * Math.sin(PINROLL) };

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const u = c / (COLS - 1);
        const v = r / (ROWS - 1);
        const fx = (u - 0.5) * CW;
        const fy = (v - 0.5) * CH;
        const fz = crease(u, v);
        flat[i * 2] = fx;
        flat[i * 2 + 1] = fy;
        rest[i * 3] = fx;
        rest[i * 3 + 1] = fy;
        rest[i * 3 + 2] = fz;
        pos[i * 3] = fx * (SPREAD + (1 - SPREAD) * (1 - v) * (1 - v));
        pos[i * 3 + 1] = fy;
        pos[i * 3 + 2] = fz;
        prev[i * 3] = pos[i * 3];
        prev[i * 3 + 1] = pos[i * 3 + 1];
        prev[i * 3 + 2] = pos[i * 3 + 2];
        pinned[i] = r === ROWS - 1 && (c === 0 || c === COLS - 1) ? 1 : 0;
        restPin[i * 2] = Math.hypot(fx - pinL.x, fy - pinL.y);
        restPin[i * 2 + 1] = Math.hypot(fx - pinR.x, fy - pinR.y);
      }
    }

    // roll the whole sheet slightly — the pin corners sit above the rest
    const cosR0 = Math.cos(PINROLL);
    const sinR0 = Math.sin(PINROLL);
    for (let i = 0; i < N; i++) {
      const px = pos[i * 3];
      const py = pos[i * 3 + 1] - topY;
      pos[i * 3] = px * cosR0 - py * sinR0;
      pos[i * 3 + 1] = px * sinR0 + py * cosR0 + topY;
      prev[i * 3] = pos[i * 3];
      prev[i * 3 + 1] = pos[i * 3 + 1];
    }

    const links: Array<{ a: number; b: number; rest: number; k: number }> = [];
    const addLink = (a: number, b: number, k: number) => {
      links.push({
        a,
        b,
        k,
        rest: Math.hypot(
          rest[a * 3] - rest[b * 3],
          rest[a * 3 + 1] - rest[b * 3 + 1],
          rest[a * 3 + 2] - rest[b * 3 + 2],
        ),
      });
    };
    const bend = 0.02 + (0.6 - 0.02) * 0.6;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        if (c + 1 < COLS) addLink(i, i + 1, 1);
        if (r + 1 < ROWS) addLink(i, i + COLS, 1);
        if (c + 1 < COLS && r + 1 < ROWS) {
          addLink(i, i + COLS + 1, 0.5);
          addLink(i, i + COLS - 1, 0.5);
        }
        if (c + 2 < COLS) addLink(i, i + 2, bend);
        if (r + 2 < ROWS) addLink(i, i + 2 * COLS, bend);
      }
    }

    /* ── view ── */
    let W = 1;
    let H = 1;
    let aspect = 1;
    const view = { cx: 0.402, cy: 0.485, zoom: 1 };
    const R = new Float32Array(9);
    {
      // TILT around x, then TURN around y — row-major, rows = vx,vy,vz
      const ct = Math.cos(TILT);
      const st = Math.sin(TILT);
      const cr = Math.cos(TURN);
      const sr = Math.sin(TURN);
      R[0] = cr;
      R[3] = st * sr;
      R[6] = ct * sr;
      R[1] = 0;
      R[4] = ct;
      R[7] = -st;
      R[2] = -sr;
      R[5] = st * cr;
      R[8] = ct * cr;
    }

    function computeView() {
      const w = section!.clientWidth;
      const h = section!.clientHeight;
      if (!w || !h) return;
      aspect = w / h;
      if (w >= 1100 && aspect >= 1.25) {
        view.cx = 0.25;
        view.cy = 0.485;
        view.zoom = Math.min(1, (0.33 * aspect) / (CW * 1.12));
      } else {
        view.cx = 0.5;
        view.cy = aspect < 0.75 ? 0.41 : 0.43;
        view.zoom = Math.min(
          1,
          (0.92 * aspect) / (CW * 1.12),
          (aspect < 0.75 ? 0.6 : 0.66) / CH,
        );
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 1.15);
      W = Math.max(1, Math.round(w * dpr));
      H = Math.max(1, Math.round(h * dpr));
      cv.width = W;
      cv.height = H;
    }
    computeView();
    const ro = new ResizeObserver(computeView);
    ro.observe(section);

    // rotate a cloth-space point into view space
    function toView(i: number) {
      const vx = R[0] * pos[i * 3] + R[3] * pos[i * 3 + 1] + R[6] * pos[i * 3 + 2];
      const vy = R[1] * pos[i * 3] + R[4] * pos[i * 3 + 1] + R[7] * pos[i * 3 + 2];
      const vz = R[2] * pos[i * 3] + R[5] * pos[i * 3 + 1] + R[8] * pos[i * 3 + 2];
      return { vx, vy, vz };
    }

    // project a cloth index to device-px screen coordinates
    function screenOf(i: number) {
      const { vx, vy, vz } = toView(i);
      const scale = (CAM / Math.max(CAM - vz, 0.001)) * view.zoom * H;
      return {
        x: view.cx * W + vx * scale,
        y: view.cy * H - vy * scale,
        depth: vz,
      };
    }

    // invert the projection at a given depth: CSS-px cursor → cloth-space point
    function worldAt(cssX: number, cssY: number, depth: number) {
      const scale = (CAM / Math.max(CAM - depth, 0.001)) * view.zoom * cv.clientHeight;
      const vx = (cssX - view.cx * cv.clientWidth) / scale;
      const vy = (view.cy * cv.clientHeight - cssY) / scale;
      const px = vx - depth * R[6];
      const py = vy - depth * R[7];
      const det = R[0] * R[4] - R[3] * R[1];
      return { x: (R[4] * px - R[3] * py) / det, y: (-R[1] * px + R[0] * py) / det };
    }

    /* ── simulation ── */
    let T = 0;
    const held = { i: -1, depth: 0, offX: 0, offY: 0, active: false };
    const pointer = { x: 0, y: 0 };
    let glow = 0;
    let lastMove = 0;

    function subStep(h: number, damp: number) {
      T += h;
      const gust = 0.6 + 0.4 * Math.sin(0.37 * T) * Math.sin(0.23 * T + 1.0);
      const wind = reduced ? 0 : FLUTTER * 2.4 * gust;

      for (let i = 0; i < N; i++) {
        if (pinned[i] || (held.active && weights[i] >= 0.98)) continue;
        const u = (i % COLS) / (COLS - 1);
        const v = Math.floor(i / COLS) / (ROWS - 1);
        const s1 = Math.sin(9.1 * u - 3.7 * v + 3.1 * T);
        const s2 = Math.sin(6.3 * u + 7.9 * v - 2.3 * T + 1.3);
        const s3 =
          Math.sin(2.9 * u + 1.7 * T + 0.8 * Math.sin(0.5 * T)) * Math.cos(2.3 * v - 0.9 * T);
        const ax = wind * 0.25 * Math.sin(3.3 * v + 1.1 * T + u);
        const ay = wind * 0.1 * s2 - GRAVITY;
        const az = wind * (0.45 * s1 + 0.35 * s2 + 0.3 * s3);
        for (let k = 0; k < 3; k++) {
          const p = pos[i * 3 + k];
          const a = k === 0 ? ax : k === 1 ? ay : az;
          let vel = (p - prev[i * 3 + k]) * damp + a * h * h;
          const sp = Math.abs(vel);
          if (sp > MAX_SPEED * h) vel = Math.sign(vel) * MAX_SPEED * h;
          prev[i * 3 + k] = p;
          pos[i * 3 + k] = p + vel;
        }
      }

      if (held.active && held.i >= 0) {
        const i = held.i;
        const w = worldAt(pointer.x, pointer.y, held.depth);
        const dx = w.x + held.offX - pos[i * 3];
        const dy = w.y + held.offY - pos[i * 3 + 1];
        for (let k = 0; k < N; k++) {
          const wgt = weights[k];
          if (wgt <= 0 || pinned[k]) continue;
          if (wgt >= 0.98) {
            pos[k * 3] += dx;
            pos[k * 3 + 1] += dy;
            prev[k * 3] = pos[k * 3];
            prev[k * 3 + 1] = pos[k * 3 + 1];
          } else {
            pos[k * 3] += dx * wgt;
            pos[k * 3 + 1] += dy * wgt;
          }
        }
      }

      const forward = Math.floor(T / h) % 2 === 0;
      for (let li = 0; li < links.length; li++) {
        const l = links[forward ? li : links.length - 1 - li];
        const a = l.a;
        const b = l.b;
        const fa = pinned[a] || (held.active && weights[a] >= 0.98) ? 0 : 1;
        const fb = pinned[b] || (held.active && weights[b] >= 0.98) ? 0 : 1;
        const wsum = fa + fb;
        if (wsum === 0) continue;
        const dx = pos[b * 3] - pos[a * 3];
        const dy = pos[b * 3 + 1] - pos[a * 3 + 1];
        const dz = pos[b * 3 + 2] - pos[a * 3 + 2];
        const d = Math.hypot(dx, dy, dz) || 0.0001;
        const diff = ((d - l.rest) / d) * l.k;
        for (let c = 0; c < 3; c++) {
          const comp = c === 0 ? dx : c === 1 ? dy : dz;
          pos[a * 3 + c] += (comp * diff * fa) / wsum;
          pos[b * 3 + c] -= (comp * diff * fb) / wsum;
        }
      }

      // tethers — every point stays within reach of both pins
      for (let i = 0; i < N; i++) {
        if (pinned[i] || (held.active && weights[i] >= 0.98)) continue;
        for (let pk = 0; pk < 2; pk++) {
          const px = pk === 0 ? pinL.x : pinR.x;
          const py = pk === 0 ? pinL.y : pinR.y;
          const lim = 1.02 * restPin[i * 2 + pk];
          const dx = pos[i * 3] - px;
          const dy = pos[i * 3 + 1] - py;
          const dz = pos[i * 3 + 2];
          const d = Math.hypot(dx, dy, dz);
          if (d > lim) {
            const f = lim / d;
            pos[i * 3] = px + dx * f;
            pos[i * 3 + 1] = py + dy * f;
            pos[i * 3 + 2] *= f;
          }
        }
      }
    }

    function pick(wxf: number, wyf: number) {
      let best = -1;
      let bestScore = Infinity;
      for (let i = 0; i < N; i++) {
        const s = screenOf(i);
        const d = Math.hypot(s.x / W - wxf, s.y / H - wyf);
        const score = d - 0.08 * s.depth;
        if (d < GRAB_R / view.zoom && score < bestScore) {
          bestScore = score;
          best = i;
        }
      }
      return best;
    }

    function carryWeights(i: number) {
      const gx = flat[i * 2];
      const gy = flat[i * 2 + 1];
      for (let k = 0; k < N; k++) {
        if (pinned[k]) {
          weights[k] = 0;
          continue;
        }
        const d = Math.hypot(flat[k * 2] - gx, flat[k * 2 + 1] - gy) / (CARRY_R * CH);
        weights[k] = d < 1 ? (1 - d * d) * (1 - d * d) : 0;
      }
      weights[i] = 1;
    }

    for (let i = 0; i < 200; i++) subStep(1 / 240, 1);

    /* ── texture + render ── */
    // composite the holo sheet with the brand mark so the cloth reads
    // "BUILT BY UMER" — drawn once into an offscreen canvas, then used
    // as the mesh texture (also keeps cell drawImage source-cropping)
    const tex = document.createElement("canvas");
    tex.width = 1400;
    tex.height = 1250;
    const tctx = tex.getContext("2d");
    const imgEl = new Image();
    let imgReady = false;

    function composeTexture() {
      if (!tctx) return;
      const tw = tex.width;
      const th = tex.height;
      // The mesh displays texture row 0 at the cloth's bottom edge, so draw
      // the whole composition into a vertically flipped transform — on the
      // cloth it then reads straight, like a printed banner.
      tctx.save();
      tctx.translate(0, th);
      tctx.scale(1, -1);

      // deep violet holo base
      const bg = tctx.createLinearGradient(0, 0, 0, th);
      bg.addColorStop(0, "#241145");
      bg.addColorStop(0.45, "#3b1a75");
      bg.addColorStop(0.75, "#2a134f");
      bg.addColorStop(1, "#170a30");
      tctx.fillStyle = bg;
      tctx.fillRect(0, 0, tw, th);

      // soft octopus artwork as a glow layer, low opacity so its baked-in
      // lettering stays quiet under our own brand mark
      const iw = imgEl.naturalWidth || 1;
      const ih = imgEl.naturalHeight || 1;
      const s = Math.max(tw / iw, th / ih);
      const dw = iw * s;
      const dh = ih * s;
      tctx.save();
      tctx.globalAlpha = 0.5;
      tctx.globalCompositeOperation = "screen";
      tctx.drawImage(imgEl, (tw - dw) / 2, (th - dh) / 2, dw, dh);
      tctx.restore();

      // veil pulls the artwork back and evens the field
      tctx.fillStyle = "rgba(30, 14, 62, 0.45)";
      tctx.fillRect(0, 0, tw, th);

      // faint foil grid
      tctx.strokeStyle = "rgba(190, 160, 255, 0.10)";
      tctx.lineWidth = 2;
      const GRID = 5;
      tctx.beginPath();
      for (let gx = GRID / 2; gx < GRID; gx++) {
        tctx.moveTo((tw * gx) / GRID, 0);
        tctx.lineTo((tw * gx) / GRID, th);
        tctx.moveTo(0, (th * gx) / GRID);
        tctx.lineTo(tw, (th * gx) / GRID);
      }
      tctx.stroke();

      // readable band behind the wordmark
      const bandW = tw * 0.86;
      const bandH = th * 0.42;
      const bandX = (tw - bandW) / 2;
      const bandY = th * 0.5 - bandH / 2;
      tctx.save();
      tctx.shadowColor = "rgba(10, 4, 30, 0.6)";
      tctx.shadowBlur = 60;
      tctx.fillStyle = "rgba(14, 6, 38, 0.62)";
      const RAD = 46;
      try {
        tctx.beginPath();
        tctx.roundRect(bandX, bandY, bandW, bandH, RAD);
        tctx.fill();
      } catch {
        tctx.fillRect(bandX, bandY, bandW, bandH);
      }
      tctx.restore();

      // brand mark — straight, wide-spaced, screen-printed white
      tctx.textAlign = "center";
      tctx.textBaseline = "middle";
      try {
        (tctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0.06em";
      } catch {}
      tctx.font = "400 250px 'Times New Roman', Times, serif";
      tctx.fillStyle = "rgba(255, 255, 255, 0.96)";
      tctx.shadowColor = "rgba(8, 3, 26, 0.55)";
      tctx.shadowBlur = 22;
      tctx.shadowOffsetY = 8;
      tctx.fillText("BUILT", tw / 2, th * 0.4);
      tctx.fillText("BY UMER", tw / 2, th * 0.6);

      // thin rule + tagline under the mark
      tctx.shadowBlur = 0;
      tctx.shadowOffsetY = 0;
      tctx.fillStyle = "rgba(206, 181, 255, 0.85)";
      tctx.fillRect(tw * 0.3, th * 0.72, tw * 0.4, 3);
      tctx.font = "400 62px 'Times New Roman', Times, serif";
      tctx.fillStyle = "rgba(226, 210, 255, 0.9)";
      tctx.fillText("EVERY TOOL · ONE DESTINATION", tw / 2, th * 0.8);

      tctx.restore();
      imgReady = true;
    }

    imgEl.onload = () => {
      if (disposed) return;
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          if (!disposed) composeTexture();
        });
        // show the sheet even if fonts stall
        window.setTimeout(() => {
          if (!disposed && !imgReady) composeTexture();
        }, 1200);
      } else {
        composeTexture();
      }
    };
    imgEl.onerror = () => markBroken();
    imgEl.src = CLOTH_IMG;

    let raf = 0;
    let last = performance.now();
    let running = true;
    let inView = true;

    // affine-map the source slice onto a screen quad (classic 2-triangle split)
    // each triangle is expanded slightly from its centroid so neighbours
    // overlap and no hairline seams show between cells
    function padTri(
      ax: number,
      ay: number,
      bx: number,
      by: number,
      cx: number,
      cy: number,
      pad: number,
    ) {
      const gx = (ax + bx + cx) / 3;
      const gy = (ay + by + cy) / 3;
      const r =
        (Math.hypot(ax - gx, ay - gy) + Math.hypot(bx - gx, by - gy) + Math.hypot(cx - gx, cy - gy)) /
        3 || 1;
      const s = (r + pad) / r;
      return [
        gx + (ax - gx) * s,
        gy + (ay - gy) * s,
        gx + (bx - gx) * s,
        gy + (by - gy) * s,
        gx + (cx - gx) * s,
        gy + (cy - gy) * s,
      ] as const;
    }

    function drawCell(
      sx: number,
      sy: number,
      sw: number,
      sh: number,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x3: number,
      y3: number,
    ) {
      const PAD = 1.2;
      // tri (x0,x1,x2) ← source corners (0,0),(sw,0),(sw,sh)
      const ta = padTri(x0, y0, x1, y1, x2, y2, PAD);
      g.save();
      g.beginPath();
      g.moveTo(ta[0], ta[1]);
      g.lineTo(ta[2], ta[3]);
      g.lineTo(ta[4], ta[5]);
      g.closePath();
      g.clip();
      g.transform((x1 - x0) / sw, (y1 - y0) / sw, (x2 - x1) / sh, (y2 - y1) / sh, x0, y0);
      g.drawImage(tex, sx, sy, sw, sh, 0, 0, sw, sh);
      g.restore();
      // tri (x0,x2,x3) ← source corners (0,0),(sw,sh),(0,sh)
      const tb = padTri(x0, y0, x2, y2, x3, y3, PAD);
      g.save();
      g.beginPath();
      g.moveTo(tb[0], tb[1]);
      g.lineTo(tb[2], tb[3]);
      g.lineTo(tb[4], tb[5]);
      g.closePath();
      g.clip();
      g.transform((x2 - x3) / sw, (y2 - y3) / sw, (x3 - x0) / sh, (y3 - y0) / sh, x0, y0);
      g.drawImage(tex, sx, sy, sw, sh, 0, 0, sw, sh);
      g.restore();
    }

    function render() {
      g.clearRect(0, 0, W, H);

      // soft studio floor shadow
      const sc = screenOf(Math.floor((ROWS - 1) * COLS + COLS / 2));
      const grad = g.createRadialGradient(
        sc.x,
        H * 0.88,
        10,
        sc.x,
        H * 0.88,
        Math.max(220, CW * view.zoom * H * 0.7),
      );
      grad.addColorStop(0, "rgba(24,22,40,0.16)");
      grad.addColorStop(1, "rgba(24,22,40,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);

      if (!imgReady) return;

      const cw = tex.width / (COLS - 1);
      const chh = tex.height / (ROWS - 1);

      for (let r = 0; r < ROWS - 1; r++) {
        for (let c = 0; c < COLS - 1; c++) {
          const i = r * COLS + c;
          const p00 = screenOf(i);
          const p10 = screenOf(i + 1);
          const p11 = screenOf(i + COLS + 1);
          const p01 = screenOf(i + COLS);
          const minx = Math.min(p00.x, p10.x, p11.x, p01.x);
          const maxx = Math.max(p00.x, p10.x, p11.x, p01.x);
          const miny = Math.min(p00.y, p10.y, p11.y, p01.y);
          const maxy = Math.max(p00.y, p10.y, p11.y, p01.y);
          if (maxx < 0 || minx > W || maxy < 0 || miny > H) continue;
          if (maxx - minx < 1.5 || maxy - miny < 1.5) continue;
          drawCell(c * cw, r * chh, cw, chh, p00.x, p00.y, p10.x, p10.y, p11.x, p11.y, p01.x, p01.y);
        }
      }

      // violet sheen following the cursor while it is near the cloth
      if (glow > 0.01) {
        const gi =
          held.active && held.i >= 0
            ? held.i
            : Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 2);
        const gp = screenOf(gi);
        const rg = g.createRadialGradient(gp.x, gp.y, 10, gp.x, gp.y, 240 * view.zoom * H);
        rg.addColorStop(0, `rgba(150,110,255,${0.14 * glow})`);
        rg.addColorStop(1, "rgba(150,110,255,0)");
        g.fillStyle = rg;
        g.fillRect(0, 0, W, H);
      }
    }

    let renderFlip = 0;
    function frame(now: number) {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (inView) {
        if (now - lastMove > 700) glow = Math.max(0, glow - dt * 2);
        const damp = Math.exp(-(0.15 + 5.85 * DAMPING) * dt);
        for (let s = 0; s < STEPS; s++) subStep(dt / STEPS, damp);
        if ((renderFlip++ & 1) === 0) render();
      }
      raf = requestAnimationFrame(frame);
    }

    /* ── pointer ── */
    function onMove(e: PointerEvent) {
      const r = cv.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      lastMove = performance.now();
      glow = Math.min(1, glow + 0.08);
      if (held.active) return;
      const i = pick(pointer.x / cv.clientWidth, pointer.y / cv.clientHeight);
      cv.classList.toggle("is-over", i >= 0);
    }
    function onDown(e: PointerEvent) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const r = cv.getBoundingClientRect();
      const i = pick(
        (e.clientX - r.left) / cv.clientWidth,
        (e.clientY - r.top) / cv.clientHeight,
      );
      if (i < 0) return;
      const s = screenOf(i);
      held.i = i;
      held.depth = s.depth;
      const w = worldAt(e.clientX - r.left, e.clientY - r.top, s.depth);
      held.offX = pos[i * 3] - w.x;
      held.offY = pos[i * 3 + 1] - w.y;
      held.active = true;
      carryWeights(i);
      try {
        cv.setPointerCapture(e.pointerId);
      } catch {}
      cv.classList.add("is-held");
    }
    function onUp(e: PointerEvent) {
      if (!held.active) return;
      try {
        cv.releasePointerCapture(e.pointerId);
      } catch {}
      held.active = false;
      cv.classList.remove("is-held");
    }
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);
    const onTouchMove = (e: TouchEvent) => {
      if (held.active) e.preventDefault();
    };
    cv.addEventListener("touchmove", onTouchMove, { passive: false });

    const io = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
    io.observe(section);
    const onVis = () => {
      if (document.hidden) {
        running = false;
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointercancel", onUp);
      cv.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={"cl-hero" + (noCloth ? " no-cloth" : "")}
      id="cloth-hero"
      aria-label="BuiltByUmer — tug the cloth"
    >
      <canvas
        ref={canvasRef}
        className="cl-canvas"
        role="img"
        aria-label="A violet holographic cloth hanging from two pins. Grab it, then tug it around."
      />
      <img className="cl-still" alt="" decoding="async" src={CLOTH_IMG} />
      <h1 className="cl-title">
        <span>Every tool</span>
        <span className="cl-soft">One destination</span>
      </h1>
      <style href="st-clothsection-1" precedence="high" dangerouslySetInnerHTML={{ __html: `
        .cl-hero {
          position: relative;
          min-height: auto;
          height: auto;
          aspect-ratio: 16 / 10;
          max-height: 85vh;
          overflow: hidden;
          background: radial-gradient(120% 90% at 50% 0%, #f4f2ec 0%, #eceae4 55%, #e2dfd6 100%);
          touch-action: pan-y;
        }
        .cl-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          cursor: grab;
          touch-action: pan-y;
          z-index: 1;
        }
        .cl-canvas.is-held {
          cursor: grabbing;
        }
        .cl-still {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s ease;
          z-index: 0;
        }
        .cl-hero.no-cloth .cl-still {
          opacity: 1;
        }
        .cl-hero.no-cloth .cl-canvas {
          display: none;
        }
        .cl-title {
          position: absolute;
          right: clamp(20px, 6vw, 84px);
          top: clamp(96px, 22vh, 220px);
          z-index: 2;
          margin: 0;
          font-family: var(--font-antonio), sans-serif;
          font-weight: 400;
          line-height: 0.92;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          text-align: right;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }
        .cl-title span {
          font-size: clamp(36px, 5.2vw, 80px);
          letter-spacing: -0.02em;
          color: #16150f;
        }
        .cl-title .cl-soft {
          color: transparent;
          -webkit-text-stroke: 1.2px rgba(22, 21, 15, 0.55);
        }
        @media (max-width: 768px) {
          .cl-hero {
            min-height: auto !important;
            height: auto !important;
            aspect-ratio: 4 / 3 !important;
            max-height: none !important;
          }
          .cl-title {
            display: none !important;
          }
        }
      ` }} />
    </section>
  );
}
