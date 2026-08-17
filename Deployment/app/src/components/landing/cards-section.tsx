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
  header: string;
  bullets: string[];
  imageUrl: string | null;
}

function splitHeaderAndBullet(line: string): { header: string; bullet: string | null } {
  const parts = line.split(" — ");
  return parts.length > 1 ? { header: parts[0], bullet: parts.slice(1).join(" — ") } : { header: line, bullet: null };
}

const PLACEHOLDER_GROUPS: PortfolioCard[] = [
  { cardId: 1, header: "Data Architecture", bullets: ["Schemas, pipelines, and storage designed to stay correct as the data grows."], imageUrl: null },
  { cardId: 2, header: "AI Systems", bullets: ["Models and agents wired into real workflows, not demos."], imageUrl: null },
  { cardId: 3, header: "Product Design", bullets: ["Interfaces shaped around the decision the user actually came to make."], imageUrl: null },
  { cardId: 4, header: "Cloud Engineering", bullets: ["Infrastructure sized to the load it really carries, and no larger."], imageUrl: null },
  { cardId: 5, header: "Web Applications", bullets: ["Fast, accessible front ends built to survive their second year."], imageUrl: null },
  { cardId: 6, header: "Database Tuning", bullets: ["Query plans, indexes, and access patterns measured before they are changed."], imageUrl: null },
  { cardId: 7, header: "Automation", bullets: ["The repetitive parts handed to systems that do not get tired."], imageUrl: null },
];

/** Groups flat Cards-tab rows into one Portfolio card per CardId. The row
 * with the lowest cardImgNumber in a group is the card's header; every row
 * after it becomes a bullet point. */
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
      const [first, ...rest] = sorted;
      return {
        cardId,
        header: first?.cardContent ?? "",
        bullets: rest.map((r) => r.cardContent).filter(Boolean),
        imageUrl: sorted.find((r) => r.imageUrl)?.imageUrl ?? null,
      };
    });
}

function HorizontalCard({
  card,
  index,
  total,
  elRef,
}: {
  card: PortfolioCard;
  index: number;
  total: number;
  elRef: (el: HTMLElement | null) => void;
}) {
  const hasImage = !!card.imageUrl;
  const { header, bullet } = hasImage || card.bullets.length > 0 ? { header: card.header, bullet: null } : splitHeaderAndBullet(card.header);
  const bullets = bullet ? [bullet, ...card.bullets] : card.bullets;

  return (
    // Full viewport width — each card covers the whole page, split 30% text
    // / 70% image, per spec.
    <article
      ref={elRef}
      className="relative flex-shrink-0 h-full flex items-stretch overflow-hidden border border-black/15"
      style={{ width: "100vw", backgroundColor: "rgba(0,0,0,0.04)" }}
    >
      {/* Explanation panel — left side, exactly 30% of the full card width. */}
      <div
        className="flex flex-col justify-center gap-4 px-10 py-12 flex-shrink-0 border-r border-black/15"
        style={{ width: "30%" }}
      >
        <p className="text-eyebrow" style={{ opacity: 0.55 }}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        {/* h2, not h3: this section renders before ContentSection's own h2 in
            the DOM, so a card title starting at h3 would skip a heading level
            straight from the page's h1 — an accessibility violation Lighthouse
            flags directly. */}
        <h2 className="text-[24px] leading-[1.15] font-bold tracking-tight">{header}</h2>
        {bullets.length > 0 && (
          <ul className="list-disc pl-5 space-y-2">
            {bullets.map((b, i) => (
              <li key={i} className="text-[18px] leading-relaxed" style={{ opacity: 0.7 }}>
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Visual panel — right side, exactly 70% of the full card width. */}
      {hasImage && (
        <div
          className="relative h-full flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ width: "70%" }}
        >
          {/* Plain <img>, not next/image: an admin-uploaded image has no known
              dimensions ahead of time. Fills its 70%-width panel with
              object-contain, so every image reads at the same on-screen size
              (the panel itself, not a further percentage of it) without
              distortion. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.imageUrl!}
            alt={header || "Portfolio image"}
            className="object-contain block w-full h-full"
          />
        </div>
      )}
      {!hasImage && (
        <div
          className="h-full relative"
          style={{
            width: "70%",
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
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  // Each card's own left offset within the track, measured from the DOM
  // (cards are viewport-width, so this can't be computed from a fixed
  // per-card width). Drives the per-card pause/travel waypoints below.
  const [cardOffsets, setCardOffsets] = useState<number[]>([]);
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

    // Retries once before giving up. The server already falls back to a
    // durable mirror rather than placeholders (see lib/store.ts), so a failure
    // here is almost always a transient network blip — and silently leaving
    // the hardcoded placeholders on screen looks exactly like the admin's
    // saved cards having been deleted, which is the worst way to fail.
    const load = async (attempt = 0): Promise<void> => {
      try {
        const res = await fetch("/api/admin/cards", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (data && Array.isArray(data.cards) && data.cards.length > 0) {
          const grouped = groupCards(data.cards as CardItem[]);
          if (grouped.length > 0) setCards(grouped);
        }
      } catch (error) {
        if (cancelled) return;
        if (attempt < 1) {
          await new Promise((r) => setTimeout(r, 1200));
          if (!cancelled) return load(attempt + 1);
        }
        console.error("[cards-section] failed to load cards:", error);
      }
    };

    load().finally(() => {
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
  // The pinned scroll is split into phases, expressed as vh budgets so the
  // pacing stays constant regardless of how many cards are loaded (dynamic,
  // from the sheet) — everything below converts these to fractions of the
  // wrapper's own total height.
  //   1. BG_IN     background fades up from the previous section
  //   2. WORD      "Portfolio" grows from tiny to large bold, then fades away
  //   3. CARDS_IN  the first card fades up in the empty frame
  //   4. TRACK     one window per card: the rail holds on that card for most
  //      of the window (a deliberate pause), then travels to the next card
  //      only in the window's final stretch — so each card gets a distinct
  //      "arrive, sit, then move on" beat instead of one continuous scroll.
  //   5. HOLD      after the last card lands, the rail sits still for two
  //      more card-widths of scrolling before the section releases — so the
  //      page doesn't drop straight into the next section right behind it.
  const BG_IN_VH = 42;
  const WORD_IN_VH = 91;
  const WORD_HOLD_VH = 140;
  const WORD_OUT_VH = 189;
  const CARDS_IN_VH = 252;
  const PER_CARD_VH = 100;
  const HOLD_CARD_UNITS = 2;
  // Fraction of each card's window spent paused before it starts travelling
  // to the next card.
  const PAUSE_FRACTION = 0.6;

  const cardCount = Math.max(cards.length, 1);
  const totalVh =
    CARDS_IN_VH + cardCount * PER_CARD_VH + HOLD_CARD_UNITS * PER_CARD_VH;

  const BG_IN_END = BG_IN_VH / totalVh;
  const WORD_IN_END = WORD_IN_VH / totalVh;
  const WORD_HOLD_END = WORD_HOLD_VH / totalVh;
  const WORD_OUT_END = WORD_OUT_VH / totalVh;
  const CARDS_IN_END = CARDS_IN_VH / totalVh;

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

  // Per-card pause-then-travel waypoints. Built from measured DOM offsets
  // (falls back to 0 before the first measure, which just holds the rail
  // still until real offsets land — no jump once they do, since scroll
  // progress hasn't advanced past CARDS_IN_END yet on initial paint).
  const xInputs: number[] = [0, CARDS_IN_END];
  const xOutputs: number[] = [0, 0];
  for (let i = 0; i < cardCount; i++) {
    const windowStart = CARDS_IN_VH + i * PER_CARD_VH;
    const pauseEnd = windowStart + PER_CARD_VH * PAUSE_FRACTION;
    const windowEnd = windowStart + PER_CARD_VH;
    const currentX = -(cardOffsets[i] ?? 0);
    const nextX = i === cardCount - 1 ? -maxX : -(cardOffsets[i + 1] ?? 0);
    xInputs.push(pauseEnd / totalVh, windowEnd / totalVh);
    xOutputs.push(currentX, nextX);
  }
  // Trailing hold: same x as the last card's resting position, all the way
  // to the end of the wrapper — the rail simply doesn't move here.
  xInputs.push(1);
  xOutputs.push(-maxX);

  const x = useTransform(scrollYProgress, xInputs, xOutputs);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      setMaxX(Math.max(0, track.scrollWidth - window.innerWidth + 60));
      setCardOffsets(cardRefs.current.map((el) => el?.offsetLeft ?? 0));
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
        style={{ height: `${totalVh}vh`, color: "#0a0a0a" }}
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
              <HorizontalCard
                key={card.cardId}
                card={card}
                index={i}
                total={cards.length}
                elRef={(el) => {
                  cardRefs.current[i] = el;
                }}
              />
            ))}
          </motion.div>
        </motion.section>
      </div>
    </>
  );
}
