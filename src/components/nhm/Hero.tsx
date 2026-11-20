"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, SubNav } from "./Header";

const VIDEO_SRC = "/videos/valley-hero.mp4";

/** Vertical letter-rise mask per headline line. */
function RiseLine({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
        className="block"
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowVideo(true), 2800);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#fcfcfc]">
      {/* Background video with delayed reveal; clean #fcfcfc + floating shapes fallback */}
      <div className="absolute inset-0" aria-hidden>
        <motion.video
          initial={{ opacity: 0 }}
          animate={{ opacity: showVideo ? 1 : 0 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          src={VIDEO_SRC}
        />
        {/* subtle overlay for text readability */}
        <div className="absolute inset-0 bg-[#fcfcfc]/40" />
        {!showVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -16, 0], rotate: [0, 4, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              className="w-[46%] max-w-[520px] opacity-70"
            >
              <img src="/images/tools/network-tools.svg" alt="" className="w-full rounded-3xl" />
            </motion.div>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <Header />
        <SubNav />
      </div>

      {/* Left sidebar */}
      <div className="relative z-20 mt-14 w-full max-w-[520px] px-6 sm:mt-24 md:mt-32 md:px-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] tracking-[0.2em] text-[#111111]">01</span>
            <span className="h-px w-16 bg-[#111111]/40" />
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#888888] md:text-[11px]">
            Your digital toolbox
          </p>
        </motion.div>

        <h1 className="mt-4 font-sans text-[2.7rem] font-semibold uppercase leading-[0.95] tracking-tight text-[#111111] sm:text-[3.4rem] md:text-[4rem]">
          <RiseLine delay={0.15}>Everyday</RiseLine>
          <RiseLine delay={0.3}>Tools.</RiseLine>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-5 max-w-[320px] text-sm leading-relaxed text-[#111111]/70 sm:max-w-[380px] sm:text-base"
        >
          Convert documents, compress images, create QR codes and simplify your daily digital work
          in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-7"
        >
          <Link
            href="/tools"
            className="group relative inline-flex items-center gap-3 overflow-hidden bg-[#111111] px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors"
          >
            <span className="absolute inset-0 -translate-x-full bg-[#fcfcfc] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" />
            <span className="relative transition-colors duration-500 group-hover:text-[#111111]">
              Explore Tools
            </span>
            <motion.span
              className="relative transition-colors duration-500 group-hover:text-[#111111]"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </Link>
        </motion.div>
      </div>

      {/* Bottom-left scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-8 left-6 z-20 flex items-center gap-4 md:left-12"
        aria-hidden
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          className="grid h-14 w-14 place-items-center rounded-full border border-[#111111]/25"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#163D2B]" />
        </motion.span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#888888]">
          Scroll to explore
        </span>
      </motion.div>
    </section>
  );
}
