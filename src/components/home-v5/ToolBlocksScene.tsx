"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/**
 * The 3D story: the toolbox as building blocks. A field of
 * low-poly geometric blocks — the tools themselves as solid
 * forms — in exactly the three brand colours (ink, paper,
 * vermillion), drifting, rotating, reacting to the pointer and
 * to scroll. Nothing else is in the scene: no ground plane, no
 * fog, no extra hues, so the blocks read as pure form on paper.
 *
 * Performance rules (the brief's own targets):
 * - The Canvas is lazy-loaded (next/dynamic, ssr:false) by the
 *   hero and only mounted when the hero is near the viewport.
 * - `frameloop` is "never" whenever the hero is offscreen, so
 *   the loop costs nothing while the visitor reads below.
 * - DPR is capped (1.75 desktop, 1.5 mobile); ~16 meshes is a
 *   trivial draw load; no shadows, no post-processing.
 * - Reduced motion never mounts the canvas at all — the hero
 *   shows the static composed frame instead.
 */

export type SceneControls = {
  /** 0..1 scroll progress through the hero */
  scroll: number;
  /** -1..1 pointer position over the hero */
  px: number;
  py: number;
};

const INK = "#161613";
const PAPER = "#ffffff";
const VERMILLION = "#ff4d00";

type BlockDef = {
  kind: "box" | "torus" | "cyl" | "ico";
  pos: [number, number, number];
  /** size args: box [w,h,d] · torus [r,tube] · cyl [r,h] · ico [r] */
  args: number[];
  color: string;
  /** black edge lines — how paper blocks stay visible on paper */
  edge?: boolean;
  speed: number;
  amp: number;
  phase: number;
  rot: number;
};

const BLOCKS: BlockDef[] = [
  { kind: "box", pos: [-2.6, 1.1, -0.4], args: [1.3, 1.3, 1.3], color: INK, speed: 0.5, amp: 0.16, phase: 0.0, rot: 0.12 },
  { kind: "box", pos: [2.4, 1.4, -0.8], args: [0.9, 0.9, 0.9], color: VERMILLION, speed: 0.7, amp: 0.2, phase: 1.3, rot: -0.15 },
  { kind: "box", pos: [-2.2, -1.2, 0.2], args: [1.0, 1.0, 1.0], color: PAPER, edge: true, speed: 0.6, amp: 0.18, phase: 2.1, rot: 0.1 },
  { kind: "box", pos: [2.8, -0.9, 0.4], args: [0.7, 0.7, 0.7], color: INK, speed: 0.8, amp: 0.14, phase: 0.7, rot: -0.18 },
  { kind: "box", pos: [0.4, 1.9, -1.0], args: [0.55, 0.55, 0.55], color: PAPER, edge: true, speed: 0.9, amp: 0.12, phase: 3.4, rot: 0.2 },
  { kind: "box", pos: [-0.9, 0.2, 0.8], args: [0.8, 0.8, 0.8], color: VERMILLION, speed: 0.55, amp: 0.22, phase: 1.9, rot: 0.14 },
  { kind: "box", pos: [1.6, 0.3, -0.2], args: [0.6, 0.6, 0.6], color: PAPER, edge: true, speed: 0.75, amp: 0.15, phase: 2.8, rot: -0.12 },
  { kind: "torus", pos: [2.9, 0.2, -0.6], args: [0.7, 0.22], color: INK, speed: 0.6, amp: 0.18, phase: 0.4, rot: 0.22 },
  { kind: "torus", pos: [-2.9, -0.1, -0.9], args: [0.5, 0.18], color: VERMILLION, speed: 0.85, amp: 0.13, phase: 1.1, rot: -0.2 },
  { kind: "cyl", pos: [0.9, -1.5, 0.3], args: [0.45, 0.9], color: INK, speed: 0.65, amp: 0.17, phase: 2.4, rot: 0.16 },
  { kind: "cyl", pos: [-1.5, 1.7, -0.5], args: [0.35, 0.7], color: PAPER, edge: true, speed: 0.7, amp: 0.14, phase: 0.9, rot: -0.14 },
  { kind: "ico", pos: [0.2, -0.6, -1.2], args: [0.55], color: VERMILLION, speed: 0.8, amp: 0.16, phase: 3.0, rot: 0.18 },
  { kind: "ico", pos: [-0.3, 1.2, 0.6], args: [0.4], color: INK, speed: 0.9, amp: 0.12, phase: 1.6, rot: -0.16 },
  { kind: "box", pos: [3.1, 1.8, 0.2], args: [0.45, 0.45, 0.45], color: PAPER, edge: true, speed: 0.95, amp: 0.11, phase: 2.2, rot: 0.2 },
  { kind: "box", pos: [-3.2, 0.5, 0.9], args: [0.5, 0.5, 0.5], color: VERMILLION, speed: 0.7, amp: 0.15, phase: 0.2, rot: -0.1 },
  { kind: "box", pos: [1.2, -1.9, -0.4], args: [0.65, 0.65, 0.65], color: PAPER, edge: true, speed: 0.6, amp: 0.19, phase: 3.7, rot: 0.13 },
];

function BlockMesh({ def }: { def: BlockDef }) {
  const material = (
    <meshStandardMaterial color={def.color} roughness={0.42} metalness={0.08} />
  );
  const edges = def.edge ? (
    <Edges scale={1.02} threshold={15} color={INK} />
  ) : null;
  switch (def.kind) {
    case "torus":
      return (
        <mesh>
          <torusGeometry args={[def.args[0], def.args[1], 16, 64]} />
          {material}
          {edges}
        </mesh>
      );
    case "cyl":
      return (
        <mesh>
          <cylinderGeometry args={[def.args[0], def.args[0], def.args[1], 32]} />
          {material}
          {edges}
        </mesh>
      );
    case "ico":
      return (
        <mesh>
          <icosahedronGeometry args={[def.args[0], 0]} />
          {material}
          {edges}
        </mesh>
      );
    default:
      return (
        <RoundedBox
          args={[def.args[0], def.args[1], def.args[2]]}
          radius={0.07}
          smoothness={4}
        >
          {material}
          {edges}
        </RoundedBox>
      );
  }
}

function Blocks({
  controls,
  compact,
}: {
  controls: SceneControls;
  compact: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<Array<THREE.Object3D | null>>([]);
  const defs = compact ? BLOCKS.slice(0, 8) : BLOCKS;

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // Idle drift + scroll turn + pointer parallax, all eased so the
    // scene feels weighty rather than twitchy.
    const targetY = t * 0.05 + controls.scroll * 1.4 + controls.px * 0.3;
    const targetX = controls.py * 0.18 + controls.scroll * 0.5;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetY, 0.06);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetX, 0.06);
    // Each block floats on its own sine and turns slowly.
    defs.forEach((def, i) => {
      const m = meshRefs.current[i];
      if (!m) return;
      m.position.y = def.pos[1] + Math.sin(t * def.speed + def.phase) * def.amp;
      m.rotation.x += delta * def.rot;
      m.rotation.y += delta * def.rot * 0.7;
    });
  });

  return (
    <group ref={groupRef}>
      {defs.map((def, i) => (
        <group
          key={i}
          position={def.pos}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
        >
          <BlockMesh def={def} />
        </group>
      ))}
    </group>
  );
}

/**
 * The canvas itself. Transparent (alpha) so the paper page shows
 * through; the blocks are the only thing drawn. `active` pauses
 * the render loop entirely when the hero is offscreen.
 */
export function ToolBlocksScene({
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
      camera={{ position: [0, 0.2, 11], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={active ? "always" : "never"}
      aria-hidden
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[5, 8, 6]} intensity={1.6} />
      <directionalLight position={[-6, -3, 4]} intensity={0.45} />
      <Blocks controls={controls} compact={compact} />
    </Canvas>
  );
}
