import { scryptSync, timingSafeEqual, createHmac, randomUUID } from "node:crypto";

export const COOKIE_NAME = "engivault_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours (28,800 seconds)
export const MIN_SECRET_BYTES = 32;

/**
 * Returns the dedicated HMAC signing secret for admin session tokens.
 *
 * Security Requirements:
 * - Requires ADMIN_SESSION_SECRET exclusively.
 * - Fallbacks to ADMIN_ACCESS_CODE or ADMIN_ACCESS_CODE_HASH are strictly prohibited.
 * - Fails closed (returns null) when ADMIN_SESSION_SECRET is missing, empty, or < 32 bytes.
 *
 * Operational Note:
 * - Rotating ADMIN_SESSION_SECRET immediately and intentionally invalidates all existing active admin sessions.
 */
export function getSecretKey(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || typeof secret !== "string") {
    return null;
  }

  const trimmed = secret.trim();
  if (Buffer.byteLength(trimmed, "utf8") < MIN_SECRET_BYTES) {
    return null;
  }

  return trimmed;
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
 * Verify provided plaintext code against scrypt hash.
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
 * Server-side admin access code verification for login credentials.
 * Compares submitted code against process.env.ADMIN_ACCESS_CODE (timing-safe).
 * Falls back to ADMIN_ACCESS_CODE_HASH (scrypt) if hash is configured.
 *
 * NOTE: This is strictly for login password verification, NEVER for session token signing.
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
  jti: string; // Cryptographic nonce (UUID)
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 * Contains standard claims (iat, exp, jti, role) and fails closed if ADMIN_SESSION_SECRET is missing or weak.
 */
export function createSignedToken(payload?: Partial<AdminTokenPayload>): string {
  const secret = getSecretKey();
  if (!secret) {
    throw new Error(
      "Admin session signing failed: ADMIN_SESSION_SECRET is required with at least 32 bytes of entropy."
    );
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const fullPayload: AdminTokenPayload = {
    role: "admin",
    iat: payload?.iat ?? nowSec,
    exp: payload?.exp ?? (nowSec + SESSION_MAX_AGE),
    jti: payload?.jti ?? randomUUID(),
  };

  const data = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Verifies and decodes a signed session token:
 * - Constant-time signature verification using dedicated ADMIN_SESSION_SECRET
 * - Rejects tokens signed with access code or hash
 * - Strict schema validation: requires role === 'admin', numeric iat, numeric exp, non-empty jti
 * - Rejects legacy tokens lacking standard claims
 * - Validates expiration (exp <= now)
 * - Validates clock skew (iat cannot be >60s in the future)
 * - Enforces maximum session lifetime (now - iat <= SESSION_MAX_AGE)
 * - Enforces exp <= iat + SESSION_MAX_AGE
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
    if (!payload || typeof payload !== "object") {
      return null;
    }

    // Role assertion
    if (payload.role !== "admin") {
      return null;
    }

    // Standard claims assertion: iat, exp, jti must all be present with correct types
    if (
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number" ||
      typeof payload.jti !== "string" ||
      payload.jti.trim().length === 0
    ) {
      return null; // Rejects malformed and legacy tokens
    }

    const nowSec = Math.floor(Date.now() / 1000);

    // 1. Expiration check
    if (nowSec > payload.exp) {
      return null;
    }

    // 2. Future clock-skew check (reject tokens issued >60s in the future)
    if (payload.iat > nowSec + 60) {
      return null;
    }

    // 3. Maximum lifetime check (token cannot be older than SESSION_MAX_AGE from issuance)
    if (nowSec - payload.iat > SESSION_MAX_AGE) {
      return null;
    }

    // 4. Expiration claim integrity check
    if (payload.exp > payload.iat + SESSION_MAX_AGE) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
