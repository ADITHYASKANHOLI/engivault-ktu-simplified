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
    const events = await spaceService.getAllEventsForAdmin();
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Admin space events GET error:", error);
    return NextResponse.json({ error: "Failed to load events for moderation." }, { status: 500 });
  }
}
