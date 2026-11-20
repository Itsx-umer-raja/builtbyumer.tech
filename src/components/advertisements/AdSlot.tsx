/**
 * Reusable advertising slot (Google AdSense).
 *
 * ADS_ENABLED stays false until Google AdSense is approved and the site
 * is hosted on a plan that permits commercial use. The slot renders
 * nothing while disabled — no fake advertisements, no empty boxes, ever.
 *
 * Once approved: flip SITE.adsEnabled in src/data/site.ts, then fill in
 * the numeric AdSense ad-unit ID for each slot via the `adUnitId` prop
 * (from the AdSense dashboard: Ads → By ad unit). Until an ad unit ID
 * is set, the <ins> element is rendered with data-ad-format="auto" and
 * no data-ad-slot, so AdSense serves nothing — the slot stays a
 * labelled, reserved min-height box and never shifts layout (CLS).
 * The account-level adsbygoogle.js script is already loaded in
 * src/app/layout.tsx (strategy afterInteractive); do not add another.
 */
"use client";

import { useEffect, useRef } from "react";
import { SITE } from "@/data/site";

export const ADS_ENABLED: boolean = SITE.adsEnabled;

const ADSENSE_CLIENT = "ca-pub-4227183622564894";

export function AdSlot({
  id,
  label = "Advertisement",
  className,
  adUnitId,
  format = "auto",
}: {
  id: string;
  label?: string;
  className?: string;
  /** Numeric AdSense ad-unit ID (e.g. "1234567890"). Leave unset until units exist. */
  adUnitId?: string;
  /** AdSense format: "auto" (responsive) or a fixed size like "horizontal". */
  format?: string;
}) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!ADS_ENABLED) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      // AdSense script not ready yet; the reserved box stays put and
      // the next navigation re-attempts the push.
    }
  }, []);

  if (!ADS_ENABLED) return null;

  return (
    <aside
      id={`ad-${id}`}
      aria-label={label}
      data-ad-slot={id}
      className={className ?? "my-8 min-h-[90px]"}
    >
      <span className="mb-2 block text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#141412]/40">
        {label}
      </span>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        {...(adUnitId ? { "data-ad-slot": adUnitId } : {})}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
