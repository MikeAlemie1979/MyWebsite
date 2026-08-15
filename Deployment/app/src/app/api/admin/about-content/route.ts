import { NextRequest, NextResponse } from "next/server";
import { readDoc, writeDoc } from "@/lib/store";
import { requireAdmin } from "@/lib/admin-auth";

interface Flashcard {
  id: string;
  imageUrl: string | null;
  title: string;
  text: string;
}

interface AboutContent {
  headline: string;
  headlineFontFamily: string;
  headlineFontSize: number;
  headlineColor: string;
  body: string;
  bodyFontFamily: string;
  bodyFontSize: number;
  bodyColor: string;
  flashcards: Flashcard[];
}

const DEFAULT_CONTENT: AboutContent = {
  headline: "About Mike Alemie",
  headlineFontFamily: "Michroma",
  headlineFontSize: 24,
  headlineColor: "#FFFFFF",
  body:
    "Mike Alemie is a designer and engineer focused on the intersection of data, systems, and craft. His work blends structured thinking with a strong visual sensibility. This is placeholder body text — edit it from the Admin panel.",
  bodyFontFamily: "Michroma",
  bodyFontSize: 12,
  bodyColor: "#FFFFFF",
  flashcards: [
    { id: "card-1", imageUrl: null, title: "", text: "" },
    { id: "card-2", imageUrl: null, title: "", text: "" },
    { id: "card-3", imageUrl: null, title: "", text: "" },
  ],
};

export async function GET() {
  try {
    return NextResponse.json(await readDoc("about-content", DEFAULT_CONTENT));
  } catch (error) {
    return NextResponse.json({ error: "Failed to read About content" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const content: AboutContent = await request.json();

    if (
      typeof content.headline !== "string" ||
      typeof content.body !== "string" ||
      !Array.isArray(content.flashcards)
    ) {
      return NextResponse.json({ error: "Invalid About content payload" }, { status: 400 });
    }

    await writeDoc("about-content", content);
    return NextResponse.json({ success: true, message: "About content saved" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save About content" }, { status: 500 });
  }
}
