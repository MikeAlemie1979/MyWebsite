import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isSessionValid } from "@/lib/admin-auth";

/**
 * Server component auth guard for the protected /admin route tree.
 *
 * This lives in the `(protected)` route group so it wraps `/admin` (the
 * dashboard) but NOT `/admin/login`, which is a sibling outside this group
 * and therefore never passes through this check - avoiding any risk of a
 * redirect loop on the login page itself.
 *
 * NOTE: This is implemented as a layout guard rather than Next.js Edge
 * middleware because session validation here reads `.env.admin-sessions.json`
 * from disk via Node's `fs` module, and Next.js Edge middleware runs in the
 * Edge runtime, which does not support `fs` (or most other Node built-ins).
 * A server component (which always runs in the Node.js runtime) is the
 * technically correct place for file-backed session validation in the
 * Next.js 14 App Router.
 */
export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!isSessionValid(token)) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
