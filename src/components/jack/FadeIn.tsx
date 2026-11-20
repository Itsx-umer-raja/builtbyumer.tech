"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/* Static motion components per element type (never created during render). */
const MOTION_TAGS = {
  div: motion.div,
  nav: motion.nav,
  section: motion.section,
  h1: motion.h1,
  h2: motion.h2,
  p: motion.p,
  span: motion.span,
  img: motion.img,
} as const;

type MotionTag = keyof typeof MOTION_TAGS;

export function FadeIn({
  children,
  as = "div",
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  className,
}: {
  children: ReactNode;
  as?: MotionTag;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  className?: string;
}) {
  const M = MOTION_TAGS[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "50px", amount: 0 }}
      transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </M>
  );
}
