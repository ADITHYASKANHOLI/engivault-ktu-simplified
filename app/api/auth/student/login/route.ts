import { NextRequest, NextResponse } from "next/server";
import { studentLoginSchema } from "@/lib/validation/schemas";
import { usernameToInternalEmail } from "@/lib/auth/student";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { recordStudentLoginSession } from "@/lib/auth/student-session";
import {
  checkDbRateLimit,
  getClientIp,
  hashIdentifier,
  rateLimitResponse,
} from "@/lib/security/db-rate-limit";
import { isSafeOrigin } from "@/lib/security/origin";
import { logActivity } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Student accounts are unavailable in offline mode." },
      { status: 503 }
    );
  }

  const ip = getClientIp(request);
  const ipHash = hashIdentifier(`student-login:ip:${ip}`);

  // 1. IP-level rate limiting (6 attempts / 15 minutes)
  const ipRateLimit = await checkDbRateLimit(ipHash, {
    windowSeconds: 15 * 60,
    maxAttempts: 6,
  });

  if (!ipRateLimit.allowed) {
    return rateLimitResponse(
      "Too many login attempts from this network. Please try again in 15 minutes.",
      ipRateLimit.resetInSeconds
    );
  }

  try {
    const body = await request.json();
    const result = studentLoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid username or password format." },
        { status: 400 }
      );
    }

    const { username, password } = result.data;
    const cleanUsername = username.toLowerCase().trim();

    // 2. Username-level rate limiting (6 attempts / 15 minutes) to mitigate targeted brute-force
    const userHash = hashIdentifier(`student-login:user:${cleanUsername}`);
    const userRateLimit = await checkDbRateLimit(userHash, {
      windowSeconds: 15 * 60,
      maxAttempts: 6,
    });

    if (!userRateLimit.allowed) {
      return rateLimitResponse(
        "Too many attempts for this account. Please try again in 15 minutes.",
        userRateLimit.resetInSeconds
      );
    }

    const internalEmail = usernameToInternalEmail(cleanUsername);
    const ssrClient = await createClient();

    const { data: authData, error: authError } = await ssrClient.auth.signInWithPassword({
      email: internalEmail,
      password,
    });

    if (authError || !authData.user) {
      // Uniform generic response to prevent user enumeration
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    try {
      await recordStudentLoginSession(authData.user.id, "password");
    } catch (trackingError) {
      console.error("[STUDENT LOGIN] Session tracking failed:", trackingError);
      // Fail closed: do not leave an authenticated session that was not recorded.
      try {
        await ssrClient.auth.signOut();
      } catch (signOutError) {
        console.error("[STUDENT LOGIN] Failed to clear untracked auth session:", signOutError);
      }
      return NextResponse.json(
        { error: "Login is temporarily unavailable because the student session could not be recorded. Please try again shortly." },
        { status: 503 }
      );
    }

    await logActivity("Student Logged In", "auth", {
      username: cleanUsername,
      userId: authData.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: authData.user.id,
        username: authData.user.user_metadata?.username || cleanUsername,
      },
    });
  } catch (error: any) {
    console.error("[STUDENT LOGIN] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error during authentication." },
      { status: 500 }
    );
  }
}
