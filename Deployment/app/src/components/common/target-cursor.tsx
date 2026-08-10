"use client";

import React, { useEffect, useRef, useState } from "react";
import { getPointerZone } from "./pointer-zone";

interface Dot {
  id: number;
  x: number;
  y: number;
  size: number;
  born: number;
}

const DOT_LIFETIME_MS = 4000;
const DOTS_PER_CLICK = 5;

/**
 * Replaces the system cursor with a two-ring crosshair that reports live X/Y,
 * and scatters short-lived red dots wherever the user clicks.
 *
 * Pointer position is written straight to the DOM via a ref rather than React
 * state — re-rendering on every mousemove would thrash the whole page.
 */
export function TargetCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [dots, setDots] = useState<Dot[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [inTargetZone, setInTargetZone] = useState(false);
  const nextId = useRef(0);

  useEffect(() => {
    // Only take over the cursor on devices that actually have one.
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      // The crosshair only owns the cursor from the Philosophy section down;
      // above that the particle trail is in charge.
      setInTargetZone(getPointerZone(e.clientY) === "target");
      const ring = ringRef.current;
      const label = labelRef.current;
      if (ring) ring.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      if (label) label.textContent = `X ${Math.round(e.clientX)}  Y ${Math.round(e.clientY)}`;
    };

    const onClick = (e: MouseEvent) => {
      if (getPointerZone(e.clientY) !== "target") return;
      const now = Date.now();
      const fresh: Dot[] = Array.from({ length: DOTS_PER_CLICK }, () => ({
        id: nextId.current++,
        x: e.clientX + (Math.random() * 60 - 30),
        y: e.clientY + (Math.random() * 60 - 30),
        size: 1 + Math.random() * 7, // 1px – 8px
        born: now,
      }));
      setDots((prev) => [...prev, ...fresh]);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
    };
  }, []);

  // Single interval reaps expired dots, rather than one timer per dot.
  useEffect(() => {
    if (dots.length === 0) return;
    const timer = setInterval(() => {
      const cutoff = Date.now() - DOT_LIFETIME_MS;
      setDots((prev) => prev.filter((d) => d.born > cutoff));
    }, 500);
    return () => clearInterval(timer);
  }, [dots.length]);

  // Drive the native-cursor override from the root element so the CSS above
  // can scope it, instead of hiding the cursor across the whole document.
  useEffect(() => {
    if (!enabled) return;
    document.documentElement.dataset.cursor = inTargetZone ? "target" : "default";
    return () => {
      delete document.documentElement.dataset.cursor;
    };
  }, [enabled, inTargetZone]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        className="target-cursor"
        aria-hidden
        style={{ opacity: inTargetZone ? 1 : 0 }}
      >
        <span className="target-ring-outer" />
        <span className="target-ring-inner" />
        <span className="target-cross target-cross-h" />
        <span className="target-cross target-cross-v" />
        <span ref={labelRef} className="target-coords" />
      </div>

      <div className="click-dot-layer" aria-hidden>
        {dots.map((d) => (
          <span
            key={d.id}
            className="click-dot"
            style={{
              left: `${d.x}px`,
              top: `${d.y}px`,
              width: `${d.size}px`,
              height: `${d.size}px`,
            }}
          />
        ))}
      </div>

      <style jsx global>{`
        /* Hide the native cursor only while the crosshair is actually the
           active effect — elsewhere the normal cursor must come back. */
        @media (hover: hover) and (pointer: fine) {
          html[data-cursor="target"],
          html[data-cursor="target"] * {
            cursor: none !important;
          }
        }

        .target-cursor {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
          pointer-events: none;
          will-change: transform;
        }
        .target-ring-outer,
        .target-ring-inner {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.85);
          transform: translate(-50%, -50%);
        }
        .target-ring-outer {
          width: 34px;
          height: 34px;
        }
        .target-ring-inner {
          width: 12px;
          height: 12px;
          border-color: rgba(255, 255, 255, 0.95);
        }
        .target-cross {
          position: absolute;
          background: rgba(255, 255, 255, 0.8);
          transform: translate(-50%, -50%);
        }
        .target-cross-h {
          width: 46px;
          height: 1px;
        }
        .target-cross-v {
          width: 1px;
          height: 46px;
        }
        .target-coords {
          position: absolute;
          left: 26px;
          top: 18px;
          font-size: 10px;
          letter-spacing: 0.08em;
          white-space: nowrap;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 0 4px rgba(0, 0, 0, 0.9);
        }

        .click-dot-layer {
          position: fixed;
          inset: 0;
          z-index: 9998;
          pointer-events: none;
        }
        .click-dot {
          position: absolute;
          border-radius: 50%;
          background: #ff2020;
          box-shadow: 0 0 6px rgba(255, 32, 32, 0.9);
          transform: translate(-50%, -50%);
          animation: click-dot-fade 4s linear forwards;
        }
        @keyframes click-dot-fade {
          0% { opacity: 1; }
          70% { opacity: 0.85; }
          100% { opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .click-dot {
            animation-duration: 4s;
          }
        }
      `}</style>
    </>
  );
}
