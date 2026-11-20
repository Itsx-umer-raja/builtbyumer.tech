import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Anta, Antonio, Caveat, Manrope, Inter_Tight, JetBrains_Mono, Instrument_Serif, Fraunces, Space_Grotesk, Geist } from "next/font/google";
import { SITE } from "@/data/site";
import StyledJsxRegistry from "@/components/StyledJsxRegistry";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

/* Home V4 design system — Anta, the futuristic rounded display
   font of the Synthora hero. Falls back to Space Grotesk. */
const anta = Anta({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anta",
  display: "swap",
});

const antonio = Antonio({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-antonio",
  display: "swap",
});

/* Home V7 design system — loose script voice for Route 145
   nicknames and labels (Expedia's script + condensed pairing). */
const caveat = Caveat({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const manrope = Manrope({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const interTight = Inter_Tight({
  weight: ["300", "400", "500", "600", "800"],
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

/* Home V2 design system — editorial display serif + grotesque sans */
const fraunces = Fraunces({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

const ADSENSE_CLIENT = "ca-pub-4227183622564894";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: "Umer Raja", url: SITE.url }],
  creator: "Umer Raja",
  keywords: [
    "free online tools",
    "pdf tools",
    "image compressor",
    "qr code generator",
    "developer tools",
    "online calculators",
    "browser tools",
    "builtbyumer",
  ],
  other: {
    "google-adsense-account": ADSENSE_CLIENT,
    copyright: "© 2026 Umer Raja — BuiltByUmer. All rights reserved.",
  },
  openGraph: {
    siteName: SITE.name,
    type: "website",
    url: SITE.url,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fdf6e3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", anta.variable, antonio.variable, caveat.variable, manrope.variable, interTight.variable, instrumentSerif.variable, jetbrains.variable, fraunces.variable, spaceGrotesk.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <StyledJsxRegistry>
          {/* marks JS as available before the first paint — reveal styles only hide content under this class */}
          <script
            dangerouslySetInnerHTML={{
              __html: "document.documentElement.classList.add('js-anim')",
            }}
          />
          {/* rights notice + devtools deterrent — text stays selectable and
              copyable; this only discourages casual source viewing */}
          <script
            dangerouslySetInnerHTML={{
              __html:
                "(function(){console.log('%c© 2026 Umer Raja · BuiltByUmer — All rights reserved. builtbyumer.tech','color:#163D2B;font-size:12px;font-weight:bold');document.addEventListener('keydown',function(e){var k=(e.key||'').toLowerCase();if(k==='f12'){e.preventDefault();return}if((e.ctrlKey||e.metaKey)&&e.shiftKey&&(k==='i'||k==='j'||k==='c')){e.preventDefault();return}if((e.ctrlKey||e.metaKey)&&k==='u'){e.preventDefault()}})})()",
            }}
          />
          {children}
        </StyledJsxRegistry>
        {/* Google AdSense — account-level script (ads.txt is served at /ads.txt) */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
