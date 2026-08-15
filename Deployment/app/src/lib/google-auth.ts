import { JWT } from "google-auth-library";
import { getSheetId } from "./google-config";

/**
 * Single shared service-account client for the Google Sheets + Drive backends.
 *
 * Credentials come from GOOGLE_SERVICE_ACCOUNT_JSON — the entire downloaded
 * service-account key file, pasted as one value into Render's environment
 * settings (see Deployment/render.yaml, where it is declared `sync: false` so
 * the secret never lands in the repo). The key is never read from disk: on
 * Render the filesystem is ephemeral, and committing a key file would leak it.
 *
 * The JWT is cached at module scope because each `authorize()` is a network
 * round-trip to Google's token endpoint; the library refreshes the underlying
 * access token on its own once the client exists.
 */

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  // `drive.file` (not full `drive`) — the app may only touch files it created
  // itself or that were explicitly shared with the service account, which is
  // exactly the upload folder. A broader scope would give the key access to
  // the owner's entire Drive for no added capability.
  "https://www.googleapis.com/auth/drive.file",
];

let cached: JWT | null = null;
let cachedEmail: string | null = null;

export class GoogleConfigError extends Error {}

interface ServiceAccountKey {
  client_email?: string;
  private_key?: string;
}

function parseKey(): ServiceAccountKey {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw || !raw.trim()) {
    throw new GoogleConfigError("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  }

  let parsed: ServiceAccountKey;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GoogleConfigError(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON — paste the whole key file contents"
    );
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new GoogleConfigError(
      "GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key"
    );
  }
  return parsed;
}

export function getGoogleClient(): JWT {
  if (cached) return cached;

  const key = parseKey();
  cached = new JWT({
    email: key.client_email,
    // Env vars cannot carry real newlines through most dashboards, so the PEM
    // body usually arrives with literal "\n" sequences. Restoring them is
    // harmless when the value already has real newlines.
    key: key.private_key!.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });
  cachedEmail = key.client_email!;
  return cached;
}

/**
 * The address the user must share the spreadsheet and the Drive folder with.
 * Surfaced by the admin Storage panel so the setup step is discoverable rather
 * than buried in a downloaded key file. Returns null when unconfigured.
 */
export function getServiceAccountEmail(): string | null {
  if (cachedEmail) return cachedEmail;
  try {
    return parseKey().client_email ?? null;
  } catch {
    return null;
  }
}

/** True when a service-account key and a target spreadsheet are both known. */
export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() && getSheetId());
}

/** True when a key is present, regardless of which documents are targeted. */
export function hasServiceAccount(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
}

/**
 * Authenticated fetch against a Google REST endpoint. Throws on non-2xx with
 * Google's own error text, which is far more diagnosable than a bare status —
 * a folder that was never shared with the service account, for instance,
 * comes back as a 404 that reads identically to a typo'd id unless the body
 * is preserved.
 */
export async function googleFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const client = getGoogleClient();
  const { token } = await client.getAccessToken();

  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Google API ${response.status} for ${url}: ${body.slice(0, 500)}`);
  }
  return response;
}
