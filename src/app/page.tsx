import type { Metadata } from "next";
import HomeV7 from "@/components/home-v7/HomeV7";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "BuiltByUmer — Every tool. One destination.",
  description:
    "145 free browser-based tools: convert documents, compress images, create QR codes and simplify everyday digital work — no accounts, no uploads.",
  keywords: [
    "free online tools",
    "pdf tools",
    "image compressor",
    "qr code generator",
    "json formatter",
    "developer tools",
    "browser tools",
    "no upload tools",
    "builtbyumer",
  ],
  alternates: { canonical: "/" },
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  publisher: {
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE.url}/tools?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <HomeV7 />
    </>
  );
}
