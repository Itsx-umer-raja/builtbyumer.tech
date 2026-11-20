import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Bug, Mail } from "lucide-react";
import { SITE } from "@/data/site";
import { TOOLS } from "@/data/tools";
import { PageShell } from "@/components/home-v2/PageShell";
import { Reveal } from "@/components/home-v2/Reveal";
import { Magnetic } from "@/components/home-v2/Magnetic";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch about ${SITE.name} — feedback, tool suggestions, bug reports and collaboration enquiries.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PageShell marquee>
      <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
        <Reveal>
          <p className="hv-eyebrow">
            <span className="hv-dot">●</span> Contact — BuiltByUmer
          </p>
          <h1 className="mt-4 max-w-4xl font-grotesk text-[clamp(2.8rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-hv-ink">
            Let&apos;s{" "}
            <em className="font-fraunces font-medium italic text-hv-accent">build.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-hv-muted sm:text-lg">
            Feedback, tool suggestions and bug reports are all welcome — this platform improves
            because people use it and tell me what is missing.
          </p>
        </Reveal>

        <Reveal className="mt-12">
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="mailto:hello@builtbyumer.tech"
              className="tool-card group rounded-xl border border-hv-line bg-hv-surface p-6"
            >
              <p className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-hv-accent">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" aria-hidden /> Email
                </span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </p>
              <p className="mt-4 font-grotesk text-xl font-bold tracking-tight text-hv-ink">
                hello@builtbyumer.tech
              </p>
              <p className="mt-2 text-sm text-hv-muted">Replies within a few days.</p>
            </a>
            <div className="tool-card rounded-xl border border-hv-line bg-hv-surface p-6">
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-hv-accent">
                <Bug className="h-4 w-4" aria-hidden /> Report a bug
              </p>
              <p className="mt-4 font-grotesk text-xl font-bold tracking-tight text-hv-ink">
                What broke, and where?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-hv-muted">
                Include the tool name, your browser, and what you expected vs what happened.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-12">
          <p className="max-w-2xl text-sm leading-relaxed text-hv-muted">
            Note: this site processes files locally in your browser, so there is nothing to recover
            or &quot;unsend&quot; — we never received your documents in the first place.
          </p>
          <div className="mt-8">
            <Magnetic>
              <Link
                href="/tools"
                className="group inline-flex items-center gap-2 rounded-full bg-hv-accent px-7 py-3.5 text-sm font-semibold text-hv-ink transition-colors duration-300 hover:bg-hv-accent-2"
              >
                Browse all {TOOLS.length} tools
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Magnetic>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
