"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTheme } from "@/context/theme-context";
import { CubeReveal, type CubeRevealHandle } from "./cube-reveal";

// Fallback used until the admin-configured sentences load (and if that API
// is ever unreachable) — was previously the only source, now the default.
const DEFAULT_SENTENCES = [
  "DON'T JUST BUILD IT. ENGINEER IT FOR THE PERFECTION.",
  "YOU DESCRIBE, I ENGINEER & FLOWCHART IT.",
  "SMART ARCHITECTURE. GREAT DESIGN. REAL IMPACT.",
  "RENEW & EMPOWER YOUR BUSINESS FOR THE BETTER SHINNING.",
  "BREAK THE ORDINARY FASHION. REBUILD FOR THE FUTURE.",
  "DESIGNED TO IMPRESS. ENGINEERED TO FIX & PERFORM.",
  "WEB APP & DATABASE ARCHITECTURE FOR COMPLEX PROJECTS IS MY DNA.",
  "MEHRDAD MIKE ALEMIE.",
];
const DEFAULT_FONT_FAMILY = "Michroma";
const DEFAULT_FONT_SIZE = 42;
const DEFAULT_TEXT_COLOR = "#ffffff";
const DEFAULT_LETTER_SPACING = 1;

interface HomeTextConfig {
  sentences: { id: string; text: string }[];
  fontFamily: string;
  fontSize: number;
  textColor: string;
  letterSpacing: number;
}

const ASH_COLORS = ["#8a8a8a", "#4a4a4a", "#ffffff", "#b5b5b5", "#3a3a3a"];

type Rgb = [number, number, number];

function parseHex(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [255, 255, 255];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Particles drift in as ash and settle into the admin-chosen text colour. The
// blend runs per-particle per-frame, so the results are quantised into a small
// lookup table built once per config change rather than mixed in the RAF loop —
// thousands of particles at 60fps make even a hex parse per draw call costly.
const BLEND_STEPS = 16;

function buildBlendTable(textColor: string): string[][] {
  const [tr, tg, tb] = parseHex(textColor);
  return ASH_COLORS.map((ash) => {
    const [ar, ag, ab] = parseHex(ash);
    return Array.from({ length: BLEND_STEPS + 1 }, (_, i) => {
      const t = i / BLEND_STEPS;
      const r = Math.round(ar + (tr - ar) * t);
      const g = Math.round(ag + (tg - ag) * t);
      const b = Math.round(ab + (tb - ab) * t);
      return `rgb(${r},${g},${b})`;
    });
  });
}

// Scroll budget: each sentence gets one viewport of scroll to assemble and
// hold, plus a fall phase, plus a hold phase while Mehrdad.png is fully
// visible so scroll cannot release before the reveal finishes.
const VH_PER_SENTENCE = 1.15;
const VH_FOR_FALL = 1.6;
// The cube reveal is time-driven (~7.6s of tumble-in + two ~1.2s wave passes,
// see cube-reveal.tsx), so the pin has to be long enough that a normal scroll
// cannot outrun it. Sized to hold the section through the whole motion.
const VH_FOR_CUBE = 6;

interface Particle {
  tx: number; // target position in the formed glyph
  ty: number;
  sx: number; // off-screen origin it darts in from
  sy: number;
  size: number;
  color: string;
  arrive: number; // 0–1 point in the sentence's window when it lands
  fallDelay: number;
  fallSpeed: number;
  drift: number;
  spark: boolean;
}

/**
 * Samples the rendered text and returns one particle per lit pixel cell.
 */
function buildParticles(
  ctx: CanvasRenderingContext2D,
  text: string,
  w: number,
  h: number,
  fontFamily: string
): Particle[] {
  const fontSize = Math.max(24, Math.min(68, w / 20));
  ctx.clearRect(0, 0, w, h);
  ctx.font = `700 ${fontSize}px '${fontFamily}', system-ui, sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Wrap to keep long sentences on screen.
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const probe = line ? `${line} ${word}` : word;
    if (ctx.measureText(probe).width > w * 0.8 && line) {
      lines.push(line);
      line = word;
    } else {
      line = probe;
    }
  }
  if (line) lines.push(line);

  const lineHeight = fontSize * 1.35;
  const startY = h / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, w / 2, startY + i * lineHeight));

  const img = ctx.getImageData(0, 0, w, h).data;
  const particles: Particle[] = [];
  const step = 3;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (img[(y * w + x) * 4 + 3] > 128) {
        const edge = Math.floor(Math.random() * 4);
        let sx = 0;
        let sy = 0;
        if (edge === 0) { sx = Math.random() * w; sy = -60 - Math.random() * 300; }
        else if (edge === 1) { sx = w + 60 + Math.random() * 300; sy = Math.random() * h; }
        else if (edge === 2) { sx = Math.random() * w; sy = h + 60 + Math.random() * 300; }
        else { sx = -60 - Math.random() * 300; sy = Math.random() * h; }

        particles.push({
          tx: x,
          ty: y,
          sx,
          sy,
          size: 1 + Math.random() * 4, // 1px – 5px
          color: ASH_COLORS[(Math.random() * ASH_COLORS.length) | 0],
          arrive: 0.25 + Math.random() * 0.7,
          fallDelay: Math.random() * 0.45,
          fallSpeed: 0.4 + Math.random() * 2.2,
          drift: (Math.random() - 0.5) * 1.4,
          spark: Math.random() < 0.03,
        });
      }
    }
  }
  ctx.clearRect(0, 0, w, h);
  return particles;
}

export function AshTextSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cubeWrapRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<CubeRevealHandle>(null);
  const { motionHidden } = useTheme();

  // Admin-configurable via the "Home Ash Text" panel (/api/admin/home-text).
  // Previously this section ignored that config entirely and always used the
  // hardcoded defaults below — falls back to them if the fetch is empty,
  // errors, or hasn't resolved yet.
  const [sentences, setSentences] = useState<string[]>(DEFAULT_SENTENCES);
  const [fontFamily, setFontFamily] = useState(DEFAULT_FONT_FAMILY);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/home-text")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HomeTextConfig | null) => {
        if (cancelled || !data) return;
        const texts = Array.isArray(data.sentences)
          ? data.sentences.map((s) => s.text?.trim()).filter((t): t is string => !!t)
          : [];
        if (texts.length > 0) setSentences(texts);
        if (data.fontFamily) setFontFamily(data.fontFamily);
      })
      .catch(() => {
        // Keep the hardcoded defaults — this section must still render
        // correctly if the admin API is unreachable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const reduced =
      motionHidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let sets: Particle[][] = [];

    const build = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      sets = sentences.map((s) => buildParticles(ctx, s, w, h, fontFamily));
    };
    build();

    let resizeTimer: number;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(build, 200);
    };
    window.addEventListener("resize", onResize);

    // Reduced motion: draw every sentence solid, no scroll choreography.
    if (reduced) {
      ctx.clearRect(0, 0, w, h);
      const last = sets[0];
      ctx.fillStyle = "#b5b5b5";
      last.forEach((p) => ctx.fillRect(p.tx, p.ty, p.size, p.size));
      if (cubeWrapRef.current) cubeWrapRef.current.style.opacity = "1";
      cubeRef.current?.setProgress(1);
      return () => {
        window.removeEventListener("resize", onResize);
        window.clearTimeout(resizeTimer);
      };
    }

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    let raf = 0;
    const frame = () => {
      const rect = wrapper.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;

      ctx.clearRect(0, 0, w, h);

      const totalBudget = sentences.length * VH_PER_SENTENCE + VH_FOR_FALL + VH_FOR_CUBE;
      const formSpan = (sentences.length * VH_PER_SENTENCE) / totalBudget;
      const fallEnd  = (sentences.length * VH_PER_SENTENCE + VH_FOR_FALL) / totalBudget;

      // The reveal starts a quarter into the ash-fall and runs to the very end
      // of the section's scroll budget. Because it is driven from scroll
      // position rather than elapsed time, the section physically cannot
      // release before the portrait has finished assembling — reaching the
      // release point and completing the reveal are the same event.
      const cubeStart = formSpan + (fallEnd - formSpan) * 0.25;
      const cubeProgress = Math.max(0, Math.min(1, (progress - cubeStart) / (1 - cubeStart)));
      cubeRef.current?.setProgress(cubeProgress);
      if (cubeWrapRef.current) {
        // Fade the wrapper up over the first slice of the reveal so the
        // portrait arrives out of the ash rather than switching on.
        cubeWrapRef.current.style.opacity = String(Math.min(1, cubeProgress / 0.18));
      }

      if (progress <= formSpan) {
        // Assembly phase: which sentence, and how far along is it.
        const local = (progress / formSpan) * sentences.length;
        const index = Math.min(sentences.length - 1, Math.floor(local));
        const t = local - index;
        const particles = sets[index];
        if (!particles) {
          raf = requestAnimationFrame(frame);
          return;
        }

        for (const p of particles) {
          const k = Math.min(1, Math.max(0, t / p.arrive));
          const e = easeOut(k);
          const x = p.sx + (p.tx - p.sx) * e;
          const y = p.sy + (p.ty - p.sy) * e;
          ctx.globalAlpha = 0.15 + e * 0.85;
          ctx.fillStyle = p.color;
          ctx.fillRect(x, y, p.size, p.size);
        }

      } else if (progress <= fallEnd) {
        // Dissolution: the last sentence falls like ash.
        const fall = (progress - formSpan) / (fallEnd - formSpan);
        const particles = sets[sentences.length - 1];
        if (!particles) {
          raf = requestAnimationFrame(frame);
          return;
        }

        for (const p of particles) {
          const f = Math.max(0, (fall - p.fallDelay) / (1 - p.fallDelay));
          if (f <= 0) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.tx, p.ty, p.size, p.size);
            continue;
          }
          const y = p.ty + f * f * h * p.fallSpeed;
          const x = p.tx + Math.sin(f * 6 + p.tx * 0.05) * 18 * p.drift;
          const alpha = Math.max(0, 1 - f * 1.25);
          if (alpha <= 0) continue;

          ctx.globalAlpha = alpha;
          if (p.spark && f < 0.6) {
            ctx.fillStyle = f % 0.2 < 0.1 ? "#ffb347" : "#fff2c4";
            ctx.shadowBlur = 6;
            ctx.shadowColor = "#ff8c1a";
          } else {
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 0;
          }
          ctx.fillRect(x, y, p.size, p.size);
          ctx.shadowBlur = 0;
        }

      } else {
        // Cube phase: ash is gone and the portrait assembles under scroll.
        // Opacity and per-cube state are both set above, from cubeProgress —
        // the canvas is already cleared at the top of the frame, so there is
        // nothing left to draw here.
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
    };
  }, [motionHidden, sentences, fontFamily]);

  const totalVh = sentences.length * VH_PER_SENTENCE + VH_FOR_FALL + VH_FOR_CUBE;

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: `${totalVh * 100}vh`, backgroundColor: "var(--theme-bg)" }}
      aria-label="Manifesto"
    >
      <div className="sticky top-0 h-screen w-full">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />

        {/* Mehrdad.png reveal — mounted here (not as a separate section
            below) so it fades in while this section is still pinned. Opacity
            is set imperatively by the RAF loop above, not React state, to
            stay frame-smooth.

            Spans the full page width and is anchored to the bottom of the
            pinned viewport, so it meets the next section's edge flush with no
            dark strip between them. Height comes from CubeReveal's own
            aspect-ratio box, so the portrait keeps its 1840/913 proportions
            and is never squeezed narrow or stretched wide.

            At full width that makes it taller than the viewport, so the
            surplus runs off the top — where a mask dissolves it into the
            section background rather than letting it end on a hard cut. The
            bottom edge is the one that has to stay flush, so the overflow is
            pushed to the top deliberately. */}
        <div
          ref={cubeWrapRef}
          className="pointer-events-none absolute left-0 bottom-0 w-screen z-10"
          style={{
            opacity: 0,
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 8%, #000 22%, #000 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 8%, #000 22%, #000 100%)",
          }}
        >
          <CubeReveal ref={cubeRef} />
        </div>

        <motion.div
          aria-hidden
          className="pointer-events-none select-none absolute left-0 z-20"
          style={{ bottom: "-31px" }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src="/images/ash-left.png"
            alt=""
            width={1024}
            height={1024}
            className="h-[30vh] w-auto max-h-[320px] object-contain"
          />
        </motion.div>
        <motion.div
          aria-hidden
          className="pointer-events-none select-none absolute right-0 z-20"
          style={{ bottom: "-31px" }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src="/images/ash-right.png"
            alt=""
            width={1024}
            height={1024}
            className="h-[30vh] w-auto max-h-[320px] object-contain"
          />
        </motion.div>

        {/* Accessible equivalent of the animated sentences. */}
        <ul className="sr-only">
          {sentences.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
