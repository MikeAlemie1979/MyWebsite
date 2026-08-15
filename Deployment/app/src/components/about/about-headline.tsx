"use client";

import React from "react";
import { motion } from "framer-motion";

interface AboutHeadlineProps {
  headline: string;
  fontFamily: string;
  fontSize: number;
  color: string;
}

export function AboutHeadline({ headline, fontFamily, fontSize, color }: AboutHeadlineProps) {
  return (
    <section
      className="relative w-full page-margin py-16 section-spacing flex flex-col items-center text-center"
      style={{ backgroundColor: "var(--theme-bg)" }}
      aria-label="About headline"
    >
      {/* h2, not h1: the page already has its semantic h1 (visually hidden,
          in about/page.tsx) — a second h1 here was both a duplicate-heading
          and a heading-order violation, since the flashcards below jump
          straight to h3 with nothing in between. */}
      <motion.h2
        className="motion-el tracking-wide max-w-2xl leading-relaxed"
        style={{ fontFamily, fontSize: `${fontSize}px`, color }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {headline}
      </motion.h2>
    </section>
  );
}
