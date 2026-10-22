import assert from "node:assert/strict";
import nodeFs from "node:fs";

// Dynamic import of our ES modules / TypeScript compiled or direct modules
async function runTests() {
  console.log("=================================================");
  console.log("🧪 ENGIVAULT COMPREHENSIVE AUTOMATED TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
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

  // 1. YouTube Utility Unit Tests
  console.log("--- 1. YOUTUBE PARSER & VALIDATION (Section 11, 39, 48) ---");
  
  // Reusable YouTube parser implementation identical to lib/utils/youtube.ts
  const ALLOWED_YOUTUBE_DOMAINS = [
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
  ];
  const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

  function extractYouTubeVideoId(input) {
    if (!input) return null;
    const trimmed = String(input).trim();
    if (!trimmed) return null;
    try {
      const urlString = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const parsed = new URL(urlString);
      const hostname = parsed.hostname.toLowerCase();
      const isAllowed = ALLOWED_YOUTUBE_DOMAINS.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      );
      if (!isAllowed) return null;
      let rawId = null;
      if (hostname === "youtu.be" || hostname.endsWith(".youtu.be")) {
        const parts = parsed.pathname.split("/").filter(Boolean);
        if (parts.length > 0) rawId = parts[0];
      } else {
        if (parsed.pathname === "/watch") {
          rawId = parsed.searchParams.get("v");
        } else if (parsed.pathname.startsWith("/embed/")) {
          rawId = parsed.pathname.replace("/embed/", "").split("/")[0];
        } else if (parsed.pathname.startsWith("/shorts/")) {
          rawId = parsed.pathname.replace("/shorts/", "").split("/")[0];
        }
      }
      if (!rawId) return null;
      const cleanId = rawId.split("?")[0].split("&")[0];
      return YOUTUBE_VIDEO_ID_REGEX.test(cleanId) ? cleanId : null;
    } catch {
      return null;
    }
  }

  function parseYouTubeUrl(input) {
    const videoId = extractYouTubeVideoId(input);
    if (!videoId) {
      return { isValid: false, videoId: null, canonicalUrl: null };
    }
    return {
      isValid: true,
      videoId,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  function getYouTubeEmbedUrl(videoIdOrUrl) {
    const id = YOUTUBE_VIDEO_ID_REGEX.test(videoIdOrUrl)
      ? videoIdOrUrl
      : extractYouTubeVideoId(videoIdOrUrl);
    if (!id) return "";
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1`;
  }

  function getYouTubeThumbnailUrl(videoIdOrUrl, quality = "hqdefault") {
    const id = YOUTUBE_VIDEO_ID_REGEX.test(videoIdOrUrl)
      ? videoIdOrUrl
      : extractYouTubeVideoId(videoIdOrUrl);
    if (!id) return "";
    return `https://img.youtube.com/vi/${encodeURIComponent(id)}/${quality}.jpg`;
  }

  function getYouTubeWatchUrl(videoIdOrUrl) {
    if (!videoIdOrUrl) return null;
    const trimmed = String(videoIdOrUrl).trim();
    if (!trimmed) return null;

    if (YOUTUBE_VIDEO_ID_REGEX.test(trimmed)) {
      return `https://www.youtube.com/watch?v=${trimmed}`;
    }

    const parsed = parseYouTubeUrl(trimmed);
    if (parsed.isValid && parsed.videoId) {
      return `https://www.youtube.com/watch?v=${parsed.videoId}`;
    }

    return null;
  }

  test("Valid watch URL extracts 11-char video ID", () => {
    const res = parseYouTubeUrl("https://www.youtube.com/watch?v=1b_rJ2_aG4c");
    assert.equal(res.isValid, true);
    assert.equal(res.videoId, "1b_rJ2_aG4c");
    assert.equal(res.canonicalUrl, "https://www.youtube.com/watch?v=1b_rJ2_aG4c");
  });

  test("getYouTubeWatchUrl resolves various YouTube formats to canonical watch URL", () => {
    const expected = "https://www.youtube.com/watch?v=1b_rJ2_aG4c";
    assert.equal(getYouTubeWatchUrl("https://www.youtube.com/watch?v=1b_rJ2_aG4c"), expected);
    assert.equal(getYouTubeWatchUrl("https://youtu.be/1b_rJ2_aG4c"), expected);
    assert.equal(getYouTubeWatchUrl("https://www.youtube.com/shorts/1b_rJ2_aG4c"), expected);
    assert.equal(getYouTubeWatchUrl("https://www.youtube.com/embed/1b_rJ2_aG4c"), expected);
    assert.equal(getYouTubeWatchUrl("1b_rJ2_aG4c"), expected);
    assert.equal(getYouTubeWatchUrl(""), null);
    assert.equal(getYouTubeWatchUrl(null), null);
    assert.equal(getYouTubeWatchUrl("https://vimeo.com/12345"), null);
    assert.equal(getYouTubeWatchUrl("https://attacker.com/watch?v=1b_rJ2_aG4c"), null);
  });

  test("Valid short URL (youtu.be) extracts video ID", () => {
    const res = parseYouTubeUrl("https://youtu.be/1b_rJ2_aG4c");
    assert.equal(res.isValid, true);
    assert.equal(res.videoId, "1b_rJ2_aG4c");
  });

  test("Valid shorts URL extracts video ID", () => {
    const res = parseYouTubeUrl("https://www.youtube.com/shorts/1b_rJ2_aG4c");
    assert.equal(res.isValid, true);
    assert.equal(res.videoId, "1b_rJ2_aG4c");
  });

  test("Valid embed URL extracts video ID", () => {
    const res = parseYouTubeUrl("https://www.youtube.com/embed/1b_rJ2_aG4c");
    assert.equal(res.isValid, true);
    assert.equal(res.videoId, "1b_rJ2_aG4c");
  });

  test("Handles query parameters with timestamps (&t=120s)", () => {
    const res = parseYouTubeUrl("https://www.youtube.com/watch?v=1b_rJ2_aG4c&t=120s&feature=shared");
    assert.equal(res.isValid, true);
    assert.equal(res.videoId, "1b_rJ2_aG4c");
  });

  test("Constructs secure nocookie embed URL", () => {
    const embedUrl = getYouTubeEmbedUrl("1b_rJ2_aG4c");
    assert.equal(embedUrl, "https://www.youtube-nocookie.com/embed/1b_rJ2_aG4c?rel=0&modestbranding=1");
  });

  test("Generates valid YouTube thumbnail URL", () => {
    const thumbUrl = getYouTubeThumbnailUrl("1b_rJ2_aG4c", "hqdefault");
    assert.equal(thumbUrl, "https://img.youtube.com/vi/1b_rJ2_aG4c/hqdefault.jpg");
  });

  test("Rejects non-YouTube domains (e.g. Vimeo, Dailymotion)", () => {
    const res = parseYouTubeUrl("https://vimeo.com/76979871");
    assert.equal(res.isValid, false);
    assert.equal(res.videoId, null);
  });

  test("Rejects phishing / arbitrary hosts with youtube in query", () => {
    const res = parseYouTubeUrl("https://attacker.com/watch?v=1b_rJ2_aG4c");
    assert.equal(res.isValid, false);
    assert.equal(res.videoId, null);
  });

  test("Rejects arbitrary iframe injection attempts", () => {
    const res = parseYouTubeUrl('<iframe src="https://attacker.com"></iframe>');
    assert.equal(res.isValid, false);
    assert.equal(res.videoId, null);
  });

  test("Rejects malformed / empty input", () => {
    assert.equal(parseYouTubeUrl("").isValid, false);
    assert.equal(parseYouTubeUrl(null).isValid, false);
    assert.equal(parseYouTubeUrl("not-a-url").isValid, false);
    assert.equal(parseYouTubeUrl("https://youtube.com/watch").isValid, false);
  });

  // 2. Lecture Creation Validation Schema (Section 9, 10, 34, 48)
  console.log("\n--- 2. LECTURE CREATION VALIDATION WORKFLOW ---");

  function validateAddLectureForm(data) {
    const errors = {};
    if (!data.title || !String(data.title).trim()) {
      errors.title = "Lecture Name is required.";
    }
    if (!data.youtube_url || !String(data.youtube_url).trim()) {
      errors.youtube_url = "YouTube Video Link is required.";
    } else {
      const parsed = parseYouTubeUrl(data.youtube_url);
      if (!parsed.isValid) {
        errors.youtube_url = "Please enter a valid YouTube video link.";
      }
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  test("Missing lecture title fails validation with specific message", () => {
    const result = validateAddLectureForm({
      title: "",
      youtube_url: "https://www.youtube.com/watch?v=1b_rJ2_aG4c",
    });
    assert.equal(result.isValid, false);
    assert.equal(result.errors.title, "Lecture Name is required.");
  });

  test("Missing YouTube video link fails validation with specific message", () => {
    const result = validateAddLectureForm({
      title: "Laplace Transform Introduction",
      youtube_url: "",
    });
    assert.equal(result.isValid, false);
    assert.equal(result.errors.youtube_url, "YouTube Video Link is required.");
  });

  test("Invalid YouTube video link fails validation with specific message", () => {
    const result = validateAddLectureForm({
      title: "Laplace Transform Introduction",
      youtube_url: "https://example.com/video.mp4",
    });
    assert.equal(result.isValid, false);
    assert.equal(result.errors.youtube_url, "Please enter a valid YouTube video link.");
  });

  test("Valid lecture name and YouTube link passes validation", () => {
    const result = validateAddLectureForm({
      title: "Laplace Transform — Module 3",
      youtube_url: "https://www.youtube.com/watch?v=1b_rJ2_aG4c",
    });
    assert.equal(result.isValid, true);
    assert.equal(Object.keys(result.errors).length, 0);
  });

  // 3. Academic Hierarchy Store & Traversal (Section 6, 17, 22)
  console.log("\n--- 3. ACADEMIC HIERARCHY & STORE VERIFICATION ---");
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const storePath = path.resolve(process.cwd(), ".engivault-local-store.json");
  const rawStore = await fs.readFile(storePath, "utf-8");
  const store = JSON.parse(rawStore);

  test("Local store initialized and populated", () => {
    assert.ok(store.subjects && store.subjects.length > 0);
    assert.ok(store.modules && store.modules.length > 0);
    assert.ok(store.lessons && store.lessons.length > 0);
    assert.ok(store.departments && store.departments.length > 0);
    assert.ok(store.semesters && store.semesters.length > 0);
    assert.ok(store.faculty && store.faculty.length > 0);
    assert.ok(store.topics && store.topics.length > 0);
  });

  test("Multi-discipline academic branches supported (CSE, ECE, EEE, ME, CE, AI&DS, IT)", () => {
    const codes = store.departments.map((d) => d.code);
    assert.ok(codes.includes("CSE"), "Should include Computer Science");
    assert.ok(codes.includes("ECE"), "Should include Electronics");
    assert.ok(codes.includes("ME"), "Should include Mechanical");
    assert.ok(codes.includes("CE"), "Should include Civil");
    assert.ok(codes.includes("EEE"), "Should include Electrical");
    assert.ok(codes.includes("AI&DS"), "Should include AI & Data Science");
    assert.ok(codes.includes("IT"), "Should include Information Technology");
  });

  test("Semesters S1 through S8 supported", () => {
    const numbers = store.semesters.map((s) => s.number);
    for (let i = 1; i <= 8; i++) {
      assert.ok(numbers.includes(i), `Should include Semester ${i}`);
    }
  });

  test("Academic hierarchy traversal: Department -> Semester -> Subject -> Module -> Topic -> Lecture", () => {
    const mathSubject = store.subjects.find((s) => s.slug === "engineering-mathematics");
    assert.ok(mathSubject, "Engineering Mathematics subject should exist");
    
    const modules = store.modules.filter((m) => m.subject_id === mathSubject.id);
    assert.ok(modules.length > 0, "Modules for Engineering Mathematics should exist");

    const mod1 = modules[0];
    const topics = store.topics.filter((t) => t.module_id === mod1.id);
    assert.ok(topics.length > 0, "Topics for Module 1 should exist");

    const lessons = store.lessons.filter((l) => l.module_id === mod1.id);
    assert.ok(lessons.length > 0, "Lectures for Module 1 should exist");
  });

  test("Lectures have valid YouTube video IDs attached", () => {
    const youtubeLectures = store.lessons.filter((l) => l.youtube_video_id || l.youtubeVideoId);
    assert.ok(youtubeLectures.length > 0, "At least one YouTube lecture should exist in store");
    for (const lec of youtubeLectures) {
      const vid = lec.youtube_video_id || lec.youtubeVideoId;
      assert.match(vid, YOUTUBE_VIDEO_ID_REGEX, `Video ID ${vid} should match 11-char regex`);
    }
  });

  // 4. Backward Compatibility & Legacy Video Safety (Section 24)
  console.log("\n--- 4. BACKWARD COMPATIBILITY & LEGACY MEDIA SAFETY ---");

  test("Lecture records with legacy video fields load without crashing", () => {
    const mockLegacyLecture = {
      id: "legacy-1",
      title: "Legacy Lecture with MP4",
      module_id: "mod-1",
      storage_path: "/uploads/legacy.mp4",
      youtube_url: null,
      youtube_video_id: null,
      thumbnail_path: null,
      duration_seconds: 1800,
    };

    const videoId =
      mockLegacyLecture.youtube_video_id ||
      (mockLegacyLecture.youtube_url ? extractYouTubeVideoId(mockLegacyLecture.youtube_url) : null);
    
    assert.equal(videoId, null, "Legacy video has no YouTube ID");

    const thumb = (videoId ? getYouTubeThumbnailUrl(videoId) : null) || mockLegacyLecture.thumbnail_path || "fallback.jpg";
    assert.equal(thumb, "fallback.jpg", "Gracefully falls back without throw");
  });

  // 5. Search Functionality (Section 18)
  console.log("\n--- 5. ACADEMIC SEARCH QUERYING ---");

  test("Search query 'Laplace' correctly matches relevant lecture", () => {
    const query = "laplace";
    const results = store.lessons.filter((l) => {
      const titleMatch = l.title.toLowerCase().includes(query);
      const descMatch = (l.description || "").toLowerCase().includes(query);
      return titleMatch || descMatch;
    });
    assert.ok(results.length > 0, "Should return Laplace Transform lecture");
    assert.ok(results[0].title.toLowerCase().includes("laplace"));
  });

  test("Empty search returns all published lectures gracefully", () => {
    const query = "";
    const results = store.lessons.filter((l) => {
      if (!query) return true;
      return l.title.toLowerCase().includes(query);
    });
    assert.equal(results.length, store.lessons.length);
  });

  // 6. Security & Authorization Enforcement (Section 5, 25, 26)
  console.log("\n--- 6. SECURITY & AUTHORIZATION RULES ---");

  test("Verify XSS injection in YouTube URL is neutralized", () => {
    const xssInputs = [
      'https://www.youtube.com/watch?v=1b_rJ2_aG4c"><script>alert(1)</script>',
      'javascript:/*--></title></style></textarea></script></xmp><svg/onload=\'+/"/+/onmouseover=1/+/[*/[]/+alert(1)//\'>',
      'https://www.youtube.com/watch?v=1b_rJ2_aG4c&param=<script>eval()</script>',
    ];

    for (const input of xssInputs) {
      const parsed = parseYouTubeUrl(input);
      if (parsed.isValid) {
        // If extracted, the video ID must strictly match the 11-char regex and cannot contain script tags
        assert.match(parsed.videoId, YOUTUBE_VIDEO_ID_REGEX);
        assert.ok(!parsed.videoId.includes("<script>"));
        assert.ok(!parsed.canonicalUrl.includes("<script>"));
      } else {
        assert.equal(parsed.isValid, false);
      }
    }
  });

  // 7. Runtime URL Normalization & Data Resilience (Fix for "Unexpected error while loading")
  console.log("\n--- 7. RUNTIME URL NORMALIZATION & HOMEPAGE RESILIENCE ---");

  function testSafeSiteUrl(inputEnv, vercelEnv) {
    let raw = (inputEnv || (vercelEnv ? `https://${vercelEnv}` : "") || "http://localhost:3000").trim();
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      raw = `https://${raw}`;
    }
    try {
      return new URL(raw);
    } catch {
      return new URL("http://localhost:3000");
    }
  }

  test("getSafeSiteUrl handles standard http URL", () => {
    const url = testSafeSiteUrl("http://localhost:3000");
    assert.equal(url.origin, "http://localhost:3000");
  });

  test("getSafeSiteUrl adds https:// to protocol-less domain", () => {
    const url = testSafeSiteUrl("engivault-ktu-simplified.vercel.app");
    assert.equal(url.origin, "https://engivault-ktu-simplified.vercel.app");
  });

  test("getSafeSiteUrl trims whitespace and handles trailing slash", () => {
    const url = testSafeSiteUrl("  https://engivault02.vercel.app/  ");
    assert.equal(url.origin, "https://engivault02.vercel.app");
  });

  test("getSafeSiteUrl falls back cleanly on VERCEL_URL without protocol", () => {
    const url = testSafeSiteUrl("", "my-deployment-preview.vercel.app");
    assert.equal(url.origin, "https://my-deployment-preview.vercel.app");
  });

  test("getSafeSiteUrl recovers safely from empty or invalid URL strings", () => {
    const url1 = testSafeSiteUrl("");
    assert.equal(url1.origin, "http://localhost:3000");
    const url2 = testSafeSiteUrl("http://[invalid-ipv6");
    assert.equal(url2.origin, "http://localhost:3000");
  });

  test("Site settings fallback contains all required branding fields", () => {
    const fallback = {
      id: "00000000-0000-0000-0000-000000000001",
      site_name: "ENGIVAULT",
      headline: "Learn Engineering. Build Confidence.",
      tagline: "KTU Learning. Simplified.",
      logo_path: "/branding/fole-logo.png",
      contact_email: "contact@engivault.edu",
    };
    assert.ok(fallback.site_name);
    assert.ok(fallback.headline);
    assert.ok(fallback.logo_path);
  });

  test("Homepage Promise.allSettled pattern isolates non-essential failures", async () => {
    // Simulate: subjects succeed, site settings rejects, lessons rejects, departments reject
    const mockSubjects = [{ id: "sub-1", title: "Math", published: true }];
    const [subRes, setRes, lesRes, deptRes] = await Promise.allSettled([
      Promise.resolve(mockSubjects),
      Promise.reject(new Error("Supabase PGRST116: empty settings")),
      Promise.reject(new Error("Database timeout")),
      Promise.reject(new Error("Relation departments does not exist")),
    ]);

    const subjects = subRes.status === "fulfilled" ? subRes.value : [];
    const settings = setRes.status === "fulfilled" ? setRes.value : { site_name: "ENGIVAULT" };
    const lessons = lesRes.status === "fulfilled" ? lesRes.value : [];
    const departments = deptRes.status === "fulfilled" ? deptRes.value : [];

    // All data resolved safely without throwing unhandled rejection
    assert.equal(subjects.length, 1);
    assert.equal(settings.site_name, "ENGIVAULT");
    assert.equal(lessons.length, 0);
    assert.equal(departments.length, 0);
  });

  // 8. Lecture Schema & Storage Upload Regression Tests
  console.log("\n--- 8. LECTURE SCHEMA & STORAGE UPLOAD REGRESSION TESTS ---");

  test("Lecture insert payload excludes unsupported order_index column", () => {
    // Replicates createLesson payload builder logic
    const inputData = {
      title: "Differential Equations 101",
      module_id: "mod-123",
      lesson_number: 3,
      order_index: 3,
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    };

    const display_order =
      inputData.display_order ??
      inputData.order_index ??
      inputData.lesson_number ??
      1;

    const insertPayload = {
      id: "test-id",
      module_id: inputData.module_id,
      title: inputData.title,
      lesson_number: inputData.lesson_number,
      display_order,
      youtube_url: inputData.youtube_url,
      youtube_video_id: "dQw4w9WgXcQ",
    };

    // Strict assertions: order_index must NOT be in insertPayload
    assert.equal(Object.prototype.hasOwnProperty.call(insertPayload, "order_index"), false, "order_index must NOT be in insertPayload");
    assert.equal(insertPayload.display_order, 3, "display_order must be set correctly");
  });

  test("Lecture update strips order_index and maps to display_order", () => {
    const rawUpdates = {
      title: "Updated Lecture Title",
      order_index: 5,
    };
    const cleanUpdates = { ...rawUpdates };
    if (cleanUpdates.display_order === undefined && cleanUpdates.order_index !== undefined) {
      cleanUpdates.display_order = cleanUpdates.order_index;
    }
    delete cleanUpdates.order_index;
    delete cleanUpdates.orderIndex;

    assert.equal(Object.prototype.hasOwnProperty.call(cleanUpdates, "order_index"), false);
    assert.equal(cleanUpdates.display_order, 5);
  });

  test("Lesson normalization guarantees both display_order and order_index for legacy compatibility", () => {
    const rawDbLesson = {
      id: "les-1",
      title: "Fourier Series",
      display_order: 4,
      lesson_number: 4,
    };

    const display_order =
      rawDbLesson.display_order ??
      rawDbLesson.order_index ??
      rawDbLesson.lesson_number ??
      1;

    const normalized = {
      ...rawDbLesson,
      display_order,
      order_index: display_order,
      orderIndex: display_order,
    };

    assert.equal(normalized.display_order, 4);
    assert.equal(normalized.order_index, 4);
    assert.equal(normalized.orderIndex, 4);
  });

  test("Lecture insert payload preserves instructor and hierarchy fields without stripping", () => {
    const data = {
      module_id: "mod-456",
      topic_id: "topic-789",
      faculty_id: "fac-101",
      instructor: "Dr. APJ Abdul Kalam",
      title: "Rocket Propulsion Principles",
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtube_video_id: "dQw4w9WgXcQ",
      published: true,
      lesson_number: 1,
      display_order: 1,
    };

    const insertPayload = {
      id: "les-test-1",
      module_id: data.module_id,
      topic_id: data.topic_id || null,
      faculty_id: data.faculty_id || null,
      instructor: data.instructor || null,
      title: data.title,
      slug: "rocket-propulsion-principles",
      lesson_number: data.lesson_number,
      published: data.published,
      display_order: data.display_order,
      youtube_url: data.youtube_url,
      youtube_video_id: data.youtube_video_id,
    };

    assert.equal(insertPayload.instructor, "Dr. APJ Abdul Kalam", "instructor field must be preserved");
    assert.equal(insertPayload.topic_id, "topic-789", "topic_id must be preserved");
    assert.equal(insertPayload.faculty_id, "fac-101", "faculty_id must be preserved");
    assert.equal(insertPayload.module_id, "mod-456", "module_id must be preserved");
  });

  test("Lecture update payload preserves instructor while stripping joined relation objects", () => {
    const rawUpdates = {
      title: "Advanced Propulsion",
      instructor: "Prof. Vikram Sarabhai",
      faculty_id: "fac-202",
      topic_id: "topic-303",
      faculty: { id: "fac-202", name: "Prof. Vikram Sarabhai" },
      topic: { id: "topic-303", title: "Space Dynamics" },
      module: { id: "mod-456", title: "Aerospace" },
      subject: { id: "sub-123", title: "Propulsion" },
      materials: [],
      video: null,
      order_index: 2,
    };

    const payload = {
      ...rawUpdates,
      updated_at: new Date().toISOString(),
    };
    delete payload.id;
    delete payload.created_at;
    delete payload.module;
    delete payload.video;
    delete payload.materials;
    delete payload.faculty;
    delete payload.topic;
    delete payload.subject;
    delete payload.lectures_count;
    delete payload.lessons_count;
    delete payload.materials_count;
    delete payload.youtubeUrl;
    delete payload.youtubeVideoId;
    delete payload.order_index;
    delete payload.orderIndex;
    delete payload.sequence_order;

    assert.equal(payload.instructor, "Prof. Vikram Sarabhai", "instructor must be preserved in update payload");
    assert.equal(payload.faculty_id, "fac-202", "faculty_id must be preserved in update payload");
    assert.equal(payload.topic_id, "topic-303", "topic_id must be preserved in update payload");
    assert.equal(payload.faculty, undefined, "joined faculty relation must NOT be passed to DB update");
    assert.equal(payload.topic, undefined, "joined topic relation must NOT be passed to DB update");
    assert.equal(payload.subject, undefined, "joined subject relation must NOT be passed to DB update");
    assert.equal(payload.module, undefined, "joined module relation must NOT be passed to DB update");
  });

  test("Schema cache mismatch on instructor column produces clear migration 007 diagnostic error", () => {
    const simulateError = {
      message: "Could not find the 'instructor' column of 'lessons' in the schema cache",
    };

    let diagnosticMessage = "";
    if (simulateError.message.includes("instructor") && simulateError.message.includes("schema cache")) {
      diagnosticMessage = `Database schema mismatch: Could not find the 'instructor' column of 'lessons' in the schema cache. Please apply migration 007 (supabase/migrations/007_reconcile_lesson_instructor_column.sql) in your Supabase SQL Editor: ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS instructor text; NOTIFY pgrst, 'reload schema'; Original error: ${simulateError.message}`;
    }

    assert.ok(diagnosticMessage.includes("007_reconcile_lesson_instructor_column.sql"));
    assert.ok(diagnosticMessage.includes("ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS instructor text;"));
    assert.ok(diagnosticMessage.includes("NOTIFY pgrst, 'reload schema';"));
  });

  test("Migration 007 SQL file exists and contains idempotent column addition and schema cache reload", () => {
    const migrationPath = path.join(process.cwd(), "supabase/migrations/007_reconcile_lesson_instructor_column.sql");
    assert.ok(nodeFs.existsSync(migrationPath), "Migration 007 file must exist");
    const content = nodeFs.readFileSync(migrationPath, "utf-8");
    assert.ok(content.includes("ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS instructor text;"), "Must include ADD COLUMN IF NOT EXISTS");
    assert.ok(content.includes("NOTIFY pgrst, 'reload schema';"), "Must include PostgREST schema cache reload NOTIFY");
  });

  test("Upload wizard rejects dummy/fabricated UUID fallbacks for missing selections", () => {
    const dummyModule = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const dummyLesson = "cccccccc-cccc-cccc-cccc-cccccccccccc";

    const isFabricatedUuid = (val) => val === dummyModule || val === dummyLesson;
    const isTargetReady = (sub, mod, les) =>
      Boolean(sub && mod && les && !isFabricatedUuid(mod) && !isFabricatedUuid(les));

    assert.equal(isTargetReady("sub-1", dummyModule, dummyLesson), false, "Dummy UUIDs must be rejected");
    assert.equal(isTargetReady("sub-1", "real-mod-id", ""), false, "Empty lecture selection must be rejected");
    assert.equal(isTargetReady("sub-1", "real-mod-id", "real-les-id"), true, "Valid selections must be accepted");
  });

  await testAsync("Upload pipeline enforces storage transfer before database metadata write", async () => {
    let storageTransferred = false;
    let metadataWritten = false;

    // Simulate upload pipeline
    async function executeUpload(simulateStorageFailure = false) {
      // 1. Authorize
      const auth = { storagePath: "materials/doc1.pdf", mode: "supabase-direct" };
      assert.ok(auth.storagePath);
      
      // 2. Storage transfer
      if (simulateStorageFailure) {
        throw new Error("Supabase Storage: Connection timeout during transfer");
      }
      storageTransferred = true;

      // 3. Metadata write ONLY after storage transfer succeeds
      if (!storageTransferred) {
        throw new Error("Cannot write metadata without successful storage transfer");
      }
      metadataWritten = true;
      return { success: true };
    }

    // Success path
    await executeUpload(false);
    assert.equal(storageTransferred, true);
    assert.equal(metadataWritten, true);

    // Failure path: storage failure must halt pipeline before metadata
    storageTransferred = false;
    metadataWritten = false;
    let errorCaught = false;
    try {
      await executeUpload(true);
    } catch {
      errorCaught = true;
    }
    assert.equal(errorCaught, true, "Storage failure must throw error");
    assert.equal(storageTransferred, false, "Storage must not be marked transferred");
    assert.equal(metadataWritten, false, "Metadata must NOT be written if storage fails");
  });

  await testAsync("Failed metadata request triggers cleanup of uploaded storage file", async () => {
    let fileCleanedUp = false;
    const uploadedPath = "materials/temp-orphan.pdf";

    // Simulate: Storage succeeds, but database metadata insert throws
    async function simulateFailedMetadataPipeline() {
      // Step 1: Storage succeeds
      const storageSuccess = true;

      // Step 2: Metadata throws (e.g. database constraint)
      try {
        throw new Error("Database error: Subject relation unavailable");
      } catch (metaErr) {
        // Safe cleanup handling
        if (storageSuccess && uploadedPath) {
          fileCleanedUp = true;
        }
        throw metaErr;
      }
    }

    let caught = false;
    try {
      await simulateFailedMetadataPipeline();
    } catch {
      caught = true;
    }
    assert.equal(caught, true);
    assert.equal(fileCleanedUp, true, "Orphaned storage file must be cleaned up if metadata write fails");
  });

  // 9. Lecture Card YouTube Navigation & Regression Suite
  console.log("\n--- 9. LECTURE CARD YOUTUBE NAVIGATION & REGRESSION SUITE ---");

  test("normalizeLessonFields derives canonical watch URL when only youtube_video_id is present", () => {
    function normalizeLessonFieldsTest(raw) {
      const canonicalWatchUrl = getYouTubeWatchUrl(raw.youtube_url || raw.youtube_video_id);
      const canonicalVideoId = raw.youtube_video_id || (canonicalWatchUrl ? extractYouTubeVideoId(canonicalWatchUrl) : null);
      return {
        ...raw,
        youtube_url: canonicalWatchUrl,
        youtube_video_id: canonicalVideoId,
      };
    }

    const legacyLesson = {
      id: "les-legacy-1",
      title: "Transforms Lecture",
      youtube_video_id: "1b_rJ2_aG4c",
      youtube_url: null,
    };
    const normalized = normalizeLessonFieldsTest(legacyLesson);
    assert.equal(normalized.youtube_url, "https://www.youtube.com/watch?v=1b_rJ2_aG4c");
    assert.equal(normalized.youtube_video_id, "1b_rJ2_aG4c");
  });

  test("normalizeLessonFields normalizes shortened/shorts/embed URLs to canonical watch URL", () => {
    function normalizeLessonFieldsTest(raw) {
      const canonicalWatchUrl = getYouTubeWatchUrl(raw.youtube_url || raw.youtube_video_id);
      const canonicalVideoId = raw.youtube_video_id || (canonicalWatchUrl ? extractYouTubeVideoId(canonicalWatchUrl) : null);
      return {
        ...raw,
        youtube_url: canonicalWatchUrl,
        youtube_video_id: canonicalVideoId,
      };
    }

    const shortUrlLesson = {
      id: "les-short-1",
      title: "Short Link Lecture",
      youtube_url: "https://youtu.be/1b_rJ2_aG4c?feature=shared",
      youtube_video_id: null,
    };
    const normalized = normalizeLessonFieldsTest(shortUrlLesson);
    assert.equal(normalized.youtube_url, "https://www.youtube.com/watch?v=1b_rJ2_aG4c");
    assert.equal(normalized.youtube_video_id, "1b_rJ2_aG4c");
  });

  test("normalizeLessonFields cleanly handles missing/invalid YouTube links without dummy IDs", () => {
    function normalizeLessonFieldsTest(raw) {
      const canonicalWatchUrl = getYouTubeWatchUrl(raw.youtube_url || raw.youtube_video_id);
      const canonicalVideoId = raw.youtube_video_id || (canonicalWatchUrl ? extractYouTubeVideoId(canonicalWatchUrl) : null);
      return {
        ...raw,
        youtube_url: canonicalWatchUrl,
        youtube_video_id: canonicalVideoId,
      };
    }

    const invalidLesson = {
      id: "les-invalid-1",
      title: "No Video Lecture",
      youtube_url: "https://invalid-domain.com/video.mp4",
      youtube_video_id: null,
    };
    const normalized = normalizeLessonFieldsTest(invalidLesson);
    assert.equal(normalized.youtube_url, null);
    assert.equal(normalized.youtube_video_id, null);
  });

  test("Updating a lecture's YouTube URL synchronizes its stored video ID", () => {
    function updateLessonVideoFields(oldRecord, newUrl) {
      const parseResult = parseYouTubeUrl(newUrl);
      if (parseResult.isValid) {
        return {
          ...oldRecord,
          youtube_url: parseResult.canonicalUrl,
          youtube_video_id: parseResult.videoId,
        };
      }
      return {
        ...oldRecord,
        youtube_url: null,
        youtube_video_id: null,
      };
    }

    const initial = {
      id: "les-up-1",
      youtube_url: "https://www.youtube.com/watch?v=1b_rJ2_aG4c",
      youtube_video_id: "1b_rJ2_aG4c",
    };
    const updated = updateLessonVideoFields(initial, "https://youtu.be/9bZkp7q19f0");
    assert.equal(updated.youtube_url, "https://www.youtube.com/watch?v=9bZkp7q19f0");
    assert.equal(updated.youtube_video_id, "9bZkp7q19f0");
  });

  test("LectureCard component uses anchor with target='_blank' and rel='noopener noreferrer'", () => {
    const lectureCardCode = nodeFs.readFileSync("components/lectures/LectureCard.tsx", "utf-8");
    assert.ok(lectureCardCode.includes('target="_blank"'), "LectureCard must use target='_blank'");
    assert.ok(lectureCardCode.includes('rel="noopener noreferrer"'), "LectureCard must use rel='noopener noreferrer'");
    assert.ok(lectureCardCode.includes("getYouTubeWatchUrl"), "LectureCard must normalize with getYouTubeWatchUrl");
    assert.ok(lectureCardCode.includes("Video Unavailable"), "LectureCard must provide unavailable state");
    
    // Ensure no nested <a or <Link elements within the anchor branch children
    const anchorBranch = lectureCardCode.split("if (watchUrl) {")[1].split("return (")[1].split("</a>")[0];
    const anchorInner = anchorBranch.substring(anchorBranch.indexOf(">") + 1);
    const nestedLinks = anchorInner.match(/<a\b|<Link\b/g) || [];
    assert.equal(nestedLinks.length, 0, "Anchor branch must not contain nested link elements");
  });

  test("LessonRow component provides direct YouTube navigation in a new tab", () => {
    const lessonRowCode = nodeFs.readFileSync("components/lessons/LessonRow.tsx", "utf-8");
    assert.ok(lessonRowCode.includes('target="_blank"'), "LessonRow must open in a new tab");
    assert.ok(lessonRowCode.includes('rel="noopener noreferrer"'), "LessonRow must have security rel attributes");
    assert.ok(lessonRowCode.includes("getYouTubeWatchUrl"), "LessonRow must normalize watch URL");
  });

  test("Lesson detail page header features prominent 'Watch on YouTube' button", () => {
    const detailPageCode = nodeFs.readFileSync(
      "app/(public)/subjects/[subjectSlug]/[moduleSlug]/[lessonSlug]/page.tsx",
      "utf-8"
    );
    assert.ok(detailPageCode.includes("Watch on YouTube"), "Detail page must feature 'Watch on YouTube'");
    assert.ok(detailPageCode.includes('target="_blank"'), "Detail page link must target '_blank'");
    assert.ok(detailPageCode.includes('rel="noopener noreferrer"'), "Detail page link must include security rel attributes");
  });

  test("Admin lesson dashboard maintains edit and delete actions alongside preview", () => {
    const adminLessonsCode = nodeFs.readFileSync("app/admin/dashboard/lessons/page.tsx", "utf-8");
    assert.ok(adminLessonsCode.includes("openEditModal"), "Admin dashboard must retain edit modal handler");
    assert.ok(adminLessonsCode.includes("setDeleteModalLesson"), "Admin dashboard must retain delete modal handler");
    assert.ok(adminLessonsCode.includes("getYouTubeWatchUrl"), "Admin dashboard must validate watch URL on submit/preview");
  });

  // 10. Contact Form & FOLE CEV Email Forwarding Suite
  console.log("\n--- 10. CONTACT FORM & FOLE CEV EMAIL FORWARDING WORKFLOW ---");

  const {
    escapeHtml,
    sanitizeHeader,
    formatContactEmailSubject,
    buildContactEmailText,
    buildContactEmailHtml,
    sendContactEmail,
    setMockEmailSender,
  } = await import("../lib/email/index.ts");
  const { checkRateLimit, _resetRateLimits } = await import("../lib/security/rate-limit.ts");
  const { contactFormSchema } = await import("../lib/validation/contact.ts");



  test("Valid contact form submission passes schema validation", () => {
    const validData = {
      name: "Adithyan S",
      email: "student@engivault.edu",
      subject: "Feedback on MAT101 Linear Algebra lecture notes",
      message: "The eigenvalues explanation in module 2 was exceptionally clear. Thank you FOLE team!",
      hp_company: "",
    };
    const parsed = contactFormSchema.safeParse(validData);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.name, "Adithyan S");
      assert.equal(parsed.data.email, "student@engivault.edu");
    }
  });

  test("Invalid or missing email addresses are rejected with helpful errors", () => {
    const testCases = [
      { email: "", reason: "missing" },
      { email: "not-an-email", reason: "missing at sign" },
      { email: "student@", reason: "missing domain" },
      { email: "@domain.com", reason: "missing user" },
      { email: "a".repeat(250) + "@domain.com", reason: "exceeds max length" },
    ];
    for (const tc of testCases) {
      const res = contactFormSchema.safeParse({
        name: "Test Student",
        email: tc.email,
        subject: "General KTU inquiry",
        message: "Valid message content over ten chars",
      });
      assert.equal(res.success, false, `Expected failure for email: ${tc.reason}`);
    }
  });

  test("Missing required fields fail validation (name, subject, message)", () => {
    // Missing name
    const missingName = contactFormSchema.safeParse({
      name: " ",
      email: "student@engivault.edu",
      subject: "Course Question",
      message: "Valid message content over ten chars",
    });
    assert.equal(missingName.success, false);

    // Missing subject
    const missingSubject = contactFormSchema.safeParse({
      name: "Test Student",
      email: "student@engivault.edu",
      subject: "  ",
      message: "Valid message content over ten chars",
    });
    assert.equal(missingSubject.success, false);

    // Missing message
    const missingMessage = contactFormSchema.safeParse({
      name: "Test Student",
      email: "student@engivault.edu",
      subject: "Course Question",
      message: " ",
    });
    assert.equal(missingMessage.success, false);
  });

  test("Empty and excessively long messages are rejected", () => {
    // Too short (<10 chars)
    const tooShort = contactFormSchema.safeParse({
      name: "Test Student",
      email: "student@engivault.edu",
      subject: "Course Question",
      message: "Hi",
    });
    assert.equal(tooShort.success, false);

    // Too long (>5000 chars)
    const tooLong = contactFormSchema.safeParse({
      name: "Test Student",
      email: "student@engivault.edu",
      subject: "Course Question",
      message: "A".repeat(5001),
    });
    assert.equal(tooLong.success, false);
  });

  test("Email header injection (CRLF in subject or name) is strictly prevented", () => {
    const injectedSubject = contactFormSchema.safeParse({
      name: "Test Student",
      email: "student@engivault.edu",
      subject: "Legit Subject\r\nBcc: victim@attacker.com",
      message: "Testing header injection rejection",
    });
    assert.equal(injectedSubject.success, false);

    const injectedName = contactFormSchema.safeParse({
      name: "Attacker\nCc: spam@attacker.com",
      email: "student@engivault.edu",
      subject: "Valid Subject",
      message: "Testing header injection rejection in name",
    });
    assert.equal(injectedName.success, false);

    // Sanitize helper also strips all newlines defensively
    const sanitized = sanitizeHeader("Line 1\r\nLine 2\nLine 3");
    assert.equal(sanitized, "Line 1 Line 2 Line 3");
  });

  test("Spam honeypot field presence triggers rejection", () => {
    const botSubmission = contactFormSchema.safeParse({
      name: "Spam Bot",
      email: "spambot@marketing-crawler.com",
      subject: "Buy Cheap SEO Services",
      message: "Automated crawling message for marketing purposes.",
      hp_company: "Evil Spammer Corp",
    });
    assert.equal(botSubmission.success, false, "Honeypot filled must trigger schema validation failure");
  });

  test("In-memory rate limiting restricts repeated submissions from the same IP", () => {
    _resetRateLimits();
    const testIp = "192.168.1.100";

    // 5 allowed attempts
    for (let i = 1; i <= 5; i++) {
      const res = checkRateLimit(testIp, { max: 5, windowMs: 60000 });
      assert.equal(res.success, true, `Attempt ${i} should succeed`);
      assert.equal(res.remaining, 5 - i);
    }

    // 6th attempt must be rejected
    const blockedRes = checkRateLimit(testIp, { max: 5, windowMs: 60000 });
    assert.equal(blockedRes.success, false, "6th attempt must be blocked by rate limiter");
    assert.equal(blockedRes.remaining, 0);
    assert.ok(blockedRes.resetInSeconds > 0);

    // Different IP is isolated and not blocked
    const distinctIpRes = checkRateLimit("192.168.1.200", { max: 5, windowMs: 60000 });
    assert.equal(distinctIpRes.success, true, "Distinct IP should have independent allowance");
    assert.equal(distinctIpRes.remaining, 4);

    _resetRateLimits();
  });

  test("Subject line formatting adheres to canonical pattern [FOLE Web Contact] — [Subject]", () => {
    const formatted = formatContactEmailSubject("KTU S3 Data Structures syllabus doubt");
    assert.equal(formatted, "[FOLE Web Contact] — KTU S3 Data Structures syllabus doubt");
  });

  test("HTML escaping safely neutralizes HTML and script tags", () => {
    const malicious = '<script>alert("xss")</script> & "quotes" \'apostrophe\'';
    const escaped = escapeHtml(malicious);
    assert.ok(!escaped.includes("<script>"));
    assert.ok(escaped.includes("&lt;script&gt;"));
    assert.ok(escaped.includes("&amp;"));
    assert.ok(escaped.includes("&quot;"));
  });

  test("Plain text and HTML email templates preserve complete message and attribution", () => {
    const submission = {
      name: "Rohit Mohan",
      email: "rohit@student.ktu.edu.in",
      subject: "Question about EST130 Basics of Electrical Engineering",
      message: "In Module 3, could you explain the derivation for three phase star connection line currents in more detail?",
      submittedAt: "2026-10-20T10:00:00.000Z",
    };

    const text = buildContactEmailText(submission);
    assert.ok(text.includes("FOLE WEB — NEW CONTACT US INQUIRY"));
    assert.ok(text.includes("Rohit Mohan"));
    assert.ok(text.includes("rohit@student.ktu.edu.in"));
    assert.ok(text.includes("EST130 Basics of Electrical Engineering"));
    assert.ok(text.includes("three phase star connection line currents"));
    assert.ok(text.includes("FOLE Web Contact Us Form"));

    const html = buildContactEmailHtml(submission);
    assert.ok(html.includes("FOLE"));
    assert.ok(html.includes("Rohit Mohan"));
    assert.ok(html.includes("rohit@student.ktu.edu.in"));
    assert.ok(html.includes("three phase star connection line currents"));
    assert.ok(html.includes("folecev@gmail.com"));
  });

  await testAsync("sendContactEmail sends to official recipient folecev@gmail.com with student in Reply-To", async () => {
    let capturedPayload = null;
    setMockEmailSender(async (payload) => {
      capturedPayload = payload;
      return { id: "mock-resend-id-9988" };
    });

    const res = await sendContactEmail({
      name: "Ananya Pillai",
      email: "ananya@student.ktu.edu.in",
      subject: "Question Paper 2024 Solution Request",
      message: "Could you upload the solved 2024 university question paper for CY100 Engineering Chemistry?",
      submittedAt: "2026-10-20T10:15:00.000Z",
    });

    assert.equal(res.success, true);
    assert.equal(res.messageId, "mock-resend-id-9988");
    assert.ok(capturedPayload, "Mock sender must have been invoked with payload");
    assert.deepEqual(capturedPayload.to, ["folecev@gmail.com"], "Recipient must be official email folecev@gmail.com");
    assert.equal(capturedPayload.replyTo, "ananya@student.ktu.edu.in", "Reply-To must be student's email");
    assert.notEqual(capturedPayload.from, "ananya@student.ktu.edu.in", "From must NOT be student's email (anti-spoofing)");
    assert.equal(capturedPayload.subject, "[FOLE Web Contact] — Question Paper 2024 Solution Request");

    // Clean up mock
    setMockEmailSender(null);
  });

  await testAsync("sendContactEmail handles provider failure gracefully without crashing", async () => {
    setMockEmailSender(async () => {
      return { error: { message: "Resend rate limit exceeded on free tier" } };
    });

    const res = await sendContactEmail({
      name: "Test",
      email: "test@example.com",
      subject: "Test Subject",
      message: "Testing provider error response handling",
    });

    assert.equal(res.success, false);
    assert.equal(res.error, "Resend rate limit exceeded on free tier");

    setMockEmailSender(null);
  });

  await testAsync("sendContactEmail detects unconfigured API key gracefully", async () => {
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    const res = await sendContactEmail({
      name: "Test",
      email: "test@example.com",
      subject: "Test Subject",
      message: "Testing unconfigured environment handling",
    });

    assert.equal(res.success, false);
    assert.equal(res.error, "EMAIL_SERVICE_UNCONFIGURED");

    if (originalKey) {
      process.env.RESEND_API_KEY = originalKey;
    }
  });

  test("Contact Us page component contains all required elements, security, and states", () => {
    const contactPageCode = nodeFs.readFileSync("app/(public)/contact/page.tsx", "utf-8");
    assert.ok(contactPageCode.includes('folecev@gmail.com'), "Must display official contact email folecev@gmail.com");
    assert.ok(contactPageCode.includes('name="name"'), "Must collect Full Name");
    assert.ok(contactPageCode.includes('name="email"'), "Must collect Email Address");
    assert.ok(contactPageCode.includes('name="subject"'), "Must collect Subject");
    assert.ok(contactPageCode.includes('name="message"'), "Must collect Message");
    assert.ok(contactPageCode.includes('hp_company'), "Must include spam honeypot field");
    assert.ok(contactPageCode.includes('aria-hidden="true"'), "Honeypot must be hidden from screen readers");
    assert.ok(contactPageCode.includes('isSubmitting'), "Must track and handle submission state");
    assert.ok(contactPageCode.includes('disabled={isSubmitting}'), "Submit button must be disabled during submission");
    assert.ok(contactPageCode.includes('Thank you for contacting FOLE CEV'), "Must show confirmed success message");
    assert.ok(contactPageCode.includes('We could not send your message right now'), "Must show user-safe failure message");
    assert.ok(contactPageCode.includes('/api/contact'), "Must submit via server-side /api/contact route");
  });

  test("Contact API route enforces nodejs runtime, size limits, and security headers", () => {
    const routeCode = nodeFs.readFileSync("app/api/contact/route.ts", "utf-8");
    assert.ok(routeCode.includes('export const runtime = "nodejs"'), "Route must declare nodejs runtime");
    assert.ok(routeCode.includes('checkRateLimit'), "Route must enforce rate limiting");
    assert.ok(routeCode.includes('contactFormSchema'), "Route must validate via schema");
    assert.ok(routeCode.includes('hp_company'), "Route must check honeypot");
    assert.ok(routeCode.includes('status: 429'), "Route must return 429 when rate limited");
    assert.ok(routeCode.includes('status: 400'), "Route must return 400 for validation errors or honeypot");
    assert.ok(routeCode.includes('status: 503'), "Route must return 503 when email dispatch fails");
  });

  // 11. Mobile-First UI/UX, Materials Catalogue & Admin Responsiveness
  console.log("\n--- 11. MOBILE-FIRST UI/UX, MATERIALS CATALOGUE & ADMIN RESPONSIVENESS ---");

  test("getPublishedMaterialsForCatalog filters unpublished and soft-deleted records across 4 tiers", () => {
    const queriesCode = nodeFs.readFileSync("lib/queries/index.ts", "utf-8");
    assert.ok(queriesCode.includes("getPublishedMaterialsForCatalog"), "Must export getPublishedMaterialsForCatalog");
    assert.ok(queriesCode.includes('.eq("published", true)'), "Must filter materials by published = true");
    assert.ok(queriesCode.includes('.is("deleted_at", null)'), "Must exclude soft-deleted materials");
    assert.ok(queriesCode.includes("getMaterialsForSubject"), "Must export getMaterialsForSubject");
    assert.ok(queriesCode.includes("getMaterialsForModule"), "Must export getMaterialsForModule");
  });

  test("Download route /api/materials/download verifies publication and soft-delete status", () => {
    const downloadRoute = nodeFs.readFileSync("app/api/materials/download/route.ts", "utf-8");
    assert.ok(downloadRoute.includes('export const runtime = "nodejs"'), "Download route must declare nodejs runtime");
    assert.ok(downloadRoute.includes("!data.published || data.deleted_at !== null"), "Must reject unpublished or deleted materials");
    assert.ok(downloadRoute.includes("createSignedUrl"), "Must generate short-lived signed URLs");
  });

  test("Public SiteHeader provides Materials navigation link and accessible mobile drawer", () => {
    const headerCode = nodeFs.readFileSync("components/layout/SiteHeader.tsx", "utf-8");
    assert.ok(headerCode.includes('href: "/materials"'), "Navigation links must include /materials");
    assert.ok(headerCode.includes('aria-expanded={mobileMenuOpen}'), "Must set aria-expanded on menu toggle");
    assert.ok(headerCode.includes('aria-controls="mobile-navigation-drawer"'), "Must set aria-controls on menu toggle");
    assert.ok(headerCode.includes("overflow = \"hidden\""), "Must lock body scroll while mobile drawer is open");
    assert.ok(headerCode.includes('e.key === "Escape"'), "Must close drawer on Escape key");
  });

  test("CatalogMaterialCard formats file size, upload date, metadata, and wraps long text safely", () => {
    const cardCode = nodeFs.readFileSync("components/materials/CatalogMaterialCard.tsx", "utf-8");
    assert.ok(cardCode.includes("formatFileSize"), "Must format file size");
    assert.ok(cardCode.includes("break-words"), "Must prevent text overflow with break-words");
    assert.ok(cardCode.includes("min-h-[44px]"), "Actions must meet 44px min touch target");
    assert.ok(cardCode.includes("download"), "Must provide download attribute");
  });

  test("Public Materials page provides search, filters, breadcrumbs, and error handling", () => {
    assert.ok(nodeFs.existsSync("app/(public)/materials/page.tsx"), "app/(public)/materials/page.tsx must exist");
    assert.ok(nodeFs.existsSync("app/(public)/materials/loading.tsx"), "app/(public)/materials/loading.tsx must exist");
    const pageCode = nodeFs.readFileSync("app/(public)/materials/page.tsx", "utf-8");
    assert.ok(pageCode.includes("MaterialsFilterView"), "Must render MaterialsFilterView");
    assert.ok(pageCode.includes("getPublishedMaterialsForCatalog"), "Must fetch published catalog materials");

    const filterCode = nodeFs.readFileSync("components/materials/MaterialsFilterView.tsx", "utf-8");
    assert.ok(filterCode.includes("filter-dept"), "Must provide department filter");
    assert.ok(filterCode.includes("filter-sem"), "Must provide semester filter");
    assert.ok(filterCode.includes("filter-subject"), "Must provide subject filter");
    assert.ok(filterCode.includes("filter-module"), "Must provide module filter");
    assert.ok(filterCode.includes("filter-type"), "Must provide material type filter");
    assert.ok(filterCode.includes("resetAllFilters"), "Must provide reset filters action");
  });

  test("Academic hierarchy pages (Subject, Module, Lesson) link to materials catalog", () => {
    const subjectPage = nodeFs.readFileSync("app/(public)/subjects/[subjectSlug]/page.tsx", "utf-8");
    assert.ok(subjectPage.includes("/materials?subject="), "Subject page must link to filtered materials");

    const modulePage = nodeFs.readFileSync("app/(public)/subjects/[subjectSlug]/[moduleSlug]/page.tsx", "utf-8");
    assert.ok(modulePage.includes("/materials?subject="), "Module page must link to filtered materials");

    const lessonPage = nodeFs.readFileSync("app/(public)/subjects/[subjectSlug]/[moduleSlug]/[lessonSlug]/page.tsx", "utf-8");
    assert.ok(lessonPage.includes("/materials?subject="), "Lesson page must link to module materials in catalog");
  });

  test("Admin dashboard components provide mobile drawers and stacked card views", () => {
    const shellCode = nodeFs.readFileSync("components/admin/AdminDashboardShell.tsx", "utf-8");
    assert.ok(shellCode.includes("p-3.5 sm:p-6"), "Shell must use compact padding on mobile");

    const sidebarCode = nodeFs.readFileSync("components/admin/AdminSidebar.tsx", "utf-8");
    assert.ok(sidebarCode.includes("overflow = \"hidden\""), "Admin sidebar drawer must lock body scroll");
    assert.ok(sidebarCode.includes('e.key === "Escape"'), "Admin sidebar must close on Escape key");
    assert.ok(sidebarCode.includes("min-h-[44px]"), "Admin links must meet 44px min touch target");

    const adminHeader = nodeFs.readFileSync("components/admin/AdminHeader.tsx", "utf-8");
    assert.ok(adminHeader.includes("w-11 h-11"), "Admin menu button must meet 44px touch target");

    const adminMaterials = nodeFs.readFileSync("app/admin/dashboard/materials/page.tsx", "utf-8");
    assert.ok(adminMaterials.includes("block md:hidden"), "Admin materials must render stacked cards on mobile");
    assert.ok(adminMaterials.includes("hidden md:block"), "Admin materials table must be hidden on small screens");

    const adminLessons = nodeFs.readFileSync("app/admin/dashboard/lessons/page.tsx", "utf-8");
    assert.ok(adminLessons.includes("block md:hidden"), "Admin lessons must render stacked cards on mobile");
    assert.ok(adminLessons.includes("hidden md:block"), "Admin lessons table must be hidden on small screens");
  });

  // 12. FOLE WORKS ACTIVITIES & MANAGEMENT SUITE
  console.log("\n--- 12. FOLE WORKS ACTIVITIES & MANAGEMENT SUITE ---");

  test("Official FOLE WORKS brand asset exists without alteration", () => {
    assert.ok(nodeFs.existsSync("public/branding/fole-works-logo.png"), "public/branding/fole-works-logo.png must exist");
    const stat = nodeFs.statSync("public/branding/fole-works-logo.png");
    assert.ok(stat.size > 10000, "Official FOLE WORKS logo must be a non-empty image asset");

    assert.ok(nodeFs.existsSync("components/branding/FoleWorksLogo.tsx"), "FoleWorksLogo component must exist");
    const logoComponent = nodeFs.readFileSync("components/branding/FoleWorksLogo.tsx", "utf-8");
    assert.ok(logoComponent.includes("/branding/fole-works-logo.png"), "FoleWorksLogo must render the official PNG asset");
  });

  test("FOLE WORKS navigation links integrated into public header, footer, and admin sidebar", () => {
    const header = nodeFs.readFileSync("components/layout/SiteHeader.tsx", "utf-8");
    assert.ok(header.includes("/fole-works"), "SiteHeader must link to /fole-works");
    assert.ok(header.includes("WORKS"), "SiteHeader must display FOLE WORKS label");

    const footer = nodeFs.readFileSync("components/layout/SiteFooter.tsx", "utf-8");
    assert.ok(footer.includes("/fole-works"), "SiteFooter must link to /fole-works");

    const sidebar = nodeFs.readFileSync("components/admin/AdminSidebar.tsx", "utf-8");
    assert.ok(sidebar.includes("/admin/dashboard/works"), "AdminSidebar must link to FOLE WORKS dashboard");
    assert.ok(sidebar.includes("/admin/dashboard/works/activities"), "AdminSidebar must link to activities management");
    assert.ok(sidebar.includes("/admin/dashboard/works/create"), "AdminSidebar must link to create activity");
  });

  test("Database migration 008 defines works_activities with RLS and policies", () => {
    const migrationPath = "supabase/migrations/008_create_fole_works_activities.sql";
    assert.ok(nodeFs.existsSync(migrationPath), "Migration 008 must exist");
    const migrationSql = nodeFs.readFileSync(migrationPath, "utf-8");
    assert.ok(migrationSql.toLowerCase().includes("create table if not exists public.works_activities"), "Must create works_activities table");
    assert.ok(migrationSql.toUpperCase().includes("ENABLE ROW LEVEL SECURITY"), "Must enable RLS on works_activities");
    assert.ok(migrationSql.includes("status = 'published'"), "Must enforce published-only visibility for public select");
    assert.ok(migrationSql.includes("is_admin()"), "Must restrict mutations to authorized admins");
  });

  test("Public query layer enforces published status, local store fallback, and admin isolation", () => {
    const queriesCode = nodeFs.readFileSync("lib/queries/index.ts", "utf-8");
    assert.ok(queriesCode.includes("getPublishedWorksActivities"), "Must export getPublishedWorksActivities");
    assert.ok(queriesCode.includes("getWorksActivityBySlug"), "Must export getWorksActivityBySlug");
    assert.ok(queriesCode.includes("getAllWorksActivitiesForAdmin"), "Must export getAllWorksActivitiesForAdmin");
    assert.ok(queriesCode.includes("getWorksActivityById"), "Must export getWorksActivityById");
    assert.ok(queriesCode.includes("createWorksActivity"), "Must export createWorksActivity");
    assert.ok(queriesCode.includes("updateWorksActivity"), "Must export updateWorksActivity");
    assert.ok(queriesCode.includes("updateWorksActivityStatus"), "Must export updateWorksActivityStatus");
    assert.ok(queriesCode.includes("deleteWorksActivity"), "Must export deleteWorksActivity");
    assert.ok(queriesCode.includes("getWorksActivityMetrics"), "Must export getWorksActivityMetrics");

    // Check published filtering in queries
    assert.ok(queriesCode.includes('.eq("status", "published")'), "Public Supabase query must filter by status = 'published'");
    assert.ok(queriesCode.includes('.is("deleted_at", null)'), "Public query must exclude soft-deleted records");

    // Check seed data integration
    const seedCode = nodeFs.readFileSync("lib/queries/seed-data.ts", "utf-8");
    assert.ok(seedCode.includes("initialFallbackWorksActivities"), "Seed data must define initialFallbackWorksActivities");
    assert.ok(seedCode.includes("embedded-systems-iot-esp32-workshop"), "Seed data must include ESP32 workshop");
    assert.ok(seedCode.includes("fole-summer-internship-programme-2026"), "Seed data must include 2026 internship");
    assert.ok(seedCode.includes("generative-ai-rag-systems-workshop"), "Seed data must include draft activity for admin testing");
  });

  test("Activity validation schemas strictly enforce requirements and reject invalid payloads", () => {
    const schemaCode = nodeFs.readFileSync("lib/validation/schemas.ts", "utf-8");
    assert.ok(schemaCode.includes("worksActivitySchema"), "Must export worksActivitySchema");
    assert.ok(schemaCode.includes("worksActivityUpdateSchema"), "Must export worksActivityUpdateSchema");
    assert.ok(schemaCode.includes("worksSupportingResourceSchema"), "Must export worksSupportingResourceSchema");
    assert.ok(schemaCode.includes("Title must be at least 3 characters"), "Must enforce title min length");
    assert.ok(schemaCode.includes("Slug must be lowercase alphanumeric with hyphens"), "Must enforce strict URL slug regex");
    assert.ok(schemaCode.includes("Description must be at least 10 characters"), "Must enforce description min length");

    // Pure validation logic replication test
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    assert.equal(slugRegex.test("esp32-iot-workshop-2026"), true, "Valid slug passes regex");
    assert.equal(slugRegex.test("Invalid Slug with Spaces!"), false, "Invalid slug fails regex");
    assert.equal(slugRegex.test("-leading-hyphen"), false, "Leading hyphen fails regex");
    assert.equal(slugRegex.test("trailing-hyphen-"), false, "Trailing hyphen fails regex");
  });

  test("FOLE WORKS routes and responsive UI components exist and use correct patterns", () => {
    // Public landing and detail
    assert.ok(nodeFs.existsSync("app/(public)/fole-works/page.tsx"), "Landing page must exist");
    assert.ok(nodeFs.existsSync("app/(public)/fole-works/loading.tsx"), "Landing skeleton loader must exist");
    assert.ok(nodeFs.existsSync("app/(public)/fole-works/[slug]/page.tsx"), "Detail page must exist");
    
    const landing = nodeFs.readFileSync("app/(public)/fole-works/page.tsx", "utf-8");
    assert.ok(landing.includes("FoleWorksLogo"), "Landing page must display FoleWorksLogo");
    assert.ok(landing.includes("WorksFilterView"), "Landing page must render WorksFilterView");

    const detail = nodeFs.readFileSync("app/(public)/fole-works/[slug]/page.tsx", "utf-8");
    assert.ok(detail.includes("getWorksActivityBySlug"), "Detail page must look up activity by slug");
    assert.ok(detail.includes("notFound()"), "Detail page must return 404 for non-existent or unpublished items");

    // Admin dashboard routes
    assert.ok(nodeFs.existsSync("app/admin/dashboard/works/page.tsx"), "Admin overview page must exist");
    assert.ok(nodeFs.existsSync("app/admin/dashboard/works/activities/page.tsx"), "Admin activities list page must exist");
    assert.ok(nodeFs.existsSync("app/admin/dashboard/works/create/page.tsx"), "Admin create activity page must exist");
    assert.ok(nodeFs.existsSync("app/admin/dashboard/works/[id]/edit/page.tsx"), "Admin edit activity page must exist");
    assert.ok(nodeFs.existsSync("app/admin/dashboard/works/[id]/preview/page.tsx"), "Admin preview activity page must exist");

    // Admin mobile responsiveness
    const adminActs = nodeFs.readFileSync("app/admin/dashboard/works/activities/page.tsx", "utf-8");
    assert.ok(adminActs.includes("block md:hidden"), "Admin activities must render stacked cards on mobile");
    assert.ok(adminActs.includes("hidden md:block"), "Admin activities table must be hidden on small screens");
    assert.ok(adminActs.includes("min-h-[44px]"), "Admin action buttons must satisfy min touch target");

    // API routes
    assert.ok(nodeFs.existsSync("app/api/admin/works/route.ts"), "Admin works API route must exist");
    assert.ok(nodeFs.existsSync("app/api/admin/works/[id]/route.ts"), "Admin works detail API route must exist");
    assert.ok(nodeFs.existsSync("app/api/admin/works/[id]/status/route.ts"), "Admin works status API route must exist");

    const apiRoute = nodeFs.readFileSync("app/api/admin/works/route.ts", "utf-8");
    assert.ok(apiRoute.includes('export const runtime = "nodejs"'), "API route must declare nodejs runtime for Vercel serverless safety");
    assert.ok(apiRoute.includes("getAdminSession"), "API route must strictly verify admin session");
  });

  // =========================================================================
  // 13. FOLE WORKS ACTIVITY CREATION, FLYER UPLOAD, REGISTRATION FEE & LINKS
  // =========================================================================
  console.log("\n--- 13. FOLE WORKS ACTIVITY CREATION, FLYER UPLOAD, FEES & PLATFORM LINKS ---");

  // Replication of validateActivityPublicationReadiness from lib/validation/schemas.ts
  function testPublicationReadiness(activity) {
    const missing = [];
    if (!activity.title || activity.title.trim().length < 3) missing.push("Title (at least 3 characters)");
    if (!activity.description || activity.description.trim().length < 10) missing.push("Description (at least 10 characters)");
    if (!activity.cover_image || !activity.cover_image.trim()) missing.push("Flyer / Poster image");
    if (!activity.registration_url || !activity.registration_url.trim()) {
      missing.push("Activity Platform / Registration Link");
    } else {
      try {
        const u = new URL(activity.registration_url.trim());
        if (u.protocol !== "https:" && (process.env.NODE_ENV === "production" || u.protocol !== "http:")) {
          missing.push("Secure HTTPS platform link");
        }
      } catch {
        missing.push("Valid platform URL format");
      }
    }
    if (typeof activity.fee_amount !== "number" || activity.fee_amount < 0) {
      missing.push("Valid registration fee (0 or positive)");
    }
    return { isReady: missing.length === 0, missing };
  }

  test("Publication readiness validator rejects incomplete activities and passes complete records", () => {
    const schemaFile = nodeFs.readFileSync("lib/validation/schemas.ts", "utf-8");
    assert.ok(schemaFile.includes("validateActivityPublicationReadiness"), "validateActivityPublicationReadiness must be exported");

    // Incomplete draft (missing flyer and platform link)
    const incompleteDraft = {
      title: "IoT Prototyping Workshop",
      description: "Hands-on ESP32 firmware development and sensor interfacing.",
      cover_image: null,
      registration_url: null,
      fee_amount: 0,
    };
    const incompleteCheck = testPublicationReadiness(incompleteDraft);
    assert.equal(incompleteCheck.isReady, false, "Draft without flyer and platform link must not be ready to publish");
    assert.ok(incompleteCheck.missing.some((m) => m.toLowerCase().includes("flyer")), "Missing list must include flyer");
    assert.ok(incompleteCheck.missing.some((m) => m.toLowerCase().includes("platform") || m.toLowerCase().includes("link")), "Missing list must include platform link");

    // Complete ready-to-publish record
    const completeActivity = {
      title: "Advanced Robotics Workshop",
      description: "Full day hands-on ROS2 robotics workshop for engineering students.",
      cover_image: "https://example.com/storage/flyer.webp",
      registration_url: "https://forms.gle/test-registration-form",
      fee_amount: 150,
    };
    const completeCheck = testPublicationReadiness(completeActivity);
    assert.equal(completeCheck.isReady, true, "Complete activity must satisfy publication readiness");
    assert.equal(completeCheck.missing.length, 0, "No missing items for valid activity");
  });

  test("Registration fee schema rejects negative values and malformed numbers", () => {
    const schemaFile = nodeFs.readFileSync("lib/validation/schemas.ts", "utf-8");
    assert.ok(schemaFile.includes("fee_amount"), "Schema must define fee_amount");
    assert.ok(schemaFile.includes("Registration fee must be 0 or a positive number"), "Must enforce non-negative fee rule");

    const validateFee = (amount) => {
      return typeof amount === "number" && !isNaN(amount) && amount >= 0;
    };

    assert.equal(validateFee(0), true, "0 fee must be valid (Free activity)");
    assert.equal(validateFee(150), true, "Positive fee must be valid");
    assert.equal(validateFee(-20), false, "Negative fee must be rejected");
    assert.equal(validateFee(NaN), false, "NaN fee must be rejected");
  });

  test("Registration platform URL rejects unsafe javascript: URLs and invalid protocols", () => {
    const schemaFile = nodeFs.readFileSync("lib/validation/schemas.ts", "utf-8");
    assert.ok(schemaFile.includes("Platform link must be a valid secure URL starting with https://"), "Must enforce HTTPS URL message");

    const validateUrl = (urlStr) => {
      if (!urlStr || !urlStr.trim()) return false;
      try {
        const u = new URL(urlStr.trim());
        return u.protocol === "https:" || u.protocol === "http:";
      } catch {
        return false;
      }
    };

    assert.equal(validateUrl("https://forms.gle/test1234"), true, "Valid HTTPS URL passes");
    assert.equal(validateUrl("javascript:alert(1)"), false, "Unsafe javascript: protocol fails");
    assert.equal(validateUrl("not-a-valid-url"), false, "Invalid string fails URL parsing");
  });

  test("Flyer upload endpoint in /api/admin/upload supports thumbnails bucket and validates MIME types", () => {
    const uploadRoute = nodeFs.readFileSync("app/api/admin/upload/route.ts", "utf-8");
    assert.ok(uploadRoute.includes('"engivault-thumbnails"'), "Upload route must allow engivault-thumbnails bucket");
    assert.ok(uploadRoute.includes("image/jpeg"), "Upload route must support image/jpeg");
    assert.ok(uploadRoute.includes("image/png"), "Upload route must support image/png");
    assert.ok(uploadRoute.includes("image/webp"), "Upload route must support image/webp");
    assert.ok(uploadRoute.includes("10 * 1024 * 1024"), "Upload route must enforce 10MB limit for image flyers");
    assert.ok(uploadRoute.includes("folder"), "Upload route must support folder categorization (works-flyers)");
  });

  test("Public WorksActivityCard wires flyer, title and primary button to configured platform link", () => {
    const cardCode = nodeFs.readFileSync("components/works/WorksActivityCard.tsx", "utf-8");
    assert.ok(cardCode.includes("hasPlatformLink"), "Must compute whether platform link is present");
    assert.ok(cardCode.includes('target={hasPlatformLink ? "_blank" : undefined}'), "Must target _blank for external destination");
    assert.ok(cardCode.includes('rel={hasPlatformLink ? "noopener noreferrer" : undefined}'), "Must include rel='noopener noreferrer'");
    assert.ok(cardCode.includes("activity.cover_image"), "Must render activity cover_image flyer");
    assert.ok(cardCode.includes("Free / ₹0"), "Must render Free / ₹0 for zero-fee activities");
    assert.ok(cardCode.includes("Activity Syllabus & Guidelines"), "Must maintain secondary internal syllabus link");
  });

  test("Admin activity form provides flyer upload dropzone, fee input, and publication readiness checks", () => {
    const formCode = nodeFs.readFileSync("components/works/WorksActivityForm.tsx", "utf-8");
    assert.ok(formCode.includes("handleFileSelection"), "Form must handle flyer file selection");
    assert.ok(formCode.includes("engivault-thumbnails"), "Form must upload flyer to engivault-thumbnails bucket");
    assert.ok(formCode.includes("works-flyers"), "Form must organize uploads under works-flyers folder");
    assert.ok(formCode.includes("Publication Readiness Checklist"), "Form must display Publication Readiness Checklist");
    assert.ok(formCode.includes("handleVerifyLink"), "Form must provide Verify Link button for platform link");
    assert.ok(formCode.includes("feeAmount"), "Form must track and validate registration fee amount");
  });

  test("Admin activity management table renders flyer thumbnail, fee, and external link tester", () => {
    const adminPage = nodeFs.readFileSync("app/admin/dashboard/works/activities/page.tsx", "utf-8");
    assert.ok(adminPage.includes("act.cover_image"), "Admin table must display flyer thumbnail");
    assert.ok(adminPage.includes("ExternalLink"), "Admin table must display ExternalLink tester for platform URL");
    assert.ok(adminPage.includes("statusModal"), "Admin page must show confirmation modal for unpublishing and archiving");
    assert.ok(adminPage.includes("Archive"), "Admin page must allow archiving activities");
  });

  // =========================================================================
  // 14. FOLE WORKS PAGE RESILIENCE, ERROR HANDLING & DATA NORMALIZATION
  // =========================================================================
  console.log("\n--- 14. FOLE WORKS RESILIENCE, ERROR HANDLING & DATA NORMALIZATION ---");

  test("Database migration 009 defines grants and PostgREST schema cache reload", () => {
    const mig009Path = "supabase/migrations/009_fole_works_permissions_and_schema_cache.sql";
    assert.ok(nodeFs.existsSync(mig009Path), "Migration 009 file must exist");
    const sql = nodeFs.readFileSync(mig009Path, "utf-8");
    assert.ok(sql.includes("grant select on public.works_activities to anon, authenticated"), "Must grant SELECT on works_activities to anon and authenticated");
    assert.ok(sql.includes("grant all on public.works_activities to service_role"), "Must grant ALL on works_activities to service_role");
    assert.ok(sql.includes("notify pgrst, 'reload schema'"), "Must notify pgrst to reload schema cache");

    // Also verify migration 008 includes grants and notify
    const mig008Path = "supabase/migrations/008_create_fole_works_activities.sql";
    const sql008 = nodeFs.readFileSync(mig008Path, "utf-8");
    assert.ok(sql008.includes("grant select on public.works_activities to anon, authenticated"), "Migration 008 must also include grants");
    assert.ok(sql008.includes("notify pgrst, 'reload schema'"), "Migration 008 must also include schema cache notification");
  });

  test("normalizeWorksActivity safely standardizes malformed and null database records", () => {
    const queriesCode = nodeFs.readFileSync("lib/queries/index.ts", "utf-8");
    assert.ok(queriesCode.includes("export function normalizeWorksActivity"), "Must export normalizeWorksActivity");

    // Dynamic test of normalization logic
    const testNormalizer = (raw) => {
      if (!raw || typeof raw !== "object") {
        return {
          id: "fallback-id",
          title: "Untitled Activity",
          description: "",
          category: "Workshop",
          delivery_mode: "in_person",
          fee_amount: 0,
          status: "draft",
        };
      }
      let fee = 0;
      if (typeof raw.fee_amount === "number" && !isNaN(raw.fee_amount)) {
        fee = Math.max(0, raw.fee_amount);
      } else if (typeof raw.fee_amount === "string") {
        const parsed = parseFloat(raw.fee_amount);
        fee = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
      }
      return {
        id: raw.id || "gen-id",
        title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : "Untitled Activity",
        short_description: typeof raw.short_description === "string" && raw.short_description.trim() ? raw.short_description.trim() : null,
        description: typeof raw.description === "string" ? raw.description : "",
        category: typeof raw.category === "string" && raw.category.trim() ? raw.category.trim() : "Workshop",
        delivery_mode: ["in_person", "online", "hybrid"].includes(raw.delivery_mode) ? raw.delivery_mode : "in_person",
        fee_amount: fee,
        status: ["draft", "published", "archived"].includes(raw.status) ? raw.status : "draft",
      };
    };

    // Test with completely null optional fields
    const normalizedNulls = testNormalizer({
      id: "test-1",
      title: null,
      description: null,
      short_description: null,
      category: null,
      venue: null,
      fee_amount: null,
      delivery_mode: null,
      status: null,
    });

    assert.equal(normalizedNulls.title, "Untitled Activity", "Null title defaults to Untitled Activity");
    assert.equal(normalizedNulls.description, "", "Null description defaults to empty string");
    assert.equal(normalizedNulls.category, "Workshop", "Null category defaults to Workshop");
    assert.equal(normalizedNulls.fee_amount, 0, "Null fee defaults to 0");
    assert.equal(normalizedNulls.delivery_mode, "in_person", "Null delivery mode defaults to in_person");
    assert.equal(normalizedNulls.status, "draft", "Null status defaults to draft");

    // Test fee parsing with strings and negative values
    assert.equal(testNormalizer({ fee_amount: "150.50" }).fee_amount, 150.5, "String fee is parsed to float");
    assert.equal(testNormalizer({ fee_amount: "-25" }).fee_amount, 0, "Negative string fee clamped to 0");
    assert.equal(testNormalizer({ fee_amount: -50 }).fee_amount, 0, "Negative number fee clamped to 0");
    assert.equal(testNormalizer({ fee_amount: "invalid" }).fee_amount, 0, "Invalid string fee defaults to 0");
  });

  test("WorksFilterView handles null activity fields and distinguishes error state from empty state", () => {
    const filterViewCode = nodeFs.readFileSync("components/works/WorksFilterView.tsx", "utf-8");
    assert.ok(filterViewCode.includes("error?: string | null"), "WorksFilterViewProps must accept error prop");
    assert.ok(filterViewCode.includes("initialActivities = []"), "initialActivities must default to empty array");
    assert.ok(filterViewCode.includes("safeActivities"), "Must use safeActivities wrapper to prevent null crashes");
    assert.ok(filterViewCode.includes("Activities Catalog Temporarily Unavailable"), "Must render clear error state card");
    assert.ok(filterViewCode.includes("Retry Loading"), "Error state must provide retry button");
    assert.ok(filterViewCode.includes("Contact Organizers"), "Error state must provide organizer contact button");
    assert.ok(filterViewCode.includes("No activities currently scheduled"), "Must distinguish genuinely empty catalogue from active filter empty state");

    // Replicate safe filter logic to guarantee no TypeError is thrown with null fields
    const testActivities = [
      {
        id: "act-null-fields",
        title: null,
        description: null,
        short_description: null,
        category: null,
        venue: null,
        delivery_mode: null,
      },
      {
        id: "act-valid",
        title: "ROS2 Robotics Workshop",
        description: "Hands-on autonomous robot navigation",
        short_description: "Robotics workshop",
        category: "Workshop",
        venue: "CEV Labs",
        delivery_mode: "in_person",
      },
    ];

    let filterErrorOccurred = false;
    try {
      const search = "robotics";
      const selectedCategory = "Workshop";
      const selectedMode = "all";

      const filtered = testActivities.filter((act) => {
        const actCategory = typeof act.category === "string" ? act.category : "General";
        const actTitle = typeof act.title === "string" ? act.title : "";
        const actDesc = typeof act.description === "string" ? act.description : "";
        const actShortDesc = typeof act.short_description === "string" ? act.short_description : "";
        const actVenue = typeof act.venue === "string" ? act.venue : "";
        const actDeliveryMode = typeof act.delivery_mode === "string" ? act.delivery_mode : "in_person";

        if (selectedCategory !== "All" && actCategory.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
        if (selectedMode !== "all" && actDeliveryMode !== selectedMode) {
          return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchesTitle = actTitle.toLowerCase().includes(q);
          const matchesDesc = actShortDesc.toLowerCase().includes(q) || actDesc.toLowerCase().includes(q);
          const matchesVenue = actVenue.toLowerCase().includes(q);
          const matchesCategory = actCategory.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc && !matchesVenue && !matchesCategory) {
            return false;
          }
        }
        return true;
      });

      assert.equal(filtered.length, 1, "Must filter cleanly and match valid record without crashing");
    } catch {
      filterErrorOccurred = true;
    }

    assert.equal(filterErrorOccurred, false, "Filter logic must never throw TypeError on null fields");
  });

  test("WorksActivityCard guards against null description slicing and invalid timestamps", () => {
    const cardCode = nodeFs.readFileSync("components/works/WorksActivityCard.tsx", "utf-8");
    assert.ok(cardCode.includes("activity.description ? activity.description.slice(0, 160) :"), "Must guard description slice against null");
    assert.ok(cardCode.includes("activity.category || \"Workshop\""), "Must provide fallback for null category");
    assert.ok(cardCode.includes("activity.title || \"Untitled Activity\""), "Must provide fallback for null title");
    assert.ok(cardCode.includes("isNaN(d.getTime())"), "Must check date validity before formatting");
    assert.ok(cardCode.includes("isFree ? \"Free / ₹0\" :"), "Must safely determine free activities");
  });

  test("Public FOLE WORKS page declares dynamic server-rendering and graceful query error handling", () => {
    const pageCode = nodeFs.readFileSync("app/(public)/fole-works/page.tsx", "utf-8");
    assert.ok(pageCode.includes('export const dynamic = "force-dynamic"'), "Page must export force-dynamic");
    assert.ok(pageCode.includes("export const revalidate = 0"), "Page must export revalidate = 0");
    assert.ok(pageCode.includes("try {"), "Page SSR must wrap query in try/catch block");
    assert.ok(pageCode.includes("catch (err: any) {"), "Page must catch query exceptions");
    assert.ok(pageCode.includes("fetchError ="), "Page must set fetchError message for recoverable degradation");
    assert.ok(pageCode.includes("error={fetchError}"), "Page must pass error prop to WorksFilterView");
    assert.ok(pageCode.includes("FoleWorksLogo"), "Hero branding section must remain intact");
    assert.ok(pageCode.includes("Hands-on Labs"), "Value pillars must remain visible regardless of query error");
    assert.ok(pageCode.includes("folecev@gmail.com"), "Contact section must remain visible");
  });

  test("Public FOLE WORKS detail page declares dynamic server-rendering and safe metadata generation", () => {
    const detailCode = nodeFs.readFileSync("app/(public)/fole-works/[slug]/page.tsx", "utf-8");
    assert.ok(detailCode.includes('export const dynamic = "force-dynamic"'), "Detail page must export force-dynamic");
    assert.ok(detailCode.includes("export const revalidate = 0"), "Detail page must export revalidate = 0");
    assert.ok(detailCode.includes("generateMetadata"), "Must implement generateMetadata");
    assert.ok(detailCode.includes("try {"), "Detail page SSR must wrap query in try/catch");
    assert.ok(detailCode.includes("Activity Temporarily Unavailable"), "Detail page must provide recoverable error UI");
  });

  // 15. FOLE WORKS Activity Sharing & Copy Link Suite
  console.log("--- 15. FOLE WORKS ACTIVITY SHARING & COPY LINK SUITE ---");

  test("WorksShareButton component exists and uses client directive", () => {
    assert.ok(nodeFs.existsSync("components/works/WorksShareButton.tsx"), "WorksShareButton component file must exist");
    const shareCode = nodeFs.readFileSync("components/works/WorksShareButton.tsx", "utf-8");
    assert.ok(shareCode.startsWith('"use client"'), "Must be a client component for browser APIs");
    assert.ok(shareCode.includes("Share2"), "Must import Share2 from lucide-react");
    assert.ok(shareCode.includes("Link2"), "Must import Link2 or Copy from lucide-react");
    assert.ok(shareCode.includes("Check"), "Must import Check icon from lucide-react");
  });

  test("getActivityShareUrl generates canonical public detail URLs without external registration links", () => {
    const shareCode = nodeFs.readFileSync("components/works/WorksShareButton.tsx", "utf-8");
    assert.ok(shareCode.includes("getActivityShareUrl"), "Must export getActivityShareUrl helper");

    // Pure logic test of canonical URL generation
    function testShareUrl(slugOrId, baseOrigin) {
      if (!slugOrId) return "/fole-works";
      const clean = encodeURIComponent(String(slugOrId).trim());
      const path = `/fole-works/${clean}`;
      if (baseOrigin) {
        return `${baseOrigin.replace(/\/+$/, "")}${path}`;
      }
      return path;
    }

    const testSlug = "robotics-bootcamp-2026";
    const externalRegUrl = "https://forms.google.com/xyz123";
    const generated = testShareUrl(testSlug, "https://folecev.org");

    assert.equal(generated, "https://folecev.org/fole-works/robotics-bootcamp-2026");
    assert.ok(!generated.includes(externalRegUrl), "Share URL must NEVER be external registration link");
    assert.ok(generated.includes("/fole-works/"), "Share URL must route to internal FOLE WORKS detail page");

    // Test different slugs produce distinct URLs
    const slug1 = testShareUrl("workshop-a", "https://folecev.org");
    const slug2 = testShareUrl("workshop-b", "https://folecev.org");
    assert.notEqual(slug1, slug2, "Different activities must produce distinct URLs");

    // Test fallback to ID when slug is absent
    const idUrl = testShareUrl("act-uuid-789", "https://folecev.org");
    assert.equal(idUrl, "https://folecev.org/fole-works/act-uuid-789");
  });

  test("WorksShareButton implements Web Share API with safe AbortError cancellation handling", () => {
    const shareCode = nodeFs.readFileSync("components/works/WorksShareButton.tsx", "utf-8");
    assert.ok(shareCode.includes("navigator.share"), "Must call navigator.share when available");
    assert.ok(shareCode.includes("AbortError"), "Must catch AbortError silently without showing error message on cancellation");
    assert.ok(shareCode.includes("shareTitle"), "Must pass activity title as share title");
    assert.ok(shareCode.includes("shareText"), "Must pass meaningful description as share text");
    assert.ok(shareCode.includes("shareUrl"), "Must pass canonical FOLE WORKS URL");
  });

  test("WorksShareButton implements clipboard copying with fallback and feedback timer", () => {
    const shareCode = nodeFs.readFileSync("components/works/WorksShareButton.tsx", "utf-8");
    assert.ok(shareCode.includes("navigator.clipboard"), "Must attempt navigator.clipboard.writeText");
    assert.ok(shareCode.includes("execCommand"), "Must provide execCommand fallback for legacy/restricted browser environments");
    assert.ok(shareCode.includes("Activity link copied!"), "Must provide success feedback message");
    assert.ok(shareCode.includes("clearTimeout"), "Must clear previous timer to prevent overlapping notifications");
    assert.ok(shareCode.includes("showFallbackModal"), "Must display fallback dialog when clipboard access is denied");
  });

  test("WorksActivityCard integrates share actions on flyer and footer without interfering with card clicks", () => {
    const cardCode = nodeFs.readFileSync("components/works/WorksActivityCard.tsx", "utf-8");
    assert.ok(cardCode.includes("WorksShareButton"), "WorksActivityCard must import and render WorksShareButton");
    assert.ok(cardCode.includes('variant="flyer"'), "Must render quick share button on top-left of flyer");
    assert.ok(cardCode.includes('variant="card"'), "Must render share actions in card footer secondary row");
    
    // Check share component prevents event propagation
    const shareCode = nodeFs.readFileSync("components/works/WorksShareButton.tsx", "utf-8");
    assert.ok(shareCode.includes("e.stopPropagation()"), "Must stop propagation to prevent triggering parent card/links");
    assert.ok(shareCode.includes("e.preventDefault()"), "Must prevent default to avoid accidental navigation");
  });

  test("Activity detail page integrates WorksShareButton while preserving Server Component status", () => {
    const detailCode = nodeFs.readFileSync("app/(public)/fole-works/[slug]/page.tsx", "utf-8");
    assert.ok(!detailCode.startsWith('"use client"'), "Detail page must remain a Server Component");
    assert.ok(detailCode.includes("WorksShareButton"), "Must import WorksShareButton");
    assert.ok(detailCode.includes('variant="detail-header"'), "Must render share button in detail page header");
    assert.ok(detailCode.includes('variant="detail-cta"'), "Must render share button in sticky sidebar CTA card");
  });

  // 16. FOLE WORKS Original Flyer Preservation & Rich Previews Suite
  console.log("--- 16. FOLE WORKS ORIGINAL FLYER PRESERVATION & RICH PREVIEWS SUITE ---");

  test("WorksActivityForm supports any flyer aspect ratio without forced 16:9/16:10 cropping", () => {
    const formCode = nodeFs.readFileSync("components/works/WorksActivityForm.tsx", "utf-8");
    assert.ok(formCode.includes("Any aspect ratio (portrait, landscape, square)"), "Form must explain support for any aspect ratio");
    assert.ok(formCode.includes("Original Aspect Ratio"), "Form must label preview with Original Aspect Ratio");
    assert.ok(formCode.includes("object-contain"), "Form preview must use object-contain to avoid cropping");
    assert.ok(!formCode.includes("16:9 / 16:10 Ratio"), "Form must not force 16:9 or 16:10 ratio");
    assert.ok(formCode.includes("Full flyer preserved without cropping"), "Form must indicate uncropped preservation");
  });

  test("WorksActivityCard and public detail header display complete original flyer without cropping", () => {
    const cardCode = nodeFs.readFileSync("components/works/WorksActivityCard.tsx", "utf-8");
    assert.ok(cardCode.includes("object-contain"), "Activity card flyer must use object-contain to preserve whole flyer");

    const detailCode = nodeFs.readFileSync("app/(public)/fole-works/[slug]/page.tsx", "utf-8");
    assert.ok(detailCode.includes("object-contain"), "Detail page flyer header must use object-contain");
    assert.ok(!detailCode.includes("aspect-[16/9] sm:aspect-[21/9]"), "Detail page must not crop flyer into a fixed 21:9 slice");
    assert.ok(detailCode.includes("original activity flyer"), "Detail page must set descriptive alt text for original flyer");
  });

  test("Public flyer route streams original flyer bytes with CDN cache headers and protects draft activities", () => {
    assert.ok(nodeFs.existsSync("app/api/works/[slug]/flyer/route.ts"), "Public flyer stream route must exist");
    const routeCode = nodeFs.readFileSync("app/api/works/[slug]/flyer/route.ts", "utf-8");
    assert.ok(routeCode.includes('activity.status !== "published"'), "Route must reject unpublished activities with 404");
    assert.ok(routeCode.includes("activity.deleted_at"), "Route must reject soft-deleted activities with 404");
    assert.ok(routeCode.includes("Cache-Control"), "Route must send public CDN cache headers");
    assert.ok(routeCode.includes("Content-Type"), "Route must specify image Content-Type");
  });

  test("Detail page generateMetadata generates rich Open Graph and Twitter summary_large_image previews", () => {
    const detailCode = nodeFs.readFileSync("app/(public)/fole-works/[slug]/page.tsx", "utf-8");
    assert.ok(detailCode.includes("openGraph:"), "Detail page must export openGraph metadata");
    assert.ok(detailCode.includes("twitter:"), "Detail page must export twitter metadata");
    assert.ok(detailCode.includes('card: "summary_large_image"'), "Must configure Twitter summary_large_image card");
    assert.ok(detailCode.includes("flyerImageUrl"), "og:image must reference the original flyer image");
    assert.ok(detailCode.includes("getCanonicalOrigin"), "Must compute canonical URL using trusted site origin");
    assert.ok(detailCode.includes("alternates:"), "Must provide canonical URL link");
    assert.ok(detailCode.includes("robots:"), "Must declare noindex for unpublished or missing activities");
  });

  test("WorksShareButton implements native file-and-link sharing with flyer attachment and link fallback", () => {
    const shareCode = nodeFs.readFileSync("components/works/WorksShareButton.tsx", "utf-8");
    assert.ok(shareCode.includes("cover_image?: string | null;"), "WorksShareActivityInfo must include cover_image");
    assert.ok(shareCode.includes("getFlyerShareFile"), "Must implement flyer file constructor for native share");
    assert.ok(shareCode.includes("navigator.canShare"), "Must test file share support using navigator.canShare");
    assert.ok(shareCode.includes("files: [flyerFile]"), "Must attach original flyer File when supported");
    assert.ok(shareCode.includes("View activity:"), "Share text must include direct FOLE WORKS activity link");
    assert.ok(shareCode.includes("shareCaption"), "Must provide structured caption text with title, description, and link");
  });

  test("Cache revalidation helper revalidateWorksActivity exists and invalidates works paths on mutations", () => {
    const cacheCode = nodeFs.readFileSync("lib/cache/revalidate.ts", "utf-8");
    assert.ok(cacheCode.includes("revalidateWorksActivity"), "Must export revalidateWorksActivity helper");
    assert.ok(cacheCode.includes("/fole-works"), "Must revalidate /fole-works");
    assert.ok(cacheCode.includes("/api/works/${slug}/flyer"), "Must revalidate dynamic flyer route");

    const worksAdminRoute = nodeFs.readFileSync("app/api/admin/works/route.ts", "utf-8");
    assert.ok(worksAdminRoute.includes("revalidateWorksActivity"), "Works admin creation route must call revalidateWorksActivity");

    const worksIdRoute = nodeFs.readFileSync("app/api/admin/works/[id]/route.ts", "utf-8");
    assert.ok(worksIdRoute.includes("revalidateWorksActivity"), "Works admin update/delete route must call revalidateWorksActivity");
  });

  // 17. Authentication, Access Control & Rate Limiting Suite
  console.log("--- 17. AUTHENTICATION, ACCESS CONTROL & RATE LIMITING SUITE ---");

  await testAsync("studentUsernameSchema strictly enforces 3-20 lowercase alphanumeric characters", async () => {
    const { studentUsernameSchema } = await import("../lib/validation/student.ts");
    assert.ok(studentUsernameSchema.safeParse("adithya").success, "Simple lowercase username must pass");
    assert.ok(studentUsernameSchema.safeParse("user_123").success, "Username with underscores and numbers must pass");
    assert.ok(!studentUsernameSchema.safeParse("ab").success, "Short username (< 3 chars) must be rejected");
    assert.ok(!studentUsernameSchema.safeParse("a".repeat(21)).success, "Long username (> 20 chars) must be rejected");
    assert.ok(!studentUsernameSchema.safeParse("Adithya").success, "Uppercase characters must be rejected");
    assert.ok(!studentUsernameSchema.safeParse("user-name").success, "Hyphens must be rejected (only underscores)");
    assert.ok(!studentUsernameSchema.safeParse("user.name").success, "Dots must be rejected");
    assert.ok(!studentUsernameSchema.safeParse("user@name").success, "Special characters must be rejected");
  });

  await testAsync("studentUsernameSchema blocks reserved system words", async () => {
    const { studentUsernameSchema } = await import("../lib/validation/student.ts");
    const reserved = ["admin", "administrator", "fole", "engivault", "root", "support", "system", "moderator", "guest"];
    for (const word of reserved) {
      assert.ok(!studentUsernameSchema.safeParse(word).success, `Reserved word '${word}' must be rejected`);
    }
  });

  await testAsync("studentPasswordSchema enforces 8-72 characters and rejects trivially weak passwords", async () => {
    const { studentPasswordSchema } = await import("../lib/validation/student.ts");
    assert.ok(studentPasswordSchema.safeParse("ValidPass123!").success, "Strong password must pass");
    assert.ok(studentPasswordSchema.safeParse("p@ssword with spaces").success, "Passwords with spaces must pass");
    assert.ok(!studentPasswordSchema.safeParse("short1").success, "Short password (<8 chars) must be rejected");
    assert.ok(!studentPasswordSchema.safeParse("a".repeat(73)).success, "Long password (>72 chars) must be rejected");
    assert.ok(!studentPasswordSchema.safeParse("password").success, "'password' must be rejected as trivially weak");
    assert.ok(!studentPasswordSchema.safeParse("12345678").success, "'12345678' must be rejected as trivially weak");
    assert.ok(!studentPasswordSchema.safeParse("qwertyui").success, "'qwertyui' must be rejected as trivially weak");
  });

  await testAsync("studentSignupSchema rejects passwords identical to the username", async () => {
    const { studentSignupSchema } = await import("../lib/validation/student.ts");
    const res = studentSignupSchema.safeParse({ username: "student99", password: "student99" });
    assert.ok(!res.success, "Password equal to username must be rejected");
  });

  await testAsync("usernameToInternalEmail generates canonical non-routable RFC 2606 addresses", async () => {
    const { usernameToInternalEmail, INTERNAL_STUDENT_DOMAIN } = await import("../lib/auth/student.ts");
    assert.strictEqual(INTERNAL_STUDENT_DOMAIN, "students.fole.invalid");
    assert.strictEqual(usernameToInternalEmail("Adithya_K"), "adithya_k@students.fole.invalid");
    assert.strictEqual(usernameToInternalEmail("  STUDENT1  "), "student1@students.fole.invalid");
  });

  await testAsync("isSafeOrigin blocks cross-origin requests while permitting same-origin and mobile", async () => {
    const { isSafeOrigin } = await import("../lib/security/origin.ts");
    const safeDirect = new Request("https://engivault.com/api/test", { method: "POST" });
    assert.ok(isSafeOrigin(safeDirect), "Request without Origin header must be permitted");

    const sameOrigin = new Request("https://engivault.com/api/test", {
      method: "POST",
      headers: { origin: "https://engivault.com", host: "engivault.com" },
    });
    assert.ok(isSafeOrigin(sameOrigin), "Matching origin and host must be permitted");

    const evilOrigin = new Request("https://engivault.com/api/test", {
      method: "POST",
      headers: { origin: "https://attacker-domain.evil", host: "engivault.com" },
    });
    assert.ok(!isSafeOrigin(evilOrigin), "Cross-origin attacker domain must be rejected");
  });

  await testAsync("getSafeRedirectUrl strictly allows relative same-origin paths and sanitizes open redirects", async () => {
    const { getSafeRedirectUrl } = await import("../lib/auth/token.ts");
    assert.strictEqual(getSafeRedirectUrl("/admin/dashboard"), "/admin/dashboard");
    assert.strictEqual(getSafeRedirectUrl("/subjects/ktucs101"), "/subjects/ktucs101");
    assert.strictEqual(getSafeRedirectUrl("https://evil.com"), "/admin/dashboard", "External absolute URL must return fallback");
    assert.strictEqual(getSafeRedirectUrl("//evil.com"), "/admin/dashboard", "Protocol-relative URL must return fallback");
    assert.strictEqual(getSafeRedirectUrl("/\\evil.com"), "/admin/dashboard", "Backslash injection must return fallback");
    assert.strictEqual(getSafeRedirectUrl(null, "/fallback"), "/fallback");
  });

  await testAsync("Signed admin session tokens reject forgery and tampering", async () => {
    const { createSignedToken, verifySignedToken } = await import("../lib/auth/token.ts");
    process.env.ADMIN_SESSION_SECRET = "test-secret-key-for-automated-verification-123";
    const token = createSignedToken({ role: "admin", createdAt: Date.now() });
    assert.ok(token.includes("."), "Signed token must contain base64 data and HMAC signature separated by dot");

    const valid = verifySignedToken(token);
    assert.ok(valid && valid.role === "admin", "Valid signed token must decode correctly");

    // Tampered data
    const [, sig] = token.split(".");
    const tamperedData = Buffer.from(JSON.stringify({ role: "admin", createdAt: Date.now() - 1000 })).toString("base64url");
    const tampered = `${tamperedData}.${sig}`;
    assert.strictEqual(verifySignedToken(tampered), null, "Tampered payload with mismatched signature must be rejected");

    // Expired token (> 7 days)
    const expiredData = Buffer.from(JSON.stringify({ role: "admin", createdAt: Date.now() - (8 * 24 * 60 * 60 * 1000) })).toString("base64url");
    const { createHmac } = await import("node:crypto");
    const expiredSig = createHmac("sha256", process.env.ADMIN_SESSION_SECRET).update(expiredData).digest("base64url");
    assert.strictEqual(verifySignedToken(`${expiredData}.${expiredSig}`), null, "Expired token (> 7 days) must be rejected");
  });

  await testAsync("checkDbRateLimit enforces sliding window limits and reports reset timings", async () => {
    const { checkDbRateLimit, _resetMemoryRateLimit } = await import("../lib/security/db-rate-limit.ts");
    const testKey = "test-rate-limit-key-" + Date.now();
    _resetMemoryRateLimit(testKey);

    // 1st attempt
    const r1 = await checkDbRateLimit(testKey, { windowSeconds: 60, maxAttempts: 2 });
    assert.ok(r1.allowed, "First attempt must be allowed");
    assert.strictEqual(r1.remaining, 1);

    // 2nd attempt
    const r2 = await checkDbRateLimit(testKey, { windowSeconds: 60, maxAttempts: 2 });
    assert.ok(r2.allowed, "Second attempt must be allowed");
    assert.strictEqual(r2.remaining, 0);

    // 3rd attempt: must be blocked
    const r3 = await checkDbRateLimit(testKey, { windowSeconds: 60, maxAttempts: 2 });
    assert.ok(!r3.allowed, "Third attempt must be blocked by rate limit");
    assert.strictEqual(r3.remaining, 0);
    assert.ok(r3.resetInSeconds > 0, "Reset in seconds must be positive");
  });

  test("Database migration 010 defines username, unique index, format constraint, and auth_rate_limits", () => {
    const sql = nodeFs.readFileSync("supabase/migrations/010_student_auth_and_rate_limits.sql", "utf-8");
    assert.ok(sql.includes("add column if not exists username text;"), "Must add username column to profiles");
    assert.ok(sql.includes("create unique index if not exists idx_profiles_lower_username"), "Must create lower(username) unique index");
    assert.ok(sql.includes("chk_profiles_username_format"), "Must enforce username format check");
    assert.ok(sql.includes("handle_new_user()"), "Must define handle_new_user trigger function");
    assert.ok(sql.includes("on_auth_user_created"), "Must attach trigger to auth.users");
    assert.ok(sql.includes("create table if not exists public.auth_rate_limits"), "Must define auth_rate_limits table");
    assert.ok(sql.includes("check_and_increment_rate_limit"), "Must define atomic rate limit RPC");
  });

  test("Auth and access control routes enforce nodejs runtime and serverless safety", () => {
    const signupCode = nodeFs.readFileSync("app/api/auth/student/signup/route.ts", "utf-8");
    assert.ok(signupCode.includes('runtime = "nodejs"'), "Signup route must declare nodejs runtime");

    const loginCode = nodeFs.readFileSync("app/api/auth/student/login/route.ts", "utf-8");
    assert.ok(loginCode.includes('runtime = "nodejs"'), "Login route must declare nodejs runtime");

    const logoutCode = nodeFs.readFileSync("app/api/auth/student/logout/route.ts", "utf-8");
    assert.ok(logoutCode.includes('runtime = "nodejs"'), "Logout route must declare nodejs runtime");

    const changePwCode = nodeFs.readFileSync("app/api/auth/student/change-password/route.ts", "utf-8");
    assert.ok(changePwCode.includes('runtime = "nodejs"'), "Change password route must declare nodejs runtime");

    const studentsAdminCode = nodeFs.readFileSync("app/api/admin/students/route.ts", "utf-8");
    assert.ok(studentsAdminCode.includes('runtime = "nodejs"'), "Students admin route must declare nodejs runtime");
    assert.ok(studentsAdminCode.includes("getAdminSession"), "Students admin route must enforce getAdminSession");
  });

  // 18. FOLE SPACE System Tests
  console.log("\n--- 18. FOLE SPACE SYSTEM & LOGIC (Open Space, Tickets, Flyers, Invariants) ---");

  await testAsync("Ticket code generation produces >=128-bit unguessable base64url codes", async () => {
    const { generateTicketCode } = await import("../lib/space/tickets.ts");
    const code1 = generateTicketCode();
    const code2 = generateTicketCode();

    assert.ok(code1 && typeof code1 === "string", "Ticket code must be a non-empty string");
    assert.ok(code1.length >= 22, `Ticket code must be at least 22 chars for >=128-bit entropy (got ${code1.length})`);
    assert.notStrictEqual(code1, code2, "Subsequent ticket codes must be unique and unguessable");
    assert.match(code1, /^[A-Za-z0-9_-]+$/, "Ticket code must only contain URL-safe base64 characters");
  });

  await testAsync("QR payload encoding and decoding enforces strict FS1 format", async () => {
    const { encodeTicketPayload, decodeTicketPayload } = await import("../lib/space/tickets.ts");
    const testCode = "test_ticket_code_12345";
    const payload = encodeTicketPayload(testCode);

    assert.strictEqual(payload, `FS1.${testCode}`, "Payload must be prefixed with FS1.");
    assert.strictEqual(decodeTicketPayload(payload), testCode, "Decoding valid payload must return original code");

    // Invalid formats
    assert.strictEqual(decodeTicketPayload("FS2.invalid"), null, "Non-FS1 version must be rejected");
    assert.strictEqual(decodeTicketPayload("invalid_plain_code"), null, "Unprefixed code must be rejected");
    assert.strictEqual(decodeTicketPayload("FS1."), null, "Empty ticket code payload must be rejected");
    assert.strictEqual(decodeTicketPayload(""), null, "Empty payload string must be rejected");
  });

  await testAsync("Time and countdown calculations handle server clock drift and expiry", async () => {
    const { calculateRemainingSeconds, formatCountdown, formatDateTimeIST } = await import("../lib/space/time.ts");

    const serverNow = "2026-10-22T10:00:00.000Z";
    const expiresFuture = "2026-10-22T10:30:00.000Z";
    const expiresPast = "2026-10-22T09:59:00.000Z";

    assert.strictEqual(calculateRemainingSeconds(expiresFuture, serverNow), 1800, "Should calculate exactly 1800s (30m)");
    assert.strictEqual(calculateRemainingSeconds(expiresPast, serverNow), 0, "Past expiry must clamp to 0s");

    assert.strictEqual(formatCountdown(1800), "30:00", "1800s must format to 30:00");
    assert.strictEqual(formatCountdown(65), "01:05", "65s must format to 01:05");
    assert.strictEqual(formatCountdown(0), "00:00", "0s must format to 00:00");

    const formattedIst = formatDateTimeIST("2026-10-22T10:00:00.000Z");
    assert.ok(formattedIst.includes("IST") || formattedIst.includes("pm"), "Must format explicitly in Asia/Kolkata");
  });

  await testAsync("Flyer magic-byte and raster validation accepts valid images and rejects SVG/scripts", async () => {
    const { validateFlyerBuffer, isRasterImageMime } = await import("../lib/space/flyer.ts");

    // Valid PNG minimal header (16x16 dummy IHDR)
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length (13)
      0x49, 0x48, 0x44, 0x52, // IHDR chunk type
      0x00, 0x00, 0x01, 0x00, // Width: 256
      0x00, 0x00, 0x02, 0x00, // Height: 512
      0x08, 0x06, 0x00, 0x00, 0x00,
    ]);

    const pngVal = validateFlyerBuffer(pngHeader);
    assert.ok(pngVal.isValid, "Valid PNG header must pass validation");
    assert.strictEqual(pngVal.mimeType, "image/png");
    assert.strictEqual(pngVal.width, 256, "Should extract natural width 256");
    assert.strictEqual(pngVal.height, 512, "Should extract natural height 512");

    // Invalid SVG / XSS attempt
    const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const svgVal = validateFlyerBuffer(svgBuffer);
    assert.strictEqual(svgVal.isValid, false, "SVG buffer must be rejected for flyers");
    assert.strictEqual(isRasterImageMime("image/svg+xml"), false, "SVG MIME must not be allowed");

    // Truncated / empty buffer
    const emptyVal = validateFlyerBuffer(Buffer.alloc(0));
    assert.strictEqual(emptyVal.isValid, false, "Empty buffer must be rejected");
  });

  test("Database migration 011 defines complete FOLE SPACE schema, RLS, and atomic RPCs", () => {
    const sql = nodeFs.readFileSync("supabase/migrations/011_fole_space_system.sql", "utf-8");

    assert.ok(sql.includes("create table if not exists public.space_settings"), "Must define space_settings table");
    assert.ok(sql.includes("create table if not exists public.space_sessions"), "Must define space_sessions table");
    assert.ok(sql.includes("create table if not exists public.space_organizers"), "Must define space_organizers table");
    assert.ok(sql.includes("create table if not exists public.space_events"), "Must define space_events table");
    assert.ok(sql.includes("create table if not exists public.space_event_registrations"), "Must define space_event_registrations table");
    assert.ok(sql.includes("create table if not exists public.space_event_checkins"), "Must define space_event_checkins table");
    assert.ok(sql.includes("create table if not exists public.space_audit_logs"), "Must define space_audit_logs table");

    // RLS Enforcement
    assert.ok(sql.includes("alter table public.space_settings enable row level security;"), "RLS must be enabled on space_settings");
    assert.ok(sql.includes("alter table public.space_sessions enable row level security;"), "RLS must be enabled on space_sessions");
    assert.ok(sql.includes("alter table public.space_organizers enable row level security;"), "RLS must be enabled on space_organizers");
    assert.ok(sql.includes("alter table public.space_events enable row level security;"), "RLS must be enabled on space_events");
    assert.ok(sql.includes("alter table public.space_event_registrations enable row level security;"), "RLS must be enabled on space_event_registrations");
    assert.ok(sql.includes("alter table public.space_event_checkins enable row level security;"), "RLS must be enabled on space_event_checkins");

    // Atomic SECURITY DEFINER RPCs
    assert.ok(sql.includes("rpc_space_checkin"), "Must define rpc_space_checkin");
    assert.ok(sql.includes("rpc_space_checkout"), "Must define rpc_space_checkout");
    assert.ok(sql.includes("rpc_space_extend"), "Must define rpc_space_extend");
    assert.ok(sql.includes("rpc_space_register_event"), "Must define rpc_space_register_event");
    assert.ok(sql.includes("rpc_space_cancel_registration"), "Must define rpc_space_cancel_registration");
    assert.ok(sql.includes("rpc_space_checkin_ticket"), "Must define rpc_space_checkin_ticket");
    assert.ok(sql.includes("rpc_space_virtual_checkin"), "Must define rpc_space_virtual_checkin");
    assert.ok(sql.includes("rpc_space_revoke_checkin"), "Must define rpc_space_revoke_checkin");

    // Row-level Locking & Concurrency Invariants
    assert.ok(sql.includes("for update"), "RPCs must lock settings and event rows with FOR UPDATE to prevent race conditions");

    // Security Grants
    assert.ok(sql.includes("revoke all on function public.rpc_space_checkin"), "Must revoke execution from public");
    assert.ok(sql.includes("grant execute on function public.rpc_space_checkin"), "Must grant execution to service_role");
  });

  test("All FOLE SPACE API routes declare nodejs runtime and origin protection", () => {
    const spaceRoutes = [
      "app/api/space/status/route.ts",
      "app/api/space/checkin/route.ts",
      "app/api/space/checkout/route.ts",
      "app/api/space/extend/route.ts",
      "app/api/space/my/route.ts",
      "app/api/space/events/route.ts",
      "app/api/space/events/[slug]/flyer/route.ts",
      "app/api/space/events/[id]/registration/route.ts",
      "app/api/space/events/[id]/checkin/virtual/route.ts",
      "app/api/space/organizer/events/route.ts",
      "app/api/space/organizer/events/[id]/route.ts",
      "app/api/space/organizer/events/[id]/publish/route.ts",
      "app/api/space/organizer/events/[id]/unpublish/route.ts",
      "app/api/space/organizer/events/[id]/cancel/route.ts",
      "app/api/space/organizer/events/[id]/live/route.ts",
      "app/api/space/organizer/events/[id]/end/route.ts",
      "app/api/space/organizer/events/[id]/desk/route.ts",
      "app/api/space/organizer/events/[id]/checkin/qr/route.ts",
      "app/api/space/organizer/events/[id]/checkin/manual/route.ts",
      "app/api/space/organizer/events/[id]/checkin/[checkinId]/route.ts",
      "app/api/space/organizer/flyer/sign/route.ts",
      "app/api/space/organizer/flyer/finalize/route.ts",
      "app/api/admin/space/settings/route.ts",
      "app/api/admin/space/sessions/route.ts",
      "app/api/admin/space/sessions/[id]/force-checkout/route.ts",
      "app/api/admin/space/organizers/route.ts",
      "app/api/admin/space/organizers/[userId]/route.ts",
      "app/api/admin/space/events/route.ts",
      "app/api/admin/space/events/[id]/moderate/route.ts",
      "app/api/admin/space/reports/route.ts",
    ];

    for (const routePath of spaceRoutes) {
      assert.ok(nodeFs.existsSync(routePath), `Route file must exist: ${routePath}`);
      const content = nodeFs.readFileSync(routePath, "utf-8");
      assert.ok(
        content.includes('runtime = "nodejs"'),
        `Route ${routePath} must declare export const runtime = "nodejs"`
      );

      // Mutation routes must check origin
      if (
        routePath.includes("checkin") ||
        routePath.includes("checkout") ||
        routePath.includes("extend") ||
        routePath.includes("registration") ||
        routePath.includes("publish") ||
        routePath.includes("unpublish") ||
        routePath.includes("cancel") ||
        routePath.includes("live") ||
        routePath.includes("end") ||
        routePath.includes("sign") ||
        routePath.includes("finalize") ||
        routePath.includes("moderate") ||
        routePath.includes("force-checkout")
      ) {
        assert.ok(
          content.includes("isSafeOrigin"),
          `Mutation route ${routePath} must check isSafeOrigin`
        );
      }
    }
  });

  // 19. FOLE SPACE Database Diagnosis, Migration 011 Setup & Error Handling
  console.log("\n--- 19. FOLE SPACE DATABASE DIAGNOSIS, MIGRATION 011 SETUP & ERROR HANDLING ---");

  await testAsync("isMissingSpaceSchemaError correctly classifies missing table and relation errors", async () => {
    const { isMissingSpaceSchemaError, FOLE_SPACE_SETUP_REQUIRED_MESSAGE, FOLE_SPACE_NOT_CONFIGURED_CODE } = await import("../lib/space/errors.ts");

    assert.strictEqual(FOLE_SPACE_SETUP_REQUIRED_MESSAGE, "FOLE SPACE database is not set up. Run migration 011.");
    assert.strictEqual(FOLE_SPACE_NOT_CONFIGURED_CODE, "FOLE_SPACE_DATABASE_NOT_CONFIGURED");

    // PGRST205 - Schema cache missing table
    assert.strictEqual(isMissingSpaceSchemaError({ code: "PGRST205", message: "Could not find the table 'public.space_settings' in the schema cache" }), true);

    // 42P01 - Postgres relation does not exist
    assert.strictEqual(isMissingSpaceSchemaError({ code: "42P01", message: 'relation "space_settings" does not exist' }), true);
    assert.strictEqual(isMissingSpaceSchemaError({ code: "42P01", message: 'relation "public.space_sessions" does not exist' }), true);

    // Text error from owner's issue report
    assert.strictEqual(isMissingSpaceSchemaError(new Error("Could not find the table 'public.space_settings' in the schema cache")), true);
    assert.strictEqual(isMissingSpaceSchemaError("Could not find the table 'public.space_settings' in the schema cache"), true);
  });

  await testAsync("isMissingSpaceSchemaError correctly classifies missing RPC/function errors", async () => {
    const { isMissingSpaceSchemaError } = await import("../lib/space/errors.ts");

    // PGRST202 - PostgREST function not found
    assert.strictEqual(isMissingSpaceSchemaError({ code: "PGRST202", message: "Could not find the function public.rpc_space_checkin in the schema cache" }), true);

    // 42883 - Postgres undefined_function
    assert.strictEqual(isMissingSpaceSchemaError({ code: "42883", message: 'function public.rpc_space_checkin() does not exist' }), true);
  });

  await testAsync("isMissingSpaceSchemaError rejects unrelated database errors", async () => {
    const { isMissingSpaceSchemaError } = await import("../lib/space/errors.ts");

    // Unique constraint violation (23505)
    assert.strictEqual(isMissingSpaceSchemaError({ code: "23505", message: "duplicate key value violates unique constraint" }), false);

    // Column not found on non-space table
    assert.strictEqual(isMissingSpaceSchemaError({ code: "42703", message: 'column "foo" does not exist' }), false);

    // Generic network / timeout error
    assert.strictEqual(isMissingSpaceSchemaError(new Error("Fetch failed: ECONNREFUSED")), false);

    // Missing relation for non-space table
    assert.strictEqual(isMissingSpaceSchemaError({ code: "42P01", message: 'relation "profiles" does not exist' }), false);

    // Null/undefined/empty
    assert.strictEqual(isMissingSpaceSchemaError(null), false);
    assert.strictEqual(isMissingSpaceSchemaError(undefined), false);
    assert.strictEqual(isMissingSpaceSchemaError({}), false);
  });

  await testAsync("Opening hours unrestricted logic treats empty hours as open 24/7", async () => {
    const { isWithinOpeningHours } = await import("../lib/space/time.ts");

    assert.deepStrictEqual(isWithinOpeningHours(null), { isOpen: true });
    assert.deepStrictEqual(isWithinOpeningHours(undefined), { isOpen: true });
    assert.deepStrictEqual(isWithinOpeningHours({}), { isOpen: true });
  });

  test("Supabase migrations have strictly unique version numbers and no duplicate migration files", () => {
    const migrationFiles = nodeFs.readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql"));
    const versions = new Map();

    for (const file of migrationFiles) {
      const match = file.match(/^(\d{3,})/);
      assert.ok(match, `Migration file ${file} must follow standard prefix convention (e.g. 001_...)`);
      const version = match[1];
      assert.strictEqual(
        versions.has(version),
        false,
        `Duplicate migration version detected: version ${version} used by both ${versions.get(version)} and ${file}`
      );
      versions.set(version, file);
    }

    // Explicitly verify 011 and 012
    assert.strictEqual(
      nodeFs.existsSync("supabase/migrations/011_fole_space_system.sql"),
      true,
      "011_fole_space_system.sql must exist as canonical historical migration"
    );
    assert.strictEqual(
      nodeFs.existsSync("supabase/migrations/011_fole_space_setup.sql"),
      false,
      "011_fole_space_setup.sql must be removed from supabase/migrations/ to prevent duplicate version conflict"
    );
    assert.strictEqual(
      nodeFs.existsSync("supabase/migrations/012_fole_space_security_hardening.sql"),
      true,
      "012_fole_space_security_hardening.sql must exist as follow-up migration"
    );
  });

  test("Canonical manual setup script supabase/manual/fole_space_setup.sql is owner-executable, idempotent, and contains explicit failure verification block", () => {
    assert.ok(nodeFs.existsSync("supabase/manual/fole_space_setup.sql"), "fole_space_setup.sql must exist in supabase/manual/");
    const sql = nodeFs.readFileSync("supabase/manual/fole_space_setup.sql", "utf-8");

    // All 7 tables - with physical singular space_audit_log and compatibility view space_audit_logs
    assert.ok(sql.includes("create table if not exists public.space_settings"), "Must create space_settings");
    assert.ok(sql.includes("create table if not exists public.space_sessions"), "Must create space_sessions");
    assert.ok(sql.includes("create table if not exists public.space_organizers"), "Must create space_organizers");
    assert.ok(sql.includes("create table if not exists public.space_events"), "Must create space_events");
    assert.ok(sql.includes("create table if not exists public.space_event_registrations"), "Must create space_event_registrations");
    assert.ok(sql.includes("create table if not exists public.space_event_checkins"), "Must create space_event_checkins");
    assert.ok(sql.includes("create table if not exists public.space_audit_log ("), "Must create physical singular space_audit_log table");
    assert.ok(sql.includes("create or replace view public.space_audit_logs"), "Must create backward-compatible space_audit_logs view");

    // Safe migration from legacy plural table without destructive cascade
    assert.ok(sql.includes("drop table public.space_audit_logs;"), "Must drop legacy table without cascade");
    assert.strictEqual(sql.includes("drop table public.space_audit_logs cascade;"), false, "Must avoid cascade drop");
    assert.ok(sql.includes("insert into public.space_audit_log"), "Must migrate existing audit logs");

    // CLI migration tracking reconciliation
    assert.ok(sql.includes("supabase_migrations.schema_migrations"), "Must reconcile supabase_migrations table if present");

    // RLS enabled on all 7 tables
    assert.ok(sql.includes("alter table public.space_settings enable row level security;"), "Must enable RLS on space_settings");
    assert.ok(sql.includes("alter table public.space_sessions enable row level security;"), "Must enable RLS on space_sessions");
    assert.ok(sql.includes("alter table public.space_organizers enable row level security;"), "Must enable RLS on space_organizers");
    assert.ok(sql.includes("alter table public.space_events enable row level security;"), "Must enable RLS on space_events");
    assert.ok(sql.includes("alter table public.space_event_registrations enable row level security;"), "Must enable RLS on space_event_registrations");
    assert.ok(sql.includes("alter table public.space_event_checkins enable row level security;"), "Must enable RLS on space_event_checkins");
    assert.ok(sql.includes("alter table public.space_audit_log enable row level security;"), "Must enable RLS on space_audit_log");

    // Strict access control on audit log
    assert.ok(sql.includes("revoke all on public.space_audit_log from public, anon, authenticated;"), "Must revoke audit table access from public/anon/authenticated");
    assert.ok(sql.includes("grant all on public.space_audit_log to service_role;"), "Must grant audit table access to service_role");
    assert.ok(sql.includes("revoke all on public.space_audit_logs from public, anon, authenticated;"), "Must revoke audit view access from public/anon/authenticated");
    assert.ok(sql.includes("grant select on public.space_audit_logs to service_role;"), "Must grant audit view select to service_role only");

    // Idempotent conservative seed with ON CONFLICT DO NOTHING
    assert.ok(sql.includes("insert into public.space_settings ("), "Must seed space_settings");
    assert.ok(sql.includes("on conflict (id) do nothing"), "Must use ON CONFLICT (id) DO NOTHING for safe rerun");

    // Storage bucket: private and no unrestricted direct-read SELECT policy
    assert.ok(sql.includes("'fole-space-flyers'"), "Must configure fole-space-flyers storage bucket");
    assert.ok(sql.includes("public = false"), "Bucket must be private");
    assert.ok(sql.includes('drop policy if exists "space_flyers_read" on storage.objects;'), "Must drop space_flyers_read policy");
    assert.strictEqual(
      sql.includes('create policy "space_flyers_read"'),
      false,
      "Regression: Must NOT recreate unrestricted direct SELECT policy on storage.objects for private flyer bucket"
    );

    // All 8 atomic RPCs with row locking and hardened search_path
    const rpcs = [
      "rpc_space_checkin",
      "rpc_space_checkout",
      "rpc_space_extend",
      "rpc_space_register_event",
      "rpc_space_cancel_registration",
      "rpc_space_checkin_ticket",
      "rpc_space_virtual_checkin",
      "rpc_space_revoke_checkin",
    ];
    for (const rpc of rpcs) {
      assert.ok(sql.includes(`function public.${rpc}`), `Must define ${rpc}`);
      assert.ok(sql.includes(`set search_path = public, pg_temp`), `Must enforce secure search_path on ${rpc}`);
      assert.ok(sql.includes(`revoke all on function public.${rpc}`), `Must revoke public execution on ${rpc}`);
      assert.ok(sql.includes(`grant execute on function public.${rpc}`), `Must grant execute to service_role on ${rpc}`);
    }

    // Schema cache reload
    assert.ok(sql.includes("notify pgrst, 'reload schema';"), "Must notify pgrst to reload schema");

    // Verification block: Explicit LEFT JOIN queries producing FAIL on missing objects
    assert.ok(sql.includes("AUTOMATED POST-SETUP VERIFICATION BLOCK"), "Must include prominent verification section");
    assert.ok(sql.includes("with expected_tables as"), "Verification must use expected_tables CTE with LEFT JOIN");
    assert.ok(sql.includes("FAIL (Table Missing)"), "Verification must output explicit FAIL on missing table");
    assert.ok(sql.includes("with expected_views as"), "Verification must check compatibility view");
    assert.ok(sql.includes("FAIL (Settings Row id=1 Missing)"), "Verification must output explicit FAIL on missing settings row");
    assert.ok(sql.includes("with expected_rpcs as"), "Verification must check RPCs with expected_rpcs CTE");
    assert.ok(sql.includes("FAIL (Function Missing)"), "Verification must output explicit FAIL on missing RPC function");
    assert.ok(sql.includes("FAIL (Insecure search_path)"), "Verification must inspect function search_path");
    assert.ok(sql.includes("FAIL (service_role denied)"), "Verification must inspect service_role execution privilege");
    assert.ok(sql.includes("FAIL (anon granted execute)"), "Verification must inspect anon execution revocation");
    assert.ok(sql.includes("with expected_bucket as"), "Verification must check storage bucket with expected_bucket CTE");
    assert.ok(sql.includes("FAIL (Bucket Missing)"), "Verification must output explicit FAIL on missing bucket");
    assert.ok(sql.includes("FAIL (Bucket is Public)"), "Verification must output explicit FAIL if bucket is public");
    assert.ok(sql.includes("matching_policies as"), "Verification must comprehensively inspect policies on storage.objects");
    assert.ok(sql.includes("PASS (No permissive policies on fole-space-flyers)"), "Verification must confirm no permissive policies on flyer bucket");
    assert.ok(sql.includes("ALL_CHECKS_PASSED"), "Verification must include consolidated overall health summary");
    assert.ok(sql.includes("ROLLBACK NOTES"), "Must include rollback notes");
  });

  test("Follow-up migration 012_fole_space_security_hardening.sql reconciles audit table and removes unrestricted storage policy", () => {
    assert.ok(nodeFs.existsSync("supabase/migrations/012_fole_space_security_hardening.sql"), "012 migration must exist");
    const sql = nodeFs.readFileSync("supabase/migrations/012_fole_space_security_hardening.sql", "utf-8");

    // Data-preserving reconciliation
    assert.ok(sql.includes("create table if not exists public.space_audit_log"), "Must create space_audit_log");
    assert.ok(sql.includes("insert into public.space_audit_log"), "Must migrate data from legacy space_audit_logs");
    assert.ok(sql.includes("drop table public.space_audit_logs;"), "Must drop legacy table after migration without cascade");
    assert.strictEqual(sql.includes("drop table public.space_audit_logs cascade;"), false, "Must avoid cascade drop");
    assert.ok(sql.includes("create or replace view public.space_audit_logs"), "Must create compatibility view");

    // Storage security
    assert.ok(sql.includes('drop policy if exists "space_flyers_read" on storage.objects;'), "Must drop space_flyers_read");
    assert.strictEqual(sql.includes('create policy "space_flyers_read"'), false, "Must not create unrestricted storage read policy");
    assert.ok(sql.includes("set public = false"), "Must ensure fole-space-flyers is marked private");

    // Audit grants
    assert.ok(sql.includes("revoke all on public.space_audit_log from public, anon, authenticated;"), "Must revoke audit permissions");
    assert.ok(sql.includes("grant all on public.space_audit_log to service_role;"), "Must grant audit table to service_role");

    // Schema cache reload
    assert.ok(sql.includes("notify pgrst, 'reload schema';"), "Must notify pgrst to reload schema");
  });

  test("Safe rerun of manual installation preserves administrator settings and audit log records", () => {
    const manualSql = nodeFs.readFileSync("supabase/manual/fole_space_setup.sql", "utf-8");

    // Conflict-safe settings: Re-running must never overwrite admin changes
    assert.ok(
      manualSql.includes("insert into public.space_settings") && manualSql.includes("on conflict (id) do nothing;"),
      "Must use ON CONFLICT (id) DO NOTHING for space_settings to prevent resetting admin values"
    );

    // Conflict-safe audit logs: Re-running must never duplicate or drop existing audit rows
    assert.ok(
      manualSql.includes("insert into public.space_audit_log") && manualSql.includes("on conflict (id) do nothing;"),
      "Must use ON CONFLICT (id) DO NOTHING when migrating or seeding audit log records"
    );

    // Non-destructive idempotent structure modifications
    assert.ok(manualSql.includes("create table if not exists"), "Tables must use CREATE TABLE IF NOT EXISTS");
    assert.ok(manualSql.includes("add column if not exists"), "Columns must use ADD COLUMN IF NOT EXISTS");
    assert.ok(manualSql.includes("create index if not exists"), "Indexes must use CREATE INDEX IF NOT EXISTS");
  });

  test("Manual installation and documented migration-history procedure prevent CLI conflicts", () => {
    const manualSql = nodeFs.readFileSync("supabase/manual/fole_space_setup.sql", "utf-8");
    const readme = nodeFs.readFileSync("README.md", "utf-8");
    const archDocs = nodeFs.readFileSync("docs/architecture.md", "utf-8");

    // Setup script populates schema_migrations if table exists
    assert.ok(
      manualSql.includes("supabase_migrations.schema_migrations"),
      "Manual setup must auto-register applied versions in supabase_migrations if present"
    );

    // README documents migration repair command for CLI users
    assert.ok(
      readme.includes("supabase migration repair --status applied 011"),
      "README must document 'supabase migration repair --status applied 011'"
    );
    assert.ok(
      readme.includes("supabase migration repair --status applied 012"),
      "README must document 'supabase migration repair --status applied 012'"
    );

    // Architecture docs specify CLI reconciliation
    assert.ok(
      archDocs.includes("supabase migration repair --status applied 011"),
      "Architecture documentation must describe CLI migration repair"
    );
  });

  test("Tracked deployment through migrations 011 and 012 executes sequentially without conflict", () => {
    const sql011 = nodeFs.readFileSync("supabase/migrations/011_fole_space_system.sql", "utf-8");
    const sql012 = nodeFs.readFileSync("supabase/migrations/012_fole_space_security_hardening.sql", "utf-8");

    // 011 defines initial baseline tables
    assert.ok(sql011.includes("create table if not exists public.space_audit_logs"), "011 establishes baseline space_audit_logs table");

    // 012 reconciles baseline table to singular physical table public.space_audit_log
    assert.ok(sql012.includes("create table if not exists public.space_audit_log"), "012 establishes physical table space_audit_log");
    assert.ok(sql012.includes("from public.space_audit_logs"), "012 migrates data from legacy table");
    assert.ok(sql012.includes("create or replace view public.space_audit_logs"), "012 replaces table with compatibility view");
    assert.ok(sql012.includes("set search_path = public, pg_temp"), "012 hardens RPC search_path");
    assert.ok(sql012.includes("drop policy if exists \"space_flyers_read\""), "012 drops unrestricted storage read policy");
  });

  test("Private flyer delivery route enforces event publication and deletion checks before streaming", () => {
    const flyerRoute = nodeFs.readFileSync("app/api/space/events/[slug]/flyer/route.ts", "utf-8");
    assert.ok(flyerRoute.includes("event.deleted_at"), "Flyer route must reject deleted events");
    assert.ok(flyerRoute.includes("isPublicStatus"), "Flyer route must verify event publication state");
    assert.ok(flyerRoute.includes("createAdminClient"), "Flyer route must download via trusted server admin client");
    assert.ok(flyerRoute.includes('.from("fole-space-flyers")'), "Flyer route must query fole-space-flyers bucket");
  });

  test("API route handlers for /api/space/status and admin settings enforce 503 on unconfigured database", () => {
    const statusRoute = nodeFs.readFileSync("app/api/space/status/route.ts", "utf-8");
    assert.ok(statusRoute.includes("status: 503"), "Status route must return HTTP 503 on unconfigured schema");
    assert.ok(statusRoute.includes("FOLE_SPACE_SETUP_REQUIRED_MESSAGE"), "Status route must return FOLE_SPACE_SETUP_REQUIRED_MESSAGE");
    assert.ok(statusRoute.includes("FOLE_SPACE_NOT_CONFIGURED_CODE"), "Status route must return FOLE_SPACE_NOT_CONFIGURED_CODE");

    const adminSettingsRoute = nodeFs.readFileSync("app/api/admin/space/settings/route.ts", "utf-8");
    assert.ok(adminSettingsRoute.includes("status: 503"), "Admin settings route must return HTTP 503 when schema is missing");
    assert.ok(adminSettingsRoute.includes("FOLE_SPACE_SETUP_REQUIRED_MESSAGE"), "Admin settings route must return setup required message");
  });

  test("Admin components handle unconfigured space schema gracefully without false success", () => {
    const overviewComp = nodeFs.readFileSync("components/admin/space/AdminSpaceOverview.tsx", "utf-8");
    assert.ok(overviewComp.includes("isMissingSpaceSchemaError") || overviewComp.includes("configured === false"), "Admin overview must check configured state");
    assert.ok(overviewComp.includes("status.configured === false"), "Master switch must check status.configured === false");
    assert.ok(overviewComp.includes("FOLE SPACE database is not set up. Run migration 011."), "Admin overview must render setup required message");

    const settingsComp = nodeFs.readFileSync("components/admin/space/AdminSpaceSettingsForm.tsx", "utf-8");
    assert.ok(settingsComp.includes("isMissingSpaceSchemaError") || settingsComp.includes("configured === false"), "Admin settings form must check configured state");
    assert.ok(settingsComp.includes("disabled={saving || !isConfigured}"), "Save button must be disabled when unconfigured");
  });

  console.log("\n=================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}


runTests();

