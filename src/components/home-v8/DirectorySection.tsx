import { DirectoryBrowser } from "./directory/DirectoryBrowser";

/**
 * Phase 6 — the Final Destination. The complete directory:
 * all 145 tools in crawlable HTML, with live search, category
 * filter, the most-used row and recently-opened tools.
 * Default export, no props; the coordinator mounts this at the
 * PHASE 6 SLOT in HomeV8.tsx. Root carries id="directory".
 */
export default function DirectorySection() {
  return (
    <section
      id="directory"
      className="relative py-20 sm:py-28"
      aria-label="The directory — every tool"
    >
      <div className="v8-topo-bg absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="v8-reveal flex flex-wrap items-end justify-between gap-4 border-b border-[var(--v8-line)] pb-4">
          <div>
            <p className="v8-eyebrow">
              <span className="v8-dot">●</span> Stop 11 — The Final Destination
            </p>
            <h2 className="mt-2 font-anta text-4xl leading-none text-[var(--v8-text)] sm:text-6xl">
              Every tool.{" "}
              <span className="text-[var(--v8-accent)]">One destination.</span>
            </h2>
          </div>
          <p className="max-w-xs font-grotesk text-2xl italic leading-tight text-[var(--v8-muted)]">
            The whole universe, in one index — search it, filter it, open anything.
          </p>
        </div>

        <div className="mt-10">
          <DirectoryBrowser animate searchId="directory-search" />
        </div>
      </div>
    </section>
  );
}
