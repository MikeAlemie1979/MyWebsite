"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeName = "dark" | "warm" | "bright";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  motionHidden: boolean;
  setMotionHidden: (v: boolean) => void;
  mouseTrailDisabled: boolean;
  setMouseTrailDisabled: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "mikealemie-prefs";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("dark");
  const [motionHidden, setMotionHiddenState] = useState(false);
  const [mouseTrailDisabled, setMouseTrailDisabledState] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.theme) setThemeState(parsed.theme);
        if (typeof parsed.motionHidden === "boolean") setMotionHiddenState(parsed.motionHidden);
        if (typeof parsed.mouseTrailDisabled === "boolean")
          setMouseTrailDisabledState(parsed.mouseTrailDisabled);
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-motion", motionHidden ? "hidden" : "visible");
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ theme, motionHidden, mouseTrailDisabled })
      );
    } catch {
      // ignore write failures (private browsing, etc.)
    }
  }, [theme, motionHidden, mouseTrailDisabled]);

  const value: ThemeContextValue = {
    theme,
    setTheme: setThemeState,
    motionHidden,
    setMotionHidden: setMotionHiddenState,
    mouseTrailDisabled,
    setMouseTrailDisabled: setMouseTrailDisabledState,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
