"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Calculator,
  Code2,
  FileText,
  Globe,
  Image as ImageIcon,
  QrCode,
  Type as TypeIcon,
  Database,
  Briefcase,
  Timer,
  FlaskConical,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { SoundEngine } from "./sound";
import AnimatedButton from "@/components/ui/animated-button";
import { TrendCarousel } from "@/components/carousel/TrendCarousel";
import { ClothSection } from "@/components/cloth/ClothSection";
import { ToolCardCarousel } from "@/components/cards/ToolCardCarousel";
import { CircularCarousel } from "@/components/nhm/CircularCarousel";
import { WildPill } from "@/components/pill/WildPill";
import { ClosingSection } from "@/components/closing/ClosingSection";
import { TOOLS } from "@/data/tools";
import { CATEGORIES } from "@/data/categories";

/* ── Category icon map for the carousel ───────────────────── */
const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "pdf-tools": FileText,
  "image-tools": ImageIcon,
  "qr-tools": QrCode,
  "network-tools": Globe,
  "developer-tools": Code2,
  "text-tools": TypeIcon,
  calculators: Calculator,
  "data-tools": Database,
  "business-tools": Briefcase,
  "productivity-tools": Timer,
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

const CAROUSEL_ITEMS = TOOLS.map((t) => {
  const Icon = CATEGORY_ICON[t.category];
  return {
    title: t.title,
    subtitle: CATEGORY_NAME[t.category],
    href: `/${t.category}/${t.id}`,
    icon: Icon ? <Icon className="h-7 w-7 sm:h-8 sm:w-8" /> : <FlaskConical className="h-7 w-7" />,
  };
});

/* ── Per-character split for the marquee ──────────────────── */
interface Seg {
  t: string;
  em?: boolean;
  color?: string;
}

function SplitChars({ segments, base }: { segments: Seg[]; base: number }) {
  let i = base;
  return (
    <>
      {segments.map((seg, si) => {
        if (seg.em) {
          // Solid italic serif with a slow light sweep — one em per character.
          const chars = Array.from(seg.t);
          return (
            <span key={si}>
              {chars.map((ch, ci) => {
                const idx = base + si * 40 + ci;
                return (
                  <em
                    key={ci}
                    className="dbu-ch dbu-em"
                    style={{
                      ["--i" as string]: String(idx),
                      ["--wcolor" as string]: seg.color ?? "#121212",
                    }}
                  >
                    {ch === " " ? "\u00A0" : ch}
                  </em>
                );
              })}
            </span>
          );
        }
        const chars = Array.from(seg.t);
        const nodes = chars.map((ch, ci) => {
          const idx = i++;
          return (
            <span
              key={`${si}-${ci}`}
              className="dbu-ch"
              style={{ ["--i" as string]: String(idx) }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          );
        });
        return <span key={si}>{nodes}</span>;
      })}
    </>
  );
}

/* ── Sound engine singleton (module-level, user-gesture gated) ── */
const sound = new SoundEngine();

export function Landing() {
  const [soundOn, setSoundOn] = useState(false);
  const [clock, setClock] = useState("--:--");
  const [catOpen, setCatOpen] = useState(false);
  const [catPos, setCatPos] = useState({ left: 0, top: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLHeadingElement>(null);
  const catWrapRef = useRef<HTMLDivElement>(null);
  const catCloseTimer = useRef(0);

  const openCat = useCallback(() => {
    const r = catWrapRef.current?.getBoundingClientRect();
    if (r) setCatPos({ left: r.left + r.width / 2 - 118, top: r.bottom + 12 });
    window.clearTimeout(catCloseTimer.current);
    setCatOpen(true);
  }, []);

  const scheduleCatClose = useCallback(() => {
    window.clearTimeout(catCloseTimer.current);
    catCloseTimer.current = window.setTimeout(() => setCatOpen(false), 180);
  }, []);

  const cancelCatClose = useCallback(() => {
    window.clearTimeout(catCloseTimer.current);
  }, []);

  /* Local clock (12-hour) */
  useEffect(() => {
    const tick = () => {
      try {
        setClock(
          new Intl.DateTimeFormat("en-GB", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
            .format(new Date())
            .toLowerCase(),
        );
      } catch {
        /* keep placeholder */
      }
    };
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, []);

  /* Hero per-character cascade — plays once JS lands; the text itself is
     visible from the first paint so there is no blank hero */
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      heroRef.current?.querySelectorAll(".dbu-line").forEach((l) => l.classList.add("go"));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  /* Pause the showreel while scrolled out of view (scroll smoothness) */
  useEffect(() => {
    const reel = document.querySelector<HTMLElement>(".dbu-reel");
    const video = reel?.querySelector("video");
    if (!reel || !video) return;
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    io.observe(reel);
    return () => io.disconnect();
  }, []);

  /* Document-wide scroll reveals. Below-fold sections start hidden only
     once JS arms them (no white screen while hydration catches up), and a
     failsafe shows anything visible in the viewport after 1.6s. */
  useEffect(() => {
    document.querySelectorAll<HTMLElement>(".dbu-reveal").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.92) el.classList.add("arm");
      else el.classList.add("in");
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll(".dbu-reveal:not(.in)").forEach((el) => io.observe(el));
    const failsafe = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>(".dbu-reveal.arm:not(.in)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
      });
    }, 1600);
    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  /* UI blips when sound is on */
  useEffect(() => {
    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a,button,.dbu-title,.dbu-plate")) {
        sound.blip(620 + Math.random() * 160, 0.13, 0.022);
      }
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a,button")) sound.blip(430, 0.2, 0.032);
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const heroSegments = useMemo<Seg[]>(
    () => [
      { t: "Every tool. ", em: true, color: "#121212" },
      { t: "One destination.", em: true, color: "#163d2b" },
      { t: "\u00A0" },
    ],
    [],
  );

  return (
    <div className="dbu">
      {/* atmosphere */}
      <div className="dbu-sky" aria-hidden>
        <span className="dbu-blob dbu-b1" />
        <span className="dbu-blob dbu-b2" />
        <span className="dbu-blob dbu-b3" />
      </div>
      <div className="dbu-lines" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="dbu-grain" aria-hidden />

      {/* header */}
      <header>
        <Link href="/" className="dbu-u flex items-center gap-2.5" aria-label="BuiltByUmer home">
          <svg width="26" height="28" viewBox="0 0 34 36" fill="none" aria-hidden>
            <path d="M17 1 32 9.5v17L17 35 2 26.5v-17Z" stroke="currentColor" strokeWidth="2.2" />
            <path
              d="M12 24V12h4.2a3 3 0 0 1 0 6h-4.2m0 0h4.6a3 3 0 0 1 0 6h-4.6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[13px] font-semibold tracking-[0.08em]">BuiltByUmer</span>
        </Link>
        <nav>
          <a href="#work" className="dbu-u">
            Work
          </a>
          <div
            ref={catWrapRef}
            className="dbu-cat"
            onMouseEnter={openCat}
            onMouseLeave={scheduleCatClose}
          >
            <button
              type="button"
              className="dbu-u"
              aria-expanded={catOpen}
              onClick={() => {
                if (catOpen) {
                  setCatOpen(false);
                } else {
                  openCat();
                }
              }}
            >
              Categories ▾
            </button>
          </div>
          <a href="#about" className="dbu-u">
            About
          </a>
        </nav>
        <div className="dbu-h-right">
          <button
            type="button"
            className={"dbu-snd" + (soundOn ? " on" : "")}
            aria-pressed={soundOn}
            aria-label="Toggle sound"
            onClick={async () => {
              const on = await sound.toggle();
              setSoundOn(on);
            }}
          >
            <svg className="wave" width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
              <path
                d="M1 6h2M5 2v8M9 4v4M13 6h-2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <span>{soundOn ? "Sound on" : "Sound off"}</span>
          </button>
          <span className="dbu-time">
            <span>Local</span>
            <time>{clock}</time>
          </span>
          <a href="#contact" className="dbu-u">
            Contact
          </a>
          <button
            type="button"
            className="dbu-hamburger"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="dbu-hamburger-line" />
            <span className="dbu-hamburger-line" />
            <span className="dbu-hamburger-line" />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="dbu-mobile-menu">
          <a href="#work" className="dbu-mobile-link" onClick={() => setMobileMenuOpen(false)}>Work</a>
          <a href="#about" className="dbu-mobile-link" onClick={() => setMobileMenuOpen(false)}>About</a>
          <a href="#contact" className="dbu-mobile-link" onClick={() => setMobileMenuOpen(false)}>Contact</a>
          <div className="dbu-mobile-cats">
            <span className="dbu-mobile-cats-label">Categories</span>
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="dbu-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* categories dropdown — rendered outside the difference-blend header */}
      {catOpen && (
        <div
          className="dbu-cat-panel"
          style={{ left: catPos.left, top: catPos.top }}
          onMouseEnter={cancelCatClose}
          onMouseLeave={scheduleCatClose}
        >
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="dbu-cat-item"
              onClick={() => setCatOpen(false)}
            >
              {c.name}
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      {/* ── HERO ── */}
      <section className="dbu-hero" id="top" aria-label="Introduction">
        <h1 className="dbu-hero-name" ref={heroRef} aria-label="Every tool. One destination.">
          <span className="dbu-line">
            <SplitChars segments={heroSegments} base={0} />
          </span>
        </h1>

        {/* Showreel plate — the BuiltByUmer film (rabbit + calligraphy) */}
        <div className="dbu-reel dbu-reveal">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            src="/videos/valley-hero.mp4"
            aria-label="BuiltByUmer showreel — a 3D rabbit exploring floating calligraphy"
          />
          <div className="dbu-reel-shade" aria-hidden />

          {/* About Umer — written into the area the rabbit points at */}
          <div className="dbu-reel-about">
            <p className="dbu-label" style={{ color: "rgba(255,255,255,0.6)" }}>
              About — Umer Raja
            </p>
            <p className="dbu-reel-serif">
              Law student. <em>Toolmaker.</em>
            </p>
            <p className="dbu-reel-sub">
              I build small, private utilities that make everyday digital work take one click —
              nothing uploaded, nothing installed, nothing to pay for.
            </p>
            <AnimatedButton
              as="a"
              href="/tools"
              className="!rounded-full !bg-[#0C0C0D]/60 !backdrop-blur-md !border-white/40 !text-white !px-7 !py-3.5 !text-[13px] hover:!bg-white/95 hover:!text-[#121212] hover:!border-white/90 [--shine:rgba(255,255,255,.7)]"
            >
              Browse all tools
            </AnimatedButton>
          </div>

          <Link className="dbu-reel-x dbu-label dbu-u" href="/tools">
            Explore tools ↗
          </Link>
        </div>
      </section>

      {/* ── CATEGORIES — square swipeable trend carousel ── */}
      <TrendCarousel />

      {/* ── CLOTH — grab the holographic cloth ── */}
      <ClothSection />

      {/* ── CARDS — what's inside, on premium cards ── */}
      <ToolCardCarousel />

      {/* ── ABOUT ── */}
      <section className="dbu-about" id="about" aria-label="About">
        <div className="dbu-grid dbu-label dbu-head dbu-reveal">
          <span className="dbu-eyebrow">About</span>
        </div>

        <p className="dbu-say">
          <span className="dbu-say-line dbu-reveal" style={{ ["--d" as string]: "0" }}>
            I build tools that stay
          </span>
          <span className="dbu-say-line dbu-reveal" style={{ ["--d" as string]: "0.07" }}>
            out of your way — where
          </span>
          <span className="dbu-say-line dbu-reveal" style={{ ["--d" as string]: "0.14" }}>
            files, images and code
          </span>
          <span className="dbu-say-line dbu-reveal" style={{ ["--d" as string]: "0.21" }}>
            become <em>one smooth</em>
          </span>
          <span className="dbu-say-line dbu-reveal" style={{ ["--d" as string]: "0.28" }}>
            experience.
          </span>
        </p>

        <div className="dbu-grid dbu-bio">
          <div className="dbu-bio-col dbu-reveal">
            <p className="dbu-lead">
              BuiltByUmer is a free toolbox of {TOOLS.length} browser-based utilities — no
              accounts, no uploads, nothing installed. Everything runs on your device.
            </p>
            <p>
              Convert a PDF, squeeze a photo to exactly 50 KB, generate a Wi-Fi QR code or decode a
              JWT — the tool opens instantly, does its work locally, and disappears when you are
              done.
            </p>
          </div>
          <div className="dbu-bio-col dbu-reveal" style={{ ["--d" as string]: "0.12" }}>
            <p className="dbu-lead">Privacy is the design, not a feature.</p>
            <p>
              Your files are never sent to a server — processing happens inside your browser with
              modern web APIs. Network lookups use only documented free public endpoints, and every
              tool is free to use without an account.
            </p>
          </div>
        </div>
      </section>

      {/* ── THE TOOLBOX (circular carousel of every tool) ── */}
      <section className="dbu-box" aria-label="The toolbox">
        <div className="dbu-grid dbu-label dbu-head dbu-reveal">
          <span className="dbu-eyebrow">The toolbox</span>
          <span className="dbu-r dbu-dim">{TOOLS.length} tools — drag or wait</span>
        </div>
        <Reveal>
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
            fadeColor="#ECEAE4"
            depthFade={0.55}
            innerShade={0.6}
            cornerRadius={12}
          />
        </Reveal>
      </section>

      {/* ── FEATURED WORKS (pinned horizontal scroll) ── */}
      <WorksSection />

      {/* ── WILD PILL — the island reveal ── */}
      <WildPill />

      {/* ── STATS (honest numbers) ── */}
      <section className="dbu-stats" aria-label="By the numbers">
        <div className="dbu-grid dbu-label dbu-head dbu-reveal">
          <span className="dbu-eyebrow">By the numbers</span>
        </div>
        <p className="dbu-rnum dbu-reveal" aria-label={`${TOOLS.length} tools`}>
          {TOOLS.length}
        </p>
        <ul className="dbu-slist">
          {[
            ["", `${TOOLS.length} tools`, "Registered", "Genuinely working"],
            ["", "10", "Categories", "PDF to productivity"],
            ["", "0", "Uploads", "Files never leave your device"],
            ["", "100%", "Browser-based", "Free, no account"],
          ].map(([y, p, org, hn], i) => (
            <Reveal as="li" className="dbu-srow" key={i} delay={i * 0.03}>
              <span className="dbu-sy">{y}</span>
              <span className="dbu-sp">{p}</span>
              <span className="dbu-so">{org}</span>
              <span className="dbu-shn">{hn}</span>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── CONTACT ── */}
      <section className="dbu-contact" id="contact" aria-label="Contact">
        <div className="dbu-grid dbu-label dbu-head dbu-reveal">
          <span className="dbu-eyebrow">Contact</span>
        </div>
        <h2 className="dbu-hello" aria-label="Say hello">
          <span className="dbu-hello-line dbu-reveal">Say</span>
          <span className="dbu-hello-line dbu-reveal" style={{ ["--d" as string]: "0.1" }}>
            hello.
          </span>
        </h2>

        <div className="dbu-grid dbu-ctl">
          <div className="dbu-c1 dbu-reveal">
            <a className="dbu-big" href="mailto:hello@builtbyumer.tech">
              <span className="dbu-u">Send an email</span> ↗
            </a>
          </div>
          <div className="dbu-c2 dbu-reveal" style={{ ["--d" as string]: "0.08" }}>
            <span className="dbu-label dbu-dim">Elsewhere</span>
            <Link className="dbu-u dbu-label" href="/tools" style={{ justifySelf: "start" }}>
              All tools ↗
            </Link>
          </div>
          <div className="dbu-c3 dbu-reveal" style={{ ["--d" as string]: "0.16" }}>
            <span className="dbu-label dbu-dim">Elsewhere</span>
            <Link className="dbu-u dbu-label" href="/portfolio" style={{ justifySelf: "start" }}>
              Portfolio ↗
            </Link>
          </div>
        </div>

      </section>

      {/* ── CLOSING — halftone FAQ + footer ── */}
      <ClosingSection />
    </div>
  );
}

/* ── Featured works: pinned horizontal scroll (3 category plates) ── */
const WORKS = [
  {
    k: "01 — Category",
    title: "PDF Suite",
    role: "Merge / Split / Convert / Watermark / Page numbers",
    year: "2026",
    img: "/images/tools/pdf-tools.svg",
    href: "/pdf-tools",
    cta: "Open the collection",
  },
  {
    k: "02 — Category",
    title: "Image Lab",
    role: "Compress to target KB / Resize / Convert / OCR",
    year: "2026",
    img: "/images/tools/image-tools.svg",
    href: "/image-tools",
    cta: "Open the collection",
  },
  {
    k: "03 — Category",
    title: "QR Studio",
    role: "Generate / Scan / Wi-Fi / vCard / Barcodes",
    year: "2026",
    img: "/images/tools/qr-tools.svg",
    href: "/qr-tools",
    cta: "Open the collection",
  },
] as const;

function WorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState("01 / 03");

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    let maxX = 0;
    const measure = () => {
      maxX = Math.max(0, track.scrollWidth - window.innerWidth);
    };
    const update = () => {
      if (window.innerWidth <= 900) {
        track.style.transform = "";
        return;
      }
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      track.style.transform = `translate3d(${(-p * maxX).toFixed(1)}px,0,0)`;
      const idx = Math.min(WORKS.length, Math.floor(p * WORKS.length) + 1);
      setCount(`0${idx} / 0${WORKS.length}`);
    };
    measure();
    update();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section className="dbu-works" id="work" aria-label="Featured work" ref={sectionRef}>
      <div className="dbu-works-pin">
        <div className="dbu-grid dbu-label dbu-works-head">
          <span className="dbu-eyebrow">Featured work</span>
          <span className="dbu-r">{count}</span>
        </div>
        <div className="dbu-works-track" ref={trackRef}>
          {WORKS.map((w, i) => (
            <article className="dbu-work" key={w.title} data-work={i}>
              <div>
                <span className="dbu-label dbu-k dbu-dim">{w.k}</span>
                <h3 className="dbu-title">{w.title}</h3>
                <dl className="dbu-meta">
                  <dt>Focus</dt>
                  <dd>{w.role}</dd>
                  <dt>Year</dt>
                  <dd>{w.year}</dd>
                </dl>
                <Link className="dbu-open" href={w.href}>
                  <span className="dbu-ul">{w.cta}</span>{" "}
                  <span className="dbu-arr" aria-hidden>
                    →
                  </span>
                </Link>
              </div>
              <figure className="dbu-plate">
                <img src={w.img} alt={w.title} loading="lazy" draggable={false} />
              </figure>
            </article>
          ))}
        </div>
      </div>
      <style href="st-landing-1" precedence="high" dangerouslySetInnerHTML={{ __html: `
        .dbu {
          --paper: #eceae4;
          --ink: #121212;
          --dim: rgba(18, 18, 18, 0.48);
          --rule: rgba(18, 18, 18, 0.16);
          --night: #07081a;
          --cyan: #7df9ff;
          --pink: #ff4fa3;
          --m: clamp(20px, 2.8vw, 48px);
          --g: 20px;
          --top: clamp(78px, 10.5vh, 104px);
          --ease: cubic-bezier(0.19, 1, 0.22, 1);
          background: var(--paper);
          color: var(--ink);
          font-family: var(--font-inter-tight), "Helvetica Neue", Arial, system-ui, sans-serif;
          transition: background 0.7s var(--ease), color 0.7s var(--ease);
        }
        .dbu.night {
          --paper: #07081a;
          --ink: #eceae4;
          --dim: rgba(236, 234, 228, 0.48);
          --rule: rgba(236, 234, 228, 0.16);
          background: #07081a;
          color: #eceae4;
        }
        .dbu * {
          box-sizing: border-box;
        }
        .dbu a {
          color: inherit;
          text-decoration: none;
        }
        .dbu h1,
        .dbu h2,
        .dbu h3,
        .dbu p,
        .dbu dl,
        .dbu dd,
        .dbu figure {
          margin: 0;
        }
        .dbu :focus-visible {
          outline: 2px solid currentColor;
          outline-offset: 4px;
          border-radius: 2px;
        }

        /* utility */
        .dbu-label {
          font-size: 11px;
          line-height: 1.3;
          letter-spacing: 0.012em;
          text-transform: uppercase;
          font-weight: 600;
          font-feature-settings: "tnum" 1;
        }
        .dbu-dim {
          opacity: 0.48;
        }
        /* section eyebrow — a quiet boxed label */
        .dbu-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 16px;
          border: 1px solid rgba(18, 18, 18, 0.28);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.55);
          font-size: 11px;
          line-height: 1.3;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 600;
          font-feature-settings: "tnum" 1;
          color: var(--ink);
        }
        .dbu.night .dbu-eyebrow {
          border-color: rgba(236, 234, 228, 0.35);
          background: rgba(236, 234, 228, 0.08);
        }
        .dbu-r {
          justify-self: end;
          text-align: right;
        }
        .dbu-u {
          background: linear-gradient(currentColor, currentColor) 100% 100% / 0 1px no-repeat;
          transition: background-size 0.7s var(--ease);
        }
        .dbu-u:hover,
        .dbu-u:focus-visible {
          background-position: 0 100%;
          background-size: 100% 1px;
        }
        .dbu-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          column-gap: var(--g);
          padding: 0 var(--m);
        }

        /* atmosphere */
        .dbu-sky {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: var(--paper);
          overflow: hidden;
          transition: background 0.7s var(--ease);
        }
        .dbu-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.55;
          will-change: transform;
        }
        .dbu-b1 {
          width: 46vw;
          height: 46vw;
          left: -8vw;
          top: 8vh;
          background: radial-gradient(circle, #c9d8ff 0%, rgba(201, 216, 255, 0) 70%);
          animation: dbu-drift1 26s ease-in-out infinite alternate;
        }
        .dbu-b2 {
          width: 38vw;
          height: 38vw;
          right: -6vw;
          top: 32vh;
          background: radial-gradient(circle, #ffd9ea 0%, rgba(255, 217, 234, 0) 70%);
          animation: dbu-drift2 32s ease-in-out infinite alternate;
        }
        .dbu-b3 {
          width: 30vw;
          height: 30vw;
          left: 30vw;
          bottom: -6vh;
          background: radial-gradient(circle, #d6f5ff 0%, rgba(214, 245, 255, 0) 70%);
          animation: dbu-drift3 38s ease-in-out infinite alternate;
        }
        .dbu.night .dbu-b1 {
          background: radial-gradient(circle, rgba(22, 61, 43, 0.9) 0%, rgba(22, 61, 43, 0) 70%);
        }
        .dbu.night .dbu-b2 {
          background: radial-gradient(circle, rgba(125, 249, 255, 0.14) 0%, rgba(125, 249, 255, 0) 70%);
        }
        .dbu.night .dbu-b3 {
          background: radial-gradient(circle, rgba(255, 79, 163, 0.12) 0%, rgba(255, 79, 163, 0) 70%);
        }
        @keyframes dbu-drift1 {
          to {
            transform: translate3d(6vw, 4vh, 0) scale(1.12);
          }
        }
        @keyframes dbu-drift2 {
          to {
            transform: translate3d(-5vw, -3vh, 0) scale(1.08);
          }
        }
        @keyframes dbu-drift3 {
          to {
            transform: translate3d(3vw, -5vh, 0) scale(1.16);
          }
        }

        .dbu-lines {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          column-gap: var(--g);
          padding: 0 var(--m);
          mix-blend-mode: difference;
        }
        .dbu-lines i {
          border-left: 1px solid rgba(255, 255, 255, 0.055);
        }
        .dbu-lines i:last-child {
          border-right: 1px solid rgba(255, 255, 255, 0.055);
        }

        .dbu-grain {
          position: fixed;
          left: -10%;
          top: -10%;
          width: 120%;
          height: 120%;
          z-index: 6;
          pointer-events: none;
          opacity: 0.06;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
        }
        .dbu.night .dbu-grain {
          mix-blend-mode: screen;
          opacity: 0.05;
        }
        @keyframes dbu-grain {
          0% {
            transform: translate3d(0, 0, 0);
          }
          20% {
            transform: translate3d(-3%, 2%, 0);
          }
          40% {
            transform: translate3d(2%, -4%, 0);
          }
          60% {
            transform: translate3d(-4%, -1%, 0);
          }
          80% {
            transform: translate3d(3%, 3%, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        /* header */
        .dbu > header {
          position: fixed;
          inset: 0 0 auto 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 14px var(--m);
          color: #121212;
          background: #eceae4;
          border-bottom: 1px solid rgba(18, 18, 18, 0.16);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.012em;
          text-transform: uppercase;
          line-height: 1.3;
        }
        .dbu > header nav {
          display: flex;
          gap: 20px;
        }
        .dbu-h-right {
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .dbu-time {
          display: inline-flex;
          gap: 0.55em;
          font-variant-numeric: tabular-nums;
        }
        .dbu-hamburger {
          display: none;
        }
        .dbu-snd {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          text-transform: uppercase;
          letter-spacing: 0.012em;
        }
        /* categories dropdown — a clean, quiet panel, outside the blend context */
        .dbu-cat {
          position: relative;
        }
        .dbu-cat-panel {
          position: fixed;
          width: 236px;
          z-index: 60;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid rgba(18, 18, 18, 0.12);
          box-shadow: 0 18px 50px rgba(18, 18, 18, 0.18);
          padding: 6px;
          mix-blend-mode: normal;
          animation: dbu-cat-in 0.28s var(--ease);
        }
        @keyframes dbu-cat-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
        }
        .dbu-cat-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.01em;
          color: #121212;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .dbu-cat-item svg {
          opacity: 0.35;
          transition: opacity 0.2s ease, transform 0.2s var(--ease);
        }
        .dbu-cat-item:hover {
          background: #f6f1e6;
          color: #163d2b;
        }
        .dbu-cat-item:hover svg {
          opacity: 0.9;
          transform: translateX(2px);
        }
        .dbu-snd svg {
          display: block;
          overflow: visible;
        }
        .dbu-snd .wave {
          transform-box: view-box;
          transform-origin: 50% 50%;
          transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .dbu-snd.on .wave {
          animation: dbu-wob 1.4s ease-in-out infinite;
        }
        @keyframes dbu-wob {
          0%,
          100% {
            transform: scaleY(0.55);
          }
          50% {
            transform: scaleY(1);
          }
        }

        /* hero */
        .dbu-hero {
          position: relative;
          z-index: 2;
          min-height: auto;
          display: flex;
          flex-direction: column;
          padding-top: calc(var(--top) + 6px);
          padding-bottom: 20px;
        }
        .dbu-hero-name {
          width: 100%;
          margin: 0;
          font-size: clamp(28px, 6.4vw, 104px);
          font-weight: 600;
          line-height: 1.05;
          letter-spacing: -0.025em;
          text-align: center;
          flex-shrink: 0;
          padding: 0 10px;
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }
        .dbu-line {
          display: block;
        }
        .dbu-ch {
          display: inline-block;
          will-change: transform, opacity;
        }
        html.js-anim .dbu-line.go .dbu-ch {
          animation: dbu-ch-up 1.15s cubic-bezier(0.2, 0.75, 0.2, 1) both;
          animation-delay: calc(var(--i, 0) * 22ms + 0.1s);
        }
        @keyframes dbu-ch-up {
          from {
            transform: translate3d(0, 1.05em, 0);
            opacity: 0;
          }
        }
        .dbu-em,
        .dbu-hero-name em,
        .dbu-say em,
        .dbu-dream h2 em {
          font-family: var(--font-instrument-serif), "Times New Roman", Georgia, serif;
          font-style: italic;
          font-weight: 400;
        }
        /* Hero marquee text: solid serif with a slow light sweep across it */
        .dbu-hero-name em {
          letter-spacing: -0.018em;
          font-size: 1.1em;
          line-height: 0.7;
          color: transparent;
          background-image: linear-gradient(
            110deg,
            var(--wcolor, #121212) 0%,
            var(--wcolor, #121212) 42%,
            #e9f7c8 50%,
            var(--wcolor, #121212) 58%,
            var(--wcolor, #121212) 100%
          );
          background-size: 260% 100%;
          background-position: 120% 0;
          -webkit-background-clip: text;
          background-clip: text;
          animation: dbu-shine 7s var(--ease) infinite;
        }
        @keyframes dbu-shine {
          0%,
          55% {
            background-position: 130% 0;
          }
          90%,
          100% {
            background-position: -30% 0;
          }
        }
        .dbu-hero-meta {
          position: absolute;
          left: 0;
          right: 0;
          bottom: clamp(18px, 3.4vh, 34px);
        }
        .dbu-hero-meta > span:nth-child(1) {
          grid-column: 1 / span 3;
        }
        .dbu-hero-meta > span:nth-child(2) {
          grid-column: 4 / span 3;
          line-height: 1.5;
        }
        .dbu-hero-hint {
          position: absolute;
          right: clamp(16px, 2.4vw, 34px);
          bottom: clamp(18px, 3.6vh, 36px);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* showreel plate — the BuiltByUmer film, full 16:9 frame */
        .dbu-reel {
          position: relative;
          aspect-ratio: 16 / 9;
          width: calc(100% - var(--m) * 2);
          max-width: 1220px;
          margin: 10px auto 0;
          border-radius: 24px;
          overflow: hidden;
          background: #d9d2c8;
          box-shadow: 0 30px 80px rgba(18, 18, 18, 0.14);
        }
        .dbu-reel video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .dbu-reel::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 24px;
          box-shadow: inset 0 0 0 1px rgba(18, 18, 18, 0.14);
          pointer-events: none;
        }
        .dbu-reel-shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(18, 18, 18, 0.12), transparent 30%, transparent 62%, rgba(18, 18, 18, 0.28) 100%);
          pointer-events: none;
          z-index: 1;
        }
        .dbu-reel .dbu-reel-x {
          color: #fff;
          mix-blend-mode: difference;
          z-index: 5;
          position: absolute;
          pointer-events: auto;
        }
        .dbu-reel-about {
          position: absolute;
          left: 7%;
          top: 50%;
          transform: translateY(-50%);
          max-width: min(420px, 40%);
          color: #fff;
          text-shadow: 0 2px 24px rgba(120, 20, 40, 0.45), 0 1px 3px rgba(0, 0, 0, 0.35);
          pointer-events: none;
          z-index: 2;
        }
        .dbu-reel-about > * {
          max-width: 100%;
          overflow-wrap: break-word;
          word-wrap: break-word;
          pointer-events: auto;
        }
        .dbu-reel-serif {
          margin-top: 12px;
          font-family: var(--font-instrument-serif), Georgia, serif;
          font-style: italic;
          font-weight: 400;
          font-size: clamp(27px, 2.8vw, 46px);
          line-height: 1.1;
          letter-spacing: -0.01em;
          color: #fff;
        }
        .dbu-reel-serif em {
          color: #c6f35c;
        }
        .dbu-reel-sub {
          margin-top: 14px;
          font-size: clamp(14px, 1.1vw, 16px);
          font-weight: 400;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.78);
          max-width: 40ch;
        }
        .dbu-reel-btn {
          margin-top: 22px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 13px 26px;
          border-radius: 999px;
          background: rgba(12, 12, 16, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.42);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          transition:
            background 0.3s var(--ease),
            color 0.3s var(--ease),
            border-color 0.3s var(--ease);
        }
        .dbu-reel-btn svg {
          transition: transform 0.3s var(--ease);
        }
        .dbu-reel-btn:hover {
          background: rgba(255, 255, 255, 0.94);
          color: #121212;
          border-color: rgba(255, 255, 255, 0.92);
        }
        .dbu-reel-btn:hover svg {
          transform: translateX(4px);
        }
        .dbu-reel-x {
          position: absolute;
          right: clamp(16px, 2.4vw, 34px);
          top: clamp(14px, 2.2vw, 26px);
        }
        .dbu-mouse {
          position: relative;
          display: block;
          width: 14px;
          height: 22px;
          border-radius: 999px;
          box-shadow: inset 0 0 0 1px rgba(127, 127, 127, 0.4);
        }
        .dbu-mouse > i {
          position: absolute;
          left: 5px;
          top: 4px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0;
          animation: dbu-mouse 1.9s cubic-bezier(0.45, 0, 0.3, 1) infinite;
        }
        @keyframes dbu-mouse {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          24% {
            opacity: 0.95;
          }
          66% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(9px);
            opacity: 0;
          }
        }

        /* about */
        .dbu-about {
          position: relative;
          z-index: 2;
          padding: clamp(60px, 10vh, 100px) 0 clamp(40px, 8vh, 80px);
        }
        .dbu-head {
          margin-bottom: 0;
        }
        .dbu-say {
          margin: clamp(34px, 6vh, 70px) 0 0;
          padding: 0 var(--m);
          max-width: calc(100% * 8.6 / 12 + var(--m));
          font-weight: 600;
          font-size: clamp(30px, 3.55vw, 68px);
          line-height: 0.98;
          letter-spacing: -0.045em;
          text-transform: uppercase;
        }
        .dbu-say-line {
          display: block;
        }
        .dbu-say em {
          text-transform: none;
          letter-spacing: -0.02em;
          font-size: 1.12em;
          line-height: 0.8;
        }
        .dbu-bio {
          margin-top: clamp(60px, 10vh, 120px);
          row-gap: 28px;
        }
        .dbu-bio-col {
          grid-column: 1 / span 4;
        }
        .dbu-bio-col + .dbu-bio-col {
          grid-column: 5 / span 4;
        }
        .dbu-lead {
          margin: 0 0 18px;
          font-weight: 500;
          font-size: clamp(20px, 1.6vw, 28px);
          line-height: 1.18;
          letter-spacing: -0.022em;
        }
        .dbu-bio p {
          font-size: 15px;
          line-height: 1.62;
        }
        .dbu-bio p + p {
          margin-top: 14px;
          opacity: 0.72;
        }

        /* disciplines */
        .dbu-disc {
          position: relative;
          z-index: 2;
          padding: clamp(60px, 10vh, 120px) 0 clamp(100px, 16vh, 190px);
        }
        .dbu-dl {
          list-style: none;
          margin: clamp(40px, 7vh, 80px) 0 0;
          padding: 0 var(--m);
          width: calc((100% - 2 * var(--m)) * 8 / 12 + 2 * var(--m));
        }
        .dbu-dl li {
          display: grid;
          grid-template-columns: 3.2em minmax(0, 1fr) auto;
          column-gap: var(--g);
          align-items: end;
          padding: clamp(14px, 2.2vh, 24px) 0 clamp(12px, 1.8vh, 20px);
          border-top: 1px solid var(--rule);
        }
        .dbu-dl li:last-child {
          border-bottom: 1px solid var(--rule);
        }
        .dbu-dl .dbu-n {
          padding-bottom: 0.6em;
        }
        .dbu-t {
          font-weight: 600;
          font-size: clamp(40px, 5.2vw, 100px);
          line-height: 0.86;
          letter-spacing: -0.05em;
          text-transform: uppercase;
          transition: opacity 0.4s var(--ease);
        }
        .dbu-t:hover {
          opacity: 0.55;
        }
        .dbu-d {
          justify-self: end;
          text-align: right;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.012em;
          text-transform: uppercase;
          padding-bottom: 0.6em;
          opacity: 0.8;
        }

        /* toolbox carousel section */
        .dbu-box {
          position: relative;
          z-index: 2;
          padding: 0 0 clamp(40px, 6vh, 80px);
        }
        .dbu-box .dbu-head {
          padding-bottom: clamp(28px, 5vh, 60px);
          flex-wrap: wrap;
          gap: 10px;
        }
        .dbu-box .dbu-r {
          white-space: nowrap;
          overflow: visible;
          max-width: 100%;
        }

        /* works (pinned horizontal) */
        .dbu-works {
          position: relative;
          z-index: 2;
          height: 320vh;
        }
        .dbu-works-pin {
          position: sticky;
          top: 0;
          height: 100vh;
          height: 100svh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .dbu-works-head {
          padding-top: var(--top);
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .dbu-works-track {
          display: flex;
          height: 100%;
          will-change: transform;
        }
        .dbu-work {
          flex: 0 0 100vw;
          height: 100%;
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 6vw;
          align-items: center;
          padding: 0 var(--m) 8vh;
        }
        .dbu-work .dbu-k {
          display: block;
          margin-bottom: 18px;
        }
        .dbu-title {
          font-weight: 600;
          font-size: clamp(46px, 5.4vw, 104px);
          line-height: 0.86;
          letter-spacing: -0.055em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .dbu-meta {
          display: grid;
          grid-template-columns: max-content 1fr;
          gap: 6px 26px;
          margin: 22px 0 0;
          font-size: 13px;
          line-height: 1.4;
        }
        .dbu-meta dt {
          font-weight: 600;
          font-size: 10.5px;
          letter-spacing: 0.012em;
          text-transform: uppercase;
          opacity: 0.48;
          padding-top: 1px;
        }
        .dbu-meta dd {
          margin: 0;
        }
        .dbu-open {
          display: inline-flex;
          align-items: baseline;
          gap: 0.55em;
          margin-top: 26px;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.012em;
          text-transform: uppercase;
        }
        .dbu-open .dbu-ul {
          background: linear-gradient(currentColor, currentColor) 0 100% / 100% 1px no-repeat;
          padding-bottom: 0.3em;
          transition: background-size 0.8s var(--ease);
        }
        .dbu-open:hover .dbu-ul {
          background-size: 0 1px;
          background-position: 100% 100%;
        }
        .dbu-open .dbu-arr {
          display: inline-block;
          transition: transform 0.6s var(--ease);
        }
        .dbu-open:hover .dbu-arr {
          transform: translateX(5px);
        }
        .dbu-plate {
          position: relative;
          aspect-ratio: 2732 / 1746;
          overflow: hidden;
          background: rgba(18, 18, 18, 0.06);
          margin: 0;
        }
        .dbu-plate img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 1.2s var(--ease);
        }
        .dbu-plate:hover img {
          transform: scale(1.035);
        }
        .dbu-plate::after {
          content: "";
          position: absolute;
          inset: 0;
          box-shadow: inset 0 0 0 1px rgba(18, 18, 18, 0.08);
          pointer-events: none;
        }

        /* dream */
        .dbu-dream {
          position: relative;
          z-index: 2;
          min-height: 100vh;
          background: var(--night);
          color: #eceae4;
          display: grid;
          place-content: center;
          justify-items: center;
          text-align: center;
          padding: 120px var(--m);
          overflow: hidden;
        }
        .dbu-dream::before {
          content: "";
          position: absolute;
          width: 70vw;
          height: 70vw;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(
            circle,
            rgba(125, 249, 255, 0.14) 0%,
            rgba(255, 79, 163, 0.12) 40%,
            rgba(7, 8, 26, 0) 70%
          );
          filter: blur(20px);
        }
        .dbu-dream .dbu-label {
          margin-bottom: 36px;
          opacity: 0.6;
        }
        .dbu-dream h2 {
          position: relative;
          font-size: clamp(34px, 4.4vw, 80px);
          line-height: 1.02;
          letter-spacing: -0.02em;
          max-width: 16ch;
        }
        .dbu-cta {
          position: relative;
          margin-top: 48px;
          display: inline-flex;
          align-items: center;
          gap: 11px;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.012em;
          text-transform: uppercase;
          padding: 14px 26px;
          border-radius: 999px;
          color: #eceae4;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(34, 32, 48, 0.42));
          box-shadow:
            inset 0 0.5px 0 rgba(255, 255, 255, 0.45),
            inset 0 0 0 0.5px rgba(255, 255, 255, 0.16),
            0 10px 28px rgba(0, 0, 0, 0.34);
          transition: transform 0.5s var(--ease), box-shadow 0.5s var(--ease);
        }
        .dbu-cta:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow:
            inset 0 0.5px 0 rgba(255, 255, 255, 0.6),
            inset 0 0 0 0.5px rgba(255, 255, 255, 0.24),
            0 16px 38px rgba(0, 0, 0, 0.4),
            0 0 24px rgba(160, 130, 255, 0.22);
        }
        .dbu-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: conic-gradient(from 200deg, #ff9ee8, #b98cff, #7df9ff, #b98cff, #ff9ee8);
          box-shadow: 0 0 12px rgba(185, 140, 255, 0.8);
          animation: dbu-pulse 2.4s ease-in-out infinite;
        }
        @keyframes dbu-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
          }
        }

        /* stats */
        .dbu-stats {
          position: relative;
          z-index: 2;
          padding: clamp(50px, 8vh, 80px) 0 clamp(40px, 7vh, 80px);
        }
        .dbu-rnum {
          margin: clamp(20px, 4vh, 40px) 0 0;
          padding: 0 var(--m);
          font-weight: 600;
          font-size: min(24vw, 44vh);
          line-height: 0.8;
          letter-spacing: -0.07em;
        }
        .dbu-slist {
          list-style: none;
          margin: clamp(28px, 5vh, 56px) 0 0;
          padding: 0 var(--m);
        }
        .dbu-srow {
          display: grid;
          grid-template-columns: 4em minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1.3fr);
          gap: var(--g);
          align-items: baseline;
          padding: 13px 0;
          border-top: 1px solid var(--rule);
          transition: background 0.3s, opacity 0.3s;
        }
        .dbu-srow:last-child {
          border-bottom: 1px solid var(--rule);
        }
        .dbu-srow > span {
          font-weight: 500;
          font-size: clamp(12px, 0.92vw, 14.5px);
          line-height: 1.25;
          letter-spacing: -0.006em;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .dbu-sy,
        .dbu-so {
          color: var(--dim);
          font-variant-numeric: tabular-nums;
        }
        .dbu-srow:hover {
          background: rgba(18, 18, 18, 0.04);
        }
        .dbu.night .dbu-srow:hover {
          background: rgba(236, 234, 228, 0.05);
        }
        .dbu-srow:hover .dbu-sy,
        .dbu-srow:hover .dbu-so {
          color: inherit;
        }

        /* contact */
        .dbu-contact {
          position: relative;
          z-index: 2;
          padding: clamp(60px, 12vh, 100px) 0 0;
        }
        .dbu-hello {
          margin: clamp(24px, 5vh, 60px) 0 0;
          padding: 0 var(--m);
          font-weight: 600;
          font-size: clamp(40px, 13.5vw, 220px);
          line-height: 0.8;
          letter-spacing: -0.065em;
          text-transform: uppercase;
        }
        .dbu-hello-line {
          display: block;
        }
        .dbu-ctl {
          margin-top: clamp(56px, 10vh, 120px);
          row-gap: 40px;
          align-items: start;
        }
        .dbu-ctl > div {
          display: grid;
          gap: 12px;
          align-content: start;
          min-width: 0;
        }
        .dbu-c1 {
          grid-column: 1 / span 6;
        }
        .dbu-c2 {
          grid-column: 7 / span 2;
        }
        .dbu-c3 {
          grid-column: 10 / span 3;
        }
        .dbu-big {
          font-weight: 500;
          font-size: clamp(24px, 2.6vw, 46px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          justify-self: start;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .dbu-big .dbu-u {
          background: linear-gradient(currentColor, currentColor) 0 100% / 100% 2px no-repeat;
          padding-bottom: 0.08em;
          transition: background-size 0.8s var(--ease);
        }
        .dbu-big:hover .dbu-u {
          background-size: 0 2px;
          background-position: 100% 100%;
        }
        .dbu-foot {
          margin-top: clamp(70px, 12vh, 140px);
          padding-top: 22px;
          padding-bottom: 28px;
          align-items: baseline;
        }
        .dbu-foot > span {
          grid-column: 1 / span 6;
        }
        .dbu-foot > a {
          grid-column: 10 / span 3;
        }

        /* reveal */
        .dbu-reveal {
          transition: opacity 1.1s var(--ease), transform 1.3s var(--ease), filter 1.4s var(--ease);
          transition-delay: calc(var(--d, 0) * 1s);
        }
        .dbu-reveal.arm:not(.in) {
          opacity: 0;
          transform: translate3d(0, 24px, 0);
        }

        /* cursor */
        .dbu-cursor {
          position: fixed;
          left: 0;
          top: 0;
          z-index: 9999;
          pointer-events: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #fff;
          mix-blend-mode: difference;
          transform: translate(-50%, -50%);
          transition: width 0.35s var(--ease), height 0.35s var(--ease), opacity 0.3s;
          opacity: 0;
        }
        body.dbu-has-cursor .dbu-cursor {
          opacity: 1;
        }
        .dbu-cursor.dbu-big {
          width: 64px;
          height: 64px;
        }
        @media (hover: none), (pointer: coarse) {
          .dbu-cursor {
            display: none;
          }
        }

        /* responsive */
        @media (max-width: 900px) {
          .dbu-works {
            height: auto;
          }
          .dbu-works-pin {
            position: static;
            height: auto;
            overflow: visible;
          }
          .dbu-works-track {
            flex-direction: column;
            height: auto;
            transform: none !important;
          }
          .dbu-work {
            flex: auto;
            height: auto;
            grid-template-columns: 1fr;
            padding: 64px var(--m);
            gap: 32px;
          }
          .dbu-plate {
            order: -1;
          }
        }
        @media (max-width: 759px) {
          .dbu {
            --m: 18px;
            --g: 0px;
          }
          .dbu-hamburger {
            display: flex;
            z-index: 55;
          }
          .dbu-lines {
            grid-template-columns: repeat(6, 1fr);
          }
          .dbu-lines i:nth-child(n + 7) {
            display: none;
          }
          .dbu > header nav,
          .dbu-h-right .dbu-time {
            display: none;
          }
          .dbu-hamburger {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 5px;
            width: 44px;
            height: 44px;
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0;
            min-height: 44px;
            min-width: 44px;
          }
          .dbu-hamburger-line {
            display: block;
            width: 22px;
            height: 2px;
            background: #121212;
            border-radius: 1px;
            transition: transform 0.3s ease, opacity 0.3s ease;
          }
          .dbu-mobile-menu {
            top: 60px !important;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 50;
            background: #eceae4;
            padding: 24px 18px;
            padding-bottom: 60px;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            display: flex;
            flex-direction: column;
            gap: 8px;
            animation: dbu-menu-in 0.3s ease;
          }
          @keyframes dbu-menu-in {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
          }
          .dbu-mobile-link {
            display: block;
            padding: 14px 0;
            font-size: 18px;
            font-weight: 600;
            color: #121212;
            border-bottom: 1px solid rgba(18, 18, 18, 0.1);
            text-decoration: none;
            min-height: 44px;
            line-height: 44px;
          }
          .dbu-mobile-link:hover {
            color: #163d2b;
          }
          .dbu-mobile-cats {
            margin-top: 16px;
            display: flex;
            flex-direction: column;
          }
          .dbu-mobile-cats-label {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(18, 18, 18, 0.48);
            margin-bottom: 8px;
          }
          .dbu-mobile-cats .dbu-mobile-link {
            font-size: 15px;
            font-weight: 500;
            padding: 10px 0;
          }

          /* ── Remove full-height sections on mobile ── */
          .dbu-hero {
            min-height: auto !important;
            padding-top: 62px !important;
            padding-bottom: 12px !important;
          }
          .dbu-hero-name {
            font-size: clamp(24px, 9vw, 48px) !important;
            line-height: 1.1 !important;
            word-break: break-word !important;
            white-space: normal !important;
          }
          .dbu-reel {
            min-height: 180px !important;
            margin: 8px 8px 8px !important;
            border-radius: 14px;
          }
          .dbu-reel-shade {
            pointer-events: none;
            z-index: 1;
          }
          .dbu-reel-about {
            left: 12px !important;
            right: 12px !important;
            top: auto !important;
            bottom: 8px !important;
            transform: none !important;
            max-width: 100% !important;
            z-index: 2;
          }
          .dbu-reel-about > * {
            max-width: 100%;
            word-break: break-word;
            overflow-wrap: break-word;
          }
          .dbu-reel-serif {
            font-size: clamp(12px, 3.5vw, 20px) !important;
            line-height: 1.2 !important;
            margin-top: 6px !important;
          }
          .dbu-reel-sub {
            display: none !important;
          }
          .dbu-reel-btn {
            padding: 8px 16px !important;
            font-size: 11px !important;
            min-height: 44px;
            min-width: 44px;
            touch-action: manipulation;
          }
          .dbu-reel-x {
            top: 8px !important;
            right: 10px !important;
            z-index: 5;
            pointer-events: auto;
            min-height: 44px;
            min-width: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Reduce all section gaps significantly */
          .dbu-about {
            padding: 24px 0 16px !important;
          }
          .dbu-say {
            max-width: none !important;
            font-size: 6vw !important;
            margin-top: 10px !important;
          }
          .dbu-bio {
            margin-top: 16px !important;
          }
          .dbu-bio-col,
          .dbu-bio-col + .dbu-bio-col {
            grid-column: 1 / -1 !important;
          }
          .dbu-bio p {
            font-size: 13px;
            word-break: break-word;
          }
          .dbu-lead {
            font-size: clamp(14px, 3vw, 18px) !important;
          }

          .dbu-box {
            padding: 16px 0 16px !important;
          }
          .dbu-box .dbu-head {
            padding-bottom: 8px !important;
          }
          .dbu-rnum {
            font-size: 28vw !important;
          }

          .dbu-stats {
            padding: 16px 0 12px !important;
          }
          .dbu-slist {
            margin-top: 12px !important;
          }
          .dbu-srow {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
            padding: 12px 0 !important;
          }
          .dbu-srow .dbu-sy {
            display: none;
          }
          .dbu-srow .dbu-sp {
            grid-column: 1 !important;
            grid-row: 1 !important;
            font-size: 15px !important;
          }
          .dbu-srow .dbu-so {
            grid-column: 1 !important;
            grid-row: 2 !important;
          }
          .dbu-srow .dbu-shn {
            grid-column: 1 !important;
            grid-row: 3 !important;
            font-size: 12px !important;
            margin-top: 4px !important;
          }

          .dbu-contact {
            padding: 24px 0 0 !important;
          }
          .dbu-hello {
            font-size: 12vw !important;
            margin-top: 12px !important;
          }
          .dbu-ctl {
            margin-top: 16px !important;
          }
          .dbu-c1,
          .dbu-c2,
          .dbu-c3 {
            grid-column: 1 / -1 !important;
          }
          .dbu-big {
            font-size: clamp(16px, 4vw, 24px) !important;
            word-break: break-word !important;
          }

          /* Works section mobile - REMOVE 320vh height */
          .dbu-works {
            height: auto !important;
            min-height: auto !important;
          }
          .dbu-works-pin {
            position: static !important;
            height: auto !important;
            overflow: visible !important;
          }
          .dbu-works-track {
            flex-direction: column !important;
            height: auto !important;
            transform: none !important;
          }
          .dbu-work {
            flex: auto !important;
            height: auto !important;
            grid-template-columns: 1fr !important;
            padding: 24px var(--m) !important;
            gap: 16px !important;
          }
          .dbu-plate {
            order: -1 !important;
          }
          .dbu-title {
            font-size: clamp(24px, 7vw, 40px) !important;
            word-break: break-word !important;
          }

          /* Dream section mobile */
          .dbu-dream {
            min-height: auto !important;
            padding: 48px var(--m) !important;
          }

          /* Ensure buttons are tappable */
          a, button {
            min-height: 44px;
            touch-action: manipulation;
          }
          .dbu-u {
            min-height: 44px;
            display: inline-flex;
            align-items: center;
          }
          .dbu-snd {
            min-height: 44px;
            min-width: 44px;
            display: inline-flex;
            align-items: center;
          }

          /* Fix horizontal scroll */
          .dbu {
            overflow-x: hidden !important;
            max-width: 100vw !important;
          }

          /* Footer */
          .dbu-foot > span,
          .dbu-foot > a {
            grid-column: 1 / -1 !important;
          }

          /* Header mobile - fix squeeze */
          .dbu > header {
            padding: 10px var(--m) !important;
            gap: 8px !important;
          }
          .dbu > header .dbu-u,
          .dbu-time {
            display: none !important;
          }
          .dbu-hamburger {
            min-height: 44px !important;
            min-width: 44px !important;
          }
          .dbu-mobile-menu {
            top: 60px !important;
          }
          /* Footer - remove large margin-top on mobile */
          .dbu-foot {
            margin-top: 20px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .dbu *,
          .dbu *::before,
          .dbu *::after {
            animation-duration: 0.01s !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01s !important;
          }
          .dbu-ch {
            transform: none !important;
            opacity: 1 !important;
          }
          .dbu-hero-name em {
            background-image: none;
            color: var(--wcolor, #121212);
          }
        }
      ` }} />
    </section>
  );
}
