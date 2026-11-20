"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { HeaderV3 } from "./HeaderV3";
import { HeroV3 } from "./HeroV3";
import { MarqueeV3 } from "./MarqueeV3";
import { StatsV3 } from "./StatsV3";
import { CategoryBento } from "./CategoryBento";
import { HowItWorksV3 } from "./HowItWorksV3";
import { PlaygroundV3 } from "./PlaygroundV3";
import { FooterV3 } from "./FooterV3";

gsap.registerPlugin(ScrollTrigger);

/**
 * Home V3 orchestrator: light paper theme, Lenis smooth scroll +
 * GSAP ScrollTrigger reveals. No preloader — the hero headline
 * paints from the server HTML and rises on mount (transform only).
 * All motion is skipped when the user prefers reduced motion, and
 * every initial hidden state lives under html.js-anim in CSS, so
 * content stays visible with JS disabled or reduced motion.
 */
export default function HomeV3() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Lenis smooth scroll (skipped for reduced motion)
  useEffect(() => {
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
  }, []);

  // Hero entrance + scroll reveals (skipped for reduced motion;
  // the CSS initial states are already neutralised there too)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      // Kinetic headline: masked rise, immediate, transform only
      gsap.to(".v3-hero-line", {
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
        delay: 0.05,
      });
      gsap.to(".v3-hero-fade", {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.45,
      });
      // Section reveals, one beat at a time
      gsap.utils.toArray<HTMLElement>("[data-v3-reveal]").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

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
    <div ref={rootRef} className="home-v3 relative min-h-screen">
      <HeaderV3 onNavigate={navigate} />
      <main>
        <HeroV3 onNavigate={navigate} />
        <MarqueeV3 />
        <StatsV3 />
        <CategoryBento />
        <HowItWorksV3 />
        <PlaygroundV3 />
      </main>
      <FooterV3 />
    </div>
  );
}
