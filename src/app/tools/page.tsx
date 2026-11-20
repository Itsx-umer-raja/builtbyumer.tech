import type { Metadata } from "next";
import { CATEGORIES } from "@/data/categories";
import { TOOLS } from "@/data/tools";
import { SITE } from "@/data/site";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { DirectoryBrowser } from "@/components/home-v8/directory/DirectoryBrowser";

export const metadata: Metadata = {
  title: "All Tools — Free Online Utilities",
  description: `Search every free tool on ${SITE.name}: PDF conversion, image compression, QR codes, developer utilities, calculators and more. No account, no uploads.`,
  alternates: { canonical: "/tools" },
};

/**
 * The standalone directory page, redesigned in the V8 dark
 * system. Same search, filters and cards as the homepage
 * DirectorySection (shared DirectoryBrowser); routes, data
 * and links are unchanged — only the presentation. Server
 * component: the interactive directory is client-side, and
 * no GSAP runs on this route, so DirectoryBrowser renders
 * without reveal classes here.
 */
export default function ToolsPage() {
  return (
    <div className="home-v8 relative flex min-h-screen flex-col overflow-x-clip">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
          <p className="v8-eyebrow">
            <span className="v8-dot">●</span> The index — {TOOLS.length} tools · {CATEGORIES.length} categories
          </p>
          <h1 className="mt-4 max-w-4xl font-anta text-[clamp(2.6rem,8vw,5rem)] leading-[0.95] text-[var(--v8-text)]">
            Every tool.
            <br />
            <span className="text-[var(--v8-accent)]">One destination.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--v8-muted)] sm:text-lg">
            {TOOLS.length} free utilities that run entirely in your browser — convert files, generate
            codes, calculate anything and clean up text without uploading a single byte.
          </p>

          <div className="mt-12">
            <DirectoryBrowser searchId="tools-search" />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
