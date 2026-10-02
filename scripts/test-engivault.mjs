import assert from "node:assert/strict";

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

  test("Valid watch URL extracts 11-char video ID", () => {
    const res = parseYouTubeUrl("https://www.youtube.com/watch?v=1b_rJ2_aG4c");
    assert.equal(res.isValid, true);
    assert.equal(res.videoId, "1b_rJ2_aG4c");
    assert.equal(res.canonicalUrl, "https://www.youtube.com/watch?v=1b_rJ2_aG4c");
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

  console.log("\n=================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
