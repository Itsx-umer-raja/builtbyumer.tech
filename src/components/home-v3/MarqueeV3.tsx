"use client";

import { TOOLS } from "@/data/tools";

/** Tilted vermillion marquee strip of real tool names. */
export function MarqueeV3() {
  const names = TOOLS.filter((t) =>
    [
      "merge-pdf",
      "compress-pdf",
      "image-compressor",
      "image-resizer",
      "qr-code-generator",
      "wifi-qr-generator",
      "json-formatter",
      "password-generator",
      "word-counter",
      "age-calculator",
      "unit-converter",
      "percentage-calculator",
      "csv-to-json",
      "invoice-generator",
      "what-is-my-ip",
    ].includes(t.id),
  ).map((t) => t.title.toUpperCase());

  const row = (hidden: boolean) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center gap-8 pr-8">
      {names.map((n) => (
        <span key={n} className="flex items-center gap-8 whitespace-nowrap">
          <span className="font-grotesk text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
            {n}
          </span>
          <span className="font-fraunces text-lg italic text-white/70">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <section aria-label="Popular tools" className="relative overflow-hidden py-10">
      <div className="-mx-[4%] w-[108%] -rotate-[1.5deg] bg-v3-accent py-4 shadow-[0_10px_30px_rgba(255,77,0,0.25)]">
        <div className="v3-marquee-track flex w-max">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
