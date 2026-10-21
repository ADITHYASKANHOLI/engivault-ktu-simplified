export interface OpeningHoursDay {
  open: string;  // "09:00"
  close: string; // "18:00"
  closed: boolean;
}

export type OpeningHoursWeek = Record<string, OpeningHoursDay>;

export interface SpaceSettings {
  id: number;
  name: string;
  is_open: boolean;
  capacity: number;
  session_minutes: number;
  opening_hours: OpeningHoursWeek;
  timezone: string;
  allow_extension: boolean;
  max_sessions_per_day: number;
  extension_window_minutes: number;
  min_session_minutes: number;
  event_checkin_early_minutes: number;
  event_checkin_grace_minutes: number;
  updated_at: string;
}

export type SessionStatus = "active" | "completed" | "expired" | "cancelled";
export type SessionSource = "self" | "admin_forced";

export interface SpaceSession {
  id: string;
  user_id: string;
  started_at: string;
  expires_at: string;
  ended_at: string | null;
  checked_out_at: string | null;
  status: SessionStatus;
  source: SessionSource;
  extension_of: string | null;
  created_at: string;
  username?: string;
  display_name?: string;
  user?: {
    username?: string;
    display_name?: string;
  };
}

export interface SpaceOrganizer {
  user_id: string;
  added_by_label: string;
  added_at: string;
  active: boolean;
  deactivated_at?: string | null;
  username?: string;
  display_name?: string;
  student?: {
    username?: string;
    display_name?: string;
  };
}

export type EventStatus = "draft" | "published" | "live" | "completed" | "cancelled";

export interface SpaceEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  organizer_id: string;
  category: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  capacity: number;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  status: EventStatus;
  live_started_at: string | null;
  live_ended_at: string | null;
  blocks_open_space: boolean;
  flyer_path: string | null;
  flyer_mime: string | null;
  flyer_width: number | null;
  flyer_height: number | null;
  flyer_bytes: number | null;
  allow_virtual_checkin: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  cancelled_at: string | null;
  deleted_at: string | null;
  // Computed / joined fields
  organizer_username?: string;
  organizer_name?: string;
  organizer?: {
    username?: string;
    display_name?: string;
  };
  attendee_count?: number;
  registered_count?: number;
  seats_remaining?: number;
  is_registered?: boolean;
  my_registration?: SpaceEventRegistration | null;
}

export type RegistrationStatus = "registered" | "cancelled";

export interface SpaceEventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  ticket_code: string;
  registered_at: string;
  cancelled_at: string | null;
  checked_in?: boolean;
  checked_in_at?: string | null;
  checkin_method?: "qr" | "virtual" | "manual" | null;
  checkin?: {
    checked_in_at?: string | null;
    method?: string | null;
  } | null;
  event?: Partial<SpaceEvent>;
}

export type CheckinMethod = "qr" | "virtual" | "manual";

export interface SpaceEventCheckin {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  checked_in_at: string;
  method: CheckinMethod;
  checked_in_by: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  username?: string;
  display_name?: string;
  ticket_code?: string;
}

export type SpaceAvailabilityState = "available" | "occupied" | "unavailable";

export interface SpaceStatus {
  is_open: boolean;
  isOpen?: boolean;
  state: SpaceAvailabilityState;
  availabilityState?: SpaceAvailabilityState;
  capacity: number;
  occupancy: number;
  available_seats: number;
  availableSeats?: number;
  session_minutes: number;
  sessionMinutes?: number;
  allow_extension: boolean;
  allowExtension?: boolean;
  extension_window_minutes: number;
  extensionWindowMinutes?: number;
  opening_hours: OpeningHoursWeek;
  openingHours?: OpeningHoursWeek;
  next_event: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    slug: string;
  } | null;
  nextBlockingEvent?: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    slug: string;
  } | null;
  active_session: SpaceSession | null;
  activeSession?: SpaceSession | null;
  server_now: string;
  serverNow?: string;
}

export type SpaceStatusResponse = SpaceStatus;

export interface SpaceDailySessionMetric {
  date: string;
  count: number;
  uniqueUsers: number;
  avgDurationMinutes: number;
}

export interface SpacePeakHourMetric {
  hour: number;
  count: number;
}

export interface SpaceEventAttendanceMetric {
  eventId: string;
  title: string;
  startsAt: string;
  capacity: number;
  registered: number;
  checkedIn: number;
  attendanceRate: number;
}

export interface SpaceUsageReport {
  totalSessions: number;
  avgDurationMinutes: number;
  peakHour: string;
  totalRegistrations: number;
  totalCheckins: number;
  turnoutRate: number;
  dailySessions: SpaceDailySessionMetric[];
  peakHours: SpacePeakHourMetric[];
  eventAttendance: SpaceEventAttendanceMetric[];
  dailyBreakdown?: Array<{ date: string; sessions: number; registrations: number }>;
}

export interface SpaceEventAttendee {
  registrationId: string;
  registration_id?: string;
  userId: string;
  user_id?: string;
  username: string;
  displayName: string;
  display_name?: string;
  ticketCode: string;
  ticket_code?: string;
  status: "registered" | "cancelled";
  registeredAt: string;
  registered_at?: string;
  isCheckedIn: boolean;
  checked_in?: boolean;
  checkinId: string | null;
  checkin_id?: string | null;
  checkedInAt: string | null;
  checked_in_at?: string | null;
  checkinMethod: CheckinMethod | null;
  method?: CheckinMethod | null;
}
