/**
 * In-Memory Sliding Window Rate Limiter for Serverless / Node.js
 *
 * Provides IP-based rate limiting to prevent form abuse, brute forcing, and spam bots.
 * For distributed multi-region deployments with shared state, configure Upstash Redis
 * or similar external key-value store.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired records periodically to prevent unbounded memory growth
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  if (typeof cleanupTimer === "object" && cleanupTimer !== null && "unref" in cleanupTimer) {
    (cleanupTimer as { unref: () => void }).unref();
  }
}

export interface RateLimitOptions {
  windowMs?: number; // Duration of rate limit window in milliseconds (default: 10 minutes)
  max?: number;      // Maximum requests allowed within the window (default: 5)
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks and increments the rate limit for a given identifier (e.g., client IP).
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const windowMs = options.windowMs ?? 10 * 60 * 1000; // 10 minutes
  const max = options.max ?? 5; // 5 requests per 10 minutes
  const now = Date.now();

  const record = rateLimitMap.get(identifier);

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      remaining: max - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= max) {
    return {
      success: false,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: Math.max(0, max - record.count),
    resetInSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
  };
}

/**
 * Test and maintenance helper to clear rate limit state.
 */
export function _resetRateLimits(): void {
  rateLimitMap.clear();
}
