"use client";

import { CountUp } from "./StopChapter";

/**
 * Welcome band — Expedia's dark forest-green Welcome chapter,
 * once, after the map: the journey's promise and the proof
 * numbers, counted up as they scroll into view.
 */
export function WelcomeBand() {
  const stats: Array<{ value: number; suffix: string; label: string }> = [
    { value: 145, suffix: "", label: "Free tools" },
    { value: 181, suffix: "", label: "Pages" },
    { value: 10, suffix: "", label: "Stops on the road" },
    { value: 100, suffix: "%", label: "Free, forever" },
  ];
  return (
    <section
      id="welcome"
      className="relative overflow-hidden bg-[#163d2b] py-16 sm:py-24"
      aria-label="Welcome to Route 145"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="v7-reveal">
          <p className="font-caveat text-4xl text-[#f6c453] sm:text-5xl">
            Welcome
          </p>
          <h2 className="mt-1 max-w-4xl font-antonio text-[clamp(2.6rem,8vw,5.5rem)] font-bold uppercase leading-[0.95] text-[#fdf6e3]">
            The road is open.{" "}
            <span className="text-[#ff4d00]">Drive it free.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#fdf6e3]/75 sm:text-lg">
            Every tool on this road runs entirely in your browser. Your
            files never leave your device, nothing is installed, and
            there is no account to make — the road just works.
          </p>
        </div>

        <div
          className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border-2 border-[#fdf6e3]/20 bg-[#fdf6e3]/20 lg:grid-cols-4"
          data-stagger-group
        >
          {stats.map((s) => (
            <div
              key={s.label}
              data-stagger-item
              className="bg-[#163d2b] px-6 py-8 text-center"
            >
              <p className="font-antonio text-5xl font-bold text-[#fdf6e3] sm:text-6xl">
                <CountUp to={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-2 font-grotesk text-[11px] font-bold uppercase tracking-[0.22em] text-[#fdf6e3]/60">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
