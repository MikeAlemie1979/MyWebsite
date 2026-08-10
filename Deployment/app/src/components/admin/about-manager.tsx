"use client";

import React, { useEffect, useRef, useState } from "react";

interface Flashcard {
  id: string;
  imageUrl: string | null;
  title: string;
  text: string;
}

interface AboutContent {
  headline: string;
  headlineFontFamily: string;
  headlineFontSize: number;
  headlineColor: string;
  body: string;
  bodyFontFamily: string;
  bodyFontSize: number;
  bodyColor: string;
  flashcards: Flashcard[];
}

const FONT_FAMILIES = ["Michroma", "Arial", "Saira", "Audiowide", "Orbitron"];

const DEFAULT_CONTENT: AboutContent = {
  headline: "About Mike Alemie",
  headlineFontFamily: "Michroma",
  headlineFontSize: 24,
  headlineColor: "#FFFFFF",
  body: "",
  bodyFontFamily: "Michroma",
  bodyFontSize: 12,
  bodyColor: "#FFFFFF",
  flashcards: [],
};

function makeId() {
  return `card-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function AboutManager() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch("/api/admin/about-content");
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error("Failed to fetch About content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AboutContent, value: any) => {
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const handleCardChange = (id: string, field: keyof Flashcard, value: any) => {
    setContent((prev) => ({
      ...prev,
      flashcards: prev.flashcards.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }));
  };

  const handleAddFlashcard = () => {
    setContent((prev) => ({
      ...prev,
      flashcards: [...prev.flashcards, { id: makeId(), imageUrl: null, title: "", text: "" }],
    }));
  };

  const handleDeleteFlashcard = (id: string) => {
    setContent((prev) => ({
      ...prev,
      flashcards: prev.flashcards.filter((c) => c.id !== id),
    }));
  };

  const handleImageUpload = async (id: string, file: File) => {
    setUploadingCardId(id);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("cardId", id);

      const response = await fetch("/api/admin/about-content/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        handleCardChange(id, "imageUrl", data.url);
      } else {
        const err = await response.json().catch(() => ({}));
        setMessage(err.error || "Failed to upload image");
      }
    } catch (error) {
      setMessage("Error uploading image");
    } finally {
      setUploadingCardId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/about-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      if (response.ok) {
        setMessage("✓ About content saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save About content");
      }
    } catch (error) {
      setMessage("Error saving About content");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-400">Loading About page content...</div>;

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-6 max-w-2xl">
      <h3 className="text-xl font-bold mb-6 text-white">About Page Content</h3>

      <div className="space-y-8">
        {/* Headline section */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Headline</h4>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Headline Text</label>
            <input
              type="text"
              value={content.headline}
              onChange={(e) => handleChange("headline", e.target.value)}
              placeholder="About Mike Alemie"
              className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Font Family</label>
              <select
                value={content.headlineFontFamily}
                onChange={(e) => handleChange("headlineFontFamily", e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f} className="bg-black">
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Font Size</label>
              <input
                type="number"
                value={content.headlineFontSize}
                onChange={(e) => handleChange("headlineFontSize", parseInt(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Color</label>
              <input
                type="color"
                value={content.headlineColor}
                onChange={(e) => handleChange("headlineColor", e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded h-10 px-1 py-1"
              />
            </div>
          </div>
        </div>

        {/* Body section */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Body Text</h4>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Body Content</label>
            <textarea
              value={content.body}
              onChange={(e) => handleChange("body", e.target.value)}
              rows={4}
              placeholder="Body paragraph..."
              className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Font Family</label>
              <select
                value={content.bodyFontFamily}
                onChange={(e) => handleChange("bodyFontFamily", e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f} className="bg-black">
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Font Size</label>
              <input
                type="number"
                value={content.bodyFontSize}
                onChange={(e) => handleChange("bodyFontSize", parseInt(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Color</label>
              <input
                type="color"
                value={content.bodyColor}
                onChange={(e) => handleChange("bodyColor", e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded h-10 px-1 py-1"
              />
            </div>
          </div>
        </div>

        {/* Flashcards section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Flashcards</h4>
            <button
              onClick={handleAddFlashcard}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded font-medium transition-colors"
            >
              + Add Flashcard
            </button>
          </div>

          <div className="space-y-4">
            {content.flashcards.map((card) => (
              <div key={card.id} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 bg-white/5 border border-white/20 rounded overflow-hidden flex items-center justify-center">
                      {card.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={card.imageUrl} alt={card.title || "Flashcard"} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-gray-500 text-center px-1">No Image</span>
                      )}
                    </div>
                    <input
                      ref={(el) => {
                        fileInputRefs.current[card.id] = el;
                      }}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(card.id, file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      onClick={() => fileInputRefs.current[card.id]?.click()}
                      disabled={uploadingCardId === card.id}
                      className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      {uploadingCardId === card.id ? "Uploading..." : "Upload"}
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => handleCardChange(card.id, "title", e.target.value)}
                      placeholder="Card title"
                      className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500 text-sm"
                    />
                    <textarea
                      value={card.text}
                      onChange={(e) => handleCardChange(card.id, "text", e.target.value)}
                      placeholder="Card text"
                      rows={2}
                      className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500 text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleDeleteFlashcard(card.id)}
                    className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-3 py-1.5 rounded font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {content.flashcards.length === 0 && (
              <p className="text-sm text-gray-500">No flashcards yet. Click "Add Flashcard" to create one.</p>
            )}
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
          {saving ? "Saving..." : "Save About Content"}
        </button>
      </div>
    </div>
  );
}
