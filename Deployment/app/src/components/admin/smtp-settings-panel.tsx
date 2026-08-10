"use client";

import React, { useEffect, useState } from "react";
import { Toggle } from "@/components/common/toggle";

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
}

export function SMTPSettingsPanel() {
  const [config, setConfig] = useState<SMTPConfig>({
    host: "",
    port: 587,
    secure: false,
    user: "",
    password: "",
    fromEmail: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/admin/smtp-config");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Failed to fetch SMTP config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SMTPConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/smtp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setMessage("✓ SMTP configuration saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save SMTP configuration");
      }
    } catch (error) {
      setMessage("Error saving SMTP configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-400">Loading SMTP settings...</div>;

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-6 max-w-2xl">
      <h3 className="text-xl font-bold mb-6 text-white">Email (SMTP) Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">SMTP Host</label>
          <input
            type="text"
            value={config.host}
            onChange={(e) => handleChange("host", e.target.value)}
            placeholder="mail.example.com"
            className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Port</label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => handleChange("port", parseInt(e.target.value))}
              className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white"
            />
          </div>

          <div className="flex items-center">
            <Toggle
              checked={config.secure}
              onChange={(checked) => handleChange("secure", checked)}
              label="Use TLS/SSL"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Username/Email</label>
          <input
            type="text"
            value={config.user}
            onChange={(e) => handleChange("user", e.target.value)}
            placeholder="your-email@example.com"
            className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Password</label>
          <input
            type="password"
            value={config.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="••••••••"
            className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">From Email Address</label>
          <input
            type="email"
            value={config.fromEmail}
            onChange={(e) => handleChange("fromEmail", e.target.value)}
            placeholder="noreply@example.com"
            className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
          />
        </div>

        {message && (
          <div
            className={`p-3 rounded text-sm ${
              message.includes("✓")
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-red-500/20 text-red-300 border border-red-500/30"
            }`}
          >
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save SMTP Settings"}
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-blue-300">
        <p className="font-semibold mb-2">ℹ️ How to get SMTP credentials:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Gmail: Use app password (2FA required)</li>
          <li>Outlook/Office365: Your email + password or app password</li>
          <li>Your host: Check email settings in control panel</li>
        </ul>
      </div>
    </div>
  );
}
