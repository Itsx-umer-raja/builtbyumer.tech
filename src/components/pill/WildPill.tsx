"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * WildPill — the reveal hero: a hairline between the halves of "UMER"
 * opens into a slit, then a circle, then a wide stadium pill showing the
 * floating-island scene, while the nav drops in and the footer bar rises.
 * Replays on the pill button. Sized in em where 1em = the word font size.
 */

const ISLAND_VIDEO =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/175fbbcd-e50a-480c-bab2-ca16d4678322.mp4";
const ISLAND_POSTER =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/726b168c-da47-4682-a255-cc3e02f89bae.jpg";

const CURVES = Array.from({ length: 15 }, (_, i) => {
  const y = 4 + i * 6.4;
  const w = 1.2 + ((i * 37) % 19) / 8; // 1.2 – 3.6 px
  const o = 0.55 + ((i * 23) % 10) / 29; // .55 – .85
  return { y, w, o };
});

export function WildPill() {
  const rootRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const hairRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const footRef = useRef<HTMLElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tlRef = useRef<Animation | null>(null);
  const wavesRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const pill = pillRef.current;
    const hero = heroRef.current;
    if (!root || !pill || !hero) return;
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      new URLSearchParams(window.location.search).get("motion") !== "full";
    const phone = () => window.matchMedia("(max-width: 720px)").matches;

    const fs = () => parseFloat(getComputedStyle(hero).fontSize);

    const pillEl = pill;
    const heroEl = hero;

    function setFinal() {
      pillEl.style.width = phone() ? "calc(100vw - 40px)" : "3.62em";
      pillEl.style.clipPath = "inset(0 0 0 0)";
      hairRef.current && (hairRef.current.style.opacity = "0");
      bgRef.current && (bgRef.current.style.opacity = "1");
      navRef.current && (navRef.current.style.transform = "none");
      footRef.current && (footRef.current.style.transform = "none");
      ruleRef.current && (ruleRef.current.style.transform = "scaleX(1)");
      iconsRef.current && (iconsRef.current.style.opacity = "0.85");
      heroEl.style.gap = "0.085em";
      heroEl.style.setProperty("--vgap", "0.1em");
    }

    function playTimeline(reverse: boolean) {
      const fsz = fs();
      const finalW = phone() ? window.innerWidth - 40 : 3.62 * fsz;
      const DUR = 2100;
      if (reverse) {
        pillEl.style.width = finalW + "px";
        pillEl.animate(
          [
            { width: finalW + "px" },
            { width: 1.81 * fsz + "px", offset: 0.42, clipPath: "inset(0 0 0 0)" },
            { width: 0.16 * fsz + "px", offset: 0.7, clipPath: "inset(50% 0 50% 0)" },
            { width: 0.012 * fsz + "px", clipPath: "inset(50% 0 50% 0)" },
          ],
          { duration: DUR, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" },
        );
        return;
      }
      const anim = pillEl.animate(
        [
          { width: "0.012em", clipPath: "inset(50% 0 50% 0)", offset: 0, easing: "cubic-bezier(.5,0,.3,1)" },
          { width: "0.012em", clipPath: "inset(50% 0 50% 0)", offset: 0.14 },
          { width: "0.16em", clipPath: "inset(0 0 0 0)", offset: 0.3, easing: "cubic-bezier(.45,0,.3,1)" },
          { width: "1.81em", clipPath: "inset(0 0 0 0)", offset: 0.58, easing: "cubic-bezier(.4,0,.2,1)" },
          { width: phone() ? "calc(100vw - 40px)" : "3.62em", clipPath: "inset(0 0 0 0)" },
        ],
        { duration: DUR, fill: "forwards" },
      );
      tlRef.current = anim;
      const hairEl = hairRef.current;
      if (hairEl) {
        hairEl.animate([{ opacity: 1 }, { opacity: 1, offset: 0.14 }, { opacity: 0, offset: 0.3 }, { opacity: 0 }], {
          duration: DUR,
          fill: "forwards",
        });
      }
      if (!phone()) {
        heroEl.animate(
          [
            { gap: "0.026em" },
            { gap: "0.026em", offset: 0.14, easing: "cubic-bezier(.45,0,.3,1)" },
            { gap: "0.05em", offset: 0.58 },
            { gap: "0.085em" },
          ],
          { duration: DUR, fill: "forwards" },
        );
      }
      const bg = bgRef.current;
      if (bg) {
        bg.animate([{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1, offset: 0.78 }], {
          duration: DUR,
          fill: "forwards",
        });
      }
      const nav = navRef.current;
      if (nav) {
        nav.animate(
          [
            { transform: "translateY(-140%)" },
            { transform: "translateY(-140%)", offset: 0.5, easing: "cubic-bezier(.2,.8,.2,1)" },
            { transform: "none" },
          ],
          { duration: DUR, fill: "forwards" },
        );
      }
      const foot = footRef.current;
      if (foot) {
        foot.animate(
          [
            { transform: "translateY(160%)" },
            { transform: "translateY(160%)", offset: 0.52, easing: "cubic-bezier(.2,.8,.2,1)" },
            { transform: "none" },
          ],
          { duration: DUR, fill: "forwards" },
        );
      }
      const rule = ruleRef.current;
      if (rule) {
        rule.animate(
          [
            { transform: "scaleX(0)" },
            { transform: "scaleX(0)", offset: 0.4, easing: "cubic-bezier(.2,.8,.2,1)" },
            { transform: "scaleX(1)" },
          ],
          { duration: DUR, fill: "forwards" },
        );
      }
      const icons = iconsRef.current;
      if (icons) {
        icons.animate([{ opacity: 0 }, { opacity: 0, offset: 0.8 }, { opacity: 0.85 }], {
          duration: DUR,
          fill: "forwards",
        });
      }
      const video = videoRef.current;
      if (video) video.play().catch(() => {});
    }

    function start() {
      if (reduced) {
        setFinal();
        return;
      }
      playTimeline(false);
    }

    if (document.fonts?.ready) document.fonts.ready.then(() => start());
    else start();

    /* speaker waves */
    const speaker = root.querySelector<HTMLButtonElement>(".wp-speaker");
    const onSpeaker = () => {
      wavesRef.current && wavesRef.current.classList.toggle("muted");
      speaker && speaker.classList.toggle("off");
    };
    speaker && speaker.addEventListener("click", onSpeaker);

    /* pause the video off-screen */
    const video = videoRef.current;
    const io = new IntersectionObserver(([en]) => {
      if (!video) return;
      if (en.isIntersecting) {
        if (!reduced) video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
    io.observe(pill);

    const onResize = () => {
      tlRef.current && tlRef.current.finish();
      setFinal();
    };
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
      speaker && speaker.removeEventListener("click", onSpeaker);
    };
  }, []);

  return (
    <section ref={rootRef} className="wp-root" aria-label="Built by Umer — island reveal">
      <div ref={bgRef} className="wp-bg" aria-hidden>
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
          {CURVES.map((c, i) => (
            <path
              key={i}
              d={`M -80 ${900 - c.y} C 300 ${900 - c.y - 210 - i * 9}, 760 ${900 - c.y + 130 - i * 12}, 1520 ${180 - c.y * 2.4 - i * 14}`}
              style={{ strokeWidth: c.w, opacity: c.o }}
            />
          ))}
        </svg>
      </div>

      <nav ref={navRef} className="wp-nav">
        <div className="wp-nav-l">
          <a href="/">Home</a>
          <a href="/tools">Tools</a>
          <a href="/#categories">Categories</a>
          <a href="/#about">About</a>
        </div>
        <div className="wp-nav-r">
          <a href="/tools">All tools ↗</a>
          <a href="/#contact">Contact ↗</a>
        </div>
      </nav>

      <div ref={heroRef} className="wp-hero">
        <p className="wp-kick">Built by</p>
        <span className="wp-word">UM</span>
        <div ref={pillRef} className="wp-pill">
          <video
            ref={videoRef}
            className="wp-video"
            src={ISLAND_VIDEO}
            poster={ISLAND_POSTER}
            muted
            loop
            playsInline
            preload="none"
            aria-label="A floating island with a waterfall pouring over sunset clouds"
          />
          <div ref={hairRef} className="wp-hair" aria-hidden />
          <div ref={iconsRef} className="wp-icons" aria-hidden>
            <svg className="wp-breeze" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 8h11a2.5 2.5 0 1 0-2.4-3.2M3 12h15a2.6 2.6 0 1 1-2.5 3.4M3 16h8a2.3 2.3 0 1 1-2.2 3" />
            </svg>
            <button type="button" className="wp-speaker" aria-label="Toggle sound waves">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6.5 8.5H3v7h3.5L11 19V5Z" />
              </svg>
              <svg ref={wavesRef} className="wp-waves" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7.4 7.4 0 0 1 0 10" />
              </svg>
            </button>
          </div>
        </div>
        <span className="wp-word">ER</span>
      </div>

      <footer ref={footRef} className="wp-foot">
        <p className="wp-note">
          <b>E</b>very tool. One destination. BuiltByUmer packs 145 free utilities that run entirely in
          your browser — nothing uploaded, nothing installed, nothing to pay for.
        </p>
        <div ref={ruleRef} className="wp-rule" aria-hidden />
        <Link href="/tools" className="wp-replay" data-cursor="button">
          Explore the tools
        </Link>
      </footer>
      <style href="st-wildpill-1" precedence="high" dangerouslySetInnerHTML={{ __html: `
        .wp-root {
          position: relative;
          min-height: 100svh;
          overflow: hidden;
          background: #ffffff;
          --wp-ink: #121212;
          --wp-fs: min(19.6vh, 13.2vw);
        }
        .wp-bg {
          position: absolute;
          inset: 0;
          background: #eceae4;
          opacity: 1;
          transition: opacity 0.5s ease;
        }
        html.js-anim .wp-bg {
          opacity: 0;
        }
        .wp-bg svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .wp-bg path {
          fill: none;
          stroke: #ffffff;
          stroke-linecap: round;
        }
        .wp-nav {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 4;
          display: flex;
          justify-content: space-between;
          padding: calc(var(--wp-fs) * 0.14) calc(var(--wp-fs) * 0.27);
          font-size: max(12px, calc(var(--wp-fs) * 0.072));
          font-weight: 500;
          color: var(--wp-ink);
        }
        .wp-nav a {
          color: inherit;
          text-decoration: none;
          opacity: 0.85;
          transition: opacity 0.2s;
        }
        .wp-nav a:hover {
          opacity: 1;
        }
        .wp-nav-l,
        .wp-nav-r {
          display: flex;
          gap: 1.9em;
        }
        .wp-hero {
          position: absolute;
          left: 50%;
          top: 43%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          gap: 0.026em;
          font-size: var(--wp-fs);
          font-family: var(--font-inter-tight), sans-serif;
        }
        .wp-kick {
          position: absolute;
          top: -1.55em;
          left: 0.02em;
          margin: 0;
          font-size: 0.085em;
          font-weight: 600;
          letter-spacing: 0.42em;
          text-transform: uppercase;
          color: #3a3a3a;
        }
        .wp-word {
          font-weight: 800;
          letter-spacing: -0.045em;
          line-height: 0.8;
          color: var(--wp-ink);
          white-space: nowrap;
        }
        .wp-pill {
          position: relative;
          height: 1.81em;
          width: 3.62em;
          border-radius: 999px;
          overflow: hidden;
          background: #d8d3cf;
        }
        html.js-anim .wp-pill {
          width: 0.012em;
          clip-path: inset(50% 0 50% 0);
        }
        .wp-video {
          position: absolute;
          top: 0;
          left: 50%;
          height: 100%;
          min-width: 4.2em;
          transform: translateX(-50%);
          object-fit: cover;
          object-position: center top;
        }
        .wp-hair {
          position: absolute;
          inset: 0;
          background: #b9b5ae;
          opacity: 0;
          pointer-events: none;
        }
        html.js-anim .wp-hair {
          opacity: 1;
        }
        .wp-icons {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.16em;
          color: #ffffff;
          opacity: 0.85;
          pointer-events: none;
        }
        html.js-anim .wp-icons {
          opacity: 0;
        }
        .wp-breeze {
          width: 0.16em;
          height: 0.16em;
        }
        .wp-speaker {
          display: flex;
          align-items: center;
          gap: 0.02em;
          background: none;
          border: 0;
          padding: 0;
          color: #ffffff;
          cursor: pointer;
          pointer-events: auto;
        }
        .wp-speaker svg {
          width: 0.16em;
          height: 0.16em;
        }
        .wp-speaker .wp-waves {
          transition: opacity 0.25s;
        }
        .wp-speaker.off .wp-waves {
          opacity: 0.15;
        }
        .wp-foot {
          position: absolute;
          left: calc(var(--wp-fs) * 0.27);
          right: calc(var(--wp-fs) * 0.27);
          bottom: calc(var(--wp-fs) * 0.1);
          z-index: 4;
          display: flex;
          align-items: flex-end;
          gap: calc(var(--wp-fs) * 0.2);
        }
        .wp-note {
          width: calc(var(--wp-fs) * 1.42);
          margin: 0;
          font-size: max(12px, calc(var(--wp-fs) * 0.066));
          line-height: 1.45;
          color: #3a3a3a;
        }
        .wp-note b {
          font-size: 2.35em;
          font-weight: 650;
          color: var(--wp-ink);
          float: left;
          line-height: 0.8;
          margin-right: 0.06em;
        }
        .wp-rule {
          flex: 1;
          height: 1px;
          background: #a9a9a6;
          transform: scaleX(1);
          transform-origin: center;
        }
        html.js-anim .wp-rule {
          transform: scaleX(0);
        }
        .wp-replay {
          flex: none;
          background: #121212;
          color: #f4f2ec;
          text-decoration: none;
          border: 0;
          border-radius: 999px;
          padding: 0.9em 1.6em;
          font-size: max(12.5px, calc(var(--wp-fs) * 0.062));
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .wp-replay:hover {
          background: #000;
        }
        @media (max-width: 720px) {
          .wp-root {
            min-height: auto !important;
            --wp-fs: min(34vw, 16.5vh);
          }
          .wp-hero {
            top: 47%;
            flex-direction: column;
            gap: 0.03em;
            width: calc(100vw - 40px);
          }
          .wp-pill {
            width: calc(100vw - 40px);
            height: calc((100vw - 40px) / 1.85);
          }
          .wp-video {
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
          }
          .wp-kick {
            top: -1.35em;
            left: 0.04em;
          }
          .wp-nav-l a:nth-child(n + 4),
          .wp-nav-r {
            display: none;
          }
          .wp-nav {
            font-size: 12.5px;
            padding: 12px 16px;
          }
          .wp-foot {
            left: 16px;
            right: 16px;
            bottom: 12px;
            flex-wrap: wrap;
            gap: 10px;
          }
          .wp-note {
            width: 100%;
            font-size: 12px;
            line-height: 1.45;
          }
          .wp-rule {
            flex: 1;
          }
          .wp-replay {
            padding: 10px 18px;
            font-size: 12px;
            min-height: 44px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .wp-hair {
            opacity: 0;
          }
          .wp-bg {
            opacity: 1;
          }
        }
      ` }} />
    </section>
  );
}
