"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Magnetic } from "../home-v2/Magnetic";

const NAV: Array<{ label: string; target: string }> = [
  { label: "Popular", target: "#popular" },
  { label: "Categories", target: "#categories" },
  { label: "How it works", target: "#how" },
  { label: "Playground", target: "#playground" },
];

/** Fixed header for Home V5 — paper, ink type, vermillion accent. */
export function HeaderV5({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (target: string) => {
    setMenuOpen(false);
    onNavigate(target);
  };

  return (
    <>
      <header
        className={`v5-nav fixed inset-x-0 top-0 z-[80] transition-all duration-300 ${
          scrolled
            ? "border-b-2 border-[#141412] bg-[#faf8f2]/90 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-[72px] sm:px-8">
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("#top");
            }}
            className="font-anta text-lg tracking-wide text-[#141412]"
            aria-label="BuiltByUmer — back to top"
          >
            Built<span className="text-[#ff4d00]">ByUmer</span>
            <span className="align-super text-[10px] text-[#141412]/50">®</span>
          </Link>

          <nav aria-label="Homepage" className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <button
                key={n.target}
                type="button"
                onClick={() => go(n.target)}
                className="text-sm font-medium text-[#141412]/70 transition-colors hover:text-[#141412]"
              >
                <span className="v5-link-line">{n.label}</span>
              </button>
            ))}
            <Link href="/about" className="text-sm font-medium text-[#141412]/70 transition-colors hover:text-[#141412]">
              <span className="v5-link-line">About</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Magnetic className="hidden sm:inline-block">
              <Link
                href="/tools"
                className="group inline-flex items-center gap-1.5 rounded-full bg-[#141412] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#ff4d00]"
              >
                Explore tools
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Magnetic>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#141412] bg-white text-[#141412] md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[75] flex flex-col justify-center bg-[#141412] px-6 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-2">
            {NAV.map((n, i) => (
              <button
                key={n.target}
                type="button"
                onClick={() => go(n.target)}
                className="flex items-baseline gap-4 border-b border-white/15 py-5 text-left"
              >
                <span className="font-grotesk font-semibold text-xs text-[#ff4d00]">0{i + 1}</span>
                <span className="font-anta text-4xl tracking-wide text-white">
                  {n.label}
                </span>
              </button>
            ))}
            <Link
              href="/tools"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4d00] px-6 py-4 text-base font-semibold text-white"
              onClick={() => setMenuOpen(false)}
            >
              Explore all 145 tools
              <ArrowUpRight className="h-5 w-5" />
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
