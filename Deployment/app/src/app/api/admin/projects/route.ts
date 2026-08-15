import { NextRequest, NextResponse } from "next/server";
import { readDoc, writeDoc } from "@/lib/store";
import { requireAdmin } from "@/lib/admin-auth";

interface ProjectItem {
  id: string;
  title: string;
  briefInfo: string;
  approxPrice: string;
  imageUrl: string | null;
  order: number;
}

interface ProjectsConfig {
  projects: ProjectItem[];
}

const DEFAULT_PROJECTS: ProjectsConfig = {
  projects: Array.from({ length: 7 }, (_, i) => ({
    id: `p${i + 1}`,
    title: `Project ${i + 1}`,
    briefInfo: "Placeholder project description.",
    approxPrice: "$—",
    imageUrl: null,
    order: i,
  })),
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

    if (!Array.isArray(projects) || projects.length !== 7) {
      return NextResponse.json(
        { error: "Invalid payload: projects must be an array of exactly 7 items" },
        { status: 400 }
      );
    }

    for (const project of projects) {
      if (
        typeof project.id !== "string" ||
        typeof project.title !== "string" ||
        typeof project.briefInfo !== "string" ||
        typeof project.approxPrice !== "string" ||
        typeof project.order !== "number" ||
        (project.imageUrl !== null && typeof project.imageUrl !== "string")
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
