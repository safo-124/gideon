import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic auth gate. Only checks cookie *presence*, not signature — the real
// session validation happens server-side in lib/auth.ts. Per the Next.js 16
// docs, proxy should not be used for full session/authorization.

const SESSION_COOKIE = "kr_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isTenantLogin = pathname === "/login";
  const isAdminLogin = pathname === "/admin/login";
  const isPublic = pathname.startsWith("/dispute") || pathname === "/signup";
  const isAdminArea = pathname.startsWith("/admin") && !isAdminLogin;
  const isTenantArea = !pathname.startsWith("/admin") && !isTenantLogin && !isPublic;

  if (!hasSession && (isAdminArea || isTenantArea)) {
    const target = isAdminArea ? "/admin/login" : "/login";
    return NextResponse.redirect(new URL(target, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on app pages but skip Next internals, static files, and the favicon.
    "/((?!_next/|.*\\..*).*)",
  ],
};
