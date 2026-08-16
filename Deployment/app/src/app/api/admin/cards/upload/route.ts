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
    const index = Number(formData.get("index"));

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!Number.isFinite(cardId) || !Number.isFinite(index)) {
      return NextResponse.json({ error: "cardId and index are required" }, { status: 400 });
    }

    const result = await saveIndexedUpload(file, "cards", cardId, index, "CardImg");
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("[cards/upload]", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
