import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/admin-auth";
import { buildConsentUrl, isOAuthClientConfigured } from "@/lib/google-oauth";

/**
 * Kicks off the "Connect Google Drive" flow from the admin Storage panel.
 * A random `state` value is round-tripped through Google and checked back in
 * the callback, the standard CSRF guard for OAuth redirects — without it,
 * an attacker could trick a logged-in admin into completing someone else's
 * authorization code exchange.
 */
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOAuthClientConfigured()) {
    return NextResponse.json(
      { error: "GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET are not set" },
      { status: 400 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const response = NextResponse.redirect(buildConsentUrl(state));
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // the whole consent round trip should take well under 10 minutes
  });
  return response;
}
