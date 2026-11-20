"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Animated BUILDBYUMER wordmark with a geometric BU monogram. */
function Logo() {
  const letters = "BUILDBYUMER".split("");
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="BuiltByUmer home">
      {/* BU monogram */}
      <svg width="34" height="36" viewBox="0 0 34 36" className="shrink-0">
        <motion.g
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.path
            d="M17 1 32 9.5v17L17 35 2 26.5v-17Z"
            fill="none"
            stroke="#111111"
            strokeWidth="2.4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.path
            d="M11 25V11h5.4a3.4 3.4 0 0 1 0 6.8H11m5.2 0 3.8 4.6"
            fill="none"
            stroke="#163D2B"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.g>
      </svg>
      {/* staggered letters */}
      <span className="flex overflow-hidden">
        {letters.map((l, i) => (
          <motion.span
            key={i}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.045, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm font-semibold tracking-[0.22em] text-[#111111]"
          >
            {l}
          </motion.span>
        ))}
      </span>
    </Link>
  );
}

const NAV_LINKS = [
  { label: "Tools", href: "/tools" },
  { label: "Categories", href: "#collection" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

const MOBILE_LINKS = [
  { label: "Tools", href: "/tools" },
  { label: "PDF Tools", href: "/pdf-tools" },
  { label: "Image Tools", href: "/image-tools" },
  { label: "QR Tools", href: "/qr-tools" },
  { label: "Developer Tools", href: "/developer-tools" },
  { label: "About", href: "/about" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-30">
      <div className="flex items-center justify-between px-6 pt-6 md:px-12 md:pt-8">
        <Logo />

        {/* Animated hamburger (mobile only — desktop uses the sub-navigation) */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="relative flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <motion.span
            animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="block h-[2px] w-6 bg-[#111111]"
          />
          <motion.span
            animate={open ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="block h-[2px] w-6 bg-[#111111]"
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mx-4 mt-3 rounded-xl border border-[#111111]/10 bg-white shadow-[0_20px_50px_rgba(10,10,10,0.12)] md:hidden"
          >
            <nav className="flex flex-col p-2">
              {MOBILE_LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-[#111111] transition-colors hover:bg-[#fcfcfc]"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/** Three-column sub-navigation under the header. */
export function SubNav() {
  return (
    <div className="grid grid-cols-1 items-start gap-6 px-6 pt-8 sm:grid-cols-3 md:px-12 md:pt-10">
      <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-[#111111] md:text-[11px]">
        Built
        <br />
        for
        <br />
        everyone
      </p>
      <p className="max-w-xs font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-[#888888] sm:text-center md:text-[11px]">
        One destination for the digital tools that make everyday work easier.
      </p>
      <nav className="flex flex-wrap gap-x-8 gap-y-2 sm:justify-end">
        {NAV_LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#111111] md:text-[11px]"
          >
            <span className="underline-offset-4 group-hover:underline">{l.label}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        ))}
      </nav>
    </div>
  );
}
