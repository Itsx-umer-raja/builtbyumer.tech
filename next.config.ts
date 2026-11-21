import type { NextConfig } from "next";

/**
 * Security headers. The CSP allows:
 *  - 'self' for everything local (fonts are self-hosted by next/font)
 *  - blob: workers + wasm for pdf-lib/pdfjs/tesseract client-side processing
 *  - data:/blob: images for tool previews
 *  - the documented free public APIs used by network tools + Tesseract CDN (OCR engine)
 *  - the authoritative RDAP servers rdap.org redirects to (browsers enforce
 *    connect-src on redirect targets, so the redirect hosts must be listed
 *    too — hosts verified against the IANA RDAP bootstrap, data.iana.org/rdap/dns.json)
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://pagead2.googlesyndication.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://motionsites.ai https://pagead2.googlesyndication.com https://www.google.com https://tpc.googlesyndication.com https://d2ol7oe51mr4n9.cloudfront.net",
  "media-src 'self' blob: https://d8j0ntlcm91z4.cloudfront.net https://d2ol7oe51mr4n9.cloudfront.net",
  "font-src 'self' data:",
  "connect-src 'self' blob: https://api.ipify.org https://api64.ipify.org https://ipwho.is https://cloudflare-dns.com https://dns.google https://api.frankfurter.dev https://rdap.org https://rdap.verisign.com https://rdap.publicinterestregistry.org https://rdap.identitydigital.services https://pubapi.registry.google https://rdap.nominet.uk https://rdap.centralnic.com https://rdap.denic.de https://cdn.jsdelivr.net https://raw.githubusercontent.com https://tessdata.projectnaptha.com https://pagead2.googlesyndication.com https://www.googletagservices.com https://d2ol7oe51mr4n9.cloudfront.net https://d8j0ntlcm91z4.cloudfront.net",
  "frame-src 'self' blob: data: https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
  "object-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), display-capture=(self)",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
