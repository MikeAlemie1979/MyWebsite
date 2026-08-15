import { NextRequest, NextResponse } from "next/server";
import { readDoc, writeDoc } from "@/lib/store";
import { requireAdmin } from "@/lib/admin-auth";

interface CardItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
}

interface CardsConfig {
  cards: CardItem[];
}

const DEFAULT_CARDS: CardsConfig = {
  cards: [
    { id: "c1", title: "Data Architecture", description: "Placeholder content — editable via Admin.", imageUrl: null },
    { id: "c2", title: "AI Systems", description: "Placeholder content — editable via Admin.", imageUrl: null },
    { id: "c3", title: "Product Design", description: "Placeholder content — editable via Admin.", imageUrl: null },
    { id: "c4", title: "Cloud Engineering", description: "Placeholder content — editable via Admin.", imageUrl: null },
  ],
};

export async function GET() {
  try {
    return NextResponse.json(await readDoc("cards", DEFAULT_CARDS));
  } catch (error) {
    return NextResponse.json({ error: "Failed to read cards config" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const cards: CardItem[] = body.cards;

    if (!Array.isArray(cards)) {
      return NextResponse.json({ error: "Invalid payload: cards must be an array" }, { status: 400 });
    }

    for (const card of cards) {
      if (typeof card.id !== "string" || typeof card.title !== "string" || typeof card.description !== "string") {
        return NextResponse.json({ error: "Invalid card shape" }, { status: 400 });
      }
    }

    const config: CardsConfig = { cards };
    await writeDoc("cards", config);
    return NextResponse.json({ success: true, message: "Cards config saved" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save cards config" }, { status: 500 });
  }
}
