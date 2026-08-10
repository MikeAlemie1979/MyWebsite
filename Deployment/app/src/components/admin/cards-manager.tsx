"use client";

import React, { useEffect, useRef, useState } from "react";

interface CardItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
}

function generateId(): string {
  return `c${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function CardsManager() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await fetch("/api/admin/cards");
      if (response.ok) {
        const data = await response.json();
        setCards(data.cards || []);
      }
    } catch (error) {
      console.error("Failed to fetch cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id: string, field: "title" | "description", value: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleAddCard = () => {
    setCards((prev) => [
      ...prev,
      { id: generateId(), title: "", description: "", imageUrl: null },
    ]);
  };

  const handleDeleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleRemoveImage = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, imageUrl: null } : c)));
  };

  const handleFileSelect = async (id: string, file: File | undefined) => {
    if (!file) return;
    setUploadingId(id);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/cards/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setCards((prev) => prev.map((c) => (c.id === id ? { ...c, imageUrl: data.url } : c)));
      } else {
        setMessage(data.error || "Failed to upload image");
      }
    } catch (error) {
      setMessage("Error uploading image");
    } finally {
      setUploadingId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards }),
      });

      if (response.ok) {
        setMessage("✓ Cards saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save cards");
      }
    } catch (error) {
      setMessage("Error saving cards");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-400">Loading cards...</div>;

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-6 max-w-4xl">
      <h3 className="text-xl font-bold mb-6 text-white">Landing Page Cards</h3>

      <div className="space-y-6">
        {cards.map((card) => (
          <div key={card.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-28">
                <div className="w-28 h-28 rounded-lg overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center">
                  {card.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.imageUrl}
                      alt={card.title || "Card image"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-500 text-center px-2">No image</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  ref={(el) => {
                    fileInputRefs.current[card.id] = el;
                  }}
                  onChange={(e) => handleFileSelect(card.id, e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[card.id]?.click()}
                  disabled={uploadingId === card.id}
                  className="w-full mt-2 text-xs bg-white/10 hover:bg-white/20 text-white py-1.5 rounded transition-colors disabled:opacity-50"
                >
                  {uploadingId === card.id ? "Uploading..." : "Upload"}
                </button>
                {card.imageUrl && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(card.id)}
                    className="w-full mt-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-300 py-1.5 rounded transition-colors"
                  >
                    Remove Image
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={card.title}
                    onChange={(e) => handleChange(card.id, "title", e.target.value)}
                    placeholder="Card title"
                    className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Description</label>
                  <textarea
                    value={card.description}
                    onChange={(e) => handleChange(card.id, "description", e.target.value)}
                    placeholder="Card description"
                    rows={2}
                    className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeleteCard(card.id)}
                  className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 px-3 py-1.5 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {cards.length === 0 && (
          <p className="text-gray-500 text-sm">No cards yet. Click "Add Card" to create one.</p>
        )}

        <button
          type="button"
          onClick={handleAddCard}
          className="w-full border border-dashed border-white/20 hover:border-white/40 text-gray-300 py-2 rounded transition-colors"
        >
          + Add Card
        </button>

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
          {saving ? "Saving..." : "Save Cards"}
        </button>
      </div>
    </div>
  );
}
