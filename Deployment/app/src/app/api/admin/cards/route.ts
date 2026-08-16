import { NextRequest, NextResponse } from "next/server";
import { readDoc, writeDoc } from "@/lib/store";
import { requireAdmin } from "@/lib/admin-auth";

interface CardItem {
  id: string;
  cardId: number;
  cardContent: string;
  cardImgNumber: number;
  imageUrl: string | null;
}

interface CardsConfig {
  cards: CardItem[];
}

const DEFAULT_CARDS: CardsConfig = {
  cards: [
    { id: "c1", cardId: 1, cardContent: "Placeholder content — editable via Admin.", cardImgNumber: 1, imageUrl: null },
    { id: "c2", cardId: 2, cardContent: "Placeholder content — editable via Admin.", cardImgNumber: 1, imageUrl: null },
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
      if (
        typeof card.id !== "string" ||
        typeof card.cardId !== "number" ||
        typeof card.cardContent !== "string" ||
        typeof card.cardImgNumber !== "number" ||
        (card.imageUrl !== null && typeof card.imageUrl !== "string")
      ) {
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
