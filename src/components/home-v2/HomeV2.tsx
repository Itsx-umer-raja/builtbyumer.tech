"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { Preloader } from "./Preloader";
import { Cursor } from "./Cursor";
import { HeaderV2 } from "./HeaderV2";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { StatsBand } from "./StatsBand";
import { CategoryIndex } from "./CategoryIndex";
import { FeaturedTools } from "./FeaturedTools";
import { HowItWorks } from "./HowItWorks";
import { FooterV2 } from "./FooterV2";

gsap.registerPlugin(ScrollTrigger);

/**
 * Home V2 orchestrator: preloader → Lenis smooth scroll → GSAP
 * ScrollTrigger reveals. Old daiki / fernhollow / mossline components
 * are left untouched and unused.
 */
export default function HomeV2() {
  const [loading, setLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Lenis smooth scroll (skipped for reduced motion)
  useEffect(() => {
    if (loading) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [loading]);

  // GSAP ScrollTrigger reveals on [data-hv-reveal] (skipped for reduced motion)
  useEffect(() => {
    if (loading) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-hv-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 44, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, [loading]);

  const navigate = useCallback((target: string) => {
    const el = document.querySelector(target);
    if (!el) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el as HTMLElement, { offset: -64 });
    } else {
      (el as HTMLElement).scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div ref={rootRef} data-cursor="custom" className="home-v2 relative min-h-screen">
      <Cursor />
      <AnimatePresence>
        {loading && <Preloader key="preloader" onDone={() => setLoading(false)} />}
      </AnimatePresence>

      <HeaderV2 onNavigate={navigate} />
      <main>
        <Hero active={!loading} onNavigate={navigate} />
        <Marquee />
        <StatsBand />
        <CategoryIndex />
        <FeaturedTools />
        <HowItWorks />
      </main>
      <FooterV2 />
    </div>
  );
}
