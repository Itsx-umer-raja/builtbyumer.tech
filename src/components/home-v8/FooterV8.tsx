"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { STOPS } from "./routeData";
import { TOOLS } from "@/data/tools";
import { SITE } from "@/data/site";

/**
 * Next-stop teaser — Expedia ends each chapter with a
 * full-bleed teaser for the next state, not a conventional
 * footer. Ours points back to the second stop (the Valley of
 * Pixels) and offers the drive back to the map.
 * Restyled into the V8 dark system.
 */
export function NextStopTeaser({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  const second = STOPS[1];
  return (
    <section
      className="v8-topo-bg relative overflow-hidden bg-[var(--v8-bg-2)] py-20 sm:py-28"
      aria-label="Next stop teaser"
    >
      <div className="mx-auto max-w-7xl px-5 text-center sm:px-8">
        <p className="v8-reveal font-grotesk text-3xl italic text-[var(--v8-accent)] sm:text-4xl">
          Next stop
        </p>
        <h2 className="v8-reveal mx-auto mt-2 max-w-5xl font-anta text-[clamp(2.8rem,9vw,6.5rem)] leading-[0.92] text-[var(--v8-text)]">
          {second.nickname}
        </h2>
        <p className="v8-reveal mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--v8-muted)] sm:text-lg">
          Stop 02 — {second.count} image tools. Compress, resize,
          convert and crop, all without uploading a single photo.
        </p>
        <div className="v8-reveal mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/${second.slug}`}
            className="v8-btn-primary group inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] transition-colors"
          >
            Drive to Stop 02
            <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </Link>
          <button
            type="button"
            onClick={() => onNavigate("#map")}
            className="v8-btn-ghost inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] transition-colors"
          >
            Back to the map
          </button>
        </div>
      </div>
    </section>
  );
}

/** Ink footer with the giant outlined wordmark. */
export function FooterV8() {
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
    <footer
      id="v8-footer"
      className="border-t border-[var(--v8-line)] bg-[var(--v8-bg)]"
    >
      <div className="mx-auto max-w-7xl px-5 pt-14 sm:px-8">
        <p className="v8-eyebrow">
          <span className="v8-dot">●</span> No account. No upload. No catch.
        </p>
        <p className="mt-4 max-w-3xl font-anta text-3xl leading-[1.02] tracking-[0.01em] text-[var(--v8-text)] sm:text-5xl">
          Stop hunting.{" "}
          <span className="text-[var(--v8-accent)]">Start doing.</span>
        </p>
        <Link
          href="/tools"
          className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--v8-text)] px-6 py-3 text-sm font-semibold text-[var(--v8-bg)] transition-colors duration-300 hover:bg-[var(--v8-accent)]"
        >
          Open the toolbox
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 border-t border-[var(--v8-line)] pt-12 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <svg width="24" height="26" viewBox="0 0 34 36" fill="none" aria-hidden>
                <path
                  d="M17 1 32 9.5v17L17 35 2 26.5v-17Z"
                  stroke="#8B7CFF"
                  strokeWidth="2.4"
                />
                <path
                  d="M12 24V12h4.2a3 3 0 0 1 0 6h-4.2m0 0h4.6a3 3 0 0 1 0 6h-4.6"
                  stroke="#F5F6FF"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-anta text-base tracking-wide text-[var(--v8-text)]">
                Built<span className="text-[var(--v8-accent)]">ByUmer</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--v8-muted)]">
              Every tool. One destination.
              <br />
              {TOOLS.length} free utilities that run entirely in your
              browser — nothing uploaded, nothing installed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {cols.map(([title, links]) => (
              <div key={title}>
                <p className="font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--v8-muted)]">
                  {title}
                </p>
                <ul className="mt-4 space-y-2.5 text-sm font-medium">
                  {links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-[var(--v8-text)]/80 transition-colors hover:text-[var(--v8-accent)]"
                      >
                        <span className="v8-link-line">{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Giant outlined wordmark */}
        <p
          aria-hidden
          className="v8-outline mt-14 select-none text-center font-anta text-[clamp(3rem,12vw,10rem)] leading-none tracking-[0.01em]"
        >
          BUILTBYUMER
        </p>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[var(--v8-line)] pt-6 text-xs text-[var(--v8-muted)] sm:flex-row sm:items-center">
          <p>
            © {SITE.year} Umer Raja · {SITE.name} · {SITE.domain} — All
            rights reserved. Processed locally in your browser.
          </p>
          <p className="font-semibold text-[var(--v8-text)]/80">
            Free · Private · Instant
          </p>
        </div>
      </div>
    </footer>
  );
}
