"use client";

import React from "react";
import { motion } from "framer-motion";

interface AboutBodyProps {
  body: string;
  fontFamily: string;
  fontSize: number;
  color: string;
}

export function AboutBody({ body, fontFamily, fontSize, color }: AboutBodyProps) {
  return (
    <section
      className="relative w-full page-margin py-8 section-spacing flex flex-col items-center text-center"
      style={{ backgroundColor: "var(--theme-bg)" }}
      aria-label="About body"
    >
      <motion.p
        className="motion-el max-w-xl leading-relaxed"
        style={{ fontFamily, fontSize: `${fontSize}px`, color }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        {body}
      </motion.p>
    </section>
  );
}
