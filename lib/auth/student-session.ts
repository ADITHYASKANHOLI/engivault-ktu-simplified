import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export const STUDENT_LOGIN_SESSION_COOKIE = "fole_student_login_session_id";
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type StudentLoginSource = "password" | "signup";

export async function recordStudentLoginSession(
  userId: string,
  loginSource: StudentLoginSource
): Promise<{ sessionId: string; username: string }> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Student session storage is not configured.");
  }

  const cookieStore = await cookies();
  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, username, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "student" || !profile.username) {
    console.error("[STUDENT SESSION] Missing or invalid student profile:", profileError?.message);
    throw new Error("A verified student profile is required to create a login session.");
  }

  // Close the previous browser session record, if this browser already had one.
  const previousSessionId = cookieStore.get(STUDENT_LOGIN_SESSION_COOKIE)?.value;
  if (previousSessionId && UUID_PATTERN.test(previousSessionId)) {
    const { error } = await admin
      .from("student_login_sessions")
      .update({
        ended_at: new Date().toISOString(),
        end_reason: "new_login",
      })
      .eq("id", previousSessionId)
      .eq("user_id", userId)
      .is("ended_at", null);

    if (error) {
      // A stale or deleted record should not prevent creation of the current record.
      console.warn("[STUDENT SESSION] Could not close previous session record:", error.message);
    }
  }

  const sessionId = randomUUID();
  const { error: insertError } = await admin
    .from("student_login_sessions")
    .insert({
      id: sessionId,
      user_id: userId,
      username: profile.username,
      login_source: loginSource,
    });

  if (insertError) {
    console.error("[STUDENT SESSION] Failed to record successful login:", insertError.message);
    throw new Error("The student login session could not be recorded.");
  }

  cookieStore.set(STUDENT_LOGIN_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  return { sessionId, username: profile.username };
}
