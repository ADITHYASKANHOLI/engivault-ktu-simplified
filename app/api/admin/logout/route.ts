import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/auth/session";
import { isSafeOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  await clearAdminSessionCookie();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}
