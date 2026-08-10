"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme, ThemeName } from "@/context/theme-context";
import { Toggle } from "@/components/common/toggle";

const THEME_OPTIONS: { value: ThemeName; label: string; swatch: string }[] = [
  { value: "dark", label: "Dark", swatch: "#000000" },
  { value: "warm", label: "Warm", swatch: "#785108" },
  { value: "bright", label: "Bright", swatch: "#FFCCF9" },
];

export function ThemeControl() {
  const [open, setOpen] = useState(false);
  const {
    theme,
    setTheme,
    motionHidden,
    setMotionHidden,
    mouseTrailDisabled,
    setMouseTrailDisabled,
  } = useTheme();

  return (
    <div className="fixed left-6 z-50" style={{ bottom: "20px" }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            // The panel is always dark, so its text must always be light —
            // inheriting --nav-text renders near-black on the bright theme
            // and the labels disappear into the panel.
            style={{ color: "#ffffff" }}
            className="absolute bottom-16 left-0 w-56 rounded-2xl border border-white/15 bg-black/80 backdrop-blur-md p-4 flex flex-col gap-4"
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Theme</p>
              <div className="flex gap-2">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex-1 rounded-lg border py-2 flex flex-col items-center gap-1 text-[9px] transition-colors ${
                      theme === opt.value ? "border-white/70" : "border-white/15 hover:border-white/40"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: opt.swatch }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Toggle
              checked={motionHidden}
              onChange={setMotionHidden}
              label="Hide motion / dots"
            />

            <Toggle
              checked={mouseTrailDisabled}
              onChange={setMouseTrailDisabled}
              label="Disable mouse trail"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle theme and accessibility panel"
        className="w-11 h-11 rounded-full border border-white/25 bg-black/60 backdrop-blur-md flex items-center justify-center text-[13px] tracking-wide hover:border-white/60 transition-colors"
      >
        M
      </button>
    </div>
  );
}
