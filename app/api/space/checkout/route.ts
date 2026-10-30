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

  const body = await request.json().catch(() => ({}));
  const sessionId = typeof body?.session_id === "string" ? body.session_id : undefined;

  const ip = getClientIp(request);
  const rateLimitKey = hashIdentifier(`space-checkout:${student.id}:${ip}`);
  const rateLimit = await checkDbRateLimit(rateLimitKey, {
    windowSeconds: 60,
    maxAttempts: 10,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(
      "Too many requests. Please wait a moment.",
      rateLimit.resetInSeconds
    );
  }

  try {
    const result = await spaceService.checkoutOpenSpace(student.id, sessionId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Unable to check out." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      session: result.session,
    });
  } catch (error: any) {
    console.error("Open Space check-out error:", error);
    return NextResponse.json(
      { error: "Internal check-out service error." },
      { status: 500 }
    );
  }
}
