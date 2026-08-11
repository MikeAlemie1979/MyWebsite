import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const COUNT_FILE = path.join(process.cwd(), ".env.visitor-count.json");

interface VisitorCountStore {
  count: number;
  seenIds: string[];
}

function readStore(): VisitorCountStore {
  try {
    if (fs.existsSync(COUNT_FILE)) {
      const data = fs.readFileSync(COUNT_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return {
        count: typeof parsed.count === "number" ? parsed.count : 0,
        seenIds: Array.isArray(parsed.seenIds) ? parsed.seenIds : [],
      };
    }
  } catch {
    // Corrupt file — fall through to a fresh store rather than locking the
    // counter up entirely.
  }
  return { count: 0, seenIds: [] };
}

function writeStore(store: VisitorCountStore) {
  fs.writeFileSync(COUNT_FILE, JSON.stringify(store, null, 2));
}

export async function GET() {
  const { count } = readStore();
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

  const store = readStore();

  // Already seen this browser's id — return the current count unchanged
  // rather than incrementing again.
  if (store.seenIds.includes(visitorId)) {
    return NextResponse.json({ count: store.count });
  }

  store.seenIds.push(visitorId);
  store.count += 1;
  writeStore(store);

  return NextResponse.json({ count: store.count });
}
