"use client";

import { motion } from "framer-motion";

/**
 * The digital object sculpture: floating document sheets, a translucent
 * image frame, a QR tile, a code editor panel and a small globe, tied
 * together with thin connecting paths. Pure CSS 3D + Motion — it rises
 * from the dark section and gently rotates/floats.
 */
export function Sculpture({ className }: { className?: string }) {
  return (
    <div className={className} style={{ perspective: "1400px" }} aria-hidden>
      <motion.div
        initial={{ opacity: 0, y: 120, rotateX: 18 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 8 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: "preserve-3d", position: "relative", width: "100%", aspectRatio: "11 / 8" }}
      >
        {/* connecting paths */}
        <svg viewBox="0 0 800 600" className="absolute inset-0 h-full w-full">
          <g stroke="#163D2B" strokeOpacity="0.35" strokeWidth="1.5" fill="none">
            <path d="M180 210 C 260 160, 330 140, 400 150" />
            <path d="M400 150 C 480 160, 560 190, 620 240" />
            <path d="M620 240 C 640 320, 560 400, 480 430" />
            <path d="M480 430 C 380 470, 260 450, 180 380" />
            <path d="M180 380 C 130 310, 130 270, 180 210" />
          </g>
          <g fill="#163D2B" fillOpacity="0.5">
            <circle cx="180" cy="210" r="4" />
            <circle cx="400" cy="150" r="4" />
            <circle cx="620" cy="240" r="4" />
            <circle cx="480" cy="430" r="4" />
            <circle cx="180" cy="380" r="4" />
          </g>
        </svg>

        {/* large translucent image frame */}
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[16%] top-[10%] w-[38%]"
          style={{ transformStyle: "preserve-3d", transform: "rotateY(-14deg) rotateX(4deg)" }}
        >
          <div className="rounded-2xl border-2 border-[#111111]/15 bg-white/40 p-3 shadow-[0_30px_60px_rgba(10,10,10,0.12)] backdrop-blur-md">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#eef1ef]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/tools/image-tools.svg" alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        </motion.div>

        {/* floating document sheets */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="absolute left-[6%] top-[38%] w-[24%]"
          style={{ transformStyle: "preserve-3d", transform: "rotateY(-22deg)" }}
        >
          <div className="rounded-xl border-2 border-[#111111]/10 bg-white/85 p-4 shadow-[0_20px_40px_rgba(10,10,10,0.1)] backdrop-blur-sm">
            <div className="mb-2 h-2 w-2/3 rounded bg-[#111111]/30" />
            <div className="mb-1.5 h-1.5 w-full rounded bg-[#111111]/15" />
            <div className="mb-1.5 h-1.5 w-5/6 rounded bg-[#111111]/15" />
            <div className="h-1.5 w-4/6 rounded bg-[#111111]/15" />
            <div className="mt-3 inline-block rounded bg-[#C6F35C] px-2 py-1 text-[10px] font-bold text-[#163D2B]">
              PDF
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, -2, 0] }}
          transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
          className="absolute left-[30%] top-[4%] w-[20%]"
          style={{ transformStyle: "preserve-3d", transform: "rotateY(-6deg)" }}
        >
          <div className="rounded-lg border-2 border-[#111111]/10 bg-white/80 p-3 shadow-[0_16px_30px_rgba(10,10,10,0.08)] backdrop-blur-sm">
            <div className="mb-1.5 h-1.5 w-full rounded bg-[#111111]/15" />
            <div className="mb-1.5 h-1.5 w-5/6 rounded bg-[#111111]/15" />
            <div className="h-1.5 w-3/6 rounded bg-[#111111]/15" />
          </div>
        </motion.div>

        {/* QR tile */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          className="absolute right-[14%] top-[6%] w-[18%]"
          style={{ transformStyle: "preserve-3d", transform: "rotateY(16deg)" }}
        >
          <div className="rounded-xl border-2 border-[#111111]/15 bg-white p-2 shadow-[0_20px_40px_rgba(10,10,10,0.12)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/tools/qr-tools.svg" alt="" className="w-full rounded-md" />
          </div>
        </motion.div>

        {/* code editor panel */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 7.6, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
          className="absolute bottom-[6%] right-[6%] w-[36%]"
          style={{ transformStyle: "preserve-3d", transform: "rotateY(12deg) rotateX(2deg)" }}
        >
          <div className="overflow-hidden rounded-xl border-2 border-[#111111]/25 bg-[#0a0a0a] shadow-[0_30px_60px_rgba(10,10,10,0.35)]">
            <div className="flex items-center gap-1.5 bg-[#111111] px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-[#888888]" />
              <span className="h-2 w-2 rounded-full bg-[#888888]" />
              <span className="h-2 w-2 rounded-full bg-[#C6F35C]" />
            </div>
            <div className="p-3 font-mono text-[10px] leading-relaxed text-[#888888] sm:text-xs">
              <p><span className="text-[#C6F35C]">{"{}"}</span> = clean();</p>
              <p>const tools = [</p>
              <p className="pl-3"><span className="text-[#C6F35C]">&apos;pdf&apos;</span>, <span className="text-[#C6F35C]">&apos;image&apos;</span>,</p>
              <p className="pl-3"><span className="text-[#C6F35C]">&apos;qr&apos;</span>, <span className="text-[#C6F35C]">&apos;web&apos;</span>];</p>
              <p>tools.forEach(<span className="text-[#C6F35C]">simplify</span>);</p>
            </div>
          </div>
        </motion.div>

        {/* small globe */}
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
          className="absolute bottom-[2%] left-[24%] w-[16%]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/tools/network-tools.svg" alt="" className="w-full rounded-full border-2 border-[#111111]/10" />
        </motion.div>
      </motion.div>
    </div>
  );
}
