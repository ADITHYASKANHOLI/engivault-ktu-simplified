import { NextRequest, NextResponse } from "next/server";
import { verifyCodeSchema } from "@/lib/validation/schemas";
import { verifyAdminAccessCode, setAdminSessionCookie } from "@/lib/auth/session";
import { logActivity } from "@/lib/queries";
import {
  checkDbRateLimit,
  getClientIp,
  hashIdentifier,
  rateLimitResponse,
} from "@/lib/security/db-rate-limit";
import { isSafeOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const ip = getClientIp(request);
  const ipHash = hashIdentifier(`admin-login:ip:${ip}`);

  const rateLimit = await checkDbRateLimit(ipHash, {
    windowSeconds: 15 * 60, // 15 minutes
    maxAttempts: 6,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(
      "Too many authentication attempts. Please try again in 15 minutes.",
      rateLimit.resetInSeconds
    );
  }

  try {
    const body = await request.json();
    const result = verifyCodeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid access code format." },
        { status: 400 }
      );
    }

    const { code } = result.data;

    // Check server administrator authentication configuration
    if (!process.env.ADMIN_ACCESS_CODE && !process.env.ADMIN_ACCESS_CODE_HASH) {
      console.error("ADMIN_ACCESS_CODE environment variable is missing on server.");
      return NextResponse.json(
        { error: "Server administrator authentication configuration is missing." },
        { status: 500 }
      );
    }

    const isValid = verifyAdminAccessCode(code);

    if (!isValid) {
      await logActivity("Failed Admin Login Attempt", "security", { ip });

      return NextResponse.json(
        { error: "Invalid administrator access code." },
        { status: 401 }
      );
    }

    // Set secure HTTP-only session cookie
    await setAdminSessionCookie();

    await logActivity("Administrator Logged In", "auth", { ip });

    return NextResponse.json({
      success: true,
      message: "Authorization successful",
      redirectUrl: "/admin/dashboard",
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification." },
      { status: 500 }
    );
  }
}

