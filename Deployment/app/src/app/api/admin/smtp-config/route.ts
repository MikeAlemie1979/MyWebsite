import { NextRequest, NextResponse } from "next/server";
import { readDoc, writeDoc } from "@/lib/store";
import { requireAdmin } from "@/lib/admin-auth";

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
}

const EMPTY: SMTPConfig = {
  host: "",
  port: 587,
  secure: false,
  user: "",
  password: "",
  fromEmail: "",
};

/**
 * The stored mail password never leaves the server in the clear. Unlike the
 * content endpoints, nothing public reads this route, so both GET and POST are
 * behind the admin session — the masking is the second layer, matching the
 * scheme already used by /api/admin/social-config for its access tokens.
 */
function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "*".repeat(value.length);
  return "*".repeat(value.length - 4) + value.slice(-4);
}

const isMasked = (value: string) => value.length > 0 && /^\*+/.test(value);

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const config = await readDoc<SMTPConfig>("smtp", EMPTY);
    return NextResponse.json({ ...config, password: maskSecret(config.password) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read SMTP config" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const incoming: SMTPConfig = await request.json();

    if (!incoming.host || !incoming.port || !incoming.user || !incoming.fromEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // The panel receives the password masked, so an unchanged field comes back
    // as asterisks. Writing that through would destroy the real password.
    const existing = await readDoc<SMTPConfig>("smtp", EMPTY);
    const password = isMasked(incoming.password ?? "")
      ? existing.password
      : incoming.password ?? "";

    if (!password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await writeDoc("smtp", { ...incoming, password });
    return NextResponse.json({ success: true, message: "SMTP config saved" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save SMTP config" }, { status: 500 });
  }
}
