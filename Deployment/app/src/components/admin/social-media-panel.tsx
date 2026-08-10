"use client";

import React, { useEffect, useState } from "react";
import { Toggle } from "@/components/common/toggle";

interface InstagramConfig {
  connected: boolean;
  accountId: string;
  accessToken: string;
}

interface FacebookConfig {
  connected: boolean;
  pageId: string;
  accessToken: string;
}

interface SocialConfig {
  instagram: InstagramConfig;
  facebook: FacebookConfig;
}

type Platform = "instagram" | "facebook";

interface PostResult {
  platform: Platform;
  success: boolean;
  postedAt: string;
  simulated: true;
  text?: string;
}

const DEFAULT_CONFIG: SocialConfig = {
  instagram: { connected: false, accountId: "", accessToken: "" },
  facebook: { connected: false, pageId: "", accessToken: "" },
};

export function SocialMediaPanel() {
  const [config, setConfig] = useState<SocialConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [postText, setPostText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [postToInstagram, setPostToInstagram] = useState(true);
  const [postToFacebook, setPostToFacebook] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postMessage, setPostMessage] = useState("");
  const [history, setHistory] = useState<PostResult[]>([]);

  useEffect(() => {
    fetchConfig();
    fetchHistory();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/admin/social-config");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Failed to fetch social config:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/admin/social-post");
      if (response.ok) {
        const data = await response.json();
        setHistory((data.history || []).slice(-5).reverse());
      }
    } catch (error) {
      console.error("Failed to fetch post history:", error);
    }
  };

  const handleConfigChange = (
    platform: Platform,
    field: keyof InstagramConfig | keyof FacebookConfig,
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value },
    }));
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setSaveMessage("");
    try {
      const response = await fetch("/api/admin/social-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.config) setConfig(data.config);
        setSaveMessage("✓ Social media settings saved successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("Failed to save social media settings");
      }
    } catch (error) {
      setSaveMessage("Error saving social media settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePost = async () => {
    const platforms: Platform[] = [
      ...(postToInstagram ? (["instagram"] as Platform[]) : []),
      ...(postToFacebook ? (["facebook"] as Platform[]) : []),
    ];

    if (!postText.trim()) {
      setPostMessage("Please enter post text");
      return;
    }
    if (platforms.length === 0) {
      setPostMessage("Please select at least one platform");
      return;
    }

    setPosting(true);
    setPostMessage("");
    try {
      const response = await fetch("/api/admin/social-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: postText,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
          platforms,
        }),
      });

      if (response.ok) {
        setPostMessage("✓ Post simulated successfully!");
        setPostText("");
        setImageUrl("");
        setVideoUrl("");
        fetchHistory();
        setTimeout(() => setPostMessage(""), 3000);
      } else {
        setPostMessage("Failed to post");
      }
    } catch (error) {
      setPostMessage("Error posting to social media");
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <div className="text-gray-400">Loading social media settings...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Connection settings */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-6 text-white">Social Media Connections</h3>

        <div className="space-y-6">
          {/* Instagram */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">Instagram</h4>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  config.instagram.connected
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}
              >
                {config.instagram.connected ? "Connected" : "Not Connected"}
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">IG Account ID</label>
                <input
                  type="text"
                  value={config.instagram.accountId}
                  onChange={(e) => handleConfigChange("instagram", "accountId", e.target.value)}
                  placeholder="17841400000000000"
                  className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Access Token</label>
                <input
                  type="password"
                  value={config.instagram.accessToken}
                  onChange={(e) => handleConfigChange("instagram", "accessToken", e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <Toggle
                checked={config.instagram.connected}
                onChange={(checked) => handleConfigChange("instagram", "connected", checked)}
                label="Mark as connected"
              />
            </div>
          </div>

          {/* Facebook */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">Facebook</h4>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  config.facebook.connected
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}
              >
                {config.facebook.connected ? "Connected" : "Not Connected"}
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Page ID</label>
                <input
                  type="text"
                  value={config.facebook.pageId}
                  onChange={(e) => handleConfigChange("facebook", "pageId", e.target.value)}
                  placeholder="100000000000000"
                  className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Access Token</label>
                <input
                  type="password"
                  value={config.facebook.accessToken}
                  onChange={(e) => handleConfigChange("facebook", "accessToken", e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <Toggle
                checked={config.facebook.connected}
                onChange={(checked) => handleConfigChange("facebook", "connected", checked)}
                label="Mark as connected"
              />
            </div>
          </div>

          {saveMessage && (
            <div
              className={`p-3 rounded text-sm ${
                saveMessage.includes("✓")
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              }`}
            >
              {saveMessage}
            </div>
          )}

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Social Media Settings"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-blue-300">
          <p className="font-semibold mb-2">ℹ️ About these credentials:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Access tokens come from Meta's Graph API / Facebook Developer console</li>
            <li>No live connection is made yet — this stores settings for future use</li>
            <li>Tokens are masked once saved and never fully displayed again</li>
          </ul>
        </div>
      </div>

      {/* Composer */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-6 text-white">Create a Post</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Post Text</label>
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Image URL (optional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Video/Clip URL (optional)</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com/clip.mp4"
              className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500"
            />
          </div>

          <div className="flex gap-6">
            <Toggle
              checked={postToInstagram}
              onChange={setPostToInstagram}
              label="Post to Instagram"
            />
            <Toggle
              checked={postToFacebook}
              onChange={setPostToFacebook}
              label="Post to Facebook"
            />
          </div>

          {postMessage && (
            <div
              className={`p-3 rounded text-sm ${
                postMessage.includes("✓")
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              }`}
            >
              {postMessage}
            </div>
          )}

          <button
            onClick={handlePost}
            disabled={posting}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded font-medium transition-colors disabled:opacity-50"
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>

        {history.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Recent Posts</h4>
            <div className="space-y-2">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded px-3 py-2 text-xs"
                >
                  <span
                    className={`px-2 py-1 rounded-full font-medium ${
                      item.platform === "instagram"
                        ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {item.platform === "instagram" ? "Instagram" : "Facebook"}
                  </span>
                  <span className="text-gray-400 truncate mx-2 flex-1">{item.text}</span>
                  <span className="text-gray-500 whitespace-nowrap">
                    {new Date(item.postedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
