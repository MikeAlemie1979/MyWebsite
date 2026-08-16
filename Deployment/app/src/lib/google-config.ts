import * as fs from "fs";
import * as path from "path";

/**
 * Resolves the Google Spreadsheet and Drive folder to use.
 *
 * Two sources, in priority order:
 *   1. An override saved from the admin Storage panel, in
 *      `.env.google-links.json`.
 *   2. The `GOOGLE_SHEET_ID` / `GOOGLE_DRIVE_FOLDER_ID` environment variables.
 *
 * Why both: neither alone is sufficient. Env vars survive a Render deploy but
 * can only be changed by someone with dashboard access and require a restart;
 * the admin override can be changed from the site itself but lives on the
 * ephemeral filesystem and is therefore lost on the next deploy. Together the
 * env vars act as the durable baseline and the panel as a live override —
 * which is what makes swapping to a test spreadsheet possible without a
 * redeploy.
 *
 * These two ids are NOT secrets — they identify a document, and access is
 * still gated by whether the service account has been shared onto it. The
 * service-account private key is deliberately not settable here: it stays in
 * `GOOGLE_SERVICE_ACCOUNT_JSON` only, so a secret can never be written to disk
 * or echoed back through an HTTP response.
 */

const OVERRIDE_FILE = path.join(process.cwd(), ".env.google-links.json");

export interface GoogleLinks {
  sheetId: string;
  folderId: string;
}

/**
 * Accepts either a bare id or a full Google URL, since the admin will more
 * naturally paste the link straight out of the browser's address bar.
 *
 *   https://docs.google.com/spreadsheets/d/<id>/edit?usp=drive_link
 *   https://drive.google.com/drive/folders/<id>?usp=drive_link
 */
export function extractId(input: string): string {
  const value = input.trim();
  if (!value) return "";

  const patterns = [/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/, /\/folders\/([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/];
  for (const pattern of patterns) {
    const match = pattern.exec(value);
    if (match) return match[1];
  }

  // Already an id — strip any stray query string a paste may have carried.
  return value.split(/[?#/]/)[0];
}

function readOverride(): Partial<GoogleLinks> {
  try {
    if (!fs.existsSync(OVERRIDE_FILE)) return {};
    return JSON.parse(fs.readFileSync(OVERRIDE_FILE, "utf-8")) as Partial<GoogleLinks>;
  } catch {
    return {};
  }
}

export function getSheetId(): string | null {
  return readOverride().sheetId?.trim() || process.env.GOOGLE_SHEET_ID?.trim() || null;
}

export function getFolderId(): string | null {
  return readOverride().folderId?.trim() || process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || null;
}

/** True when the value in use came from the panel rather than the environment. */
export function isOverridden(): boolean {
  const override = readOverride();
  return Boolean(override.sheetId?.trim() || override.folderId?.trim());
}

export function saveLinks(links: Partial<GoogleLinks>): GoogleLinks {
  const current = readOverride();
  const next: GoogleLinks = {
    sheetId: extractId(links.sheetId ?? current.sheetId ?? ""),
    folderId: extractId(links.folderId ?? current.folderId ?? ""),
  };
  fs.writeFileSync(OVERRIDE_FILE, JSON.stringify(next, null, 2), "utf-8");
  return next;
}

export function clearLinks(): void {
  if (fs.existsSync(OVERRIDE_FILE)) fs.unlinkSync(OVERRIDE_FILE);
}

let warned = false;

/**
 * Logs once, at server startup, when the app is about to run on the local-
 * file fallback rather than Google Sheets. On Render this state is easy to
 * miss: the site works, admin saves succeed, nothing errors — the only
 * visible sign is a banner inside /admin → System → Storage, and content
 * silently resets on the next deploy regardless of whether anyone ever
 * opened that page. Printing to stdout puts it in the platform's own log
 * tail instead, where a first deploy is actually likely to be checked.
 *
 * Reads GOOGLE_SERVICE_ACCOUNT_JSON directly rather than importing the check
 * from google-auth.ts, which itself imports getSheetId from this module —
 * importing back would be a cycle.
 */
export function warnIfLocalBackend(): void {
  if (warned) return;
  warned = true;

  const hasServiceAccount = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
  const sheetId = getSheetId();
  if (hasServiceAccount && sheetId) return; // Sheets is configured — nothing to warn about

  const missing = [
    !hasServiceAccount && "GOOGLE_SERVICE_ACCOUNT_JSON",
    !sheetId && "GOOGLE_SHEET_ID",
  ].filter(Boolean);

  console.warn(
    `[storage] Running on local files, not Google Sheets — missing: ${missing.join(", ")}. ` +
      "Content saved now (cards, projects, etc.) will be LOST on the next deploy. " +
      "Set these in the Render dashboard under Environment, or see Deployment/DEPLOY-README.md §4a. " +
      "Confirm the fix at /admin -> System -> Storage."
  );
}
