"use client";

import React, { useEffect, useState } from "react";

interface HomeTextSentence {
  id: string;
  text: string;
}

interface HomeTextConfig {
  sentences: HomeTextSentence[];
  fontFamily: string;
  fontSize: number;
  textColor: string;
  letterSpacing: number;
}

const FONT_OPTIONS = ["Michroma", "Arial", "Saira", "Audiowide", "Orbitron"];

const DEFAULT_CONFIG: HomeTextConfig = {
  sentences: [{ id: "1", text: "Design meets precision, ideas take form." }],
  fontFamily: "Michroma",
  fontSize: 42,
  textColor: "#000000",
  letterSpacing: 1,
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function HomeTextManager() {
  const [config, setConfig] = useState<HomeTextConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/admin/home-text");
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.sentences)) {
          setConfig(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch home text config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof HomeTextConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSentenceChange = (id: string, text: string) => {
    setConfig((prev) => ({
      ...prev,
      sentences: prev.sentences.map((s) => (s.id === id ? { ...s, text } : s)),
    }));
  };

  const handleAddSentence = () => {
    setConfig((prev) => ({
      ...prev,
      sentences: [...prev.sentences, { id: generateId(), text: "" }],
    }));
  };

  const handleRemoveSentence = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      sentences: prev.sentences.filter((s) => s.id !== id),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/home-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setMessage("✓ Home text saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save home text");
      }
    } catch (error) {
      setMessage("Error saving home text");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-400">Loading home text settings...</div>;

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-6 max-w-2xl">
      <h3 className="text-xl font-bold mb-6 text-white">Home Ash Text Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Sentences</label>
          <div className="space-y-2">
            {config.sentences.map((sentence) => (
              <div key={sentence.id} className="flex gap-2">
                <input
                  type="text"
                  value={sentence.text}
                  onChange={(e) => handleSentenceChange(sentence.id, e.target.value)}
                  placeholder="Enter sentence text"
                  className="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
                />
                <button
                  onClick={() => handleRemoveSentence(sentence.id)}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-colors"
                  aria-label="Remove sentence"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddSentence}
            className="mt-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
          >
            + Add Sentence
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Font Family</label>
            <select
              value={config.fontFamily}
              onChange={(e) => handleChange("fontFamily", e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font} className="bg-black">
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Font Size (px)</label>
            <input
              type="number"
              value={config.fontSize}
              onChange={(e) => handleChange("fontSize", parseInt(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Text Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={config.textColor}
                onChange={(e) => handleChange("textColor", e.target.value)}
                className="w-10 h-10 bg-white/5 border border-white/20 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.textColor}
                onChange={(e) => handleChange("textColor", e.target.value)}
                placeholder="#000000"
                className="flex-1 bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Letter Spacing (px)</label>
            <input
              type="number"
              value={config.letterSpacing}
              onChange={(e) => handleChange("letterSpacing", parseInt(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white"
            />
          </div>
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
          {saving ? "Saving..." : "Save Home Text Settings"}
        </button>
      </div>
    </div>
  );
}
