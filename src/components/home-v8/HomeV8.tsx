"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { HeaderV8 } from "./HeaderV8";
import { LoadingRitual } from "./LoadingRitual";
import { HeroV8 } from "./HeroV8";
import { HubMap } from "./HubMap";
import { RoadsideStories } from "./RoadsideStories";
import { ProBand } from "./ProBand";
import { NextStopTeaser, FooterV8 } from "./FooterV8";
import { StickyProgressBar } from "./StickyProgressBar";
import { StopsMenu } from "./StopsMenu";
import { PassportDialog } from "./Passport";
import { VehiclePicker } from "./VehiclePicker";
import { InFeedAd, LeaderboardAd, MobileAnchorAd } from "./RouteAds";
import WorldsSection from "./WorldsSection";
import DirectorySection from "./DirectorySection";
import {
  PASSPORT_KEY,
  VEHICLE_KEY,
  type Stop,
  type VehicleKind,
} from "./routeData";

gsap.registerPlugin(ScrollTrigger);

/**
 * Home V8 orchestrator — "ROUTE 145 — THE ULTIMATE 3D DIGITAL
 * TOOL UNIVERSE" (master redesign, Phases 3–4). Flow: loading
 * ritual (fast, skippable) → 3D hero (headline + search in
 * plain server HTML) → hub map → worlds (Phase 5) → directory
 * (Phase 6) → roadside stories → Pro band → next-stop teaser →
 * footer. Lenis smooth scroll + GSAP reveals, transform/opacity
 * only. The journey never hides the tools: search is one
 * keystroke away (Ctrl/⌘K) from anywhere, and every stop/card
 * links to a real category or tool page.
 *
 * WAVE 2 INTEGRATION — the two slots below are comments on
 * purpose. Do not import WorldsSection or DirectorySection
 * until Wave 2 has written them (see CONTRACT.md).
 */
export default function HomeV8() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [ritualDone, setRitualDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleKind>("van");
  const [stamps, setStamps] = useState<string[]>([]);
  const [currentStop, setCurrentStop] = useState<string | null>(null);
  const [barVisible, setBarVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Reduced motion + persisted passport/vehicle (client-only).
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(rm);
    if (rm) setRitualDone(true);
    try {
      const savedStamps = JSON.parse(
        window.localStorage.getItem(PASSPORT_KEY) ?? "[]",
      );
      if (Array.isArray(savedStamps))
        setStamps(savedStamps.filter((s) => typeof s === "string"));
      const savedVehicle = window.localStorage.getItem(VEHICLE_KEY);
      if (
        savedVehicle === "van" ||
        savedVehicle === "car" ||
        savedVehicle === "bike"
      )
        setVehicle(savedVehicle);
    } catch {
      // Corrupt storage is not fatal — start fresh.
    }
  }, []);

  const stamp = useCallback((slug: string) => {
    setStamps((prev) => {
      if (prev.includes(slug)) return prev;
      const next = [...prev, slug];
      try {
        window.localStorage.setItem(PASSPORT_KEY, JSON.stringify(next));
      } catch {
        // Storage full/blocked — the count still works for the session.
      }
      return next;
    });
  }, []);

  const pickVehicle = useCallback((kind: VehicleKind) => {
    setVehicle(kind);
    try {
      window.localStorage.setItem(VEHICLE_KEY, kind);
    } catch {
      // Non-fatal.
    }
  }, []);

  // Lenis smooth scroll (skipped for reduced motion).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
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

  const navigate = useCallback((target: string) => {
    const el = document.querySelector(target);
    if (!el) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el as HTMLElement, { offset: -110 });
    } else {
      (el as HTMLElement).scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const focusSearch = useCallback(() => {
    const section = document.getElementById("v8-search");
    if (section) {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(section, { offset: -120, duration: 0.9 });
      } else {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
    window.setTimeout(() => searchInputRef.current?.focus(), 350);
  }, []);

  // Ctrl/⌘K or "/" focuses the search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        focusSearch();
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        focusSearch();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focusSearch]);

  // Entrance + scroll reveals (skipped for reduced motion; the CSS
  // initial states are neutralised there).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const ctx = gsap.context(() => {
      // Hero entrance — short, transform-only.
      gsap.to(".v8-hero-line", {
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
      });
      gsap.to(".v8-hero-fade", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.15,
      });
      gsap.utils.toArray<HTMLElement>(".v8-reveal").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
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

  // Current stop + sticky bar + overall progress, from scroll.
  useEffect(() => {
    let raf = 0;
    let queued = false;
    const update = () => {
      queued = false;
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const p = Math.max(0, Math.min(1, window.scrollY / max));
      setScrollProgress((prev) => (Math.abs(prev - p) < 0.005 ? prev : p));
      setBarVisible(window.scrollY > window.innerHeight * 0.85);
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Which part of the route is in view (map / worlds / directory /
  // stories / pro). "worlds" and "directory" do not exist yet —
  // Wave 2 mounts them; the observer picks them up automatically
  // once their sections carry those ids (see CONTRACT.md).
  useEffect(() => {
    const ids = ["map", "worlds", "directory", "stories", "pro"];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setCurrentStop(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const currentLabel =
    currentStop === "map"
      ? "The Map"
      : currentStop === "worlds"
        ? "The Worlds"
        : currentStop === "directory"
          ? "The Directory"
          : currentStop === "stories"
            ? "Roadside Stories"
            : currentStop === "pro"
              ? "BuiltByUmer Pro"
              : "The Map";

  const onPinClick = useCallback(
    (stop: Stop) => {
      stamp(stop.slug);
      // Phase 5 mounts the worlds at #worlds; until then the pin
      // takes the traveller to the stop's real category page.
      if (document.getElementById("worlds")) {
        navigate("#worlds");
      } else {
        window.location.href = `/${stop.slug}`;
      }
    },
    [stamp, navigate],
  );

  const onMenuPick = useCallback(
    (stop: Stop) => {
      setMenuOpen(false);
      stamp(stop.slug);
      window.setTimeout(() => {
        if (document.getElementById("worlds")) {
          navigate("#worlds");
        } else {
          window.location.href = `/${stop.slug}`;
        }
      }, 60);
    },
    [stamp, navigate],
  );

  return (
    <div ref={rootRef} className="home-v8 relative min-h-screen">
      {/* Skip link — tools without completing the journey. */}
      <a
        href="#v8-search"
        onClick={(e) => {
          e.preventDefault();
          focusSearch();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--v8-accent)] focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-[var(--v8-bg)]"
      >
        Skip to tools
      </a>

      <HeaderV8
        stamps={stamps.length}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenPassport={() => setPassportOpen(true)}
        onFocusSearch={focusSearch}
      />
      <StickyProgressBar
        visible={barVisible}
        currentLabel={currentLabel}
        progress={scrollProgress}
        onFocusSearch={focusSearch}
      />

      {!reducedMotion && !ritualDone && (
        <LoadingRitual onDone={() => setRitualDone(true)} />
      )}

      <main>
        <HeroV8 onNavigate={navigate} inputRef={searchInputRef} />

        <LeaderboardAd />

        <HubMap
          vehicle={vehicle}
          reducedMotion={reducedMotion}
          onPinClick={onPinClick}
          onOpenVehicle={() => setVehicleOpen(true)}
        />

        <WorldsSection />

        <DirectorySection />

        <RoadsideStories />

        <InFeedAd />

        <ProBand />

        <NextStopTeaser onNavigate={navigate} />
      </main>

      <FooterV8 />

      <StopsMenu
        open={menuOpen}
        currentStop={currentStop}
        stamps={stamps}
        onClose={() => setMenuOpen(false)}
        onPick={onMenuPick}
      />
      <PassportDialog
        open={passportOpen}
        stamps={stamps}
        onClose={() => setPassportOpen(false)}
        onStartUsing={() => {
          setPassportOpen(false);
          focusSearch();
        }}
        onPick={(slug) => {
          setPassportOpen(false);
          stamp(slug);
          window.setTimeout(() => {
            if (document.getElementById("worlds")) {
              navigate("#worlds");
            } else {
              window.location.href = `/${slug}`;
            }
          }, 60);
        }}
      />
      <VehiclePicker
        open={vehicleOpen}
        vehicle={vehicle}
        onSelect={pickVehicle}
        onClose={() => setVehicleOpen(false)}
      />
      <MobileAnchorAd />
    </div>
  );
}
