"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { LoadingOverlay } from "@/components/common/loading-overlay";

interface CardItem {
  id: string;
  cardId: number;
  cardContent: string;
  cardImgNumber: number;
  imageUrl?: string | null;
}

interface PortfolioCard {
  cardId: number;
  contents: string[];
  imageUrl: string | null;
}

const CARD_COUNT = 7;

const PLACEHOLDER_GROUPS: PortfolioCard[] = [
  { cardId: 1, contents: ["Data Architecture — Schemas, pipelines, and storage designed to stay correct as the data grows."], imageUrl: null },
  { cardId: 2, contents: ["AI Systems — Models and agents wired into real workflows, not demos."], imageUrl: null },
  { cardId: 3, contents: ["Product Design — Interfaces shaped around the decision the user actually came to make."], imageUrl: null },
  { cardId: 4, contents: ["Cloud Engineering — Infrastructure sized to the load it really carries, and no larger."], imageUrl: null },
  { cardId: 5, contents: ["Web Applications — Fast, accessible front ends built to survive their second year."], imageUrl: null },
  { cardId: 6, contents: ["Database Tuning — Query plans, indexes, and access patterns measured before they are changed."], imageUrl: null },
  { cardId: 7, contents: ["Automation — The repetitive parts handed to systems that do not get tired."], imageUrl: null },
];

/** Groups flat Cards-tab rows into one Portfolio card per CardId. */
function groupCards(rows: CardItem[]): PortfolioCard[] {
  const byId = new Map<number, CardItem[]>();
  for (const row of rows) {
    const list = byId.get(row.cardId) ?? [];
    list.push(row);
    byId.set(row.cardId, list);
  }
  return Array.from(byId.entries())
    .sort(([a], [b]) => a - b)
    .map(([cardId, group]) => {
      const sorted = [...group].sort((a, b) => a.cardImgNumber - b.cardImgNumber);
      return {
        cardId,
        contents: sorted.map((r) => r.cardContent).filter(Boolean),
        imageUrl: sorted.find((r) => r.imageUrl)?.imageUrl ?? null,
      };
    });
}

function HorizontalCard({ card, index, total }: { card: PortfolioCard; index: number; total: number }) {
  const hasImage = !!card.imageUrl;

  return (
    <article
      className="relative flex-shrink-0 h-full flex items-stretch rounded-2xl overflow-hidden border border-black/15"
      style={
        hasImage
          ? { width: "min(100vw, 1400px)", backgroundColor: "rgba(0,0,0,0.04)" }
          : { width: "min(88vw, 1100px)", backgroundColor: "rgba(0,0,0,0.04)" }
      }
    >
      {/* Explanation panel — left side, full card height */}
      <div
        className={
          hasImage
            ? "flex flex-col justify-center gap-4 px-10 py-12 w-[420px] flex-shrink-0 border-r border-black/15"
            : "flex flex-col justify-center gap-4 px-10 py-12 w-[42%] min-w-[280px] border-r border-black/15"
        }
      >
        <p className="text-eyebrow" style={{ opacity: 0.55 }}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        {/* h2, not h3: this section renders before ContentSection's own h2 in
            the DOM, so a card title starting at h3 would skip a heading level
            straight from the page's h1 — an accessibility violation Lighthouse
            flags directly. */}
        {card.contents.map((content, i) => (
          <p key={i} className="text-[14px] leading-relaxed" style={{ opacity: 0.7 }}>
            {content}
          </p>
        ))}
      </div>

      {/* Visual panel — right side, a fixed-size box (same width AND height on
          every card) so every uploaded image reads at the same on-screen
          size regardless of its own resolution or aspect ratio. */}
      {hasImage && (
        <div
          className="relative h-full flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ width: "min(65vw, 900px)" }}
        >
          {/* Plain <img>, not next/image: an admin-uploaded image has no known
              dimensions ahead of time. Capped to 70% of BOTH the panel's
              width and height (not just width) and object-contain, so every
              image fits inside the same bounding box without distortion —
              a portrait upload and a landscape upload end up visually the
              same size instead of one towering over the other. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.imageUrl!}
            alt={card.contents[0] ?? "Portfolio image"}
            className="object-contain block"
            style={{ width: "70%", height: "70%" }}
          />
        </div>
      )}
      {!hasImage && (
        <div
          className="w-[480px] h-full relative"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(0,0,0,0.16), transparent 60%), radial-gradient(circle at 75% 80%, rgba(0,0,0,0.10), transparent 55%)",
          }}
        />
      )}
    </article>
  );
}

export function CardsSection() {
  const [cards, setCards] = useState<PortfolioCard[]>(PLACEHOLDER_GROUPS);
  const [showOverlay, setShowOverlay] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // Distance the track must travel so the last card ends flush with the right
  // edge. Measured rather than assumed, since card width is viewport-relative.
  const [maxX, setMaxX] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Only shown if the fetch is still pending after 2s — fast/cached loads
    // never flash it.
    const overlayTimer = setTimeout(() => {
      if (!cancelled) setShowOverlay(true);
    }, 2000);

    fetch("/api/admin/cards")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.cards) && data.cards.length > 0) {
          const grouped = groupCards(data.cards as CardItem[]);
          if (grouped.length > 0) setCards(grouped);
        }
      })
      .catch(() => {
        // fall back to placeholder cards on error
      })
      .finally(() => {
        clearTimeout(overlayTimer);
        if (!cancelled) setShowOverlay(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(overlayTimer);
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
    <>
      <LoadingOverlay show={showOverlay} />
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
              <HorizontalCard key={card.cardId} card={card} index={i} total={cards.length} />
            ))}
          </motion.div>
        </motion.section>
      </div>
    </>
  );
}
