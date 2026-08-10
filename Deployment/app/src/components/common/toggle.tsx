"use client";

import React from "react";
import { motion } from "framer-motion";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <motion.button
        // Without this the button defaults to type="submit", so toggling one
        // inside a form (the contact form's callback switch) submits it and
        // fires validation on every field before the user has typed anything.
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`relative inline-flex w-12 h-6 rounded-full transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        style={{
          backgroundColor: checked ? "rgba(173, 160, 46, 0.4)" : "rgba(255, 255, 255, 0.1)"
        }}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.button>
      {label && <label className="text-sm text-white/80 cursor-pointer select-none">{label}</label>}
    </div>
  );
}
