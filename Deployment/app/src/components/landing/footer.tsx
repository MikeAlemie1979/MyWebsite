"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

const VISITOR_ID_KEY = "ma-visitor-id";

const IMG_SIZE = 88;
const IMG_STYLE: React.CSSProperties = {
  width: `${IMG_SIZE}px`,
  height: `${IMG_SIZE}px`,
  flexShrink: 0,
  // Border, radius and glow scaled down with the tile — keeping the 3px/16px
  // chrome from the larger size made the smaller tile read as mostly frame.
  border: "2px solid #DEF520",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 0 12px rgba(222,245,32,0.55), inset 0 0 6px rgba(222,245,32,0.1)",
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
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    // A UUID persisted in localStorage is the de-dupe key: the same browser
    // always resends the same id, so the API only counts it once no matter
    // how many times this component mounts across page loads.
    let visitorId = window.localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    fetch("/api/visitor-count", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.count === "number") setVisitorCount(data.count);
      })
      .catch(() => {
        // Leave the counter unrendered if the API is unreachable.
      });
  }, []);

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

      {/* Visitor counter — center column, below the copyright line. Styled
          to match "Back to top" (uppercase, tracking-widest, low-opacity
          idle) since it reads as a static pill, not an interactive control. */}
      {visitorCount !== null && (
        <div className="absolute top-[68px] left-0 right-0 flex justify-center">
          <span className="text-[12px] uppercase tracking-widest opacity-60">
            Visitors: {visitorCount.toLocaleString()}
          </span>
        </div>
      )}

      {/* Main footer row — vertically centered */}
      <div className="flex items-center justify-between h-full">
        {/* Left: logo + QR */}
        <div className="flex items-center gap-4">
          {/* contain, not cover: cover cropped the logo's edges to fill the
              square, which is what made it look out of shape. */}
          <div style={{ ...IMG_STYLE, backgroundColor: "#1a1a1a" }}>
            <Image
              src="/images/pristinenoire-llc.png"
              alt="Pristinenoire LLC logo"
              fill
              sizes={`${IMG_SIZE}px`}
              style={{ objectFit: "contain", padding: "6px" }}
            />
          </div>
          {/* Padding lives on the image only. It was previously set on both
              the tile and the image, so 20px of a 133px tile went to inset —
              at the smaller size that would have crushed the QR. */}
          <div style={{ ...IMG_STYLE, backgroundColor: "#ffffff" }}>
            <Image
              src="/images/qr-code.png"
              alt="QR Code"
              fill
              sizes={`${IMG_SIZE}px`}
              style={{ objectFit: "contain", padding: "6px" }}
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
