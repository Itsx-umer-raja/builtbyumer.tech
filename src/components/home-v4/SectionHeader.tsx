"use client";

import type { ReactNode } from "react";

/**
 * The one section-header pattern used across the whole homepage:
 * small ember eyebrow (numbered), big Anta display heading, one
 * line of subline. Every section reads the same way, so the eye
 * always knows what matters.
 */
export function SectionHeader({
  index,
  eyebrow,
  title,
  subline,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  subline: string;
}) {
  return (
    <div className="v4-reveal flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="v4-eyebrow">
          <span className="v4-dot">●</span> {index} — {eyebrow}
        </p>
        <h2 className="mt-4 font-anta text-4xl leading-[1.05] tracking-[0.01em] text-white sm:text-6xl">
          {title}
        </h2>
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-white/55 sm:text-base">
        {subline}
      </p>
    </div>
  );
}

/** Ember gradient span for the second line of a section heading. */
export function EmberLine({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-[#ff9646] to-[#ff4d00] bg-clip-text text-transparent">
      {children}
    </span>
  );
}
