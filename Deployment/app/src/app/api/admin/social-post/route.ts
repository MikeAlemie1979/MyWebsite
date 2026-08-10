import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const LOG_FILE = path.join(process.cwd(), ".env.social-post-log.json");
const MAX_LOG_ENTRIES = 50;

type Platform = "instagram" | "facebook";

interface SocialPostRequest {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  platforms: Platform[];
}

interface SocialPostResult {
  platform: Platform;
  success: boolean;
  postedAt: string;
  simulated: true;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
}

function readLog(): SocialPostResult[] {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const data = fs.readFileSync(LOG_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore malformed log, start fresh
  }
  return [];
}

function appendToLog(entries: SocialPostResult[]) {
  const existing = readLog();
  const updated = [...existing, ...entries].slice(-MAX_LOG_ENTRIES);
  fs.writeFileSync(LOG_FILE, JSON.stringify(updated, null, 2));
}

async function postToInstagram(payload: SocialPostRequest): Promise<SocialPostResult> {
  // TODO: replace with real Instagram Graph API call (POST /{ig-user-id}/media then /media_publish)
  // Real implementation would:
  //  1. Read instagram.accessToken + instagram.accountId from .env.social-config.json
  //  2. POST to https://graph.facebook.com/v19.0/{ig-user-id}/media with image_url/video_url + caption
  //  3. POST to https://graph.facebook.com/v19.0/{ig-user-id}/media_publish with the returned creation_id
  return {
    platform: "instagram",
    success: true,
    postedAt: new Date().toISOString(),
    simulated: true,
    text: payload.text,
    imageUrl: payload.imageUrl,
    videoUrl: payload.videoUrl,
  };
}

async function postToFacebook(payload: SocialPostRequest): Promise<SocialPostResult> {
  // TODO: replace with real Facebook Graph API call (POST /{page-id}/feed or /photos)
  // Real implementation would:
  //  1. Read facebook.accessToken + facebook.pageId from .env.social-config.json
  //  2. If image/video present, POST to https://graph.facebook.com/v19.0/{page-id}/photos (or /videos)
  //  3. Otherwise POST to https://graph.facebook.com/v19.0/{page-id}/feed with message=text
  return {
    platform: "facebook",
    success: true,
    postedAt: new Date().toISOString(),
    simulated: true,
    text: payload.text,
    imageUrl: payload.imageUrl,
    videoUrl: payload.videoUrl,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SocialPostRequest = await request.json();

    if (!body.text || !body.platforms || body.platforms.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: text and at least one platform" },
        { status: 400 }
      );
    }

    const validPlatforms = body.platforms.filter(
      (p): p is Platform => p === "instagram" || p === "facebook"
    );

    if (validPlatforms.length === 0) {
      return NextResponse.json({ error: "No valid platforms specified" }, { status: 400 });
    }

    const results: SocialPostResult[] = await Promise.all(
      validPlatforms.map((platform) =>
        platform === "instagram" ? postToInstagram(body) : postToFacebook(body)
      )
    );

    appendToLog(results);

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ error: "Failed to post to social media" }, { status: 500 });
  }
}

export async function GET() {
  try {
    return NextResponse.json({ history: readLog() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read post history" }, { status: 500 });
  }
}
