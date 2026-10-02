import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  await clearAdminSessionCookie();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}
