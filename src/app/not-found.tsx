import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteChrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-5 py-24 text-center">
        <p className="font-mono text-sm text-[#163D2B]">404</p>
        <h1 className="mt-4 font-tight text-4xl font-semibold tracking-tight text-cream">
          This page took the wrong exit
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
          The page you are looking for does not exist — but {""}
          every tool that does is one click away.
        </p>
        <Link
          href="/tools"
          className="mt-8 rounded-full bg-lime px-6 py-3 text-sm font-semibold text-[#163D2B] transition hover:bg-lime-2"
        >
          Browse all tools
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
