"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";

function Char({
  char,
  start,
  end,
  progress,
}: {
  char: string;
  start: number;
  end: number;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, [start, end], [0.2, 1]);
  return (
    <span className="relative inline-block whitespace-pre">
      {/* Invisible placeholder keeps layout stable while the visible copy fades in. */}
      <span className="invisible">{char}</span>
      <motion.span aria-hidden className="absolute inset-0" style={{ opacity }}>
        {char}
      </motion.span>
    </span>
  );
}

/** Character-by-character scroll-reveal paragraph (opacity 0.2 → 1). */
export function AnimatedText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.2"],
  });
  const chars = Array.from(text);
  return (
    <p ref={ref} className={className} aria-label={text}>
      {chars.map((c, i) => (
        <Char
          key={i}
          char={c}
          start={i / chars.length}
          end={(i + 1) / chars.length}
          progress={scrollYProgress}
        />
      ))}
    </p>
  );
}
