import { NextResponse } from "next/server";
import { spaceService } from "@/lib/space/service";
import {
  isMissingSpaceSchemaError,
  FOLE_SPACE_SETUP_REQUIRED_MESSAGE,
  FOLE_SPACE_NOT_CONFIGURED_CODE,
} from "@/lib/space/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public endpoint: Returns current space operational status, occupancy vs capacity,
 * active availability state, opening hours, server clock, and upcoming events.
 * No personal data is returned.
 * Returns HTTP 503 if the database schema has not been configured.
 */
export async function GET() {
  try {
    const status = await spaceService.getPublicSpaceStatus();

    if (status.configured === false) {
      return NextResponse.json(
        {
          error: FOLE_SPACE_SETUP_REQUIRED_MESSAGE,
          code: FOLE_SPACE_NOT_CONFIGURED_CODE,
          configured: false,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
      },
    });
  } catch (error: any) {
    if (isMissingSpaceSchemaError(error) || error?.code === FOLE_SPACE_NOT_CONFIGURED_CODE) {
      return NextResponse.json(
        {
          error: FOLE_SPACE_SETUP_REQUIRED_MESSAGE,
          code: FOLE_SPACE_NOT_CONFIGURED_CODE,
          configured: false,
        },
        { status: 503 }
      );
    }

    console.error("Failed to fetch space status:", error);
    return NextResponse.json(
      { error: "Unable to retrieve space status at this time." },
      { status: 500 }
    );
  }
}
