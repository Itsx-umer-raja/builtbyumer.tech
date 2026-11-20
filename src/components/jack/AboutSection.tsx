"use client";

/* eslint-disable @next/next/no-img-element */

import { AnimatedText } from "./AnimatedText";
import { ContactButton } from "./buttons";
import { FadeIn } from "./FadeIn";

const ABOUT_TEXT =
  "With more than five years of experience in design, i focus on branding, web design, and user experience, i truly enjoy working with businesses that aim to stand out and present their best image. Let's build something incredible together!";

export function AboutSection() {
  return (
    <section
      id="about"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-x-clip px-5 py-20 sm:px-8 md:px-10"
    >
      {/* Decorative 3D images */}
      <div className="pointer-events-none absolute top-[4%] left-[1%] w-[120px] sm:left-[2%] sm:w-[160px] md:left-[4%] md:w-[210px]">
        <FadeIn delay={0.1} x={-80} y={0} duration={0.9}>
          <img src="/jack/moon.png" alt="" aria-hidden className="w-full" draggable={false} />
        </FadeIn>
      </div>
      <div className="pointer-events-none absolute bottom-[8%] left-[3%] w-[100px] sm:left-[6%] sm:w-[140px] md:left-[10%] md:w-[180px]">
        <FadeIn delay={0.25} x={-80} y={0} duration={0.9}>
          <img src="/jack/object.png" alt="" aria-hidden className="w-full" draggable={false} />
        </FadeIn>
      </div>
      <div className="pointer-events-none absolute top-[4%] right-[1%] w-[120px] sm:right-[2%] sm:w-[160px] md:right-[4%] md:w-[210px]">
        <FadeIn delay={0.15} x={80} y={0} duration={0.9}>
          <img src="/jack/lego.png" alt="" aria-hidden className="w-full" draggable={false} />
        </FadeIn>
      </div>
      <div className="pointer-events-none absolute bottom-[8%] right-[3%] w-[130px] sm:right-[6%] sm:w-[170px] md:right-[10%] md:w-[220px]">
        <FadeIn delay={0.3} x={80} y={0} duration={0.9}>
          <img src="/jack/group.png" alt="" aria-hidden className="w-full" draggable={false} />
        </FadeIn>
      </div>

      {/* Text block */}
      <div className="relative z-10 flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
        <FadeIn delay={0} y={40}>
          <h2
            className="hero-heading text-center font-black uppercase leading-none tracking-tight"
            style={{ fontSize: "clamp(3rem, 12vw, 160px)" }}
          >
            About me
          </h2>
        </FadeIn>

        <AnimatedText
          text={ABOUT_TEXT}
          className="max-w-[560px] text-center font-medium leading-relaxed text-[#D7E2EA]"
        />
      </div>

      <div className="mt-16 flex justify-center sm:mt-20 md:mt-24">
        <ContactButton delay={0.2} />
      </div>
    </section>
  );
}
