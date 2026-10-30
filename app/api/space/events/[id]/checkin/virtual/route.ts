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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const { id: eventId } = await params;
  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
  }

  const student = await getAuthenticatedStudent();
  if (!student) {
    return NextResponse.json(
      { error: "Authentication required to check in." },
      { status: 401 }
    );
  }

  const ip = getClientIp(request);
  const rateLimitKey = hashIdentifier(`virtual-checkin:${student.id}:${eventId}:${ip}`);
  const rateLimit = await checkDbRateLimit(rateLimitKey, {
    windowSeconds: 60,
    maxAttempts: 5,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(
      "Too many check-in attempts. Please wait.",
      rateLimit.resetInSeconds
    );
  }

  try {
    const result = await spaceService.checkinVirtual(eventId, student.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Virtual check-in failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      checkin: result.checkin,
      message: "Checked in successfully! Welcome to the event.",
    });
  } catch (error: any) {
    console.error("Virtual checkin route error:", error);
    return NextResponse.json(
      { error: "Internal check-in service error." },
      { status: 500 }
    );
  }
}
