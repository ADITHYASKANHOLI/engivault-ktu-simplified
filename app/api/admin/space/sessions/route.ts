import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { spaceService } from "@/lib/space/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await spaceService.getAllSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Admin space sessions error:", error);
    return NextResponse.json({ error: "Failed to load sessions." }, { status: 500 });
  }
}
