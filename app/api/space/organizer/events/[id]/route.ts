import { NextRequest, NextResponse } from "next/server";
import { isSafeOrigin } from "@/lib/security/origin";
import { getAuthenticatedStudent, isVerifiedOrganizer } from "@/lib/space/permissions";
import { spaceService } from "@/lib/space/service";
import { spaceEventUpdateSchema } from "@/lib/space/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const student = await getAuthenticatedStudent();
  if (!student) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const isOrganizer = await isVerifiedOrganizer(student.id);
  if (!isOrganizer) {
    return NextResponse.json({ error: "Organizer access required." }, { status: 403 });
  }

  try {
    const event = await spaceService.getEventById(id);
    if (!event || event.deleted_at) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (event.organizer_id !== student.id) {
      return NextResponse.json({ error: "Unauthorized access to this event." }, { status: 403 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Get organizer event error:", error);
    return NextResponse.json({ error: "Failed to load event." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const { id } = await params;
  const student = await getAuthenticatedStudent();
  if (!student) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const isOrganizer = await isVerifiedOrganizer(student.id);
  if (!isOrganizer) {
    return NextResponse.json({ error: "Organizer access required." }, { status: 403 });
  }

  try {
    const event = await spaceService.getEventById(id);
    if (!event || event.deleted_at) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (event.organizer_id !== student.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = spaceEventUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await spaceService.updateEvent(id, student.id, parsed.data);
    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    console.error("Update event error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update event." },
      { status: 400 }
    );
  }
}
