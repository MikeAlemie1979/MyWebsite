"use client";

import React, { useEffect, useState } from "react";

const FONTS = [
  "Lexend",
  "Chewy",
  "Sniglet",
  "Fuzzy Bubbles",
  "Elsie",
  "Passero One",
  "Delius Unicase",
  "Edu SA Beginner",
  "Asimovian",
  "MuseoModerno",
  "Crafty Girls",
  "Schoolbell",
  "Sansita Swashed",
];

const PHRASES = [
  "The Mindset", "The Try", "The Perseverance", "The Knowledge", "The Pain",
  "The Gain", "The Hardship", "The Skill", "The Tools", "The Wisdom",
  "The Time", "The Guide", "The Technology", "The Passion", "The Effort",
  "The Believe", "The Sight", "The Vision", "The Computer Science",
  "The Intelligence", "The AI Power", "The Future", "The Program",
  "The Punctuality", "The Respect", "The Right Moment", "The Catch",
];

// Module-scoped so ids stay unique across effect re-runs. A counter local to
// the effect restarts at 0 on StrictMode's double-invoke and on HMR, which
// produced two labels sharing key 0.
let nextLabelId = 0;

const VISIBLE_MS = 5000;
const FADE_IN_MS = 1200;
// Fade-out is intentionally much longer than fade-in — it needs to read as a
// slow, gradual dissolve (letter-spacing opening up) rather than a sudden cut.
const FADE_OUT_MS = 4500;
const LIFETIME = FADE_IN_MS + VISIBLE_MS + FADE_OUT_MS;
// Spawn cadence: LIFETIME / SPAWN_MS labels are alive at any moment, so this
// must stay well under LIFETIME/7 to guarantee at least 7 concurrent, legible
// labels rather than the 3-4 a slower cadence leaves visible.
const SPAWN_MS = 1000;

const pct = (ms: number) => ((ms / LIFETIME) * 100).toFixed(2);

// Built as a plain string and injected via a regular (non-styled-jsx) <style>
// tag below. styled-jsx's own CSS minifier silently corrupts this keyframes
// rule when it has more than ~2 dynamically-interpolated percentage stops —
// it merges their selectors and drops every body but the last, leaving the
// animation permanently stuck at 0% opacity. Bypassing styled-jsx here avoids
// that bug entirely. White text on black also stays legible well below 50%
// opacity, so the extra mid-fade-out stops below spread the perceived
// dimming across the whole fade instead of compressing it into the final
// instant, which is what read as a "sudden" disappearance.
const FLASH_TEXT_CSS = `
.flash-text {
  position: absolute;
  font-size: 12.5px;
  /* Follows the theme rather than being hardcoded white — on the bright
     (#FFCCF9) theme white labels are effectively illegible. */
  color: var(--nav-text);
  white-space: nowrap;
  animation: flash-text-life ${LIFETIME}ms linear forwards;
}
[data-theme="dark"] .flash-text,
[data-theme="warm"] .flash-text {
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.85);
}
[data-theme="bright"] .flash-text {
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.9);
}
@keyframes flash-text-life {
  0% { opacity: 0; letter-spacing: 0.02em; }
  ${pct(FADE_IN_MS)}% { opacity: 1; letter-spacing: 0.02em; }
  ${pct(FADE_IN_MS + VISIBLE_MS)}% { opacity: 1; letter-spacing: 0.05em; }
  ${pct(FADE_IN_MS + VISIBLE_MS + FADE_OUT_MS * 0.3)}% { opacity: 0.72; letter-spacing: 0.18em; }
  ${pct(FADE_IN_MS + VISIBLE_MS + FADE_OUT_MS * 0.55)}% { opacity: 0.42; letter-spacing: 0.32em; }
  ${pct(FADE_IN_MS + VISIBLE_MS + FADE_OUT_MS * 0.8)}% { opacity: 0.16; letter-spacing: 0.48em; }
  100% { opacity: 0; letter-spacing: 0.6em; }
}
`;

interface Label {
  id: number;
  text: string;
  font: string;
  angle: number;
  radius: number;
}

/**
 * Scatters phrases in a ring just outside the sphere. Each fades in, holds for
 * ~5s, then fades out while its letter-spacing opens up.
 *
 * Placement avoids obvious repetition by tracking recently-used angle buckets
 * and phrases, so consecutive labels neither stack nor repeat wording.
 */
export function FlashTexts({ sphereSize }: { sphereSize: number }) {
  const [labels, setLabels] = useState<Label[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const recentBuckets: number[] = [];
    const recentPhrases: string[] = [];
    const BUCKETS = 12;

    const spawn = () => {
      // Pick an angle bucket that has not been used recently.
      let bucket = Math.floor(Math.random() * BUCKETS);
      let guard = 0;
      while (recentBuckets.includes(bucket) && guard++ < 20) {
        bucket = Math.floor(Math.random() * BUCKETS);
      }
      recentBuckets.push(bucket);
      if (recentBuckets.length > 5) recentBuckets.shift();

      let text = PHRASES[Math.floor(Math.random() * PHRASES.length)];
      guard = 0;
      while (recentPhrases.includes(text) && guard++ < 30) {
        text = PHRASES[Math.floor(Math.random() * PHRASES.length)];
      }
      recentPhrases.push(text);
      if (recentPhrases.length > 8) recentPhrases.shift();

      const jitter = (Math.random() - 0.5) * ((Math.PI * 2) / BUCKETS) * 0.8;
      const angle = (bucket / BUCKETS) * Math.PI * 2 + jitter;

      const label: Label = {
        id: nextLabelId++,
        text,
        font: FONTS[Math.floor(Math.random() * FONTS.length)],
        angle,
        // ~5px outside the sphere edge, plus a little variation.
        // Comfortably clear of the sphere edge — the anchor logic below keeps
        // labels growing outward as they fade, so this margin only needs to
        // cover normal placement variety, not the fade-out growth itself.
        radius: sphereSize / 2 + 35 + Math.random() * 40,
      };

      setLabels((prev) => [...prev, label]);
      window.setTimeout(() => {
        setLabels((prev) => prev.filter((l) => l.id !== label.id));
      }, LIFETIME);
    };

    spawn();
    const interval = window.setInterval(spawn, SPAWN_MS);
    return () => window.clearInterval(interval);
  }, [sphereSize]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
      {labels.map((l) => {
        const x = Math.cos(l.angle) * l.radius;
        const y = Math.sin(l.angle) * l.radius;
        // As the fade-out grows the letter-spacing, the label must widen
        // away from the sphere, never toward it. Centering the box on its
        // anchor point (translate -50%) would grow both ways and let the
        // near edge creep inward. Instead pin the edge nearest the sphere —
        // via `left` for labels right of centre, `right` for labels left of
        // centre — so growth only ever extends outward.
        const growsRight = x >= 0;
        return (
          <span
            key={l.id}
            className="flash-text"
            style={
              growsRight
                ? {
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: "translateY(-50%)",
                    fontFamily: `'${l.font}', system-ui, sans-serif`,
                  }
                : {
                    right: `calc(50% - ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: "translateY(-50%)",
                    textAlign: "right",
                    fontFamily: `'${l.font}', system-ui, sans-serif`,
                  }
            }
          >
            {l.text}
          </span>
        );
      })}

      <style dangerouslySetInnerHTML={{ __html: FLASH_TEXT_CSS }} />
    </div>
  );
}
