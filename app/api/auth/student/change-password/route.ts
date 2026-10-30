import { NextRequest, NextResponse } from "next/server";
import { studentChangePasswordSchema } from "@/lib/validation/schemas";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
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
      { error: "Account operations are unavailable in offline mode." },
      { status: 503 }
    );
  }

  const ip = getClientIp(request);
  const ipHash = hashIdentifier(`change-password:ip:${ip}`);

  const rateLimit = await checkDbRateLimit(ipHash, {
    windowSeconds: 15 * 60,
    maxAttempts: 6,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(
      "Too many password change attempts. Please try again in 15 minutes.",
      rateLimit.resetInSeconds
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json(
        { error: "Authentication required to change password." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = studentChangePasswordSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0]?.message || "Invalid password data.";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const { currentPassword, newPassword } = result.data;
    const username = user.user_metadata?.username || user.email.split("@")[0];

    // 1. Re-verify the current password to ensure session ownership
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json(
        { error: "Current password does not match." },
        { status: 401 }
      );
    }

    // 2. Apply new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("[CHANGE PASSWORD] Update error:", updateError.message);
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500 }
      );
    }

    await logActivity("Student Changed Password", "auth", {
      username,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error: any) {
    console.error("[CHANGE PASSWORD] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error during password change." },
      { status: 500 }
    );
  }
}
