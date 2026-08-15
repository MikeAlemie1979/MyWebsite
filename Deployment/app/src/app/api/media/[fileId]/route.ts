import { NextRequest, NextResponse } from "next/server";
import { fetchDriveFile } from "@/lib/media";

/**
 * Public read-through for images stored in Google Drive.
 *
 * Upload routes store "/api/media/<fileId>" in the content documents, so this
 * is what every card, project, and About flashcard image resolves to in
 * production. It exists so the Drive folder itself can stay private: the
 * service account reads the bytes server-side and this route re-serves them.
 *
 * Public by design — these are site images. The only thing a fileId grants is
 * read access to that one image, and the ids only appear in content the site
 * is already rendering.
 */

const ID_PATTERN = /^[a-zA-Z0-9_-]{10,128}$/;

export async function GET(_request: NextRequest, { params }: { params: { fileId: string } }) {
  const { fileId } = params;

  // Reject anything that isn't a plausible Drive id before spending a network
  // call, and so a crafted value can never be interpolated into the API path.
  if (!ID_PATTERN.test(fileId)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  try {
    const upstream = await fetchDriveFile(fileId);
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
        // Drive file ids are immutable and a new upload always mints a new id,
        // so the bytes behind a given URL can never change.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[media]", error);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
