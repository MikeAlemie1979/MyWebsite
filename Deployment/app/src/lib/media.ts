import * as fs from "fs";
import * as path from "path";
import { getFolderId } from "./google-config";
import { getDriveAccessToken } from "./google-oauth";

/**
 * Image upload handling shared by the three admin upload routes
 * (cards / projects / about-content).
 *
 * Like the document store, this has two backends:
 *   - local  — writes into <cwd>/uploads/<folder>/ (NOT public/uploads/),
 *              used whenever Drive isn't connected.
 *   - drive  — uploads into the GOOGLE_DRIVE_FOLDER_ID folder, authenticated
 *              as the real Google account via OAuth (see google-oauth.ts) —
 *              deliberately NOT the service account used for Sheets. Service
 *              accounts get zero storage quota on a personal (non-Workspace)
 *              Drive, so uploads with one fail outright regardless of
 *              sharing; acting as the account owner uses their own quota
 *              instead. Every file this creates is therefore owned by that
 *              account, not the service account — so reading it back must
 *              use the same OAuth token too, not the service account's.
 *
 * Neither backend serves its files as a static asset under public/. That was
 * the original local design and it has a real bug in production: Next.js's
 * `next start` snapshots the public/ directory listing once at boot and never
 * rescans it, so a file uploaded while the server is already running 404s for
 * every visitor until the process restarts — which on Render doesn't happen
 * until the next deploy. Both backends instead return an "/api/media/..."
 * URL that always reads live from disk/Drive on every request, exactly like
 * the Drive path was already designed to. This also keeps local uploads
 * out of the public/ directory that Next serves unauthenticated by design,
 * and keeps every URL already stored in the content documents valid if the
 * storage backend is ever swapped again.
 */

export const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_FILES = "https://www.googleapis.com/drive/v3/files";

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function driveFolderId(): string | undefined {
  return getFolderId() ?? undefined;
}

export async function mediaBackend(): Promise<"local" | "drive"> {
  const token = await getDriveAccessToken();
  return token && driveFolderId() ? "drive" : "local";
}

export interface UploadOutcome {
  url?: string;
  error?: string;
  status?: number;
}

/**
 * Validates and stores one uploaded image.
 *
 * `folder` names the local uploads subdirectory and is only cosmetic under
 * Drive (everything lands in the one configured folder), where it is folded
 * into the filename so uploads stay identifiable by origin. `prefix` is the
 * caller's own id (projectId / cardId), used both to make the filename
 * identifiable at a glance and, for the local backend, as the folder segment
 * in the served URL.
 */
export async function saveUpload(
  file: File,
  folder: string,
  prefix?: string
): Promise<UploadOutcome> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      error: "Invalid file type. Only JPG, PNG, and WEBP images are allowed.",
      status: 400,
    };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "File too large. Maximum size is 2MB.", status: 400 };
  }

  const safeName = sanitizeFileName(file.name || "upload");
  const idPrefix = prefix ? `${sanitizeFileName(prefix)}-` : "";
  const filename = `${idPrefix}${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const backend = await mediaBackend();
  if (backend === "local") {
    const dir = path.join(process.cwd(), "uploads", folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);
    return { url: `/api/media/local/${folder}/${filename}` };
  }

  const accessToken = await getDriveAccessToken();
  if (!accessToken) return { error: "Google Drive is not connected", status: 500 };

  const metadata = {
    name: `${folder}-${filename}`,
    parents: [driveFolderId()!],
  };

  // Drive's multipart upload wants a multipart/related body: a JSON metadata
  // part followed by the raw bytes. Building it by hand avoids pulling in the
  // full googleapis package for this single call.
  const boundary = `mab${Date.now().toString(16)}`;
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\n` +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: ${file.type}\r\n\r\n`
    ),
    buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const response = await fetch(`${DRIVE_UPLOAD}?uploadType=multipart&fields=id`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("[media] Drive upload failed:", response.status, text.slice(0, 500));
    return { error: "Failed to upload to Google Drive", status: 502 };
  }

  const { id } = (await response.json()) as { id?: string };
  if (!id) return { error: "Drive upload returned no file id", status: 500 };

  return { url: `/api/media/${id}` };
}

/**
 * Streams a Drive file back to the browser. Used by /api/media/[fileId].
 * Files uploaded through saveUpload() are owned by the OAuth-connected
 * account, not the service account, so reading them back needs that same
 * token — a service-account request would get a 404 for a file it was never
 * given access to.
 */
export async function fetchDriveFile(fileId: string): Promise<Response> {
  const accessToken = await getDriveAccessToken();
  if (!accessToken) {
    return new Response(null, { status: 404 });
  }
  return fetch(`${DRIVE_FILES}/${encodeURIComponent(fileId)}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

const EXT_CONTENT_TYPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/**
 * Reads one file back from the local uploads directory. Used by
 * /api/media/local/[...path]. Every path segment is validated against the
 * exact charset saveUpload() sanitizes filenames to, which also rules out
 * "..", so this can never be pointed outside the uploads directory.
 */
export function readLocalUpload(segments: string[]): { buffer: Buffer; contentType: string } | null {
  if (segments.length === 0 || segments.some((s) => !/^[a-zA-Z0-9._-]+$/.test(s))) return null;

  const filePath = path.join(process.cwd(), "uploads", ...segments);
  if (!fs.existsSync(filePath)) return null;

  const ext = path.extname(filePath).toLowerCase();
  const contentType = EXT_CONTENT_TYPE[ext];
  if (!contentType) return null;

  return { buffer: fs.readFileSync(filePath), contentType };
}
