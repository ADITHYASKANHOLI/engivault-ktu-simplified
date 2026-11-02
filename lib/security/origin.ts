/**
 * Safe Origin and Referer verification for state-mutating requests (POST/PUT/PATCH/DELETE).
 * Protects against Cross-Site Request Forgery (CSRF) in API route handlers and server actions.
 */

const DEFAULT_PRODUCTION_ORIGIN = "https://engivault-ktu-simplified.vercel.app";

/**
 * Normalizes an arbitrary URL string to its exact canonical origin (scheme + hostname + port).
 * Returns null if the URL cannot be safely parsed.
 */
export function toExactOrigin(urlString: string | null | undefined): string | null {
  if (!urlString) return null;
  try {
    const trimmed = urlString.trim();
    if (!trimmed) return null;
    const url = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Establishes the set of explicitly allowed, canonical origins for the deployment.
 * Never includes wildcard domains (e.g. *.vercel.app).
 */
export function getAllowedOrigins(): Set<string> {
  const allowed = new Set<string>();

  // 1. Configured canonical site URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const siteOrigin = toExactOrigin(siteUrl);
  if (siteOrigin) {
    allowed.add(siteOrigin);
  } else {
    allowed.add(DEFAULT_PRODUCTION_ORIGIN);
  }

  // 2. Specific Vercel deployment URL (exact host only, e.g. https://engivault-preview-abc.vercel.app)
  const vercelUrl = process.env.VERCEL_URL;
  const vercelOrigin = toExactOrigin(vercelUrl);
  if (vercelOrigin) {
    allowed.add(vercelOrigin);
  }

  // 3. Explicitly configured preview or custom origins (comma-separated list of exact origins)
  const extraOrigins = process.env.ALLOWED_ORIGINS;
  if (extraOrigins) {
    for (const item of extraOrigins.split(",")) {
      const parsed = toExactOrigin(item.trim());
      if (parsed) allowed.add(parsed);
    }
  }

  // 4. Local development and test origins (only active in non-production environments)
  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
    allowed.add("http://localhost");
    allowed.add("http://127.0.0.1");
  }

  return allowed;
}

/**
 * Validates request origin against trusted deployment origins:
 * - Rejects modern browser cross-site metadata (Sec-Fetch-Site: cross-site)
 * - Validates Origin header, falling back to Referer
 * - Rejects missing Origin/Referer on cookie-authenticated browser mutations
 * - Strictly matches scheme, hostname, and port against canonical origins
 * - Never trusts unvalidated client X-Forwarded-Host headers
 */
export function isSafeOrigin(request: Request): boolean {
  // 1. Sec-Fetch-Site check (W3C Fetch Metadata defense): reject cross-site immediately
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return false;
  }

  // 2. Extract origin candidate from Origin header, falling back to Referer
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  let candidateOrigin: string | null = null;

  if (originHeader) {
    candidateOrigin = toExactOrigin(originHeader);
    if (!candidateOrigin) return false;
  } else if (refererHeader) {
    candidateOrigin = toExactOrigin(refererHeader);
    if (!candidateOrigin) return false;
  }

  // 3. Handling requests when neither Origin nor Referer is present
  if (!candidateOrigin) {
    const cookieHeader = request.headers.get("cookie") || "";
    const hasAuthCookie =
      cookieHeader.includes("engivault_admin_session") ||
      cookieHeader.includes("sb-") ||
      cookieHeader.includes("auth");
    const secFetchMode = request.headers.get("sec-fetch-mode");

    // Reject cookie-authenticated mutations without Origin/Referer
    if (hasAuthCookie || secFetchMode === "cors" || secFetchMode === "navigate") {
      return false;
    }

    // Programmatic non-browser requests without auth cookies (e.g. pure server-to-server or unit tests)
    return true;
  }

  // 4. Match exact scheme, hostname and port against trusted canonical origins
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.has(candidateOrigin)) {
    return true;
  }

  // 5. Permit strict same-origin requests where the candidate origin matches the target request URL exactly
  // (scheme, hostname, and port), ignoring untrusted X-Forwarded-Host headers.
  try {
    const requestOrigin = toExactOrigin(request.url);
    if (requestOrigin && candidateOrigin === requestOrigin) {
      // In non-production/test environments, allow matching request origin for tests
      if (process.env.NODE_ENV !== "production") {
        return true;
      }
      // In production, ensure the request origin itself belongs to configured canonical origins
      if (allowedOrigins.has(requestOrigin)) {
        return true;
      }
    }
  } catch {}

  return false;
}
