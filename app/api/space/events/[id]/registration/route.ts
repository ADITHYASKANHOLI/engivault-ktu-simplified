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

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: eventId } = await params;
  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
  }

  const student = await getAuthenticatedStudent();
  if (!student) {
    return NextResponse.json({ isRegistered: false, registration: null });
  }

  try {
    const registration = await spaceService.getRegistration(eventId, student.id);
    return NextResponse.json({
      isRegistered: !!registration && registration.status === "registered",
      registration,
    });
  } catch (error) {
    console.error("Error checking registration status:", error);
    return NextResponse.json(
      { error: "Unable to check registration." },
      { status: 500 }
    );
  }
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
      { error: "Please log in with your student account to register for events." },
      { status: 401 }
    );
  }

  const ip = getClientIp(request);
  const rateLimitKey = hashIdentifier(`event-register:${student.id}:${eventId}:${ip}`);
  const rateLimit = await checkDbRateLimit(rateLimitKey, {
    windowSeconds: 60,
    maxAttempts: 5,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(
      "Too many registration requests. Please wait a moment.",
      rateLimit.resetInSeconds
    );
  }

  try {
    const result = await spaceService.registerForEvent(eventId, student.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Registration failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      registration: result.registration,
    });
  } catch (error: any) {
    console.error("Event registration error:", error);
    return NextResponse.json(
      { error: "Internal registration service error." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const result = await spaceService.cancelRegistration(eventId, student.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Cancellation failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Registration cancelled successfully.",
    });
  } catch (error: any) {
    console.error("Event cancellation error:", error);
    return NextResponse.json(
      { error: "Internal cancellation service error." },
      { status: 500 }
    );
  }
}
