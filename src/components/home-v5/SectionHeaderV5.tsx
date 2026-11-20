"use client";

import type { ReactNode } from "react";

/**
 * The one section-header pattern used across the whole homepage:
 * numbered grotesk eyebrow, big Anta display heading, one line of
 * subline. Two typefaces only — Anta for display, Space Grotesk
 * for everything else — and three colours only: ink, paper,
 * vermillion.
 */
export function SectionHeaderV5({
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
    <div className="v5-reveal flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="v5-eyebrow">
          <span className="text-[#ff4d00]">●</span> {index} — {eyebrow}
        </p>
        <h2 className="mt-4 font-anta text-4xl leading-[1.02] tracking-[0.01em] text-[#141412] sm:text-6xl">
          {title}
        </h2>
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-[#141412]/60 sm:text-base">
        {subline}
      </p>
    </div>
  );
}

/** Vermillion span for the second line of a section heading. */
export function VermillionLine({ children }: { children: ReactNode }) {
  return <span className="text-[#ff4d00]">{children}</span>;
}
