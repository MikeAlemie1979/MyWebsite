"use client";

import React, { useCallback, useEffect, useState } from "react";

interface DocStatus {
  key: string;
  present: boolean;
}

interface StorageStatus {
  backend: "fs" | "sheets";
  mediaBackend: "local" | "drive";
  serviceAccountEmail: string | null;
  hasServiceAccount: boolean;
  sheetId: string | null;
  folderId: string | null;
  overridden: boolean;
  driveOAuthConfigured: boolean;
  driveConnected: boolean;
  driveConnectedEmail: string | null;
  missing: string[];
  reachable: boolean | null;
  documents: DocStatus[];
  error: string | null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="w-44 flex-shrink-0 text-sm text-gray-400">{label}</span>
      <span className="text-sm text-white break-all">{value}</span>
    </div>
  );
}

export function StoragePanel() {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [sheetInput, setSheetInput] = useState("");
  const [folderInput, setFolderInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/storage-status");
      if (res.ok) setStatus(await res.json());
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (clear = false, disconnectDrive = false) => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/storage-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          disconnectDrive
            ? { disconnectDrive: true }
            : clear
              ? { clear: true }
              : { sheetId: sheetInput, folderId: folderInput }
        ),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
        setSheetInput("");
        setFolderInput("");
        setMessage(
          disconnectDrive
            ? "✓ Disconnected Google Drive."
            : clear
              ? "✓ Reverted to the environment settings."
              : "✓ Storage settings saved."
        );
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage(data.error || "Failed to save storage settings");
      }
    } catch {
      setMessage("Error saving storage settings");
    } finally {
      setSaving(false);
    }
  };

  // The OAuth callback redirects back to /admin?drive_connect=success|denied|error
  // rather than posting a message some other way, since it's a full page
  // navigation coming back from Google, not a fetch this component made.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("drive_connect");
    if (!result) return;
    if (result === "success") setMessage("✓ Google Drive connected.");
    else if (result === "denied") setMessage("Drive connection cancelled.");
    else setMessage("Failed to connect Google Drive. Check the server logs.");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  if (loading && !status) return <div className="text-gray-400">Checking storage…</div>;
  if (!status) return <div className="text-red-300">Could not read storage status.</div>;

  const onSheets = status.backend === "sheets";

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-6 max-w-3xl">
      <h3 className="text-xl font-bold mb-2 text-white">Storage</h3>
      <p className="text-sm text-gray-400 mb-6">
        Where this site&apos;s content and uploaded images are kept.
      </p>

      <div
        className={`p-3 rounded text-sm mb-6 border ${
          onSheets && status.reachable
            ? "bg-green-500/10 text-green-300 border-green-500/30"
            : onSheets
              ? "bg-red-500/10 text-red-300 border-red-500/30"
              : "bg-amber-500/10 text-amber-200 border-amber-500/30"
        }`}
      >
        {onSheets && status.reachable && "✓ Connected to Google Sheets and Drive."}
        {onSheets && !status.reachable && `✗ Google is configured but unreachable: ${status.error}`}
        {!onSheets && (
          <>
            Running on <strong>local files</strong> — a perfectly good option, and the default. On
            Render, though, the filesystem is wiped on every deploy, so content, the admin
            password, and the visitor count would reset each time. To use Google instead, set{" "}
            {status.missing.join(" and ") || "the Google settings"} below.
          </>
        )}
      </div>

      <Row label="Content backend" value={onSheets ? "Google Sheets" : "Local JSON files"} />
      <Row
        label="Image backend"
        value={status.mediaBackend === "drive" ? "Google Drive" : "Local uploads/ directory"}
      />
      <Row label="Spreadsheet ID" value={status.sheetId ?? <em className="text-gray-500">not set</em>} />
      <Row label="Drive folder ID" value={status.folderId ?? <em className="text-gray-500">not set</em>} />
      <Row
        label="Service account"
        value={
          status.serviceAccountEmail ?? (
            <em className="text-gray-500">not set — add GOOGLE_SERVICE_ACCOUNT_JSON</em>
          )
        }
      />

      {status.serviceAccountEmail && (
        <p className="mt-4 text-xs text-gray-400 leading-relaxed">
          Share the spreadsheet with the address above, as <strong>Editor</strong>. Without that,
          Google reports &quot;not found&quot; even when the link is correct. This account is only
          for Sheets — see below for images.
        </p>
      )}

      {/* ---------------------------------------------------------------- */}

      <div className="mt-8 pt-6 border-t border-white/10">
        <h4 className="text-sm font-medium text-white mb-1">Google Drive (images)</h4>
        <p className="text-xs text-gray-500 mb-4">
          Uploaded images run as your own Google account, not the service account above — Google
          gives service accounts no storage quota on a personal Drive, so uploads with one fail no
          matter how the folder is shared.
        </p>

        {!status.driveOAuthConfigured && (
          <p className="text-xs text-amber-200/80">
            Not available yet — set <code>GOOGLE_OAUTH_CLIENT_ID</code> and{" "}
            <code>GOOGLE_OAUTH_CLIENT_SECRET</code> first.
          </p>
        )}

        {status.driveOAuthConfigured && status.driveConnected && (
          <div className="flex items-center justify-between gap-3 p-3 rounded bg-green-500/10 border border-green-500/30">
            <span className="text-sm text-green-300">
              ✓ Connected as <strong>{status.driveConnectedEmail}</strong>
            </span>
            <button
              onClick={() => save(false, true)}
              disabled={saving}
              className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 rounded transition-colors disabled:opacity-40 flex-shrink-0"
            >
              Disconnect
            </button>
          </div>
        )}

        {status.driveOAuthConfigured && !status.driveConnected && (
          <a
            href="/api/admin/google-oauth/start"
            className="inline-block bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-medium transition-colors text-sm"
          >
            Connect Google Drive
          </a>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}

      <div className="mt-8 pt-6 border-t border-white/10">
        <h4 className="text-sm font-medium text-white mb-1">Google links</h4>
        <p className="text-xs text-gray-500 mb-4">
          Paste the full link or just the ID — either works. Leave a field blank to keep its
          current value.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Spreadsheet link</label>
            <input
              type="text"
              value={sheetInput}
              onChange={(e) => setSheetInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…/edit"
              className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-600 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Drive folder link</label>
            <input
              type="text"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/…"
              className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-600 text-sm"
            />
          </div>
        </div>

        {status.overridden && (
          <p className="mt-3 text-xs text-amber-200/80 leading-relaxed">
            These were set here rather than in the environment, so they live on the server&apos;s
            filesystem and will be lost on the next deploy — after which the environment values
            take over again. Fine for testing; set the environment variables for anything
            permanent.
          </p>
        )}

        {message && (
          <div
            className={`mt-4 p-3 rounded text-sm ${
              message.includes("✓")
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-red-500/20 text-red-300 border border-red-500/30"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => save(false)}
            disabled={saving || (!sheetInput.trim() && !folderInput.trim())}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded font-medium transition-colors disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save Google Links"}
          </button>
          {status.overridden && (
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 rounded text-sm transition-colors disabled:opacity-40"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {status.documents.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/10">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Saved documents</h4>
          <div className="grid grid-cols-3 gap-2">
            {status.documents.map((doc) => (
              <div
                key={doc.key}
                className="text-xs px-2 py-1.5 rounded bg-white/5 border border-white/10 text-gray-300"
              >
                <span className={doc.present ? "text-green-400" : "text-gray-600"}>
                  {doc.present ? "●" : "○"}
                </span>{" "}
                {doc.key}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Hollow means nothing has been saved for that section yet — it is serving its built-in
            defaults, not an error.
          </p>
        </div>
      )}

      <button
        onClick={load}
        disabled={loading}
        className="w-full mt-6 bg-white/5 hover:bg-white/10 text-gray-300 py-2 rounded text-sm transition-colors disabled:opacity-50"
      >
        {loading ? "Testing…" : "Test connection"}
      </button>
    </div>
  );
}
