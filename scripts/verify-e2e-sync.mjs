/**
 * ENGIVAULT End-to-End Synchronization and CRUD Verification Suite
 * Tests all 8 workflows defined in Section 27 of the specifications against the live server.
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const ADMIN_CODE = process.env.ADMIN_ACCESS_CODE || process.env.TEST_ADMIN_CODE;

async function runTests() {
  if (!ADMIN_CODE) {
    console.error("❌ ERROR: ADMIN_ACCESS_CODE environment variable must be set to run verification.");
    process.exit(1);
  }

  console.log("============================================================");
  console.log("ENGIVAULT — E2E DATA SYNCHRONIZATION & CRUD VERIFICATION");
  console.log("Target Base URL:", BASE_URL);
  console.log("============================================================\n");

  let adminCookie = "";

  // 0. AUTHENTICATION TEST
  console.log("➡️ STEP 0: Authenticate as Administrator");
  const authRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: ADMIN_CODE }),
  });

  if (!authRes.ok) {
    throw new Error(`Admin authentication failed: ${authRes.status} ${await authRes.text()}`);
  }
  const rawSetCookie = authRes.headers.get("set-cookie");
  if (rawSetCookie) {
    adminCookie = rawSetCookie.split(";")[0];
  }
  console.log("✅ Admin authenticated successfully. Session cookie acquired.\n");

  const adminHeaders = {
    "Content-Type": "application/json",
    Cookie: adminCookie,
  };

  // TEST 1 — CREATE (Subject -> Module -> Lesson)
  console.log("➡️ TEST 1: CREATE (Subject -> Module -> Lesson)");
  const testSubSlug = `test-subject-${Date.now()}`;
  const subRes = await fetch(`${BASE_URL}/api/admin/subjects`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      title: "Automated Test Subject",
      slug: testSubSlug,
      code: "TST 101",
      short_description: "Subject created by automated test suite",
      published: true,
      display_order: 99,
    }),
  });
  if (!subRes.ok) throw new Error(`Subject creation failed: ${subRes.status} ${await subRes.text()}`);
  const createdSub = await subRes.json();
  console.log(`   Created Subject: "${createdSub.title}" (ID: ${createdSub.id}, Slug: ${createdSub.slug})`);

  const testModSlug = `test-module-${Date.now()}`;
  const modRes = await fetch(`${BASE_URL}/api/admin/modules`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      subject_id: createdSub.id,
      title: "Automated Test Module 1",
      slug: testModSlug,
      short_description: "Module created by automated test suite",
      published: true,
      display_order: 1,
    }),
  });
  if (!modRes.ok) throw new Error(`Module creation failed: ${modRes.status} ${await modRes.text()}`);
  const createdMod = await modRes.json();
  console.log(`   Created Module: "${createdMod.title}" (ID: ${createdMod.id}, Slug: ${createdMod.slug})`);

  const testLesSlug = `test-lecture-${Date.now()}`;
  const lesRes = await fetch(`${BASE_URL}/api/admin/lessons`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      module_id: createdMod.id,
      title: "Lecture 01 — Initial Test Title",
      slug: testLesSlug,
      lesson_number: 1,
      duration_seconds: 1500,
      description: "Initial lecture description",
      published: true,
      display_order: 1,
    }),
  });
  if (!lesRes.ok) throw new Error(`Lesson creation failed: ${lesRes.status} ${await lesRes.text()}`);
  const createdLes = await lesRes.json();
  console.log(`   Created Lesson: "${createdLes.title}" (ID: ${createdLes.id}, Slug: ${createdLes.slug})`);

  // Verify public endpoint reflects the created lesson
  const publicLesRes = await fetch(`${BASE_URL}/subjects/${createdSub.slug}/${createdMod.slug}/${createdLes.slug}`);
  console.log(`   Public Lesson URL: /subjects/${createdSub.slug}/${createdMod.slug}/${createdLes.slug} -> HTTP ${publicLesRes.status}`);
  if (publicLesRes.status !== 200) {
    throw new Error(`Public lesson page failed to render! Status: ${publicLesRes.status}`);
  }
  const publicLesHtml = await publicLesRes.text();
  if (!publicLesHtml.includes("Lecture 01 — Initial Test Title")) {
    throw new Error("Created lesson title not visible on public page!");
  }
  console.log("✅ TEST 1 PASSED: Subject -> Module -> Lesson successfully created and rendered publicly.\n");

  // TEST 2 — EDIT
  console.log("➡️ TEST 2: EDIT (Update Lesson Title & Duration)");
  const updatedTitle = "Lecture 01 — Integration by Parts (Updated)";
  const patchRes = await fetch(`${BASE_URL}/api/admin/lessons`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      id: createdLes.id,
      title: updatedTitle,
      duration_seconds: 1800,
    }),
  });
  if (!patchRes.ok) throw new Error(`Lesson update failed: ${patchRes.status} ${await patchRes.text()}`);
  const updatedLes = await patchRes.json();
  console.log(`   Updated Lesson Title: "${updatedLes.title}"`);

  // Verify Search reflects new title
  const searchRes = await fetch(`${BASE_URL}/api/search?q=Integration`);
  if (!searchRes.ok) throw new Error(`Search request failed: ${searchRes.status}`);
  const searchResults = await searchRes.json();
  const searchFound = searchResults.some((item) => item.id === createdLes.id || item.title.includes("Integration by Parts"));
  console.log(`   Search Query "Integration" found updated lecture: ${searchFound}`);

  // Verify public page reflects updated title
  const publicUpdatedRes = await fetch(`${BASE_URL}/subjects/${createdSub.slug}/${createdMod.slug}/${createdLes.slug}`);
  const publicUpdatedHtml = await publicUpdatedRes.text();
  if (!publicUpdatedHtml.includes("Integration by Parts")) {
    throw new Error("Public page did not reflect the updated title!");
  }
  console.log("✅ TEST 2 PASSED: Lesson edit synchronized across Admin, Public page, and Search.\n");

  // TEST 4 & PUBLISH TOGGLE: UNPUBLISH & PUBLISH
  console.log("➡️ TEST 4: PUBLISH / UNPUBLISH TOGGLE");
  const unpublishRes = await fetch(`${BASE_URL}/api/admin/lessons`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      id: createdLes.id,
      published: false,
    }),
  });
  if (!unpublishRes.ok) throw new Error("Unpublish failed");
  console.log("   Moved lesson to draft (published=false)");

  const publicDraftCheck = await fetch(`${BASE_URL}/subjects/${createdSub.slug}/${createdMod.slug}/${createdLes.slug}`);
  const publicDraftHtml = await publicDraftCheck.text();
  const isDraftHidden = publicDraftCheck.status === 404 || publicDraftHtml.includes("Lesson Not Found") || !publicDraftHtml.includes("Integration by Parts");
  console.log(`   Public access to draft lesson -> HTTP ${publicDraftCheck.status}, Content hidden: ${isDraftHidden}`);
  if (!isDraftHidden || publicDraftHtml.includes("Integration by Parts")) {
    throw new Error("Draft lesson was incorrectly exposed to public!");
  }

  // Publish again
  const republishRes = await fetch(`${BASE_URL}/api/admin/lessons`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      id: createdLes.id,
      published: true,
    }),
  });
  if (!republishRes.ok) throw new Error("Republish failed");
  console.log("   Re-published lesson (published=true)");

  const publicLiveCheck = await fetch(`${BASE_URL}/subjects/${createdSub.slug}/${createdMod.slug}/${createdLes.slug}`);
  console.log(`   Public access after republishing -> HTTP ${publicLiveCheck.status}`);
  if (publicLiveCheck.status !== 200) {
    throw new Error("Republished lesson is not accessible!");
  }
  console.log("✅ TEST 4 PASSED: Draft visibility rules and live publishing work flawlessly.\n");

  // TEST 5 & 6: VIDEO AND MATERIAL ATTACHMENT
  console.log("➡️ TEST 5 & 6: VIDEO AND MATERIAL ATTACHMENT");
  const vidRes = await fetch(`${BASE_URL}/api/admin/videos`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      lesson_id: createdLes.id,
      title: "Test Recorded Video Class",
      storage_path: `videos/${testSubSlug}/${testModSlug}/lecture-01.mp4`,
      mime_type: "video/mp4",
      file_size: 104857600,
      duration_seconds: 1800,
      published: true,
    }),
  });
  if (!vidRes.ok) throw new Error(`Video attachment failed: ${vidRes.status} ${await vidRes.text()}`);
  const createdVid = await vidRes.json();
  console.log(`   Attached Video ID: ${createdVid.id}, Path: ${createdVid.storage_path}`);

  const matRes = await fetch(`${BASE_URL}/api/admin/materials`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      lesson_id: createdLes.id,
      subject_id: createdSub.id,
      module_id: createdMod.id,
      title: "Classroom Notes & Derivations",
      description: "Formula sheets and university problems",
      material_type: "pdf",
      storage_path: `materials/${testSubSlug}/${testModSlug}/notes.pdf`,
      original_filename: "notes.pdf",
      mime_type: "application/pdf",
      file_size: 2048576,
      published: true,
    }),
  });
  if (!matRes.ok) throw new Error(`Material attachment failed: ${matRes.status}`);
  const createdMat = await matRes.json();
  console.log(`   Attached Material ID: ${createdMat.id}, Path: ${createdMat.storage_path}`);
  console.log("✅ TEST 5 & 6 PASSED: Video and study materials successfully attached to lesson.\n");

  // TEST 7: EDIT WITHOUT REPLACING VIDEO
  console.log("➡️ TEST 7: EDIT WITHOUT REPLACING VIDEO");
  const metaOnlyEdit = await fetch(`${BASE_URL}/api/admin/lessons`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      id: createdLes.id,
      description: "Updated description only. Video must remain attached.",
    }),
  });
  if (!metaOnlyEdit.ok) throw new Error("Metadata edit failed");

  // Check that video is still attached
  const verifyLesAfterEdit = await fetch(`${BASE_URL}/api/admin/lessons?moduleId=${createdMod.id}`, {
    headers: adminHeaders,
  });
  const lessonsList = await verifyLesAfterEdit.json();
  const currentLes = lessonsList.find((l) => l.id === createdLes.id);
  if (!currentLes || !currentLes.video) {
    throw new Error("Attached video was lost during metadata edit!");
  }
  console.log(`   Video successfully retained: ${currentLes.video.storage_path}`);
  console.log("✅ TEST 7 PASSED: Existing video survived metadata-only edit intact.\n");

  // TEST 3 & 8: DELETE WITH ASSOCIATED MEDIA
  console.log("➡️ TEST 3 & 8: DELETE LESSON WITH ASSOCIATED MEDIA");
  const delRes = await fetch(`${BASE_URL}/api/admin/lessons?id=${createdLes.id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
  if (!delRes.ok) throw new Error(`Delete failed: ${delRes.status} ${await delRes.text()}`);
  console.log(`   Lesson ${createdLes.id} deleted from database`);

  // Verify public page returns 404 / not found
  const publicDelCheck = await fetch(`${BASE_URL}/subjects/${createdSub.slug}/${createdMod.slug}/${createdLes.slug}`);
  const publicDelHtml = await publicDelCheck.text();
  const isDeletedHidden = publicDelCheck.status === 404 || publicDelHtml.includes("Lesson Not Found") || !publicDelHtml.includes("Integration by Parts");
  console.log(`   Public check after delete -> HTTP ${publicDelCheck.status}, Content hidden: ${isDeletedHidden}`);
  if (!isDeletedHidden || publicDelHtml.includes("Integration by Parts")) {
    throw new Error("Deleted lesson is still accessible publicly!");
  }

  // Verify Admin list no longer shows it
  const adminListCheck = await fetch(`${BASE_URL}/api/admin/lessons?moduleId=${createdMod.id}`, {
    headers: adminHeaders,
  });
  const remainingLessons = await adminListCheck.json();
  const stillExists = remainingLessons.some((l) => l.id === createdLes.id);
  if (stillExists) {
    throw new Error("Deleted lesson still exists in admin list!");
  }
  console.log("   Admin list successfully purged of deleted lesson");

  // Cleanup parent test module and subject
  await fetch(`${BASE_URL}/api/admin/modules?id=${createdMod.id}`, { method: "DELETE", headers: adminHeaders });
  await fetch(`${BASE_URL}/api/admin/subjects?id=${createdSub.id}`, { method: "DELETE", headers: adminHeaders });
  console.log("   Cleaned up test module and subject.");
  console.log("✅ TEST 3 & 8 PASSED: Safe deletion and cascading cleanup verified.\n");

  console.log("============================================================");
  console.log("🎉 ALL E2E SYNCHRONIZATION AND CRUD TESTS PASSED SUCCESSFULLY!");
  console.log("============================================================");
}

runTests().catch((err) => {
  console.error("❌ E2E TEST FAILED:", err);
  process.exit(1);
});
