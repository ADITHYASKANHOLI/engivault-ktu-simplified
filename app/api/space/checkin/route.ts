import { NextRequest, NextResponse } from "next/server";
import { isSafeOrigin } from "@/lib/security/origin";
import { getAuthenticatedStudent } from "@/lib/space/permissions";
import { spaceService } from "@/lib/space/service";
import {
  checkDbRateLimit,
  getClientIp,
  hashIdentifier,
  rateLimitResponse,
} from "@/lib/security/db-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const student = await getAuthenticatedStudent();
  if (!student) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in with your student account." },
      { status: 401 }
    );
  }

  // Rate limit: max 10 checkin attempts per 5 minutes per user
  const ip = getClientIp(request);
  const rateLimitKey = hashIdentifier(`space-checkin:${student.id}:${ip}`);
  const rateLimit = await checkDbRateLimit(rateLimitKey, {
    windowSeconds: 5 * 60,
    maxAttempts: 10,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(
      "Too many check-in requests. Please wait a moment before trying again.",
      rateLimit.resetInSeconds
    );
  }

  try {
    const result = await spaceService.checkinOpenSpace(student.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Unable to check in." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      session: result.session,
      serverNow: result.serverNow,
    });
  } catch (error: any) {
    console.error("Open Space check-in error:", error);
    return NextResponse.json(
      { error: "Internal check-in service error. Please try again." },
      { status: 500 }
    );
  }
}
