"use client";

import React from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

type AnimatedButtonProps = React.HTMLAttributes<HTMLElement> &
  MotionProps & {
    children?: React.ReactNode;
    as?: "button" | "a";
    href?: string;
  };

/**
 * AnimatedButton — a quiet button with a light sweep running across the
 * label and a shine crossing the border. Renders as <button> by default,
 * or as a link via as="a" + href.
 */
export default function AnimatedButton({
  children = "Browse",
  className = "",
  as = "button",
  href,
  ...rest
}: AnimatedButtonProps) {
  const spring = {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 0.5,
  };

  const maskStyle = {
    WebkitMaskImage:
      "linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))",
    maskImage:
      "linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))",
  } as any;

  const shineStyle = {
    background:
      "linear-gradient(-75deg, transparent 30%, var(--shine) 50%, transparent 70%)",
    backgroundSize: "200% 100%",
    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    maskComposite: "exclude",
    WebkitMask:
      "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
  } as any;

  const label = (
    <motion.span
      className="tracking-wide flex items-center justify-center h-full w-full relative z-10"
      style={maskStyle}
      initial={{ "--mask-x": "100%" } as any}
      animate={{ "--mask-x": "-100%" } as any}
      transition={{ repeat: Infinity, duration: 1, ease: "linear", repeatDelay: 1 }}
    >
      {children}
    </motion.span>
  );

  const borderShine = (
    <motion.span
      className="block absolute inset-0 rounded-md p-px"
      style={shineStyle}
      initial={{ backgroundPosition: "100% 0", opacity: 0 }}
      animate={{ backgroundPosition: ["100% 0", "0% 0"], opacity: [0, 1, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
    />
  );

  const classes = cn(
    "group inline-flex items-center justify-center relative overflow-hidden",
    "font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/70 disabled:pointer-events-none disabled:opacity-50",
    "[--shine:rgba(255,255,255,.66)]",
    className,
  );

  if (as === "a") {
    const A = motion.a as any;
    return (
      <A
        href={href}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        transition={spring}
        className={classes}
        {...(rest as any)}
      >
        {label}
        {borderShine}
      </A>
    );
  }

  const B = motion.button as any;
  return (
    <B
      type="button"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className={classes}
      {...(rest as any)}
    >
      {label}
      {borderShine}
    </B>
  );
}
