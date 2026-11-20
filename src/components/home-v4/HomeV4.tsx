"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { HeaderV4 } from "./HeaderV4";
import { HeroV4 } from "./HeroV4";
import { MarqueeV4 } from "./MarqueeV4";
import { StatsV4 } from "./StatsV4";
import { CategoryBentoV4 } from "./CategoryBentoV4";
import { HowItWorksV4 } from "./HowItWorksV4";
import { PlaygroundV4 } from "./PlaygroundV4";
import { FooterV4 } from "./FooterV4";

gsap.registerPlugin(ScrollTrigger);

/**
 * Home V4 orchestrator: cinematic black Synthora theme, Lenis
 * smooth scroll + GSAP ScrollTrigger reveals. No preloader — the
 * hero headline paints from the server HTML and rises on mount
 * (transform only). Entrance runs ~1.9s, mirroring the Synthora
 * sequence: nav fades in, badge opens from centre, headline wipes
 * up out of a clip, subline then buttons rise. All motion is
 * skipped when the user prefers reduced motion, and every initial
 * hidden state lives under html.js-anim in CSS, so content stays
 * visible with JS disabled or reduced motion.
 */
export default function HomeV4() {
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

  // Synthora entrance (~1.9s) + scroll reveals (skipped for
  // reduced motion; the CSS initial states are neutralised there)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      // Nav fades in
      gsap.to(".v4-nav", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        delay: 0,
      });
      // Badge opens from its centre
      gsap.to(".v4-badge", {
        scaleX: 1,
        duration: 0.5,
        ease: "power3.out",
        delay: 0.15,
      });
      // Headline wipes up out of a clip, transform only
      gsap.to(".v4-hero-line", {
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
        delay: 0.35,
      });
      // Subline, search and buttons rise, one after another
      gsap.to(".v4-hero-fade", {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.8,
      });
      // Section reveals, one beat at a time
      gsap.utils.toArray<HTMLElement>(".v4-reveal").forEach((el) => {
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
    <div ref={rootRef} className="home-v4 relative min-h-screen">
      <HeaderV4 onNavigate={navigate} />
      <main>
        <HeroV4 onNavigate={navigate} />
        <MarqueeV4 />
        <StatsV4 />
        <CategoryBentoV4 />
        <HowItWorksV4 />
        <PlaygroundV4 />
      </main>
      <FooterV4 />
    </div>
  );
}
