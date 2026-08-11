"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Login failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      router.push("/admin");
    } catch {
      setError("Unable to reach the server. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wider">Admin Login</h1>
          <p className="text-gray-400 mt-2 text-sm">Sign in to manage the site</p>
        </div>
        <div className="text-center mb-4">
          <a
            href="/"
            className="text-xs tracking-widest uppercase text-gray-500 hover:text-white transition-colors"
          >
            ← Back to Home
          </a>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-lg p-8 space-y-5"
        >
          <div>
            <label htmlFor="username" className="block text-sm text-gray-400 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-black/40 border border-white/10 rounded px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="admin"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-400 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black/40 border border-white/10 rounded px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm text-gray-400 mb-2">
              Code
            </label>
            <input
              id="code"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full bg-black/40 border border-white/10 rounded px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="••••"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black font-medium rounded px-4 py-2.5 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
