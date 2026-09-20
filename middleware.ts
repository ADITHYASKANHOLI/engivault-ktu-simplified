import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminSessionCookie = request.cookies.get("engivault_admin_session");

  // Protect all /admin routes except /admin/login
  if (pathname === "/admin" || (pathname.startsWith("/admin/") && !pathname.startsWith("/admin/login"))) {
    if (!adminSessionCookie?.value) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
