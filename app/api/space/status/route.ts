import { NextResponse } from "next/server";
import { spaceService } from "@/lib/space/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public endpoint: Returns current space operational status, occupancy vs capacity,
 * active availability state, opening hours, server clock, and upcoming events.
 * No personal data is returned.
 */
export async function GET() {
  try {
    const status = await spaceService.getPublicSpaceStatus();
    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
      },
    });
  } catch (error) {
    console.error("Failed to fetch space status:", error);
    return NextResponse.json(
      { error: "Unable to retrieve space status at this time." },
      { status: 500 }
    );
  }
}
