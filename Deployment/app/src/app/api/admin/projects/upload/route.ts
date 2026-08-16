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
    const cardId = Number(formData.get("cardId"));
    const logoIndex = Number(formData.get("logoIndex"));

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!Number.isFinite(cardId) || !Number.isFinite(logoIndex)) {
      return NextResponse.json({ error: "cardId and logoIndex are required" }, { status: 400 });
    }

    const result = await saveIndexedUpload(file, "projects", cardId, logoIndex, "Logo");
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("[projects/upload]", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
