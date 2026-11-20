"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "@/data/site";
import { TOOLS } from "@/data/tools";
import { Magnetic } from "./Magnetic";

const COLS: Array<[string, Array<[string, string]>]> = [
  [
    "Product",
    [
      ["All tools", "/tools"],
      ["PDF tools", "/pdf-tools"],
      ["Image tools", "/image-tools"],
      ["Developer tools", "/developer-tools"],
      ["QR tools", "/qr-tools"],
    ],
  ],
  [
    "Company",
    [
      ["About", "/about"],
      ["Portfolio", "/portfolio"],
      ["Contact", "/contact"],
    ],
  ],
  [
    "Legal",
    [
      ["Privacy policy", "/privacy-policy"],
      ["Terms of service", "/terms-of-service"],
    ],
  ],
];

/** Closing CTA + footer in the Home V2 design system. */
export function FooterV2() {
  return (
    <footer className="relative border-t border-hv-line">
      {/* Closing CTA */}
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-20 sm:px-8 sm:pt-28">
        <div data-hv-reveal className="text-center">
          <p className="hv-eyebrow">
            <span className="hv-dot">●</span> No account. No upload. No catch.
          </p>
          <h2 className="mx-auto mt-5 max-w-4xl font-grotesk text-[clamp(2.6rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-hv-ink">
            Stop hunting.
            <br />
            <em className="font-fraunces font-medium italic text-hv-accent">
              Start doing.
            </em>
          </h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <Link
                href="/tools"
                data-cursor="view"
                className="group inline-flex items-center gap-2 rounded-full bg-hv-accent px-8 py-4 text-base font-semibold text-hv-ink transition-colors duration-300 hover:bg-hv-accent-2"
              >
                Open the toolbox
                <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/pdf-tools/merge-pdf"
                className="inline-flex items-center gap-2 rounded-full border border-hv-ink/25 px-8 py-4 text-base font-semibold text-hv-ink transition-colors duration-300 hover:border-hv-ink/60 hover:bg-hv-ink/5"
              >
                Try Merge PDF
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* Giant wordmark */}
      <div className="overflow-hidden px-2" aria-hidden>
        <p className="hv-outline select-none whitespace-nowrap text-center font-grotesk text-[clamp(3.4rem,12.5vw,12rem)] font-bold leading-[0.85] tracking-[-0.04em]">
          BuiltByUmer
        </p>
      </div>

      {/* Link columns */}
      <div className="border-t border-hv-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="font-grotesk text-lg font-bold tracking-tight text-hv-ink">
              Built<span className="text-hv-accent">ByUmer</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-hv-muted">
              Every tool. One destination.
              <br />
              {TOOLS.length} free utilities that run entirely in your browser
              — nothing uploaded, nothing installed.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLS.map(([title, links]) => (
              <div key={title}>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-hv-muted">
                  {title}
                </p>
                <ul className="mt-4 space-y-2.5 text-sm font-medium">
                  {links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-hv-ink/80 transition-colors hover:text-hv-accent"
                      >
                        <span className="hv-link-line">{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-hv-line">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-5 py-6 text-xs text-hv-muted sm:flex-row sm:items-center sm:px-8">
            <p>
              © {SITE.year} Umer Raja · {SITE.name} · {SITE.domain} — All
              rights reserved. Processed locally in your browser.
            </p>
            <p className="font-semibold text-hv-ink/80">
              Free · Private · Instant
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
