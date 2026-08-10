"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/context/theme-context";

const IMAGE_SRC = "/images/mehrdad.png";
// Matches the source image's actual pixel ratio (1840x913) so cells never
// distort the sliced background.
const IMAGE_ASPECT = 1840 / 913;

const GRID_COLS = 12;
const GRID_ROWS = 6;

interface CubeSpec {
  col: number;
  row: number;
  delay: number;
  duration: number;
  spin: number; // degrees of Y-rotation it tumbles in from
  tilt: number; // degrees of X-rotation it tumbles in from
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/**
 * Slices Mehrdad.png into a cube grid. Cubes fade in in random order, each
 * tumbling in at its own random rotation speed, until the whole portrait has
 * assembled — then a single brightness wave sweeps left-to-right and back
 * right-to-left across the finished grid.
 */
export function CubeReveal({ active }: { active?: boolean } = {}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { motionHidden } = useTheme();
  const [started, setStarted] = useState(false);
  const [wavePass, setWavePass] = useState<0 | 1 | 2>(0); // 0 = none, 1 = L→R, 2 = R→L

  const cubes = useMemo<CubeSpec[]>(() => {
    const list: CubeSpec[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        list.push({
          col,
          row,
          // Slowed down substantially — this reveal directly follows the ash
          // section's dissolve and should read as a deliberate, unhurried
          // continuation of that moment, not a quick flourish.
          delay: rand(0, 4.2),
          duration: rand(1.6, 3.4),
          spin: rand(180, 720) * (Math.random() < 0.5 ? -1 : 1),
          tilt: rand(-70, 70),
        });
      }
    }
    return list;
  }, []);

  const revealMs = useMemo(() => {
    const last = cubes.reduce((max, c) => Math.max(max, c.delay + c.duration), 0);
    return last * 1000;
  }, [cubes]);

  useEffect(() => {
    if (motionHidden) return;

    // Controlled mode: the parent (ash section) decides exactly when the
    // reveal starts — tied to its own scroll-driven dissolve sequence rather
    // than a generic "30% in viewport" check, since this component now
    // mounts already inside that pinned section instead of below it.
    if (active !== undefined) {
      if (active) setStarted(true);
      return;
    }

    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [motionHidden, active]);

  // Once every cube has finished tumbling in, run the two wave passes.
  useEffect(() => {
    if (!started || motionHidden) return;
    const WAVE_PASS_MS = GRID_COLS * 55 + 550;
    const t1 = window.setTimeout(() => setWavePass(1), revealMs + 250);
    const t2 = window.setTimeout(() => setWavePass(2), revealMs + 250 + WAVE_PASS_MS);
    const t3 = window.setTimeout(() => setWavePass(0), revealMs + 250 + WAVE_PASS_MS * 2);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [started, revealMs, motionHidden]);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ aspectRatio: `${IMAGE_ASPECT}` }}
      aria-hidden
    >
      <div
        className="absolute inset-0 grid overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        }}
      >
        {cubes.map((c) => {
          const waveDelayMs =
            wavePass === 1 ? c.col * 55 : wavePass === 2 ? (GRID_COLS - 1 - c.col) * 55 : 0;
          return (
            <div
              key={`${c.col}-${c.row}`}
              style={{
                gridColumn: c.col + 1,
                gridRow: c.row + 1,
                backgroundImage: `url(${IMAGE_SRC})`,
                backgroundSize: `${GRID_COLS * 100}% ${GRID_ROWS * 100}%`,
                backgroundPosition: `${(c.col / (GRID_COLS - 1)) * 100}% ${(c.row / (GRID_ROWS - 1)) * 100}%`,
                opacity: motionHidden ? 1 : started ? 1 : 0,
                transform:
                  !motionHidden && !started
                    ? `perspective(600px) rotateY(${c.spin}deg) rotateX(${c.tilt}deg) scale(0.4)`
                    : "perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)",
                transitionProperty: "opacity, transform",
                transitionDuration: motionHidden ? "0ms" : `${c.duration}s`,
                transitionDelay: motionHidden ? "0ms" : `${c.delay}s`,
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                willChange: "opacity, transform",
              }}
            >
              {/* Re-keyed per pass so the keyframe animation restarts instead
                  of only firing once (a CSS animation won't replay just
                  because its animation-delay prop changes). */}
              {wavePass > 0 && (
                <div
                  key={`wave-${wavePass}`}
                  className="h-full w-full cube-wave"
                  style={{ animationDelay: `${waveDelayMs}ms` }}
                />
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes cube-wave-pulse {
          0% { filter: brightness(1); }
          45% { filter: brightness(2) saturate(1.4); }
          100% { filter: brightness(1); }
        }
        .cube-wave {
          animation: cube-wave-pulse 320ms ease-in-out;
        }
      `}</style>
    </div>
  );
}
