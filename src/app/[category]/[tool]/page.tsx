import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Lock, ShieldCheck, Zap } from "lucide-react";
import { CATEGORY_MAP, CATEGORIES } from "@/data/categories";
import { TOOLS, TOOL_MAP, toolsByCategory } from "@/data/tools";
import { SITE } from "@/data/site";
import { ToolRenderer } from "@/components/tools/ToolRenderer";
import { PageShell } from "@/components/home-v2/PageShell";
import { Reveal } from "@/components/home-v2/Reveal";
import { toolFaqs, toolHowTo, toolPrivacy } from "@/lib/toolContent";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ category: t.category, tool: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[category]/[tool]">): Promise<Metadata> {
  const { category, tool } = await params;
  const t = TOOL_MAP[tool];
  if (!t || t.category !== category) return {};
  return {
    title: `${t.title} — Free Online Tool`,
    description: t.description,
    keywords: t.keywords,
    alternates: { canonical: `/${category}/${t.id}` },
    openGraph: {
      title: `${t.title} | ${SITE.name}`,
      description: t.description,
      url: `${SITE.url}/${category}/${t.id}`,
    },
  };
}

export default async function ToolPage({
  params,
}: PageProps<"/[category]/[tool]">) {
  const { category, tool } = await params;
  const cat = CATEGORY_MAP[category];
  const t = TOOL_MAP[tool];
  if (!cat || !t || t.category !== category) notFound();

  const ordered = toolsByCategory(category);
  const idx = ordered.findIndex((x) => x.id === t.id);
  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;
  const siblings = ordered.filter((x) => x.id !== t.id).slice(0, 6);
  const howTo = toolHowTo(t);
  const faqs = toolFaqs(t, cat);

  const titleWords = t.title.split(" ");
  const lastWord = titleWords.length > 1 ? titleWords.pop()! : "";
  const firstWords = titleWords.join(" ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: t.title,
    description: t.description,
    url: `${SITE.url}/${category}/${t.id}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
      { "@type": "ListItem", position: 2, name: cat.name, item: `${SITE.url}/${category}` },
      { "@type": "ListItem", position: 3, name: t.title, item: `${SITE.url}/${category}/${t.id}` },
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Phase 7: .route-145 carries the V8 dark system onto the
          tool pages (see globals.css) — the homepage is untouched. */}
      <div className="route-145 mx-auto w-full max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <Reveal>
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--v8-muted)]">
            <Link href="/" className="transition hover:text-[var(--v8-accent)]">Home</Link>
            <span aria-hidden className="text-[var(--v8-accent)]">/</span>
            <Link href={`/${category}`} className="transition hover:text-[var(--v8-accent)]">{cat.name}</Link>
            <span aria-hidden className="text-[var(--v8-accent)]">/</span>
            <span className="text-[var(--v8-text)]/80">{t.title}</span>
          </nav>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Link
              href={`/${category}`}
              className="rounded-full border border-[var(--v8-accent)]/60 px-3.5 py-1.5 text-xs font-semibold text-[var(--v8-accent)] transition hover:bg-[var(--v8-accent)] hover:text-[var(--v8-bg)]"
            >
              {cat.name}
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--v8-line-strong)] px-3.5 py-1.5 text-xs font-medium text-[var(--v8-muted)]">
              <Zap className="h-3.5 w-3.5 text-[var(--v8-accent)]" aria-hidden /> Free
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--v8-line-strong)] px-3.5 py-1.5 text-xs font-medium text-[var(--v8-muted)]">
              <Lock className="h-3.5 w-3.5 text-[var(--v8-accent)]" aria-hidden /> No upload
            </span>
            <span className="hidden font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--v8-muted)] sm:inline">
              Tool {String(idx + 1).padStart(2, "0")} / {String(ordered.length).padStart(2, "0")} in {cat.name}
            </span>
          </div>

          <h1 className="mt-6 max-w-4xl font-anta text-[clamp(2.4rem,7vw,4.5rem)] uppercase leading-[0.98] tracking-[0.01em] text-[var(--v8-text)]">
            {firstWords}{" "}
            {lastWord ? (
              <span className="text-[var(--v8-accent)]">{lastWord}</span>
            ) : null}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-[var(--v8-muted)] sm:text-lg">
            {t.description}
          </p>
        </Reveal>

        {/* ── Tool workspace: dark V8 glass panel. The shared
             controls inside (FileDrop, buttons, inputs, notes)
             are restyled in the V8 system; per-tool internals
             keep their own light "document" panels where the
             tool's own content lives (see Phase 7 notes). ── */}
        <Reveal className="mt-10">
          <section
            aria-label={`${t.title} workspace`}
            className="v8-glass overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--v8-line)] bg-[var(--v8-bg-2)] px-5 py-3.5 sm:px-8">
              <p className="font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--v8-muted)]">
                <span className="text-[var(--v8-accent)]">●</span> Workspace — runs in your browser
              </p>
              <p className="font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--v8-muted)]">
                Free · Private · Instant
              </p>
            </div>
            <div className="p-5 sm:p-8">
              <ToolRenderer
                toolId={t.id}
                fallback={
                  <p className="text-sm text-[var(--v8-muted)]">This tool is being finalised and will be available shortly.</p>
                }
              />
            </div>
          </section>
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-14">
            <Reveal>
              <section>
                <p className="v8-eyebrow">
                  <span className="v8-dot">●</span> How it works
                </p>
                <h2 className="mt-3 font-anta text-2xl uppercase tracking-[0.01em] text-[var(--v8-text)] sm:text-3xl">
                  How to use <span className="text-[var(--v8-accent)]">{t.title}</span>
                </h2>
                <ol className="mt-6 space-y-5">
                  {howTo.map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--v8-accent)]/60 font-grotesk text-xs font-semibold text-[var(--v8-accent)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="pt-1 text-sm leading-relaxed text-[var(--v8-text)]/85 sm:text-base">{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </Reveal>

            <Reveal>
              <section>
                <p className="v8-eyebrow">
                  <span className="v8-dot">●</span> Questions
                </p>
                <h2 className="mt-3 font-anta text-2xl uppercase tracking-[0.01em] text-[var(--v8-text)] sm:text-3xl">
                  Frequently asked <span className="text-[var(--v8-accent)]">questions</span>
                </h2>
                <div className="mt-6 space-y-3">
                  {faqs.map((f, i) => (
                    <details key={i} className="group rounded-xl border border-[var(--v8-line)] bg-[var(--v8-bg-2)] px-5 py-4">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--v8-text)] marker:hidden">
                        <span className="mr-2 inline-block text-[var(--v8-accent)] transition group-open:rotate-90" aria-hidden>▸</span>
                        {f.q}
                      </summary>
                      <p className="mt-3 pl-6 text-sm leading-relaxed text-[var(--v8-muted)]">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            </Reveal>
          </div>

          <aside className="space-y-8">
            <Reveal>
              <section className="rounded-xl border border-[var(--v8-accent)]/40 bg-[var(--v8-accent)]/[0.07] p-5">
                <h2 className="flex items-center gap-2 font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--v8-accent)]">
                  <ShieldCheck className="h-4 w-4" aria-hidden /> Privacy
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--v8-text)]/80">{toolPrivacy(t)}</p>
              </section>
            </Reveal>

            <Reveal>
              <section>
                <h2 className="v8-eyebrow">
                  <span className="v8-dot">●</span> More in {cat.name}
                </h2>
                <ul className="mt-4 grid gap-2">
                  {siblings.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/${category}/${s.id}`}
                        className="tool-card group flex items-center justify-between gap-3 rounded-lg border border-[var(--v8-line)] bg-[var(--v8-bg-2)] px-4 py-3"
                      >
                        <span className="text-sm font-medium text-[var(--v8-text)]">{s.title}</span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--v8-muted)] transition group-hover:text-[var(--v8-accent)]" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>

            <Reveal>
              <section>
                <h2 className="v8-eyebrow">
                  <span className="v8-dot">●</span> All categories
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {CATEGORIES.filter((c) => c.slug !== category).map((c) => (
                    <Link
                      key={c.slug}
                      href={`/${c.slug}`}
                      className="rounded-full border border-[var(--v8-line-strong)] px-3.5 py-1.5 text-xs font-medium text-[var(--v8-text)]/80 transition hover:border-[var(--v8-accent)] hover:text-[var(--v8-accent)]"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </section>
            </Reveal>
          </aside>
        </div>

        {/* Prev / next tool */}
        <Reveal className="mt-16">
          <nav aria-label="More tools in this category" className="grid gap-3 border-t border-[var(--v8-line)] pt-8 sm:grid-cols-2">
            {prev ? (
              <Link href={`/${category}/${prev.id}`} className="group rounded-xl border border-[var(--v8-line)] bg-[var(--v8-bg-2)] p-5 transition hover:border-[var(--v8-accent)]/60">
                <span className="flex items-center gap-2 font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--v8-muted)]">
                  <ArrowLeft className="h-3.5 w-3.5 text-[var(--v8-accent)]" aria-hidden /> Previous tool
                </span>
                <span className="mt-2 block font-anta text-lg uppercase tracking-[0.01em] text-[var(--v8-text)] group-hover:text-[var(--v8-accent)]">{prev.title}</span>
              </Link>
            ) : (
              <span className="hidden sm:block" aria-hidden />
            )}
            {next ? (
              <Link href={`/${category}/${next.id}`} className="group rounded-xl border border-[var(--v8-line)] bg-[var(--v8-bg-2)] p-5 text-right transition hover:border-[var(--v8-accent)]/60">
                <span className="flex items-center justify-end gap-2 font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--v8-muted)]">
                  Next tool <ArrowRight className="h-3.5 w-3.5 text-[var(--v8-accent)]" aria-hidden />
                </span>
                <span className="mt-2 block font-anta text-lg uppercase tracking-[0.01em] text-[var(--v8-text)] group-hover:text-[var(--v8-accent)]">{next.title}</span>
              </Link>
            ) : (
              <Link href={`/${category}`} className="group rounded-xl border border-[var(--v8-line)] bg-[var(--v8-bg-2)] p-5 text-right transition hover:border-[var(--v8-accent)]/60">
                <span className="flex items-center justify-end gap-2 font-grotesk text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--v8-muted)]">
                  Back to <ArrowRight className="h-3.5 w-3.5 text-[var(--v8-accent)]" aria-hidden />
                </span>
                <span className="mt-2 block font-anta text-lg uppercase tracking-[0.01em] text-[var(--v8-text)] group-hover:text-[var(--v8-accent)]">{cat.name}</span>
              </Link>
            )}
          </nav>
        </Reveal>

        {/* Related tools row */}
        <Reveal className="mt-14">
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-anta text-2xl uppercase tracking-[0.01em] text-[var(--v8-text)] sm:text-3xl">
                Related <span className="text-[var(--v8-accent)]">tools</span>
              </h2>
              <Link href={`/${category}`} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--v8-text)]">
                <span className="v8-link-line">All {cat.name}</span>
                <ArrowUpRight className="h-4 w-4 text-[var(--v8-accent)] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((s) => (
                <Link key={s.id} href={`/${category}/${s.id}`} className="tool-card block rounded-xl border border-[var(--v8-line)] bg-[var(--v8-bg-2)] p-5">
                  <h3 className="font-grotesk text-base font-semibold text-[var(--v8-text)]">{s.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--v8-muted)]">{s.description}</p>
                  <span className="mt-3 inline-block font-grotesk text-[11px] font-semibold uppercase tracking-widest text-[var(--v8-accent)]">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </PageShell>
  );
}
