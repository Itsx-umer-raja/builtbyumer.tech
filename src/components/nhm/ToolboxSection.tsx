"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Code2, FileText, Globe, Image as ImageIcon, QrCode } from "lucide-react";
import { CircularCarousel } from "./CircularCarousel";
import { TOOLS } from "@/data/tools";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
} as const;

const PILLS = [
  { icon: FileText, label: "PDF & Documents", href: "/pdf-tools" },
  { icon: ImageIcon, label: "Image Tools", href: "/image-tools" },
  { icon: QrCode, label: "QR & Barcodes", href: "/qr-tools" },
  { icon: Globe, label: "Network Tools", href: "/network-tools" },
  { icon: Code2, label: "Developer Tools", href: "/developer-tools" },
] as const;

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "pdf-tools": FileText,
  "image-tools": ImageIcon,
  "qr-tools": QrCode,
  "network-tools": Globe,
  "developer-tools": Code2,
  "text-tools": Code2,
  calculators: Globe,
  "data-tools": FileText,
  "business-tools": FileText,
  "productivity-tools": Globe,
};

const CATEGORY_NAME: Record<string, string> = {
  "pdf-tools": "PDF",
  "image-tools": "Image",
  "qr-tools": "QR",
  "network-tools": "Network",
  "developer-tools": "Developer",
  "text-tools": "Text",
  calculators: "Calculator",
  "data-tools": "Data",
  "business-tools": "Business",
  "productivity-tools": "Productivity",
};

/** Every registered tool, as a circular 3D carousel item. */
const CAROUSEL_ITEMS = TOOLS.map((t) => {
  const Icon = CATEGORY_ICON[t.category];
  return {
    title: t.title,
    subtitle: CATEGORY_NAME[t.category],
    href: `/${t.category}/${t.id}`,
    icon: Icon ? <Icon className="h-7 w-7 sm:h-8 sm:w-8" /> : <Code2 className="h-7 w-7" />,
  };
});

export function ToolboxSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#fcfcfc] pt-24 md:pt-32">
      {/* label */}
      <motion.p
        {...fadeUp}
        className="px-6 font-mono text-[10px] uppercase tracking-[0.2em] text-[#888888] md:px-16 md:text-[11px]"
      >
        [ 02 ] Explore our toolbox
      </motion.p>

      {/* heading */}
      <motion.h2
        {...fadeUp}
        className="mx-auto mt-8 max-w-[1000px] px-6 text-center font-sans text-[2.2rem] font-medium leading-tight tracking-tight text-[#111111] md:text-[3.5rem] lg:text-[4.2rem]"
      >
        Everything you need to handle everyday digital work, all in one place.
      </motion.h2>

      {/* action pills */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 px-6">
        {PILLS.map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={p.href}
              className="group inline-flex items-center gap-2.5 rounded-full border border-[#111111]/20 bg-white/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#111111] transition-colors duration-300 hover:border-[#111111] hover:bg-[#111111] hover:text-white md:text-[11px]"
            >
              <p.icon className="h-4 w-4" />
              {p.label}
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Circular carousel — every registered tool */}
      <motion.div {...fadeUp} className="mt-14">
        <CircularCarousel
          items={CAROUSEL_ITEMS}
          preset="cylinder"
          intro="rise"
          cardWidth={220}
          aspectRatio={1}
          speed={14}
          captions={false}
          gap={25}
          tilt={-5}
          curve={1}
          perspective={2500}
          autoplay="drift"
          interval={3}
          direction="left"
          momentum={0.6}
          snap
          pauseOnHover
          focusOnClick
          draggable
          parallax={0.3}
          stretch={0.5}
          fadeColor="#fcfcfc"
          depthFade={0.55}
          innerShade={0.6}
          cornerRadius={12}
        />
      </motion.div>

      {/* central visual spacer — the sculpture rises here from the dark section */}
      <div className="h-[220px] md:h-[450px]" />

      {/* bottom text */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-10 md:px-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#111111] md:text-[11px]">
          We make digital work simpler.
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#888888] md:text-[11px]">
          BuiltByUmer © 2026
        </p>
      </div>
    </section>
  );
}
