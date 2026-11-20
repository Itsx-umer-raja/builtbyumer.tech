"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { HeaderV7 } from "./HeaderV7";
import { LoadingRitual } from "./LoadingRitual";
import { GateHero } from "./GateHero";
import { HubMap } from "./HubMap";
import { SearchBarV7 } from "./SearchBarV7";
import { WelcomeBand } from "./WelcomeBand";
import { StopChapter } from "./StopChapter";
import { RoadsideStories } from "./RoadsideStories";
import { ProBand } from "./ProBand";
import { DriveOutro } from "./DriveOutro";
import { NextStopTeaser, FooterV7 } from "./NextStopTeaser";
import { StickyProgressBar } from "./StickyProgressBar";
import { StopsMenu } from "./StopsMenu";
import { PassportDialog } from "./Passport";
import { VehiclePicker } from "./VehiclePicker";
import { InFeedAd, LeaderboardAd, MobileAnchorAd } from "./RouteAds";
import {
  PASSPORT_KEY,
  STOPS,
  STOP_MAP,
  VEHICLE_KEY,
  type Stop,
  type VehicleKind,
} from "./routeData";

gsap.registerPlugin(ScrollTrigger);

/**
 * Home V7 orchestrator — "Route 145", BuiltByUmer as an Expedia
 * Route 66-style journey. Flow: loading ritual (fast, skippable)
 * → gate hero (curtain) → hub map (the home) → search → welcome
 * → ten stop chapters → roadside stories → Pro band → drive
 * outro → next-stop teaser → footer. Lenis smooth scroll + GSAP
 * reveals, transform/opacity only. The journey never hides the
 * tools: search is one keystroke away (Ctrl/⌘K) from anywhere,
 * and every stop/card links to a real category or tool page.
 */
export default function HomeV7() {
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
      if (savedVehicle === "van" || savedVehicle === "car" || savedVehicle === "bike")
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

  const navigate = useCallback((target: string) => {
    const el = document.querySelector(target);
    if (!el) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el as HTMLElement, { offset: -110 });
    } else {
      (el as HTMLElement).scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const enterRoute = useCallback(
    (mode: "drive" | "instant") => {
      const el = document.getElementById("map");
      if (!el) return;
      if (mode === "instant" || !lenisRef.current) {
        el.scrollIntoView({ behavior: "auto" });
        window.scrollBy(0, -110);
      } else {
        lenisRef.current.scrollTo(el, { offset: -110, duration: 1.6 });
      }
    },
    [],
  );

  const focusSearch = useCallback(() => {
    const section = document.getElementById("search");
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".v7-reveal").forEach((el) => {
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
      setScrollProgress((prev) =>
        Math.abs(prev - p) < 0.005 ? prev : p,
      );
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

  // Which part of the route is in view (map / a stop / stories / outro).
  useEffect(() => {
    const ids = ["map", "stories", "outro"];
    const els = [
      ...STOPS.map((s) => document.getElementById(`stop-${s.slug}`)),
      ...ids.map((id) => document.getElementById(id)),
    ].filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          setCurrentStop(id.startsWith("stop-") ? id.slice(5) : id);
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
      : currentStop === "stories"
        ? "Roadside Stories"
        : currentStop === "outro"
          ? "The Drive Home"
          : currentStop
            ? (STOP_MAP[currentStop]?.name ?? "The Road")
            : "The Map";

  const onPinClick = useCallback(
    (stop: Stop) => {
      stamp(stop.slug);
      navigate(`#stop-${stop.slug}`);
    },
    [stamp, navigate],
  );

  const onMenuPick = useCallback(
    (stop: Stop) => {
      setMenuOpen(false);
      stamp(stop.slug);
      window.setTimeout(() => navigate(`#stop-${stop.slug}`), 60);
    },
    [stamp, navigate],
  );

  return (
    <div ref={rootRef} className="home-v7 relative min-h-screen">
      <HeaderV7
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
        <GateHero onEnter={enterRoute} />

        <HubMap
          vehicle={vehicle}
          reducedMotion={reducedMotion}
          onPinClick={onPinClick}
          onOpenVehicle={() => setVehicleOpen(true)}
        />

        {/* Search — always one keystroke away, right under the map */}
        <section
          id="search"
          className="v7-topo-bg relative bg-[#fdf6e3] pb-4 pt-12"
          aria-label="Search tools"
        >
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <p className="v7-reveal text-center">
              <span className="v7-eyebrow">In a hurry? Skip the drive</span>
            </p>
            <div className="v7-reveal mt-4">
              <SearchBarV7 inputRef={searchInputRef} />
            </div>
          </div>
        </section>

        <LeaderboardAd />

        <WelcomeBand />

        {/* The route — ten stops, in order */}
        {STOPS.map((stop, i) => (
          <div key={stop.slug}>
            <StopChapter
              stop={stop}
              next={STOPS[i + 1] ?? null}
              onStamp={stamp}
            />
            {i === 4 && <InFeedAd />}
          </div>
        ))}

        <RoadsideStories />

        <ProBand />

        <DriveOutro
          vehicle={vehicle}
          reducedMotion={reducedMotion}
          onStartUsing={focusSearch}
        />

        <NextStopTeaser onNavigate={navigate} />
      </main>

      <FooterV7 />

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
          window.setTimeout(() => navigate(`#stop-${slug}`), 60);
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
