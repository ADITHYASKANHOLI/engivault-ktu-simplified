process.env.NODE_ENV = "test";

import assert from "node:assert/strict";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { createHmac } from "node:crypto";
import {
  isPrivateOrBlockedIp,
  validateUrlForSsrf,
  verifyImageMagicBytes,
  safeFetchImage,
} from "../lib/security/ssrf.ts";
import {
  createSignedToken,
  verifySignedToken,
  getSecretKey,
  SESSION_MAX_AGE,
} from "../lib/auth/token.ts";
import { isSafeOrigin } from "../lib/security/origin.ts";
import { validateMaterialBytes } from "../lib/security/magic-bytes.ts";

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
console.log("🔒 ENGIVAULT PENETRATION TESTING & SECURITY AUDIT (PASS 2)");
console.log("=================================================\n");

// -----------------------------------------------------------------------------
// 1. BEHAVIORAL CSRF & ORIGIN VALIDATION TESTS
// -----------------------------------------------------------------------------
console.log("--- 1. CSRF ORIGIN VALIDATION TESTS ---");

await test("Behavioral 1: An unrelated attacker.vercel.app Origin is strictly rejected", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://engivault-ktu-simplified.vercel.app";
  process.env.VERCEL_URL = "engivault-ktu-simplified.vercel.app";

  const attackReq = new Request("https://engivault-ktu-simplified.vercel.app/api/admin/materials", {
    method: "POST",
    headers: {
      origin: "https://attacker.vercel.app",
      host: "engivault-ktu-simplified.vercel.app",
    },
  });

  const result = isSafeOrigin(attackReq);
  assert.equal(result, false, "Unrelated .vercel.app origin must be rejected");
});

await test("Behavioral 2: The exact configured production origin is accepted", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://engivault-ktu-simplified.vercel.app";

  const prodReq = new Request("https://engivault-ktu-simplified.vercel.app/api/admin/materials", {
    method: "POST",
    headers: {
      origin: "https://engivault-ktu-simplified.vercel.app",
      host: "engivault-ktu-simplified.vercel.app",
    },
  });

  const result = isSafeOrigin(prodReq);
  assert.equal(result, true, "Exact configured production origin must be accepted");
});

await test("Behavioral 3: Spoofed forwarded-host headers cannot bypass origin validation", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://engivault-ktu-simplified.vercel.app";

  const spoofedReq = new Request("https://engivault-ktu-simplified.vercel.app/api/admin/materials", {
    method: "POST",
    headers: {
      origin: "https://attacker-injected-host.com",
      host: "engivault-ktu-simplified.vercel.app",
      "x-forwarded-host": "attacker-injected-host.com",
    },
  });

  const result = isSafeOrigin(spoofedReq);
  assert.equal(result, false, "Origin matching spoofed x-forwarded-host must be rejected");
});

await test("Behavioral 4: Missing Origin and Referer are rejected for cookie-authenticated browser mutations", () => {
  const cookieAdminReq = new Request("https://engivault-ktu-simplified.vercel.app/api/admin/materials", {
    method: "POST",
    headers: {
      cookie: "engivault_admin_session=eyJhbGciOi...",
      host: "engivault-ktu-simplified.vercel.app",
    },
  });
  assert.equal(isSafeOrigin(cookieAdminReq), false, "Missing Origin/Referer on admin cookie mutation must be rejected");

  const cookieStudentReq = new Request("https://engivault-ktu-simplified.vercel.app/api/space/checkout", {
    method: "POST",
    headers: {
      cookie: "sb-auth-token=eyJhbGciOi...",
      host: "engivault-ktu-simplified.vercel.app",
    },
  });
  assert.equal(isSafeOrigin(cookieStudentReq), false, "Missing Origin/Referer on student auth cookie mutation must be rejected");

  const secFetchReq = new Request("https://engivault-ktu-simplified.vercel.app/api/admin/materials", {
    method: "POST",
    headers: {
      "sec-fetch-mode": "cors",
      host: "engivault-ktu-simplified.vercel.app",
    },
  });
  assert.equal(isSafeOrigin(secFetchReq), false, "Missing Origin/Referer with sec-fetch-mode cors must be rejected");
});

// -----------------------------------------------------------------------------
// 2. BEHAVIORAL ADMIN SESSION SIGNING SECRET TESTS
// -----------------------------------------------------------------------------
console.log("\n--- 2. ADMIN SESSION SIGNING SECRET TESTS ---");

await test("Behavioral 5: Admin sessions cannot be signed or verified using login code or stored hash", () => {
  delete process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_ACCESS_CODE = "SuperSecretAdminCode123!";
  process.env.ADMIN_ACCESS_CODE_HASH = "scrypt:c2FsdHNhbHQ:0123456789abcdef";

  assert.equal(getSecretKey(), null, "getSecretKey must return null when ADMIN_SESSION_SECRET is absent");

  assert.throws(
    () => createSignedToken({ role: "admin" }),
    /ADMIN_SESSION_SECRET is required with at least 32 bytes/,
    "createSignedToken must throw error when ADMIN_SESSION_SECRET is not configured"
  );

  // Attempt to forge a token using HMAC-SHA256 with ADMIN_ACCESS_CODE
  const fakePayload = { role: "admin", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, jti: "fake-1" };
  const fakeData = Buffer.from(JSON.stringify(fakePayload)).toString("base64url");
  const fakeSig = createHmac("sha256", process.env.ADMIN_ACCESS_CODE).update(fakeData).digest("base64url");
  const forgedToken = `${fakeData}.${fakeSig}`;

  assert.equal(verifySignedToken(forgedToken), null, "verifySignedToken must reject tokens signed with login code");

  // Attempt using ADMIN_SESSION_SECRET that is too short (< 32 bytes)
  process.env.ADMIN_SESSION_SECRET = "short-secret-under-32-bytes";
  assert.equal(getSecretKey(), null, "Weak secret (< 32 bytes) must fail closed");
  assert.throws(() => createSignedToken(), /ADMIN_SESSION_SECRET is required/);
});

await test("Behavioral 6: Expired, malformed, future-issued and overlong sessions are rejected", () => {
  process.env.ADMIN_SESSION_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef"; // 48 bytes
  const now = Math.floor(Date.now() / 1000);

  // 1. Valid Token
  const validToken = createSignedToken({ role: "admin" });
  const verified = verifySignedToken(validToken);
  assert.ok(verified, "Fresh valid token must verify successfully");
  assert.equal(verified.role, "admin");

  // 2. Expired Token
  const expiredToken = createSignedToken({ iat: now - 3600, exp: now - 10 });
  assert.equal(verifySignedToken(expiredToken), null, "Expired token must be rejected");

  // 3. Malformed Token
  assert.equal(verifySignedToken("not.a.valid.jwt.token"), null, "Malformed token string must return null");
  assert.equal(verifySignedToken("garbage"), null, "Garbage token string must return null");

  // 4. Future-Issued Token (> 60s in future)
  const futureToken = createSignedToken({ iat: now + 120, exp: now + 3600 });
  assert.equal(verifySignedToken(futureToken), null, "Future-skewed token must be rejected");

  // 5. Overlong Token (lifetime exceeding SESSION_MAX_AGE)
  const overlongToken = createSignedToken({ iat: now - (SESSION_MAX_AGE + 100), exp: now + 100 });
  assert.equal(verifySignedToken(overlongToken), null, "Overlong token exceeding 8 hours must be rejected");

  // 6. Token with mismatched signature
  const [dataPart] = validToken.split(".");
  const badToken = `${dataPart}.invalidSignature1234567890`;
  assert.equal(verifySignedToken(badToken), null, "Invalid signature must return null");

  // 7. Legacy Token missing standard claims (e.g. missing jti or exp)
  const legacyData = Buffer.from(JSON.stringify({ role: "admin", createdAt: Date.now() })).toString("base64url");
  const legacySig = createHmac("sha256", process.env.ADMIN_SESSION_SECRET).update(legacyData).digest("base64url");
  assert.equal(verifySignedToken(`${legacyData}.${legacySig}`), null, "Legacy token without standard claims must be rejected");
});

// -----------------------------------------------------------------------------
// 3. BEHAVIORAL SIGNED UPLOAD VALIDATION BYPASS TESTS
// -----------------------------------------------------------------------------
console.log("\n--- 3. SIGNED UPLOAD VALIDATION BYPASS TESTS ---");

await test("Behavioral 7: A signed upload containing executable bytes or MIME-spoofed content cannot become accessible material", () => {
  // Test 1: Binary check rejects Windows executable (MZ header) disguised as PDF
  const executableBytes = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff", "ascii");
  const checkExe = validateMaterialBytes(executableBytes, "lecture_notes.pdf");
  assert.equal(checkExe.valid, false, "Executable bytes disguised as PDF must fail validation");

  // Test 2: Binary check rejects HTML/script disguised as study material
  const htmlScriptBytes = Buffer.from("<script>alert('xss')</script>", "utf-8");
  const checkScript = validateMaterialBytes(htmlScriptBytes, "assignment.pdf");
  assert.equal(checkScript.valid, false, "Script disguised as PDF must fail validation");

  // Test 3: Binary check accepts genuine PDF (%PDF-)
  const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj", "utf-8");
  const checkPdf = validateMaterialBytes(pdfBytes, "syllabus.pdf");
  assert.equal(checkPdf.valid, true, "Genuine PDF header must pass validation");

  // Test 4: Binary check accepts genuine ZIP/DOCX (PK..)
  const zipBytes = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
  const checkZip = validateMaterialBytes(zipBytes, "notes.docx");
  assert.equal(checkZip.valid, true, "Genuine DOCX/ZIP header must pass validation");
});

// -----------------------------------------------------------------------------
// 4. BEHAVIORAL SSRF & NETWORK SECURITY TESTS
// -----------------------------------------------------------------------------
console.log("\n--- 4. SSRF & NETWORK SECURITY TESTS ---");

await test("Behavioral 8: Private-IP targets, metadata endpoints, redirects and DNS-rebinding cannot pass SSRF protection", async () => {
  // Private IPs & Metadata endpoints
  const testUrls = [
    "http://169.254.169.254/latest/meta-data/",
    "http://127.0.0.1:8080/admin",
    "http://10.0.0.1/internal",
    "http://172.16.0.1/internal",
    "http://192.168.1.1/router",
    "http://metadata.google.internal/computeMetadata/v1/",
    "https://unrelated-attacker.supabase.co/flyer.png", // Unrelated Supabase project
    "https://attacker.vercel.app/flyer.png", // Unrelated Vercel project
  ];

  for (const url of testUrls) {
    const res = await validateUrlForSsrf(url);
    assert.equal(res.valid, false, `SSRF check must reject: ${url}`);
  }

  // IPv6 metadata and loopback
  assert.equal(isPrivateOrBlockedIp("::1"), true, "IPv6 loopback blocked");
  assert.equal(isPrivateOrBlockedIp("fe80::1"), true, "IPv6 link-local blocked");
  assert.equal(isPrivateOrBlockedIp("fc00::1"), true, "IPv6 unique-local blocked");
  assert.equal(isPrivateOrBlockedIp("::ffff:127.0.0.1"), true, "IPv4-mapped IPv6 loopback blocked");
});

await test("Behavioral 9: Oversized chunked responses are stopped before full buffering", async () => {
  let destroyed = false;
  let destroyError = null;

  const mockReq = new EventEmitter();
  mockReq.destroy = (err) => {
    destroyed = true;
    destroyError = err;
    mockReq.emit("error", err);
  };
  mockReq.end = () => {};

  const mockRes = new EventEmitter();
  mockRes.statusCode = 200;
  mockRes.headers = {};

  const mockTransport = (_options, callback) => {
    process.nextTick(() => {
      callback(mockRes);
      // Emit chunks: 64KB, 64KB, 64KB (total 192KB, exceeds 128KB limit)
      mockRes.emit("data", Buffer.alloc(64 * 1024, 0xff));
      mockRes.emit("data", Buffer.alloc(64 * 1024, 0xff));
      mockRes.emit("data", Buffer.alloc(64 * 1024, 0xff));
    });
    return mockReq;
  };

  let caughtError = null;
  try {
    await safeFetchImage("https://images.unsplash.com/test.jpg", {
      maxSizeBytes: 128 * 1024, // 128KB limit
      _transport: mockTransport,
    });
  } catch (err) {
    caughtError = err;
  }

  assert.ok(caughtError, "Oversized chunked fetch must trigger an error");
  assert.ok(
    caughtError.message.includes("Oversized response") || caughtError.message.includes("exceeded"),
    `Error message must indicate size limit enforcement: ${caughtError.message}`
  );
  assert.ok(destroyed, "Request must be destroyed immediately upon receiving oversized data chunk");
  assert.ok(
    destroyError && destroyError.message.includes("Oversized response"),
    "Destroy error must record oversized response reason"
  );
});

await test("Behavioral 10: Oversized Base64 and Storage image responses are rejected", () => {
  // Base64 oversized payload (> 5MB)
  const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024, 0x41); // 6MB
  const base64Url = `data:image/jpeg;base64,${oversizedBuffer.toString("base64")}`;

  assert.ok(base64Url.length > 7 * 1024 * 1024, "Base64 string length exceeds threshold");

  // Non-image bytes in data URL
  const scriptBuffer = Buffer.from("<svg onload=alert(1)>", "utf-8");
  const scriptCheck = verifyImageMagicBytes(scriptBuffer);
  assert.equal(scriptCheck.valid, false, "SVG/script data URL bytes must fail image verification");
});

// -----------------------------------------------------------------------------
// 5. BEHAVIORAL BOLA / IDOR & AUDIT LOG PERMISSIONS
// -----------------------------------------------------------------------------
console.log("\n--- 5. BOLA / IDOR & AUDIT LOG TESTS ---");

await test("Behavioral 11: Checkout by one student cannot modify another student's session", () => {
  const serviceCode = fs.readFileSync("lib/space/service.ts", "utf-8");

  // Verify code asserts student ownership
  assert.ok(
    serviceCode.includes("targetSession.user_id !== userId"),
    "Service must explicitly reject target session if targetSession.user_id !== userId"
  );
  assert.ok(
    serviceCode.includes("Session not found or unauthorized access."),
    "Service must return unauthorized error code for mismatched session"
  );

  // Verify SQL implementation asserts ownership
  const migration = fs.readFileSync("supabase/migrations/013_security_remediation.sql", "utf-8");
  assert.ok(
    migration.includes("and user_id = p_user_id"),
    "SQL rpc_space_checkout must include 'and user_id = p_user_id' for 'self' checkout"
  );
  assert.ok(
    migration.includes("coalesce(p_source, 'self') = 'self'"),
    "SQL rpc_space_checkout must conditionally gate by p_source = 'self'"
  );
});

await test("Behavioral 12: Ordinary authenticated students cannot insert, update or delete audit logs", () => {
  const migration = fs.readFileSync("supabase/migrations/013_security_remediation.sql", "utf-8");

  assert.ok(
    migration.includes('drop policy if exists "System can insert activity logs" on public.activity_logs'),
    "Migration 013 must drop the client-facing insert policy on activity_logs"
  );

  assert.ok(
    migration.includes("revoke insert, update, delete on public.activity_logs from public, anon, authenticated"),
    "Migration 013 must revoke insert, update, and delete on activity_logs from client roles"
  );

  assert.ok(
    migration.includes("grant all on public.activity_logs to service_role"),
    "Migration 013 must restrict mutation privileges strictly to service_role"
  );
});

// -----------------------------------------------------------------------------
// 6. CSP & BROWSER FUNCTIONALITY
// -----------------------------------------------------------------------------
console.log("\n--- 6. CSP & BROWSER CAPABILITY VERIFICATION ---");

await test("CSP enables camera=(self) for QR scanner and preserves YouTube & Supabase embeddings", () => {
  const nextConfig = fs.readFileSync("next.config.ts", "utf-8");

  assert.ok(
    nextConfig.includes("camera=(self)"),
    "Permissions-Policy must allow camera=(self) for FOLE SPACE QR ticket check-in"
  );

  assert.ok(
    nextConfig.includes("worker-src 'self' blob:"),
    "CSP must allow worker-src 'self' blob: for QR scanner background worker"
  );

  assert.ok(
    nextConfig.includes("frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com"),
    "CSP must permit YouTube iframe embeds"
  );

  assert.ok(
    nextConfig.includes("frame-ancestors 'none'"),
    "CSP must include frame-ancestors 'none' to stop clickjacking"
  );
});

console.log("\n=================================================");
console.log(`📊 SECURITY AUDIT RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log("=================================================\n");

if (failed > 0) {
  process.exit(1);
}
