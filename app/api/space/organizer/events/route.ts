import { NextRequest, NextResponse } from "next/server";
import { isSafeOrigin } from "@/lib/security/origin";
import { getAuthenticatedStudent, isVerifiedOrganizer } from "@/lib/space/permissions";
import { spaceService } from "@/lib/space/service";
import { spaceEventSchema } from "@/lib/space/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const student = await getAuthenticatedStudent();
  if (!student) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const isOrganizer = await isVerifiedOrganizer(student.id);
  if (!isOrganizer) {
    return NextResponse.json({ error: "Verified organizer status required." }, { status: 403 });
  }

  try {
    const events = await spaceService.getOrganizerEvents(student.id);
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Organizer events error:", error);
    return NextResponse.json({ error: "Failed to load events." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const student = await getAuthenticatedStudent();
  if (!student) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const isOrganizer = await isVerifiedOrganizer(student.id);
  if (!isOrganizer) {
    return NextResponse.json({ error: "Only verified organizers can create events." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = spaceEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const event = await spaceService.createEvent(student.id, parsed.data);
    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error: any) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create event." },
      { status: 400 }
    );
  }
}
