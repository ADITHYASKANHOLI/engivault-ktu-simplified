import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "lib/queries/index.ts");
let content = fs.readFileSync(filePath, "utf-8");

// 1. Remove the duplicated initial fallback constants (lines between seed-data import and FallbackStoreData)
const markerStart = "const initialFallbackSiteSettings: SiteSettings = {";
const markerEnd = "// ---------------- Synchronized File-Backed Fallback Store ----------------";

const startIndex = content.indexOf(markerStart);
const endIndex = content.indexOf(markerEnd);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + content.slice(endIndex);
  console.log("Successfully removed duplicated initial fallback constants.");
} else {
  console.warn("Could not find start/end markers for duplicated constants.");
}

// 2. Update FallbackStoreData
content = content.replace(
  `interface FallbackStoreData {
  siteSettings: SiteSettings;
  subjects: Subject[];
  modules: Module[];
  lessons: Lesson[];
  videos: Video[];
  materials: Material[];
  activity: ActivityLog[];
}`,
  `interface FallbackStoreData {
  siteSettings: SiteSettings;
  departments: Department[];
  semesters: Semester[];
  faculty: Faculty[];
  topics: Topic[];
  subjects: Subject[];
  modules: Module[];
  lessons: Lesson[];
  videos: Video[];
  materials: Material[];
  activity: ActivityLog[];
}`
);

// 3. Update getInitialStore()
content = content.replace(
  `function getInitialStore(): FallbackStoreData {
  return {
    siteSettings: { ...initialFallbackSiteSettings },
    subjects: [...initialFallbackSubjects],
    modules: [...initialFallbackModules],
    lessons: [...initialFallbackLessons],
    videos: [...initialFallbackVideos],
    materials: [...initialFallbackMaterials],
    activity: [...initialFallbackActivity],
  };
}`,
  `function getInitialStore(): FallbackStoreData {
  return {
    siteSettings: { ...initialFallbackSiteSettings },
    departments: [...initialFallbackDepartments],
    semesters: [...initialFallbackSemesters],
    faculty: [...initialFallbackFaculty],
    topics: [...initialFallbackTopics],
    subjects: [...initialFallbackSubjects],
    modules: [...initialFallbackModules],
    lessons: [...initialFallbackLessons],
    videos: [...initialFallbackVideos],
    materials: [...initialFallbackMaterials],
    activity: [...initialFallbackActivity],
  };
}`
);

// 4. Update getStore() to backfill missing academic collections from seed data if loading an existing file
const oldGetStoreCheck = `if (parsed && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
        return parsed;
      }`;
const newGetStoreCheck = `if (parsed && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
        if (!Array.isArray(parsed.departments) || parsed.departments.length === 0) {
          parsed.departments = [...initialFallbackDepartments];
        }
        if (!Array.isArray(parsed.semesters) || parsed.semesters.length === 0) {
          parsed.semesters = [...initialFallbackSemesters];
        }
        if (!Array.isArray(parsed.faculty) || parsed.faculty.length === 0) {
          parsed.faculty = [...initialFallbackFaculty];
        }
        if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
          parsed.topics = [...initialFallbackTopics];
        }
        return parsed;
      }`;
content = content.replace(oldGetStoreCheck, newGetStoreCheck);

// 5. Add academic proxies
const proxyMarker = `const fallbackSubjects: Subject[] = createStoreArrayProxy<Subject>("subjects");`;
const newProxies = `const fallbackDepartments: Department[] = createStoreArrayProxy<Department>("departments");
const fallbackSemesters: Semester[] = createStoreArrayProxy<Semester>("semesters");
const fallbackFaculty: Faculty[] = createStoreArrayProxy<Faculty>("faculty");
const fallbackTopics: Topic[] = createStoreArrayProxy<Topic>("topics");
const fallbackSubjects: Subject[] = createStoreArrayProxy<Subject>("subjects");`;

content = content.replace(proxyMarker, newProxies);

// 6. Update enrichFallbackLesson
const oldEnrichFallback = `function enrichFallbackLesson(lesson: Lesson): Lesson {
  const mod = fallbackModules.find((m) => m.id === lesson.module_id);
  const subject = mod ? fallbackSubjects.find((s) => s.id === mod.subject_id) : undefined;
  const video = fallbackVideos.find((v) => v.lesson_id === lesson.id) || null;
  const materials = fallbackMaterials.filter((m) => m.lesson_id === lesson.id);

  const rawYoutubeUrl = lesson.youtube_url || lesson.youtubeUrl || null;
  const youtube_url = rawYoutubeUrl ? rawYoutubeUrl.trim() : null;
  const youtube_video_id =
    lesson.youtube_video_id ||
    lesson.youtubeVideoId ||
    (youtube_url ? extractYouTubeVideoId(youtube_url) : null);

  const thumbnail_path =
    lesson.thumbnail_path ||
    (youtube_video_id ? getYouTubeThumbnailUrl(youtube_video_id) : null);

  return {
    ...lesson,
    youtube_url,
    youtube_video_id,
    youtubeUrl: youtube_url,
    youtubeVideoId: youtube_video_id,
    thumbnail_path,
    module: mod ? { ...mod, subject } : undefined,
    video,
    materials,
  };
}`;

const newEnrichFallback = `function enrichFallbackLesson(lesson: Lesson): Lesson {
  const mod = fallbackModules.find((m) => m.id === lesson.module_id);
  const rawSubject = mod ? fallbackSubjects.find((s) => s.id === mod.subject_id) : undefined;
  const topic = lesson.topic_id ? fallbackTopics.find((t) => t.id === lesson.topic_id) : undefined;
  const faculty = lesson.faculty_id
    ? fallbackFaculty.find((f) => f.id === lesson.faculty_id)
    : undefined;
  const video = fallbackVideos.find((v) => v.lesson_id === lesson.id) || null;
  const materials = fallbackMaterials.filter((m) => m.lesson_id === lesson.id);

  const rawYoutubeUrl = lesson.youtube_url || lesson.youtubeUrl || null;
  const youtube_url = rawYoutubeUrl ? rawYoutubeUrl.trim() : null;
  const youtube_video_id =
    lesson.youtube_video_id ||
    lesson.youtubeVideoId ||
    (youtube_url ? extractYouTubeVideoId(youtube_url) : null);

  const thumbnail_path =
    lesson.thumbnail_path ||
    (youtube_video_id ? getYouTubeThumbnailUrl(youtube_video_id) : null);

  const enrichedSubject: Subject | undefined = rawSubject
    ? {
        ...rawSubject,
        department: rawSubject.department_id
          ? fallbackDepartments.find((d) => d.id === rawSubject.department_id)
          : undefined,
        semester: rawSubject.semester_id
          ? fallbackSemesters.find((s) => s.id === rawSubject.semester_id)
          : undefined,
      }
    : undefined;

  return {
    ...lesson,
    youtube_url,
    youtube_video_id,
    youtubeUrl: youtube_url,
    youtubeVideoId: youtube_video_id,
    thumbnail_path,
    instructor: lesson.instructor || faculty?.name || null,
    faculty,
    topic,
    module: mod ? { ...mod, subject: enrichedSubject } : undefined,
    video,
    materials,
  };
}`;

content = content.replace(oldEnrichFallback, newEnrichFallback);

// 7. Update createLesson to support academic fields
const oldInsertPayload = `  const insertPayload = {
    id: data.id || crypto.randomUUID(),
    module_id: data.module_id!,
    title: data.title || "Untitled Lecture",
    slug: data.slug || \`lecture-\${Date.now()}\`,
    lesson_number: data.lesson_number ?? 1,
    description: data.description || null,
    thumbnail_path: thumbnail_path || null,
    duration_seconds: data.duration_seconds ?? 1200,
    published: Boolean(data.published),
    display_order: data.display_order ?? (fallbackLessons.length + 1),
    youtube_url,
    youtube_video_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };`;

const newInsertPayload = `  const insertPayload = {
    id: data.id || crypto.randomUUID(),
    module_id: data.module_id!,
    topic_id: data.topic_id || null,
    faculty_id: data.faculty_id || null,
    instructor: data.instructor || null,
    title: data.title || "Untitled Lecture",
    slug: data.slug || \`lecture-\${Date.now()}\`,
    lesson_number: data.lesson_number ?? 1,
    description: data.description || null,
    thumbnail_path: thumbnail_path || null,
    duration_seconds: data.duration_seconds ?? 1200,
    published: Boolean(data.published),
    display_order: data.display_order ?? (fallbackLessons.length + 1),
    order_index: data.order_index ?? (data.lesson_number ?? 1),
    status: data.status || (Boolean(data.published) ? "published" : "draft"),
    youtube_url,
    youtube_video_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };`;

content = content.replace(oldInsertPayload, newInsertPayload);

// 8. Add Academic Hierarchy Query Functions at the bottom of the file
const academicQueries = `

// ============================================================================
// ---------------- ACADEMIC HIERARCHY QUERY LAYER ----------------
// Tier 1: Departments / Branches
// Tier 2: Semesters / Academic Years
// Tier 3: Subjects
// Tier 4: Modules / Units
// Tier 5: Topics
// Tier 6: Lectures (Canonical central unit: Lesson)
// ============================================================================

export async function getAllDepartments(): Promise<Department[]> {
  if (!isSupabaseConfigured()) {
    return [...fallbackDepartments].sort((a, b) => a.display_order - b.display_order);
  }
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data) {
      if (isLocalFallbackAllowed()) return [...fallbackDepartments].sort((a, b) => a.display_order - b.display_order);
      throw new Error(\`Failed to fetch departments from Supabase: \${error?.message}\`);
    }
    return data;
  } catch (err) {
    if (isLocalFallbackAllowed()) return [...fallbackDepartments].sort((a, b) => a.display_order - b.display_order);
    throw err;
  }
}

export async function getDepartmentBySlug(slug: string): Promise<Department | null> {
  const departments = await getAllDepartments();
  return departments.find((d) => d.slug === slug || d.code.toLowerCase() === slug.toLowerCase()) || null;
}

export async function getAllSemesters(): Promise<Semester[]> {
  if (!isSupabaseConfigured()) {
    return [...fallbackSemesters].sort((a, b) => a.number - b.number);
  }
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("semesters")
      .select("*")
      .order("number", { ascending: true });

    if (error || !data) {
      if (isLocalFallbackAllowed()) return [...fallbackSemesters].sort((a, b) => a.number - b.number);
      throw new Error(\`Failed to fetch semesters from Supabase: \${error?.message}\`);
    }
    return data;
  } catch (err) {
    if (isLocalFallbackAllowed()) return [...fallbackSemesters].sort((a, b) => a.number - b.number);
    throw err;
  }
}

export async function getSemestersByDepartment(departmentId?: string): Promise<Semester[]> {
  const semesters = await getAllSemesters();
  if (!departmentId) return semesters;
  return semesters.filter((s) => !s.department_id || s.department_id === departmentId);
}

export async function getAllFaculty(): Promise<Faculty[]> {
  if (!isSupabaseConfigured()) {
    return [...fallbackFaculty];
  }
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("faculty")
      .select("*")
      .order("name", { ascending: true });

    if (error || !data) {
      if (isLocalFallbackAllowed()) return [...fallbackFaculty];
      throw new Error(\`Failed to fetch faculty from Supabase: \${error?.message}\`);
    }
    return data;
  } catch (err) {
    if (isLocalFallbackAllowed()) return [...fallbackFaculty];
    throw err;
  }
}

export async function getFacultyById(id: string): Promise<Faculty | null> {
  const facultyList = await getAllFaculty();
  return facultyList.find((f) => f.id === id) || null;
}

export async function getAllTopics(): Promise<Topic[]> {
  if (!isSupabaseConfigured()) {
    return [...fallbackTopics].sort((a, b) => a.display_order - b.display_order);
  }
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data) {
      if (isLocalFallbackAllowed()) return [...fallbackTopics].sort((a, b) => a.display_order - b.display_order);
      throw new Error(\`Failed to fetch topics from Supabase: \${error?.message}\`);
    }
    return data;
  } catch (err) {
    if (isLocalFallbackAllowed()) return [...fallbackTopics].sort((a, b) => a.display_order - b.display_order);
    throw err;
  }
}

export async function getTopicsByModule(moduleId: string): Promise<Topic[]> {
  const topics = await getAllTopics();
  return topics.filter((t) => t.module_id === moduleId);
}

export async function getTopicById(id: string): Promise<Topic | null> {
  const topics = await getAllTopics();
  return topics.find((t) => t.id === id) || null;
}

export async function getTopicBySlug(moduleSlug: string, topicSlug: string): Promise<Topic | null> {
  const mod = await getModuleBySlug(moduleSlug);
  if (!mod) return null;
  const topics = await getTopicsByModule(mod.id);
  const topic = topics.find((t) => t.slug === topicSlug) || null;
  if (topic) topic.module = mod;
  return topic;
}

export async function createTopic(data: Partial<Topic>): Promise<Topic> {
  const newTopic: Topic = {
    id: data.id || crypto.randomUUID(),
    module_id: data.module_id!,
    title: data.title!,
    slug: data.slug || \`topic-\${Date.now()}\`,
    description: data.description || null,
    display_order: data.display_order ?? (fallbackTopics.length + 1),
    published: data.published ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data: created, error } = await supabase.from("topics").insert(newTopic).select().single();
      if (error) {
        throw new Error(\`Failed to create topic in database: \${error.message}\`);
      }
      fallbackTopics.push(created);
      return created;
    } catch (err) {
      if (!isLocalFallbackAllowed()) throw err;
    }
  }

  fallbackTopics.push(newTopic);
  return newTopic;
}

export async function getLecturesByTopic(topicId: string): Promise<Lesson[]> {
  const allLessons = await getAllLessons();
  return allLessons.filter((l) => l.topic_id === topicId && l.published);
}

/**
 * Multi-discipline cascading academic search and filter query.
 * Matches across:
 * - Department / Branch
 * - Semester / Year
 * - Subject
 * - Module
 * - Topic
 * - Faculty / Instructor
 * - Lecture title & code
 */
export async function getLecturesByHierarchy(filter: {
  departmentId?: string;
  semesterNumber?: number;
  subjectId?: string;
  moduleId?: string;
  topicId?: string;
  query?: string;
}): Promise<Lesson[]> {
  const allLessons = await getAllLessons();
  let filtered = allLessons.filter((l) => l.published);

  if (filter.topicId) {
    filtered = filtered.filter((l) => l.topic_id === filter.topicId);
  }

  if (filter.moduleId) {
    filtered = filtered.filter((l) => l.module_id === filter.moduleId);
  }

  if (filter.subjectId) {
    filtered = filtered.filter((l) => l.module?.subject_id === filter.subjectId);
  }

  if (filter.departmentId) {
    filtered = filtered.filter(
      (l) => l.module?.subject?.department_id === filter.departmentId
    );
  }

  if (filter.semesterNumber) {
    filtered = filtered.filter(
      (l) => l.module?.subject?.semester_number === filter.semesterNumber
    );
  }

  if (filter.query && filter.query.trim()) {
    const q = filter.query.toLowerCase().trim();
    filtered = filtered.filter((l) => {
      const titleMatch = l.title.toLowerCase().includes(q);
      const descMatch = (l.description || "").toLowerCase().includes(q);
      const topicMatch = (l.topic?.title || "").toLowerCase().includes(q);
      const moduleMatch = (l.module?.title || "").toLowerCase().includes(q);
      const subjectMatch = (l.module?.subject?.title || "").toLowerCase().includes(q);
      const subjectCodeMatch = (l.module?.subject?.code || "").toLowerCase().includes(q);
      const instructorMatch = (l.instructor || l.faculty?.name || "").toLowerCase().includes(q);
      const deptMatch = (l.module?.subject?.department?.name || "").toLowerCase().includes(q);

      return (
        titleMatch ||
        descMatch ||
        topicMatch ||
        moduleMatch ||
        subjectMatch ||
        subjectCodeMatch ||
        instructorMatch ||
        deptMatch
      );
    });
  }

  return filtered;
}
`;

content = content + academicQueries;

fs.writeFileSync(filePath, content, "utf-8");
console.log("Successfully updated lib/queries/index.ts with academic hierarchy layer!");
