import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Student login history is unavailable because Supabase is not configured." },
      { status: 503 }
    );
  }

  const rawPage = Number(request.nextUrl.searchParams.get("page") ?? "0");
  const page = Number.isFinite(rawPage) ? Math.min(100000, Math.max(0, Math.floor(rawPage))) : 0;
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  try {
    const admin = createAdminClient();
    const { data: rows, error, count } = await admin
      .from("student_login_sessions")
      .select("id, user_id, username, login_at, ended_at, end_reason, login_source", { count: "exact" })
      .order("login_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[ADMIN STUDENT SESSIONS] Query failed:", error.message);
      return NextResponse.json(
        { error: "Failed to load student login history. Confirm the student session setup has been applied." },
        { status: 500 }
      );
    }

    const { count: openRecordCount, error: openError } = await admin
      .from("student_login_sessions")
      .select("id", { count: "exact", head: true })
      .is("ended_at", null);

    if (openError) {
      console.error("[ADMIN STUDENT SESSIONS] Open record count failed:", openError.message);
      return NextResponse.json({ error: "Failed to calculate session history totals." }, { status: 500 });
    }

    const userIds = Array.from(new Set((rows || []).map((row) => row.user_id).filter((id): id is string => Boolean(id))));
    const profileMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);

      if (profileError) {
        console.error("[ADMIN STUDENT SESSIONS] Profile lookup failed:", profileError.message);
        return NextResponse.json({ error: "Failed to resolve student names." }, { status: 500 });
      }

      for (const profile of profiles || []) {
        profileMap.set(profile.id, profile.display_name || "");
      }
    }

    const sessions = (rows || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      displayName: (row.user_id ? profileMap.get(row.user_id) : null) || row.username,
      loginAt: row.login_at,
      endedAt: row.ended_at,
      endReason: row.end_reason,
      loginSource: row.login_source,
      status: row.ended_at ? "ended" : "not_ended",
    }));

    return NextResponse.json(
      {
        sessions,
        totalCount: count ?? 0,
        openRecordCount: openRecordCount ?? 0,
        page,
        pageSize: PAGE_SIZE,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[ADMIN STUDENT SESSIONS] Unexpected error:", error);
    return NextResponse.json({ error: "Unexpected error loading student login history." }, { status: 500 });
  }
}
