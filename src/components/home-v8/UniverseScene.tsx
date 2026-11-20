"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";

/**
 * The 3D universe: a futuristic digital road floating through a
 * dark environment — a road with a glowing centre line leading
 * to a violet portal, floating PDF documents, rotating image
 * frames, a glowing QR object, file-format symbols and subtle
 * particles. Procedural geometry only (boxes, planes, torus,
 * icosahedra); no external model files, no post-processing,
 * no shadows. ~14 meshes total.
 *
 * Performance rules (the brief's own targets):
 * - Lazy-loaded (next/dynamic, ssr:false) by the hero and only
 *   mounted when the hero is near the viewport.
 * - `frameloop` is "never" whenever the hero is offscreen.
 * - DPR capped (1.75 desktop, 1.5 mobile); no shadows, no
 *   post-processing.
 * - Reduced motion / no WebGL never mounts the canvas — the
 *   hero shows the static 2D composition instead.
 * - The camera moves with the mouse via a shared mutable ref —
 *   no React re-renders per frame.
 */

export type SceneControls = {
  /** -1..1 pointer position over the hero */
  px: number;
  py: number;
  /** 0..1 scroll progress through the hero */
  scroll: number;
};

const VIOLET = "#8b7cff";
const CYAN = "#36d9ff";
const LAVENDER = "#c5a6ff";
const PAPER = "#e8eaff";
const ROAD = "#141a33";

/** Deterministic pseudo-random — the same scene every load. */
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Road surface: dark asphalt, violet edge lines, dashed centre. */
function makeRoadTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 1024;
  const g = c.getContext("2d");
  if (!g) return null;
  g.fillStyle = ROAD;
  g.fillRect(0, 0, 256, 1024);
  // Subtle lane sheen
  g.fillStyle = "rgba(139,124,255,0.05)";
  g.fillRect(0, 0, 256, 1024);
  // Edge lines
  g.fillStyle = VIOLET;
  g.fillRect(10, 0, 4, 1024);
  g.fillRect(242, 0, 4, 1024);
  // Dashed centre line
  g.fillStyle = "#f5f6ff";
  for (let y = 0; y < 1024; y += 128) {
    g.fillRect(124, y, 8, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** QR-like code grid: finder squares in three corners, a
    deterministic data pattern between them. */
function makeQrTexture() {
  const N = 25;
  const S = 256;
  const cell = S / N;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d");
  if (!g) return null;
  g.fillStyle = "#070912";
  g.fillRect(0, 0, S, S);
  g.fillStyle = CYAN;
  const finder = (ox: number, oy: number) => {
    g.fillRect(ox * cell, oy * cell, 7 * cell, 7 * cell);
    g.fillStyle = "#070912";
    g.fillRect((ox + 1) * cell, (oy + 1) * cell, 5 * cell, 5 * cell);
    g.fillStyle = CYAN;
    g.fillRect((ox + 2) * cell, (oy + 2) * cell, 3 * cell, 3 * cell);
  };
  finder(0, 0);
  finder(N - 7, 0);
  finder(0, N - 7);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const inFinder =
        (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
      if (inFinder) continue;
      if (seeded(x * 31 + y, 7) > 0.52) {
        g.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A document page: light face with dark text-line bands. */
function makeDocTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 176;
  const g = c.getContext("2d");
  if (!g) return null;
  g.fillStyle = PAPER;
  g.fillRect(0, 0, 128, 176);
  g.fillStyle = VIOLET;
  g.fillRect(0, 0, 128, 18);
  g.fillStyle = "#8b7cff";
  g.fillRect(14, 30, 60, 7);
  g.fillStyle = "#101525";
  g.globalAlpha = 0.55;
  for (let i = 0; i < 7; i++) {
    g.fillRect(14, 50 + i * 15, 100 - (i % 3) * 18, 5);
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Particles({ count = 220 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (seeded(i, 1) - 0.5) * 16;
      arr[i * 3 + 1] = (seeded(i, 2) - 0.5) * 8;
      arr[i * 3 + 2] = (seeded(i, 3) - 0.5) * 6 - 2;
    }
    return arr;
  }, [count]);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.012;
    }
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color={VIOLET}
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Floating({
  children,
  pos,
  speed,
  amp,
  phase,
  rotSpeed,
}: {
  children: React.ReactNode;
  pos: [number, number, number];
  speed: number;
  amp: number;
  phase: number;
  rotSpeed: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.position.y = pos[1] + Math.sin(t * speed + phase) * amp;
    g.rotation.y += delta * rotSpeed;
  });
  return (
    <group ref={ref} position={pos}>
      {children}
    </group>
  );
}

function Scene({ controls }: { controls: SceneControls }) {
  const groupRef = useRef<THREE.Group>(null);
  const portalRef = useRef<THREE.Group>(null);
  const roadTex = useMemo(() => makeRoadTexture(), []);
  const qrTex = useMemo(() => makeQrTexture(), []);
  const docTex = useMemo(() => makeDocTexture(), []);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // Eased pointer parallax + a slow scroll turn — the whole
    // universe leans toward the cursor, never twitches.
    const targetY = controls.px * 0.22 + controls.scroll * 0.35;
    const targetX = -controls.py * 0.12 + controls.scroll * 0.12;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetY, 0.05);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetX, 0.05);
    // The portal breathes and turns slowly.
    if (portalRef.current) {
      portalRef.current.rotation.z = t * 0.12;
    }
    // Camera drifts with the pointer (transform-only).
    const cam = state.camera;
    cam.position.x = THREE.MathUtils.lerp(cam.position.x, controls.px * 0.7, 0.04);
    cam.position.y = THREE.MathUtils.lerp(
      cam.position.y,
      0.6 + controls.py * 0.35,
      0.04,
    );
    cam.lookAt(0, 0.1, -2);
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 8, 6]} intensity={1.4} />
      <directionalLight position={[-6, -3, 4]} intensity={0.4} color={CYAN} />
      <pointLight position={[0, 0.8, -3.5]} intensity={14} color={VIOLET} distance={9} />
      <pointLight position={[-4, 2, 1]} intensity={5} color={CYAN} distance={8} />

      {/* The road — floating through the dark, into the portal */}
      <mesh rotation={[-Math.PI / 2 + 0.32, 0, 0]} position={[0, -1.9, -1.5]}>
        <planeGeometry args={[3.4, 14]} />
        <meshStandardMaterial
          map={roadTex ?? undefined}
          color="#ffffff"
          roughness={0.55}
          metalness={0.15}
        />
      </mesh>

      {/* The destination portal — the ONE glow in the scene */}
      <group ref={portalRef} position={[0, 0.9, -4.2]}>
        <mesh>
          <torusGeometry args={[1.55, 0.09, 20, 72]} />
          <meshStandardMaterial
            color={VIOLET}
            emissive={VIOLET}
            emissiveIntensity={1.6}
            roughness={0.3}
          />
        </mesh>
        <mesh>
          <torusGeometry args={[1.28, 0.03, 12, 64]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.85} />
        </mesh>
        <mesh>
          <circleGeometry args={[1.42, 48]} />
          <meshBasicMaterial
            color={VIOLET}
            transparent
            opacity={0.14}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Floating PDF documents */}
      <Floating pos={[-2.7, 1.5, -1.2]} speed={0.5} amp={0.16} phase={0} rotSpeed={0.12}>
        <mesh>
          <boxGeometry args={[0.95, 1.3, 0.06]} />
          <meshStandardMaterial
            map={docTex ?? undefined}
            roughness={0.4}
            metalness={0.05}
          />
        </mesh>
      </Floating>
      <Floating pos={[2.9, 1.9, -2.2]} speed={0.65} amp={0.2} phase={1.4} rotSpeed={-0.1}>
        <mesh>
          <boxGeometry args={[0.8, 1.1, 0.06]} />
          <meshStandardMaterial
            map={docTex ?? undefined}
            roughness={0.4}
            metalness={0.05}
          />
        </mesh>
      </Floating>
      <Floating pos={[-3.1, -0.7, -0.4]} speed={0.55} amp={0.14} phase={2.3} rotSpeed={0.09}>
        <mesh>
          <boxGeometry args={[0.7, 0.95, 0.06]} />
          <meshStandardMaterial
            map={docTex ?? undefined}
            roughness={0.4}
            metalness={0.05}
          />
        </mesh>
      </Floating>

      {/* Rotating image frames */}
      <Floating pos={[3.1, 0.4, -0.8]} speed={0.6} amp={0.15} phase={0.8} rotSpeed={0.22}>
        <mesh>
          <boxGeometry args={[1.15, 0.8, 0.05]} />
          <meshStandardMaterial
            color={LAVENDER}
            emissive={VIOLET}
            emissiveIntensity={0.35}
            roughness={0.35}
          />
          <Edges scale={1.02} threshold={15} color={VIOLET} />
        </mesh>
      </Floating>
      <Floating pos={[-2.4, -1.5, -1.8]} speed={0.7} amp={0.12} phase={3.1} rotSpeed={-0.18}>
        <mesh>
          <boxGeometry args={[0.95, 0.65, 0.05]} />
          <meshStandardMaterial
            color={CYAN}
            emissive={CYAN}
            emissiveIntensity={0.3}
            roughness={0.35}
          />
          <Edges scale={1.02} threshold={15} color={CYAN} />
        </mesh>
      </Floating>

      {/* Glowing QR object */}
      <Floating pos={[2.5, -1.3, -0.6]} speed={0.5} amp={0.18} phase={1.9} rotSpeed={0.3}>
        <mesh>
          <planeGeometry args={[1.05, 1.05]} />
          <meshBasicMaterial
            map={qrTex ?? undefined}
            transparent
            opacity={0.95}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Floating>

      {/* File-format symbols — pure form, no text */}
      <Floating pos={[0.6, 2.2, -2.6]} speed={0.8} amp={0.13} phase={0.5} rotSpeed={0.25}>
        <mesh>
          <icosahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color={VIOLET} roughness={0.3} metalness={0.2} />
        </mesh>
      </Floating>
      <Floating pos={[-1.1, 2.5, -3]} speed={0.7} amp={0.11} phase={2.6} rotSpeed={-0.2}>
        <mesh>
          <octahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial color={CYAN} roughness={0.3} metalness={0.2} />
        </mesh>
      </Floating>
      <Floating pos={[1.5, -2, -2.4]} speed={0.75} amp={0.14} phase={1.1} rotSpeed={0.28}>
        <mesh>
          <torusGeometry args={[0.26, 0.09, 12, 32]} />
          <meshStandardMaterial color={LAVENDER} roughness={0.3} metalness={0.2} />
        </mesh>
      </Floating>

      <Particles />
    </group>
  );
}

/**
 * The canvas itself. Opaque #070912 so the 2D fallback
 * composition underneath is fully covered while the scene is
 * live; if the canvas unmounts or never mounts, the fallback
 * is what the visitor sees. `active` pauses the render loop
 * entirely when the hero is offscreen.
 */
export function UniverseScene({
  controls,
  compact,
  active,
}: {
  controls: SceneControls;
  compact: boolean;
  active: boolean;
}) {
  return (
    <Canvas
      dpr={compact ? [1, 1.5] : [1, 1.75]}
      camera={{ position: [0, 0.6, 8], fov: 42 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      frameloop={active ? "always" : "never"}
      onCreated={(state) => state.gl.setClearColor("#070912")}
      aria-hidden
    >
      <Scene controls={controls} />
    </Canvas>
  );
}
