import { NextRequest, NextResponse } from "next/server";
import { spaceService } from "@/lib/space/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const month = searchParams.get("month") || undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 100);

    let events;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      events = await spaceService.getCalendarEvents(month);
    } else {
      events = await spaceService.getPublicEvents({ category, limit });
    }

    return NextResponse.json({ events }, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
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
