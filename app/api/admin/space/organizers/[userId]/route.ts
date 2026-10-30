import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { isSafeOrigin } from "@/lib/security/origin";
import { spaceService } from "@/lib/space/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "User ID is required." }, { status: 400 });
  }

  try {
    const result = await spaceService.removeOrganizer(userId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Organizer access revoked successfully." });
  } catch (error: any) {
    console.error("Admin remove organizer error:", error);
    return NextResponse.json({ error: error?.message || "Failed to remove organizer." }, { status: 500 });
  }
}
