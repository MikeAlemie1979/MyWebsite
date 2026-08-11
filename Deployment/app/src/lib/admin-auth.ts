import crypto from "crypto";
import fs from "fs";
import path from "path";

const CREDS_FILE = path.join(process.cwd(), ".env.admin-auth.json");
const SESSIONS_FILE = path.join(process.cwd(), ".env.admin-sessions.json");

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
 * Load admin credentials from the on-disk store, seeding default credentials
 * on first run if the file does not exist.
 */
export function loadOrSeedCredentials(): AdminCredentials {
  if (!fs.existsSync(CREDS_FILE)) {
    const defaultCreds = defaultCredentials();
    fs.writeFileSync(CREDS_FILE, JSON.stringify(defaultCreds, null, 2), "utf-8");
    // eslint-disable-next-line no-console
    console.warn(
      "[admin-auth] No admin credentials file found. Seeded default credentials. " +
        "Please change the password via the admin settings as soon as possible."
    );
    return defaultCreds;
  }

  try {
    const raw = fs.readFileSync(CREDS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AdminCredentials>;

    // Migration path: files written before the second-factor code existed
    // have no codeHash. Rather than lock the admin out, seed one from the
    // current default code and persist it so future logins are consistent.
    if (!parsed.codeHash) {
      const migrated: AdminCredentials = {
        username: parsed.username ?? "Admin",
        passwordHash: parsed.passwordHash ?? hashPassword("App@dmin0123"),
        codeHash: hashPassword("2085"),
      };
      fs.writeFileSync(CREDS_FILE, JSON.stringify(migrated, null, 2), "utf-8");
      console.warn(
        "[admin-auth] Credentials file predated the login code — added a default code."
      );
      return migrated;
    }

    return parsed as AdminCredentials;
  } catch {
    // Corrupt file - reseed with defaults rather than locking the admin out entirely.
    const defaultCreds = defaultCredentials();
    fs.writeFileSync(CREDS_FILE, JSON.stringify(defaultCreds, null, 2), "utf-8");
    console.warn(
      "[admin-auth] Credentials file was unreadable and has been reset to defaults."
    );
    return defaultCreds;
  }
}

function readSessions(): AdminSession[] {
  if (!fs.existsSync(SESSIONS_FILE)) return [];
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdminSession[]) : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions: AdminSession[]): void {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
}

function pruneExpiredSessions(sessions: AdminSession[]): AdminSession[] {
  const now = Date.now();
  return sessions.filter((s) => now - s.createdAt < SESSION_TTL_MS);
}

/**
 * Persist a new session token to the on-disk session store, pruning any
 * expired sessions in the process.
 */
export function createSession(): AdminSession {
  const sessions = pruneExpiredSessions(readSessions());
  const session: AdminSession = { token: createSessionToken(), createdAt: Date.now() };
  sessions.push(session);
  writeSessions(sessions);
  return session;
}

/**
 * Check whether a given session token is present and not expired.
 */
export function isSessionValid(token: string | undefined | null): boolean {
  if (!token) return false;
  const sessions = pruneExpiredSessions(readSessions());
  return sessions.some((s) => s.token === token);
}

/**
 * Remove a session token from the store (used on logout).
 */
export function destroySession(token: string | undefined | null): void {
  if (!token) return;
  const sessions = pruneExpiredSessions(readSessions()).filter((s) => s.token !== token);
  writeSessions(sessions);
}

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_TTL_MS = SESSION_TTL_MS;
