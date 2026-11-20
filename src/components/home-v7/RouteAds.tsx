"use client";

import Link from "next/link";
import { AdSlot, ADS_ENABLED } from "@/components/advertisements/AdSlot";

/**
 * Route 145 ad placements. AdSlot renders NOTHING while
 * SITE.adsEnabled is false, so these wrappers add no visible box,
 * no reserved space and no layout shift until the user activates
 * ads after AdSense approval. When enabled, each slot is a
 * labelled, reserved min-height box with a 25–30px buffer from
 * buttons, nav, search and download links (AdSense policy).
 */

/** Leaderboard, directly after the hub map + search. */
export function LeaderboardAd() {
  return (
    <AdSlot
      id="leaderboard"
      className="mx-auto my-10 min-h-[110px] w-full max-w-7xl px-5 sm:px-8"
    />
  );
}

/** In-feed native, mid-route among the stops — styled like a tool card. */
export function InFeedAd() {
  return (
    <AdSlot
      id="in-feed"
      className="mx-auto my-12 min-h-[280px] w-full max-w-3xl rounded-3xl border-2 border-dashed border-[#2a2118]/25 bg-white/60 px-6 py-6"
    />
  );
}

/** Mobile sticky anchor — only rendered at all once ads are on. */
export function MobileAnchorAd() {
  if (!ADS_ENABLED) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[#2a2118] bg-[#fdf6e3] md:hidden">
      <AdSlot id="anchor" className="mx-auto min-h-[64px] w-full max-w-xl px-3 py-1" />
    </div>
  );
}
