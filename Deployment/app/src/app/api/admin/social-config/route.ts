import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const CONFIG_FILE = path.join(process.cwd(), ".env.social-config.json");

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

export async function GET() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      const config: SocialConfig = JSON.parse(data);
      return NextResponse.json(maskConfig(config));
    }
    return NextResponse.json(maskConfig(DEFAULT_CONFIG));
  } catch (error) {
    return NextResponse.json({ error: "Failed to read social config" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SocialConfig = await request.json();

    if (!body.instagram || !body.facebook) {
      return NextResponse.json({ error: "Missing instagram or facebook config" }, { status: 400 });
    }

    // Preserve previously saved tokens if the client submits a masked value
    // (i.e. the user didn't change it) instead of overwriting with asterisks.
    let existing: SocialConfig = DEFAULT_CONFIG;
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        existing = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      } catch {
        existing = DEFAULT_CONFIG;
      }
    }

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

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    return NextResponse.json({ success: true, message: "Social config saved", config: maskConfig(newConfig) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save social config" }, { status: 500 });
  }
}
