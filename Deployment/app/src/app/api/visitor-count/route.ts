import { NextRequest, NextResponse } from "next/server";
import { readDoc, writeDoc } from "@/lib/store";

interface VisitorCountStore {
  count: number;
  seenIds: string[];
}

const EMPTY: VisitorCountStore = { count: 0, seenIds: [] };

async function readStore(): Promise<VisitorCountStore> {
  const parsed = await readDoc<Partial<VisitorCountStore>>("visitor-count", EMPTY);
  return {
    count: typeof parsed.count === "number" ? parsed.count : 0,
    seenIds: Array.isArray(parsed.seenIds) ? parsed.seenIds : [],
  };
}

export async function GET() {
  const { count } = await readStore();
  return NextResponse.json({ count });
}

export async function POST(request: NextRequest) {
  let body: { visitorId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { visitorId } = body;
  if (!visitorId || typeof visitorId !== "string") {
    return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
  }

  const store = await readStore();

  // Already seen this browser's id — return the current count unchanged
  // rather than incrementing again.
  if (store.seenIds.includes(visitorId)) {
    return NextResponse.json({ count: store.count });
  }

  store.seenIds.push(visitorId);
  store.count += 1;
  // The store layer caps seenIds so it cannot outgrow a Sheets cell.
  await writeDoc("visitor-count", store);

  return NextResponse.json({ count: store.count });
}
