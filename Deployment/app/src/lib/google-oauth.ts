import { readDoc, writeDoc } from "./store";

/**
 * OAuth-as-the-account-owner for Google Drive uploads.
 *
 * The service account (google-auth.ts) works fine for Sheets — a shared
 * spreadsheet just grants it Editor access, no quota involved. Drive is
 * different: Google gives service accounts zero storage quota on a personal
 * (non-Workspace) account, so `files.create` fails outright no matter what
 * the folder is shared as. The fix Google documents for personal accounts is
 * to act as the real user instead — a one-time OAuth consent, after which
 * this module refreshes a stored refresh token indefinitely, uploading
 * against the *user's* Drive quota rather than the service account's (none).
 *
 * Sheets access is untouched by any of this and keeps using the service
 * account exclusively.
 */

interface OAuthConfig {
  connectedEmail: string;
  refreshToken: string;
}

const EMPTY: OAuthConfig = { connectedEmail: "", refreshToken: "" };

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";

// drive.file (not full drive): the app may only touch files it creates
// itself, matching the scope the service account was already limited to.
const SCOPE = "https://www.googleapis.com/auth/drive.file";

function clientId(): string | undefined {
  return process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() || undefined;
}

function clientSecret(): string | undefined {
  return process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() || undefined;
}

/**
 * Where Google redirects back to after consent. Must be registered verbatim
 * in the OAuth client's "Authorized redirect URIs" in Cloud Console — Google
 * rejects any mismatch, including a trailing slash or http vs https.
 */
function redirectUri(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return `${site.replace(/\/$/, "")}/api/admin/google-oauth/callback`;
}

export function isOAuthClientConfigured(): boolean {
  return Boolean(clientId() && clientSecret());
}

export function buildConsentUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: clientId()!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    // Without this, Google only returns a refresh_token on the very first
    // authorization ever — reconnecting after revoking access would silently
    // stop working. Forcing the consent screen every time guarantees one.
    prompt: "consent",
    state,
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

/** Exchanges a fresh authorization code for tokens and persists the refresh token. */
export async function completeOAuthExchange(code: string): Promise<{ email: string }> {
  const body = new URLSearchParams({
    code,
    client_id: clientId()!,
    client_secret: clientSecret()!,
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed: ${await tokenRes.text()}`);
  }
  const tokens = (await tokenRes.json()) as { access_token: string; refresh_token?: string };
  if (!tokens.refresh_token) {
    // Happens if the account was already connected once and `prompt=consent`
    // somehow didn't force a fresh grant — nothing to persist in that case.
    throw new Error(
      "Google did not return a refresh token. Revoke the app's access at https://myaccount.google.com/permissions and try connecting again."
    );
  }

  const userRes = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const user = userRes.ok ? ((await userRes.json()) as { email?: string }) : {};

  const config: OAuthConfig = {
    connectedEmail: user.email ?? "",
    refreshToken: tokens.refresh_token,
  };
  await writeDoc("google-oauth", config);
  return { email: config.connectedEmail };
}

export async function getOAuthStatus(): Promise<{ connected: boolean; email: string | null }> {
  const config = await readDoc<OAuthConfig>("google-oauth", EMPTY);
  return { connected: Boolean(config.refreshToken), email: config.connectedEmail || null };
}

export async function disconnectOAuth(): Promise<void> {
  await writeDoc("google-oauth", EMPTY);
}

/* --------------------------------------------------------- access tokens */

// Access tokens are short-lived (~1hr) and cheap to mint from the stored
// refresh token, so caching just avoids a round-trip on every single upload
// rather than needing any persistence of its own.
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function mintAccessToken(refreshToken: string): Promise<{ token: string; expiresIn: number }> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId()!,
    client_secret: clientSecret()!,
    grant_type: "refresh_token",
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return { token: data.access_token, expiresIn: data.expires_in };
}

/** Returns a valid OAuth access token, or null if Drive isn't connected. */
export async function getDriveAccessToken(): Promise<string | null> {
  if (!isOAuthClientConfigured()) return null;

  const config = await readDoc<OAuthConfig>("google-oauth", EMPTY);
  if (!config.refreshToken) return null;

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) {
    return cachedAccessToken.token;
  }

  const { token, expiresIn } = await mintAccessToken(config.refreshToken);
  cachedAccessToken = { token, expiresAt: Date.now() + expiresIn * 1000 };
  return token;
}
