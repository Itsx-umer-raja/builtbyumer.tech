"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CheckeredFlag } from "./Topo";
import { STOPS, type Stop } from "./routeData";

/** Animated count-up, once, when the number scrolls into view. */
export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / 900);
          setValue(Math.round((1 - Math.pow(1 - p, 3)) * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

/**
 * One stop on Route 145 — the chapter template, kept tight and
 * identical for all ten stops (Expedia's chapter discipline):
 * (a) hero line — script nickname over the giant condensed
 * category name + tool-count counting up; (b) route rail — the
 * stop's top tools as "towns" along a vertical itinerary rail,
 * checkered flag at both ends; (c) the top three tools as
 * whole-card links.
 */
export function StopChapter({
  stop,
  next,
  onStamp,
}: {
  stop: Stop;
  next: Stop | null;
  onStamp: (slug: string) => void;
}) {
  return (
    <section
      id={`stop-${stop.slug}`}
      data-stop={stop.slug}
      className="v7-topo-bg relative overflow-hidden bg-[#fdf6e3] py-16 sm:py-24"
      aria-label={`Stop ${stop.index}: ${stop.name}`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* ── (a) Stop hero line ── */}
        <div className="v7-reveal border-t-2 border-[#2a2118] pt-6">
          <p className="v7-eyebrow">
            Stop {String(stop.index).padStart(2, "0")} —{" "}
            <CountUp to={stop.count} /> tools
          </p>
          <p className="mt-3 font-caveat text-4xl text-[#ff4d00] sm:text-5xl">
            {stop.nickname}
          </p>
          <h2 className="mt-1 font-antonio text-[clamp(2.6rem,8vw,5.5rem)] font-bold uppercase leading-[0.95] text-[#2a2118]">
            {stop.name}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#2a2118]/70 sm:text-lg">
            {stop.short}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link
              href={`/${stop.slug}`}
              onClick={() => onStamp(stop.slug)}
              className="group inline-flex items-center gap-2 rounded-full bg-[#2a2118] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#ff4d00]"
            >
              Open the category
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <span className="font-grotesk text-xs font-bold uppercase tracking-[0.18em] text-[#2a2118]/50">
              <CountUp to={stop.count} /> tools · free forever
            </span>
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          {/* ── (b) Route rail — top tools as towns ── */}
          <div className="v7-reveal lg:col-span-5">
            <p className="v7-eyebrow mb-5">The itinerary — towns on this stop</p>
            <ol className="relative ml-3 border-l-[3px] border-dotted border-[#ff4d00] pl-8">
              <li className="absolute -left-[19px] -top-1">
                <CheckeredFlag width={30} />
              </li>
              {stop.topTools.map((tool, i) => (
                <li key={tool.id} className="group relative py-3 first:pt-6">
                  <span className="absolute -left-[43px] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-[#2a2118] bg-[#fdf6e3] transition-colors group-hover:border-[#ff4d00] group-hover:bg-[#ff4d00]" />
                  <Link href={`/${tool.category}/${tool.id}`} className="block">
                    <span className="flex items-baseline gap-3">
                      <span className="font-grotesk text-xs font-bold text-[#ff4d00]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-grotesk text-lg font-bold text-[#2a2118] transition-colors group-hover:text-[#ff4d00]">
                        {tool.title}
                      </span>
                    </span>
                    <span className="mt-0.5 block pl-8 text-sm leading-snug text-[#2a2118]/60">
                      {tool.description}
                    </span>
                  </Link>
                </li>
              ))}
              <li className="absolute -bottom-1 -left-[19px]">
                <CheckeredFlag width={30} />
              </li>
            </ol>
            <p className="mt-8 pl-8 font-caveat text-2xl text-[#2a2118]/60">
              End of {stop.nickname} — {stop.count} tools in all.
            </p>
          </div>

          {/* ── (c) Top three tools as cards ── */}
          <div className="lg:col-span-7" data-stagger-group>
            <p className="v7-eyebrow mb-5">Most visited in {stop.name}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {stop.topTools.slice(0, 3).map((tool, i) => (
                <Link
                  key={tool.id}
                  href={`/${tool.category}/${tool.id}`}
                  data-stagger-item
                  className="group flex flex-col rounded-3xl border-2 border-[#2a2118] bg-white p-5 shadow-[0_10px_30px_rgba(42,33,24,0.08)] transition-all duration-200 hover:-translate-y-1 hover:border-[#ff4d00] hover:shadow-[0_18px_40px_rgba(255,77,0,0.18)]"
                >
                  <span className="font-antonio text-3xl font-bold text-[#ff4d00]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-3 font-grotesk text-lg font-bold leading-tight text-[#2a2118]">
                    {tool.title}
                  </span>
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-[#2a2118]/65">
                    {tool.description}
                  </span>
                  <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#2a2118] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors group-hover:bg-[#ff4d00]">
                    Open the tool
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#2a2118]/60">
              {stop.description}
            </p>
          </div>
        </div>

        {/* Next stop */}
        {next && (
          <div className="mt-12 flex justify-end border-t border-[#2a2118]/15 pt-5">
            <a
              href={`#stop-${next.slug}`}
              className="group flex items-center gap-2 font-grotesk text-xs font-bold uppercase tracking-[0.18em] text-[#2a2118]/60 transition-colors hover:text-[#ff4d00]"
            >
              Next stop — {next.nickname}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
