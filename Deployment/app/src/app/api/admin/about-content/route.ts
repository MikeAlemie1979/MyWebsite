import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const CONFIG_FILE = path.join(process.cwd(), ".env.about-content.json");

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
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      const config = JSON.parse(data);
      return NextResponse.json(config);
    }
    return NextResponse.json(DEFAULT_CONTENT);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read About content" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const content: AboutContent = await request.json();

    if (
      typeof content.headline !== "string" ||
      typeof content.body !== "string" ||
      !Array.isArray(content.flashcards)
    ) {
      return NextResponse.json({ error: "Invalid About content payload" }, { status: 400 });
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(content, null, 2));
    return NextResponse.json({ success: true, message: "About content saved" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save About content" }, { status: 500 });
  }
}
