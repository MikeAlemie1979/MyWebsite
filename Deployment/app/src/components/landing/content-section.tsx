"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const WAVE_COLORS = ["#000000", "#808080", "#4F570B", "#46706D", "#555470", "#614D50", "#6362B8"];
const HEADING_WORDS = ["Where", "engineering", "precision", "meets", "creative", "intelligence."];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

interface WordTiming {
  duration: number;
  delay: number;
}

const DEFAULT_TIMINGS: WordTiming[] = HEADING_WORDS.map((_, i) => ({ duration: 4.5, delay: i * 0.25 }));

export function ContentSection() {
  // Each word gets its own randomized cycle duration and stagger delay so
  // the color changes ripple across the sentence like a wave instead of
  // flipping in lockstep.
  const [wordTimings, setWordTimings] = useState<WordTiming[]>(DEFAULT_TIMINGS);

  useEffect(() => {
    setWordTimings(HEADING_WORDS.map((_, i) => ({ duration: rand(3.5, 6), delay: i * 0.25 + rand(0, 0.3) })));
  }, []);

  return (
    <section
      className="bg-wave relative w-full page-margin py-32 flex flex-col items-center text-center overflow-hidden"
      style={{ color: "#0a0a0a" }}
      aria-label="Philosophy"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-24 z-10"
        style={{ background: "linear-gradient(to bottom, #DEF520 0%, transparent 100%)" }}
      />

      <motion.p
        className="motion-el text-eyebrow mb-6 relative z-10"
        style={{ opacity: 0.5 }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
      >
        Philosophy
      </motion.p>

      <h2 className="motion-el text-display font-bold tracking-tight max-w-4xl leading-[1.05] relative z-10 mx-auto">
        {HEADING_WORDS.map((word, i) => (
          <motion.span
            key={i}
            className="wave-word"
            // Alternating entrance — even words fly in from the left, odd words
            // from the right, so the sentence assembles as a zig-zag on scroll.
            initial={{ opacity: 0, x: i % 2 === 0 ? -240 : 240 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            style={{
              animationDuration: `${wordTimings[i].duration}s`,
              animationDelay: `${wordTimings[i].delay}s`,
            }}
          >
            {word}
            {i < HEADING_WORDS.length - 1 ? " " : ""}
          </motion.span>
        ))}
      </h2>

      <motion.p
        className="prose motion-el mt-8 mx-auto relative z-10"
        style={{ opacity: 0.65 }}
        initial={{ opacity: 0, x: 240 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, delay: HEADING_WORDS.length * 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        Every system is designed to be beautiful, resilient, and intentional —
        content editable via Admin.
      </motion.p>

      <style jsx global>{`
        @keyframes bg-wave-color {
          0% { background-color: #def520; }
          25% { background-color: #e9fa86; }
          50% { background-color: #ffffff; }
          75% { background-color: #e9fa86; }
          100% { background-color: #def520; }
        }
        .bg-wave {
          animation: bg-wave-color 20s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .bg-wave {
            animation: none;
            background-color: #def520;
          }
        }
        @keyframes wave-word-color {
${WAVE_COLORS.map((c, i) => `          ${((i / (WAVE_COLORS.length - 1)) * 100).toFixed(2)}% { color: ${c}; }`).join("\n")}
        }
        .wave-word {
          display: inline-block;
          /* The trailing space lives inside the span; without pre, an
             inline-block collapses it and words run together. */
          white-space: pre;
          animation-name: wave-word-color;
          animation-timing-function: steps(1, end);
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }
        @media (prefers-reduced-motion: reduce) {
          .wave-word {
            animation: none;
            color: #0a0a0a;
          }
        }

      `}</style>
    </section>
  );
}
