"use client";

import Link from "next/link";

/**
 * Pro band — slim and honest. BuiltByUmer Pro does not exist yet:
 * no price, no checkout, no invented features. The band lists
 * what is coming and offers a waitlist via the contact page.
 * Commerce stays deferred until after the storytelling.
 */
export function ProBand() {
  return (
    <section
      className="relative border-y-2 border-[#2a2118] bg-[#fff7ed] py-10"
      aria-label="BuiltByUmer Pro — coming soon"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-5 sm:px-8">
        <div className="min-w-0 flex-1">
          <p className="v7-eyebrow">Coming soon</p>
          <h2 className="mt-2 font-antonio text-3xl font-bold uppercase leading-none text-[#2a2118] sm:text-4xl">
            BuiltByUmer <span className="text-[#ff4d00]">Pro</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#2a2118]/70 sm:text-base">
            For the heavy travellers: batch processing, no ads, and API
            access. Everything else stays free, forever.
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {["Batch processing", "No ads", "API access"].map((f) => (
            <li
              key={f}
              className="rounded-full border-2 border-[#2a2118]/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#2a2118]/75"
            >
              {f}
            </li>
          ))}
        </ul>
        <Link
          href="/contact"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#2a2118] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#ff4d00]"
        >
          Join the waitlist ↗
        </Link>
      </div>
    </section>
  );
}
