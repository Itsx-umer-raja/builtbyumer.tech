"use client";

import Link from "next/link";

/**
 * Pro band — slim and honest, restyled into the V8 dark
 * system. BuiltByUmer Pro does not exist yet: no price, no
 * checkout, no invented features. The band lists what is
 * coming and offers a waitlist via the contact page. Commerce
 * stays deferred until after the storytelling.
 * Reimplemented from the V7 system.
 */
export function ProBand() {
  return (
    <section
      id="pro"
      className="relative border-y border-[var(--v8-line)] bg-[var(--v8-bg-2)] py-10"
      aria-label="BuiltByUmer Pro — coming soon"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-5 sm:px-8">
        <div className="min-w-0 flex-1">
          <p className="v8-eyebrow">Coming soon</p>
          <h2 className="mt-2 font-anta text-3xl leading-none text-[var(--v8-text)] sm:text-4xl">
            BuiltByUmer <span className="text-[var(--v8-accent)]">Pro</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--v8-muted)] sm:text-base">
            For the heavy travellers: batch processing, no ads, and
            API access. Everything else stays free, forever.
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {["Batch processing", "No ads", "API access"].map((f) => (
            <li
              key={f}
              className="rounded-full border border-[var(--v8-line-strong)] bg-white/[0.03] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--v8-muted)]"
            >
              {f}
            </li>
          ))}
        </ul>
        <Link
          href="/contact"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--v8-text)] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-[var(--v8-bg)] transition-colors hover:bg-[var(--v8-accent)]"
        >
          Join the waitlist ↗
        </Link>
      </div>
    </section>
  );
}
