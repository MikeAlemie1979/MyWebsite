"use client";

import React, { useEffect, useState } from "react";

/**
 * Full-page black loading overlay with a circular spinner and a smoothed
 * numeric percentage. Shown only when a page's data fetch takes longer than
 * the caller's own threshold (there's no real byte-progress for a JSON
 * fetch, so the percentage eases toward 90% and jumps to 100 on completion —
 * standard practice for indeterminate loads).
 */
export function LoadingOverlay({ show }: { show: boolean }) {
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setPercent(0);
      const start = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        // Eases toward 90% over ~3s, never completing on its own.
        setPercent(Math.min(90, Math.round(90 * (1 - Math.exp(-elapsed / 1200)))));
      }, 80);
      return () => clearInterval(interval);
    }

    // Jump to 100 then fade the overlay out, instead of a hard cut.
    setPercent(100);
    const timeout = setTimeout(() => setVisible(false), 250);
    return () => clearTimeout(timeout);
  }, [show]);

  if (!visible) return null;

  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - percent / 100);

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-4 bg-black transition-opacity duration-200"
      style={{ opacity: show ? 1 : 0 }}
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
        <circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          stroke="#DEF520"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 80ms linear" }}
        />
      </svg>
      <span className="text-white text-sm font-medium tracking-wide">{percent}%</span>
    </div>
  );
}
