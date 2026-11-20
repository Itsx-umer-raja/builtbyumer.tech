"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";

/**
 * Motion preview GIFs, hotlinked from motionsites.ai (they total ~168 MB,
 * far too heavy to self-host) with lazy loading. The last URL in the
 * supplied list returns 404 and is excluded.
 */
const GIFS = [
  "https://motionsites.ai/assets/hero-space-voyage-preview-eECLH3Yc.gif",
  "https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif",
  "https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif",
  "https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif",
  "https://motionsites.ai/assets/hero-asme-preview-B_nGDnTP.gif",
  "https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif",
  "https://motionsites.ai/assets/hero-vitara-preview-Cjz2QYyU.gif",
  "https://motionsites.ai/assets/hero-terra-preview-BFjrCr7T.gif",
  "https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif",
  "https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif",
  "https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif",
  "https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif",
  "https://motionsites.ai/assets/hero-xportfolio-preview-D4A8maiC.gif",
  "https://motionsites.ai/assets/hero-orbit-web3-preview-BXt4OttD.gif",
  "https://motionsites.ai/assets/hero-nexora-preview-cx5HmUgo.gif",
  "https://motionsites.ai/assets/hero-evr-ventures-preview-DZxeVFEX.gif",
  "https://motionsites.ai/assets/hero-planet-orbit-preview-DWAP8Z1P.gif",
  "https://motionsites.ai/assets/hero-new-era-preview-CocuDUm9.gif",
  "https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif",
  "https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif",
];

const ROW1 = GIFS.slice(0, 11);
const ROW2 = GIFS.slice(11);

const TILE = 420;
const GAP = 12;

/** Width of one full set of tiles — used as the base shift for the right-moving row. */
const ROW1_SET_WIDTH = ROW1.length * (TILE + GAP);

function Row({ images, rowRef }: { images: string[]; rowRef: React.RefObject<HTMLDivElement | null> }) {
  // Tripled for seamless wrapping across the whole scroll range.
  const tripled = [...images, ...images, ...images];
  return (
    <div ref={rowRef} className="flex w-max gap-3" style={{ willChange: "transform" }}>
      {tripled.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          aria-hidden={i >= images.length}
          width={TILE}
          height={270}
          loading="lazy"
          className="h-[270px] w-[420px] shrink-0 rounded-2xl object-cover"
          draggable={false}
        />
      ))}
    </div>
  );
}

export function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const row1 = useRef<HTMLDivElement>(null);
  const row2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sectionTop = 0;
    const measure = () => {
      const el = sectionRef.current;
      if (el) sectionTop = el.getBoundingClientRect().top + window.scrollY;
    };
    measure();

    const onScroll = () => {
      // Spec formula: (scrollY - sectionTop + innerHeight) * 0.3
      const offset = (window.scrollY - sectionTop + window.innerHeight) * 0.3;
      // Row 1 moves right; the base shift keeps the tripled strip covering
      // the viewport so no gap appears on the left as it slides.
      if (row1.current) row1.current.style.transform = `translateX(${offset - 200 - ROW1_SET_WIDTH}px)`;
      // Row 2 moves left.
      if (row2.current) row2.current.style.transform = `translateX(${-(offset - 200)}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section ref={sectionRef} className="overflow-x-clip bg-[#0C0C0C] pb-10 pt-24 sm:pt-32 md:pt-40">
      <div className="flex flex-col gap-3">
        <Row images={ROW1} rowRef={row1} />
        <Row images={ROW2} rowRef={row2} />
      </div>
    </section>
  );
}
