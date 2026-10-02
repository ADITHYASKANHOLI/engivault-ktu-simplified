/**
 * ENGIVAULT Regression Test Suite for Root Cause #1 and Root Cause #2
 * Run via: npx tsx scripts/verify-root-causes.mjs
 */

import { validateAdminConfig, createAdminClient } from "../lib/supabase/admin";
import {
  getAllSubjects,
  getAllModules,
  getModuleById,
  getAllLessons,
  isLocalFallbackAllowed,
} from "../lib/queries";
import { isSupabaseConfigured } from "../lib/supabase/client";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("============================================================");
  console.log("ENGIVAULT — ROOT CAUSE #1 & #2 REGRESSION VERIFICATION");
  console.log("============================================================\n");

  const originalEnv = { ...process.env };

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Root Cause #2 — Admin Service Role Key & Startup Validation
  // --------------------------------------------------------------------------
  console.log("➡️ TEST GROUP 1: Startup Validation & Service Role Key Enforcement");

  // 1a. Unset service key fails fast
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";

  try {
    createAdminClient();
    assert(false, "createAdminClient() should throw when SUPABASE_SERVICE_ROLE_KEY is unset");
  } catch (err) {
    assert(
      err.message.includes("SUPABASE_SERVICE_ROLE_KEY is missing or set to placeholder"),
      `createAdminClient() throws descriptive error when key is unset: "${err.message}"`
    );
  }

  // 1b. Literal placeholder key fails fast
  process.env.SUPABASE_SERVICE_ROLE_KEY = "placeholder-service-key";
  try {
    createAdminClient();
    assert(false, "createAdminClient() should throw when key is placeholder-service-key");
  } catch (err) {
    assert(
      err.message.includes("SUPABASE_SERVICE_ROLE_KEY is missing or set to placeholder"),
      `createAdminClient() throws when key is placeholder: "${err.message}"`
    );
  }

  // 1c. Dummy repo template string "your-service-role-key" fails fast
  process.env.SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key";
  try {
    createAdminClient();
    assert(false, "createAdminClient() should throw when key is your-service-role-key");
  } catch (err) {
    assert(
      err.message.includes("SUPABASE_SERVICE_ROLE_KEY is missing or set to placeholder"),
      `createAdminClient() throws when key is template string: "${err.message}"`
    );
  }

  // 1d. Key carrying 'anon' role claim fails fast with RLS warning
  const jwtHeader = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
  const anonPayload = Buffer.from(JSON.stringify({ role: "anon", ref: "test-project" })).toString("base64");
  process.env.SUPABASE_SERVICE_ROLE_KEY = `${jwtHeader}.${anonPayload}.signature`;

  try {
    validateAdminConfig();
    assert(false, "validateAdminConfig() should throw when key has 'anon' role");
  } catch (err) {
    assert(
      err.message.includes("invalid role claim: 'anon'") && err.message.includes("Row-Level Security (RLS)"),
      `validateAdminConfig() detects anon key and warns about RLS bypass: "${err.message}"`
    );
  }

  // 1e. Project ref mismatch fails fast
  const mismatchPayload = Buffer.from(JSON.stringify({ role: "service_role", ref: "other-project" })).toString("base64");
  process.env.SUPABASE_SERVICE_ROLE_KEY = `${jwtHeader}.${mismatchPayload}.signature`;

  try {
    validateAdminConfig();
    assert(false, "validateAdminConfig() should throw when project ref does not match URL");
  } catch (err) {
    assert(
      err.message.includes("does not match NEXT_PUBLIC_SUPABASE_URL project ref"),
      `validateAdminConfig() detects project ref mismatch: "${err.message}"`
    );
  }

  // 1f. Valid service_role key passes validation
  const validPayload = Buffer.from(JSON.stringify({ role: "service_role", ref: "test-project" })).toString("base64");
  process.env.SUPABASE_SERVICE_ROLE_KEY = `${jwtHeader}.${validPayload}.signature`;

  try {
    const config = validateAdminConfig();
    assert(
      config.role === "service_role" && config.projectRef === "test-project",
      "validateAdminConfig() succeeds with valid service_role JWT"
    );
  } catch (err) {
    assert(false, `validateAdminConfig() threw unexpected error: ${err.message}`);
  }

  console.log("");

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Root Cause #1 — Fallback Store Gating & Error Surfacing
  // --------------------------------------------------------------------------
  console.log("➡️ TEST GROUP 2: Fallback Store Gating & Error Surfacing");

  // 2a. With Supabase configured and fallback disabled (default): query error MUST throw
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://unreachable-host.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = `${jwtHeader}.${Buffer.from(JSON.stringify({ role: "service_role", ref: "unreachable-host" })).toString("base64")}.signature`;
  delete process.env.ENGIVAULT_ALLOW_LOCAL_FALLBACK;

  assert(isSupabaseConfigured() === true, "isSupabaseConfigured() is true with valid test URLs");
  assert(isLocalFallbackAllowed() === false, "isLocalFallbackAllowed() defaults to false when Supabase is configured");

  try {
    await getAllSubjects();
    assert(false, "getAllSubjects() should throw on query error when fallback is disabled");
  } catch (err) {
    assert(
      err.message.includes("Failed to fetch all subjects from Supabase") || err.message.includes("fetch failed") || err.message.includes("ENOTFOUND"),
      `getAllSubjects() properly threw and surfaced real error: "${err.message.slice(0, 80)}..."`
    );
  }

  // 2b. Same test for getAllModules: must throw, not return fallback
  try {
    await getAllModules();
    assert(false, "getAllModules() should throw on query error when fallback is disabled");
  } catch (err) {
    assert(
      err.message.includes("Failed to fetch modules from Supabase") || err.message.includes("fetch failed") || err.message.includes("ENOTFOUND"),
      `getAllModules() properly threw: "${err.message.slice(0, 80)}..."`
    );
  }

  // 2c. Same test for getAllLessons: must throw, not return fallback
  try {
    await getAllLessons();
    assert(false, "getAllLessons() should throw on query error when fallback is disabled");
  } catch (err) {
    assert(
      err.message.includes("Failed to fetch lessons from Supabase") || err.message.includes("fetch failed") || err.message.includes("ENOTFOUND"),
      `getAllLessons() properly threw: "${err.message.slice(0, 80)}..."`
    );
  }

  console.log("");

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Opt-in Fallback Flag (ENGIVAULT_ALLOW_LOCAL_FALLBACK=true)
  // --------------------------------------------------------------------------
  console.log("➡️ TEST GROUP 3: Opt-in Fallback Flag (ENGIVAULT_ALLOW_LOCAL_FALLBACK=true)");

  process.env.ENGIVAULT_ALLOW_LOCAL_FALLBACK = "true";
  assert(isLocalFallbackAllowed() === true, "isLocalFallbackAllowed() is true when flag is explicitly 'true'");

  try {
    const subjects = await getAllSubjects();
    assert(
      Array.isArray(subjects) && subjects.length > 0,
      `getAllSubjects() safely falls back only when ENGIVAULT_ALLOW_LOCAL_FALLBACK=true (returned ${subjects.length} items)`
    );
  } catch (err) {
    assert(false, `getAllSubjects() threw unexpectedly with fallback allowed: ${err.message}`);
  }

  console.log("");

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Zero-Setup Offline Dev Mode (!isSupabaseConfigured())
  // --------------------------------------------------------------------------
  console.log("➡️ TEST GROUP 4: Zero-Setup Offline Dev Mode (!isSupabaseConfigured())");

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key";
  delete process.env.ENGIVAULT_ALLOW_LOCAL_FALLBACK;

  assert(isSupabaseConfigured() === false, "isSupabaseConfigured() is false with default repo placeholder values");
  assert(isLocalFallbackAllowed() === true, "isLocalFallbackAllowed() is true when Supabase is unconfigured (offline dev)");

  const offlineSubjects = await getAllSubjects();
  assert(
    Array.isArray(offlineSubjects) && offlineSubjects.length > 0,
    `offline getAllSubjects() returns local items (${offlineSubjects.length} items)`
  );

  console.log("");

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Secondary Bug Fix in getModuleById (Subject Relation Attached)
  // --------------------------------------------------------------------------
  console.log("➡️ TEST GROUP 5: Secondary Bug Fix in getModuleById (Subject Relation)");

  const sampleModuleId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const moduleResult = await getModuleById(sampleModuleId);

  assert(Boolean(moduleResult), `getModuleById('${sampleModuleId}') found module`);
  assert(Boolean(moduleResult?.subject), "getModuleById() attaches .subject relation in fallback return");
  assert(
    moduleResult?.subject?.slug === "engineering-mathematics",
    `moduleResult.subject.slug is '${moduleResult?.subject?.slug}', ensuring revalidateContentHierarchy cache invalidation functions`
  );

  console.log("\n============================================================");
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("============================================================\n");

  // Restore environment
  for (const k of Object.keys(process.env)) {
    if (!(k in originalEnv)) delete process.env[k];
  }
  Object.assign(process.env, originalEnv);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered an unhandled error:", err);
  process.exit(1);
});
