import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const openingHoursDaySchema = z.object({
  open: z.string().regex(timePattern, "Time must be in HH:MM format (24h)"),
  close: z.string().regex(timePattern, "Time must be in HH:MM format (24h)"),
  closed: z.boolean(),
});

export const spaceSettingsUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  is_open: z.boolean().optional(),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1").max(500, "Capacity cannot exceed 500").optional(),
  session_minutes: z.coerce.number().int().min(5, "Session must be at least 5 minutes").max(240, "Session cannot exceed 4 hours").optional(),
  opening_hours: z.record(z.string(), openingHoursDaySchema).optional(),
  allow_extension: z.boolean().optional(),
  max_sessions_per_day: z.coerce.number().int().min(1).max(20).optional(),
  extension_window_minutes: z.coerce.number().int().min(1).max(60).optional(),
  min_session_minutes: z.coerce.number().int().min(5).max(60).optional(),
  event_checkin_early_minutes: z.coerce.number().int().min(0).max(180).optional(),
  event_checkin_grace_minutes: z.coerce.number().int().min(0).max(180).optional(),
});

export const spaceEventBaseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters").trim(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(80, "Slug cannot exceed 80 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description too long").trim(),
  category: z.string().min(2).max(50).default("Workshop"),
  starts_at: z.string().datetime({ message: "Start time must be a valid ISO datetime" }),
  ends_at: z.string().datetime({ message: "End time must be a valid ISO datetime" }),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1").max(1000, "Capacity cannot exceed 1000"),
  registration_opens_at: z.string().datetime().nullable().optional(),
  registration_closes_at: z.string().datetime().nullable().optional(),
  blocks_open_space: z.boolean().default(true),
  allow_virtual_checkin: z.boolean().default(true),
  flyer_path: z.string().nullable().optional(),
  flyer_mime: z.string().nullable().optional(),
  flyer_width: z.number().int().positive().nullable().optional(),
  flyer_height: z.number().int().positive().nullable().optional(),
  flyer_bytes: z.number().int().positive().nullable().optional(),
});

export const spaceEventCreateSchema = spaceEventBaseSchema.refine(
  (data) => new Date(data.ends_at) > new Date(data.starts_at),
  {
    message: "Event end time must be after the start time",
    path: ["ends_at"],
  }
);

export const spaceEventUpdateSchema = spaceEventBaseSchema.partial().refine(
  (data) => {
    if (data.starts_at && data.ends_at) {
      return new Date(data.ends_at) > new Date(data.starts_at);
    }
    return true;
  },
  {
    message: "Event end time must be after the start time",
    path: ["ends_at"],
  }
);

export const spaceSettingsSchema = spaceSettingsUpdateSchema;
export const spaceEventSchema = spaceEventCreateSchema;

export const addOrganizerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers, and underscores")
    .transform((val) => val.toLowerCase().trim()),
  label: z.string().max(50).optional(),
});

export const deskQrScanSchema = z.object({
  qr_payload: z.string().min(5, "Scanned ticket code is required").max(120),
});
export const deskScanCheckinSchema = deskQrScanSchema;

export const deskManualCheckinSchema = z.object({
  user_id: z.string().uuid("Invalid user ID").optional(),
  registration_id: z.string().uuid("Invalid registration ID").optional(),
  userId: z.string().uuid("Invalid user ID").optional(),
  registrationId: z.string().uuid("Invalid registration ID").optional(),
});

export const virtualCheckinSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
});

