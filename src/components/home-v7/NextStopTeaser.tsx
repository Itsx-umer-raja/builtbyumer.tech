"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";

/**
 * Next-stop teaser — Expedia ends each chapter with a full-bleed
 * teaser for the next state, not a conventional footer. Ours
 * points back to the second stop (the Valley of Pixels) and
 * offers the drive back to the map.
 */
export function NextStopTeaser({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <section
      className="relative overflow-hidden bg-[#163d2b] py-20 sm:py-28"
      aria-label="Next stop teaser"
    >
      <div className="mx-auto max-w-7xl px-5 text-center sm:px-8">
        <p className="v7-reveal font-caveat text-4xl text-[#f6c453] sm:text-5xl">
          Next stop
        </p>
        <h2 className="v7-reveal mx-auto mt-2 max-w-5xl font-antonio text-[clamp(2.8rem,9vw,6.5rem)] font-bold uppercase leading-[0.92] text-[#fdf6e3]">
          The Valley of Pixels
        </h2>
        <p className="v7-reveal mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#fdf6e3]/75 sm:text-lg">
          Stop 02 — 22 image tools. Compress, resize, convert and
          crop, all without uploading a single photo.
        </p>
        <div className="v7-reveal mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate("#stop-image-tools")}
            className="group inline-flex items-center gap-2 rounded-full bg-[#ff4d00] px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#e04400]"
          >
            Drive to Stop 02
            <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("#map")}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#fdf6e3]/60 px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-[#fdf6e3] transition-colors hover:border-[#fdf6e3]"
          >
            Back to the map
          </button>
        </div>
      </div>
    </section>
  );
}

/** Ink footer with the giant outlined wordmark. */
export function FooterV7() {
  const cols: Array<[string, Array<[string, string]>]> = [
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

  return (
    <footer className="border-t-2 border-[#2a2118] bg-[#2a2118] text-white">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-14 sm:px-8">
        <p className="v7-eyebrow !text-white/50">
          <span className="text-[#ff4d00]">●</span> No account. No upload.
          No catch.
        </p>
        <p className="v7-outline mt-4 select-none font-antonio text-[clamp(3rem,10vw,8rem)] font-bold uppercase leading-none">
          BuiltByUmer
        </p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">
          Every tool. One destination. 145 free utilities that run
          entirely in your browser — nothing uploaded, nothing installed.
        </p>

        <div className="mt-12 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
              The road
            </p>
            <p className="mt-3 font-caveat text-3xl text-[#fdf6e3]/80">
              Route 145 — 145 tools · 10 stops · One road
            </p>
            <Link
              href="/tools"
              className="group mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2a2118] transition-colors hover:bg-[#ff4d00] hover:text-white"
            >
              Open the toolbox
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {cols.map(([title, links]) => (
              <div key={title}>
                <p className="font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
                  {title}
                </p>
                <ul className="mt-4 space-y-2.5 text-sm font-medium">
                  {links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-white/80 transition-colors hover:text-[#ff4d00]"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/45">
          <span>© 2026 Umer Raja — BuiltByUmer. All rights reserved.</span>
          <span>ROUTE 145 · builtbyumer.tech</span>
        </div>
      </div>
    </footer>
  );
}
