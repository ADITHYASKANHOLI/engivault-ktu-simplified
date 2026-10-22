import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";

export interface StudentAuthContext {
  id: string;
  userId: string;
  username: string;
  displayName?: string;
  display_name?: string;
  isOrganizer: boolean;
}

/**
 * Resolves the authenticated student user from Supabase SSR session cookies
 * Returns null if visitor is a guest or token is invalid.
 */
export async function getAuthenticatedStudent(): Promise<StudentAuthContext | null> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Query user profile
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("username, display_name, role")
      .eq("id", user.id)
      .maybeSingle();

    const username = profile?.username || user.user_metadata?.username || "Student";
    const displayName = profile?.display_name || user.user_metadata?.display_name || username;

    // Check verified organizer table
    const { data: organizer } = await admin
      .from("space_organizers")
      .select("active")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();

    return {
      id: user.id,
      userId: user.id,
      username,
      displayName,
      display_name: displayName,
      isOrganizer: Boolean(organizer?.active),
    };
  } catch {
    return null;
  }
}

/**
 * Checks whether a user ID belongs to an active, verified organizer in the database
 */
export async function isVerifiedOrganizer(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("space_organizers")
      .select("active")
      .eq("user_id", userId)
      .eq("active", true)
      .maybeSingle();
    return Boolean(data?.active);
  } catch {
    return false;
  }
}

/**
 * Verifies that the caller is a verified organizer or space administrator
 */
export async function requireOrganizerOrAdmin(): Promise<{
  authorized: boolean;
  isAdmin: boolean;
  organizerContext?: StudentAuthContext;
}> {
  // Check admin session first
  const adminSession = await getAdminSession();
  if (adminSession) {
    return { authorized: true, isAdmin: true };
  }

  // Check student organizer session
  const student = await getAuthenticatedStudent();
  if (student && student.isOrganizer) {
    return { authorized: true, isAdmin: false, organizerContext: student };
  }

  return { authorized: false, isAdmin: false };
}

/**
 * Verifies whether a given student/organizer user has authority to manage a specific event's desk and check-in.
 * Allowed if the user is the assigned organizer of the event, or has administrative credentials.
 */
export async function canManageEvent(eventId: string, userId: string): Promise<boolean> {
  if (!eventId || !userId) return false;
  try {
    const adminSession = await getAdminSession();
    if (adminSession) return true;

    const admin = createAdminClient();
    const { data: event } = await admin
      .from("space_events")
      .select("organizer_id")
      .eq("id", eventId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!event) return false;
    return event.organizer_id === userId;
  } catch {
    return false;
  }
}
