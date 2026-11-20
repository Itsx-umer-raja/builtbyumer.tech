"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Magnetic } from "./Magnetic";

const NAV: Array<{ label: string; target: string }> = [
  { label: "Categories", target: "#categories" },
  { label: "Featured", target: "#featured" },
  { label: "How it works", target: "#how" },
];

export function HeaderV2({ onNavigate }: { onNavigate: (id: string) => void }) {
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
        className={`fixed inset-x-0 top-0 z-[80] transition-all duration-300 ${
          scrolled
            ? "border-b border-hv-line bg-hv-bg/85 backdrop-blur-md"
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
            className="font-grotesk text-lg font-bold tracking-tight text-hv-ink"
            aria-label="BuiltByUmer — back to top"
          >
            Built<span className="text-hv-accent">ByUmer</span>
            <span className="align-super text-[10px] text-hv-muted">®</span>
          </Link>

          <nav aria-label="Homepage" className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <button
                key={n.target}
                type="button"
                onClick={() => go(n.target)}
                className="text-sm font-medium text-hv-ink/75 transition-colors hover:text-hv-ink"
              >
                <span className="hv-link-line">{n.label}</span>
              </button>
            ))}
            <Link href="/about" className="text-sm font-medium text-hv-ink/75 transition-colors hover:text-hv-ink">
              <span className="hv-link-line">About</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Magnetic className="hidden sm:inline-block">
              <Link
                href="/tools"
                data-cursor="view"
                className="group inline-flex items-center gap-1.5 rounded-full bg-hv-ink px-5 py-2.5 text-sm font-semibold text-hv-bg transition-colors duration-300 hover:bg-hv-accent hover:text-hv-ink"
              >
                Explore tools
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Magnetic>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-hv-line-strong text-hv-ink md:hidden"
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
        <div className="fixed inset-0 z-[75] flex flex-col justify-center bg-hv-bg px-6 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-2">
            {NAV.map((n, i) => (
              <button
                key={n.target}
                type="button"
                onClick={() => go(n.target)}
                className="flex items-baseline gap-4 border-b border-hv-line py-5 text-left"
              >
                <span className="font-mono text-xs text-hv-accent">
                  0{i + 1}
                </span>
                <span className="font-grotesk text-4xl font-bold tracking-tight text-hv-ink">
                  {n.label}
                </span>
              </button>
            ))}
            <Link
              href="/tools"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-hv-accent px-6 py-4 text-base font-semibold text-hv-ink"
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
