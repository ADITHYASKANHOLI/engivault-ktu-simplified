process.env.NODE_ENV = "test";

import assert from "node:assert/strict";
import fs from "node:fs";
import { isPrivateOrBlockedIp, validateUrlForSsrf, verifyImageMagicBytes } from "../lib/security/ssrf.ts";
import {
  createSignedToken,
  verifySignedToken,
  timingSafeCompare,
  SESSION_MAX_AGE,
} from "../lib/auth/token.ts";
import { isSafeOrigin } from "../lib/security/origin.ts";
import {
  validateMaterialBytes,
  validateVideoBytes,
} from "../lib/security/magic-bytes.ts";

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

console.log("\n=================================================");
console.log("🔒 ENGIVAULT PENETRATION TESTING & SECURITY AUDIT");
console.log("=================================================\n");

// --- DOMAIN 1: SSRF DEFENSES ---
console.log("--- 1. SSRF & IMAGE FETCH SECURITY ---");

await test("Blocks private IPv4 loopback, RFC 1918, and CGNAT ranges", () => {
  assert.equal(isPrivateOrBlockedIp("127.0.0.1"), true, "127.0.0.1 blocked");
  assert.equal(isPrivateOrBlockedIp("127.1.2.3"), true, "127.1.2.3 blocked");
  assert.equal(isPrivateOrBlockedIp("10.0.0.1"), true, "10.0.0.1 blocked");
  assert.equal(isPrivateOrBlockedIp("10.254.254.254"), true, "10.254.254.254 blocked");
  assert.equal(isPrivateOrBlockedIp("172.16.0.1"), true, "172.16.0.1 blocked");
  assert.equal(isPrivateOrBlockedIp("172.31.255.255"), true, "172.31.255.255 blocked");
  assert.equal(isPrivateOrBlockedIp("192.168.1.1"), true, "192.168.1.1 blocked");
  assert.equal(isPrivateOrBlockedIp("100.64.0.1"), true, "CGNAT 100.64.0.1 blocked");
  assert.equal(isPrivateOrBlockedIp("0.0.0.0"), true, "0.0.0.0 blocked");
});

await test("Blocks Cloud Metadata IPs (AWS/GCP/Azure link-local)", () => {
  assert.equal(isPrivateOrBlockedIp("169.254.169.254"), true, "169.254.169.254 blocked");
  assert.equal(isPrivateOrBlockedIp("169.254.1.1"), true, "169.254.1.1 blocked");
});

await test("Blocks IPv6 loopback, link-local, and unique local addresses", () => {
  assert.equal(isPrivateOrBlockedIp("::1"), true, "::1 blocked");
  assert.equal(isPrivateOrBlockedIp("fe80::1"), true, "fe80::1 blocked");
  assert.equal(isPrivateOrBlockedIp("fc00::1"), true, "fc00::1 blocked");
  assert.equal(isPrivateOrBlockedIp("fd12:3456:789a::1"), true, "fd00::/8 blocked");
  assert.equal(isPrivateOrBlockedIp("::ffff:127.0.0.1"), true, "IPv4-mapped loopback blocked");
});

await test("Allows public routable IP addresses", () => {
  assert.equal(isPrivateOrBlockedIp("8.8.8.8"), false, "Google DNS 8.8.8.8 allowed");
  assert.equal(isPrivateOrBlockedIp("1.1.1.1"), false, "Cloudflare 1.1.1.1 allowed");
});

await test("validateUrlForSsrf blocks non-whitelisted domains, protocols, and metadata hostnames", async () => {
  const metaCheck = await validateUrlForSsrf("http://169.254.169.254/latest/meta-data/");
  assert.equal(metaCheck.valid, false, "Metadata IP blocked");

  const gcpMeta = await validateUrlForSsrf("http://metadata.google.internal/computeMetadata/v1/");
  assert.equal(gcpMeta.valid, false, "GCP metadata hostname blocked");

  const evilDomain = await validateUrlForSsrf("https://evil-attacker-site.com/image.png");
  assert.equal(evilDomain.valid, false, "Non-whitelisted domain blocked");

  const userPass = await validateUrlForSsrf("https://admin:secret@images.unsplash.com/photo");
  assert.equal(userPass.valid, false, "Embedded credentials rejected");

  const validUnsplash = await validateUrlForSsrf("https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3");
  assert.equal(validUnsplash.valid, true, "Valid Unsplash HTTPS URL permitted");
});

await test("verifyImageMagicBytes validates JPEG, PNG, and WebP, rejecting scripts and SVGs", () => {
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  assert.equal(verifyImageMagicBytes(jpegHeader).valid, true, "JPEG magic bytes valid");

  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  assert.equal(verifyImageMagicBytes(pngHeader).valid, true, "PNG magic bytes valid");

  const webpHeader = Buffer.from("RIFF....WEBPVP8 ", "ascii");
  assert.equal(verifyImageMagicBytes(webpHeader).valid, true, "WebP magic bytes valid");

  const svgScript = Buffer.from("<svg onload='alert(1)'></svg>", "utf-8");
  assert.equal(verifyImageMagicBytes(svgScript).valid, false, "SVG XSS payload rejected");

  const htmlDoc = Buffer.from("<!DOCTYPE html><html><body>", "utf-8");
  assert.equal(verifyImageMagicBytes(htmlDoc).valid, false, "HTML payload rejected");
});

// --- DOMAIN 2: CHECKOUT BOLA / IDOR ---
console.log("\n--- 2. CHECKOUT BOLA / IDOR REMEDIATION ---");

await test("lib/space/service.ts asserts student session ownership on self checkout", () => {
  const serviceCode = fs.readFileSync("lib/space/service.ts", "utf-8");
  assert.ok(
    serviceCode.includes("targetSession.user_id !== userId"),
    "Must verify that targetSession user_id matches authenticated userId"
  );
  assert.ok(
    serviceCode.includes("Session not found or unauthorized access."),
    "Must return unauthorized error when session does not belong to user"
  );
});

await test("Migration 013 rpc_space_checkout enforces strict session ownership", () => {
  const migration = fs.readFileSync("supabase/migrations/013_security_remediation.sql", "utf-8");
  assert.ok(
    migration.includes("coalesce(p_source, 'self') = 'self'"),
    "Must distinguish self checkout from admin forced checkout"
  );
  assert.ok(
    migration.includes("where id = p_session_id") && migration.includes("and user_id = p_user_id"),
    "Must require user_id = p_user_id in SQL query for self checkout"
  );
  assert.ok(
    migration.includes("set search_path = public, pg_temp"),
    "Must fix immutable search_path on rpc_space_checkout"
  );
});

// --- DOMAIN 3: AUDIT LOG SECURITY ---
console.log("\n--- 3. AUDIT LOG TAMPERING REMEDIATION ---");

await test("Migration 013 revokes client insert privileges on activity_logs", () => {
  const migration = fs.readFileSync("supabase/migrations/013_security_remediation.sql", "utf-8");
  assert.ok(
    migration.includes('drop policy if exists "System can insert activity logs" on public.activity_logs'),
    "Must drop insecure insert policy"
  );
  assert.ok(
    migration.includes("revoke insert, update, delete on public.activity_logs from public, anon, authenticated"),
    "Must revoke mutation privileges from client-facing roles"
  );
  assert.ok(
    migration.includes("grant all on public.activity_logs to service_role"),
    "Must restrict mutations exclusively to service_role"
  );
});

// --- DOMAIN 4: DATABASE FUNCTIONS SECURITY ---
console.log("\n--- 4. DATABASE FUNCTION SEARCH PATH & SECURITY ---");

await test("Migration 013 hardens public.is_admin() and trigger functions", () => {
  const migration = fs.readFileSync("supabase/migrations/013_security_remediation.sql", "utf-8");
  assert.ok(
    migration.includes("create or replace function public.is_admin()"),
    "Must redefine is_admin"
  );
  assert.ok(
    migration.includes("set search_path = public, pg_temp"),
    "Must set search_path = public, pg_temp on is_admin"
  );
  assert.ok(
    migration.includes("revoke all on function public.is_admin() from public"),
    "Must revoke default public execute"
  );
  assert.ok(
    migration.includes("create or replace function public.handle_updated_at()"),
    "Must harden handle_updated_at search_path"
  );
});

// --- DOMAIN 5: ADMIN SESSION TOKENS ---
console.log("\n--- 5. ADMIN SESSION TOKEN HARDENING ---");

await test("Admin session token enforces 8-hour maximum expiration", () => {
  assert.equal(SESSION_MAX_AGE, 60 * 60 * 8, "SESSION_MAX_AGE must be 28,800 seconds (8 hours)");
});

await test("createSignedToken generates verifiable HMAC token with iat, exp, and jti", () => {
  process.env.ADMIN_SESSION_SECRET = "super-secret-key-that-is-at-least-32-characters-long!";
  const token = createSignedToken();
  assert.ok(token.includes("."), "Token must be in data.signature format");

  const verified = verifySignedToken(token);
  assert.ok(verified, "Fresh token must verify successfully");
  assert.equal(verified.role, "admin", "Role must be admin");
  assert.ok(typeof verified.iat === "number", "Token must have iat");
  assert.ok(typeof verified.exp === "number", "Token must have exp");
  assert.ok(typeof verified.jti === "string", "Token must have jti nonce");
  assert.equal(verified.exp - verified.iat, SESSION_MAX_AGE, "exp - iat must equal 8 hours");
});

await test("verifySignedToken strictly rejects expired and future-skewed tokens", () => {
  process.env.ADMIN_SESSION_SECRET = "super-secret-key-that-is-at-least-32-characters-long!";

  // Expired token (exp in the past)
  const expiredToken = createSignedToken({
    iat: Math.floor(Date.now() / 1000) - 30000,
    exp: Math.floor(Date.now() / 1000) - 100,
  });
  assert.equal(verifySignedToken(expiredToken), null, "Expired token must be rejected");

  // Future token (>60s in future)
  const futureToken = createSignedToken({
    iat: Math.floor(Date.now() / 1000) + 120,
    exp: Math.floor(Date.now() / 1000) + 30000,
  });
  assert.equal(verifySignedToken(futureToken), null, "Future token must be rejected");

  // Tampered token
  const validToken = createSignedToken();
  const [, sig] = validToken.split(".");
  const tamperedData = Buffer.from(JSON.stringify({ role: "admin", iat: 1, exp: 9999999999 })).toString("base64url");
  const tamperedToken = `${tamperedData}.${sig}`;
  assert.equal(verifySignedToken(tamperedToken), null, "Tampered token signature must fail");
});

await test("timingSafeCompare prevents timing side-channels", () => {
  assert.equal(timingSafeCompare("secret123", "secret123"), true, "Identical strings match");
  assert.equal(timingSafeCompare("secret123", "secret124"), false, "Different strings do not match");
  assert.equal(timingSafeCompare("short", "longerstring"), false, "Different length strings do not match");
});

// --- DOMAIN 6: CSRF AND ORIGIN VALIDATION ---
console.log("\n--- 6. CSRF & ORIGIN VALIDATION ---");

await test("isSafeOrigin rejects sec-fetch-site: cross-site immediately", () => {
  const req = new Request("https://engivault.com/api/admin/materials", {
    method: "POST",
    headers: {
      "host": "engivault.com",
      "origin": "https://engivault.com",
      "sec-fetch-site": "cross-site",
    },
  });
  assert.equal(isSafeOrigin(req), false, "cross-site request must be rejected");
});

await test("isSafeOrigin allows matching Host, NEXT_PUBLIC_SITE_URL, and Vercel URLs", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://engivault.edu.in";
  process.env.VERCEL_URL = "engivault-preview.vercel.app";

  const hostMatchReq = new Request("https://engivault.edu.in/api/admin/materials", {
    method: "POST",
    headers: {
      "host": "engivault.edu.in",
      "origin": "https://engivault.edu.in",
    },
  });
  assert.equal(isSafeOrigin(hostMatchReq), true, "Matching host origin allowed");

  const vercelMatchReq = new Request("https://engivault-preview.vercel.app/api/admin/materials", {
    method: "POST",
    headers: {
      "host": "engivault-preview.vercel.app",
      "origin": "https://engivault-preview.vercel.app",
    },
  });
  assert.equal(isSafeOrigin(vercelMatchReq), true, "Matching vercel URL allowed");
});

await test("isSafeOrigin rejects unauthorized third-party origins", () => {
  const evilReq = new Request("https://engivault.edu.in/api/admin/materials", {
    method: "POST",
    headers: {
      "host": "engivault.edu.in",
      "origin": "https://malicious-attacker.com",
    },
  });
  assert.equal(isSafeOrigin(evilReq), false, "Malicious origin rejected");
});

await test("isSafeOrigin falls back to Referer when Origin is omitted", () => {
  const refererReq = new Request("https://engivault.edu.in/api/admin/materials", {
    method: "POST",
    headers: {
      "host": "engivault.edu.in",
      "referer": "https://engivault.edu.in/admin/dashboard/materials",
    },
  });
  assert.equal(isSafeOrigin(refererReq), true, "Same-origin referer allowed");

  const evilRefererReq = new Request("https://engivault.edu.in/api/admin/materials", {
    method: "POST",
    headers: {
      "host": "engivault.edu.in",
      "referer": "https://phishing-site.com/exploit.html",
    },
  });
  assert.equal(isSafeOrigin(evilRefererReq), false, "Cross-origin referer rejected");
});

await test("All administrative mutation routes enforce isSafeOrigin", () => {
  const routes = [
    "app/api/admin/logout/route.ts",
    "app/api/admin/materials/route.ts",
    "app/api/admin/lessons/route.ts",
    "app/api/admin/modules/route.ts",
    "app/api/admin/subjects/route.ts",
    "app/api/admin/videos/route.ts",
    "app/api/admin/upload/route.ts",
    "app/api/admin/works/route.ts",
    "app/api/admin/works/[id]/route.ts",
    "app/api/admin/works/[id]/status/route.ts",
  ];

  for (const r of routes) {
    const code = fs.readFileSync(r, "utf-8");
    assert.ok(code.includes("isSafeOrigin"), `Route ${r} must import and verify isSafeOrigin`);
  }
});

// --- DOMAIN 7: MATERIAL DOWNLOAD AUTHORIZATION HIERARCHY ---
console.log("\n--- 7. MATERIAL DOWNLOAD HIERARCHY & AUTHORIZATION ---");

await test("app/api/materials/download/route.ts validates complete academic publication hierarchy", () => {
  const code = fs.readFileSync("app/api/materials/download/route.ts", "utf-8");
  assert.ok(code.includes("lessons ("), "Query must join lessons");
  assert.ok(code.includes("modules ("), "Query must join modules");
  assert.ok(code.includes("subjects ("), "Query must join subjects");
  assert.ok(code.includes("!data.published || data.deleted_at !== null"), "Must verify material publication");
  assert.ok(code.includes("!rawLesson.published"), "Must verify lesson publication");
  assert.ok(code.includes("!rawModule.published"), "Must verify module publication");
  assert.ok(code.includes("!rawSubject.published"), "Must verify subject publication");
  assert.ok(code.includes("path.includes(\"..\")"), "Must guard against path traversal");
  assert.ok(code.includes("getAdminSession()"), "Must check admin session for preview access");
});

// --- DOMAIN 8: HTTP SECURITY HEADERS ---
console.log("\n--- 8. HTTP SECURITY HEADERS ---");

await test("next.config.ts configures comprehensive HTTP security headers", () => {
  const config = fs.readFileSync("next.config.ts", "utf-8");
  assert.ok(config.includes("Strict-Transport-Security"), "Must enforce HSTS");
  assert.ok(config.includes("X-Content-Type-Options"), "Must enforce nosniff");
  assert.ok(config.includes("X-Frame-Options"), "Must set X-Frame-Options to DENY");
  assert.ok(config.includes("Referrer-Policy"), "Must set Referrer-Policy");
  assert.ok(config.includes("Permissions-Policy"), "Must configure Permissions-Policy");
  assert.ok(config.includes("Content-Security-Policy"), "Must define Content-Security-Policy");
  assert.ok(config.includes("frame-ancestors 'none'"), "CSP must include frame-ancestors 'none'");
});

// --- DOMAIN 9: STORAGE UPLOADS & MAGIC BYTES ---
console.log("\n--- 9. STORAGE UPLOAD DEFENSES & MAGIC BYTES ---");

await test("validateMaterialBytes validates PDF, DOCX/ZIP, and plain text, rejecting scripts", () => {
  const pdfHeader = Buffer.from("%PDF-1.7\n1 0 obj\n", "ascii");
  assert.equal(validateMaterialBytes(pdfHeader).valid, true, "PDF header valid");

  const zipDocxHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
  assert.equal(validateMaterialBytes(zipDocxHeader).valid, true, "ZIP/DOCX header valid");

  const legacyDocHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  assert.equal(validateMaterialBytes(legacyDocHeader).valid, true, "Legacy DOC header valid");

  const textFile = Buffer.from("Engineering Lecture Notes\nSection 1", "utf-8");
  assert.equal(validateMaterialBytes(textFile, "notes.txt").valid, true, "Plain text valid");

  const exeFile = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00", "ascii");
  assert.equal(validateMaterialBytes(exeFile, "notes.pdf").valid, false, "Windows executable masked as PDF rejected");
});

await test("validateVideoBytes validates MP4 and WebM, rejecting executable files", () => {
  const mp4Header = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32]);
  assert.equal(validateVideoBytes(mp4Header).valid, true, "MP4 ftyp valid");

  const webmHeader = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81]);
  assert.equal(validateVideoBytes(webmHeader).valid, true, "WebM EBML valid");

  const badBuffer = Buffer.from("not-a-video-binary-data", "ascii");
  assert.equal(validateVideoBytes(badBuffer).valid, false, "Random data rejected");
});

await test("app/api/admin/upload/route.ts enforces path sanitization and bucket allowlists", () => {
  const uploadCode = fs.readFileSync("app/api/admin/upload/route.ts", "utf-8");
  assert.ok(uploadCode.includes("sanitizeFolder"), "Must sanitize folder parameter");
  assert.ok(uploadCode.includes("sanitizePathComponent"), "Must sanitize academic hierarchy components");
  assert.ok(uploadCode.includes("ALLOWED_BUCKETS.includes"), "Must enforce bucket allowlist on upload and delete");
  assert.ok(uploadCode.includes("validateImageBytes"), "Must validate image magic bytes");
  assert.ok(uploadCode.includes("validateMaterialBytes"), "Must validate material magic bytes");
  assert.ok(uploadCode.includes("validateVideoBytes"), "Must validate video magic bytes");
});

// --- DOMAIN 10: ARCHITECTURAL COMPATIBILITY ---
console.log("\n--- 10. VERCEL SERVERLESS & ARCHITECTURAL SAFETY ---");

await test("All mutation and cryptographic routes declare export const runtime = 'nodejs'", () => {
  const criticalRoutes = [
    "app/api/admin/login/route.ts",
    "app/api/admin/logout/route.ts",
    "app/api/admin/upload/route.ts",
    "app/api/admin/materials/route.ts",
    "app/api/admin/lessons/route.ts",
    "app/api/admin/modules/route.ts",
    "app/api/admin/subjects/route.ts",
    "app/api/admin/videos/route.ts",
    "app/api/admin/works/route.ts",
    "app/api/space/checkout/route.ts",
    "app/api/space/checkin/route.ts",
    "app/api/works/[slug]/flyer/route.ts",
    "app/api/materials/download/route.ts",
  ];

  for (const r of criticalRoutes) {
    const code = fs.readFileSync(r, "utf-8");
    assert.ok(code.includes('export const runtime = "nodejs"'), `Route ${r} must declare runtime = "nodejs"`);
  }
});

console.log("\n=================================================");
console.log(`📊 SECURITY AUDIT RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log("=================================================\n");

if (failed > 0) {
  process.exit(1);
}
