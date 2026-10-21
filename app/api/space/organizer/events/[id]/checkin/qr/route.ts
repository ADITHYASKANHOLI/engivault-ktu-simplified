import { NextRequest, NextResponse } from "next/server";
import { isSafeOrigin } from "@/lib/security/origin";
import { getAuthenticatedStudent, isVerifiedOrganizer } from "@/lib/space/permissions";
import { spaceService } from "@/lib/space/service";
import { deskQrScanSchema } from "@/lib/space/validation";
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
  const student = await getAuthenticatedStudent();
  if (!student) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const isOrganizer = await isVerifiedOrganizer(student.id);
  if (!isOrganizer) {
    return NextResponse.json({ error: "Organizer access required." }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateLimitKey = hashIdentifier(`desk-scan:${student.id}:${eventId}:${ip}`);
  const rateLimit = await checkDbRateLimit(rateLimitKey, {
    windowSeconds: 60,
    maxAttempts: 30, // fast scanning allowed for desk organizer
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(
      "Scanning rate limit reached. Please wait a moment.",
      rateLimit.resetInSeconds
    );
  }

  try {
    const body = await request.json();
    const parsed = deskQrScanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid QR code payload format." }, { status: 400 });
    }

    const result = await spaceService.checkinQr(eventId, student.id, parsed.data.qr_payload);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      checkin: result.checkin,
      message: "Check-in confirmed!",
    });
  } catch (error: any) {
    console.error("Desk QR check-in error:", error);
    return NextResponse.json({ error: error?.message || "Check-in failed." }, { status: 500 });
  }
}
