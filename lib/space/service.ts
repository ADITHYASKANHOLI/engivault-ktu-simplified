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
import { generateTicketCode, decodeTicketQrPayload } from "./tickets";

export const DEFAULT_SETTINGS: SpaceSettings = {
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
    isOpen: settings.is_open,
    state,
    availabilityState: state,
    capacity: settings.capacity,
    occupancy,
    available_seats: availableSeats,
    availableSeats,
    session_minutes: settings.session_minutes,
    sessionMinutes: settings.session_minutes,
    allow_extension: settings.allow_extension,
    allowExtension: settings.allow_extension,
    extension_window_minutes: settings.extension_window_minutes,
    extensionWindowMinutes: settings.extension_window_minutes,
    opening_hours: settings.opening_hours,
    openingHours: settings.opening_hours,
    next_event: nextEvent
      ? {
          id: nextEvent.id,
          title: nextEvent.title,
          slug: nextEvent.slug,
          starts_at: nextEvent.starts_at,
          ends_at: nextEvent.ends_at,
        }
      : null,
    nextBlockingEvent: nextEvent
      ? {
          id: nextEvent.id,
          title: nextEvent.title,
          slug: nextEvent.slug,
          starts_at: nextEvent.starts_at,
          ends_at: nextEvent.ends_at,
        }
      : null,
    active_session: activeSession,
    activeSession,
    server_now: serverNow,
    serverNow,
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
  const res = data as any;
  return {
    ...res,
    serverNow: res?.server_now || new Date().toISOString(),
  } as { success: boolean; error?: string; session?: SpaceSession; idempotent?: boolean; server_now?: string; serverNow?: string };
}

/**
 * Checks out of an open-space walk-in session via atomic PostgreSQL RPC
 */
export async function checkOutOpenSpace(userId: string, sessionId?: string, source: "self" | "admin_forced" = "self") {
  const admin = createAdminClient();
  let targetSessionId = sessionId;

  if (!targetSessionId && userId) {
    const { data: active } = await admin
      .from("space_sessions")
      .select("id")
      .eq("user_id", userId)
      .is("checked_out_at", null)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (active) {
      targetSessionId = active.id;
    }
  }

  if (!targetSessionId) {
    return { success: false, error: "No active session found to check out." };
  }

  const { data, error } = await admin.rpc("rpc_space_checkout", {
    p_user_id: userId || "00000000-0000-0000-0000-000000000000",
    p_session_id: targetSessionId,
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
export async function extendOpenSpace(userId: string, sessionId?: string) {
  const admin = createAdminClient();
  let targetSessionId = sessionId;

  if (!targetSessionId) {
    const { data: active } = await admin
      .from("space_sessions")
      .select("id")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (active) {
      targetSessionId = active.id;
    }
  }

  if (!targetSessionId) {
    return { success: false, error: "No recent session found to extend." };
  }

  const { data, error } = await admin.rpc("rpc_space_extend", {
    p_user_id: userId,
    p_session_id: targetSessionId,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return data as { success: boolean; error?: string; session?: SpaceSession };
}

/**
 * Registers an attendee for an event with an atomic capacity lock
 */
export async function registerForEvent(eventId: string, userId: string) {
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
export async function cancelEventRegistration(eventId: string, userId: string) {
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
export async function virtualCheckIn(eventId: string, userId: string) {
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
export async function revokeCheckIn(eventId: string, checkinId: string, revokerId: string) {
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
  category?: string;
  limit?: number;
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

  if (options.category) {
    query = query.eq("category", options.category);
  }

  if (options.status === "past") {
    query = query.lt("ends_at", now).order("starts_at", { ascending: false });
  } else if (options.status === "all") {
    query = query.order("starts_at", { ascending: false });
  } else {
    // default upcoming
    query = query.gte("ends_at", now).order("starts_at", { ascending: true });
  }

  if (options.limit && options.limit > 0) {
    query = query.limit(options.limit);
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
export async function getEventBySlug(slug: string, currentUserIdOrPublicOnly?: string | boolean): Promise<SpaceEvent | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const currentUserId = typeof currentUserIdOrPublicOnly === "string" ? currentUserIdOrPublicOnly : undefined;
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
 * Queries single event by ID
 */
export async function getEventById(id: string): Promise<SpaceEvent | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("space_events")
    .select(`
      *,
      organizer:profiles!space_events_organizer_id_fkey(username, display_name)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !event) return null;

  const org = event.organizer as { username?: string; display_name?: string } | null;
  return {
    ...event,
    organizer_username: org?.username || "organizer",
    organizer_name: org?.display_name || org?.username || "Organizer",
  };
}

/**
 * Fetches events for the space calendar in a target month (Asia/Kolkata)
 */
export async function getCalendarEvents(yearOrYearMonth: number | string, maybeMonth?: number): Promise<SpaceEvent[]> {
  if (!isSupabaseAdminConfigured()) return [];

  let year: number;
  let month: number;

  if (typeof yearOrYearMonth === "string") {
    const [y, m] = yearOrYearMonth.split("-");
    year = parseInt(y, 10);
    month = parseInt(m, 10);
  } else {
    year = yearOrYearMonth;
    month = maybeMonth || 1;
  }

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return [];
  }

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
      ...(e as unknown as SpaceEvent),
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
    return {
      activeSession: null,
      pastSessions: [],
      recentSessions: [],
      upcomingTickets: [],
      pastTickets: [],
      attendedEvents: [],
    };
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
    recentSessions: (pastSessions as SpaceSession[]) || [],
    upcomingTickets,
    pastTickets,
    attendedEvents: pastTickets,
  };
}

/**
 * Fetches all registered attendees and check-in statuses for the Organizer Check-In Desk
 */
export async function getEventDeskData(eventId: string, _organizerUserId?: string) {
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
      registration_id: reg.id,
      userId: reg.user_id,
      user_id: reg.user_id,
      username: profile?.username || "student",
      displayName: profile?.display_name || profile?.username || "Student",
      display_name: profile?.display_name || profile?.username || "Student",
      ticketCode: reg.ticket_code,
      ticket_code: reg.ticket_code,
      status: reg.status as "registered" | "cancelled",
      registeredAt: reg.registered_at,
      registered_at: reg.registered_at,
      isCheckedIn: Boolean(activeCheckin),
      checked_in: Boolean(activeCheckin),
      checkinId: activeCheckin?.id || null,
      checkin_id: activeCheckin?.id || null,
      checkedInAt: activeCheckin?.checked_in_at || null,
      checked_in_at: activeCheckin?.checked_in_at || null,
      checkinMethod: (activeCheckin?.method as "qr" | "virtual" | "manual") || null,
      method: (activeCheckin?.method as "qr" | "virtual" | "manual") || null,
    };
  });

  const checkedInCount = participants.filter((p) => p.isCheckedIn && p.status === "registered").length;
  const registeredCount = participants.filter((p) => p.status === "registered").length;

  return {
    event: event as SpaceEvent,
    participants,
    attendees: participants,
    stats: {
      registeredCount,
      checkedInCount,
      capacity: event.capacity,
    },
    counts: {
      registered: registeredCount,
      checkedIn: checkedInCount,
    },
  };
}

/**
 * Gets registration for a user on an event
 */
export async function getRegistration(eventId: string, userId: string): Promise<SpaceEventRegistration | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const admin = createAdminClient();
  const { data: reg } = await admin
    .from("space_event_registrations")
    .select(`
      *,
      checkin:space_event_checkins(checked_in_at, method, revoked_at)
    `)
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("status", "registered")
    .maybeSingle();

  if (!reg) return null;

  const checkins = Array.isArray(reg.checkin) ? reg.checkin : reg.checkin ? [reg.checkin] : [];
  const activeCheckin = checkins.find((c: any) => !c.revoked_at);

  return {
    ...(reg as SpaceEventRegistration),
    checked_in: Boolean(activeCheckin),
    checked_in_at: activeCheckin?.checked_in_at || null,
    checkin_method: activeCheckin?.method || null,
  };
}

/**
 * QR Checkin at desk
 */
export async function checkinQr(eventId: string, scannerId: string, qrPayload: string) {
  const ticketCode = decodeTicketQrPayload(qrPayload) || qrPayload.trim();
  if (!ticketCode) {
    return { success: false, error: "Invalid ticket QR code format. Expected FS1.<ticket_code>" };
  }
  return checkInTicketDesk(ticketCode, eventId, "qr", scannerId);
}

/**
 * Manual checkin at desk
 */
export async function checkinManual(
  eventId: string,
  scannerId: string,
  participantUserId?: string,
  registrationId?: string
) {
  const admin = createAdminClient();
  let ticketCode: string | null = null;

  if (registrationId) {
    const { data: reg } = await admin
      .from("space_event_registrations")
      .select("ticket_code")
      .eq("id", registrationId)
      .eq("event_id", eventId)
      .maybeSingle();
    ticketCode = reg?.ticket_code || null;
  } else if (participantUserId) {
    const { data: reg } = await admin
      .from("space_event_registrations")
      .select("ticket_code")
      .eq("user_id", participantUserId)
      .eq("event_id", eventId)
      .eq("status", "registered")
      .maybeSingle();
    ticketCode = reg?.ticket_code || null;
  }

  if (!ticketCode) {
    return { success: false, error: "Registration not found for manual check-in." };
  }

  return checkInTicketDesk(ticketCode, eventId, "manual", scannerId);
}

/**
 * Organizer: Create event
 */
export async function createEvent(organizerUserId: string, data: any) {
  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("space_events")
    .insert({
      ...data,
      organizer_id: organizerUserId,
      status: "draft",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return event as SpaceEvent;
}

/**
 * Organizer: Update event
 */
export async function updateEvent(eventId: string, organizerUserId: string, data: any) {
  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("space_events")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("organizer_id", organizerUserId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return event as SpaceEvent;
}

/**
 * Organizer: Get my events
 */
export async function getOrganizerEvents(organizerUserId: string) {
  if (!isSupabaseAdminConfigured()) return [];
  const admin = createAdminClient();
  const { data: events, error } = await admin
    .from("space_events")
    .select("*")
    .eq("organizer_id", organizerUserId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !events) return [];

  // Count registrations for each
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

  return events.map((event) => ({
    ...event,
    registered_count: countMap[event.id] || 0,
    seats_remaining: Math.max(0, event.capacity - (countMap[event.id] || 0)),
  }));
}

/**
 * Organizer: Publish event
 */
export async function publishEvent(eventId: string, organizerUserId: string) {
  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("space_events")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("organizer_id", organizerUserId)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, event };
}

/**
 * Organizer: Unpublish event
 */
export async function unpublishEvent(eventId: string, organizerUserId: string) {
  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("space_events")
    .update({
      status: "draft",
    })
    .eq("id", eventId)
    .eq("organizer_id", organizerUserId)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, event };
}

/**
 * Organizer / Admin: Cancel event
 */
export async function cancelEvent(eventId: string, organizerUserId?: string) {
  const admin = createAdminClient();
  let query = admin
    .from("space_events")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (organizerUserId) {
    query = query.eq("organizer_id", organizerUserId);
  }

  const { data: event, error } = await query.select("*").single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Cancel all active registrations
  await admin
    .from("space_event_registrations")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .eq("status", "registered");

  return { success: true, event };
}

/**
 * Organizer: Set event live
 */
export async function setEventLive(eventId: string, organizerUserId: string) {
  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("space_events")
    .update({
      status: "live",
      live_started_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("organizer_id", organizerUserId)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, event };
}

/**
 * Organizer: End event session
 */
export async function endEventSession(eventId: string, organizerUserId: string) {
  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("space_events")
    .update({
      status: "completed",
      live_ended_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("organizer_id", organizerUserId)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, event };
}

/**
 * Admin: Get Space Settings
 */
export async function getSettings(): Promise<SpaceSettings> {
  if (!isSupabaseAdminConfigured()) return DEFAULT_SETTINGS;
  const admin = createAdminClient();
  const { data } = await admin.from("space_settings").select("*").eq("id", 1).maybeSingle();
  return (data as SpaceSettings) || DEFAULT_SETTINGS;
}

/**
 * Admin: Update Space Settings
 */
export async function updateSettings(data: Partial<SpaceSettings>): Promise<SpaceSettings> {
  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("space_settings")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return updated as SpaceSettings;
}

/**
 * Admin: Get all sessions
 */
export async function getAllSessions(limit: number = 50) {
  if (!isSupabaseAdminConfigured()) return [];
  const admin = createAdminClient();
  const { data: sessions } = await admin
    .from("space_sessions")
    .select(`
      *,
      user:profiles!space_sessions_user_id_fkey(username, display_name)
    `)
    .order("started_at", { ascending: false })
    .limit(limit);

  return (sessions || []).map((s: any) => ({
    ...s,
    username: s.user?.username || "student",
    display_name: s.user?.display_name || s.user?.username || "Student",
  }));
}

/**
 * Admin: Force checkout session
 */
export async function forceCheckoutSession(sessionId: string) {
  return checkOutOpenSpace("", sessionId, "admin_forced");
}

/**
 * Admin: Get all organizers
 */
export async function getAllOrganizers() {
  if (!isSupabaseAdminConfigured()) return [];
  const admin = createAdminClient();
  const { data: organizers } = await admin
    .from("space_organizers")
    .select(`
      *,
      profile:profiles!space_organizers_user_id_fkey(username, display_name)
    `)
    .order("added_at", { ascending: false });

  return (organizers || []).map((o: any) => ({
    user_id: o.user_id,
    username: o.profile?.username || "unknown",
    display_name: o.profile?.display_name || o.profile?.username || "Organizer",
    added_by_label: o.added_by_label,
    added_at: o.added_at,
    active: o.active,
  }));
}

/**
 * Admin: Add organizer by student username
 */
export async function addOrganizerByUsername(username: string, addedByLabel: string = "Admin") {
  const cleanUsername = username.toLowerCase().trim();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, display_name")
    .ilike("username", cleanUsername)
    .maybeSingle();

  if (!profile) {
    return { success: false, error: `Student username "@${cleanUsername}" was not found.` };
  }

  const { data: organizer, error } = await admin
    .from("space_organizers")
    .upsert({
      user_id: profile.id,
      added_by_label: addedByLabel,
      added_at: new Date().toISOString(),
      active: true,
      deactivated_at: null,
    })
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    organizer: {
      user_id: profile.id,
      username: profile.username,
      display_name: profile.display_name || profile.username,
      active: true,
      added_at: organizer.added_at,
    },
  };
}

/**
 * Admin: Remove/deactivate organizer
 */
export async function removeOrganizer(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("space_organizers")
    .update({
      active: false,
      deactivated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Admin: Get all events for moderation
 */
export async function getAllEventsForAdmin() {
  if (!isSupabaseAdminConfigured()) return [];
  const admin = createAdminClient();
  const { data: events } = await admin
    .from("space_events")
    .select(`
      *,
      organizer:profiles!space_events_organizer_id_fkey(username, display_name)
    `)
    .is("deleted_at", null)
    .order("starts_at", { ascending: false });

  return (events || []).map((e: any) => ({
    ...e,
    organizer_username: e.organizer?.username || "organizer",
    organizer_name: e.organizer?.display_name || e.organizer?.username || "Organizer",
  }));
}

/**
 * Admin: Moderate event
 */
export async function moderateEvent(eventId: string, action: "unpublish" | "cancel") {
  const admin = createAdminClient();
  if (action === "unpublish") {
    const { data: event, error } = await admin
      .from("space_events")
      .update({ status: "draft" })
      .eq("id", eventId)
      .select("*")
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, event };
  } else if (action === "cancel") {
    return cancelEvent(eventId);
  }
  return { success: false, error: "Invalid moderation action." };
}

/**
 * Admin: Usage reports
 */
export async function getReports(startDate?: string, endDate?: string) {
  if (!isSupabaseAdminConfigured()) {
    return {
      totalSessions: 0,
      avgDurationMinutes: 30,
      peakHour: "14:00 - 15:00",
      totalRegistrations: 0,
      totalCheckins: 0,
      turnoutRate: 0,
      dailySessions: [],
      peakHours: Array.from({ length: 12 }, (_, i) => ({ hour: 8 + i, count: 0 })),
      eventAttendance: [],
      dailyBreakdown: [],
    };
  }

  const admin = createAdminClient();
  const now = new Date();
  const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const start = startDate || defaultStart;
  const end = endDate || now.toISOString();

  const { data: sessions } = await admin
    .from("space_sessions")
    .select("id, user_id, started_at, ended_at, status")
    .gte("started_at", start)
    .lte("started_at", end);

  const { data: registrations } = await admin
    .from("space_event_registrations")
    .select("id, event_id, registered_at, status")
    .gte("registered_at", start)
    .lte("registered_at", end);

  const { data: checkins } = await admin
    .from("space_event_checkins")
    .select("id, event_id, checked_in_at, method")
    .gte("checked_in_at", start)
    .lte("checked_in_at", end);

  const { data: events } = await admin
    .from("space_events")
    .select("id, title, starts_at, capacity")
    .gte("starts_at", start)
    .lte("starts_at", end);

  const totalSessions = sessions?.length || 0;
  const totalRegistrations = registrations?.filter((r) => r.status === "registered").length || 0;
  const totalCheckins = checkins?.length || 0;
  const turnoutRate = totalRegistrations > 0 ? Math.round((totalCheckins / totalRegistrations) * 100) : 0;

  const dailyMap: Record<string, { count: number; users: Set<string>; durations: number[] }> = {};
  const hourMap: Record<number, number> = {};

  (sessions || []).forEach((s) => {
    const day = s.started_at ? s.started_at.slice(0, 10) : "unknown";
    if (!dailyMap[day]) {
      dailyMap[day] = { count: 0, users: new Set(), durations: [] };
    }
    dailyMap[day].count += 1;
    if (s.user_id) dailyMap[day].users.add(s.user_id);
    if (s.ended_at && s.started_at) {
      const dur = Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000);
      if (dur > 0 && dur < 480) dailyMap[day].durations.push(dur);
    }

    if (s.started_at) {
      const hr = new Date(s.started_at).getUTCHours();
      hourMap[hr] = (hourMap[hr] || 0) + 1;
    }
  });

  const dailySessions = Object.entries(dailyMap).map(([date, d]) => ({
    date,
    count: d.count,
    uniqueUsers: d.users.size,
    avgDurationMinutes: d.durations.length > 0 ? Math.round(d.durations.reduce((a, b) => a + b, 0) / d.durations.length) : 30,
  }));

  const peakHours = Object.entries(hourMap)
    .map(([h, c]) => ({ hour: parseInt(h, 10), count: c }))
    .sort((a, b) => a.hour - b.hour);

  const eventAttendance = (events || []).map((evt) => {
    const regCount = (registrations || []).filter((r) => r.event_id === evt.id && r.status === "registered").length;
    const checkinCount = (checkins || []).filter((c) => c.event_id === evt.id).length;
    const rate = regCount > 0 ? Math.round((checkinCount / regCount) * 100) : 0;
    return {
      eventId: evt.id,
      title: evt.title,
      startsAt: evt.starts_at,
      capacity: evt.capacity,
      registered: regCount,
      checkedIn: checkinCount,
      attendanceRate: rate,
    };
  });

  return {
    totalSessions,
    avgDurationMinutes: 30,
    peakHour: peakHours.length > 0 ? `${peakHours[0].hour}:00` : "14:00 - 15:00",
    totalRegistrations,
    totalCheckins,
    turnoutRate,
    dailySessions,
    peakHours,
    eventAttendance,
    dailyBreakdown: [],
  };
}

/**
 * Unified FOLE SPACE service object
 */
export const spaceService = {
  getPublicSpaceStatus: getSpaceStatus,
  getSpaceStatus,
  getActiveSessionForUser: async (userId: string) => {
    if (!isSupabaseAdminConfigured()) return null;
    const admin = createAdminClient();
    const { data } = await admin
      .from("space_sessions")
      .select("*")
      .eq("user_id", userId)
      .is("checked_out_at", null)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    return (data as SpaceSession) || null;
  },
  checkinOpenSpace: checkInOpenSpace,
  checkoutOpenSpace: checkOutOpenSpace,
  extendOpenSpace,
  getRegistration,
  registerForEvent,
  cancelRegistration: cancelEventRegistration,
  checkinVirtual: virtualCheckIn,
  checkinQr,
  checkinManual,
  revokeCheckin: revokeCheckIn,
  publishEvent,
  unpublishEvent,
  cancelEvent,
  setEventLive,
  endEventSession,
  getOrganizerEvents,
  createEvent,
  updateEvent,
  getEventDeskData,
  getMySpaceData,
  getCalendarEvents,
  getPublicEvents,
  getEventBySlug,
  getEventById,
  getSettings,
  updateSettings,
  getAllSessions,
  forceCheckoutSession,
  getAllOrganizers,
  addOrganizerByUsername,
  removeOrganizer,
  getAllEventsForAdmin,
  moderateEvent,
  getReports,
};
