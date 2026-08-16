import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { activeBackend, DOC_KEYS, docExists, invalidate } from "@/lib/store";
import { getServiceAccountEmail, hasServiceAccount } from "@/lib/google-auth";
import { clearLinks, getFolderId, getSheetId, isOverridden, saveLinks } from "@/lib/google-config";
import { mediaBackend } from "@/lib/media";
import { disconnectOAuth, getOAuthStatus, isOAuthClientConfigured } from "@/lib/google-oauth";

/**
 * Backs the admin Storage panel.
 *
 * GET reports which backend is live and probes the connection. POST sets the
 * spreadsheet and Drive folder. Only those two ids are settable — the
 * service-account private key stays in the environment, so no secret is ever
 * written to disk by this route or echoed back in a response.
 */

async function buildStatus() {
  const backend = activeBackend();
  const sheetId = getSheetId();
  const folderId = getFolderId();
  const oauth = await getOAuthStatus();

  const base = {
    backend,
    mediaBackend: await mediaBackend(),
    serviceAccountEmail: getServiceAccountEmail(),
    hasServiceAccount: hasServiceAccount(),
    sheetId,
    folderId,
    // Whether the ids in use were typed into this panel or came from the
    // environment. Worth surfacing: a panel-set value is lost on the next
    // Render deploy, and the environment value silently takes over again.
    overridden: isOverridden(),
    // Drive uploads run as this account, not the service account above —
    // service accounts get zero storage quota on a personal Drive.
    driveOAuthConfigured: isOAuthClientConfigured(),
    driveConnected: oauth.connected,
    driveConnectedEmail: oauth.email,
    missing: [
      !hasServiceAccount() && "GOOGLE_SERVICE_ACCOUNT_JSON",
      !sheetId && "a spreadsheet",
      !folderId && "a Drive folder",
    ].filter(Boolean) as string[],
  };

  if (backend === "fs") {
    return { ...base, reachable: null, documents: [], error: null };
  }

  // Bypass the read cache so "Test connection" tests the connection rather
  // than replaying what it read a minute ago.
  invalidate();

  try {
    const documents = await Promise.all(
      DOC_KEYS.map(async (key) => ({ key, present: await docExists(key) }))
    );
    return { ...base, reachable: true, documents, error: null };
  } catch (error) {
    return {
      ...base,
      reachable: false,
      documents: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await buildStatus());
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      sheetId?: string;
      folderId?: string;
      clear?: boolean;
      disconnectDrive?: boolean;
    };

    if (body.disconnectDrive) {
      await disconnectOAuth();
    } else if (body.clear) {
      clearLinks();
    } else {
      // saveLinks accepts a full Google URL or a bare id — the admin will
      // paste whatever is in the address bar.
      saveLinks({ sheetId: body.sheetId, folderId: body.folderId });
    }

    // The backend may have just changed from local files to Sheets (or the
    // other way), so nothing already cached is trustworthy.
    invalidate();

    return NextResponse.json(await buildStatus());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save storage settings" },
      { status: 500 }
    );
  }
}
