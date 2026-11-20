export interface Category {
  slug: string;
  name: string;
  short: string;
  description: string;
  accent: string;
}

export const CATEGORIES: Category[] = [
  {
    slug: "pdf-tools",
    name: "PDF Tools",
    short: "Merge, split, convert and edit PDF files in your browser.",
    description:
      "Work with PDF documents without installing anything. Merge reports, split invoices, rotate scans, extract text and convert images into shareable PDFs — every operation runs locally in your browser, so your documents never leave your device.",
    accent: "#C6F35C",
  },
  {
    slug: "image-tools",
    name: "Image Tools",
    short: "Compress, resize, convert and inspect images of any format.",
    description:
      "Everything you need to prepare images for the web, documents and forms. Compress photos to an exact size, resize and crop, convert between JPG, PNG and WEBP, and inspect what is really inside your files — all processed on your own device.",
    accent: "#A9DD3A",
  },
  {
    slug: "qr-tools",
    name: "QR & Barcode Tools",
    short: "Generate and scan QR codes and barcodes for anything.",
    description:
      "Create QR codes for links, Wi-Fi networks, contacts and payments, then verify them with the built-in scanner. Barcodes for retail and inventory are supported too. Codes are generated locally and scan results are never uploaded anywhere.",
    accent: "#C6F35C",
  },
  {
    slug: "network-tools",
    name: "Network Tools",
    short: "Inspect your IP, DNS records, subnets and domains.",
    description:
      "Understand how your connection and domains are configured. Look up your public IP, resolve DNS records through public resolvers, plan IPv4 subnets and inspect URL structure — using documented free public endpoints.",
    accent: "#1F3FB0",
  },
  {
    slug: "developer-tools",
    name: "Developer Tools",
    short: "Format, encode, hash and test — a daily-driver toolkit.",
    description:
      "The utilities developers reach for every day: format and minify JSON, XML, HTML, CSS and JavaScript, encode and decode Base64 and URLs, generate UUIDs and strong passwords, hash with SHA-2, test regular expressions and decode JWTs.",
    accent: "#C6F35C",
  },
  {
    slug: "text-tools",
    name: "Text Tools",
    short: "Count, clean, convert and compare text instantly.",
    description:
      "Fast, private text processing for writers, students and developers. Count words and characters, convert between naming cases, remove duplicates and extra spaces, sort lines, generate placeholder copy and diff two texts side by side.",
    accent: "#A9DD3A",
  },
  {
    slug: "calculators",
    name: "Calculators",
    short: "Percentages, loans, dates, grades and unit conversions.",
    description:
      "Practical calculators for school, work and money decisions. Work out percentages, ages and date differences, plan loans and interest, convert units, currencies and time zones — with the formulas explained in plain language.",
    accent: "#C6F35C",
  },
  {
    slug: "data-tools",
    name: "Data Tools",
    short: "Convert between CSV, JSON, XML and Excel files.",
    description:
      "Move tabular data between the formats different tools demand. Convert CSV to JSON and back, turn spreadsheets into CSV, and transform XML to JSON — parsed entirely in your browser, so business data stays on your machine.",
    accent: "#1F3FB0",
  },
  {
    slug: "business-tools",
    name: "Business Tools",
    short: "Invoices, quotations, receipts and business cards.",
    description:
      "Create clean business documents in minutes. Generate professional invoices, quotations and receipts with your own branding, and design simple business cards — exported as PDFs you can send straight to clients.",
    accent: "#C6F35C",
  },
  {
    slug: "productivity-tools",
    name: "Productivity Tools",
    short: "Timers, calendars and randomness for everyday work.",
    description:
      "Small utilities that make the day run smoother: a Pomodoro timer for focused work, a precise stopwatch, countdown timers, printable calendars and fair random pickers for draws and decisions.",
    accent: "#A9DD3A",
  },
];

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);
