import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Calculator,
  Code,
  Database,
  FileText,
  Globe,
  Image,
  QrCode,
  Timer,
  Type,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_MAP } from "@/data/categories";
import type { Tool } from "@/data/tools";

/**
 * One directory tool card — whole-card link to the real tool
 * page. Category icons are a presentation choice (one lucide
 * icon per real category); every name, description, category
 * label and href comes from src/data.
 *
 * Hover tilt is transform-only and gated behind
 * `motion-safe:` so reduced-motion users get a plain card.
 */

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "pdf-tools": FileText,
  "image-tools": Image,
  "qr-tools": QrCode,
  "network-tools": Globe,
  "developer-tools": Code,
  "text-tools": Type,
  calculators: Calculator,
  "data-tools": Database,
  "business-tools": Briefcase,
  "productivity-tools": Timer,
};

export function ToolCard({
  tool,
  onOpen,
}: {
  tool: Tool;
  onOpen?: (toolId: string) => void;
}) {
  const Icon = CATEGORY_ICONS[tool.category] ?? FileText;
  const category = CATEGORY_MAP[tool.category];
  return (
    <Link
      href={`/${tool.category}/${tool.id}`}
      onClick={() => onOpen?.(tool.id)}
      className="v8-glass-soft group flex h-full flex-col rounded-3xl p-5 transition-colors duration-300 hover:border-[var(--v8-accent)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:[transform:perspective(900px)_rotateX(2.5deg)_rotateY(-2.5deg)]"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--v8-line-strong)] bg-white/[0.04] text-[var(--v8-highlight)] transition-colors duration-300 group-hover:border-[var(--v8-accent)] group-hover:text-[var(--v8-accent)]">
          <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        </span>
        <ArrowUpRight
          className="h-5 w-5 shrink-0 text-[var(--v8-muted)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--v8-accent)]"
          aria-hidden
        />
      </span>
      <span className="mt-4 block text-base font-semibold leading-snug text-[var(--v8-text)]">
        {tool.title}
      </span>
      <span className="mt-1.5 block line-clamp-2 text-sm leading-relaxed text-[var(--v8-muted)]">
        {tool.description}
      </span>
      <span className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--v8-muted)]">
          {category?.name ?? tool.category}
        </span>
        <span className="text-xs font-semibold text-[var(--v8-accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          Open tool
        </span>
      </span>
    </Link>
  );
}
