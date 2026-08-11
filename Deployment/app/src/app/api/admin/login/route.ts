import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_MS,
  createSession,
  loadOrSeedCredentials,
  verifyPassword,
} from "@/lib/admin-auth";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// In-memory per-IP failed-attempt tracker. Resets automatically after the
// window elapses. This is a basic app-level DDOS/brute-force guard; it is
// process-local and resets on server restart, which is acceptable for a
// small single-instance admin panel.
const failedAttempts = new Map<string, RateLimitEntry>();

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

function isLockedOut(ip: string): boolean {
  const entry = failedAttempts.get(ip);
  if (!entry) return false;

  if (Date.now() - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    failedAttempts.delete(ip);
    return false;
  }

  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const entry = failedAttempts.get(ip);
  const now = Date.now();

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, windowStart: now });
    return;
  }

  entry.count += 1;
}

function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (isLockedOut(ip)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: { username?: string; password?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { username, password, code } = body;

  if (!username || !password || !code) {
    return NextResponse.json(
      { error: "Username, password and code are required" },
      { status: 400 }
    );
  }

  const creds = loadOrSeedCredentials();

  const validUsername = username === creds.username;
  const validPassword = verifyPassword(password, creds.passwordHash);
  const validCode = verifyPassword(code, creds.codeHash);

  // Deliberately a single generic failure for all three: telling the caller
  // which factor was wrong would let an attacker confirm a valid
  // username/password pair while brute-forcing only the 4-digit code.
  if (!validUsername || !validPassword || !validCode) {
    recordFailedAttempt(ip);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  clearFailedAttempts(ip);

  const session = createSession();

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
  });

  return response;
}
