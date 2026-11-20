import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { toolsByCategory, type Tool } from "@/data/tools";
import type { Stop } from "../routeData";

/**
 * Shared shell for one Route 145 world. The header, the top-6
 * tool cards and the footer link are identical across worlds;
 * only the decorative environment (passed in) differs.
 *
 * All factual content — names, descriptions, counts, links —
 * comes from src/data via the Stop + toolsByCategory. The
 * nickname is an editorial design label (see routeData.ts).
 */

function headlineParts(name: string): [string, string] {
  if (name.endsWith(" Tools")) return [name.slice(0, -6), " Tools"];
  return [name, ""];
}

export function WorldShell({
  stop,
  icon: Icon,
  decoration,
}: {
  stop: Stop;
  icon: LucideIcon;
  decoration: ReactNode;
}) {
  const [violet, rest] = headlineParts(stop.name);
  const topTools: Tool[] = toolsByCategory(stop.slug).slice(0, 6);

  return (
    <section
      id={`world-${stop.slug}`}
      aria-label={`${stop.name} — ${stop.nickname}`}
      className="relative overflow-hidden border-t border-[var(--v8-line)] py-20 sm:py-28"
    >
      {/* Decorative environment — atmosphere only, never content. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {decoration}
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section header — same pattern as HubMap / RoadsideStories. */}
        <div className="v8-reveal flex flex-wrap items-end justify-between gap-4 border-b border-[var(--v8-line)] pb-4">
          <div>
            <p className="v8-eyebrow">
              <span className="v8-dot">●</span> Stop{" "}
              {String(stop.index).padStart(2, "0")} — {stop.nickname}
            </p>
            <h2 className="mt-2 font-anta text-4xl leading-none text-[var(--v8-text)] sm:text-6xl">
              <span className="text-[var(--v8-accent)]">{violet}</span>
              {rest}
            </h2>
          </div>
          <p className="max-w-xs font-grotesk text-2xl italic leading-tight text-[var(--v8-muted)]">
            {stop.short}
          </p>
        </div>

        {/* Top 6 tools, in registry order — whole-card links. */}
        <div
          data-stagger-group
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {topTools.map((tool, i) => (
            <article key={tool.id} data-stagger-item className="group relative">
              <Link
                href={`/${stop.slug}/${tool.id}`}
                className="v8-glass-soft flex h-full flex-col rounded-3xl p-6 transition-colors duration-300 hover:border-[var(--v8-accent)]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--v8-line-strong)] text-[var(--v8-highlight)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="font-anta text-sm tracking-wide text-[var(--v8-accent)]">
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {String(stop.count).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 font-grotesk text-xl font-bold leading-tight text-[var(--v8-text)]">
                  {tool.title}
                </h3>
                <p className="mt-2 line-clamp-3 font-grotesk text-sm leading-relaxed text-[var(--v8-muted)]">
                  {tool.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--v8-highlight)]">
                  Open the tool
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </article>
          ))}
        </div>

        {/* Count + the way on to the full category page. */}
        <div className="v8-reveal mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="font-grotesk text-sm text-[var(--v8-muted)]">
            <span className="font-anta text-lg text-[var(--v8-text)]">
              {stop.count}
            </span>{" "}
            free tools in {stop.name} — every one runs in your browser.
          </p>
          <Link
            href={`/${stop.slug}`}
            className="v8-btn-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-colors"
          >
            Explore all {stop.name}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
