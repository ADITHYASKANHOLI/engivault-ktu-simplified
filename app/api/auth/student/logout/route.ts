import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isSafeOrigin } from "@/lib/security/origin";
import { STUDENT_LOGIN_SESSION_COOKIE } from "@/lib/auth/student-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = request.cookies.get(STUDENT_LOGIN_SESSION_COOKIE)?.value;

      // Close only the session belonging to the currently authenticated user.
      if (user && sessionId && isSupabaseAdminConfigured()) {
        const admin = createAdminClient();
        const { error } = await admin
          .from("student_login_sessions")
          .update({
            ended_at: new Date().toISOString(),
            end_reason: "logout",
          })
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .is("ended_at", null);

        if (error) {
          console.error("[STUDENT LOGOUT] Could not close login history record:", error.message);
        }
      }

      await supabase.auth.signOut();
    } catch (err: any) {
      // Logout must still complete even if history storage is temporarily unavailable.
      console.warn("[STUDENT LOGOUT] Error signing out:", err?.message);
    }
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.set(STUDENT_LOGIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
