"use client";

import { TOOLS } from "@/data/tools";

/** Marquee strip of real tool names, duplicated for a seamless loop. */
export function Marquee() {
  const names = TOOLS.filter((t) =>
    [
      "merge-pdf",
      "image-compressor",
      "qr-code-generator",
      "json-formatter",
      "password-generator",
      "word-counter",
      "percentage-calculator",
      "csv-to-json",
      "invoice-generator",
      "what-is-my-ip",
      "compress-pdf",
      "wifi-qr-generator",
    ].includes(t.id),
  ).map((t) => t.title.toUpperCase());

  const row = (hidden: boolean) => (
    <div
      aria-hidden={hidden}
      className="flex shrink-0 items-center gap-8 pr-8"
    >
      {names.map((n) => (
        <span key={n} className="flex items-center gap-8 whitespace-nowrap">
          <span className="font-grotesk text-sm font-semibold uppercase tracking-[0.18em] text-hv-ink/80">
            {n}
          </span>
          <span className="font-fraunces text-lg italic text-hv-accent">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden border-y border-hv-line bg-hv-bg-2 py-4">
      <div className="hv-marquee-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
