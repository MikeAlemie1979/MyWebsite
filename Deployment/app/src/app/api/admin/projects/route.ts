import { NextRequest, NextResponse } from "next/server";
import { readDoc, writeDoc } from "@/lib/store";
import { requireAdmin } from "@/lib/admin-auth";

interface ProjectItem {
  id: string;
  cardId: number;
  details: string;
  cardLogoNumber: number;
  minDevCost: string;
}

interface ProjectsConfig {
  projects: ProjectItem[];
}

const DEFAULT_PROJECTS: ProjectsConfig = {
  projects: [
    { id: "p1", cardId: 1, details: "Placeholder project details.", cardLogoNumber: 1, minDevCost: "$—" },
  ],
};

export async function GET() {
  try {
    return NextResponse.json(await readDoc("projects", DEFAULT_PROJECTS));
  } catch (error) {
    return NextResponse.json({ error: "Failed to read projects config" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const projects: ProjectItem[] = body.projects;

    if (!Array.isArray(projects)) {
      return NextResponse.json({ error: "Invalid payload: projects must be an array" }, { status: 400 });
    }

    for (const project of projects) {
      if (
        typeof project.id !== "string" ||
        typeof project.cardId !== "number" ||
        typeof project.details !== "string" ||
        typeof project.cardLogoNumber !== "number" ||
        typeof project.minDevCost !== "string"
      ) {
        return NextResponse.json({ error: "Invalid project shape" }, { status: 400 });
      }
    }

    const config: ProjectsConfig = { projects };
    await writeDoc("projects", config);
    return NextResponse.json({ success: true, message: "Projects config saved" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save projects config" }, { status: 500 });
  }
}
