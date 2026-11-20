"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Scroll-reveal wrapper: fades/blurs in once when intersecting. */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "span" | "p" | "h2" | "li" | "section";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      // @ts-expect-error — generic element ref
      ref={ref}
      className={`dbu-reveal ${inView ? "in" : ""} ${className ?? ""}`}
      style={{ ["--d" as string]: String(delay) }}
    >
      {children}
    </Tag>
  );
}
