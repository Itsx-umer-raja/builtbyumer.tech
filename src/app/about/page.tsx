import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Lock, Sparkles, Wrench } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { TOOLS } from "@/data/tools";
import { SITE } from "@/data/site";
import { PageShell } from "@/components/home-v2/PageShell";
import { Reveal } from "@/components/home-v2/Reveal";
import { Magnetic } from "@/components/home-v2/Magnetic";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE.name} is a free online tools platform: ${TOOLS.length} utilities that run entirely in your browser. No accounts, no uploads, no installed software.`,
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  {
    icon: Lock,
    t: "Private by default",
    d: "File processing happens in your browser. We never see, store or transmit your documents.",
  },
  {
    icon: Sparkles,
    t: "Free by design",
    d: "No accounts for basic tools, no paywalls on processing, no artificial limits beyond what a browser can handle.",
  },
  {
    icon: Wrench,
    t: "Built to be useful",
    d: "Each tool does one job properly, with honest documentation of what it can and cannot do.",
  },
];

const STATS: Array<[string, string]> = [
  [String(TOOLS.length), "free tools"],
  [String(CATEGORIES.length), "categories"],
  ["0", "files uploaded"],
  ["100%", "in your browser"],
];

export default function AboutPage() {
  return (
    <PageShell marquee>
      <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
        <Reveal>
          <p className="hv-eyebrow">
            <span className="hv-dot">●</span> About — BuiltByUmer
          </p>
          <h1 className="mt-4 max-w-4xl font-grotesk text-[clamp(2.8rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-hv-ink">
            Every tool.
            <br />
            <em className="font-fraunces font-medium italic text-hv-accent">One destination.</em>
          </h1>
        </Reveal>

        <Reveal className="mt-10 max-w-3xl">
          <div className="space-y-6 text-base leading-relaxed text-hv-ink/85 sm:text-lg">
            <p>
              {SITE.name} ({SITE.domain}) is an independent, free online tools platform. It exists
              for one reason: the everyday work of converting, creating, calculating and cleaning up
              files should not require installing questionable software, creating accounts or
              uploading private documents to strangers.
            </p>
            <p>
              Every tool on this site runs locally in your browser using modern web APIs — Canvas,
              Web Crypto, WebAssembly libraries like pdf-lib and Tesseract. Your files never leave
              your device. Network lookups (IP, DNS, currency rates) are the only exceptions, and
              they send nothing except the address or domain you explicitly ask about.
            </p>
            <p>
              The site currently offers {TOOLS.length} tools across {CATEGORIES.length} categories,
              and the directory grows continuously. The design — the cinematic valley hero, the
              floating-island story, the filmography shelf — reflects the same belief that practical
              software can still be beautiful.
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-14">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hv-line bg-hv-line lg:grid-cols-4">
            {STATS.map(([num, label]) => (
              <div key={label} className="bg-hv-surface px-6 py-8">
                <p className="font-grotesk text-4xl font-bold tabular-nums text-hv-ink sm:text-5xl">
                  {num}
                </p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-hv-muted">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-14">
          <h2 className="hv-eyebrow">
            <span className="hv-dot">●</span> What we believe
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map((c) => (
              <div key={c.t} className="tool-card rounded-xl border border-hv-line bg-hv-surface p-6">
                <c.icon className="h-6 w-6 text-hv-accent" aria-hidden />
                <h3 className="mt-4 font-grotesk text-lg font-bold tracking-tight text-hv-ink">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-hv-muted">{c.d}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-14">
          <div className="flex flex-wrap gap-3">
            <Magnetic>
              <Link
                href="/tools"
                className="group inline-flex items-center gap-2 rounded-full bg-hv-accent px-7 py-3.5 text-sm font-semibold text-hv-ink transition-colors duration-300 hover:bg-hv-accent-2"
              >
                Explore all {TOOLS.length} tools
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-hv-ink/25 px-7 py-3.5 text-sm font-semibold text-hv-ink transition-colors duration-300 hover:border-hv-ink/60 hover:bg-hv-ink/5"
              >
                Get in touch
              </Link>
            </Magnetic>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
