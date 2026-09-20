import { NextRequest, NextResponse } from "next/server";
import { verifyCodeSchema } from "@/lib/validation/schemas";
import { verifyAdminAccessCode, setAdminSessionCookie } from "@/lib/auth/session";
import { logActivity } from "@/lib/queries";

// Simple in-memory rate limiter for the admin access code endpoint
const attemptTracker = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 6;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown-ip";
  const now = Date.now();

  const record = attemptTracker.get(ip);
  if (record) {
    if (now - record.firstAttempt < WINDOW_MS) {
      if (record.count >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many authentication attempts. Please try again in 15 minutes." },
          { status: 429 }
        );
      }
    } else {
      // Window expired, reset
      attemptTracker.set(ip, { count: 0, firstAttempt: now });
    }
  } else {
    attemptTracker.set(ip, { count: 0, firstAttempt: now });
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
    const storedHash = process.env.ADMIN_ACCESS_CODE_HASH;

    if (!storedHash) {
      console.error("ADMIN_ACCESS_CODE_HASH environment variable is missing.");
      return NextResponse.json(
        { error: "Server authentication configuration missing." },
        { status: 500 }
      );
    }

    const isValid = verifyAdminAccessCode(code, storedHash);

    if (!isValid) {
      // Increment failed attempts
      const current = attemptTracker.get(ip) || { count: 0, firstAttempt: now };
      attemptTracker.set(ip, { count: current.count + 1, firstAttempt: current.firstAttempt });

      await logActivity("Failed Admin Login Attempt", "security", { ip });

      return NextResponse.json(
        { error: "Invalid administrator access code." },
        { status: 401 }
      );
    }

    // Clear failed attempts on success
    attemptTracker.delete(ip);

    // Set secure HTTP-only session cookie
    await setAdminSessionCookie();

    await logActivity("Administrator Logged In", "auth", { ip });

    return NextResponse.json({
      success: true,
      message: "Authorization successful",
      redirectUrl: "/admin/dashboard",
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification." },
      { status: 500 }
    );
  }
}
