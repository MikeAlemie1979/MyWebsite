import { NextRequest, NextResponse } from "next/server";
import { readLocalUpload } from "@/lib/media";

/**
 * Public read-through for images stored in the local uploads/ directory (the
 * fallback backend used whenever Google isn't configured).
 *
 * This exists specifically so uploaded images are NOT served as static files
 * out of public/ — Next.js's production server (`next start`) snapshots the
 * public/ directory listing once at boot and never rescans it, so a file
 * written there by a running server would 404 for every visitor until the
 * process restarts. Reading from disk on every request, the same way
 * /api/media/[fileId] already does for the Drive backend, sidesteps that
 * entirely.
 */
export async function GET(_request: NextRequest, { params }: { params: { path: string[] } }) {
  const result = readLocalUpload(params.path);
  if (!result) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": result.contentType,
      // Filenames are timestamp-suffixed and never reused, so the bytes
      // behind a given URL can never change.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
