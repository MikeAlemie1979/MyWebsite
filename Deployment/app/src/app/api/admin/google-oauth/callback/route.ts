import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { completeOAuthExchange } from "@/lib/google-oauth";

/**
 * Where Google redirects back to after the admin approves (or denies) Drive
 * access. Must exactly match a URI registered in the OAuth client's
 * "Authorized redirect URIs" in Cloud Console.
 */
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const expectedState = request.cookies.get("google_oauth_state")?.value;
  const error = url.searchParams.get("error");

  const redirectWithMessage = (query: string) =>
    NextResponse.redirect(new URL(`/admin?${query}`, request.url));

  if (error) {
    // The admin clicked "Cancel" on Google's consent screen — not a failure.
    return redirectWithMessage("drive_connect=denied");
  }
  if (!code || !returnedState || returnedState !== expectedState) {
    return redirectWithMessage("drive_connect=error");
  }

  try {
    await completeOAuthExchange(code);
    const response = redirectWithMessage("drive_connect=success");
    response.cookies.set("google_oauth_state", "", { maxAge: 0, path: "/" });
    return response;
  } catch (err) {
    console.error("[google-oauth/callback]", err);
    return redirectWithMessage("drive_connect=error");
  }
}
