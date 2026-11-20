"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { HeaderV5 } from "./HeaderV5";
import { HeroV5 } from "./HeroV5";
import { MarqueeV5 } from "./MarqueeV5";
import { PopularToolsV5 } from "./PopularToolsV5";
import { CategoryIndexV5 } from "./CategoryIndexV5";
import { HowItWorksV5 } from "./HowItWorksV5";
import { PlaygroundV5 } from "./PlaygroundV5";
import { StatsV5 } from "./StatsV5";
import { FooterV5 } from "./FooterV5";

gsap.registerPlugin(ScrollTrigger);

/**
 * Home V5 orchestrator: editorial paper homepage with a Three.js
 * 3D toolbox hero. Lenis smooth scroll + GSAP ScrollTrigger
 * reveals. No preloader — the hero headline paints from the server
 * HTML and rises on mount (transform only). Entrance runs ~1.9s:
 * nav fades in, headline wipes up out of a clip, subline then
 * search/chips/buttons rise. Section flow: hero → marquee →
 * popular tools → categories (editorial index) → how it works →
 * playground → stats (proof) → footer. All motion is skipped when
 * the user prefers reduced motion, and every initial hidden state
 * lives under html.js-anim in CSS, so content stays visible with
 * JS disabled or reduced motion.
 */
export default function HomeV5() {
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

  // Entrance + scroll reveals (skipped for reduced motion; the CSS
  // initial states are neutralised there)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      // Nav fades in
      gsap.to(".v5-nav", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        delay: 0,
      });
      // Headline wipes up out of a clip, transform only
      gsap.to(".v5-hero-line", {
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
        delay: 0.3,
      });
      // Subline, search, chips and buttons rise, one after another
      gsap.to(".v5-hero-fade", {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.75,
      });
      // Section reveals, one beat at a time
      gsap.utils.toArray<HTMLElement>(".v5-reveal").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
      // Staggered groups: heading → text → cards, 80ms apart, so a
      // section arrives as a sequence instead of one flat wall.
      gsap.utils
        .toArray<HTMLElement>("[data-stagger-group]")
        .forEach((group) => {
          const items =
            group.querySelectorAll<HTMLElement>("[data-stagger-item]");
          if (items.length === 0) return;
          gsap.to(items, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: { trigger: group, start: "top 88%", once: true },
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
    <div ref={rootRef} className="home-v5 relative min-h-screen">
      <HeaderV5 onNavigate={navigate} />
      <main>
        <HeroV5 onNavigate={navigate} />
        <MarqueeV5 />
        <PopularToolsV5 />
        <CategoryIndexV5 />
        <HowItWorksV5 />
        <PlaygroundV5 />
        <StatsV5 />
      </main>
      <FooterV5 />
    </div>
  );
}
