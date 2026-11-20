import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_MAP, CATEGORIES } from "@/data/categories";
import { toolsByCategory } from "@/data/tools";
import { SITE } from "@/data/site";
import { PageShell } from "@/components/home-v2/PageShell";
import { Reveal } from "@/components/home-v2/Reveal";
import { CategoryToolRows } from "@/components/home-v2/CategoryToolRows";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[category]">): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORY_MAP[category];
  if (!cat) return {};
  return {
    title: `${cat.name} — Free Online Tools`,
    description: cat.description,
    alternates: { canonical: `/${category}` },
    openGraph: {
      title: `${cat.name} | ${SITE.name}`,
      description: cat.description,
      url: `${SITE.url}/${category}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: PageProps<"/[category]">) {
  const { category } = await params;
  const cat = CATEGORY_MAP[category];
  if (!cat) notFound();
  const tools = toolsByCategory(category);
  const index = CATEGORIES.findIndex((c) => c.slug === category);
  const words = cat.name.split(" ");
  const lastWord = words.length > 1 ? words.pop()! : "";
  const firstWords = words.join(" ");

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: cat.name,
    numberOfItems: tools.length,
    itemListElement: tools.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.title,
      url: `${SITE.url}/${category}/${t.id}`,
    })),
  };

  return (
    <PageShell marquee>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
        <Reveal>
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-hv-muted">
            <Link href="/" className="transition hover:text-hv-accent">Home</Link>
            <span aria-hidden className="text-hv-accent">/</span>
            <Link href="/tools" className="transition hover:text-hv-accent">All Tools</Link>
            <span aria-hidden className="text-hv-accent">/</span>
            <span className="text-hv-ink/80">{cat.name}</span>
          </nav>

          <p className="hv-eyebrow mt-10">
            <span className="hv-dot">●</span> Category {String(index + 1).padStart(2, "0")} / {String(CATEGORIES.length).padStart(2, "0")}
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <h1 className="max-w-3xl font-grotesk text-[clamp(2.8rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-hv-ink">
              {firstWords}{" "}
              {lastWord && (
                <em className="font-fraunces font-medium italic text-hv-accent">{lastWord}</em>
              )}
            </h1>
            <p className="shrink-0 font-grotesk text-5xl font-bold tabular-nums text-hv-ink sm:text-6xl">
              {tools.length}
              <span className="text-2xl text-hv-accent"> tools</span>
            </p>
          </div>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-hv-muted sm:text-lg">
            {cat.description}
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-hv-muted">
            Free · No account · Runs in your browser
          </p>
        </Reveal>

        <Reveal className="mt-14">
          <CategoryToolRows tools={tools} category={category} />
        </Reveal>

        <Reveal className="mt-16">
          <h2 className="hv-eyebrow">
            <span className="hv-dot">●</span> Other categories
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.slug !== category).map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="group inline-flex items-center gap-1.5 rounded-full border border-hv-line-strong px-4 py-2 text-sm font-medium text-hv-ink/85 transition hover:border-hv-accent hover:text-hv-accent"
              >
                {c.name}
                <ArrowUpRight className="h-3.5 w-3.5 text-hv-accent transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
