"use client";

/**
 * Shared rule for which pointer effect owns the cursor at a given position.
 *
 * The page is split at the Philosophy section: above it (from 180px down) the
 * particle trail follows the mouse; from Philosophy onward the crosshair
 * target takes over. Both effects read this single function so they can never
 * disagree and render at the same time.
 */

export const TRAIL_START_Y = 180;

export type PointerZone = "none" | "trail" | "target";

export function getPointerZone(clientY: number): PointerZone {
  const docY = window.scrollY + clientY;

  const philosophy = document.querySelector('section[aria-label="Philosophy"]');
  const philosophyTop = philosophy
    ? window.scrollY + philosophy.getBoundingClientRect().top
    : Number.POSITIVE_INFINITY;

  if (docY >= philosophyTop) return "target";
  if (docY >= TRAIL_START_Y) return "trail";
  return "none";
}
