"use client";

import { FadeIn } from "./FadeIn";
import { Magnet } from "./Magnet";
import { ContactButton } from "./buttons";

const NAV = [
  { label: "About", href: "#about" },
  { label: "Price", href: "#services" },
  { label: "Projects", href: "#projects" },
  { label: "Tools", href: "/tools" },
  { label: "Contact", href: "/contact" },
] as const;

export function HeroSection() {
  return (
    <section className="relative flex h-screen flex-col overflow-x-clip">
      {/* Navbar */}
      <FadeIn as="nav" delay={0} y={-20} className="relative z-20 flex justify-between px-6 pt-6 md:px-10 md:pt-8">
        {NAV.map((n) => (
          <a
            key={n.label}
            href={n.href}
            className="font-medium uppercase tracking-wider text-[#D7E2EA] transition-opacity duration-200 hover:opacity-70 text-sm md:text-lg lg:text-[1.4rem]"
          >
            {n.label}
          </a>
        ))}
      </FadeIn>

      {/* Massive heading */}
      <div className="overflow-hidden">
        <FadeIn delay={0.15} y={40}>
          <h1 className="hero-heading mt-6 w-full whitespace-nowrap text-[14vw] font-black uppercase leading-none tracking-tight sm:mt-4 sm:text-[15vw] md:-mt-5 md:text-[16vw] lg:text-[17.5vw]">
            Hi, i&apos;m umer
          </h1>
        </FadeIn>
      </div>

      {/* Portrait — centered, magnetic */}
      <Magnet
        padding={150}
        strength={3}
        className="absolute left-1/2 top-1/2 z-10 w-[280px] -translate-x-1/2 -translate-y-1/2 sm:top-auto sm:bottom-0 sm:w-[360px] sm:translate-y-0 md:w-[440px] lg:w-[520px]"
      >
        <FadeIn delay={0.6} y={30}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/jack/portrait.png" alt="Umer — 3D creator portrait" className="w-full" draggable={false} />
        </FadeIn>
      </Magnet>

      {/* Bottom bar */}
      <div className="relative z-20 mt-auto flex items-end justify-between px-6 pb-7 sm:pb-8 md:px-10 md:pb-10">
        <FadeIn delay={0.35} y={20}>
          <p
            className="max-w-[160px] font-light uppercase leading-snug tracking-wide text-[#D7E2EA] sm:max-w-[220px] md:max-w-[260px]"
            style={{ fontSize: "clamp(0.75rem, 1.4vw, 1.5rem)" }}
          >
            a 3d creator driven by crafting striking and unforgettable projects
          </p>
        </FadeIn>
        <ContactButton delay={0.5} />
      </div>
    </section>
  );
}
