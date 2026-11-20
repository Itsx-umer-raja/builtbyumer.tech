import type { Metadata } from "next";
import { SITE } from "@/data/site";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteChrome";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of service for ${SITE.name} — the free online tools platform.`,
  alternates: { canonical: "/terms-of-service" },
};

const UPDATED = "November 2026";

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 lg:px-8">
        <h1 className="font-tight text-4xl font-semibold tracking-tight text-cream sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-muted">Last updated: {UPDATED}</p>

        <div className="mt-10 space-y-10 text-base leading-relaxed text-cream/85">
          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">1. Acceptance</h2>
            <p className="mt-3">
              By using {SITE.name} ({SITE.domain}) you agree to these terms. If you do not agree,
              please do not use the site.
            </p>
          </section>

          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">2. The service</h2>
            <p className="mt-3">
              The site provides free browser-based utilities. Tools process your files locally on
              your device; results depend on your browser&apos;s capabilities. Features may change,
              improve or be removed without notice.
            </p>
          </section>

          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">3. Acceptable use</h2>
            <p className="mt-3">
              You agree not to use the site for unlawful processing of content you have no rights
              to, for unauthorised surveillance, for unrestricted third-party network scanning, or
              to attempt to disrupt or overload the site or the public APIs it uses. Automated
              abuse of network lookups may be rate-limited.
            </p>
          </section>

          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">4. No warranty</h2>
            <p className="mt-3">
              The tools are provided &quot;as is&quot; without warranties of any kind. Conversion
              fidelity, compression results and OCR accuracy vary by input. Always keep your own
              originals and verify important output documents.
            </p>
          </section>

          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">5. Limitation of liability</h2>
            <p className="mt-3">
              To the maximum extent permitted by law, {SITE.name} is not liable for any loss of
              data, profits or business arising from use of the site. Because processing is local,
              we never had copies of your files to begin with.
            </p>
          </section>

          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">6. Third-party services</h2>
            <p className="mt-3">
              Network tools use free public endpoints (ipify, ipwho.is, Cloudflare DNS, Google
              DNS, RDAP, Frankfurter) subject to their own terms and quotas. This site is not
              affiliated with those services.
            </p>
          </section>

          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">7. Intellectual property</h2>
            <p className="mt-3">
              The site&apos;s design and code are owned by its author. You retain all rights to
              the files and text you process. Portfolio shelf artwork is supplied design-reference
              material used as clearly labelled placeholder content.
            </p>
          </section>

          <section>
            <h2 className="font-tight text-xl font-semibold text-cream">8. Contact</h2>
            <p className="mt-3">
              Questions about these terms: <a className="text-[#163D2B] hover:underline" href="mailto:hello@builtbyumer.tech">hello@builtbyumer.tech</a>.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
