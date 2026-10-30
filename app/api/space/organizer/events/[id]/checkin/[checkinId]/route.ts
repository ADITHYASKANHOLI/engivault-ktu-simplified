import { NextRequest, NextResponse } from "next/server";
import { isSafeOrigin } from "@/lib/security/origin";
import { getAuthenticatedStudent, isVerifiedOrganizer, canManageEvent } from "@/lib/space/permissions";
import { spaceService } from "@/lib/space/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string; checkinId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const { id: eventId, checkinId } = await params;
  const student = await getAuthenticatedStudent();
  if (!student) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const isOrganizer = await isVerifiedOrganizer(student.id);
  if (!isOrganizer) {
    return NextResponse.json({ error: "Organizer access required." }, { status: 403 });
  }

  const isAuthorized = await canManageEvent(eventId, student.id);
  if (!isAuthorized) {
    return NextResponse.json(
      { error: "You are not authorized to revoke check-in for this event." },
      { status: 403 }
    );
  }

  try {
    const result = await spaceService.revokeCheckin(eventId, checkinId, student.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Check-in undone successfully." });
  } catch (error: any) {
    console.error("Revoke checkin error:", error);
    return NextResponse.json({ error: error?.message || "Failed to revoke check-in." }, { status: 500 });
  }
}
