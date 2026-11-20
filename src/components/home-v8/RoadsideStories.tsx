"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { STORIES } from "./routeData";

/**
 * Roadside Stories — the ten most-used tools as numbered
 * stories (TOOL 001–010, in registry order) on the route.
 * Each is a real tool card linking to its real page, with its
 * editorial one-line hook. This is the shell's popular-tools
 * strip; the Phase 5 worlds and Phase 6 directory must NOT
 * re-add a second popular strip (see CONTRACT.md).
 */
export function RoadsideStories() {
  return (
    <section
      id="stories"
      className="relative py-20 sm:py-28"
      aria-label="Roadside stories — the most-used tools"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--v8-line)] pb-4">
          <div>
            <p className="v8-eyebrow">Must-see · Along the road</p>
            <h2 className="mt-2 font-anta text-4xl leading-none text-[var(--v8-text)] sm:text-6xl">
              Roadside{" "}
              <span className="text-[var(--v8-accent)]">stories.</span>
            </h2>
          </div>
          <p className="max-w-xs font-grotesk text-2xl italic leading-tight text-[var(--v8-muted)]">
            The ten tools travellers stop for most.
          </p>
        </div>

        <div data-stagger-group className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STORIES.map((story) => (
            <article
              key={story.tool.id}
              data-stagger-item
              className="group relative"
            >
              <Link
                href={`/${story.tool.category}/${story.tool.id}`}
                className="v8-glass-soft flex h-full flex-col rounded-3xl p-6 transition-colors duration-300 hover:border-[var(--v8-accent)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-anta text-sm tracking-wide text-[var(--v8-accent)]">
                    TOOL {story.num}
                  </span>
                  <span className="font-grotesk text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--v8-muted)]">
                    {story.stop.name}
                  </span>
                </div>
                <h3 className="mt-4 font-grotesk text-xl font-bold leading-tight text-[var(--v8-text)]">
                  {story.tool.title}
                </h3>
                <p className="mt-2 font-grotesk text-lg italic leading-snug text-[var(--v8-muted)]">
                  {story.hook}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--v8-highlight)]">
                  Open the tool
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </article>
          ))}

          {/* The strip ends with the way on: all 145 tools. */}
          <article data-stagger-item className="group relative">
            <Link
              href="/tools"
              className="flex h-full flex-col justify-between rounded-3xl bg-[var(--v8-accent)] p-6 transition-colors duration-300 hover:bg-[var(--v8-highlight)]"
            >
              <span className="font-anta text-sm tracking-wide text-[var(--v8-bg)]/70">
                TOOL 011 — 145
              </span>
              <h3 className="mt-4 font-anta text-3xl leading-none text-[var(--v8-bg)]">
                …and 135 more
                <br />
                down the road.
              </h3>
              <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--v8-bg)]">
                Browse all 145 tools
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
