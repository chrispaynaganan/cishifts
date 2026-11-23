"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

const LINES = [
  { words: ["Holistic", "Care,"], className: "text-black" },
  { words: ["Redefined."], className: "text-brand-orange" },
];

/** Left half of every auth screen: photo, logo and the "Holistic Care, Redefined." headline. */
export function AuthHero() {
  const reduce = useReducedMotion();
  let i = 0;

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="relative hidden w-11/20 shrink-0 overflow-hidden rounded-hero lg:block"
    >
      <div className="absolute inset-0 animate-ken-burns motion-reduce:animate-none">
        <Image
          src="/assets/auth-hero.png"
          alt="A smiling older woman mid-laugh"
          fill
          priority
          sizes="54vw"
          className="object-cover"
        />
      </div>
      <div aria-hidden className="absolute inset-0 bg-linear-217 from-brand-orange/5 to-transparent" />
      <div aria-hidden className="absolute inset-0 bg-linear-37 from-white from-15% to-transparent" />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        className="absolute top-5.75 left-6.5 h-19.75 w-46 overflow-hidden"
      >
        <Image
          src="/assets/logo.png"
          alt="CIShifts"
          width={194}
          height={79}
          priority
          className="absolute top-0 -left-2.5 h-full w-48.5 max-w-none"
        />
      </motion.div>

      <h1 className="absolute bottom-35 left-9.75 text-6xl font-semibold tracking-display xl:text-hero">
        {LINES.map((line) => (
          <span key={line.words.join()} className={`block ${line.className}`}>
            {line.words.map((w, wi) => {
              const delay = 0.45 + i++ * 0.12;
              return (
                <span key={w}>
                {wi > 0 && " "}
                <span className="-mb-2 inline-block overflow-hidden pb-2 align-bottom">
                  <motion.span
                    className="inline-block"
                    initial={reduce ? false : { y: "110%", rotate: 4 }}
                    animate={{ y: "0%", rotate: 0 }}
                    transition={{ delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {w}
                  </motion.span>
                </span>
                </span>
              );
            })}
          </span>
        ))}
      </h1>
    </motion.section>
  );
}
