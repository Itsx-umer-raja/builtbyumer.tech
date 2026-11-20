import type { ReactNode } from "react";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteChrome";
import { Marquee } from "./Marquee";

/**
 * Dark Home V2 shell for every non-homepage route (Stage 2).
 * Static (non-sticky) header — the global mobile CSS forces
 * overflow-x hidden, which breaks position:sticky, so no sticky
 * or pinned sections are used on inner pages.
 */
export function PageShell({
  children,
  marquee = false,
}: {
  children: ReactNode;
  marquee?: boolean;
}) {
  return (
    <div className="home-v2 relative flex min-h-screen flex-col overflow-x-clip">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      {marquee && <Marquee />}
      <SiteFooter />
    </div>
  );
}
