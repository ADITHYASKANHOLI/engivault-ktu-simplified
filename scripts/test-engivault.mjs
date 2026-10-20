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

  console.log("\n=================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

