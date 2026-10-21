import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { isSafeOrigin } from "@/lib/security/origin";
import { spaceService } from "@/lib/space/service";
import { addOrganizerSchema } from "@/lib/space/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const organizers = await spaceService.getAllOrganizers();
    return NextResponse.json({ organizers });
  } catch (error) {
    console.error("Admin space organizers GET error:", error);
    return NextResponse.json({ error: "Failed to load organizers." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = addOrganizerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Valid student username is required." },
        { status: 400 }
      );
    }

    const result = await spaceService.addOrganizerByUsername(
      parsed.data.username,
      parsed.data.label || "Admin Assigned"
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      organizer: result.organizer,
      message: `Student @${parsed.data.username} is now a verified FOLE SPACE organizer.`,
    });
  } catch (error: any) {
    console.error("Admin add organizer error:", error);
    return NextResponse.json({ error: error?.message || "Failed to add organizer." }, { status: 500 });
  }
}
