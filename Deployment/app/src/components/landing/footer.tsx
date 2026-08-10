"use client";

import React from "react";
import Image from "next/image";

const IMG_SIZE = 133;
const IMG_STYLE: React.CSSProperties = {
  width: `${IMG_SIZE}px`,
  height: `${IMG_SIZE}px`,
  flexShrink: 0,
  border: "3px solid #DEF520",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 0 18px rgba(222,245,32,0.6), inset 0 0 8px rgba(222,245,32,0.1)",
  position: "relative",
};

function InstagramIcon() {
  return (
    <svg width="55" height="55" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="55" height="55" viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* Same outer frame as Instagram's rounded square, so both icons read
          as identically sized — the glyphs alone have very different
          bounding boxes and don't align on their own. */}
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
      {/* The raw "f" glyph's bounding box isn't centered in its own
          coordinate space, so it's recentred and scaled here to sit inside
          the frame the same way Instagram's circle does. */}
      <g transform="translate(12,12) scale(0.72) translate(-10.75,-14)">
        <path
          d="M14 8.5h2V5.2c-.35-.05-1.55-.2-2.96-.2-2.93 0-4.94 1.79-4.94 5.08V13H5.5v3.6h2.6V23h3.7v-6.4h2.7l.43-3.6h-3.13V10.4c0-1.04.28-1.9 1.9-1.9Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      className="relative w-full page-margin"
      style={{
        height: "340px",
        background: "linear-gradient(to bottom, #000000 0%, #DEF520 100%)",
      }}
      aria-label="Site footer"
    >
      {/* Back to top — pinned to top-center of footer */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-4">
        <button
          onClick={scrollToTop}
          className="text-[10px] uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        >
          Back to top ↑
        </button>
      </div>

      {/* Copyright — center top, grouped with Back to top */}
      <div className="absolute top-10 left-0 right-0 flex justify-center">
        <p className="text-[16px] tracking-wide opacity-90 text-center">
          Rights reserved to Pristinenoire LLC, Designed by Mike.Alemie in 2026
        </p>
      </div>

      {/* Main footer row — vertically centered */}
      <div className="flex items-center justify-between h-full">
        {/* Left: logo + QR */}
        <div className="flex items-center gap-4">
          <div style={IMG_STYLE}>
            <Image
              src="/images/pristinenoire-llc.png"
              alt="Pristinenoire LLC logo"
              fill
              sizes={`${IMG_SIZE}px`}
              style={{ objectFit: "cover" }}
            />
          </div>
          <div style={{ ...IMG_STYLE, backgroundColor: "#1a1a1a", padding: "10px" }}>
            <Image
              src="/images/qr-code.png"
              alt="QR Code"
              fill
              sizes={`${IMG_SIZE}px`}
              style={{ objectFit: "contain", padding: "10px" }}
            />
          </div>
        </div>

        {/* Right: social icons */}
        <div className="flex items-center justify-center gap-5">
          <a href="#" aria-label="Instagram" className="flex items-center justify-center hover:opacity-70 transition-opacity">
            <InstagramIcon />
          </a>
          <a href="#" aria-label="Facebook" className="flex items-center justify-center hover:opacity-70 transition-opacity">
            <FacebookIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}
