"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

interface CardItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
}

const CARD_COUNT = 7;

const PLACEHOLDER_CARDS: CardItem[] = [
  { id: "c1", title: "Data Architecture", description: "Schemas, pipelines, and storage designed to stay correct as the data grows.", imageUrl: null },
  { id: "c2", title: "AI Systems", description: "Models and agents wired into real workflows, not demos.", imageUrl: null },
  { id: "c3", title: "Product Design", description: "Interfaces shaped around the decision the user actually came to make.", imageUrl: null },
  { id: "c4", title: "Cloud Engineering", description: "Infrastructure sized to the load it really carries, and no larger.", imageUrl: null },
  { id: "c5", title: "Web Applications", description: "Fast, accessible front ends built to survive their second year.", imageUrl: null },
  { id: "c6", title: "Database Tuning", description: "Query plans, indexes, and access patterns measured before they are changed.", imageUrl: null },
  { id: "c7", title: "Automation", description: "The repetitive parts handed to systems that do not get tired.", imageUrl: null },
];

function HorizontalCard({ card, index }: { card: CardItem; index: number }) {
  return (
    <article
      className="relative flex-shrink-0 h-full flex items-stretch rounded-2xl overflow-hidden border border-black/15"
      style={{ width: "min(88vw, 1100px)", backgroundColor: "rgba(0,0,0,0.04)" }}
    >
      {/* Explanation panel — left side, full card height */}
      <div className="flex flex-col justify-center gap-4 px-10 py-12 w-[42%] min-w-[280px] border-r border-black/15">
        <p className="text-eyebrow" style={{ opacity: 0.55 }}>
          {String(index + 1).padStart(2, "0")} / {String(CARD_COUNT).padStart(2, "0")}
        </p>
        {/* h2, not h3: this section renders before ContentSection's own h2 in
            the DOM, so a card title starting at h3 would skip a heading level
            straight from the page's h1 — an accessibility violation Lighthouse
            flags directly. */}
        <h2 className="text-[28px] leading-[1.15] font-bold tracking-tight">{card.title}</h2>
        <p className="text-[14px] leading-relaxed" style={{ opacity: 0.7 }}>
          {card.description}
        </p>
      </div>

      {/* Visual panel — right side */}
      <div className="relative flex-1 overflow-hidden">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.title}
            fill
            className="object-cover"
            sizes="60vw"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, rgba(0,0,0,0.16), transparent 60%), radial-gradient(circle at 75% 80%, rgba(0,0,0,0.10), transparent 55%)",
            }}
          />
        )}
      </div>
    </article>
  );
}

export function CardsSection() {
  const [cards, setCards] = useState<CardItem[]>(PLACEHOLDER_CARDS);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // Distance the track must travel so the last card ends flush with the right
  // edge. Measured rather than assumed, since card width is viewport-relative.
  const [maxX, setMaxX] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/cards")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.cards) && data.cards.length > 0) {
          // Always render exactly CARD_COUNT panels — admin content fills the
          // front of the track, placeholders top it up to seven. Placeholders
          // reusing an id already supplied by the admin are dropped so the
          // track never shows the same card twice.
          const seen = new Set<string>(data.cards.map((c: CardItem) => c.id));
          const filler = PLACEHOLDER_CARDS.filter((c) => !seen.has(c.id));
          setCards([...data.cards, ...filler].slice(0, CARD_COUNT));
        }
      })
      .catch(() => {
        // fall back to placeholder cards on error
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // The wrapper is tall; the viewport-height inner panel sticks to the top and
  // the track slides left as the wrapper scrolls past, so vertical scrolling
  // reads as horizontal travel. Once the last card lands, the sticky release
  // hands scrolling back to the page.
  //
  // The pinned scroll is split into two phases: the first WORD_PHASE_END of
  // progress plays the single-word title intro (grows from far away, holds,
  // disappears); the rest drives the card track, remapped back to its own
  // 0->1 range so cards still travel the full track width.
  // Four sequential, scroll-scrubbed beats — each finishes before the next
  // begins, so nothing competes for attention:
  //   1. BG_IN     background fades up from the previous section
  //   2. WORD      "Portfolio" grows from tiny to large bold, then fades away
  //   3. CARDS_IN  the first card fades up in the empty frame
  //   4. TRACK     the rail starts travelling horizontally
  const BG_IN_END = 0.06;
  const WORD_IN_END = 0.13;
  const WORD_HOLD_END = 0.20;
  const WORD_OUT_END = 0.27;
  const CARDS_IN_END = 0.36;

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  const sectionOpacity = useTransform(scrollYProgress, [0, BG_IN_END], [0, 1]);

  const wordOpacity = useTransform(
    scrollYProgress,
    [BG_IN_END, WORD_IN_END, WORD_HOLD_END, WORD_OUT_END],
    [0, 1, 1, 0]
  );
  // Pops in from very small to large bold, and keeps growing slightly as it
  // fades so the exit reads as receding forward, not just switching off.
  const wordScale = useTransform(
    scrollYProgress,
    [BG_IN_END, WORD_IN_END, WORD_HOLD_END, WORD_OUT_END],
    [0.12, 1.0, 1.15, 1.45]
  );

  // First card only starts appearing after the word is fully gone.
  const cardsOpacity = useTransform(scrollYProgress, [WORD_OUT_END, CARDS_IN_END], [0, 1]);
  // ...and the rail only starts moving once that card has fully arrived.
  const x = useTransform(scrollYProgress, [0, CARDS_IN_END, 1], [0, 0, -maxX]);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      setMaxX(Math.max(0, track.scrollWidth - window.innerWidth + 60));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [cards]);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      // The wrapper stays transparent over the previous section's black. The
      // yellow lives on the sticky panel below so it can actually fade up —
      // painting it here meant the slab was always at full strength and the
      // opacity ramp on the panel had nothing visible to act on.
      style={{ height: `${CARD_COUNT * 100}vh`, color: "#0a0a0a" }}
    >
      <motion.section
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ opacity: sectionOpacity, backgroundColor: "#DEF520" }}
        aria-label="Featured work"
      >
        {/* Single-word title intro: grows in from far away, holds briefly at
            full size, then disappears — the cards only take over once this
            has fully faded, so the two moments never compete for attention. */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: wordOpacity }}
        >
          <motion.p
            className="text-eyebrow font-bold"
            style={{ fontSize: "clamp(3rem, 12vw, 9rem)", letterSpacing: "0.02em", scale: wordScale }}
          >
            Portfolio
          </motion.p>
        </motion.div>

        <motion.div
          ref={trackRef}
          className="flex gap-8 h-full pl-[30px] pr-[30px] w-max"
          style={{ x, opacity: cardsOpacity }}
        >
          {cards.map((card, i) => (
            <HorizontalCard key={card.id} card={card} index={i} />
          ))}
        </motion.div>
      </motion.section>
    </div>
  );
}
