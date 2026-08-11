"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useTheme } from "@/context/theme-context";

/**
 * Living neon sphere.
 *
 * The surface is driven by 3D simplex noise run through domain warping: the
 * noise field is sampled at a position that is itself displaced by noise, which
 * makes the colour boundaries creep and roll into one another instead of
 * sliding rigidly. Four neon colours (each with an analogous "surrounding"
 * shade for organic texture) are mixed by that field, and a fresnel
 * term lifts the rim so the ball reads as glossy and translucent rather than
 * as a flat disc.
 *
 * Motion never visibly repeats because the animated inputs advance at three
 * mutually irrational rates — the combined pattern has no short common period.
 */

const VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vView;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform sampler2D uTex;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uColorD;
  uniform vec3 uColorA2;
  uniform vec3 uColorB2;
  uniform vec3 uColorC2;
  uniform vec3 uColorD2;
  uniform vec2 uPointer;

  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vView;

  // --- Ashima simplex noise (public domain / MIT) ---
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p) {
    float f = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      f += amp * snoise(p);
      p *= 2.02;
      amp *= 0.5;
    }
    return f;
  }

  void main() {
    vec3 p = normalize(vPos);

    // Wrap the reference artwork around the ball with an equirectangular
    // mapping, so every orientation shows real texture. Projecting the image
    // straight onto the disc (uv = p.xy) looks exact head-on but has a pole:
    // rotate 90 degrees and the visible face samples the image's outer rim,
    // draining the centre to black.
    //
    // Longitude ping-pongs (0->1->0) instead of repeating, which removes the
    // seam that a plain wrap leaves down the meridian.
    // An equirectangular mapping is degenerate at its own two poles: every
    // longitude line converges there, so the artwork gets smeared into a
    // radial starburst / washed-out disc whenever a pole rotates into view.
    // Painting over it with synthesised noise only trades the smear for a
    // flat patch, because no amount of blending fixes a bad sample.
    //
    // Instead, build a SECOND mapping whose poles sit on the X axis — exactly
    // where the first mapping is best-conditioned — and cross-fade to it as
    // the fragment approaches the first mapping's poles. At every point on
    // the ball at least one of the two mappings is sampling cleanly, so the
    // surface keeps real texture edge to edge and there is no pole at all.
    float lonA = atan(p.z, p.x) / 6.2831853 + 0.5;
    float latA = asin(clamp(p.y, -1.0, 1.0)) / 3.1415927 + 0.5;
    vec2 uvA = vec2(abs(fract(lonA) * 2.0 - 1.0), latA);

    float lonB = atan(p.y, p.z) / 6.2831853 + 0.5;
    float latB = asin(clamp(p.x, -1.0, 1.0)) / 3.1415927 + 0.5;
    vec2 uvB = vec2(abs(fract(lonB) * 2.0 - 1.0), latB);

    // Solar convection: displace the sample point by a slow noise field so
    // the surface roils in place — cells swelling, drifting and merging like
    // granulation on the sun — rather than the artwork sitting rigidly on the
    // geometry and only moving because the ball spins underneath it.
    //
    // Two octaves at different rates and scales: a broad slow churn for the
    // large convective cells, and a finer faster one for the shimmer between
    // them. Both are small in amplitude, so the source art stays recognisable.
    float tc = uTime * 0.05;
    vec2 churnBroad = vec2(
      fbm(p * 1.7 + vec3(0.0, tc, 0.0)),
      fbm(p * 1.7 + vec3(5.3, -tc, 2.1))
    );
    vec2 churnFine = vec2(
      fbm(p * 4.6 + vec3(tc * 2.3, 0.0, 1.7)),
      fbm(p * 4.6 + vec3(-1.9, tc * 2.7, -3.4))
    );
    vec2 churnOffset = churnBroad * 0.085 + churnFine * 0.025;

    // Colour migration. The churn above only wobbles each point around its
    // own patch of the artwork, so every spot on the ball keeps showing the
    // same colours. Drifting the whole sample window as well — at two
    // incommensurate rates, so the path does not retrace itself — sweeps the
    // colours across the entire surface, and any given spot eventually sees
    // every part of the source rather than being tied to one region of it.
    vec2 drift = vec2(uTime * 0.017, uTime * 0.011);
    vec2 totalOffset = churnOffset + drift;
    uvA += totalOffset;
    uvB += totalOffset;

    // Mirror-fold back into range rather than clamping. Clamping would stall
    // the drift against the texture edge, and a plain fract() would snap with
    // a hard seam; folding reverses direction smoothly so the migration runs
    // indefinitely with no visible break.
    uvA = abs(fract(uvA) * 2.0 - 1.0);
    uvB = abs(fract(uvB) * 2.0 - 1.0);

    // Sample only the middle of the source, which is solidly inside the
    // painted ball — the outer frame is the dark background and its glow, and
    // wrapping that around would band the sphere with black at the poles.
    uvA = vec2(0.22) + uvA * 0.56;
    uvB = vec2(0.22) + uvB * 0.56;

    // Cross-fade to mapping B as mapping A approaches its poles. The blend
    // completes before A degenerates badly, so the smeared region is never
    // the one on screen.
    float poleBlend = smoothstep(0.55, 0.88, abs(p.y));
    vec3 col = mix(texture2D(uTex, uvA).rgb, texture2D(uTex, uvB).rgb, poleBlend);

    // Granulation brightness: bright convective cells that swell and fade
    // across the surface. Driven by a moving noise field rather than a single
    // global sin(), so light travels over the ball the way it does on the
    // sun — one region brightening while another dims — instead of the whole
    // sphere pulsing in unison. Computed before the pole cap so the cap can
    // reuse the same fields and carry the same texture, instead of reading as
    // a flat, unlit patch.
    float granule = fbm(p * 3.4 + vec3(tc * 1.6, tc * 0.8, -tc * 1.2)) * 0.5 + 0.5;
    float hueDrift = fbm(p * 2.1 + vec3(-tc * 1.1, tc * 1.4, tc * 0.7)) * 0.5 + 0.5;

    // No synthesised pole cap here any more. Blending the pole region toward
    // generated noise was covering the smear rather than removing it, and at
    // any width wide enough to hide the artefact it read as a soft,
    // desaturated patch stuck to the bottom of the ball. The dual-mapping
    // cross-fade above removes the degenerate sample itself, so the surface
    // is real texture everywhere and needs nothing painted over it.

    col *= 0.86 + 0.30 * granule;

    // Faint hue drift riding the same field, so the warm and cool areas
    // migrate with the cells instead of shifting uniformly.
    col = mix(col, mix(uColorA, uColorC, hueDrift), 0.06);

    // Fresnel rim — electric cyan-white edge for a glassy shell look.
    float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.0);
    col = mix(col, vec3(0.75, 1.0, 1.0), fres * 0.35);

    // Cursor specular — a tight glint that tracks the pointer across the
    // shell. This was previously a screen-space falloff on p.xy with a broad
    // exponent, which left a large hazy bloom sitting permanently over the
    // middle of the ball whenever the pointer was at its (0,0) default: it
    // washed out the surface texture underneath and, unlike everything else
    // on the sphere, never rotated away. Driving it off the surface normal
    // against a pointer-steered light direction, with a much tighter
    // exponent, makes it read as a small moving highlight on a glassy shell
    // instead of a fixed smudge.
    vec3 lightDir = normalize(vec3(uPointer * 1.15, 1.0));
    float ndl = max(0.0, dot(normalize(vNormal), lightDir));
    float spec = pow(ndl, 110.0);
    col = mix(col, vec3(1.0), spec * 0.22);

    // No brightness or saturation grading here — the reference image already
    // carries the exact neon look we want, and pushing it further only clips
    // the highlights and drifts the hues away from it.
    col = clamp(col, 0.0, 1.0);

    // The reference's own background is black and its glow is drawn by the
    // CSS box-shadow behind the canvas, so keep the ball itself near-opaque.
    //
    // No fade term here: the mount fade is owned solely by the wrapper's CSS
    // opacity, which covers the canvas and the glow ring as one element. A
    // second eased ramp in the shader would multiply with that one, so the
    // surface colours would arrive on a steeper curve than the surrounding
    // glow instead of the two landing together at one pace.
    float alpha = clamp(0.94 + fres * 0.06, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;

// Lightens (positive amt) or darkens (negative amt) a hex colour toward
// white/black — used to derive each majority's "surrounding" analogous
// tone so the sphere reads as a real shaded material, not flat hex blocks.
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const mix = (c: number) => Math.round(amt >= 0 ? c + (255 - c) * amt : c + c * amt);
  const clamp = (c: number) => Math.max(0, Math.min(255, c));
  const [nr, ng, nb] = [mix(r), mix(g), mix(b)].map(clamp);
  return `#${((nr << 16) | (ng << 8) | nb).toString(16).padStart(6, "0")}`;
}

interface SpherePalette {
  majors: [string, string, string, string];
  neighbors: [string, string, string, string];
}

// Four majority colours per theme, in order, each paired with an analogous
// "surrounding" tone (alternating lighter/darker) so the surface reads as a
// real shiny material with organic variation instead of flat colour blocks.
const THEME_PALETTES: Record<string, SpherePalette> = {
  dark: {
    majors: ["#00C8F0", "#00506B", "#FF8A00", "#FFC400"],
    neighbors: ["#5CE9FF", "#0090B5", "#FFB43C", "#FFF07A"],
  },
  warm: {
    majors: ["#FF9D2E", "#7A2E00", "#FFE347", "#FFC700"],
    neighbors: ["#FFC77A", "#C24A00", "#FFF3A0", "#FF9E00"],
  },
  bright: {
    majors: ["#FF5FD4", "#7A1FCC", "#FFD400", "#00E5FF"],
    neighbors: ["#FFA6E8", "#B266F5", "#FFEC7A", "#7CF3FF"],
  },
};

export function NeonSphere({
  size = 220,
  scrollProgressRef,
}: {
  size?: number;
  /** 0→1 scroll-through-hero progress, read live each frame (not via React
   * state) so the spin can accelerate smoothly without re-running the effect. */
  scrollProgressRef?: React.RefObject<number>;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  // Sole owner of the mount fade. Wrapping the canvas and the glow ring in
  // one opacity ramp — rather than fading the ball in the shader and the ring
  // in CSS — is what makes the surface colours and the surrounding margin
  // arrive together at one pace instead of on two different curves.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const { majors, neighbors } = THEME_PALETTES[theme] ?? THEME_PALETTES.dark;
    const [hexA, hexB, hexC, hexD] = majors;
    const [hexA2, hexB2, hexC2, hexD2] = neighbors;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    // Framed so the unit sphere very nearly fills the canvas — otherwise the
    // 1px glow ring sits on the container edge with a black gap between it
    // and the sphere's actual silhouette.
    camera.position.z = 2.62;

    // The approved sphere artwork, mapped onto the geometry so it rotates.
    const texture = new THREE.TextureLoader().load("/images/sphere-ref.png");
    // Tagging the source as sRGB lets Three decode it to linear on sample and
    // re-encode on output, so the artwork round-trips to exactly the colours
    // in the file. Leaving it untagged renders the whole ball far too dark.
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const uniforms = {
      uTime: { value: 0 },
      uTex: { value: texture },
      uColorA: { value: new THREE.Color(hexA) },
      uColorB: { value: new THREE.Color(hexB) },
      uColorC: { value: new THREE.Color(hexC) },
      uColorD: { value: new THREE.Color(hexD) },
      uColorA2: { value: new THREE.Color(hexA2) },
      uColorB2: { value: new THREE.Color(hexB2) },
      uColorC2: { value: new THREE.Color(hexC2) },
      uColorD2: { value: new THREE.Color(hexD2) },
      uPointer: { value: new THREE.Vector2(0, 0) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      // Normal (not additive) blending: additive summed the rim, filament and
      // specular terms past 1.0 everywhere and clipped the ball to flat white.
      // depthWrite:false still lets the translucent far side show through.
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 64), material);
    // Random starting orientation so the sphere doesn't always fade in
    // facing the same way — reads as tumbling in from an arbitrary spin.
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.rotation.z = Math.random() * Math.PI * 2;
    scene.add(mesh);

    const onPointer = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      uniforms.uPointer.value.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      );
    };
    window.addEventListener("mousemove", onPointer, { passive: true });

    const clock = new THREE.Clock();
    let raf = 0;
    const frame = () => {
      const elapsed = clock.getElapsedTime();
      uniforms.uTime.value = elapsed;
      // Scrolling past the hero spins the sphere progressively faster —
      // up to ~9x its idle rate at full scroll-through.
      const progress = scrollProgressRef?.current ?? 0;
      mesh.rotation.y += 0.0016 * (1 + progress * 8);
      mesh.rotation.x = Math.sin(elapsed * 0.09) * 0.22;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };

    if (reduced) {
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onPointer);
      mesh.geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [size, theme]);

  return (
    <div
      className="relative"
      style={{ width: size, height: size, opacity: visible ? 1 : 0, transition: "opacity 1.8s linear" }}
    >
      {/* 1px ring hugging the sphere, bleeding outward into the page so the
          ball reads as lighting its own surroundings. */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: "-1px",
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: `
            0 0 28px 4px rgba(0, 240, 255, 0.55),
            0 0 70px 18px rgba(255, 140, 20, 0.42),
            0 0 130px 40px rgba(100, 180, 200, 0.15),
            0 0 240px 90px rgba(240, 180, 80, 0.10)
          `,
        }}
      />
      <div ref={mountRef} aria-hidden style={{ width: size, height: size }} />
    </div>
  );
}
