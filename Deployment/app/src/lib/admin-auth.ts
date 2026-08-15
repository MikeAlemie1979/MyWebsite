import crypto from "crypto";
import { NextRequest } from "next/server";
import { readDoc, writeDoc, docExists } from "./store";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SCRYPT_KEYLEN = 64;

export interface AdminCredentials {
  username: string;
  passwordHash: string;
  // Second-factor PIN required alongside username/password. Hashed with the
  // same scrypt scheme as the password rather than stored in plaintext.
  codeHash: string;
}

export interface AdminSession {
  token: string;
  createdAt: number;
}

/**
 * Hash a plaintext password using Node's built-in crypto.scryptSync.
 * Format: "salt:hash" (both hex-encoded).
 */
export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(plain, salt, SCRYPT_KEYLEN);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a plaintext password against a stored "salt:hash" string.
 * Uses timing-safe comparison.
 */
export function verifyPassword(plain: string, hash: string): boolean {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;

  try {
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(plain, salt, SCRYPT_KEYLEN);
    if (keyBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generate a random session token (32 bytes, hex-encoded).
 */
export function createSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function defaultCredentials(): AdminCredentials {
  return {
    username: "Admin",
    passwordHash: hashPassword("App@dmin0123"),
    codeHash: hashPassword("2085"),
  };
}

/**
 * Load admin credentials from the document store, seeding defaults on first
 * run. Credentials live in the store (and therefore in Google Sheets in
 * production) specifically so a changed admin password survives a Render
 * deploy, which wipes the container filesystem.
 */
export async function loadOrSeedCredentials(): Promise<AdminCredentials> {
  if (!(await docExists("admin-auth"))) {
    const seeded = defaultCredentials();
    await writeDoc("admin-auth", seeded);
    console.warn(
      "[admin-auth] No admin credentials found. Seeded default credentials. " +
        "Please change the password via the admin settings as soon as possible."
    );
    return seeded;
  }

  const parsed = await readDoc<Partial<AdminCredentials>>("admin-auth", {});

  // Migration path: records written before the second-factor code existed have
  // no codeHash. Rather than lock the admin out, seed one from the current
  // default code and persist it so future logins are consistent.
  if (!parsed.passwordHash || !parsed.codeHash) {
    const migrated: AdminCredentials = {
      username: parsed.username ?? "Admin",
      passwordHash: parsed.passwordHash ?? hashPassword("App@dmin0123"),
      codeHash: parsed.codeHash ?? hashPassword("2085"),
    };
    await writeDoc("admin-auth", migrated);
    console.warn("[admin-auth] Credentials record was incomplete — filled in defaults.");
    return migrated;
  }

  return parsed as AdminCredentials;
}

/* --------------------------------------------------------------- sessions */

/**
 * Sessions are held in process memory, deliberately NOT in the document store.
 *
 * They churn on every login/logout and are read on every protected page
 * render, so routing them through the Sheets API would put a network
 * round-trip in front of each admin navigation and burn the read quota that
 * the public pages need. The only cost of keeping them in memory is that a
 * restart or a redeploy forces a re-login — which is correct behavior for a
 * session, not data loss.
 *
 * Held on `globalThis` rather than in a plain module-scope const: Next.js
 * re-evaluates route modules on every recompile in dev, which would otherwise
 * reset the map and sign the admin out after each source edit. In production
 * this makes no difference — `next start` evaluates the module once.
 *
 * The one real constraint is that this assumes a single server instance. At
 * this site's scale (15 concurrent users) that is what Render runs; if the
 * service is ever scaled out horizontally, sessions would need to move to a
 * shared store, because a round-robined request would land on an instance
 * that has never seen the token.
 */
const globalForSessions = globalThis as unknown as {
  __adminSessions?: Map<string, number>;
};

// token -> createdAt
const sessions: Map<string, number> = (globalForSessions.__adminSessions ??= new Map());

function pruneExpired(): void {
  const now = Date.now();
  // Array.from rather than iterating the Map directly: the project's
  // tsconfig target predates downlevelIteration for Map iterators.
  Array.from(sessions.keys()).forEach((token) => {
    if (now - (sessions.get(token) ?? 0) >= SESSION_TTL_MS) sessions.delete(token);
  });
}

export function createSession(): AdminSession {
  pruneExpired();
  const session: AdminSession = { token: createSessionToken(), createdAt: Date.now() };
  sessions.set(session.token, session.createdAt);
  return session;
}

export function isSessionValid(token: string | undefined | null): boolean {
  if (!token) return false;
  const createdAt = sessions.get(token);
  if (createdAt === undefined) return false;
  if (Date.now() - createdAt >= SESSION_TTL_MS) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function destroySession(token: string | undefined | null): void {
  if (!token) return;
  sessions.delete(token);
}

/**
 * Gate for admin write endpoints.
 *
 * Every admin POST previously accepted writes with no session check at all —
 * including the SMTP and social-config routes, which carry a mail password and
 * OAuth tokens. Call this at the top of each mutating handler. The matching
 * GETs stay open on purpose: the public landing components read their content
 * from those same `/api/admin/*` GET endpoints.
 */
export function requireAdmin(request: NextRequest): boolean {
  return isSessionValid(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_TTL_MS = SESSION_TTL_MS;
