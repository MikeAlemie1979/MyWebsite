"use client";

import React, { useEffect, useRef, useState } from "react";

interface ProjectRow {
  id: string;
  projectId: number;
  cardId: number;
  content: string;
  contentIndex: number;
  minDevCost: string;
  imageUrl?: string | null;
}

interface CardOption {
  cardId: number;
  label: string;
}

function generateId(): string {
  return `p${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function nextProjectId(rows: ProjectRow[]): number {
  return rows.length === 0 ? 1 : Math.max(...rows.map((r) => r.projectId)) + 1;
}

function nextContentIndex(rows: ProjectRow[], projectId: number): number {
  const used = rows.filter((r) => r.projectId === projectId).map((r) => r.contentIndex);
  return used.length === 0 ? 1 : Math.max(...used) + 1;
}

export function ProjectsManager() {
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [cardOptions, setCardOptions] = useState<CardOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchProjects();
    fetchCardOptions();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.projects)) setRows(data.projects);
      }
    } catch (error) {
      console.error("Failed to fetch projects config:", error);
    } finally {
      setLoading(false);
    }
  };

  // Populates the CardID dropdown from the real Home Portfolio cards, so a
  // project can only link to a card that actually exists.
  const fetchCardOptions = async () => {
    try {
      const response = await fetch("/api/admin/cards");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.cards)) {
          const byId = new Map<number, string>();
          for (const c of data.cards) {
            if (!byId.has(c.cardId)) byId.set(c.cardId, c.cardContent || "");
          }
          setCardOptions(
            Array.from(byId.entries())
              .sort(([a], [b]) => a - b)
              .map(([cardId, content]) => ({
                cardId,
                label: content ? `Card ${cardId} — ${content.slice(0, 30)}` : `Card ${cardId}`,
              }))
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch card options:", error);
    }
  };

  const handleContentChange = (id: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, content: value } : r)));
  };

  const handleHeaderFieldChange = (projectId: number, field: "cardId" | "minDevCost", value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.projectId === projectId && r.contentIndex === 1 ? { ...r, [field]: value } : r))
    );
  };

  // New project — id, projectId, and contentIndex are all assigned
  // automatically, never typed in by the admin.
  const handleAddProject = () => {
    setRows((prev) => {
      const projectId = nextProjectId(prev);
      const cardId = cardOptions[0]?.cardId ?? 1;
      return [
        ...prev,
        { id: generateId(), projectId, cardId, content: "", contentIndex: 1, minDevCost: "", imageUrl: null },
      ];
    });
  };

  const handleAddBulletPoint = (projectId: number) => {
    setRows((prev) => [
      ...prev,
      {
        id: generateId(),
        projectId,
        cardId: prev.find((r) => r.projectId === projectId)?.cardId ?? 1,
        content: "",
        contentIndex: nextContentIndex(prev, projectId),
        minDevCost: "",
        imageUrl: null,
      },
    ]);
  };

  const handleDeleteLine = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeleteProject = (projectId: number) => {
    setRows((prev) => prev.filter((r) => r.projectId !== projectId));
  };

  const handleRemoveImage = (projectId: number) => {
    setRows((prev) =>
      prev.map((r) => (r.projectId === projectId && r.contentIndex === 1 ? { ...r, imageUrl: null } : r))
    );
  };

  const handleFileSelect = async (projectId: number, file: File | undefined) => {
    if (!file) return;
    setUploadingId(`project-${projectId}`);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", String(projectId));

      const response = await fetch("/api/admin/projects/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setRows((prev) =>
          prev.map((r) => (r.projectId === projectId && r.contentIndex === 1 ? { ...r, imageUrl: data.url } : r))
        );
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
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects: rows.map(({ id, projectId, cardId, content, contentIndex, minDevCost, imageUrl }) => ({
            id,
            projectId,
            cardId,
            content,
            contentIndex,
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

  const projectIds = Array.from(new Set(rows.map((r) => r.projectId))).sort((a, b) => a - b);

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-6 max-w-4xl">
      <h3 className="text-xl font-bold mb-2 text-white">Projects and Prices</h3>
      <p className="text-sm text-gray-400 mb-6">
        Each block below is one Projects-page card: a header, an image, a cost, and any number of
        bullet points. IDs are assigned automatically. CardID links it back to a real Home
        Portfolio card.
      </p>

      <div className="space-y-6">
        {projectIds.map((projectId) => {
          const lines = rows
            .filter((r) => r.projectId === projectId)
            .sort((a, b) => a.contentIndex - b.contentIndex);
          const header = lines[0];
          if (!header) return null;

          return (
            <div key={projectId} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-300">Project {projectId}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddBulletPoint(projectId)}
                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors"
                  >
                    + Add Bullet Point
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(projectId)}
                    className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 px-3 py-1.5 rounded transition-colors"
                  >
                    Delete Project
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">CardID (linked Home card)</label>
                  <select
                    value={header.cardId}
                    onChange={(e) => handleHeaderFieldChange(projectId, "cardId", Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white"
                  >
                    {cardOptions.length === 0 && <option value={header.cardId}>Card {header.cardId}</option>}
                    {cardOptions.map((opt) => (
                      <option key={opt.cardId} value={opt.cardId}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Min Development Cost</label>
                  <input
                    type="text"
                    value={header.minDevCost}
                    onChange={(e) => handleHeaderFieldChange(projectId, "minDevCost", e.target.value)}
                    placeholder="$1,000+"
                    className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-28">
                  <div className="w-28 h-28 rounded-lg overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center">
                    {header.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={header.imageUrl}
                        alt={`Project ${projectId} logo`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-gray-500 text-center px-2">No logo</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    ref={(el) => {
                      fileInputRefs.current[projectId] = el;
                    }}
                    onChange={(e) => handleFileSelect(projectId, e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[projectId]?.click()}
                    disabled={uploadingId === `project-${projectId}`}
                    className="w-full mt-2 text-xs bg-white/10 hover:bg-white/20 text-white py-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    {uploadingId === `project-${projectId}` ? "Uploading..." : "Upload Logo"}
                  </button>
                  {header.imageUrl && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(projectId)}
                      className="w-full mt-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-300 py-1.5 rounded transition-colors"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  {lines.map((line, rowIndex) => (
                    <div key={line.id} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-300 mb-1">
                          {rowIndex === 0 ? "Header" : `Bullet Point ${rowIndex}`}
                        </label>
                        <textarea
                          value={line.content}
                          onChange={(e) => handleContentChange(line.id, e.target.value)}
                          placeholder={rowIndex === 0 ? "Project header" : "Bullet point"}
                          rows={rowIndex === 0 ? 1 : 2}
                          className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500 resize-none"
                        />
                      </div>
                      {rowIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLine(line.id)}
                          className="mt-6 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 px-3 py-1.5 rounded transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
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
