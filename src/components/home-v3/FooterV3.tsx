"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "@/data/site";
import { TOOLS } from "@/data/tools";
import { Magnetic } from "../home-v2/Magnetic";

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

/** Closing CTA + footer in the Home V3 light system. */
export function FooterV3() {
  return (
    <footer className="relative border-t border-v3-line">
      {/* Closing CTA */}
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-20 sm:px-8 sm:pt-28">
        <div data-v3-reveal className="text-center">
          <p className="v3-eyebrow">
            <span className="v3-dot">●</span> No account. No upload. No catch.
          </p>
          <h2 className="mx-auto mt-5 max-w-4xl font-grotesk text-[clamp(2.6rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-v3-ink">
            Stop hunting.
            <br />
            <em className="font-fraunces font-medium italic text-v3-accent">
              Start doing.
            </em>
          </h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <Link
                href="/tools"
                className="group inline-flex items-center gap-2 rounded-full bg-v3-accent px-8 py-4 text-base font-semibold text-white transition-colors duration-300 hover:bg-v3-accent-2"
              >
                Open the toolbox
                <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/pdf-tools/merge-pdf"
                className="inline-flex items-center gap-2 rounded-full border border-v3-ink/25 bg-white/60 px-8 py-4 text-base font-semibold text-v3-ink transition-colors duration-300 hover:border-v3-ink/60 hover:bg-white"
              >
                Try Merge PDF
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* Giant wordmark */}
      <div className="overflow-hidden px-2" aria-hidden>
        <p className="v3-outline select-none whitespace-nowrap text-center font-grotesk text-[clamp(3.4rem,12.5vw,12rem)] font-bold leading-[0.85] tracking-[-0.04em]">
          BuiltByUmer
        </p>
      </div>

      {/* Link columns */}
      <div className="border-t border-v3-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="font-grotesk text-lg font-bold tracking-tight text-v3-ink">
              Built<span className="text-v3-accent">ByUmer</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-v3-muted">
              Every tool. One destination.
              <br />
              {TOOLS.length} free utilities that run entirely in your browser
              — nothing uploaded, nothing installed.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLS.map(([title, links]) => (
              <div key={title}>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-v3-muted">
                  {title}
                </p>
                <ul className="mt-4 space-y-2.5 text-sm font-medium">
                  {links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-v3-ink/80 transition-colors hover:text-v3-accent"
                      >
                        <span className="v3-link-line">{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-v3-line">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-5 py-6 text-xs text-v3-muted sm:flex-row sm:items-center sm:px-8">
            <p>
              © {SITE.year} Umer Raja · {SITE.name} · {SITE.domain} — All
              rights reserved. Processed locally in your browser.
            </p>
            <p className="font-semibold text-v3-ink/80">
              Free · Private · Instant
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
