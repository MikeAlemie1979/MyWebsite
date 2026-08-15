import { NextRequest, NextResponse } from "next/server";
import { readDoc, writeDoc } from "@/lib/store";
import { requireAdmin } from "@/lib/admin-auth";

interface InstagramConfig {
  connected: boolean;
  accountId: string;
  accessToken: string;
}

interface FacebookConfig {
  connected: boolean;
  pageId: string;
  accessToken: string;
}

interface SocialConfig {
  instagram: InstagramConfig;
  facebook: FacebookConfig;
}

const DEFAULT_CONFIG: SocialConfig = {
  instagram: { connected: false, accountId: "", accessToken: "" },
  facebook: { connected: false, pageId: "", accessToken: "" },
};

function maskToken(token: string): string {
  if (!token) return "";
  if (token.length <= 4) return "*".repeat(token.length);
  return "*".repeat(token.length - 4) + token.slice(-4);
}

function maskConfig(config: SocialConfig): SocialConfig {
  return {
    instagram: {
      ...config.instagram,
      accessToken: maskToken(config.instagram.accessToken),
    },
    facebook: {
      ...config.facebook,
      accessToken: maskToken(config.facebook.accessToken),
    },
  };
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(maskConfig(await readDoc("social-config", DEFAULT_CONFIG)));
  } catch (error) {
    return NextResponse.json({ error: "Failed to read social config" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body: SocialConfig = await request.json();

    if (!body.instagram || !body.facebook) {
      return NextResponse.json({ error: "Missing instagram or facebook config" }, { status: 400 });
    }

    // Preserve previously saved tokens if the client submits a masked value
    // (i.e. the user didn't change it) instead of overwriting with asterisks.
    const existing = await readDoc<SocialConfig>("social-config", DEFAULT_CONFIG);

    const isMasked = (value: string) => /^\*+/.test(value) && value.length > 0;

    const newConfig: SocialConfig = {
      instagram: {
        connected: !!body.instagram.connected,
        accountId: body.instagram.accountId ?? "",
        accessToken: isMasked(body.instagram.accessToken ?? "")
          ? existing.instagram?.accessToken ?? ""
          : body.instagram.accessToken ?? "",
      },
      facebook: {
        connected: !!body.facebook.connected,
        pageId: body.facebook.pageId ?? "",
        accessToken: isMasked(body.facebook.accessToken ?? "")
          ? existing.facebook?.accessToken ?? ""
          : body.facebook.accessToken ?? "",
      },
    };

    await writeDoc("social-config", newConfig);
    return NextResponse.json({ success: true, message: "Social config saved", config: maskConfig(newConfig) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save social config" }, { status: 500 });
  }
}
