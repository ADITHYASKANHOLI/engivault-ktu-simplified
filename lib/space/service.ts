import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  SpaceSettings,
  SpaceStatus,
  SpaceSession,
  SpaceEvent,
  SpaceEventRegistration,
  SpaceEventCheckin,
  SpaceAvailabilityState,
} from "./types";
import { isWithinOpeningHours } from "./time";
import { generateTicketCode } from "./tickets";

const DEFAULT_SETTINGS: SpaceSettings = {
  id: 1,
  name: "FOLE Open Space",
  is_open: false,
  capacity: 10,
  session_minutes: 30,
  opening_hours: {
    monday: { open: "09:00", close: "18:00", closed: false },
    tuesday: { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday: { open: "09:00", close: "18:00", closed: false },
    friday: { open: "09:00", close: "18:00", closed: false },
    saturday: { open: "10:00", close: "16:00", closed: false },
    sunday: { open: "10:00", close: "16:00", closed: true },
  },
  timezone: "Asia/Kolkata",
  allow_extension: true,
  max_sessions_per_day: 4,
  extension_window_minutes: 10,
  min_session_minutes: 15,
  event_checkin_early_minutes: 30,
  event_checkin_grace_minutes: 30,
  updated_at: new Date().toISOString(),
};

/**
 * Retrieves the live status of the FOLE Open Space
 */
export async function getSpaceStatus(currentUserId?: string): Promise<SpaceStatus> {
  const serverNow = new Date().toISOString();

  if (!isSupabaseAdminConfigured()) {
    return {
      is_open: false,
      state: "unavailable",
      capacity: 10,
      occupancy: 0,
      available_seats: 10,
      session_minutes: 30,
      allow_extension: false,
      extension_window_minutes: 10,
      opening_hours: DEFAULT_SETTINGS.opening_hours,
      next_event: null,
      active_session: null,
      server_now: serverNow,
    };
  }

  const admin = createAdminClient();

  // 1. Fetch space settings
  const { data: settingsData } = await admin
    .from("space_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const settings: SpaceSettings = (settingsData as SpaceSettings) || DEFAULT_SETTINGS;

  // 2. Query active sessions to count occupancy
  const { count: occupancyCount } = await admin
    .from("space_sessions")
    .select("id", { count: "exact", head: true })
    .is("checked_out_at", null)
    .eq("status", "active")
    .gt("expires_at", serverNow);

  const occupancy = occupancyCount ?? 0;
  const availableSeats = Math.max(0, settings.capacity - occupancy);

  // 3. Fetch next or currently live blocking event
  const { data: nextEvents } = await admin
    .from("space_events")
    .select("id, title, slug, starts_at, ends_at, status")
    .eq("blocks_open_space", true)
    .in("status", ["published", "live"])
    .is("deleted_at", null)
    .gt("ends_at", serverNow)
    .order("starts_at", { ascending: true })
    .limit(1);

  const nextEvent = nextEvents?.[0] || null;

  // 4. Determine availability state
  const hoursCheck = isWithinOpeningHours(settings.opening_hours, serverNow);
  let state: SpaceAvailabilityState = "available";

  if (!settings.is_open || !hoursCheck.isOpen) {
    state = "unavailable";
  } else if (nextEvent && nextEvent.status === "live" && new Date(nextEvent.starts_at) <= new Date(serverNow)) {
    state = "unavailable";
  } else if (occupancy >= settings.capacity) {
    state = "occupied";
  }

  // 5. Fetch current user active session if logged in
  let activeSession: SpaceSession | null = null;
  if (currentUserId) {
    const { data: session } = await admin
      .from("space_sessions")
      .select("*")
      .eq("user_id", currentUserId)
      .is("checked_out_at", null)
      .eq("status", "active")
      .gt("expires_at", serverNow)
      .maybeSingle();

    if (session) {
      activeSession = session as SpaceSession;
    }
  }

  return {
    is_open: settings.is_open,
    state,
    capacity: settings.capacity,
    occupancy,
    available_seats: availableSeats,
    session_minutes: settings.session_minutes,
    allow_extension: settings.allow_extension,
    extension_window_minutes: settings.extension_window_minutes,
    opening_hours: settings.opening_hours,
    next_event: nextEvent
      ? {
          id: nextEvent.id,
          title: nextEvent.title,
          slug: nextEvent.slug,
          starts_at: nextEvent.starts_at,
          ends_at: nextEvent.ends_at,
        }
      : null,
    active_session: activeSession,
    server_now: serverNow,
  };
}

/**
 * Initiates an open-space walk-in session via atomic PostgreSQL RPC
 */
export async function checkInOpenSpace(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("rpc_space_checkin", {
    p_user_id: userId,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return data as { success: boolean; error?: string; session?: SpaceSession; idempotent?: boolean; server_now?: string };
}

/**
 * Checks out of an open-space walk-in session via atomic PostgreSQL RPC
 */
export async function checkOutOpenSpace(userId: string, sessionId: string, source: "self" | "admin_forced" = "self") {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("rpc_space_checkout", {
    p_user_id: userId,
    p_session_id: sessionId,
    p_source: source,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return data as { success: boolean; error?: string; session?: SpaceSession };
}

/**
 * Extends an open-space walk-in session via atomic PostgreSQL RPC
 */
export async function extendOpenSpace(userId: string, sessionId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("rpc_space_extend", {
    p_user_id: userId,
    p_session_id: sessionId,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return data as { success: boolean; error?: string; session?: SpaceSession };
}

/**
 * Registers an attendee for an event with an atomic capacity lock
 */
export async function registerForEvent(userId: string, eventId: string) {
  const ticketCode = generateTicketCode();
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("rpc_space_register_event", {
    p_user_id: userId,
    p_event_id: eventId,
    p_ticket_code: ticketCode,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return data as { success: boolean; error?: string; registration?: SpaceEventRegistration; idempotent?: boolean };
}

/**
 * Cancels an attendee's event registration
 */
export async function cancelEventRegistration(userId: string, eventId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("rpc_space_cancel_registration", {
    p_user_id: userId,
    p_event_id: eventId,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return data as { success: boolean; error?: string };
}

/**
 * Verifies a ticket QR code at the organizer desk
 */
export async function checkInTicketDesk(
  ticketCode: string,
  expectedEventId: string,
  method: "qr" | "manual",
  scannerId: string
) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("rpc_space_checkin_ticket", {
    p_ticket_code: ticketCode,
    p_expected_event_id: expectedEventId,
    p_method: method,
    p_scanner_id: scannerId,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return data as {
    success: boolean;
    error?: string;
    code?: string;
    checkin?: SpaceEventCheckin;
    attendee?: { id: string; username: string; display_name: string };
  };
}

/**
 * Virtual check-in initiated by registered attendee
 */
export async function virtualCheckIn(userId: string, eventId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("rpc_space_virtual_checkin", {
    p_user_id: userId,
    p_event_id: eventId,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return data as { success: boolean; error?: string; checkin?: SpaceEventCheckin; already_checked_in?: boolean };
}

/**
 * Revokes an event check-in (undo action at desk)
 */
export async function revokeCheckIn(checkinId: string, revokerId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("rpc_space_revoke_checkin", {
    p_checkin_id: checkinId,
    p_revoker_id: revokerId,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return data as { success: boolean; error?: string; checkin?: SpaceEventCheckin };
}

/**
 * Queries events for the public catalogue
 */
export async function getPublicEvents(options: {
  status?: "upcoming" | "past" | "all";
  currentUserId?: string;
} = {}): Promise<SpaceEvent[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const admin = createAdminClient();
  const now = new Date().toISOString();

  let query = admin
    .from("space_events")
    .select(`
      *,
      organizer:profiles!space_events_organizer_id_fkey(username, display_name)
    `)
    .in("status", ["published", "live", "completed"])
    .is("deleted_at", null);

  if (options.status === "upcoming") {
    query = query.gte("ends_at", now).order("starts_at", { ascending: true });
  } else if (options.status === "past") {
    query = query.lt("ends_at", now).order("starts_at", { ascending: false });
  } else {
    query = query.order("starts_at", { ascending: false });
  }

  const { data: events, error } = await query;
  if (error || !events) return [];

  // Count registrations for each event
  const eventIds = events.map((e) => e.id);
  const { data: counts } = await admin
    .from("space_event_registrations")
    .select("event_id")
    .in("event_id", eventIds)
    .eq("status", "registered");

  const countMap: Record<string, number> = {};
  counts?.forEach((r) => {
    countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
  });

  // Current user registrations
  const userRegMap: Record<string, SpaceEventRegistration> = {};
  if (options.currentUserId) {
    const { data: userRegs } = await admin
      .from("space_event_registrations")
      .select("*")
      .in("event_id", eventIds)
      .eq("user_id", options.currentUserId)
      .eq("status", "registered");

    userRegs?.forEach((reg) => {
      userRegMap[reg.event_id] = reg as SpaceEventRegistration;
    });
  }

  return events.map((event) => {
    const regCount = countMap[event.id] || 0;
    const org = event.organizer as { username?: string; display_name?: string } | null;
    return {
      ...event,
      organizer_username: org?.username || "organizer",
      organizer_name: org?.display_name || org?.username || "Organizer",
      registered_count: regCount,
      seats_remaining: Math.max(0, event.capacity - regCount),
      is_registered: Boolean(userRegMap[event.id]),
      my_registration: userRegMap[event.id] || null,
    };
  });
}

/**
 * Queries single event by slug with attendee details and full flyer metadata
 */
export async function getEventBySlug(slug: string, currentUserId?: string): Promise<SpaceEvent | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("space_events")
    .select(`
      *,
      organizer:profiles!space_events_organizer_id_fkey(username, display_name)
    `)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !event) return null;

  // Registered count
  const { count: regCount } = await admin
    .from("space_event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("status", "registered");

  // User registration & check-in
  let myRegistration: SpaceEventRegistration | null = null;
  if (currentUserId) {
    const { data: reg } = await admin
      .from("space_event_registrations")
      .select("*")
      .eq("event_id", event.id)
      .eq("user_id", currentUserId)
      .eq("status", "registered")
      .maybeSingle();

    if (reg) {
      // Check if checked in
      const { data: checkin } = await admin
        .from("space_event_checkins")
        .select("*")
        .eq("registration_id", reg.id)
        .is("revoked_at", null)
        .maybeSingle();

      myRegistration = {
        ...(reg as SpaceEventRegistration),
        checked_in: Boolean(checkin),
        checked_in_at: checkin?.checked_in_at || null,
        checkin_method: checkin?.method || null,
      };
    }
  }

  const org = event.organizer as { username?: string; display_name?: string } | null;

  return {
    ...event,
    organizer_username: org?.username || "organizer",
    organizer_name: org?.display_name || org?.username || "Organizer",
    registered_count: regCount ?? 0,
    seats_remaining: Math.max(0, event.capacity - (regCount ?? 0)),
    is_registered: Boolean(myRegistration),
    my_registration: myRegistration,
  };
}

/**
 * Fetches events for the space calendar in a target month (Asia/Kolkata)
 */
export async function getCalendarEvents(yearMonth: string): Promise<SpaceEvent[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const [yearStr, monthStr] = yearMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return [];
  }

  // Calculate start and end of target month
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString();
  const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString();

  const admin = createAdminClient();
  const { data: events, error } = await admin
    .from("space_events")
    .select(`
      id, slug, title, starts_at, ends_at, category, status, capacity, blocks_open_space,
      organizer:profiles!space_events_organizer_id_fkey(username, display_name)
    `)
    .in("status", ["published", "live", "completed"])
    .is("deleted_at", null)
    .gte("starts_at", startDate)
    .lt("starts_at", endDate)
    .order("starts_at", { ascending: true });

  if (error || !events) return [];

  return events.map((e) => {
    const org = e.organizer as { username?: string; display_name?: string } | null;
    return {
      ...(e as SpaceEvent),
      organizer_username: org?.username || "organizer",
      organizer_name: org?.display_name || org?.username || "Organizer",
    };
  });
}

/**
 * Fetches user's active/past sessions and tickets for /fole-space/my
 */
export async function getMySpaceData(userId: string) {
  if (!isSupabaseAdminConfigured()) {
    return { activeSession: null, pastSessions: [], upcomingTickets: [], pastTickets: [] };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Active session
  const { data: activeSession } = await admin
    .from("space_sessions")
    .select("*")
    .eq("user_id", userId)
    .is("checked_out_at", null)
    .eq("status", "active")
    .gt("expires_at", now)
    .maybeSingle();

  // Past sessions
  const { data: pastSessions } = await admin
    .from("space_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(15);

  // Registrations with joined event and checkin
  const { data: registrations } = await admin
    .from("space_event_registrations")
    .select(`
      *,
      event:space_events(*),
      checkin:space_event_checkins(checked_in_at, method, revoked_at)
    `)
    .eq("user_id", userId)
    .order("registered_at", { ascending: false });

  const upcomingTickets: SpaceEventRegistration[] = [];
  const pastTickets: SpaceEventRegistration[] = [];

  registrations?.forEach((reg: any) => {
    const event = reg.event;
    if (!event || event.deleted_at) return;

    const checkins = Array.isArray(reg.checkin) ? reg.checkin : reg.checkin ? [reg.checkin] : [];
    const activeCheckin = checkins.find((c: any) => !c.revoked_at);

    const formatted: SpaceEventRegistration = {
      id: reg.id,
      event_id: reg.event_id,
      user_id: reg.user_id,
      status: reg.status,
      ticket_code: reg.ticket_code,
      registered_at: reg.registered_at,
      cancelled_at: reg.cancelled_at,
      checked_in: Boolean(activeCheckin),
      checked_in_at: activeCheckin?.checked_in_at || null,
      checkin_method: activeCheckin?.method || null,
      event,
    };

    if (new Date(event.ends_at) > new Date(now) && reg.status === "registered") {
      upcomingTickets.push(formatted);
    } else {
      pastTickets.push(formatted);
    }
  });

  return {
    activeSession: (activeSession as SpaceSession) || null,
    pastSessions: (pastSessions as SpaceSession[]) || [],
    upcomingTickets,
    pastTickets,
  };
}

/**
 * Fetches all registered attendees and check-in statuses for the Organizer Check-In Desk
 */
export async function getEventDeskData(eventId: string) {
  const admin = createAdminClient();

  const { data: event } = await admin
    .from("space_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return null;

  // Fetch all registrations
  const { data: registrations } = await admin
    .from("space_event_registrations")
    .select(`
      id, event_id, user_id, status, ticket_code, registered_at, cancelled_at,
      attendee:profiles!space_event_registrations_user_id_fkey(username, display_name),
      checkin:space_event_checkins(id, checked_in_at, method, revoked_at)
    `)
    .eq("event_id", eventId)
    .order("registered_at", { ascending: true });

  const participants = (registrations || []).map((reg: any) => {
    const checkins = Array.isArray(reg.checkin) ? reg.checkin : reg.checkin ? [reg.checkin] : [];
    const activeCheckin = checkins.find((c: any) => !c.revoked_at);
    const profile = reg.attendee as { username?: string; display_name?: string } | null;

    return {
      registrationId: reg.id,
      userId: reg.user_id,
      username: profile?.username || "student",
      displayName: profile?.display_name || profile?.username || "Student",
      ticketCode: reg.ticket_code,
      status: reg.status as "registered" | "cancelled",
      registeredAt: reg.registered_at,
      isCheckedIn: Boolean(activeCheckin),
      checkinId: activeCheckin?.id || null,
      checkedInAt: activeCheckin?.checked_in_at || null,
      checkinMethod: (activeCheckin?.method as "qr" | "virtual" | "manual") || null,
    };
  });

  const checkedInCount = participants.filter((p) => p.isCheckedIn && p.status === "registered").length;
  const registeredCount = participants.filter((p) => p.status === "registered").length;

  return {
    event: event as SpaceEvent,
    participants,
    stats: {
      registeredCount,
      checkedInCount,
      capacity: event.capacity,
    },
  };
}
