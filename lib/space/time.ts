export interface OpeningHoursDay {
  open: string;  // "09:00"
  close: string; // "20:00"
  closed?: boolean;
}

export type OpeningHoursWeek = Record<string, OpeningHoursDay>;

export const DEFAULT_SPACE_TIMEZONE = "Asia/Kolkata";

/**
 * Formats a Date or ISO timestamp into a human-readable date in Asia/Kolkata
 */
export function formatKolkataDate(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: DEFAULT_SPACE_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Formats full date and time in Asia/Kolkata (IST)
 */
export function formatDateTimeIST(dateInput: string | Date | number): string {
  return formatKolkataDateTime(dateInput);
}

/**
 * Formats a Date or ISO timestamp into time (e.g. 04:30 PM) in Asia/Kolkata
 */
export function formatKolkataTime(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: DEFAULT_SPACE_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Formats a Date or ISO timestamp into full date and time in Asia/Kolkata
 */
export function formatKolkataDateTime(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: DEFAULT_SPACE_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Formats an ISO string or Date for monthly calendar headers (e.g. "October 2026")
 */
export function formatKolkataMonthYear(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: DEFAULT_SPACE_TIMEZONE,
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Gets the current day of the week in Asia/Kolkata lowercase ("monday", "tuesday", etc.)
 */
export function getKolkataDayOfWeek(dateInput: string | Date | number = new Date()): string {
  const d = new Date(dateInput);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: DEFAULT_SPACE_TIMEZONE,
    weekday: "long",
  })
    .format(d)
    .toLowerCase();
  return weekday;
}

/**
 * Gets the current hour and minute in Asia/Kolkata as "HH:MM" (24-hour)
 */
export function getKolkataTime24(dateInput: string | Date | number = new Date()): string {
  const d = new Date(dateInput);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DEFAULT_SPACE_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const hour = parts.find((p) => p.type === "hour")?.value || "00";
  const minute = parts.find((p) => p.type === "minute")?.value || "00";
  return `${hour}:${minute}`;
}

/**
 * Evaluates whether a given timestamp is within the space's configured opening hours
 */
export function isWithinOpeningHours(
  hours: OpeningHoursWeek,
  dateInput: string | Date | number = new Date()
): { isOpen: boolean; reason?: string } {
  // If no opening hours are defined or empty configuration provided, space has no schedule restrictions (unrestricted)
  if (!hours || Object.keys(hours).length === 0) {
    return { isOpen: true };
  }

  const day = getKolkataDayOfWeek(dateInput);
  const dayConfig = hours?.[day];

  if (!dayConfig || dayConfig.closed) {
    return { isOpen: false, reason: `Space is closed on ${day.charAt(0).toUpperCase() + day.slice(1)}s` };
  }

  const currentTime = getKolkataTime24(dateInput);
  if (currentTime < dayConfig.open) {
    return { isOpen: false, reason: `Space opens today at ${dayConfig.open}` };
  }
  if (currentTime >= dayConfig.close) {
    return { isOpen: false, reason: `Space closed today at ${dayConfig.close}` };
  }

  return { isOpen: true };
}

/**
 * Computes remaining seconds using server offset to protect against client device clock skew
 */
export function calculateRemainingSeconds(
  expiresAtIso: string,
  serverNowIso: string,
  clientTimestampMs: number = Date.now(),
  fetchTimeMs: number = Date.now()
): number {
  const targetMs = new Date(expiresAtIso).getTime();
  const serverNowMs = new Date(serverNowIso).getTime();
  const elapsedSinceFetch = Math.max(0, clientTimestampMs - fetchTimeMs);
  const estimatedServerNow = serverNowMs + elapsedSinceFetch;
  const diffSec = Math.floor((targetMs - estimatedServerNow) / 1000);
  return Math.max(0, diffSec);
}

/**
 * Formats remaining seconds as "MM:SS" or "HH:MM:SS"
 */
export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    const hh = String(hours).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Converts a UTC ISO timestamp (or Date) to an HTML datetime-local input string
 * representing Asia/Kolkata (IST) time ("YYYY-MM-DDTHH:mm").
 * Never throws RangeError. Returns empty string on invalid/null input.
 */
export function formatUtcToIstInput(dateInput?: string | Date | number | null): string {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    // IST is fixed UTC+05:30 (+330 minutes = 19,800,000 milliseconds)
    const istMs = d.getTime() + 5.5 * 60 * 60 * 1000;
    const istDate = new Date(istMs);
    return istDate.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

/**
 * Converts an HTML datetime-local input string ("YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss")
 * selected in Asia/Kolkata (IST) to a UTC ISO string ("YYYY-MM-DDTHH:mm:ss.sssZ").
 * Returns null if the input is empty or invalid. Never throws.
 */
export function parseIstInputToUtcIso(istInput?: string | null): string | null {
  if (!istInput || typeof istInput !== "string") return null;
  const trimmed = istInput.trim();
  if (!trimmed) return null;

  // Accept YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    return null;
  }

  try {
    const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    // Explicitly append +05:30 IST timezone offset so JS engines parse it deterministically
    const isoWithOffset = `${withSeconds}+05:30`;
    const d = new Date(isoWithOffset);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}
