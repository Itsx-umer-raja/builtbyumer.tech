import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import { PortfolioShelf } from "@/components/portfolio/PortfolioShelf";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteChrome";
import { SITE } from "@/data/site";
import { TOOLS } from "@/data/tools";

const newsreader = Newsreader({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tool Archive — every tool, one tape per shelf",
  description: `A filmography-style archive of BuiltByUmer's ${TOOLS.length} free tools: drag or scroll the shelf of category tapes, open a record to see every tool inside it.`,
  alternates: { canonical: "/portfolio" },
  openGraph: {
    title: `Tool Archive | ${SITE.name}`,
    description:
      "Every BuiltByUmer tool, filed like tapes on a shelf — one tape per category, each record listing its tools.",
    url: `${SITE.url}/portfolio`,
  },
};

/**
 * Portfolio (Stage 2): chrome-only restyle. The Leon Vasari /
 * filmography shelf itself — PortfolioShelf, its 3D tape logic,
 * paper palette and internal masthead — is untouched. It now sits
 * between the dark Home V2 header and footer instead of the old
 * paper footer, so the route reads as part of the same site.
 */
export default function PortfolioPage() {
  return (
    <div className={`${newsreader.variable} home-v2 flex min-h-screen flex-col`}>
      <SiteHeader />
      <main className="flex-1">
        <PortfolioShelf />
      </main>
      <SiteFooter />
    </div>
  );
}
