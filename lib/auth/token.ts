import { scryptSync, timingSafeEqual, createHmac, randomUUID } from "node:crypto";

export const COOKIE_NAME = "engivault_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours (28,800 seconds)

let hasWarnedMissingSecret = false;
let hasWarnedShortSecret = false;

/**
 * Returns the HMAC signing secret for session tokens.
 * Priority: ADMIN_SESSION_SECRET → ADMIN_ACCESS_CODE → ADMIN_ACCESS_CODE_HASH.
 * Fails closed (returns null) if no secret is configured.
 */
export function getSecretKey(): string | null {
  const primarySecret = process.env.ADMIN_SESSION_SECRET;
  if (primarySecret && typeof primarySecret === "string" && primarySecret.trim().length > 0) {
    const trimmed = primarySecret.trim();
    if (trimmed.length < 32 && !hasWarnedShortSecret) {
      hasWarnedShortSecret = true;
      console.warn(
        "[SECURITY WARNING] ADMIN_SESSION_SECRET should be at least 32 characters long for cryptographic resilience."
      );
    }
    return trimmed;
  }

  // Fallback to ADMIN_ACCESS_CODE or ADMIN_ACCESS_CODE_HASH with an administrative security notice
  const fallback = process.env.ADMIN_ACCESS_CODE || process.env.ADMIN_ACCESS_CODE_HASH;
  if (fallback && typeof fallback === "string" && fallback.trim().length > 0) {
    if (!hasWarnedMissingSecret && process.env.NODE_ENV !== "test") {
      hasWarnedMissingSecret = true;
      console.warn(
        "[SECURITY NOTICE] ADMIN_SESSION_SECRET is not configured. Falling back to ADMIN_ACCESS_CODE. Set ADMIN_SESSION_SECRET (32+ chars) in production."
      );
    }
    return fallback.trim();
  }

  return null;
}

/**
 * Validates a redirect target URL to ensure it is a safe relative same-origin path.
 * Rejects external URLs, protocol-relative URLs (//evil.com), backslashes, and control characters.
 */
export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback: string = "/admin/dashboard"
): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }
  const trimmed = target.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.includes("\\") &&
    !trimmed.includes(":")
  ) {
    if (!/^[a-zA-Z0-9\-_.~!$&'()*+,;=:@/?#]+$/.test(trimmed)) {
      return fallback;
    }
    return trimmed;
  }
  return fallback;
}

/**
 * Constant-time comparison between two strings to prevent timing side-channel attacks.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");

    if (bufA.length !== bufB.length) {
      const dummy = Buffer.alloc(bufA.length || 1);
      timingSafeEqual(dummy, dummy);
      return false;
    }

    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Verify provided plaintext code against scrypt hash
 * Format: scrypt:salt:derivedKey
 */
export function verifyScryptHash(code: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 3 || parts[0] !== "scrypt") {
      return false;
    }

    const salt = parts[1];
    const originalDerivedKeyHex = parts[2];
    const originalKey = Buffer.from(originalDerivedKeyHex, "hex");

    const computedKey = scryptSync(code, salt, 64, { N: 16384, r: 8, p: 1 });

    if (computedKey.length !== originalKey.length) {
      return false;
    }

    return timingSafeEqual(computedKey, originalKey);
  } catch {
    return false;
  }
}

/**
 * Primary server-side admin access code verification.
 * Compares submitted code against process.env.ADMIN_ACCESS_CODE (timing-safe).
 * Falls back to ADMIN_ACCESS_CODE_HASH (scrypt) if hash is configured.
 */
export function verifyAdminAccessCode(code: string, storedHash?: string): boolean {
  if (!code || typeof code !== "string") {
    return false;
  }

  const expectedCode = process.env.ADMIN_ACCESS_CODE;
  if (expectedCode) {
    return timingSafeCompare(code.trim(), expectedCode.trim());
  }

  const hash = storedHash || process.env.ADMIN_ACCESS_CODE_HASH;
  if (hash) {
    return verifyScryptHash(code.trim(), hash);
  }

  return false;
}

export interface AdminTokenPayload {
  role: "admin";
  iat: number; // Unix timestamp in seconds
  exp: number; // Unix timestamp in seconds
  jti: string; // Cryptographic nonce
  createdAt?: number; // Backwards compatibility (milliseconds)
}

/**
 * Creates a cryptographically signed HMAC session token.
 * Contains standard claims (iat, exp, jti, role) and fails closed if secret is missing.
 */
export function createSignedToken(payload?: Partial<AdminTokenPayload>): string {
  const secret = getSecretKey();
  if (!secret) {
    throw new Error("Admin session signing secret is not configured on the server.");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const fullPayload: AdminTokenPayload = {
    role: "admin",
    iat: payload?.iat ?? nowSec,
    exp: payload?.exp ?? (nowSec + SESSION_MAX_AGE),
    jti: payload?.jti ?? randomUUID(),
    createdAt: payload?.createdAt ?? Date.now(),
  };

  const data = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Verifies and decodes a signed session token:
 * - Constant-time signature verification
 * - Role assertion
 * - Expiration check (maximum 8 hours)
 * - Clock skew verification
 */
export function verifySignedToken(token: string): AdminTokenPayload | null {
  try {
    if (!token || typeof token !== "string") return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    if (!data || !signature) return null;

    const secret = getSecretKey();
    if (!secret) return null;

    const expectedSig = createHmac("sha256", secret).update(data).digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (!payload || typeof payload !== "object" || payload.role !== "admin") {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const nowMs = Date.now();

    // Check expiration: exp (seconds) or legacy createdAt (ms)
    if (typeof payload.exp === "number") {
      if (nowSec > payload.exp) {
        return null;
      }
    } else if (typeof payload.createdAt === "number") {
      if (nowMs - payload.createdAt > SESSION_MAX_AGE * 1000) {
        return null;
      }
    } else {
      return null;
    }

    // Clock skew check on iat (reject tokens issued >60s in the future)
    if (typeof payload.iat === "number") {
      if (payload.iat > nowSec + 60) {
        return null;
      }
      // Enforce lifetime cannot exceed maximum session window from iat
      if (nowSec - payload.iat > SESSION_MAX_AGE) {
        return null;
      }
    }

    return payload;
  } catch {
    return null;
  }
}
