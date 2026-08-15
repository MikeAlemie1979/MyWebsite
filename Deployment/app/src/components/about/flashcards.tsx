"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTheme } from "@/context/theme-context";

export interface FlashcardItem {
  id: string;
  imageUrl: string | null;
  title: string;
  text: string;
}

function FlashCard({ card, index }: { card: FlashcardItem; index: number }) {
  const { motionHidden } = useTheme();

  return (
    <motion.div
      className="motion-el relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 min-h-[220px] flex flex-col justify-end overflow-hidden group cursor-pointer"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        opacity: { duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] },
        y: { duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] },
        scale: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
      }}
      whileHover={motionHidden ? undefined : { scale: 1.04 }}
      whileTap={motionHidden ? undefined : { scale: 1.0 }}
    >
      {card.imageUrl && (
        <Image
          src={card.imageUrl}
          alt={card.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_50%_0%,rgba(124,255,240,0.15),transparent_70%)]" />
      <div className="relative z-10">
        {/* h3 is correct here now that AboutHeadline renders an h2 above this
            section — h1 (page) -> h2 (headline) -> h3 (card title). */}
        <h3 className="text-[15px] font-medium tracking-wide mb-2">{card.title}</h3>
        <p className="text-[12px] opacity-60 leading-relaxed">{card.text}</p>
      </div>
    </motion.div>
  );
}

export function Flashcards({ cards }: { cards: FlashcardItem[] }) {
  return (
    <section
      className="relative w-full page-margin py-16 section-spacing"
      style={{ backgroundColor: "var(--theme-bg)" }}
      aria-label="About flashcards"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {cards.map((card, i) => (
          <FlashCard key={card.id} card={card} index={i} />
        ))}
      </div>
    </section>
  );
}
