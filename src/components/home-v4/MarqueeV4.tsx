"use client";

import { TOOLS } from "@/data/tools";

/** Tilted ember marquee strip of real tool names. */
export function MarqueeV4() {
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
          <span className="font-anta text-sm uppercase tracking-[0.18em] text-white/95">
            {n}
          </span>
          <span className="text-lg text-[#FAD53E]">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <section aria-label="Popular tools" className="relative overflow-hidden bg-black py-10">
      <div className="-mx-[4%] w-[108%] -rotate-[1.5deg] bg-[#ff4d00] py-4 shadow-[0_10px_40px_rgba(255,77,0,0.35)]">
        <div className="v4-marquee-track flex w-max">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
