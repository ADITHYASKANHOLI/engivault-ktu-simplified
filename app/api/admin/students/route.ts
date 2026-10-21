import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isSafeOrigin } from "@/lib/security/origin";
import { adminResetPasswordSchema } from "@/lib/validation/schemas";
import { logActivity } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ students: [], isOffline: true });
  }

  try {
    const supabaseAdmin = createAdminClient();

    // 1. Fetch all student profiles
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false });

    if (pErr) {
      console.error("[ADMIN STUDENTS] Profiles query error:", pErr.message);
      return NextResponse.json({ error: "Failed to load student profiles." }, { status: 500 });
    }

    // 2. Fetch auth users to detect suspension status
    const { data: authUsersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const userMap = new Map((authUsersData?.users || []).map((u) => [u.id, u]));

    const now = new Date();
    const students = (profiles || []).map((p) => {
      const authUser = userMap.get(p.id);
      const isSuspended = Boolean(
        authUser?.banned_until && new Date(authUser.banned_until) > now
      );

      return {
        id: p.id,
        username: p.username || p.display_name || "student",
        createdAt: p.created_at,
        isSuspended,
      };
    });

    return NextResponse.json({ students, isOffline: false });
  } catch (error: any) {
    console.error("[ADMIN STUDENTS] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to retrieve student directory." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Student operations are unavailable in offline mode." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { action, userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Target student ID is required." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Fetch student username for audit trail
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    const studentUsername = targetProfile?.username || "student";

    if (action === "reset_password") {
      const result = adminResetPasswordSchema.safeParse(body);
      if (!result.success) {
        const firstIssue = result.error.issues[0]?.message || "Invalid password format.";
        return NextResponse.json({ error: firstIssue }, { status: 400 });
      }

      const { newPassword } = result.data;

      const { error: resetErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (resetErr) {
        console.error("[ADMIN STUDENTS] Password reset error:", resetErr.message);
        return NextResponse.json({ error: "Failed to reset student password." }, { status: 500 });
      }

      await logActivity("Admin Reset Student Password", "admin", {
        userId,
        username: studentUsername,
      });

      return NextResponse.json({
        success: true,
        message: `Password for @${studentUsername} has been reset successfully.`,
      });
    }

    if (action === "toggle_suspension") {
      const { suspend } = body;
      const banDuration = suspend ? "876000h" : "none"; // 100 years or none

      const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: banDuration,
      });

      if (banErr) {
        console.error("[ADMIN STUDENTS] Suspension toggle error:", banErr.message);
        return NextResponse.json({ error: "Failed to update account status." }, { status: 500 });
      }

      await logActivity("Admin Toggled Student Suspension", "admin", {
        userId,
        username: studentUsername,
        suspended: Boolean(suspend),
      });

      return NextResponse.json({
        success: true,
        message: suspend
          ? `Account for @${studentUsername} has been suspended.`
          : `Account for @${studentUsername} has been reactivated.`,
      });
    }

    if (action === "delete_student") {
      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (delErr) {
        console.error("[ADMIN STUDENTS] Account deletion error:", delErr.message);
        return NextResponse.json({ error: "Failed to delete student account." }, { status: 500 });
      }

      // Ensure profile is purged
      await supabaseAdmin.from("profiles").delete().eq("id", userId);

      await logActivity("Admin Deleted Student Account", "admin", {
        userId,
        username: studentUsername,
      });

      return NextResponse.json({
        success: true,
        message: `Account for @${studentUsername} has been permanently deleted.`,
      });
    }

    return NextResponse.json({ error: "Unknown student management action." }, { status: 400 });
  } catch (error: any) {
    console.error("[ADMIN STUDENTS] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error during student operation." },
      { status: 500 }
    );
  }
}
