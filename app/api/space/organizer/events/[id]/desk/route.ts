import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedStudent, isVerifiedOrganizer } from "@/lib/space/permissions";
import { spaceService } from "@/lib/space/service";

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
    const data = await spaceService.getEventDeskData(id, student.id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Desk data error:", error);
    return NextResponse.json({ error: error?.message || "Failed to load desk data." }, { status: 400 });
  }
}
