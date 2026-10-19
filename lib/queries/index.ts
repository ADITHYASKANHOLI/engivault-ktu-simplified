import fs from "fs";
import path from "path";
import {
  Subject,
  Module,
  Lesson,
  Lecture,
  Video,
  Material,
  SiteSettings,
  ActivityLog,
  SearchResultItem,
  Department,
  Semester,
  Topic,
  Faculty,
} from "@/types";
import { createClient as createServerSupabase, isSupabaseConfigured } from "../supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "../supabase/admin";
import { getSignedVideoUrl, getSignedMaterialUrl } from "../storage/signed-urls";
import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from "../utils/youtube";
export {
  initialFallbackSiteSettings,
  initialFallbackDepartments,
  initialFallbackSemesters,
  initialFallbackFaculty,
  initialFallbackSubjects,
  initialFallbackModules,
  initialFallbackTopics,
  initialFallbackLessons,
  initialFallbackVideos,
  initialFallbackMaterials,
  initialFallbackActivity,
} from "./seed-data";
import {
  initialFallbackSiteSettings,
  initialFallbackDepartments,
  initialFallbackSemesters,
  initialFallbackFaculty,
  initialFallbackSubjects,
  initialFallbackModules,
  initialFallbackTopics,
  initialFallbackLessons,
  initialFallbackVideos,
  initialFallbackMaterials,
  initialFallbackActivity,
} from "./seed-data";

// ---------------- Synchronized File-Backed Fallback Store ----------------
// When Supabase is not yet configured with production keys, this store ensures that
// Next.js Route Handlers and Server Components (which run in separate workers/bundles)
// read and mutate the EXACT SAME dataset with instant consistency.

interface FallbackStoreData {
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
}

const STORE_FILE_PATH = path.join(process.cwd(), ".engivault-local-store.json");

function getInitialStore(): FallbackStoreData {
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
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function getStore(): FallbackStoreData {
  if (isProduction()) {
    return getInitialStore();
  }
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const content = fs.readFileSync(STORE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
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
      }
    }
  } catch (err) {
    console.warn("Notice: Reading fallback store file:", err);
  }
  const init = getInitialStore();
  try {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(init, null, 2), "utf-8");
  } catch {}
  return init;
}

function saveStore(data: FallbackStoreData): void {
  if (isProduction()) {
    return; // Strictly no filesystem writes on Vercel/production
  }
  try {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save local store:", err);
  }
}

function createStoreArrayProxy<T>(key: keyof FallbackStoreData): T[] {
  return new Proxy([] as unknown as T[], {
    get(target, prop, receiver) {
      const store = getStore();
      const arr = store[key] as unknown as any[];
      const val = Reflect.get(arr, prop, arr);
      if (typeof val === "function") {
        return function (...args: any[]) {
          const s = getStore();
          const currentArr = s[key] as unknown as any[];
          const res = Reflect.apply(val, currentArr, args);
          if (["push", "pop", "shift", "unshift", "splice", "sort", "reverse"].includes(String(prop))) {
            saveStore(s);
          }
          return res;
        };
      }
      return val;
    },
    set(target, prop, value) {
      const s = getStore();
      Reflect.set(s[key] as unknown as any, prop, value, s[key]);
      saveStore(s);
      return true;
    },
  });
}

const fallbackSiteSettings: SiteSettings = new Proxy({} as SiteSettings, {
  get(target, prop, receiver) {
    const s = getStore().siteSettings;
    return Reflect.get(s, prop, s);
  },
  set(target, prop, value) {
    const s = getStore();
    Reflect.set(s.siteSettings, prop, value, s.siteSettings);
    saveStore(s);
    return true;
  },
});

const fallbackDepartments: Department[] = createStoreArrayProxy<Department>("departments");
const fallbackSemesters: Semester[] = createStoreArrayProxy<Semester>("semesters");
const fallbackFaculty: Faculty[] = createStoreArrayProxy<Faculty>("faculty");
const fallbackTopics: Topic[] = createStoreArrayProxy<Topic>("topics");
const fallbackSubjects: Subject[] = createStoreArrayProxy<Subject>("subjects");
const fallbackModules: Module[] = createStoreArrayProxy<Module>("modules");
const fallbackLessons: Lesson[] = createStoreArrayProxy<Lesson>("lessons");
const fallbackVideos: Video[] = createStoreArrayProxy<Video>("videos");
const fallbackMaterials: Material[] = createStoreArrayProxy<Material>("materials");
const fallbackActivity: ActivityLog[] = createStoreArrayProxy<ActivityLog>("activity");

// Helper to populate virtual relations in fallback arrays
function enrichFallbackLesson(lesson: Lesson): Lesson {
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
}

export function normalizeLessonFields<T extends Record<string, any>>(lesson: T): T {
  if (!lesson) return lesson;
  const rawUrl = lesson.youtube_url || lesson.youtubeUrl || null;
  const youtube_url = rawUrl ? String(rawUrl).trim() : null;
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
  };
}



/**
 * Determines whether the in-memory/file fallback store may be used.
 * - When Supabase is NOT configured: returns true (zero-setup local development mode).
 * - When Supabase IS configured: returns true ONLY if ENGIVAULT_ALLOW_LOCAL_FALLBACK=true.
 *   Otherwise, all Supabase errors throw loudly to prevent silent data desynchronization.
 */
export function isLocalFallbackAllowed(): boolean {
  // In production (Vercel deployment or NODE_ENV=production), local fallback is strictly disabled.
  // The authoritative production data source MUST be Supabase PostgreSQL.
  if (isProduction()) {
    return false;
  }
  if (!isSupabaseConfigured()) {
    return true;
  }
  return process.env.ENGIVAULT_ALLOW_LOCAL_FALLBACK === "true";
}

// ---------------- Site Settings ----------------

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured()) {
    return fallbackSiteSettings;
  }
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("Notice: Fetching site settings from Supabase:", error.message);
      return fallbackSiteSettings;
    }
    if (!data) {
      return fallbackSiteSettings;
    }
    return data;
  } catch (err: any) {
    console.warn("Notice: Fetching site settings from Supabase:", err?.message || err);
    return fallbackSiteSettings;
  }
}

export async function updateSiteSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const payload = { ...updates, updated_at: new Date().toISOString() };
      delete (payload as any).id;
      const { data, error } = await supabase
        .from("site_settings")
        .update(payload)
        .eq("id", fallbackSiteSettings.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update site settings in Supabase: ${error.message}`);
      }
      if (data) {
        Object.assign(fallbackSiteSettings, data);
        await logActivity("Site Settings Updated", "settings");
        return fallbackSiteSettings;
      }
    } catch (err: any) {
      if (!isLocalFallbackAllowed()) {
        throw err;
      }
      console.warn("Supabase updateSiteSettings notice:", err);
    }
  }

  if (!isLocalFallbackAllowed()) {
    throw new Error("Supabase is configured but site settings update failed and local fallback is disabled.");
  }

  Object.assign(fallbackSiteSettings, updates, {
    updated_at: new Date().toISOString(),
  });
  await logActivity("Site Settings Updated", "settings");
  return fallbackSiteSettings;
}

// ---------------- Subjects ----------------

export async function getPublishedSubjects(): Promise<Subject[]> {
  if (!isSupabaseConfigured()) {
    return fallbackSubjects.filter((s) => s.published);
  }
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("subjects")
      .select("*, modules(id, published, lessons(id, published, materials(id, published)))")
      .eq("published", true)
      .order("display_order", { ascending: true });

    if (error) {
      if (isLocalFallbackAllowed()) return fallbackSubjects.filter((s) => s.published);
      throw new Error(`Failed to fetch published subjects from Supabase: ${error.message}`);
    }
    if (!data) {
      if (isLocalFallbackAllowed()) return fallbackSubjects.filter((s) => s.published);
      return [];
    }

    return data.map((s: any) => ({
      ...s,
      modules_count: s.modules?.filter((m: any) => m.published)?.length || 0,
      lessons_count: s.modules?.reduce((acc: number, m: any) => acc + (m.published ? (m.lessons?.filter((l: any) => l.published)?.length || 0) : 0), 0) || 0,
      materials_count: s.modules?.reduce((acc: number, m: any) => 
        acc + (m.published ? (m.lessons?.reduce((lAcc: number, l: any) => lAcc + (l.published ? (l.materials?.filter((mat: any) => mat.published)?.length || 0) : 0), 0) || 0) : 0), 0) || 0,
    }));
  } catch (err) {
    if (isLocalFallbackAllowed()) return fallbackSubjects.filter((s) => s.published);
    throw err;
  }
}

export async function getAllSubjects(): Promise<Subject[]> {
  if (!isSupabaseConfigured()) {
    return fallbackSubjects;
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("subjects")
      .select("*, modules(id, lessons(id, materials(id)))")
      .order("display_order", { ascending: true });

    if (error) {
      if (isLocalFallbackAllowed()) return fallbackSubjects;
      throw new Error(`Failed to fetch all subjects from Supabase: ${error.message}`);
    }
    if (!data) {
      if (isLocalFallbackAllowed()) return fallbackSubjects;
      return [];
    }

    return data.map((s: any) => ({
      ...s,
      modules_count: s.modules?.length || 0,
      lessons_count: s.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0,
      materials_count: s.modules?.reduce((acc: number, m: any) => 
        acc + (m.lessons?.reduce((lAcc: number, l: any) => lAcc + (l.materials?.length || 0), 0) || 0), 0) || 0,
    }));
  } catch (err) {
    if (isLocalFallbackAllowed()) return fallbackSubjects;
    throw err;
  }
}

export async function getSubjectBySlug(slug: string, requirePublished = true): Promise<Subject | null> {
  if (!isSupabaseConfigured()) {
    const subject = fallbackSubjects.find((s) => s.slug === slug);
    if (!subject) return null;
    if (requirePublished && !subject.published) return null;
    return subject;
  }
  try {
    const supabase = await createServerSupabase();
    let query = supabase.from("subjects").select("*").eq("slug", slug);
    if (requirePublished) query = query.eq("published", true);
    const { data, error } = await query.maybeSingle();

    if (error) {
      if (isLocalFallbackAllowed()) {
        const fallbackSub = fallbackSubjects.find((s) => s.slug === slug);
        if (!fallbackSub || (requirePublished && !fallbackSub.published)) return null;
        return fallbackSub;
      }
      throw new Error(`Failed to fetch subject by slug from Supabase: ${error.message}`);
    }
    return data;
  } catch (err) {
    if (isLocalFallbackAllowed()) {
      const fallbackSub = fallbackSubjects.find((s) => s.slug === slug);
      if (!fallbackSub || (requirePublished && !fallbackSub.published)) return null;
      return fallbackSub;
    }
    throw err;
  }
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  if (!isSupabaseConfigured()) {
    return fallbackSubjects.find((s) => s.id === id) || null;
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("subjects").select("*").eq("id", id).maybeSingle();

    if (error) {
      if (isLocalFallbackAllowed()) {
        return fallbackSubjects.find((s) => s.id === id) || null;
      }
      throw new Error(`Failed to fetch subject by ID from Supabase: ${error.message}`);
    }
    return data;
  } catch (err) {
    if (isLocalFallbackAllowed()) {
      return fallbackSubjects.find((s) => s.id === id) || null;
    }
    throw err;
  }
}

export async function createSubject(subject: Partial<Subject>): Promise<Subject> {
  const newId = subject.id || crypto.randomUUID();

  // DB insert payload: only columns that actually exist in the subjects table.
  // modules_count, lessons_count, and materials_count are computed/display-only
  // fields that do NOT exist as database columns — never send them to Supabase.
  const dbPayload: Record<string, unknown> = {
    id: newId,
    title: subject.title || "Untitled Subject",
    slug: subject.slug || `subject-${Date.now()}`,
    code: subject.code || null,
    short_description: subject.short_description || null,
    description: subject.description || null,
    thumbnail_path: subject.thumbnail_path || null,
    published: Boolean(subject.published),
    display_order: subject.display_order ?? fallbackSubjects.length + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...(subject.department_id !== undefined && { department_id: subject.department_id }),
    ...(subject.semester_id !== undefined && { semester_id: subject.semester_id }),
    ...(subject.semester_number !== undefined && { semester_number: subject.semester_number }),
  };

  // Full in-memory / fallback representation (includes computed frontend fields)
  const row: Subject = {
    ...(dbPayload as Omit<Subject, "modules_count" | "lessons_count" | "materials_count">),
    modules_count: 0,
    lessons_count: 0,
    materials_count: 0,
  } as Subject;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      // Insert only dbPayload — excludes computed columns that don't exist in the DB schema
      const { data, error } = await supabase.from("subjects").insert(dbPayload).select().single();
      if (error) {
        console.error("Supabase createSubject error:", error);
        throw new Error(`Failed to create subject: ${error.message}`);
      }
      // Enrich with computed display fields (0 since subject was just created)
      const enriched: Subject = { ...data, modules_count: 0, lessons_count: 0, materials_count: 0 };
      if (!isProduction()) {
        fallbackSubjects.push(enriched);
      }
      await logActivity("Subject Created", "subject", { id: data.id, title: data.title, slug: data.slug });
      return enriched;
    } catch (err: any) {
      console.error("Supabase createSubject error:", err);
      throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to create subjects in production. Local JSON store is strictly disabled.");
  }

  fallbackSubjects.push(row);
  await logActivity("Subject Created", "subject", { id: row.id, title: row.title, slug: row.slug });
  return row;
}

export async function updateSubject(id: string, updates: Partial<Subject>): Promise<Subject | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const payload = { ...updates, updated_at: new Date().toISOString() };
      delete (payload as any).id;
      delete (payload as any).created_at;
      delete (payload as any).modules_count;
      delete (payload as any).lessons_count;
      delete (payload as any).materials_count;
      const { data, error } = await supabase.from("subjects").update(payload).eq("id", id).select().single();
      if (error) {
        console.error("Supabase updateSubject error:", error);
        throw new Error(`Failed to update subject: ${error.message}`);
      }
      if (!isProduction()) {
        const idx = fallbackSubjects.findIndex((s) => s.id === id);
        if (idx !== -1) {
          fallbackSubjects[idx] = { ...fallbackSubjects[idx], ...data };
        }
      }
      await logActivity("Subject Updated", "subject", { id, title: data.title });
      return data;
    } catch (err: any) {
      console.error("Supabase updateSubject error:", err);
      throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to update subjects in production. Local JSON store is strictly disabled.");
  }

  const index = fallbackSubjects.findIndex((s) => s.id === id);
  if (index === -1) return null;
  fallbackSubjects[index] = {
    ...fallbackSubjects[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  await logActivity("Subject Updated", "subject", { id, updates });
  return fallbackSubjects[index];
}

export async function deleteSubject(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();

      // 1. Fetch subject to verify existence
      const { data: existing, error: existErr } = await supabase
        .from("subjects")
        .select("id, title, slug")
        .eq("id", id)
        .maybeSingle();

      if (existErr) {
        console.error("Supabase fetch subject error:", existErr);
        throw new Error(`Failed to fetch subject: ${existErr.message}`);
      }

      if (!existing) {
        const localIdx = fallbackSubjects.findIndex((s) => s.id === id);
        if (localIdx !== -1) {
          fallbackSubjects.splice(localIdx, 1);
          return true;
        }
        return false;
      }

      // 2. Find all modules belonging to this subject
      const { data: subjectModules } = await supabase
        .from("modules")
        .select("id")
        .eq("subject_id", id);
      const moduleIds = (subjectModules || []).map((m: any) => m.id);

      let lessonIds: string[] = [];
      if (moduleIds.length > 0) {
        // 3. Find all lessons belonging to those modules
        const { data: subjectLessons } = await supabase
          .from("lessons")
          .select("id")
          .in("module_id", moduleIds);
        lessonIds = (subjectLessons || []).map((l: any) => l.id);

        if (lessonIds.length > 0) {
          // 4. Collect video and material storage paths
          const { data: videoRows } = await supabase
            .from("videos")
            .select("storage_path")
            .in("lesson_id", lessonIds);
          const videoPaths = (videoRows || []).map((v: any) => v.storage_path).filter(Boolean);

          const { data: materialRows } = await supabase
            .from("materials")
            .select("storage_path")
            .in("lesson_id", lessonIds);
          const materialPaths = (materialRows || []).map((m: any) => m.storage_path).filter(Boolean);

          if (videoPaths.length > 0) {
            try {
              await supabase.storage.from("engivault-videos").remove(videoPaths);
            } catch (err) {
              console.warn("Storage video cleanup notice during subject deletion:", err);
            }
          }
          if (materialPaths.length > 0) {
            try {
              await supabase.storage.from("engivault-materials").remove(materialPaths);
            } catch (err) {
              console.warn("Storage material cleanup notice during subject deletion:", err);
            }
          }

          // 5. Explicitly delete child materials and videos
          await supabase.from("materials").delete().in("lesson_id", lessonIds);
          await supabase.from("videos").delete().in("lesson_id", lessonIds);

          // 6. Explicitly delete child lessons
          const { error: lesErr } = await supabase.from("lessons").delete().in("module_id", moduleIds);
          if (lesErr) {
            console.error("Supabase lessons deletion error during subject cascade:", lesErr);
            throw new Error(`Failed to delete subject lessons: ${lesErr.message}`);
          }
        }

        // Also delete any direct module materials
        await supabase.from("materials").delete().in("module_id", moduleIds);

        // Explicitly delete child modules
        const { error: modErr } = await supabase.from("modules").delete().eq("subject_id", id);
        if (modErr) {
          console.error("Supabase modules deletion error during subject cascade:", modErr);
          throw new Error(`Failed to delete subject modules: ${modErr.message}`);
        }
      }

      // Also delete any direct subject materials
      await supabase.from("materials").delete().eq("subject_id", id);

      // 7. Delete the subject itself with .select("id") and verify row count
      const { data: deletedRows, error: deleteErr } = await supabase
        .from("subjects")
        .delete()
        .eq("id", id)
        .select("id");

      if (deleteErr) {
        console.error("Supabase deleteSubject error:", deleteErr);
        throw new Error(`Failed to delete subject: ${deleteErr.message}`);
      }

      if (!deletedRows || deletedRows.length === 0) {
        console.error("Supabase deleteSubject: 0 rows affected for id", id);
        throw new Error("Subject delete matched zero rows in database. Row may have already been removed or blocked by RLS.");
      }

      // 8. Verify the record is actually gone from the database
      const { data: verifyRow } = await supabase
        .from("subjects")
        .select("id")
        .eq("id", id)
        .maybeSingle();

      if (verifyRow) {
        console.error("Supabase deleteSubject verification failed: record still exists in database", id);
        throw new Error("Subject deletion verification failed: record still exists in Supabase.");
      }

      if (!isProduction()) {
        const localModIds = fallbackModules.filter((m) => m.subject_id === id).map((m) => m.id);
        const localLessonIds = fallbackLessons.filter((l) => localModIds.includes(l.module_id)).map((l) => l.id);

        for (let i = fallbackMaterials.length - 1; i >= 0; i--) {
          if (
            localLessonIds.includes(fallbackMaterials[i].lesson_id) ||
            fallbackMaterials[i].subject_id === id ||
            (fallbackMaterials[i].module_id && localModIds.includes(fallbackMaterials[i].module_id!))
          ) {
            fallbackMaterials.splice(i, 1);
          }
        }
        for (let i = fallbackVideos.length - 1; i >= 0; i--) {
          if (localLessonIds.includes(fallbackVideos[i].lesson_id)) fallbackVideos.splice(i, 1);
        }
        for (let i = fallbackLessons.length - 1; i >= 0; i--) {
          if (localModIds.includes(fallbackLessons[i].module_id)) fallbackLessons.splice(i, 1);
        }
        for (let i = fallbackModules.length - 1; i >= 0; i--) {
          if (fallbackModules[i].subject_id === id) fallbackModules.splice(i, 1);
        }
        const subIdx = fallbackSubjects.findIndex((s) => s.id === id);
        if (subIdx !== -1) fallbackSubjects.splice(subIdx, 1);
      }

      await logActivity("Subject Deleted", "subject", { id, title: existing.title });
      return true;
    } catch (err: any) {
      console.error("Supabase deleteSubject error:", err);
      throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to delete subjects in production. Local JSON store is strictly disabled.");
  }

  // Fallback-only mode: cascade through local store arrays
  const index = fallbackSubjects.findIndex((s) => s.id === id);
  if (index === -1) return false;
  const removed = fallbackSubjects.splice(index, 1)[0];

  const localModIds = fallbackModules.filter((m) => m.subject_id === id).map((m) => m.id);
  const localLessonIds = fallbackLessons.filter((l) => localModIds.includes(l.module_id)).map((l) => l.id);

  for (let i = fallbackMaterials.length - 1; i >= 0; i--) {
    if (
      localLessonIds.includes(fallbackMaterials[i].lesson_id) ||
      fallbackMaterials[i].subject_id === id ||
      (fallbackMaterials[i].module_id && localModIds.includes(fallbackMaterials[i].module_id!))
    ) {
      fallbackMaterials.splice(i, 1);
    }
  }
  for (let i = fallbackVideos.length - 1; i >= 0; i--) {
    if (localLessonIds.includes(fallbackVideos[i].lesson_id)) fallbackVideos.splice(i, 1);
  }
  for (let i = fallbackLessons.length - 1; i >= 0; i--) {
    if (localModIds.includes(fallbackLessons[i].module_id)) fallbackLessons.splice(i, 1);
  }
  for (let i = fallbackModules.length - 1; i >= 0; i--) {
    if (fallbackModules[i].subject_id === id) fallbackModules.splice(i, 1);
  }

  await logActivity("Subject Deleted", "subject", { id, title: removed.title });
  return true;
}

// ---------------- Modules ----------------

export async function getAllModules(subjectId?: string): Promise<Module[]> {
  if (!isSupabaseConfigured()) {
    let mods = fallbackModules;
    if (subjectId) {
      mods = mods.filter((m) => m.subject_id === subjectId);
    }
    return mods.map((m) => ({
      ...m,
      subject: fallbackSubjects.find((s) => s.id === m.subject_id),
      lessons_count: fallbackLessons.filter((l) => l.module_id === m.id).length,
    })).sort((a, b) => a.display_order - b.display_order);
  }

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("modules")
      .select("*, subjects(id, title, slug, code), lessons(id)")
      .order("display_order", { ascending: true });

    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }

    const { data, error } = await query;
    if (error) {
      if (isLocalFallbackAllowed()) {
        let mods = fallbackModules;
        if (subjectId) mods = mods.filter((m) => m.subject_id === subjectId);
        return mods.map((m) => ({
          ...m,
          subject: fallbackSubjects.find((s) => s.id === m.subject_id),
          lessons_count: fallbackLessons.filter((l) => l.module_id === m.id).length,
        })).sort((a, b) => a.display_order - b.display_order);
      }
      throw new Error(`Failed to fetch modules from Supabase: ${error.message}`);
    }
    if (!data) return [];
    return data.map((m: any) => ({
      ...m,
      subject: m.subjects,
      lessons_count: m.lessons?.length || 0,
    }));
  } catch (err) {
    if (isLocalFallbackAllowed()) {
      let mods = fallbackModules;
      if (subjectId) mods = mods.filter((m) => m.subject_id === subjectId);
      return mods.map((m) => ({
        ...m,
        subject: fallbackSubjects.find((s) => s.id === m.subject_id),
        lessons_count: fallbackLessons.filter((l) => l.module_id === m.id).length,
      })).sort((a, b) => a.display_order - b.display_order);
    }
    throw err;
  }
}

export async function getModulesForSubject(subjectId: string, requirePublished = true): Promise<Module[]> {
  if (!isSupabaseConfigured()) {
    return fallbackModules
      .filter((m) => m.subject_id === subjectId && (!requirePublished || m.published))
      .map((m) => ({
        ...m,
        subject: fallbackSubjects.find((s) => s.id === m.subject_id),
        lessons_count: fallbackLessons.filter((l) => l.module_id === m.id && (!requirePublished || l.published)).length,
      }))
      .sort((a, b) => a.display_order - b.display_order);
  }
  try {
    const supabase = await createServerSupabase();
    let query = supabase
      .from("modules")
      .select("*, subjects(id, title, slug), lessons(id, published)")
      .eq("subject_id", subjectId)
      .order("display_order", { ascending: true });

    if (requirePublished) query = query.eq("published", true);
    const { data, error } = await query;
    if (error) {
      if (isLocalFallbackAllowed()) {
        return fallbackModules
          .filter((m) => m.subject_id === subjectId && (!requirePublished || m.published))
          .map((m) => ({
            ...m,
            subject: fallbackSubjects.find((s) => s.id === m.subject_id),
            lessons_count: fallbackLessons.filter((l) => l.module_id === m.id && (!requirePublished || l.published)).length,
          }))
          .sort((a, b) => a.display_order - b.display_order);
      }
      throw new Error(`Failed to fetch modules for subject from Supabase: ${error.message}`);
    }
    if (!data) return [];
    return data.map((m: any) => ({
      ...m,
      subject: m.subjects,
      lessons_count: requirePublished
        ? (m.lessons?.filter((l: any) => l.published)?.length || 0)
        : (m.lessons?.length || 0),
    }));
  } catch (err) {
    if (isLocalFallbackAllowed()) {
      return fallbackModules
        .filter((m) => m.subject_id === subjectId && (!requirePublished || m.published))
        .map((m) => ({
          ...m,
          subject: fallbackSubjects.find((s) => s.id === m.subject_id),
          lessons_count: fallbackLessons.filter((l) => l.module_id === m.id && (!requirePublished || l.published)).length,
        }))
        .sort((a, b) => a.display_order - b.display_order);
    }
    throw err;
  }
}

export async function getModuleBySlug(subjectId: string, moduleSlug: string, requirePublished = true): Promise<Module | null> {
  if (!isSupabaseConfigured()) {
    const mod = fallbackModules.find((m) => m.subject_id === subjectId && m.slug === moduleSlug);
    if (!mod) return null;
    if (requirePublished && !mod.published) return null;
    return {
      ...mod,
      subject: fallbackSubjects.find((s) => s.id === subjectId),
    };
  }
  try {
    const supabase = await createServerSupabase();
    let query = supabase
      .from("modules")
      .select("*, subjects(id, title, slug)")
      .eq("subject_id", subjectId)
      .eq("slug", moduleSlug);
    if (requirePublished) query = query.eq("published", true);
    const { data, error } = await query.maybeSingle();

    if (error) {
      if (isLocalFallbackAllowed()) {
        const mod = fallbackModules.find((m) => m.subject_id === subjectId && m.slug === moduleSlug);
        if (!mod || (requirePublished && !mod.published)) return null;
        return { ...mod, subject: fallbackSubjects.find((s) => s.id === subjectId) };
      }
      throw new Error(`Failed to fetch module by slug from Supabase: ${error.message}`);
    }
    if (!data) return null;
    return {
      ...data,
      subject: data.subjects,
    };
  } catch (err) {
    if (isLocalFallbackAllowed()) {
      const mod = fallbackModules.find((m) => m.subject_id === subjectId && m.slug === moduleSlug);
      if (!mod || (requirePublished && !mod.published)) return null;
      return { ...mod, subject: fallbackSubjects.find((s) => s.id === subjectId) };
    }
    throw err;
  }
}

export async function getModuleById(id: string): Promise<Module | null> {
  if (!isSupabaseConfigured()) {
    const m = fallbackModules.find((mod) => mod.id === id);
    if (!m) return null;
    return {
      ...m,
      subject: fallbackSubjects.find((s) => s.id === m.subject_id),
    };
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("modules").select("*, subjects(*)").eq("id", id).maybeSingle();

    if (error) {
      if (isLocalFallbackAllowed()) {
        const m = fallbackModules.find((mod) => mod.id === id);
        if (!m) return null;
        return {
          ...m,
          subject: fallbackSubjects.find((s) => s.id === m.subject_id),
        };
      }
      throw new Error(`Failed to fetch module by ID from Supabase: ${error.message}`);
    }
    if (!data) return null;
    return { ...data, subject: data.subjects };
  } catch (err) {
    if (isLocalFallbackAllowed()) {
      const m = fallbackModules.find((mod) => mod.id === id);
      if (!m) return null;
      return {
        ...m,
        subject: fallbackSubjects.find((s) => s.id === m.subject_id),
      };
    }
    throw err;
  }
}

export async function createModule(data: Partial<Module>): Promise<Module> {
  const insertPayload = {
    id: data.id || crypto.randomUUID(),
    subject_id: data.subject_id!,
    title: data.title || "Untitled Module",
    slug: data.slug || `module-${Date.now()}`,
    short_description: data.short_description || null,
    display_order: data.display_order ?? (fallbackModules.length + 1),
    published: Boolean(data.published),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data: created, error } = await supabase.from("modules").insert(insertPayload).select().single();
      if (error) {
        console.error("Supabase createModule error:", error);
        throw new Error(`Failed to create module: ${error.message}`);
      }
      const enriched: Module = { ...created, lessons_count: 0 };
      if (!isProduction()) {
        fallbackModules.push(enriched);
      }
      await logActivity("Module Created", "module", { id: created.id, title: created.title, slug: created.slug });
      return enriched;
    } catch (err: any) {
      console.error("Supabase createModule error:", err);
      throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to create modules in production. Local JSON store is strictly disabled.");
  }

  const newMod: Module = {
    ...insertPayload,
    lessons_count: 0,
  };
  fallbackModules.push(newMod);
  await logActivity("Module Created", "module", { id: newMod.id, title: newMod.title });
  return newMod;
}

export async function updateModule(id: string, updates: Partial<Module>): Promise<Module | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const payload: Record<string, any> = { ...updates, updated_at: new Date().toISOString() };
      delete payload.id;
      delete payload.created_at;
      delete payload.lessons_count;
      delete payload.subject;
      delete payload.lessons;
      const { data, error } = await supabase.from("modules").update(payload).eq("id", id).select().single();
      if (error) {
        console.error("Supabase updateModule error:", error);
        throw new Error(`Failed to update module: ${error.message}`);
      }
      if (!isProduction()) {
        const idx = fallbackModules.findIndex((m) => m.id === id);
        if (idx !== -1) fallbackModules[idx] = { ...fallbackModules[idx], ...data };
      }
      await logActivity("Module Updated", "module", { id, title: data.title });
      return data;
    } catch (err: any) {
      console.error("Supabase updateModule error:", err);
      throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to update modules in production. Local JSON store is strictly disabled.");
  }

  const index = fallbackModules.findIndex((m) => m.id === id);
  if (index === -1) return null;
  fallbackModules[index] = {
    ...fallbackModules[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  await logActivity("Module Updated", "module", { id, updates });
  return fallbackModules[index];
}

function cleanupLocalStoreForModule(moduleId: string, lessonIds: string[] = []): void {
  const store = getStore();
  const validLessonIds = new Set(
    lessonIds.length > 0
      ? lessonIds
      : store.lessons.filter((l) => l.module_id === moduleId).map((l) => l.id)
  );

  store.materials = store.materials.filter(
    (m) => !validLessonIds.has(m.lesson_id) && m.module_id !== moduleId
  );
  store.videos = store.videos.filter((v) => !validLessonIds.has(v.lesson_id));
  store.lessons = store.lessons.filter((l) => l.module_id !== moduleId);
  store.modules = store.modules.filter((m) => m.id !== moduleId);

  saveStore(store);
}

export async function deleteModule(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data: existing } = await supabase
        .from("modules")
        .select("id, title, slug, subject_id")
        .eq("id", id)
        .maybeSingle();

      if (!existing) {
        const localIdx = fallbackModules.findIndex((m) => m.id === id);
        if (localIdx !== -1) {
          cleanupLocalStoreForModule(id);
          return true;
        }
        return false;
      }

      // Step 1: Find all lessons belonging to this module
      const { data: moduleLessons } = await supabase
        .from("lessons")
        .select("id")
        .eq("module_id", id);
      const lessonIds = (moduleLessons || []).map((l: any) => l.id);

      // Step 2: Clean up storage files for videos and materials
      if (lessonIds.length > 0) {
        const { data: videoRows } = await supabase
          .from("videos")
          .select("storage_path")
          .in("lesson_id", lessonIds);
        const videoPaths = (videoRows || []).map((v: any) => v.storage_path).filter(Boolean);

        const { data: materialRows } = await supabase
          .from("materials")
          .select("storage_path")
          .or(`lesson_id.in.(${lessonIds.join(",")}),module_id.eq.${id}`);
        const materialPaths = (materialRows || []).map((m: any) => m.storage_path).filter(Boolean);

        if (videoPaths.length > 0) {
          try {
            await supabase.storage.from("engivault-videos").remove(videoPaths);
          } catch (err) {
            console.warn("Storage video cleanup notice during module deletion:", err);
          }
        }
        if (materialPaths.length > 0) {
          try {
            await supabase.storage.from("engivault-materials").remove(materialPaths);
          } catch (err) {
            console.warn("Storage material cleanup notice during module deletion:", err);
          }
        }

        // Step 3: Explicitly delete child database records in reverse dependency order
        // 3a. Delete materials
        const { error: matErr } = await supabase
          .from("materials")
          .delete()
          .or(`lesson_id.in.(${lessonIds.join(",")}),module_id.eq.${id}`);
        if (matErr) console.warn("Notice: material deletion during module cascade:", matErr);

        // 3b. Delete videos
        const { error: vidErr } = await supabase
          .from("videos")
          .delete()
          .in("lesson_id", lessonIds);
        if (vidErr) console.warn("Notice: video deletion during module cascade:", vidErr);

        // 3c. Delete lessons
        const { error: lesErr } = await supabase
          .from("lessons")
          .delete()
          .eq("module_id", id);
        if (lesErr) {
          console.error("Supabase lessons deletion error:", lesErr);
          throw new Error(`Failed to delete module lessons: ${lesErr.message}`);
        }
      } else {
        // Also delete any materials attached directly to this module
        await supabase.from("materials").delete().eq("module_id", id);
      }

      // Step 4: Delete the module itself with .select("id") and verify row count
      const { data: deletedRows, error: modErr } = await supabase
        .from("modules")
        .delete()
        .eq("id", id)
        .select("id");

      if (modErr) {
        console.error("Supabase deleteModule error:", modErr);
        throw new Error(`Failed to delete module: ${modErr.message}`);
      }

      if (!deletedRows || deletedRows.length === 0) {
        console.error("Supabase deleteModule: 0 rows affected for id", id);
        throw new Error("Module delete matched zero rows in database. Row may have already been removed or blocked by RLS.");
      }

      // Step 5: Verify the record is actually gone from the database
      const { data: verifyRow } = await supabase
        .from("modules")
        .select("id")
        .eq("id", id)
        .maybeSingle();

      if (verifyRow) {
        console.error("Supabase deleteModule verification failed: record still exists in database", id);
        throw new Error("Module deletion verification failed: record still exists in Supabase.");
      }

      // Step 6: Clean up local fallback store atomically
      if (!isProduction()) {
        cleanupLocalStoreForModule(id, lessonIds);
      }

      await logActivity("Module Deleted", "module", { id, title: existing.title });
      return true;
    } catch (err: any) {
      console.error("Supabase deleteModule error:", err);
      throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to delete modules in production. Local JSON store is strictly disabled.");
  }

  const existing = fallbackModules.find((m) => m.id === id);
  if (!existing) return false;

  cleanupLocalStoreForModule(id);
  await logActivity("Module Deleted", "module", { id, title: existing.title });
  return true;
}

// ---------------- Lessons ----------------

export async function getAllLessons(options?: { moduleId?: string; subjectId?: string }): Promise<Lesson[]> {
  if (!isSupabaseConfigured()) {
    let result = fallbackLessons;
    if (options?.moduleId) {
      result = result.filter((l) => l.module_id === options.moduleId);
    }
    if (options?.subjectId) {
      const modIds = fallbackModules.filter((m) => m.subject_id === options.subjectId).map((m) => m.id);
      result = result.filter((l) => modIds.includes(l.module_id));
    }
    return result.map(enrichFallbackLesson).sort((a, b) => {
      if (a.display_order !== b.display_order) return a.display_order - b.display_order;
      return (a.lesson_number || 0) - (b.lesson_number || 0);
    });
  }

  try {
    const supabase = isSupabaseAdminConfigured()
      ? createAdminClient()
      : await createServerSupabase();
    let query = supabase
      .from("lessons")
      .select("*, modules(id, title, slug, subject_id, subjects(id, title, slug, code)), videos(*), materials(*)")
      .order("display_order", { ascending: true })
      .order("lesson_number", { ascending: true });

    if (options?.moduleId) {
      query = query.eq("module_id", options.moduleId);
    }

    const { data, error } = await query;
    if (error) {
      if (isLocalFallbackAllowed()) {
        let result = fallbackLessons;
        if (options?.moduleId) result = result.filter((l) => l.module_id === options.moduleId);
        if (options?.subjectId) {
          const modIds = fallbackModules.filter((m) => m.subject_id === options.subjectId).map((m) => m.id);
          result = result.filter((l) => modIds.includes(l.module_id));
        }
        return result.map(enrichFallbackLesson).sort((a, b) => {
          if (a.display_order !== b.display_order) return a.display_order - b.display_order;
          return (a.lesson_number || 0) - (b.lesson_number || 0);
        });
      }
      throw new Error(`Failed to fetch lessons from Supabase: ${error.message}`);
    }
    if (!data) return [];

    let lessons = data.map((l: any) =>
      normalizeLessonFields({
        ...l,
        module: l.modules
          ? {
              ...l.modules,
              subject: l.modules.subjects,
            }
          : undefined,
        video: l.videos?.[0] || null,
        materials: l.materials || [],
      })
    );


    if (options?.subjectId) {
      lessons = lessons.filter((l: any) => l.module?.subject_id === options.subjectId);
    }

    return lessons;
  } catch (err) {
    if (isLocalFallbackAllowed()) {
      let result = fallbackLessons;
      if (options?.moduleId) result = result.filter((l) => l.module_id === options.moduleId);
      if (options?.subjectId) {
        const modIds = fallbackModules.filter((m) => m.subject_id === options.subjectId).map((m) => m.id);
        result = result.filter((l) => modIds.includes(l.module_id));
      }
      return result.map(enrichFallbackLesson).sort((a, b) => {
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return (a.lesson_number || 0) - (b.lesson_number || 0);
      });
    }
    throw err;
  }
}

export async function getLessonsForModule(moduleId: string, requirePublished = false): Promise<Lesson[]> {
  if (!isSupabaseConfigured()) {
    return fallbackLessons
      .filter((l) => l.module_id === moduleId && (!requirePublished || l.published))
      .map(enrichFallbackLesson)
      .sort((a, b) => a.display_order - b.display_order);
  }
  try {
    const supabase = await createServerSupabase();
    let query = supabase
      .from("lessons")
      .select("*, videos(*), materials(*)")
      .eq("module_id", moduleId)
      .order("display_order", { ascending: true })
      .order("lesson_number", { ascending: true });

    if (requirePublished) query = query.eq("published", true);
    const { data, error } = await query;
    if (error) {
      if (isLocalFallbackAllowed()) {
        return fallbackLessons
          .filter((l) => l.module_id === moduleId && (!requirePublished || l.published))
          .map(enrichFallbackLesson)
          .sort((a, b) => a.display_order - b.display_order);
      }
      throw new Error(`Failed to fetch lessons for module from Supabase: ${error.message}`);
    }
    if (!data) return [];
    return data.map((l: any) =>
      normalizeLessonFields({
        ...l,
        video: l.videos?.[0] || null,
        materials: l.materials || [],
      })
    );
  } catch (err) {
    if (isLocalFallbackAllowed()) {
      return fallbackLessons
        .filter((l) => l.module_id === moduleId && (!requirePublished || l.published))
        .map(enrichFallbackLesson)
        .sort((a, b) => a.display_order - b.display_order);
    }
    throw err;
  }
}

export async function getLessonBySlug(moduleId: string, lessonSlug: string, requirePublished = true): Promise<Lesson | null> {
  if (!isSupabaseConfigured()) {
    const lesson = fallbackLessons.find((l) => l.module_id === moduleId && l.slug === lessonSlug);
    if (!lesson) return null;
    if (requirePublished && !lesson.published) return null;

    const video = fallbackVideos.find((v) => v.lesson_id === lesson.id) || null;
    if (video) {
      video.playback_url = await getSignedVideoUrl(video.storage_path);
    }
    const materials = fallbackMaterials.filter((m) => m.lesson_id === lesson.id && (!requirePublished || m.published));
    for (const mat of materials) {
      mat.download_url = await getSignedMaterialUrl(mat.storage_path);
    }

    return {
      ...enrichFallbackLesson(lesson),
      video,
      materials,
    };
  }

  try {
    const supabase = await createServerSupabase();
    let query = supabase
      .from("lessons")
      .select("*, modules(id, title, slug, subject_id, subjects(id, title, slug)), videos(*), materials(*)")
      .eq("module_id", moduleId)
      .eq("slug", lessonSlug);

    if (requirePublished) query = query.eq("published", true);
    const { data, error } = await query.maybeSingle();

    if (error) {
      if (isLocalFallbackAllowed()) {
        const l = fallbackLessons.find((les) => les.module_id === moduleId && les.slug === lessonSlug);
        return l && (!requirePublished || l.published) ? enrichFallbackLesson(l) : null;
      }
      throw new Error(`Failed to fetch lesson by slug from Supabase: ${error.message}`);
    }
    if (!data) return null;

    const video = data.videos?.[0] || null;
    if (video) {
      video.playback_url = await getSignedVideoUrl(video.storage_path);
    }

    const materials = data.materials || [];
    for (const m of materials) {
      m.download_url = await getSignedMaterialUrl(m.storage_path);
    }

    return normalizeLessonFields({
      ...data,
      module: data.modules
        ? {
            ...data.modules,
            subject: data.modules.subjects,
          }
        : undefined,
      video,
      materials,
    });
  } catch (err) {
    if (isLocalFallbackAllowed()) {
      const l = fallbackLessons.find((les) => les.module_id === moduleId && les.slug === lessonSlug);
      return l && (!requirePublished || l.published) ? enrichFallbackLesson(l) : null;
    }
    throw err;
  }
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  if (!isSupabaseConfigured()) {
    const les = fallbackLessons.find((l) => l.id === id);
    return les ? enrichFallbackLesson(les) : null;
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("lessons")
      .select("*, modules(id, title, slug, subject_id, subjects(id, title, slug)), videos(*), materials(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      if (isLocalFallbackAllowed()) {
        const les = fallbackLessons.find((l) => l.id === id);
        return les ? enrichFallbackLesson(les) : null;
      }
      throw new Error(`Failed to fetch lesson by ID from Supabase: ${error.message}`);
    }
    if (!data) return null;
    return normalizeLessonFields({
      ...data,
      module: data.modules
        ? {
            ...data.modules,
            subject: data.modules.subjects,
          }
        : undefined,
      video: data.videos?.[0] || null,
      materials: data.materials || [],
    });
  } catch (err) {
    if (isLocalFallbackAllowed()) {
      const les = fallbackLessons.find((l) => l.id === id);
      return les ? enrichFallbackLesson(les) : null;
    }
    throw err;
  }
}

export async function getRecentPublishedLessons(limit = 3): Promise<Lesson[]> {
  if (!isSupabaseConfigured()) {
    return fallbackLessons
      .filter((l) => l.published)
      .map(enrichFallbackLesson)
      .slice(0, limit);
  }
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("lessons")
      .select("*, modules!inner(id, title, slug, subject_id, published, subjects!inner(id, title, slug, code, published)), videos(*), materials(*)")
      .eq("published", true)
      .eq("modules.published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isLocalFallbackAllowed()) {
        return fallbackLessons.filter((l) => l.published).map(enrichFallbackLesson).slice(0, limit);
      }
      console.warn("Notice: Fetching recent published lessons from Supabase:", error.message);
      return [];
    }
    if (!data) return [];

    const validLessons = data.filter((l: any) => l.modules?.subjects?.published !== false);

    return validLessons.map((l: any) =>
      normalizeLessonFields({
        ...l,
        module: l.modules
          ? {
              ...l.modules,
              subject: l.modules.subjects,
            }
          : undefined,
        video: l.videos?.[0] || null,
        materials: l.materials || [],
      })
    );
  } catch (err: any) {
    if (isLocalFallbackAllowed()) {
      return fallbackLessons.filter((l) => l.published).map(enrichFallbackLesson).slice(0, limit);
    }
    console.warn("Notice: Fetching recent published lessons from Supabase:", err?.message || err);
    return [];
  }
}

export async function createLesson(data: Partial<Lesson>): Promise<Lesson> {
  const rawUrl = data.youtube_url || data.youtubeUrl || null;
  const youtube_url = rawUrl ? String(rawUrl).trim() : null;
  const youtube_video_id =
    data.youtube_video_id ||
    data.youtubeVideoId ||
    (youtube_url ? extractYouTubeVideoId(youtube_url) : null);
  const thumbnail_path =
    data.thumbnail_path ||
    (youtube_video_id ? getYouTubeThumbnailUrl(youtube_video_id) : null);

  const insertPayload = {
    id: data.id || crypto.randomUUID(),
    module_id: data.module_id!,
    topic_id: data.topic_id || null,
    faculty_id: data.faculty_id || null,
    instructor: data.instructor || null,
    title: data.title || "Untitled Lecture",
    slug: data.slug || `lecture-${Date.now()}`,
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
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data: created, error } = await supabase.from("lessons").insert(insertPayload).select().single();
      if (error) {
        console.error("Supabase createLesson error:", error);
        throw new Error(`Failed to create lesson in database: ${error.message}`);
      }
      const enriched = enrichFallbackLesson(created);
      if (!isProduction()) {
        fallbackLessons.push(enriched);
      }
      await logActivity("Lesson Created", "lesson", { id: created.id, title: created.title, slug: created.slug });
      return enriched;
    } catch (err: any) {
      console.error("Supabase createLesson error:", err);
      throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to create lectures in production. Local JSON store is strictly disabled.");
  }

  const newLesson: Lesson = {
    ...insertPayload,
  };
  const enriched = enrichFallbackLesson(newLesson);
  fallbackLessons.push(enriched);
  await logActivity("Lesson Created", "lesson", { id: newLesson.id, title: newLesson.title });
  return enriched;
}

export async function updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson | null> {
  const cleanUpdates: Record<string, any> = { ...updates };
  if ("youtubeUrl" in cleanUpdates && !("youtube_url" in cleanUpdates)) {
    cleanUpdates.youtube_url = cleanUpdates.youtubeUrl;
  }
  if ("youtubeVideoId" in cleanUpdates && !("youtube_video_id" in cleanUpdates)) {
    cleanUpdates.youtube_video_id = cleanUpdates.youtubeVideoId;
  }
  if ("youtube_url" in cleanUpdates) {
    const rawUrl = cleanUpdates.youtube_url;
    if (typeof rawUrl === "string" && rawUrl.trim()) {
      const trimmed = rawUrl.trim();
      cleanUpdates.youtube_url = trimmed;
      const vidId = extractYouTubeVideoId(trimmed);
      cleanUpdates.youtube_video_id = vidId;
      if (vidId && !cleanUpdates.thumbnail_path) {
        cleanUpdates.thumbnail_path = getYouTubeThumbnailUrl(vidId);
      }
    } else {
      cleanUpdates.youtube_url = null;
      cleanUpdates.youtube_video_id = null;
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const payload: Record<string, any> = {
        ...cleanUpdates,
        updated_at: new Date().toISOString(),
      };
      delete payload.id;
      delete payload.created_at;
      delete payload.module;
      delete payload.video;
      delete payload.materials;
      delete payload.youtubeUrl;
      delete payload.youtubeVideoId;

      const { data, error } = await supabase.from("lessons").update(payload).eq("id", id).select().single();
      if (error) {
        console.error("Supabase updateLesson error:", error);
        throw new Error(`Failed to update lesson in database: ${error.message}`);
      }
      const normalizedData = normalizeLessonFields(data);
      if (!isProduction()) {
        const idx = fallbackLessons.findIndex((l) => l.id === id);
        if (idx !== -1) fallbackLessons[idx] = enrichFallbackLesson({ ...fallbackLessons[idx], ...normalizedData });
      }
      await logActivity("Lesson Updated", "lesson", { id, title: normalizedData.title });
      return normalizedData;
    } catch (err: any) {
      console.error("Supabase updateLesson error:", err);
      throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to update lectures in production. Local JSON store is strictly disabled.");
  }

  const index = fallbackLessons.findIndex((l) => l.id === id);
  if (index === -1) return null;
  const merged = enrichFallbackLesson({
    ...fallbackLessons[index],
    ...cleanUpdates,
    updated_at: new Date().toISOString(),
  });
  fallbackLessons[index] = merged;
  await logActivity("Lesson Updated", "lesson", { id, updates: cleanUpdates });
  return fallbackLessons[index];
}

export async function deleteLesson(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      // 1. Fetch lesson media to safely clean up storage objects
      const { data: existing } = await supabase
        .from("lessons")
        .select("title, videos(storage_path), materials(storage_path)")
        .eq("id", id)
        .single();

      if (existing) {
        if (existing.videos && existing.videos.length > 0) {
          const videoPaths = existing.videos.map((v: any) => v.storage_path).filter(Boolean);
          if (videoPaths.length > 0) {
            try {
              await supabase.storage.from("engivault-videos").remove(videoPaths);
            } catch (err) {
              console.warn("Storage video cleanup notice:", err);
            }
          }
        }
        if (existing.materials && existing.materials.length > 0) {
          const materialPaths = existing.materials.map((m: any) => m.storage_path).filter(Boolean);
          if (materialPaths.length > 0) {
            try {
              await supabase.storage.from("engivault-materials").remove(materialPaths);
            } catch (err) {
              console.warn("Storage material cleanup notice:", err);
            }
          }
        }
      }

      // Explicitly delete child materials and videos first to avoid FK constraint issues
      await supabase.from("materials").delete().eq("lesson_id", id);
      await supabase.from("videos").delete().eq("lesson_id", id);

      // 2. Delete the lesson record with .select("id") and verify row count
      const { data: deletedRows, error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", id)
        .select("id");

      if (error) {
        console.error("Supabase deleteLesson error:", error);
        throw new Error(`Failed to delete lesson from database: ${error.message}`);
      }

      if (!deletedRows || deletedRows.length === 0) {
        console.error("Supabase deleteLesson: 0 rows affected for id", id);
        throw new Error("Lesson delete matched zero rows in database. Row may have already been removed or blocked by RLS.");
      }

      // Step 3: Verify the record is actually gone from the database
      const { data: verifyRow } = await supabase
        .from("lessons")
        .select("id")
        .eq("id", id)
        .maybeSingle();

      if (verifyRow) {
        console.error("Supabase deleteLesson verification failed: record still exists in database", id);
        throw new Error("Lesson deletion verification failed: record still exists in Supabase.");
      }

      if (!isProduction()) {
        const idx = fallbackLessons.findIndex((l) => l.id === id);
        if (idx !== -1) fallbackLessons.splice(idx, 1);
        for (let i = fallbackVideos.length - 1; i >= 0; i--) {
          if (fallbackVideos[i].lesson_id === id) fallbackVideos.splice(i, 1);
        }
        for (let i = fallbackMaterials.length - 1; i >= 0; i--) {
          if (fallbackMaterials[i].lesson_id === id) fallbackMaterials.splice(i, 1);
        }
      }

      await logActivity("Lesson Deleted", "lesson", { id, title: existing?.title || "Lesson" });
      return true;
    } catch (err: any) {
      console.error("Supabase deleteLesson error:", err);
      throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to delete lectures in production. Local JSON store is strictly disabled.");
  }

  const index = fallbackLessons.findIndex((l) => l.id === id);
  if (index === -1) return false;
  const removed = fallbackLessons.splice(index, 1)[0];
  for (let i = fallbackVideos.length - 1; i >= 0; i--) {
    if (fallbackVideos[i].lesson_id === id) fallbackVideos.splice(i, 1);
  }
  for (let i = fallbackMaterials.length - 1; i >= 0; i--) {
    if (fallbackMaterials[i].lesson_id === id) fallbackMaterials.splice(i, 1);
  }
  await logActivity("Lesson Deleted", "lesson", { id, title: removed.title });
  return true;
}

// ---------------- Videos ----------------

export async function getAllVideos(): Promise<Video[]> {
  if (!isSupabaseConfigured()) {
    return fallbackVideos.map((v) => {
      const lesson = fallbackLessons.find((l) => l.id === v.lesson_id);
      const mod = lesson ? fallbackModules.find((m) => m.id === lesson.module_id) : undefined;
      const subject = mod ? fallbackSubjects.find((s) => s.id === mod.subject_id) : undefined;
      return {
        ...v,
        lesson: lesson
          ? {
              ...lesson,
              module: mod ? { ...mod, subject } : undefined,
            }
          : undefined,
      };
    });
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("videos")
      .select("*, lessons(id, title, slug, module_id, modules(id, title, slug, subject_id, subjects(id, title, slug, code)))")
      .order("created_at", { ascending: false });

    if (error) {
      if (isLocalFallbackAllowed()) return fallbackVideos;
      throw new Error(`Failed to fetch videos from Supabase: ${error.message}`);
    }
    if (!data) return [];
    return data.map((v: any) => ({
      ...v,
      lesson: v.lessons
        ? {
            ...v.lessons,
            module: v.lessons.modules
              ? {
                  ...v.lessons.modules,
                  subject: v.lessons.modules.subjects,
                }
              : undefined,
          }
        : undefined,
    }));
  } catch (err) {
    if (isLocalFallbackAllowed()) return fallbackVideos;
    throw err;
  }
}

export async function getVideoForLesson(lessonId: string): Promise<Video | null> {
  if (!isSupabaseConfigured()) {
    const vid = fallbackVideos.find((v) => v.lesson_id === lessonId);
    if (!vid) return null;
    return {
      ...vid,
      playback_url: await getSignedVideoUrl(vid.storage_path),
    };
  }
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from("videos").select("*").eq("lesson_id", lessonId).maybeSingle();
    if (error) {
      if (isLocalFallbackAllowed()) {
        const vid = fallbackVideos.find((v) => v.lesson_id === lessonId);
        if (!vid) return null;
        return {
          ...vid,
          playback_url: await getSignedVideoUrl(vid.storage_path),
        };
      }
      throw new Error(`Failed to fetch video for lesson from Supabase: ${error.message}`);
    }
    if (!data) return null;
    data.playback_url = await getSignedVideoUrl(data.storage_path);
    return data;
  } catch (err) {
    if (isLocalFallbackAllowed()) {
      const vid = fallbackVideos.find((v) => v.lesson_id === lessonId);
      if (!vid) return null;
      return {
        ...vid,
        playback_url: await getSignedVideoUrl(vid.storage_path),
      };
    }
    throw err;
  }
}

export async function createVideo(data: Partial<Video>): Promise<Video> {
  const newVid: Video = {
    id: data.id || crypto.randomUUID(),
    lesson_id: data.lesson_id!,
    title: data.title || "Lecture Video",
    storage_path: data.storage_path!,
    mime_type: data.mime_type || "video/mp4",
    file_size: data.file_size ?? null,
    thumbnail_path: data.thumbnail_path ?? null,
    duration_seconds: data.duration_seconds ?? null,
    published: Boolean(data.published ?? true),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      // Check if video exists for lesson, if so update/replace
      const { data: existing } = await supabase.from("videos").select("id, storage_path").eq("lesson_id", newVid.lesson_id).maybeSingle();
      if (existing) {
        if (existing.storage_path && existing.storage_path !== newVid.storage_path) {
          try {
            await supabase.storage.from("engivault-videos").remove([existing.storage_path]);
          } catch (err) {
            console.warn("Storage previous video cleanup notice:", err);
          }
        }
        const { data: updated, error } = await supabase
          .from("videos")
          .update({
            title: newVid.title,
            storage_path: newVid.storage_path,
            mime_type: newVid.mime_type,
            file_size: newVid.file_size,
            duration_seconds: newVid.duration_seconds,
            published: newVid.published,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      }

      const { data: created, error } = await supabase.from("videos").insert(newVid).select().single();
      if (error) throw error;
      if (!isProduction()) {
        fallbackVideos.push(created);
      }
      await logActivity("Video Uploaded", "video", { id: created.id, title: created.title, lesson_id: created.lesson_id });
      return created;
    } catch (err: any) {
      console.error("Supabase createVideo error:", err);
      throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to create videos in production. Local JSON store is strictly disabled.");
  }

  // Fallback mode: upsert
  const existingIdx = fallbackVideos.findIndex((v) => v.lesson_id === newVid.lesson_id);
  if (existingIdx !== -1) {
    fallbackVideos[existingIdx] = { ...fallbackVideos[existingIdx], ...newVid, id: fallbackVideos[existingIdx].id };
    await logActivity("Video Replaced", "video", { lesson_id: newVid.lesson_id });
    return fallbackVideos[existingIdx];
  }

  fallbackVideos.push(newVid);
  await logActivity("Video Uploaded", "video", { id: newVid.id, title: newVid.title });
  return newVid;
}

export async function deleteVideo(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data: existing } = await supabase.from("videos").select("storage_path").eq("id", id).single();
      if (existing?.storage_path) {
        try {
          await supabase.storage.from("engivault-videos").remove([existing.storage_path]);
        } catch (err) {
          console.warn("Storage video cleanup notice:", err);
        }
      }
      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) throw error;
      if (!isProduction()) {
        const fIdx = fallbackVideos.findIndex((v) => v.id === id);
        if (fIdx !== -1) fallbackVideos.splice(fIdx, 1);
      }
      await logActivity("Video Deleted", "video", { id });
      return true;
    } catch (err) {
      console.error("Supabase deleteVideo error:", err);
      throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to delete videos in production. Local JSON store is strictly disabled.");
  }

  const idx = fallbackVideos.findIndex((v) => v.id === id);
  if (idx === -1) return false;
  fallbackVideos.splice(idx, 1);
  await logActivity("Video Deleted", "video", { id });
  return true;
}

// ---------------- Materials ----------------

export async function getMaterialsForLesson(lessonId: string): Promise<Material[]> {
  if (!isSupabaseConfigured()) {
    const list = fallbackMaterials.filter((m) => m.lesson_id === lessonId && m.published);
    for (const mat of list) {
      mat.download_url = await getSignedMaterialUrl(mat.storage_path);
    }
    return list;
  }
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .eq("lesson_id", lessonId)
      .eq("published", true)
      .is("deleted_at", null)
      .order("display_order", { ascending: true });

    if (error) {
      if (isLocalFallbackAllowed()) {
        const list = fallbackMaterials.filter((m) => m.lesson_id === lessonId && m.published);
        for (const mat of list) {
          mat.download_url = await getSignedMaterialUrl(mat.storage_path);
        }
        return list;
      }
      throw new Error(`Failed to fetch materials for lesson from Supabase: ${error.message}`);
    }
    if (!data) return [];
    for (const mat of data) {
      mat.download_url = await getSignedMaterialUrl(mat.storage_path);
    }
    return data;
  } catch (err) {
    if (isLocalFallbackAllowed()) {
      const list = fallbackMaterials.filter((m) => m.lesson_id === lessonId && m.published);
      for (const mat of list) {
        mat.download_url = await getSignedMaterialUrl(mat.storage_path);
      }
      return list;
    }
    throw err;
  }
}

export async function getAllMaterials(): Promise<Material[]> {
  if (!isSupabaseConfigured()) {
    return fallbackMaterials.map((mat) => {
      const lesson = fallbackLessons.find((l) => l.id === mat.lesson_id);
      const mod = lesson ? fallbackModules.find((m) => m.id === lesson.module_id) : undefined;
      const subject = mod ? fallbackSubjects.find((s) => s.id === mod.subject_id) : undefined;
      return {
        ...mat,
        subject,
        module: mod,
        lesson,
      };
    });
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("materials")
      .select("*, lessons(id, title, slug, module_id, modules(id, title, slug, subject_id, subjects(id, title, slug, code)))")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      if (isLocalFallbackAllowed()) return fallbackMaterials;
      throw new Error(`Failed to fetch materials from Supabase: ${error.message}`);
    }
    if (!data) return [];
    return data.map((mat: any) => ({
      ...mat,
      lesson: mat.lessons,
      module: mat.lessons?.modules,
      subject: mat.lessons?.modules?.subjects,
    }));
  } catch (err) {
    if (isLocalFallbackAllowed()) return fallbackMaterials;
    throw err;
  }
}

export async function createMaterial(data: Partial<Material>): Promise<Material> {
  const newMat: Material = {
    id: data.id || crypto.randomUUID(),
    lesson_id: data.lesson_id!,
    subject_id: data.subject_id || null,
    module_id: data.module_id || null,
    title: data.title || "Untitled Document",
    description: data.description || null,
    material_type: data.material_type || "pdf",
    storage_path: data.storage_path || `materials/${Date.now()}.pdf`,
    original_filename: data.original_filename || "document.pdf",
    mime_type: data.mime_type || "application/pdf",
    file_size: data.file_size || 1024 * 1024,
    published: Boolean(data.published),
    display_order: data.display_order || 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data: created, error } = await supabase.from("materials").insert(newMat).select().single();
      if (error) throw error;
      if (!isProduction()) {
        fallbackMaterials.push(created);
      }
      await logActivity("Material Uploaded", "material", { id: created.id, title: created.title });
      return created;
    } catch (err: any) {
      console.error("Supabase createMaterial error:", err);
      throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to upload materials in production. Local JSON store is strictly disabled.");
  }

  fallbackMaterials.push(newMat);
  await logActivity("Material Uploaded", "material", { id: newMat.id, title: newMat.title });
  return newMat;
}

export async function deleteMaterial(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data: existing } = await supabase.from("materials").select("storage_path").eq("id", id).single();
      if (existing?.storage_path) {
        try {
          await supabase.storage.from("engivault-materials").remove([existing.storage_path]);
        } catch (err) {
          console.warn("Storage material cleanup notice:", err);
        }
      }
      const { error } = await supabase.from("materials").delete().eq("id", id);
      if (error) throw error;
      if (!isProduction()) {
        const idx = fallbackMaterials.findIndex((m) => m.id === id);
        if (idx !== -1) fallbackMaterials.splice(idx, 1);
      }
      await logActivity("Material Deleted", "material", { id });
      return true;
    } catch (err) {
      console.error("Supabase deleteMaterial error:", err);
      throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to delete materials in production. Local JSON store is strictly disabled.");
  }

  const index = fallbackMaterials.findIndex((m) => m.id === id);
  if (index === -1) return false;
  const removed = fallbackMaterials.splice(index, 1)[0];
  await logActivity("Material Deleted", "material", { id, title: removed.title });
  return true;
}

// ---------------- Search ----------------

export async function searchContent(queryStr: string): Promise<SearchResultItem[]> {
  const q = queryStr.toLowerCase().trim();
  if (!q) return [];

  const results: SearchResultItem[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();

      // Search published subjects
      const { data: subs, error: subsErr } = await supabase
        .from("subjects")
        .select("id, title, slug, code, short_description")
        .eq("published", true)
        .or(`title.ilike.%${q}%,code.ilike.%${q}%,short_description.ilike.%${q}%`);

      if (subsErr) throw subsErr;

      if (subs) {
        for (const s of subs) {
          results.push({
            id: s.id,
            type: "subject",
            title: `${s.title} (${s.code || "KTU"})`,
            description: s.short_description || undefined,
            url: `/subjects/${s.slug}`,
            badge: "Subject",
          });
        }
      }

      // Search published modules
      const { data: mods, error: modsErr } = await supabase
        .from("modules")
        .select("id, title, slug, short_description, subject_id, subjects!inner(title, slug, published)")
        .eq("published", true)
        .eq("subjects.published", true)
        .or(`title.ilike.%${q}%,short_description.ilike.%${q}%`);

      if (modsErr) throw modsErr;

      if (mods) {
        for (const m of mods) {
          results.push({
            id: m.id,
            type: "module",
            title: m.title,
            description: m.short_description || undefined,
            url: `/subjects/${(m.subjects as any).slug}/${m.slug}`,
            badge: "Module",
          });
        }
      }

      // Search published lessons
      const { data: lessons, error: lesErr } = await supabase
        .from("lessons")
        .select("id, title, slug, description, module_id, modules!inner(title, slug, published, subject_id, subjects!inner(title, slug, published))")
        .eq("published", true)
        .eq("modules.published", true)
        .or(`title.ilike.%${q}%,description.ilike.%${q}%`);

      if (lesErr) throw lesErr;

      if (lessons) {
        for (const l of lessons) {
          const mod = l.modules as any;
          results.push({
            id: l.id,
            type: "lesson",
            title: l.title,
            description: l.description || undefined,
            url: `/subjects/${mod.subjects.slug}/${mod.slug}/${l.slug}`,
            badge: "Lecture",
          });
        }
      }

      return results;
    } catch (err: any) {
      if (!isLocalFallbackAllowed()) {
        throw new Error(`Failed to search content in Supabase: ${err.message}`);
      }
      console.warn("Supabase search notice:", err);
    }
  }

  // Fallback search
  const subjects = await getPublishedSubjects();
  for (const s of subjects) {
    if (s.title.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q) || s.short_description?.toLowerCase().includes(q)) {
      results.push({
        id: s.id,
        type: "subject",
        title: `${s.title} (${s.code || "KTU"})`,
        description: s.short_description || undefined,
        url: `/subjects/${s.slug}`,
        badge: "Subject",
      });
    }
  }

  for (const mod of fallbackModules.filter((m) => m.published)) {
    if (mod.title.toLowerCase().includes(q) || mod.short_description?.toLowerCase().includes(q)) {
      const parentSubject = subjects.find((s) => s.id === mod.subject_id);
      if (parentSubject) {
        results.push({
          id: mod.id,
          type: "module",
          title: mod.title,
          description: mod.short_description || undefined,
          url: `/subjects/${parentSubject.slug}/${mod.slug}`,
          badge: "Module",
        });
      }
    }
  }

  for (const les of fallbackLessons.filter((l) => l.published)) {
    if (les.title.toLowerCase().includes(q) || les.description?.toLowerCase().includes(q)) {
      const parentModule = fallbackModules.find((m) => m.id === les.module_id && m.published);
      const parentSubject = parentModule ? subjects.find((s) => s.id === parentModule.subject_id) : null;
      if (parentSubject && parentModule) {
        results.push({
          id: les.id,
          type: "lesson",
          title: les.title,
          description: les.description || undefined,
          url: `/subjects/${parentSubject.slug}/${parentModule.slug}/${les.slug}`,
          badge: "Lecture",
        });
      }
    }
  }

  return results;
}

// ---------------- Admin Statistics & Activity ----------------

export async function getAdminStats() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const [subjectsRes, modulesRes, lessonsRes, videosRes, materialsRes] = await Promise.all([
        supabase.from("subjects").select("id, published", { count: "exact" }),
        supabase.from("modules").select("id, published", { count: "exact" }),
        supabase.from("lessons").select("id, published", { count: "exact" }),
        supabase.from("videos").select("id, published", { count: "exact" }),
        supabase.from("materials").select("id, published", { count: "exact" }).is("deleted_at", null),
      ]);

      if (subjectsRes.error) throw subjectsRes.error;
      if (modulesRes.error) throw modulesRes.error;
      if (lessonsRes.error) throw lessonsRes.error;
      if (videosRes.error) throw videosRes.error;
      if (materialsRes.error) throw materialsRes.error;

      const totalSubjects = subjectsRes.count ?? subjectsRes.data?.length ?? 0;
      const publishedSubjects = subjectsRes.data?.filter((s) => s.published).length ?? 0;
      const totalModules = modulesRes.count ?? modulesRes.data?.length ?? 0;
      const totalLessons = lessonsRes.count ?? lessonsRes.data?.length ?? 0;
      const totalVideos = videosRes.count ?? videosRes.data?.length ?? 0;
      const totalMaterials = materialsRes.count ?? materialsRes.data?.length ?? 0;

      return {
        totalSubjects,
        publishedSubjects,
        totalModules,
        totalLessons,
        totalVideos,
        totalMaterials,
        recentUploads: (totalVideos + totalMaterials) > 0 ? (totalVideos + totalMaterials) : 4,
      };
    } catch (err: any) {
      if (!isLocalFallbackAllowed()) {
        throw new Error(`Failed to fetch admin stats from Supabase: ${err.message}`);
      }
      console.warn("Supabase getAdminStats notice:", err);
    }
  }

  const subjects = fallbackSubjects;
  const modules = fallbackModules;
  const lessons = fallbackLessons;
  const videos = fallbackVideos;
  const materials = fallbackMaterials;

  return {
    totalSubjects: subjects.length,
    publishedSubjects: subjects.filter((s) => s.published).length,
    totalModules: modules.length,
    totalLessons: lessons.length,
    totalVideos: videos.length,
    totalMaterials: materials.length,
    recentUploads: 4,
  };
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (err: any) {
      if (!isLocalFallbackAllowed()) {
        throw new Error(`Failed to fetch activity logs from Supabase: ${err.message}`);
      }
      console.warn("Supabase getActivityLogs notice:", err);
    }
  }

  return [...fallbackActivity].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function logActivity(action: string, entityType: string, metadata: Record<string, unknown> = {}) {
  const item: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action,
    entity_type: entityType,
    metadata,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      await supabase.from("activity_logs").insert({
        action,
        entity_type: entityType,
        metadata,
      });
    } catch (err) {
      console.warn("Supabase logActivity notice:", err);
    }
  }

  fallbackActivity.unshift(item);
  if (fallbackActivity.length > 100) fallbackActivity.pop();
}

// ---------------- Diagnostic Consistency Check ----------------

export async function runDataConsistencyCheck() {
  const allSubjects = await getAllSubjects();
  const allModules = await getAllModules();
  const allLessons = await getAllLessons();
  const allVideos = await getAllVideos();
  const allMaterials = await getAllMaterials();

  const issues: string[] = [];

  // Check modules have valid subject
  const subjectIds = new Set(allSubjects.map((s) => s.id));
  for (const m of allModules) {
    if (!subjectIds.has(m.subject_id)) {
      issues.push(`Orphan Module: "${m.title}" (${m.id}) references missing subject_id ${m.subject_id}`);
    }
  }

  // Check lessons have valid module
  const moduleIds = new Set(allModules.map((m) => m.id));
  for (const l of allLessons) {
    if (!moduleIds.has(l.module_id)) {
      issues.push(`Orphan Lesson: "${l.title}" (${l.id}) references missing module_id ${l.module_id}`);
    }
  }

  // Check videos have valid lesson
  const lessonIds = new Set(allLessons.map((l) => l.id));
  for (const v of allVideos) {
    if (!lessonIds.has(v.lesson_id)) {
      issues.push(`Orphan Video: "${v.title || v.id}" references missing lesson_id ${v.lesson_id}`);
    }
  }

  // Check materials have valid lesson
  for (const mat of allMaterials) {
    if (!lessonIds.has(mat.lesson_id)) {
      issues.push(`Orphan Material: "${mat.title}" references missing lesson_id ${mat.lesson_id}`);
    }
  }

  // Check duplicate slugs
  const subjectSlugs = new Set<string>();
  for (const s of allSubjects) {
    if (subjectSlugs.has(s.slug)) issues.push(`Duplicate subject slug: ${s.slug}`);
    subjectSlugs.add(s.slug);
  }

  return {
    status: issues.length === 0 ? "HEALTHY" : "INCONSISTENCY_DETECTED",
    totalSubjects: allSubjects.length,
    totalModules: allModules.length,
    totalLessons: allLessons.length,
    totalVideos: allVideos.length,
    totalMaterials: allMaterials.length,
    issues,
    timestamp: new Date().toISOString(),
  };
}


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
      console.warn("Notice: Fetching departments from Supabase:", error?.message);
      return [...fallbackDepartments].sort((a, b) => a.display_order - b.display_order);
    }
    return data;
  } catch (err: any) {
    console.warn("Notice: Fetching departments from Supabase:", err?.message || err);
    return [...fallbackDepartments].sort((a, b) => a.display_order - b.display_order);
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
      console.warn("Notice: Fetching semesters from Supabase:", error?.message);
      return [...fallbackSemesters].sort((a, b) => a.number - b.number);
    }
    return data;
  } catch (err: any) {
    console.warn("Notice: Fetching semesters from Supabase:", err?.message || err);
    return [...fallbackSemesters].sort((a, b) => a.number - b.number);
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
      throw new Error(`Failed to fetch faculty from Supabase: ${error?.message}`);
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
      throw new Error(`Failed to fetch topics from Supabase: ${error?.message}`);
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
  const allMods = await getAllModules();
  const mod = allMods.find((m) => m.slug === moduleSlug);
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
    slug: data.slug || `topic-${Date.now()}`,
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
        throw new Error(`Failed to create topic in database: ${error.message}`);
      }
      if (!isProduction()) {
        fallbackTopics.push(created);
      }
      return created;
    } catch (err) {
      if (!isLocalFallbackAllowed()) throw err;
    }
  }

  if (isProduction()) {
    throw new Error("Supabase database configuration is required to create topics in production. Local JSON store is strictly disabled.");
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
