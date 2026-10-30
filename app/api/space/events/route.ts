import { NextRequest, NextResponse } from "next/server";
import { spaceService } from "@/lib/space/service";
import { getAuthenticatedStudent } from "@/lib/space/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const month = searchParams.get("month") || undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 100);

    const student = await getAuthenticatedStudent();
    const currentUserId = student?.id;

    let events;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      events = currentUserId
        ? await spaceService.getCalendarEvents(month, currentUserId)
        : await spaceService.getCalendarEvents(month);
    } else {
      events = await spaceService.getPublicEvents({ category, limit, currentUserId });
    }

    const cacheHeader = student
      ? "private, no-cache, no-store, max-age=0, must-revalidate"
      : "public, s-maxage=10, stale-while-revalidate=30";

    return NextResponse.json({ events }, {
      headers: {
        "Cache-Control": cacheHeader,
      },
    });
  } catch (error) {
    console.error("Error retrieving space events:", error);
    return NextResponse.json(
      { error: "Unable to retrieve events at this time." },
      { status: 500 }
    );
  }
}
