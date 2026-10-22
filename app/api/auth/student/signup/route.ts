import { NextRequest, NextResponse } from "next/server";
import { studentSignupSchema } from "@/lib/validation/schemas";
import { usernameToInternalEmail } from "@/lib/auth/student";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
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

  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Student registration is unavailable in offline mode." },
      { status: 503 }
    );
  }

  const ip = getClientIp(request);
  const ipHash = hashIdentifier(`student-signup:ip:${ip}`);

  const rateLimit = await checkDbRateLimit(ipHash, {
    windowSeconds: 15 * 60, // 15 minutes
    maxAttempts: 5,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(
      "Too many account creation attempts. Please try again later.",
      rateLimit.resetInSeconds
    );
  }

  try {
    const body = await request.json();
    const result = studentSignupSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0]?.message || "Invalid registration data.";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const { username, password } = result.data;
    const cleanUsername = username.toLowerCase().trim();
    const internalEmail = usernameToInternalEmail(cleanUsername);

    const supabaseAdmin = createAdminClient();

    // 1. Check database for existing username in profiles (case-insensitive)
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("username", cleanUsername)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: "Username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    // 2. Create user with Supabase Admin API (service role bypasses email confirmations)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username: cleanUsername,
      },
    });

    if (authError || !authData.user) {
      if (
        authError?.message?.toLowerCase().includes("already registered") ||
        authError?.message?.toLowerCase().includes("unique")
      ) {
        return NextResponse.json(
          { error: "Username is already taken. Please choose another." },
          { status: 409 }
        );
      }

      console.error("[STUDENT SIGNUP] Auth creation error:", authError?.message);
      return NextResponse.json(
        { error: "Unable to create student account. Please try again." },
        { status: 500 }
      );
    }

    // 3. Ensure profile row exists with hardcoded student role and clean username
    const { error: profileSyncError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: authData.user.id,
        display_name: cleanUsername,
        role: "student",
        username: cleanUsername,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileSyncError) {
      console.error("[STUDENT SIGNUP] Profile synchronization failed:", profileSyncError.message);
      return NextResponse.json(
        {
          success: true,
          signedIn: false,
          message: "Your account was created, but the student profile could not be synchronized. Please contact the administrator before retrying.",
          user: { id: authData.user.id, username: cleanUsername },
        },
        { status: 503 }
      );
    }

    // 4. Sign in the new user immediately via SSR client to set secure session cookies
    const ssrClient = await createClient();
    const { data: signInData, error: signInError } = await ssrClient.auth.signInWithPassword({
      email: internalEmail,
      password,
    });

    if (signInError || !signInData.user) {
      console.warn("[STUDENT SIGNUP] Automatic post-signup sign-in failed:", signInError?.message);
      await logActivity("Student Account Created", "auth", {
        username: cleanUsername,
        userId: authData.user.id,
      });
      return NextResponse.json({
        success: true,
        signedIn: false,
        message: "Your account was created. Please sign in with your new username and password.",
        user: { id: authData.user.id, username: cleanUsername },
      });
    }

    try {
      await recordStudentLoginSession(signInData.user.id, "signup");
    } catch (trackingError) {
      console.error("[STUDENT SIGNUP] Session tracking failed:", trackingError);
      try {
        await ssrClient.auth.signOut();
      } catch (signOutError) {
        console.error("[STUDENT SIGNUP] Failed to clear untracked auth session:", signOutError);
      }

      await logActivity("Student Account Created", "auth", {
        username: cleanUsername,
        userId: authData.user.id,
      });

      return NextResponse.json({
        success: true,
        signedIn: false,
        message: "Your account was created, but login tracking is not ready yet. Please sign in again shortly.",
        user: { id: authData.user.id, username: cleanUsername },
      });
    }

    await logActivity("Student Account Created", "auth", {
      username: cleanUsername,
      userId: authData.user.id,
    });

    return NextResponse.json({
      success: true,
      signedIn: true,
      message: "Student account created successfully",
      user: {
        id: authData.user.id,
        username: cleanUsername,
      },
    });
  } catch (error: any) {
    console.error("[STUDENT SIGNUP] Unexpected exception:", error);
    return NextResponse.json(
      { error: "Internal server error during account creation." },
      { status: 500 }
    );
  }
}
