/**
 * Safe Origin and Referer verification for state-mutating requests (POST/PUT/PATCH/DELETE).
 * Protects against Cross-Site Request Forgery (CSRF) in API route handlers and server actions.
 */
export function isSafeOrigin(request: Request): boolean {
  // 1. Sec-Fetch-Site check (modern browser W3C Fetch Metadata defense)
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return false; // Direct cross-site request blocked immediately
  }

  // 2. Extract origin candidate from Origin header, falling back to Referer
  const origin = request.headers.get("origin");
  let candidateUrlString = origin;

  if (!candidateUrlString) {
    const referer = request.headers.get("referer");
    if (referer) {
      candidateUrlString = referer;
    }
  }

  // 3. Handling requests when neither Origin nor Referer is present
  if (!candidateUrlString) {
    // If request contains browser authentication cookies or browser fetch mode,
    // a missing Origin/Referer on a mutation indicates a high-risk or stripped request.
    const hasCookies = !!request.headers.get("cookie");
    const secFetchMode = request.headers.get("sec-fetch-mode");
    if (process.env.NODE_ENV === "production" && (hasCookies || secFetchMode)) {
      return false;
    }
    // Non-browser direct programmatic tools (e.g. curl, unit tests without browser session)
    return true;
  }

  try {
    const candidateUrl = new URL(candidateUrlString);
    const candidateHost = candidateUrl.host.toLowerCase();
    const candidateHostname = candidateUrl.hostname.toLowerCase();

    // 4. Compare with Host / X-Forwarded-Host header
    const hostHeader = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").toLowerCase();
    if (hostHeader) {
      const cleanHost = hostHeader.split(",")[0].trim();
      const hostWithoutPort = cleanHost.split(":")[0];
      if (candidateHost === cleanHost || candidateHostname === hostWithoutPort) {
        return true;
      }
    }

    // 5. Compare with configured NEXT_PUBLIC_SITE_URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      try {
        const configuredUrl = new URL(siteUrl);
        if (candidateHost === configuredUrl.host.toLowerCase()) {
          return true;
        }
      } catch {}
    }

    // 6. Compare with Vercel deployment URL
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
      const vHost = vercelUrl.toLowerCase();
      if (candidateHost === vHost || candidateHostname.endsWith(".vercel.app")) {
        return true;
      }
    }

    // 7. Localhost / development safe matching
    if (process.env.NODE_ENV !== "production") {
      if (
        candidateHostname === "localhost" ||
        candidateHostname === "127.0.0.1" ||
        candidateHostname.endsWith(".local")
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
