import {
  Briefcase,
  Calculator,
  Code2,
  Database,
  FileText,
  Image,
  Network,
  QrCode,
  Type,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { STOPS, type Stop } from "./routeData";
import { WorldShell } from "./worlds/WorldShell";
import {
  BusinessDecor,
  CalcDecor,
  DataDecor,
  DevDecor,
  ImageDecor,
  NetworkDecor,
  PdfDecor,
  ProductivityDecor,
  QrDecor,
  TextDecor,
} from "./worlds/decorations";

/**
 * Phase 5 — the ten category worlds. Default export, no props,
 * reads src/data directly (via routeData.ts STOPS, built from
 * src/data/categories.ts + src/data/tools.ts).
 *
 * Root carries id="worlds" (the sticky bar + current-stop
 * observer track it). One world per real category, in
 * src/data/categories.ts order. No popular-tools strip here —
 * RoadsideStories.tsx owns it.
 *
 * Environments are CSS/SVG decoration only (see
 * ./worlds/decorations.tsx). All tool names, descriptions,
 * counts and links stay in plain crawlable HTML in WorldShell.
 * Entrance reveals use the shell's .v8-reveal /
 * [data-stagger-group] classes — GSAP in HomeV8 animates them.
 */

const WORLD_STYLE: Record<
  string,
  { icon: LucideIcon; decor: () => React.JSX.Element }
> = {
  "pdf-tools": { icon: FileText, decor: PdfDecor },
  "image-tools": { icon: Image, decor: ImageDecor },
  "qr-tools": { icon: QrCode, decor: QrDecor },
  "network-tools": { icon: Network, decor: NetworkDecor },
  "developer-tools": { icon: Code2, decor: DevDecor },
  "text-tools": { icon: Type, decor: TextDecor },
  calculators: { icon: Calculator, decor: CalcDecor },
  "data-tools": { icon: Database, decor: DataDecor },
  "business-tools": { icon: Briefcase, decor: BusinessDecor },
  "productivity-tools": { icon: Zap, decor: ProductivityDecor },
};

/**
 * Decoration-only motion. Scoped to this section (wv8-* prefix),
 * transform/opacity only, and fully disabled under
 * prefers-reduced-motion. Defined here because globals.css is
 * outside this phase's file scope.
 */
const WORLDS_CSS = `
@keyframes wv8-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
@keyframes wv8-blink {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 1; }
}
@keyframes wv8-dash {
  to { stroke-dashoffset: -24; }
}
@keyframes wv8-scan {
  0% { transform: translateY(0); opacity: 0; }
  12% { opacity: 1; }
  88% { opacity: 1; }
  100% { transform: translateY(124px); opacity: 0; }
}
@keyframes wv8-speed {
  0% { transform: translateX(-5rem); opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { transform: translateX(38vw); opacity: 0; }
}
.wv8-float { animation: wv8-float 8s ease-in-out infinite; }
.wv8-blink { animation: wv8-blink 2.6s ease-in-out infinite; }
.wv8-dash { animation: wv8-dash 1.6s linear infinite; }
.wv8-scan { animation: wv8-scan 5s ease-in-out infinite; }
.wv8-speed { animation: wv8-speed 2.8s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .wv8-anim { animation: none !important; }
}
`;

export default function WorldsSection() {
  return (
    <div id="worlds" className="relative">
      <style>{WORLDS_CSS}</style>

      {/* Section intro — the worlds begin after the hub map. */}
      <div className="mx-auto max-w-7xl px-5 pb-4 pt-20 sm:px-8 sm:pt-28">
        <div className="v8-reveal flex flex-wrap items-end justify-between gap-4 border-b border-[var(--v8-line)] pb-4">
          <div>
            <p className="v8-eyebrow">
              <span className="v8-dot">●</span> The worlds — stops 01–10
            </p>
            <h2 className="mt-2 font-anta text-4xl leading-none text-[var(--v8-text)] sm:text-6xl">
              Ten <span className="text-[var(--v8-accent)]">worlds.</span>
              <br />
              One road.
            </h2>
          </div>
          <p className="max-w-xs font-grotesk text-2xl italic leading-tight text-[var(--v8-muted)]">
            Each stop is its own place. Step inside and use the tools.
          </p>
        </div>
      </div>

      {STOPS.map((stop: Stop) => {
        const world = WORLD_STYLE[stop.slug];
        if (!world) return null;
        const Decor = world.decor;
        return (
          <WorldShell
            key={stop.slug}
            stop={stop}
            icon={world.icon}
            decoration={<Decor />}
          />
        );
      })}
    </div>
  );
}
