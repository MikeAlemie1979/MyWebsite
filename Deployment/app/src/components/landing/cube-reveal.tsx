"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useTheme } from "@/context/theme-context";

const IMAGE_SRC = "/images/mehrdad.png";
// Matches the source image's actual pixel ratio (1840x913) so cells never
// distort the sliced background.
const IMAGE_ASPECT = 1840 / 913;

// Trimmed off the bottom-anchored box's height. The grid inside keeps the
// full uncropped height, so the portrait is never squeezed — the surplus runs
// off the top, where the parent's mask gradient already dissolves it.
const HEIGHT_TRIM_PX = 108;

// Caps the bottom-anchored box's visible height so the reveal reads as a
// shorter strip instead of the previous near-full-viewport height — the
// grid inside still keeps its full uncropped aspect-ratio height, so this
// only changes how much runs off the top under the mask, never distorting
// the portrait itself.
const MAX_VISIBLE_HEIGHT_PX = 320;

const GRID_COLS = 12;
const GRID_ROWS = 6;

// Fraction of the reveal's scroll budget spent tumbling the cubes in. The
// remainder runs the two brightness wave passes over the assembled portrait.
const ASSEMBLE_END = 0.72;

interface CubeSpec {
  col: number;
  row: number;
  start: number; // normalised point in the reveal when this cube begins
  span: number; // how much of the reveal it takes to land
  spin: number; // degrees of Y-rotation it tumbles in from
  tilt: number; // degrees of X-rotation it tumbles in from
}

export interface CubeRevealHandle {
  /** Drives the whole reveal. 0 = nothing shown, 1 = fully assembled. */
  setProgress: (p: number) => void;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Slices Mehrdad.png into a cube grid that assembles under scroll control.
 *
 * This used to be time-driven: cubes animated via CSS transition delays once
 * an `active` flag flipped, and the parent held the page pinned for a fixed
 * scroll distance hoping to cover the ~10s runtime. That could always be
 * outrun — a fast scroll consumed the pin in a fraction of the animation's
 * duration and released the section mid-tumble, no matter how long the pin
 * was made. Driving every cube from a scroll-derived progress value instead
 * makes outrunning it impossible by construction: the reveal is only ever as
 * far along as the scroll is.
 */
export const CubeReveal = forwardRef<CubeRevealHandle>(function CubeReveal(_props, ref) {
  const { motionHidden } = useTheme();
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const cubes = useMemo<CubeSpec[]>(() => {
    const list: CubeSpec[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const span = rand(0.18, 0.4);
        list.push({
          col,
          row,
          // Staggered so cubes land in a scattered order rather than in
          // reading order, but always finishing within the assemble window.
          start: rand(0, ASSEMBLE_END - span * 0.5),
          span,
          spin: rand(180, 720) * (Math.random() < 0.5 ? -1 : 1),
          tilt: rand(-70, 70),
        });
      }
    }
    return list;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      setProgress(p: number) {
        const prog = clamp01(p);
        for (let i = 0; i < cubes.length; i++) {
          const el = cellRefs.current[i];
          if (!el) continue;
          const c = cubes[i];

          if (motionHidden) {
            el.style.opacity = "1";
            el.style.transform = "none";
            el.style.filter = "none";
            continue;
          }

          const t = easeOut(clamp01((prog - c.start) / c.span));
          el.style.opacity = String(t);
          el.style.transform =
            `perspective(600px) rotateY(${(1 - t) * c.spin}deg) ` +
            `rotateX(${(1 - t) * c.tilt}deg) scale(${0.4 + 0.6 * t})`;

          // Two brightness passes sweep the assembled grid once every cube
          // has landed — left-to-right, then back right-to-left.
          let bright = 1;
          if (prog > ASSEMBLE_END) {
            const w = (prog - ASSEMBLE_END) / (1 - ASSEMBLE_END); // 0..1
            const colN = c.col / (GRID_COLS - 1);
            const head = w < 0.5 ? (w / 0.5) : 1 - (w - 0.5) / 0.5;
            const target = w < 0.5 ? colN : 1 - colN;
            const d = Math.abs(head - target);
            bright = 1 + Math.max(0, 1 - d * 8) * 0.9;
          }
          el.style.filter = bright > 1.001 ? `brightness(${bright.toFixed(3)})` : "none";
        }
      },
    }),
    [cubes, motionHidden]
  );

  return (
    <div
      className="relative w-full overflow-hidden"
      // Aspect-ratio box minus the trim: the grid inside keeps the image's
      // true 1840/913 proportions, and the outer box crops height rather than
      // distorting it.
      style={{ height: `min(calc(100vw / ${IMAGE_ASPECT} - ${HEIGHT_TRIM_PX}px), ${MAX_VISIBLE_HEIGHT_PX}px)` }}
      aria-hidden
    >
      <div
        className="absolute inset-x-0 bottom-0 grid"
        style={{
          height: `calc(100vw / ${IMAGE_ASPECT})`,
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        }}
      >
        {cubes.map((c, i) => (
          <div
            key={`${c.col}-${c.row}`}
            ref={(el) => {
              cellRefs.current[i] = el;
            }}
            style={{
              gridColumn: c.col + 1,
              gridRow: c.row + 1,
              backgroundImage: `url(${IMAGE_SRC})`,
              backgroundSize: `${GRID_COLS * 100}% ${GRID_ROWS * 100}%`,
              backgroundPosition: `${(c.col / (GRID_COLS - 1)) * 100}% ${(c.row / (GRID_ROWS - 1)) * 100}%`,
              opacity: motionHidden ? 1 : 0,
              willChange: "opacity, transform, filter",
            }}
          />
        ))}
      </div>
    </div>
  );
});
