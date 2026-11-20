"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { STORIES, type Story } from "./routeData";

/**
 * Roadside stories — the ten most-used tools, rebuilt as Expedia's
 * story carousel: numbered cumulatively across the whole route
 * (TOOL 001–010, in registry order), on a wavy vermillion
 * hand-drawn line with circular nodes. Each card carries a
 * one-line hook and an OPEN THE TOOL pill.
 *
 * Sponsored slot: position 001 is the featured slot. With no
 * sponsor configured it renders the regular popular tool
 * (Merge PDF) with no sponsor label — the sponsor path exists
 * in code and is only used when a real sponsor is configured.
 * Never a fake brand.
 */

export interface Sponsor {
  name: string;
  blurb: string;
  href: string;
}

// No sponsor configured yet — set this to a real sponsor to use
// the featured slot. Until then the slot shows a regular tool.
const SPONSOR: Sponsor | null = null;

function StoryCard({ story }: { story: Story }) {
  return (
    <Link
      href={`/${story.tool.category}/${story.tool.id}`}
      data-stagger-item
      className="group flex flex-col rounded-3xl border-2 border-[#2a2118] bg-white p-5 shadow-[0_10px_30px_rgba(42,33,24,0.08)] transition-all duration-200 hover:-translate-y-1 hover:border-[#ff4d00] hover:shadow-[0_18px_40px_rgba(255,77,0,0.18)]"
    >
      <span className="flex items-center justify-between">
        <span className="font-antonio text-2xl font-bold text-[#ff4d00]">
          TOOL {story.num}
        </span>
        <span className="rounded-full bg-[#2a2118]/5 px-2.5 py-1 font-grotesk text-[10px] font-bold uppercase tracking-[0.14em] text-[#2a2118]/60">
          Stop {String(story.stop.index).padStart(2, "0")}
        </span>
      </span>
      <span className="mt-3 font-grotesk text-lg font-bold leading-tight text-[#2a2118]">
        {story.tool.title}
      </span>
      <span className="mt-2 flex-1 font-caveat text-2xl leading-tight text-[#2a2118]/70">
        {story.hook}
      </span>
      <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#2a2118] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors group-hover:bg-[#ff4d00]">
        Open the tool
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function SponsoredCard({ story }: { story: Story }) {
  if (!SPONSOR) return <StoryCard story={story} />;
  return (
    <a
      href={SPONSOR.href}
      data-stagger-item
      className="group flex flex-col rounded-3xl border-2 border-dashed border-[#ff4d00] bg-[#fff7ed] p-5 shadow-[0_10px_30px_rgba(42,33,24,0.08)] transition-all duration-200 hover:-translate-y-1"
    >
      <span className="flex items-center justify-between">
        <span className="rounded-full bg-[#ff4d00] px-2.5 py-1 font-grotesk text-[10px] font-bold uppercase tracking-[0.14em] text-white">
          Sponsored
        </span>
        <span className="font-antonio text-2xl font-bold text-[#ff4d00]">
          TOOL {story.num}
        </span>
      </span>
      <span className="mt-3 font-grotesk text-lg font-bold leading-tight text-[#2a2118]">
        {SPONSOR.name}
      </span>
      <span className="mt-2 flex-1 font-caveat text-2xl leading-tight text-[#2a2118]/70">
        {SPONSOR.blurb}
      </span>
      <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#ff4d00] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white">
        Visit sponsor
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}

export function RoadsideStories() {
  return (
    <section
      id="stories"
      className="v7-topo-bg relative overflow-hidden bg-[#fdf6e3] py-16 sm:py-24"
      aria-label="Roadside stories — the most-used tools"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="v7-reveal">
          <p className="v7-eyebrow">Must-see — along the way</p>
          <p className="mt-3 font-caveat text-4xl text-[#ff4d00] sm:text-5xl">
            Pull over for these
          </p>
          <h2 className="mt-1 font-antonio text-[clamp(2.6rem,8vw,5.5rem)] font-bold uppercase leading-[0.95] text-[#2a2118]">
            Roadside stories
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#2a2118]/70 sm:text-lg">
            The ten tools travellers open most — numbered in the order
            they appear on the road, from TOOL 001 to TOOL 010.
          </p>
        </div>

        {/* Wavy hand-drawn route line with circular nodes */}
        <div className="relative mt-10 hidden h-16 sm:block" aria-hidden>
          <svg
            viewBox="0 0 1200 64"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <path
              d="M0 32 C 150 8, 300 56, 450 32 S 750 8, 900 32 S 1120 56, 1200 32"
              fill="none"
              stroke="#ff4d00"
              strokeWidth="3"
              strokeDasharray="1 10"
              strokeLinecap="round"
            />
          </svg>
          {STORIES.map((story, i) => (
            <span
              key={story.tool.id}
              className="absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#2a2118] bg-[#fdf6e3] font-antonio text-xs font-bold text-[#ff4d00]"
              style={{ left: `${((i + 0.5) / STORIES.length) * 100}%` }}
            >
              {story.num}
            </span>
          ))}
        </div>

        <div
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
          data-stagger-group
        >
          {STORIES.map((story, i) =>
            i === 0 ? (
              <SponsoredCard key={story.tool.id} story={story} />
            ) : (
              <StoryCard key={story.tool.id} story={story} />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
