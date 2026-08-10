import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const CONFIG_FILE = path.join(process.cwd(), ".env.home-text.json");

interface HomeTextSentence {
  id: string;
  text: string;
}

interface HomeTextConfig {
  sentences: HomeTextSentence[];
  fontFamily: string;
  fontSize: number;
  textColor: string;
  letterSpacing: number;
}

// Kept in sync with the component's own DEFAULT_SENTENCES fallback
// (ash-text-section.tsx) — this API-level default previously had just one
// placeholder sentence, which silently replaced all 8 real ones (including
// the "MEHRDAD MIKE ALEMIE." cue the cube reveal keys off of) the moment any
// config file existed on disk, even a stale one from admin-panel testing.
const DEFAULT_CONFIG: HomeTextConfig = {
  sentences: [
    { id: "1", text: "DON'T JUST BUILD IT. ENGINEER IT FOR THE PERFECTION." },
    { id: "2", text: "YOU DESCRIBE, I ENGINEER & FLOWCHART IT." },
    { id: "3", text: "SMART ARCHITECTURE. GREAT DESIGN. REAL IMPACT." },
    { id: "4", text: "RENEW & EMPOWER YOUR BUSINESS FOR THE BETTER SHINNING." },
    { id: "5", text: "BREAK THE ORDINARY FASHION. REBUILD FOR THE FUTURE." },
    { id: "6", text: "DESIGNED TO IMPRESS. ENGINEERED TO FIX & PERFORM." },
    { id: "7", text: "WEB APP & DATABASE ARCHITECTURE FOR COMPLEX PROJECTS IS MY DNA." },
    { id: "8", text: "MEHRDAD MIKE ALEMIE." },
  ],
  fontFamily: "Michroma",
  fontSize: 42,
  textColor: "#000000",
  letterSpacing: 1,
};

export async function GET() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      const config = JSON.parse(data);
      return NextResponse.json(config);
    }
    return NextResponse.json(DEFAULT_CONFIG);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read home text config" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const config: HomeTextConfig = await request.json();

    if (!Array.isArray(config.sentences) || !config.fontFamily || !config.fontSize || !config.textColor) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return NextResponse.json({ success: true, message: "Home text config saved" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save home text config" }, { status: 500 });
  }
}
