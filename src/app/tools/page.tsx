import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { TOOLS, toolsByCategory } from "@/data/tools";
import { SITE } from "@/data/site";
import { ToolSearch } from "@/components/tools/ToolSearch";
import { PageShell } from "@/components/home-v2/PageShell";
import { Reveal } from "@/components/home-v2/Reveal";

export const metadata: Metadata = {
  title: "All Tools — Free Online Utilities",
  description: `Search every free tool on ${SITE.name}: PDF conversion, image compression, QR codes, developer utilities, calculators and more. No account, no uploads.`,
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <PageShell marquee>
      <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
        <Reveal>
          <p className="hv-eyebrow">
            <span className="hv-dot">●</span> The index — {TOOLS.length} tools · {CATEGORIES.length} categories
          </p>
          <h1 className="mt-4 max-w-4xl font-grotesk text-[clamp(2.8rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-hv-ink">
            Every tool.
            <br />
            <em className="font-fraunces font-medium italic text-hv-accent">One destination.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-hv-muted sm:text-lg">
            {TOOLS.length} free utilities that run entirely in your browser — convert files, generate
            codes, calculate anything and clean up text without uploading a single byte.
          </p>
        </Reveal>

        <Reveal className="mt-12">
          <ToolSearch tools={TOOLS} />
        </Reveal>

        {/* Grouped directory — all 145 tools under their 10 real categories */}
        <Reveal className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-hv-line pt-12">
            <h2 className="font-grotesk text-3xl font-bold tracking-tight text-hv-ink sm:text-4xl">
              Browse by <em className="font-fraunces font-medium italic text-hv-accent">category</em>
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-hv-muted">
              {TOOLS.length} tools · No account · No upload
            </p>
          </div>
        </Reveal>

        <div className="mt-10 space-y-12">
          {CATEGORIES.map((c) => {
            const tools = toolsByCategory(c.slug);
            return (
              <Reveal key={c.slug}>
                <section aria-label={c.name}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-hv-line pb-4">
                    <h3 className="font-grotesk text-2xl font-bold tracking-tight text-hv-ink">
                      {c.name}{" "}
                      <span className="font-mono text-sm font-medium text-hv-accent">
                        {String(tools.length).padStart(2, "0")}
                      </span>
                    </h3>
                    <Link href={`/${c.slug}`} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-hv-ink">
                      <span className="hv-link-line">Open {c.name}</span>
                      <ArrowUpRight className="h-4 w-4 text-hv-accent transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-hv-muted">{c.short}</p>
                  <ul className="mt-5 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/${c.slug}/${t.id}`}
                          className="group flex items-baseline gap-2 border-b border-hv-line/60 py-2.5"
                        >
                          <span className="text-sm font-medium text-hv-ink/85 transition group-hover:text-hv-accent">
                            {t.title}
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-hv-muted opacity-0 transition group-hover:text-hv-accent group-hover:opacity-100" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
