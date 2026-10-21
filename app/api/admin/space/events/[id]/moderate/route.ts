import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { isSafeOrigin } from "@/lib/security/origin";
import { spaceService } from "@/lib/space/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const action = body?.action; // 'unpublish' | 'cancel'

    if (action !== "unpublish" && action !== "cancel") {
      return NextResponse.json(
        { error: "Invalid moderation action. Must be 'unpublish' or 'cancel'." },
        { status: 400 }
      );
    }

    const result = await spaceService.moderateEvent(eventId, action);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Event successfully ${action === "unpublish" ? "unpublished to draft" : "cancelled"}.`,
    });
  } catch (error: any) {
    console.error("Admin moderate event error:", error);
    return NextResponse.json({ error: error?.message || "Failed to moderate event." }, { status: 500 });
  }
}
