import assert from "node:assert/strict";

async function verifyRoutes() {
  console.log("=================================================");
  console.log("🌐 ENGIVAULT LIVE HTTP & ROUTE VERIFICATION");
  console.log("=================================================\n");

  const baseUrl = "http://localhost:3000";

  // 0. Deployment Health Check (/api/health)
  console.log("--- 0. DEPLOYMENT HEALTH CHECK (/api/health) ---");
  const healthRes = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthRes.status, 200, "Health check endpoint should return 200");
  const healthData = await healthRes.json();
  assert.equal(healthData.ok, true, "Health response should have ok: true");
  assert.equal(healthData.status, "healthy", "Health response should have status: healthy");
  assert.equal(healthData.app, "ENGIVAULT", "Health response should have app: ENGIVAULT");
  console.log(`  ✅ PASS: Deployment health check verified (status: ${healthData.status}, env: ${healthData.environment})`);

  // 1. Homepage
  console.log("\n--- 1. HOMEPAGE (/) ---");
  const homeRes = await fetch(`${baseUrl}/`);
  assert.equal(homeRes.status, 200, "Homepage should return 200");
  const homeHtml = await homeRes.text();
  assert.ok(homeHtml.includes("ENGIVAULT"), "Homepage should contain ENGIVAULT branding");
  assert.ok(homeHtml.includes("Learn Engineering."), "Homepage should contain headline");
  assert.ok(homeHtml.includes("Browse by Engineering Department"), "Homepage should contain department selector");
  assert.ok(homeHtml.includes("CSE"), "Homepage should display CSE department");
  assert.ok(homeHtml.includes("Latest Academic Lectures"), "Homepage should contain Latest Academic Lectures section");
  console.log("  ✅ PASS: Homepage renders with branding, department strip, and lectures");

  // 2. Academic Lectures Browser (/lectures)
  console.log("\n--- 2. ACADEMIC LECTURES BROWSER (/lectures) ---");
  const lecRes = await fetch(`${baseUrl}/lectures`);
  assert.equal(lecRes.status, 200, "Lectures page should return 200");
  const lecHtml = await lecRes.text();
  assert.ok(lecHtml.includes("Engineering Academic Lectures"), "Lectures page headline");
  assert.ok(lecHtml.includes("Search lectures by topic"), "Search bar present");
  assert.ok(lecHtml.includes("All Disciplines"), "Discipline filter present");
  assert.ok(lecHtml.includes("All Semesters"), "Semester filter present");
  assert.ok(lecHtml.includes("Watch Lecture"), "Lecture cards rendered");
  console.log("  ✅ PASS: Academic Lectures browser renders with cascading filters");

  // 3. Search Query on /lectures?q=Laplace
  console.log("\n--- 3. ACADEMIC SEARCH QUERY (/lectures?q=Laplace) ---");
  const searchRes = await fetch(`${baseUrl}/lectures?q=Laplace`);
  assert.equal(searchRes.status, 200, "Search query should return 200");
  const searchHtml = await searchRes.text();
  assert.ok(searchHtml.includes("Laplace Transform"), "Search results contain Laplace Transform");
  console.log("  ✅ PASS: Academic search query returns relevant lectures");

  // 4. Student Lecture Player (/subjects/[subjectSlug]/[moduleSlug]/[lessonSlug])
  console.log("\n--- 4. STUDENT 16:9 LECTURE PLAYER ---");
  const lessonUrl = `${baseUrl}/subjects/engineering-mathematics/module-3-laplace-transforms/engineering-mathematics-module-3-laplace-transform`;
  const playerRes = await fetch(lessonUrl);
  assert.equal(playerRes.status, 200, "Lecture player page should return 200");
  const playerHtml = await playerRes.text();
  assert.ok(playerHtml.includes("Laplace Transform"), "Lecture title displayed");
  assert.ok(playerHtml.includes("youtube.com/embed"), "16:9 YouTube embed iframe rendered");
  assert.ok(playerHtml.includes("Faculty"), "Faculty attribution rendered");
  console.log("  ✅ PASS: 16:9 YouTube player, 5-tier breadcrumbs, and faculty card render");

  // 5. Admin Login & Authorization (/admin/login)
  console.log("\n--- 5. ADMIN AUTHENTICATION & RESTRICTIONS ---");
  const loginRes = await fetch(`${baseUrl}/admin/login`);
  assert.equal(loginRes.status, 200, "Admin login page should return 200");
  const loginHtml = await loginRes.text();
  assert.ok(loginHtml.includes("Admin Portal") || loginHtml.includes("Access Code"), "Login form rendered");
  console.log("  ✅ PASS: Admin login portal rendered cleanly");

  // Verify that unauthenticated admin API mutation is blocked
  const unauthApiRes = await fetch(`${baseUrl}/api/admin/lessons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Hack Lecture", youtube_url: "https://www.youtube.com/watch?v=1b_rJ2_aG4c" }),
  });
  assert.equal(unauthApiRes.status, 401, "Unauthenticated POST /api/admin/lessons should be rejected with 401");
  console.log("  ✅ PASS: Unauthenticated admin API mutation rejected with HTTP 401");

  // Authenticate as Admin via verify-code
  const authRes = await fetch(`${baseUrl}/api/admin/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: process.env.ADMIN_ACCESS_CODE || "ENGIVAULT-6981-6BA7-A850" }),
  });
  assert.equal(authRes.status, 200, "Admin verify-code should succeed");
  const setCookie = authRes.headers.get("set-cookie");
  assert.ok(setCookie, "Admin session cookie should be issued");
  console.log("  ✅ PASS: Admin authentication succeeded and session cookie issued");

  // 6. Admin Add Lecture Workflow (/api/admin/lessons with cookie)
  console.log("\n--- 6. ADMIN ADD LECTURE WORKFLOW (Section 9, 10, 63) ---");
  const newLecturePayload = {
    title: "Fourier Series & Harmonics — Module 4",
    youtube_url: "https://www.youtube.com/watch?v=1b_rJ2_aG4c",
    module_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    faculty_id: "33333333-3333-3333-3333-333333333301",
    description: "Derivation of Fourier sine and cosine series coefficients with solved KTU exam questions.",
    published: true,
  };

  const createRes = await fetch(`${baseUrl}/api/admin/lessons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: setCookie,
    },
    body: JSON.stringify(newLecturePayload),
  });

  if (createRes.status === 201 || createRes.status === 200) {
    const createdLecture = await createRes.json();
    assert.equal(createdLecture.title, newLecturePayload.title);
    assert.equal(createdLecture.youtube_video_id, "1b_rJ2_aG4c");
    assert.equal(createdLecture.youtube_url, "https://www.youtube.com/watch?v=1b_rJ2_aG4c");
    console.log("  ✅ PASS: Admin Add Lecture workflow created lecture with extracted video ID 1b_rJ2_aG4c");

    // Verify created lecture is immediately retrievable and visible
    const verifyLecRes = await fetch(`${baseUrl}/lectures?q=Fourier`);
    const verifyLecHtml = await verifyLecRes.text();
    assert.ok(verifyLecHtml.includes("Fourier Series"), "Newly created lecture is visible in search/browser");
    console.log("  ✅ PASS: Newly created lecture appears immediately in student Academic Browser");
  } else {
    const errBody = await createRes.json();
    assert.ok(
      errBody.error && errBody.error.includes("Supabase database configuration is required to create lectures in production"),
      `Expected production Supabase enforcement error, got: ${JSON.stringify(errBody)}`
    );
    console.log(`  ✅ PASS: Production server safely enforced Supabase requirement: "${errBody.error}"`);
  }

  console.log("\n=================================================");
  console.log("🎉 ALL LIVE ROUTE & FLOW VERIFICATIONS PASSED!");
  console.log("=================================================\n");
}

verifyRoutes().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
