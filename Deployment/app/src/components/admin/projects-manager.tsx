"use client";

import React, { useEffect, useRef, useState } from "react";

interface ProjectItem {
  id: string;
  cardId: number;
  details: string;
  cardLogoNumber: number;
  minDevCost: string;
  imageUrl?: string | null;
}

function generateId(): string {
  return `p${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

const EMPTY_PROJECTS: ProjectItem[] = [];

export function ProjectsManager() {
  const [projects, setProjects] = useState<ProjectItem[]>(EMPTY_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.projects)) {
          setProjects(data.projects);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (id: string, field: keyof ProjectItem, value: any) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleAddProject = () => {
    setProjects((prev) => [
      ...prev,
      { id: generateId(), cardId: 1, details: "", cardLogoNumber: 1, minDevCost: "", imageUrl: null },
    ]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const moveProject = (id: string, direction: -1 | 1) => {
    setProjects((prev) => {
      const index = prev.findIndex((p) => p.id === id);
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleImageUpload = async (id: string, file: File) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    setUploadingId(id);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("cardId", String(project.cardId));
      formData.append("logoIndex", String(project.cardLogoNumber));

      const response = await fetch("/api/admin/projects/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        handleFieldChange(id, "imageUrl", data.url);
      } else {
        const err = await response.json().catch(() => ({}));
        setMessage(err.error || "Failed to upload image");
      }
    } catch (error) {
      setMessage("Error uploading image");
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveImage = (id: string) => {
    handleFieldChange(id, "imageUrl", null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects: projects.map(({ id, cardId, details, cardLogoNumber, minDevCost, imageUrl }) => ({
            id,
            cardId,
            details,
            cardLogoNumber,
            minDevCost,
            imageUrl: imageUrl ?? null,
          })),
        }),
      });

      if (response.ok) {
        setMessage("✓ Projects saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const err = await response.json().catch(() => ({}));
        setMessage(err.error || "Failed to save projects");
      }
    } catch (error) {
      setMessage("Error saving projects");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-400">Loading projects...</div>;

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-6 max-w-3xl">
      <h3 className="text-xl font-bold mb-2 text-white">Projects and Prices</h3>
      <p className="text-sm text-gray-400 mb-6">
        Manage the project cards shown on the public Projects and Prices page. CardId links a
        project back to a Home Portfolio card; Logo Number sets the logo filename (Logo01, Logo02, ...).
      </p>

      <div className="space-y-6">
        {projects.map((project, index) => (
          <div key={project.id} className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-300">
                Slot {index + 1} of {projects.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveProject(project.id, -1)}
                  disabled={index === 0}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-2 py-1 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveProject(project.id, 1)}
                  disabled={index === projects.length - 1}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-2 py-1 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProject(project.id)}
                  className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 px-3 py-1.5 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">CardID</label>
                  <input
                    type="number"
                    value={project.cardId}
                    onChange={(e) => handleFieldChange(project.id, "cardId", Number(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Logo Number</label>
                  <input
                    type="number"
                    value={project.cardLogoNumber}
                    onChange={(e) =>
                      handleFieldChange(project.id, "cardLogoNumber", Number(e.target.value) || 1)
                    }
                    className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Details</label>
                <textarea
                  value={project.details}
                  onChange={(e) => handleFieldChange(project.id, "details", e.target.value)}
                  placeholder="Project details"
                  rows={3}
                  className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Min Development Cost</label>
                <input
                  type="text"
                  value={project.minDevCost}
                  onChange={(e) => handleFieldChange(project.id, "minDevCost", e.target.value)}
                  placeholder="$1,000+"
                  className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Logo</label>
                <div className="flex items-start gap-4">
                  {project.imageUrl ? (
                    <div className="relative">
                      <img
                        src={project.imageUrl}
                        alt={`Project logo ${project.cardLogoNumber}`}
                        className="w-24 h-24 object-contain bg-white/5 rounded border border-white/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(project.id)}
                        className="absolute -top-2 -right-2 bg-red-500/80 hover:bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center bg-white/5 border border-dashed border-white/20 rounded text-xs text-gray-500 text-center px-1">
                      No logo
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      ref={(el) => {
                        fileInputRefs.current[project.id] = el;
                      }}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(project.id, file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[project.id]?.click()}
                      disabled={uploadingId === project.id}
                      className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-2 rounded disabled:opacity-50"
                    >
                      {uploadingId === project.id ? "Uploading..." : "Upload Logo"}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG, or WEBP. Max 2MB.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <p className="text-gray-500 text-sm">No projects yet. Click "Add Project" to create one.</p>
        )}

        <button
          type="button"
          onClick={handleAddProject}
          className="w-full border border-dashed border-white/20 hover:border-white/40 text-gray-300 py-2 rounded transition-colors"
        >
          + Add Project
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
          {saving ? "Saving..." : "Save Projects"}
        </button>
      </div>
    </div>
  );
}
