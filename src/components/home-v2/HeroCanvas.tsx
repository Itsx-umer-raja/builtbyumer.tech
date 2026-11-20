"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Real WebGL hero: a field of ten sculptures — one geometry per tool
 * category — in off-white and vermillion, drifting over a starfield of
 * points. Reacts to the pointer (tilt) and to scroll (rotation + rise).
 * Lightweight: capped DPR, pauses off-screen, one static frame when
 * the user prefers reduced motion. Degrades to nothing if WebGL fails.
 */
export function HeroCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return; // no WebGL — hero copy still renders
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.4, 11);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 6, 6);
    scene.add(key);
    const accent = new THREE.PointLight(0xff4d00, 60, 30);
    accent.position.set(-4, -2, 3);
    scene.add(accent);

    const ink = new THREE.MeshStandardMaterial({
      color: 0xf2efe7,
      roughness: 0.35,
      metalness: 0.15,
    });
    const vermillion = new THREE.MeshStandardMaterial({
      color: 0xff4d00,
      roughness: 0.3,
      metalness: 0.25,
    });
    const wire = new THREE.MeshBasicMaterial({
      color: 0xff4d00,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });

    // One sculpture per category, arranged as a loose constellation.
    const geos: THREE.BufferGeometry[] = [
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.TetrahedronGeometry(0.85),
      new THREE.TorusGeometry(0.55, 0.22, 16, 40),
      new THREE.OctahedronGeometry(0.8),
      new THREE.IcosahedronGeometry(0.75),
      new THREE.ConeGeometry(0.65, 1.1, 24),
      new THREE.CylinderGeometry(0.45, 0.45, 1, 24),
      new THREE.TorusKnotGeometry(0.45, 0.14, 80, 12),
      new THREE.DodecahedronGeometry(0.7),
      new THREE.SphereGeometry(0.6, 24, 24),
    ];
    const group = new THREE.Group();
    const sculptures: { mesh: THREE.Mesh; speed: number; baseY: number }[] = [];
    geos.forEach((g, i) => {
      const mat = i === 2 || i === 7 ? vermillion : i % 3 === 0 ? wire : ink;
      const mesh = new THREE.Mesh(g, mat);
      const col = i % 5;
      const row = Math.floor(i / 5);
      mesh.position.set((col - 2) * 1.9, (row === 0 ? 1.15 : -1.25) + (i % 2 ? 0.25 : -0.15), -((i * 37) % 3) * 0.4);
      mesh.rotation.set(i * 0.7, i * 1.1, 0);
      mesh.scale.setScalar(0.85);
      group.add(mesh);
      sculptures.push({ mesh, speed: 0.25 + ((i * 13) % 10) * 0.03, baseY: mesh.position.y });
    });
    scene.add(group);

    // Dust field of points
    const pointCount = 220;
    const positions = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    }
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      pointsGeo,
      new THREE.PointsMaterial({
        color: 0xf2efe7,
        size: 0.045,
        transparent: true,
        opacity: 0.6,
      }),
    );
    scene.add(points);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(host);

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // pull the camera back on narrow screens so the field still fits
      camera.position.z = w < 640 ? 15 : w < 1024 ? 12.5 : 11;
    };
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let raf = 0;
    const render = (t: number) => {
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      const scroll = window.scrollY;
      group.rotation.y = pointer.x * 0.35 + scroll * 0.00045;
      group.rotation.x = pointer.y * 0.18 - scroll * 0.0002;
      group.position.y = scroll * 0.0012;
      sculptures.forEach((s, i) => {
        s.mesh.rotation.x += 0.0035 * s.speed;
        s.mesh.rotation.y += 0.0045 * s.speed;
        s.mesh.position.y =
          s.baseY + Math.sin(t * 0.0006 + i * 1.3) * 0.22;
      });
      points.rotation.y = t * 0.00002 + pointer.x * 0.05;
      renderer.render(scene, camera);
    };

    if (reduced) {
      render(1200);
    } else {
      const loop = (t: number) => {
        raf = requestAnimationFrame(loop);
        if (visible) render(t);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      geos.forEach((g) => g.dispose());
      pointsGeo.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full"
    />
  );
}
