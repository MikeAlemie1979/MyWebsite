import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { saveIndexedUpload } from "@/lib/media";

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    // Namespaced by the project's own id, not the linked Home card's cardId —
    // each project has exactly one logo, so this only ever needs one slot
    // (index 1), independent of which card it links to.
    const projectId = Number(formData.get("projectId"));

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!Number.isFinite(projectId)) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const result = await saveIndexedUpload(file, "projects", projectId, 1, "Logo");
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("[projects/upload]", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
