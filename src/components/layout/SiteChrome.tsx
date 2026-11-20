"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { TOOLS } from "@/data/tools";
import { SITE } from "@/data/site";

/**
 * Shared chrome for every non-homepage route. Restyled into the
 * Home V8 dark cinematic system (Phase 4): #070912 header and
 * footer, violet #8B7CFF accent, hairline borders — nothing
 * else. Inner tool page bodies stay exactly as they are (tool
 * interfaces are Phase 7, later); only this chrome changed.
 * Header is deliberately NOT sticky: the global mobile CSS
 * forces overflow-x:hidden, which breaks position:sticky.
 * Homepage keeps its own HeaderV8/FooterV8.
 */
export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const nav = (
    <>
      <Link href="/tools" className="transition hover:text-[#8b7cff]">
        <span className="v8-link-line">All Tools</span>
      </Link>
      <Link href="/portfolio" className="transition hover:text-[#8b7cff]">
        <span className="v8-link-line">Portfolio</span>
      </Link>
      <Link href="/about" className="transition hover:text-[#8b7cff]">
        <span className="v8-link-line">About</span>
      </Link>
      <Link href="/contact" className="transition hover:text-[#8b7cff]">
        <span className="v8-link-line">Contact</span>
      </Link>
    </>
  );

  return (
    <header className="relative z-40 border-b border-white/10 bg-[#070912]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-[72px] lg:px-8">
        <Link
          href="/"
          className="font-anta text-lg tracking-wide text-[#f5f6ff]"
          aria-label="BuiltByUmer — home"
        >
          Built<span className="text-[#8b7cff]">ByUmer</span>
          <span className="align-super text-[10px] text-[#f5f6ff]/50">®</span>
        </Link>

        <nav
          aria-label="Main"
          className="hidden items-center gap-7 text-sm font-medium text-[#f5f6ff]/75 md:flex"
        >
          {nav}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/tools"
            className="group hidden items-center gap-1.5 rounded-full bg-[#8b7cff] px-5 py-2.5 text-sm font-semibold text-[#070912] transition-colors duration-300 hover:bg-[#c5a6ff] sm:inline-flex"
          >
            Explore tools
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-[#f5f6ff] md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            style={{ minHeight: "44px", minWidth: "44px", touchAction: "manipulation" }}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          aria-label="Mobile"
          className="border-t border-white/10 bg-[#101525] px-5 py-4 md:hidden"
        >
          <div className="flex flex-col">
            {[
              ["All Tools", "/tools"],
              ["Portfolio", "/portfolio"],
              ["About", "/about"],
              ["Contact", "/contact"],
            ].map(([label, href], i) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-baseline gap-4 border-b border-white/10 py-4 text-[#f5f6ff] last:border-b-0"
                style={{ minHeight: "44px" }}
              >
                <span className="font-grotesk text-xs font-semibold text-[#8b7cff]">
                  0{i + 1}
                </span>
                <span className="font-grotesk text-xl font-bold tracking-tight">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
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
    <footer className="border-t border-white/10 bg-[#070912]">
      {/* Slim closing CTA — echoes FooterV8 without repeating its giant block */}
      <div className="mx-auto max-w-7xl px-5 pt-14 sm:px-8">
        <p className="v8-eyebrow">
          <span className="text-[#8b7cff]">●</span> No account. No upload. No catch.
        </p>
        <p className="mt-4 max-w-3xl font-anta text-3xl leading-[1.02] tracking-[0.01em] text-white sm:text-5xl">
          Stop hunting.{" "}
          <span className="text-[#8b7cff]">Start doing.</span>
        </p>
        <Link
          href="/tools"
          className="group mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#070912] transition-colors duration-300 hover:bg-[#8b7cff]"
        >
          Open the toolbox
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 border-t border-white/10 pt-12 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <svg width="24" height="26" viewBox="0 0 34 36" fill="none" aria-hidden>
                <path d="M17 1 32 9.5v17L17 35 2 26.5v-17Z" stroke="#8B7CFF" strokeWidth="2.4" />
                <path
                  d="M12 24V12h4.2a3 3 0 0 1 0 6h-4.2m0 0h4.6a3 3 0 0 1 0 6h-4.6"
                  stroke="#F5F6FF"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-anta text-base tracking-wide text-white">
                Built<span className="text-[#8b7cff]">ByUmer</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Every tool. One destination.
              <br />
              {TOOLS.length} free utilities that run entirely in your browser — nothing uploaded,
              nothing installed.
            </p>
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
                        className="text-white/80 transition-colors hover:text-[#8b7cff]"
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

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center">
          <p>© {SITE.year} Umer Raja · {SITE.name} · {SITE.domain} — All rights reserved. Processed locally in your browser.</p>
          <p className="font-semibold text-white/80">Free · Private · Instant</p>
        </div>
      </div>
    </footer>
  );
}
