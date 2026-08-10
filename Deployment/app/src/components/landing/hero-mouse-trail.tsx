"use client";

import React, { useEffect, useRef } from "react";

import { getPointerZone } from "@/components/common/pointer-zone";
import { useTheme } from "@/context/theme-context";

const TRAIL_COLORS = ["#ffffff", "#fff6dd", "#ffeec2", "#fff9ec"];
const IDLE_CONVERGE_MS = 4000;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  isStar: boolean;
  life: number; // 1 → 0
  decay: number;
  lag: number; // how strongly it chases the pointer
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(a + Math.PI / 4) * r * 0.4,
      y + Math.sin(a + Math.PI / 4) * r * 0.4,
      x + Math.cos(a) * r,
      y + Math.sin(a) * r
    );
    ctx.quadraticCurveTo(
      x + Math.cos(a - Math.PI / 4) * r * 0.4,
      y + Math.sin(a - Math.PI / 4) * r * 0.4,
      x,
      y
    );
  }
  ctx.fill();
}

/**
 * Rope-like particle trail. Active from 180px down the page until the
 * Philosophy section, where the crosshair target takes over — see
 * `getPointerZone`. Particles chase the pointer at staggered speeds so the
 * tail lags behind it; after the pointer sits still for 4s they rush inward
 * and vanish.
 */
export function HeroMouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read via the theme context so the M-menu's "Disable mouse trail" toggle
  // actually does something — previously this component never consulted it
  // and the trail ran everywhere regardless of the setting.
  const { mouseTrailDisabled } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (mouseTrailDisabled) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];
    let pointer = { x: -9999, y: -9999, inside: false };
    let lastMove = 0;

    const onMove = (e: MouseEvent) => {
      const inBand = getPointerZone(e.clientY) === "trail";
      pointer = { x: e.clientX, y: e.clientY, inside: inBand };
      if (!inBand) return;
      lastMove = performance.now();

      // Spawn a few particles per move, each with its own chase lag so the
      // group strings out behind the pointer like a rope.
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: e.clientX + (Math.random() * 8 - 4),
          y: e.clientY + (Math.random() * 8 - 4),
          vx: (Math.random() - 0.5) * 1.6,
          vy: (Math.random() - 0.5) * 1.6,
          size: 1 + Math.random() * 6, // 1px – 7px
          color: TRAIL_COLORS[(Math.random() * TRAIL_COLORS.length) | 0],
          isStar: Math.random() < 0.3,
          life: 1,
          decay: 0.004 + Math.random() * 0.010,
          lag: 0.006 + Math.random() * 0.05,
        });
      }
      if (particles.length > 500) particles.splice(0, particles.length - 500);
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    let raf = 0;
    const frame = () => {
      ctx.clearRect(0, 0, width, height);
      const now = performance.now();
      const idleFor = now - lastMove;
      const converging = idleFor > IDLE_CONVERGE_MS;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        if (converging) {
          // Rush the survivors into the pointer, then drop them.
          p.x += (pointer.x - p.x) * 0.14;
          p.y += (pointer.y - p.y) * 0.14;
          p.life -= 0.03;
        } else {
          p.x += p.vx + (pointer.x - p.x) * p.lag;
          p.y += p.vy + (pointer.y - p.y) * p.lag;
          p.life -= p.decay;
        }

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Particles read as crisp right at the pointer and blur out along
        // the tail — distance drives both alpha and blur.
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        const crisp = dist <= 3;

        ctx.globalAlpha = Math.max(0, Math.min(1, p.life)) * (crisp ? 1 : 0.75);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = crisp ? 0 : Math.min(8, dist * 0.12);
        ctx.shadowColor = p.color;

        if (p.isStar) {
          drawStar(ctx, p.x, p.y, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [mouseTrailDisabled]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
