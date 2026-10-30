/**
 * Safe Origin verification for state-mutating requests (POST/PUT/DELETE)
 * Protects against cross-site request forgery (CSRF) in API route handlers.
 */
export function isSafeOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    // Non-browser or same-origin direct request without Origin header (e.g. mobile or tests)
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const host = request.headers.get("host") || request.headers.get("x-forwarded-host");
    if (host && (originUrl.host === host || originUrl.hostname === host.split(":")[0])) {
      return true;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      const configuredUrl = new URL(siteUrl);
      if (originUrl.host === configuredUrl.host) {
        return true;
      }
    }

    // Localhost / development safe matching
    if (process.env.NODE_ENV !== "production") {
      if (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1") {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
