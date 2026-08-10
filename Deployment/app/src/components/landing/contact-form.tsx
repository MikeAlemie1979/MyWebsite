"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { validatePhoneNumber } from "@/lib/phone-validation";
import { Toggle } from "@/components/common/toggle";

const MAX_ATTACHMENT_BYTES = 300 * 1024;

interface FormState {
  fullName: string;
  email: string;
  subject: string;
  body: string;
  requestCallback: boolean;
  phone: string;
}

const INITIAL_STATE: FormState = {
  fullName: "",
  email: "",
  subject: "",
  body: "",
  requestCallback: false,
  phone: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected && selected.size > MAX_ATTACHMENT_BYTES) {
      setErrors((prev) => ({ ...prev, file: "File must be under 300KB total." }));
      setFile(null);
      e.target.value = "";
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email.";
    if (!form.subject.trim()) nextErrors.subject = "Subject is required.";
    if (!form.body.trim()) nextErrors.body = "Message body is required.";

    if (form.requestCallback) {
      const phoneCheck = validatePhoneNumber(form.phone);
      if (!phoneCheck.valid) nextErrors.phone = phoneCheck.reason ?? "Invalid phone number.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          attachmentSize: file?.size ?? 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors({ form: data.error ?? "Failed to send message." });
        setStatus("idle");
        return;
      }
      setStatus("sent");
      setForm(INITIAL_STATE);
      setFile(null);
      setErrors({});
    } catch {
      setErrors({ form: "Network error - please try again." });
      setStatus("idle");
    }
  };

  return (
    <section
      id="contact"
      className="relative w-full page-margin py-20 section-spacing max-w-2xl mx-auto"
      style={{ backgroundColor: "var(--theme-bg)" }}
      aria-label="Contact form"
    >
      <h2 className="text-[16px] tracking-widest uppercase mb-8 text-center">Get in Touch</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Field label="Full Name" error={errors.fullName}>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            className="input-field"
          />
        </Field>

        <Field label="Email" error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="input-field"
          />
        </Field>

        <Field label="Subject" error={errors.subject}>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            className="input-field"
          />
        </Field>

        <Field label="Message" error={errors.body}>
          <textarea
            value={form.body}
            onChange={(e) => update("body", e.target.value)}
            rows={5}
            className="input-field resize-none"
          />
        </Field>

        <Toggle
          checked={form.requestCallback}
          onChange={(checked) => update("requestCallback", checked)}
          label="Request a call back"
        />

        <AnimatePresence>
          {form.requestCallback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="motion-el overflow-hidden rounded-xl border border-white/15 bg-white/[0.04] p-4"
            >
              <Field label="Phone Number" error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="e.g. 415-555-0199"
                  className="input-field"
                />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Attachment (max 300KB)" error={errors.file}>
          <input
            type="file"
            onChange={handleFileChange}
            className="text-[11px]"
            style={{
              backgroundColor: "#000000",
              border: "2px solid #ADA02E",
              borderRadius: "12px",
              padding: "8px 12px",
              cursor: "pointer",
              color: "#ffffff",
            }}
          />
        </Field>

        {errors.form && <p className="text-[11px] text-white/70">{errors.form}</p>}

        <button
          type="submit"
          disabled={status === "sending"}
          className="motion-el mt-2 rounded-full py-3 text-[11px] tracking-widest uppercase hover:bg-white/10 transition-colors disabled:opacity-50"
          style={{ border: "2px solid #F0DD40" }}
        >
          {status === "sending" ? "Sending..." : "Send"}
        </button>

        <AnimatePresence>
          {status === "sent" && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[11px] text-emerald-400 text-center"
            >
              ✓ Message sent successfully!
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      <style jsx>{`
        .input-field {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid #ADA02E;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 11px;
          font-family: inherit;
          color: inherit;
          outline: none;
        }
        .input-field:focus {
          border-color: #F0DD40;
        }
        input[type="file"]::file-selector-button {
          background-color: #615506;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 4px 10px;
          font-family: inherit;
          font-size: 11px;
          cursor: pointer;
          margin-right: 8px;
        }
        input[type="file"]::file-selector-button:hover {
          background-color: #7a6b08;
        }
      `}</style>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-[11px]">
      <span className="opacity-70 tracking-wide">{label}</span>
      {children}
      {error && <span className="text-red-400/90 text-[12px] leading-snug">{error}</span>}
    </label>
  );
}
