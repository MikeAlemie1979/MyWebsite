"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useTheme } from "@/context/theme-context";
import { NeonSphere } from "./neon-sphere";
import { FlashTexts } from "./sphere-typography";

// 240px radius per the design spec.
const SPHERE_SIZE = 480;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// Scrolling past the hero drifts the sphere off along one of these
// compass-ish directions — north-east, north-west, west, or east — picked
// once per page load so the exit path stays consistent for that visit.
const DRIFT_DIRECTIONS = [
  { x: 1, y: -1 }, // north-east
  { x: -1, y: -1 }, // north-west
  { x: -1, y: 0 }, // west
  { x: 1, y: 0 }, // east
];
const DRIFT_DISTANCE = 620;

// "DS" = the preloaded dots-and-stars band. Fixed height, centred on the
// sphere's vertical middle (its "waist").
const DS_HEIGHT = 400;
const NEON_STAR_COLORS = ["#ffffff", "#fff8e1", "#ffe9a8", "#fff2c4"];
const DS_STAR_COUNT = 1000;

interface NeonStar {
  x: number;
  y: number;
  size: number;
  color: string;
  dx: number;
  dy: number;
  flashPhase: number;
  flashSpeed: number;
  isStar: boolean;
  pathSlot: number;
  followSpeed: number;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmp: number;
}

/** Draws a 4-point sparkle/star shape (not just a round dot) at (x,y). */
function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const r = size * 1.6;
  const rInner = r * 0.28;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.closePath();
  ctx.fill();
  // Tiny bright core so the sparkle reads clearly even at small sizes.
  ctx.beginPath();
  ctx.arc(x, y, rInner, 0, Math.PI * 2);
  ctx.fill();
}

// How many recent mouse positions are recorded while hovering the DS band.
// Stars are assigned a fixed slot into this path, so as the pointer moves
// they trace the exact route it took — a rope, not a straight-line chase.
const DS_TRAIL_HISTORY = 400;

/** Canvas-based star band (thousands of particles would be far too many live
 * DOM nodes — one canvas redrawn every frame is the only way this stays
 * smooth). Each particle wanders in its own random direction at its own
 * random speed and flickers independently; roughly a quarter render as
 * actual 4-point star sparkles rather than plain round dots, so both read
 * distinctly among the field. While the pointer is over the band, stars pull
 * onto the path it has actually traced instead of chasing its live position. */
function TopStarBand() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { motionHidden, mouseTrailDisabled } = useTheme();

  useEffect(() => {
    // "Hide motion / dots" hides the field outright, not just freezes it.
    if (motionHidden) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const stars: NeonStar[] = Array.from({ length: DS_STAR_COUNT }, (_, i) => ({
      x: rand(0, width),
      y: rand(0, height),
      size: rand(1, 7),
      color: NEON_STAR_COLORS[Math.floor(Math.random() * NEON_STAR_COLORS.length)],
      dx: rand(-18, 18) || 4,
      dy: rand(-18, 18) || 4,
      flashPhase: rand(0, Math.PI * 2),
      flashSpeed: rand(0.5, 3),
      isStar: Math.random() < 0.25,
      // Deterministic slot into the recorded mouse path, spread evenly across
      // however much history exists so the whole field traces the rope
      // together rather than bunching at one end of it.
      pathSlot: i % DS_TRAIL_HISTORY,
      // Each star chases the path at its own random pace — without this every
      // star eases at the same fraction-per-frame, which just shrinks the
      // field's original rectangular scatter uniformly toward the path and
      // reads as a square collapsing rather than an organic swarm.
      followSpeed: rand(0.03, 0.22),
      wobblePhase: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.6, 2.4),
      wobbleAmp: rand(2, 14),
    }));

    const handleResize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener("resize", handleResize);

    // Recorded path of the pointer while it's over the band — newest first.
    const path: { x: number; y: number }[] = [];
    let hovering = false;
    let followStrength = 0; // eases 0→1 on hover-in, 1→0 on hover-out

    const onMove = (e: MouseEvent) => {
      if (mouseTrailDisabled) return;
      const rect = canvas.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      hovering = inside;
      if (!inside) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      path.unshift({ x, y });
      if (path.length > DS_TRAIL_HISTORY) path.length = DS_TRAIL_HISTORY;
    };
    const onLeave = () => {
      hovering = false;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    let frameId: number;
    let last = performance.now();

    const animate = (now: number) => {
      frameId = requestAnimationFrame(animate);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      const wantFollow = hovering && !mouseTrailDisabled && path.length > 0;
      followStrength += ((wantFollow ? 1 : 0) - followStrength) * Math.min(1, delta * 3);

      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        if (followStrength > 0.01) {
          // Map this star's slot proportionally against however much path
          // actually exists yet, instead of clamping straight to the last
          // recorded point — otherwise most stars pile onto the same one or
          // two points whenever the path is still short.
          const idx = Math.floor((s.pathSlot / DS_TRAIL_HISTORY) * (path.length - 1));
          const point = path[Math.max(0, Math.min(idx, path.length - 1))];
          // Small perpendicular wander so stars don't travel in dead-straight
          // lines toward the path — that straight-line convergence is what
          // made the whole field's original rectangular scatter visibly
          // shrink into a square as it collapsed.
          const wobbleX = Math.cos(now * 0.001 * s.wobbleSpeed + s.wobblePhase) * s.wobbleAmp;
          const wobbleY = Math.sin(now * 0.0013 * s.wobbleSpeed + s.wobblePhase) * s.wobbleAmp;
          const targetX = point.x + wobbleX * followStrength;
          const targetY = point.y + wobbleY * followStrength;
          // Each star eases at its own random speed, so the swarm traces the
          // path raggedly rather than as one uniformly-scaling block.
          const pullX = (targetX - s.x) * s.followSpeed * followStrength;
          const pullY = (targetY - s.y) * s.followSpeed * followStrength;
          s.x += pullX + s.dx * delta * (1 - followStrength);
          s.y += pullY + s.dy * delta * (1 - followStrength);
        } else {
          s.x += s.dx * delta;
          s.y += s.dy * delta;
        }
        if (s.x < 0) s.x += width;
        if (s.x > width) s.x -= width;
        if (s.y < 0) s.y += height;
        if (s.y > height) s.y -= height;

        const flash = 0.35 + 0.65 * Math.abs(Math.sin(now * 0.001 * s.flashSpeed + s.flashPhase));
        ctx.globalAlpha = flash;
        ctx.fillStyle = s.color;
        if (s.isStar) {
          drawSparkle(ctx, s.x, s.y, s.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [motionHidden, mouseTrailDisabled]);

  if (motionHidden) return null;

  return (
    <div
      aria-hidden
      className="absolute pointer-events-none select-none"
      style={{
        // Vertically centred on the hero's centreline, which is where the
        // sphere itself sits (justify-center in the section's flex column) —
        // so the band crosses exactly through the sphere's waist.
        top: "50%",
        left: 0,
        width: "100%",
        height: `${DS_HEIGHT}px`,
        transform: "translateY(-50%)",
      }}
    >
      <canvas ref={canvasRef} className="ds-band absolute inset-0 h-full w-full" />
      {/* Top and bottom edges fade into the section background so the band
          blends instead of cutting off with a hard edge. Uses the theme
          variable, not a hardcoded black — on the warm and bright themes a
          black fade paints a visible dark rectangle across the hero. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--theme-bg) 0%, transparent 22%, transparent 78%, var(--theme-bg) 100%)",
        }}
      />
    </div>
  );
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollProgressRef = useRef(0);
  const { motionHidden } = useTheme();

  // Picked once per mount so the sphere's scroll-exit path is stable for the
  // whole visit rather than re-randomizing on every re-render.
  const [drift] = useState(() => DRIFT_DIRECTIONS[Math.floor(Math.random() * DRIFT_DIRECTIONS.length)]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    scrollProgressRef.current = v;
  });

  const sphereX = useTransform(scrollYProgress, [0, 1], [0, motionHidden ? 0 : drift.x * DRIFT_DISTANCE]);
  const sphereXWithOffset = useTransform(sphereX, (v) => v + 220);
  const sphereY = useTransform(scrollYProgress, [0, 1], [0, motionHidden ? 0 : drift.y * DRIFT_DISTANCE]);
  const sphereScale = useTransform(scrollYProgress, [0, 1], [1, motionHidden ? 1 : 0.35]);
  const sphereOpacity = useTransform(scrollYProgress, [0, 1], [1, motionHidden ? 1 : 0]);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden section-spacing"
      style={{ marginTop: "0px" }}
    >
      <div
        className="absolute inset-0 -z-10 transition-colors duration-700"
        style={{ backgroundColor: "var(--theme-bg)" }}
      />

      <TopStarBand />

      {/* Corner figure — fades in on load, pinned to the hero's bottom-left. */}
      <motion.div
        aria-hidden
        className="pointer-events-none select-none absolute left-0 z-0"
        style={{ bottom: "17px" }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Image
          src="/images/home-figure.png"
          alt=""
          width={1024}
          height={1024}
          className="h-[35vh] w-auto max-h-[370px] object-contain"
          priority
        />
      </motion.div>

      {/* Living neon sphere with its ring of drifting labels — accelerates,
          shrinks, drifts off in a random direction, and fades as the hero
          scrolls past. */}
      <motion.div
        className="relative z-[45] flex items-center justify-center"
        style={{ width: SPHERE_SIZE, height: SPHERE_SIZE, x: sphereXWithOffset, y: sphereY, scale: sphereScale, opacity: sphereOpacity }}
      >
        <NeonSphere size={SPHERE_SIZE} scrollProgressRef={scrollProgressRef} />
        <FlashTexts sphereSize={SPHERE_SIZE} />
      </motion.div>

      {/* Scroll cue */}
      <div
        className="motion-el absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
        style={{ animation: "bob 2.2s ease-in-out infinite" }}
      >
        <span className="text-[9px] tracking-[0.3em] uppercase">Scroll</span>
        <span
          style={{
            width: 1,
            height: 28,
            background: "linear-gradient(to bottom, currentColor, transparent)",
          }}
        />
      </div>

      <div className="cinematic-vignette" />
      <div className="film-grain" />

      <style jsx>{`
        @keyframes drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 30px) scale(1.15); }
        }
        @keyframes drift-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -40px) scale(1.1); }
        }
        @keyframes bob {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, 8px); }
        }
      `}</style>
    </section>
  );
}
