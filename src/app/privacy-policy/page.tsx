import type { Metadata } from "next";
import { SITE } from "@/data/site";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteChrome";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${SITE.name}: how the free online tools handle your files, data and lookups.`,
  alternates: { canonical: "/privacy-policy" },
};

const UPDATED = "November 2026";

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 lg:px-8">
        <h1 className="font-tight text-4xl font-semibold tracking-tight text-cream sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted">Last updated: {UPDATED}</p>

        <div className="mt-10 space-y-10 text-base leading-relaxed text-cream/85">
          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">The short version</h2>
            <p className="mt-3">
              {SITE.name} processes your files locally in your browser. Your documents, images and
              text are never uploaded to us, never stored by us and never seen by us. There is
              nothing to leak because nothing is collected.
            </p>
          </section>

          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">File processing</h2>
            <p className="mt-3">
              PDF, image, QR, developer, text, data and business tools run entirely on your device
              using browser APIs and client-side libraries. Closing the tab discards everything.
              Downloads are generated on your device as temporary object URLs that are revoked
              after use.
            </p>
          </section>

          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">Network lookups</h2>
            <p className="mt-3">
              The Network Tools category needs to talk to the internet to answer your question. We
              use documented free public endpoints: ipify (your public IP), ipwho.is (IP details),
              Cloudflare DNS and Google DNS (record lookups), RDAP (domain registration data) and
              Frankfurter (European Central Bank reference rates). Only the IP address, domain or
              currency you explicitly type is sent to those services, under their own privacy
              terms. We do not log your queries.
            </p>
          </section>

          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">OCR</h2>
            <p className="mt-3">
              The Image OCR tool uses Tesseract.js, which loads its recognition engine from a
              public content delivery network on first use. The recognition itself runs on your
              device — the image is never sent to any server.
            </p>
          </section>

          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">Analytics and advertising</h2>
            <p className="mt-3">
              Any analytics or advertising integration (for example Google Analytics or AdSense)
              will be disclosed here before it is activated, configured without collecting document
              contents, and respectful of applicable consent requirements. Advertising slots remain
              empty until an ad service is approved.
            </p>
          </section>

          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">Children</h2>
            <p className="mt-3">
              The site is a general-audience utility and does not knowingly collect personal
              information from anyone, including children under 13.
            </p>
          </section>

          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">Contact</h2>
            <p className="mt-3">
              Questions about this policy: <a className="text-[#163D2B] hover:underline" href="mailto:hello@builtbyumer.tech">hello@builtbyumer.tech</a>.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
