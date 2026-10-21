import { scryptSync, timingSafeEqual, createHmac } from "node:crypto";

export const COOKIE_NAME = "engivault_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Returns the HMAC signing secret for session tokens.
 * Priority: ADMIN_SESSION_SECRET → ADMIN_ACCESS_CODE → ADMIN_ACCESS_CODE_HASH.
 * Fails closed (returns null) if no secret is configured.
 */
export function getSecretKey(): string | null {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_ACCESS_CODE ||
    process.env.ADMIN_ACCESS_CODE_HASH;

  if (!secret || typeof secret !== "string" || secret.trim() === "") {
    return null;
  }
  return secret.trim();
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
 * Constant-time comparison between two strings to prevent timing side-channel attacks
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

/**
 * Creates a signed session token. Fails closed if signing secret is missing.
 */
export function createSignedToken(payload: { role: "admin"; createdAt: number }): string {
  const secret = getSecretKey();
  if (!secret) {
    throw new Error("Admin session signing secret is not configured on the server.");
  }
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Verifies and decodes a signed session token. Fails closed if secret is missing or invalid.
 */
export function verifySignedToken(token: string): { role: "admin"; createdAt: number } | null {
  try {
    const [data, signature] = token.split(".");
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
    // Expiration check (7 days)
    if (Date.now() - payload.createdAt > SESSION_MAX_AGE * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
