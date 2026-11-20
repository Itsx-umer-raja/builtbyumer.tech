"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useState, type ReactNode } from "react";

/**
 * Draggable card pair (Aceternity-style): free dragging with a rotation
 * that follows the drag direction, a gentle tilt from vertical movement,
 * and the tilt settling on release while the card stays where dropped.
 */

export function DraggableCardContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function DraggableCardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateMV = useMotionValue(0);
  const rotateXMV = useMotionValue(0);
  const rotate = useSpring(rotateMV, { stiffness: 320, damping: 26 });
  const rotateX = useSpring(rotateXMV, { stiffness: 320, damping: 26 });
  const [dragging, setDragging] = useState(false);

  const onDrag = (_: unknown, info: { delta: { x: number; y: number } }) => {
    const rx = Math.max(-14, Math.min(14, info.delta.x * 1.5));
    const rX = Math.max(-10, Math.min(10, info.delta.y * 1.2));
    rotateMV.set(rx);
    rotateXMV.set(rX);
  };
  const onDragEnd = () => {
    setDragging(false);
    rotateMV.set(0);
    rotateXMV.set(0);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.12}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onDragStart={() => setDragging(true)}
      whileDrag={{ scale: 1.04 }}
      whileHover={{ scale: 1.02 }}
      style={{ x, y, rotateX, rotate, zIndex: dragging ? 60 : 10 }}
      className={className}
      data-dragging={dragging}
    >
      {children}
    </motion.div>
  );
}
