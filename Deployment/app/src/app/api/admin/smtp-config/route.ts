import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const CONFIG_FILE = path.join(process.cwd(), ".env.smtp.json");

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
}

export async function GET() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      const config = JSON.parse(data);
      return NextResponse.json(config);
    }
    return NextResponse.json({ error: "No SMTP config found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read SMTP config" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const config: SMTPConfig = await request.json();

    if (!config.host || !config.port || !config.user || !config.password || !config.fromEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return NextResponse.json({ success: true, message: "SMTP config saved" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save SMTP config" }, { status: 500 });
  }
}
