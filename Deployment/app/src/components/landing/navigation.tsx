"use client";

import React, { useRef, useState, useEffect, useLayoutEffect } from "react";

const BRAND_LETTERS = Array.from("Mike Alemie");
const LETTER_LINE_HEIGHT = 15;

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/#contact" },
  { label: "Admin", href: "/admin" },
];

const FLUORESCENT_COLORS = [
  { color: "#FFE600", shadow: "rgba(255,230,0,0.8)" },       // fluorescent gold
  { color: "#FF9500", shadow: "rgba(255,149,0,0.8)" },       // fluorescent copper
  { color: "#B87333", shadow: "rgba(184,115,51,0.8)" },      // fluorescent brown
  { color: "#B3C22F", shadow: "rgba(179,194,47,0.8)" },      // fluorescent lime-gold
  { color: "#F0DD40", shadow: "rgba(240,221,64,0.8)" },      // warm gold
  { color: "#D4750A", shadow: "rgba(212,117,10,0.8)" },      // deep copper
];

export function Navigation() {
  const [expanded, setExpanded] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [colorIdx, setColorIdx] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [maxTranslateY, setMaxTranslateY] = useState<number | null>(null);
  const [contactFadeOpacity, setContactFadeOpacity] = useState(1);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [letterOffsets, setLetterOffsets] = useState<number[]>([]);

  // Measure each letter's rest position relative to "M" once, at full size —
  // scroll then interpolates each letter from that offset back to 0 (x) while
  // dropping into a vertical column below M (y), instead of the whole
  // wordmark rigidly rotating.
  useLayoutEffect(() => {
    const mLeft = letterRefs.current[0]?.offsetLeft ?? 0;
    setLetterOffsets(letterRefs.current.map((el) => (el ? el.offsetLeft - mLeft : 0)));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIdx((i) => {
        let next = Math.floor(Math.random() * FLUORESCENT_COLORS.length);
        if (next === i) next = (i + 1) % FLUORESCENT_COLORS.length;
        return next;
      });
    }, 2200 + Math.random() * 1200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
      // Stop the wordmark's downward drift right at the footer's top border
      // instead of letting it scroll on top of the footer content — once the
      // footer's top edge reaches the wordmark's current bottom, freeze the
      // translateY at that value.
      const footerEl = document.querySelector('footer[aria-label="Site footer"]');
      const wordmark = wordmarkRef.current;
      if (footerEl && wordmark) {
        const footerTop = footerEl.getBoundingClientRect().top;
        const wordmarkBottom = wordmark.getBoundingClientRect().bottom;
        if (footerTop <= wordmarkBottom) {
          setMaxTranslateY((prev) => (prev === null ? window.scrollY * 0.18 : prev));
        } else {
          setMaxTranslateY(null);
        }
      }

      // Fade the wordmark out as the viewport scrolls into the "Get in
      // Touch" section — fully visible until its top edge, fully gone by
      // the time the section is a third of the way up the viewport.
      const contactEl = document.getElementById("contact");
      if (contactEl) {
        const contactTop = contactEl.getBoundingClientRect().top;
        const fadeDistance = window.innerHeight * 0.35;
        const opacity = Math.max(0, Math.min(1, contactTop / fadeDistance));
        setContactFadeOpacity(opacity);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { color, shadow } = FLUORESCENT_COLORS[colorIdx];

  // Doubled the scroll distance needed to fully collapse — the vertical
  // letter-drop now takes 2x as much scroll (and therefore feels 2x slower).
  const scrollProgress = Math.min(scrollY / 600, 1);
  const subtitleOpacity = Math.max(0, 1 - scrollProgress * 3.5);

  const handleEnter = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    setExpanded(true);
  };

  const handleLeave = () => {
    collapseTimer.current = setTimeout(() => setExpanded(false), 3000);
  };

  return (
    <header
      className="fixed top-0 right-0 z-50 flex items-start justify-between page-margin w-full pointer-events-none"
      style={{ height: "15px", background: "rgba(0,0,0,0.45)" }}
      aria-label="Primary navigation"
    >
      <div
        ref={wordmarkRef}
        className="font-display pointer-events-auto leading-tight select-none relative"
        style={{
          paddingTop: "57px",
          transform: `translateY(${maxTranslateY ?? scrollY * 0.18}px)`,
          opacity: contactFadeOpacity,
          transition: "opacity 0.2s linear",
        }}
      >
        <p className="relative tracking-widest whitespace-nowrap" style={{ fontSize: "18px" }}>
          {BRAND_LETTERS.map((letter, i) => {
            const dx = letterOffsets[i] ?? 0;
            // Letters closer to M settle into the column first — a staggered
            // "one by one" cascade rather than every letter moving at once.
            const letterProgress = Math.max(0, Math.min(1, scrollProgress * 1.5 - i * 0.05));
            return (
              <span
                key={i}
                ref={(el) => {
                  letterRefs.current[i] = el;
                }}
                className="inline-block"
                style={{
                  color,
                  textShadow: `0 0 10px ${shadow}, 0 0 20px ${shadow}`,
                  transition: "color 1s, text-shadow 1s",
                  transform: `translate(${-dx * letterProgress}px, ${i * LETTER_LINE_HEIGHT * letterProgress}px)`,
                  whiteSpace: "pre",
                }}
              >
                {letter}
              </span>
            );
          })}
        </p>
        <p
          className="tracking-wide"
          style={{
            fontSize: "14px",
            color,
            opacity: subtitleOpacity * 0.85,
            textShadow: `0 0 8px ${shadow}`,
            transition: "color 1s, text-shadow 1s",
          }}
        >
          Ai Designer &amp; Database Engineer
        </p>
      </div>

      <nav
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className={`font-display pointer-events-auto motion-el transition-all duration-500 ease-out overflow-hidden rounded-full border border-white/15 backdrop-blur-md bg-black/30 flex items-center ${
          expanded ? "px-6 py-3 gap-6" : "justify-center"
        }`}
        style={{ height: "40px", minHeight: "40px", width: expanded ? "auto" : "40px", minWidth: expanded ? "360px" : undefined, marginTop: "57px" }}
      >
        {!expanded && (
          <span className="nav-dot-flash w-4 h-4 rounded-full motion-el" aria-hidden />
        )}
        {expanded &&
          NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[18px] tracking-wide whitespace-nowrap transition-all duration-200 hover:text-[#37E0D0] hover:drop-shadow-[0_0_8px_rgba(55,224,208,0.9)]"
            >
              {link.label}
            </a>
          ))}
      </nav>

      <style jsx global>{`
        @keyframes nav-dot-flash {
          0%, 100% {
            background-color: #def520;
            box-shadow: 0 0 8px 2px rgba(222, 245, 32, 0.8);
          }
          33% {
            background-color: #ffffff;
            box-shadow: 0 0 8px 2px rgba(255, 255, 255, 0.9);
          }
          66% {
            background-color: #ff8c1a;
            box-shadow: 0 0 8px 2px rgba(255, 140, 26, 0.8);
          }
        }
        .nav-dot-flash {
          animation: nav-dot-flash 1.8s ease-in-out infinite;
        }
      `}</style>
    </header>
  );
}
