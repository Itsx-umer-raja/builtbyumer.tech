"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Category artwork with a sand-distortion transition between images:
 * feTurbulence + feDisplacementMap + blur animated over 900ms
 * (quartic entrance easing, cubic exit easing).
 */
export function SandTransitionImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const filterId = useId().replace(/[:]/g, "");
  const [current, setCurrent] = useState(src);
  const [prev, setPrev] = useState<string | null>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const blurRef = useRef<SVFGaussianBlurAlias>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (src === current) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the sand transition on src change
    setPrev(current);
    setCurrent(src);

    const t0 = performance.now();
    const DUR = 900;
    const easeInQuart = (t: number) => t * t * t * t;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / DUR);
      const scale =
        t < 0.5 ? easeInQuart(t * 2) * 150 : 150 - easeOutCubic((t - 0.5) * 2) * 150;
      dispRef.current?.setAttribute("scale", scale.toFixed(2));
      blurRef.current?.setAttribute("stdDeviation", (6 * Math.sin(Math.PI * t)).toFixed(2));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPrev(null);
        dispRef.current?.setAttribute("scale", "0");
        blurRef.current?.setAttribute("stdDeviation", "0");
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only when src changes
  }, [src]);

  return (
    <div className={className} style={{ position: "relative" }}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden focusable="false">
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="4" result="noise" seed="12" />
          <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" result="disp" />
          <feGaussianBlur ref={blurRef} in="disp" stdDeviation="0" />
        </filter>
      </svg>

      {prev && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={prev} alt="" aria-hidden className="w-full" draggable={false} />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current}
        alt={alt}
        className={"w-full " + (prev ? "absolute inset-0" : "")}
        style={prev ? { filter: `url(#${filterId})` } : undefined}
        draggable={false}
      />
    </div>
  );
}

// Alias so the blur ref type reads cleanly.
type SVFGaussianBlurAlias = SVGFEGaussianBlurElement;
