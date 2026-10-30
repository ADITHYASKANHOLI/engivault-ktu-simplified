import { NextRequest, NextResponse } from "next/server";
import { isSafeOrigin } from "@/lib/security/origin";
import { getAuthenticatedStudent, isVerifiedOrganizer, canManageEvent } from "@/lib/space/permissions";
import { spaceService } from "@/lib/space/service";
import { deskManualCheckinSchema } from "@/lib/space/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const { id: eventId } = await params;
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
      { error: "You are not authorized to manage check-in for this event." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = deskManualCheckinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid participant identifier." }, { status: 400 });
    }

    const result = await spaceService.checkinManual(
      eventId,
      student.id,
      parsed.data.user_id,
      parsed.data.registration_id
    );

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
        code: (result as any).code || "CHECKIN_FAILED",
        checked_in_at: (result as any).checked_in_at,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      checkin: result.checkin,
      message: "Participant marked present.",
    });
  } catch (error: any) {
    console.error("Desk manual check-in error:", error);
    return NextResponse.json({ error: error?.message || "Manual check-in failed." }, { status: 500 });
  }
}
