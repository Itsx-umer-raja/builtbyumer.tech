"use client";

/* eslint-disable @next/next/no-img-element */

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { FadeIn } from "./FadeIn";
import { LiveProjectButton } from "./buttons";

interface Project {
  n: string;
  category: string;
  name: string;
  imgA: string; // left column, top (short)
  imgB: string; // left column, bottom (tall)
  imgC: string; // right column (tall)
}

const PROJECTS: Project[] = [
  {
    n: "01",
    category: "Client",
    name: "Nextlevel Studio",
    imgA: "/jack/p1-a.webp",
    imgB: "/jack/p1-b.webp",
    imgC: "/jack/p1-c.webp",
  },
  {
    n: "02",
    category: "Personal",
    name: "Aura Brand Identity",
    imgA: "/jack/p2-a.webp",
    imgB: "/jack/p2-b.webp",
    imgC: "/jack/p2-c.webp",
  },
  {
    n: "03",
    category: "Client",
    name: "Solaris Digital",
    imgA: "/jack/p3-a.webp",
    imgB: "/jack/p3-b.webp",
    imgC: "/jack/p3-c.webp",
  },
];

function Card({
  index,
  total,
  progress,
  project,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  project: Project;
}) {
  // Cards further back scale down as newer cards scroll over them.
  const targetScale = 1 - (total - 1 - index) * 0.03;
  const scale = useTransform(progress, [index / total, 1], [1, targetScale]);

  return (
    <div className="h-[85vh]">
      <motion.div
        className="sticky top-24 rounded-[40px] border-2 border-[#D7E2EA] bg-[#0C0C0C] p-4 sm:top-32 sm:rounded-[50px] sm:p-6 md:rounded-[60px] md:p-8"
        style={{ scale, top: `calc(var(--card-top) + ${index * 28}px)` }}
      >
        {/* Top row */}
        <div className="flex flex-wrap items-end justify-between gap-4 px-2 pb-6 sm:px-4 md:px-6">
          <div className="flex items-end gap-4 sm:gap-8">
            <span
              className="hero-heading font-black uppercase leading-none tracking-tight"
              style={{ fontSize: "clamp(3rem, 10vw, 140px)" }}
            >
              {project.n}
            </span>
            <div className="pb-1">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#D7E2EA]/60 sm:text-xs">
                {project.category}
              </p>
              <p
                className="font-medium uppercase text-[#D7E2EA]"
                style={{ fontSize: "clamp(1.1rem, 2.4vw, 2.2rem)" }}
              >
                {project.name}
              </p>
            </div>
          </div>
          <LiveProjectButton />
        </div>

        {/* Image grid */}
        <div className="flex gap-3 sm:gap-4">
          <div className="flex w-[40%] flex-col gap-3 sm:gap-4">
            <img
              src={project.imgA}
              alt={`${project.name} — visual 1`}
              className="w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
              style={{ height: "clamp(130px, 16vw, 230px)" }}
              loading="lazy"
              draggable={false}
            />
            <img
              src={project.imgB}
              alt={`${project.name} — visual 2`}
              className="w-full flex-1 rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
              style={{ height: "clamp(160px, 22vw, 340px)" }}
              loading="lazy"
              draggable={false}
            />
          </div>
          <img
            src={project.imgC}
            alt={`${project.name} — main visual`}
            className="h-auto w-[60%] rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
            loading="lazy"
            draggable={false}
          />
        </div>
      </motion.div>
    </div>
  );
}

export function ProjectsSection() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <section
      id="projects"
      className="relative z-10 -mt-10 overflow-x-clip rounded-t-[40px] bg-[#0C0C0C] pb-24 sm:-mt-12 sm:rounded-t-[50px] md:-mt-14 md:rounded-t-[60px]"
    >
      <FadeIn y={40} className="px-5 pt-20 sm:px-8 sm:pt-24 md:px-10 md:pt-32">
        <h2
          className="hero-heading text-center font-black uppercase leading-none tracking-tight"
          style={{ fontSize: "clamp(3rem, 12vw, 160px)" }}
        >
          Project
        </h2>
      </FadeIn>

      <div ref={container} className="px-4 pt-10 sm:px-8 md:px-10">
        {PROJECTS.map((p, i) => (
          <Card key={p.n} index={i} total={PROJECTS.length} progress={scrollYProgress} project={p} />
        ))}
      </div>
    </section>
  );
}
