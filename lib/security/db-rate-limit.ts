import { createHash } from "node:crypto";

export interface DbRateLimitOptions {
  windowSeconds?: number; // Duration of rate limit window in seconds (default: 900 = 15m)
  maxAttempts?: number;   // Max allowed attempts within the window (default: 6)
}

export interface DbRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

// In-memory fallback for local development or when Supabase is unconfigured
interface MemoryRecord {
  count: number;
  windowStart: number;
}
const memoryStore = new Map<string, MemoryRecord>();

function isSupabaseAdminConfiguredFast(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || url.includes("your-project") || url.includes("placeholder") || !serviceKey || serviceKey.includes("placeholder")) {
    return false;
  }
  return true;
}

/**
 * Extracts client IP safely from standard headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * Hash an identifier with SHA-256 to protect IP privacy in the database
 */
export function hashIdentifier(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 32);
}

/**
 * Atomic DB-backed rate limiter (with resilient in-memory fallback for dev/offline)
 */
export async function checkDbRateLimit(
  key: string,
  options: DbRateLimitOptions = {}
): Promise<DbRateLimitResult> {
  const windowSeconds = options.windowSeconds ?? 900; // 15 minutes
  const maxAttempts = options.maxAttempts ?? 6;

  // 1. Attempt DB-backed check if Supabase admin is configured
  if (isSupabaseAdminConfiguredFast()) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabase = createAdminClient();
      const { data, error } = await supabase.rpc("check_and_increment_rate_limit", {
        p_key: key,
        p_window_seconds: windowSeconds,
        p_max_attempts: maxAttempts,
      });

      if (!error && data) {
        return {
          allowed: Boolean(data.allowed),
          remaining: Number(data.remaining ?? 0),
          resetInSeconds: Math.max(1, Number(data.reset_in_seconds ?? windowSeconds)),
        };
      }
      // If RPC is missing or fails, log in dev and drop to memory fallback
      if (process.env.NODE_ENV !== "production") {
        console.warn("[RATE LIMIT] Supabase RPC failed, falling back to memory store:", error?.message);
      }
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[RATE LIMIT] Supabase connection failed, using memory store:", err?.message);
      }
    }
  }

  // 2. Local memory fallback
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = memoryStore.get(key);

  if (!existing || now - existing.windowStart >= windowMs) {
    memoryStore.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - 1),
      resetInSeconds: windowSeconds,
    };
  }

  const elapsedSeconds = Math.floor((now - existing.windowStart) / 1000);
  const resetInSeconds = Math.max(1, windowSeconds - elapsedSeconds);

  if (existing.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - existing.count),
    resetInSeconds,
  };
}

/**
 * Resets an in-memory rate limit key (test helper)
 */
export function _resetMemoryRateLimit(key?: string): void {
  if (key) {
    memoryStore.delete(key);
  } else {
    memoryStore.clear();
  }
}

/**
 * Constructs a standardized 429 Too Many Requests response with Retry-After header
 */
export function rateLimitResponse(
  message: string,
  retryAfterSeconds: number
): Response {
  return Response.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))),
      },
    }
  );
}
