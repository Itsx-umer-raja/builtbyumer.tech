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

/** Closing CTA + footer in the Home V4 cinematic black system. */
export function FooterV4() {
  return (
    <footer className="relative border-t border-white/10 bg-black">
      {/* Closing CTA */}
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-20 sm:px-8 sm:pt-28">
        <div className="v4-reveal text-center">
          <p className="v4-eyebrow">
            <span className="v4-dot">●</span> No account. No upload. No catch.
          </p>
          <h2 className="mx-auto mt-5 max-w-4xl font-anta text-[clamp(2.6rem,8vw,6.5rem)] leading-[1.02] tracking-[0.01em] text-white">
            Stop hunting.
            <br />
            <span className="bg-gradient-to-r from-[#ff9646] to-[#ff4d00] bg-clip-text text-transparent">
              Start doing.
            </span>
          </h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <Link
                href="/tools"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[#030103] transition-shadow duration-300 hover:shadow-[0_0_40px_rgba(255,77,0,0.45)]"
              >
                Open the toolbox
                <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/pdf-tools/merge-pdf"
                className="v4-glass inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white transition-colors duration-300 hover:bg-[rgba(255,150,70,0.32)]"
              >
                Try Merge PDF
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* Giant wordmark */}
      <div className="overflow-hidden px-2" aria-hidden>
        <p className="v4-outline select-none whitespace-nowrap text-center font-anta text-[clamp(3.4rem,12.5vw,12rem)] leading-[0.85] tracking-[0.01em]">
          BuiltByUmer
        </p>
      </div>

      {/* Link columns */}
      <div className="border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="font-anta text-lg tracking-wide text-white">
              Built<span className="text-[#ff4d00]">ByUmer</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Every tool. One destination.
              <br />
              {TOOLS.length} free utilities that run entirely in your browser
              — nothing uploaded, nothing installed.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLS.map(([title, links]) => (
              <div key={title}>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
                  {title}
                </p>
                <ul className="mt-4 space-y-2.5 text-sm font-medium">
                  {links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-white/80 transition-colors hover:text-[#ff9646]"
                      >
                        <span className="v4-link-line">{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-5 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:px-8">
            <p>
              © {SITE.year} Umer Raja · {SITE.name} · {SITE.domain} — All
              rights reserved. Processed locally in your browser.
            </p>
            <p className="font-semibold text-white/80">
              Free · Private · Instant
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
