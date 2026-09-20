import fs from "fs";
import path from "path";
import { Subject, Module, Lesson, Video, Material, SiteSettings, ActivityLog, SearchResultItem } from "@/types";
import { createClient as createServerSupabase, isSupabaseConfigured } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { getSignedVideoUrl, getSignedMaterialUrl } from "../storage/signed-urls";

// ---------------- In-Memory Fallback State ----------------
// Provides reliable offline and development fallback while keeping live Supabase as primary source of truth.

const initialFallbackSiteSettings: SiteSettings = {
  id: "00000000-0000-0000-0000-000000000001",
  site_name: "ENGIVAULT",
  headline: "Learn Engineering. Build Confidence.",
  tagline: "KTU Learning. Simplified.",
  logo_path: "/branding/engivault-official-logo.png",
  contact_email: "contact@engivault.edu",
  about_text: "ENGIVAULT is a dedicated KTU engineering study companion providing video lectures, structured module breakdowns, and authentic study notes.",
  footer_text: "© 2026 ENGIVAULT. All rights reserved. KTU Engineering Learning Simplified.",
  social_links: {
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    telegram: "https://t.me",
  },
  updated_at: new Date().toISOString(),
};

const initialFallbackSubjects: Subject[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Engineering Mathematics",
    slug: "engineering-mathematics",
    code: "MAT 101",
    short_description: "Differential calculus, linear algebra, multivariable calculus, and infinite series for KTU first-year engineers.",
    description: "Comprehensive KTU curriculum coverage of Engineering Mathematics. Topics include limits, continuity, partial differentiation, matrices, eigenvalues, multiple integrals, and series expansions with solved university question papers.",
    thumbnail_path: null,
    published: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    modules_count: 2,
    lessons_count: 2,
    materials_count: 2,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    title: "Engineering Graphics",
    slug: "engineering-graphics",
    code: "EST 110",
    short_description: "Principles of engineering drawing, orthographic projection, isometric projection, and CAD drafting.",
    description: "Detailed step-by-step visual instruction on engineering drawing conventions, projection of lines, planes, and solids, sectional views, and isometric representations tailored for KTU university exams.",
    thumbnail_path: null,
    published: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    modules_count: 1,
    lessons_count: 1,
    materials_count: 1,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    title: "Basics of Electrical Engineering",
    slug: "electrical-engineering",
    code: "EST 130",
    short_description: "DC circuits, AC fundamentals, magnetic circuits, transformers, and AC/DC electrical machines.",
    description: "Foundational electrical engineering concepts covering Ohm's and Kirchhoff's laws, network analysis, single-phase and three-phase circuits, electromagnetic induction, transformer operation, and electrical safety standards.",
    thumbnail_path: null,
    published: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    modules_count: 1,
    lessons_count: 1,
    materials_count: 1,
  },
];

const initialFallbackModules: Module[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    subject_id: "11111111-1111-1111-1111-111111111111",
    title: "Module 1 — Single Variable Calculus",
    slug: "module-1-single-variable-calculus",
    short_description: "Limits, indeterminate forms, Rolle's Theorem, Mean Value Theorems, Taylor's series.",
    display_order: 1,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lessons_count: 2,
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    subject_id: "11111111-1111-1111-1111-111111111111",
    title: "Module 2 — Multivariable Calculus",
    slug: "module-2-multivariable-calculus",
    short_description: "Functions of two variables, partial derivatives, chain rule, maxima and minima.",
    display_order: 2,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lessons_count: 0,
  },
  {
    id: "cccccccc-0000-0000-0000-000000000001",
    subject_id: "22222222-2222-2222-2222-222222222222",
    title: "Module 1 — Introduction to Drafting & Projections",
    slug: "module-1-introduction-to-drafting",
    short_description: "Scales, lines, lettering, orthographic projection of points and lines in various quadrants.",
    display_order: 1,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lessons_count: 1,
  },
  {
    id: "dddddddd-0000-0000-0000-000000000001",
    subject_id: "33333333-3333-3333-3333-333333333333",
    title: "Module 1 — DC Circuits & Network Theorems",
    slug: "module-1-dc-circuits",
    short_description: "Mesh and nodal analysis, Thevenin's and Norton's theorem, Maximum power transfer theorem.",
    display_order: 1,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lessons_count: 1,
  },
];

const initialFallbackLessons: Lesson[] = [
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    module_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    title: "Lecture 01 — Introduction to Limits & L'Hospital's Rule",
    slug: "lecture-01-introduction-to-limits",
    lesson_number: 1,
    description: "Understanding evaluation of limits, indeterminate forms (0/0, inf/inf), and applying L'Hospital's rule with KTU exam problem walkthroughs.",
    thumbnail_path: null,
    duration_seconds: 1420,
    published: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    module_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    title: "Lecture 02 — Mean Value Theorems & Applications",
    slug: "lecture-02-mean-value-theorems",
    lesson_number: 2,
    description: "Rolle's Theorem, Lagrange's Mean Value Theorem, Cauchy's Mean Value Theorem, geometric interpretation and analytical proofs.",
    thumbnail_path: null,
    duration_seconds: 1680,
    published: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "eeeeeeee-0000-0000-0000-000000000001",
    module_id: "cccccccc-0000-0000-0000-000000000001",
    title: "Lecture 01 — Projection of Points & First Angle System",
    slug: "lecture-01-projection-of-points",
    lesson_number: 1,
    description: "Conventions of First and Third angle projections, drawing projection of points in 4 quadrants with step-by-step layout.",
    thumbnail_path: null,
    duration_seconds: 1850,
    published: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "ffffffff-0000-0000-0000-000000000001",
    module_id: "dddddddd-0000-0000-0000-000000000001",
    title: "Lecture 01 — Mesh & Nodal Analysis with Dependent Sources",
    slug: "lecture-01-mesh-nodal-analysis",
    lesson_number: 1,
    description: "Systematic nodal and mesh equations for multi-loop circuits, Supernode and Supermesh techniques.",
    thumbnail_path: null,
    duration_seconds: 1540,
    published: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialFallbackVideos: Video[] = [
  {
    id: "v1111111-1111-1111-1111-111111111111",
    lesson_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    title: "Lecture 01 — Limits & L'Hospital's Rule",
    storage_path: "videos/engineering-mathematics/module-1/lecture-01.mp4",
    mime_type: "video/mp4",
    file_size: 154200000,
    duration_seconds: 1420,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "v2222222-2222-2222-2222-222222222222",
    lesson_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    title: "Lecture 02 — Mean Value Theorems",
    storage_path: "videos/engineering-mathematics/module-1/lecture-02.mp4",
    mime_type: "video/mp4",
    file_size: 182000000,
    duration_seconds: 1680,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "v3333333-3333-3333-3333-333333333333",
    lesson_id: "eeeeeeee-0000-0000-0000-000000000001",
    title: "Lecture 01 — Projection of Points",
    storage_path: "videos/engineering-graphics/module-1/lecture-01.mp4",
    mime_type: "video/mp4",
    file_size: 198000000,
    duration_seconds: 1850,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "v4444444-4444-4444-4444-444444444444",
    lesson_id: "ffffffff-0000-0000-0000-000000000001",
    title: "Lecture 01 — Mesh & Nodal Analysis",
    storage_path: "videos/electrical-engineering/module-1/lecture-01.mp4",
    mime_type: "video/mp4",
    file_size: 165000000,
    duration_seconds: 1540,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialFallbackMaterials: Material[] = [
  {
    id: "m1111111-1111-1111-1111-111111111111",
    lesson_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    subject_id: "11111111-1111-1111-1111-111111111111",
    module_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    title: "Module 1 Handwritten Class Notes — Limits & Derivatives",
    description: "Clean handwritten classroom formulas, step-by-step limits derivation, and KTU previous year solved questions.",
    material_type: "pdf",
    storage_path: "materials/engineering-mathematics/module-1/limits-notes.pdf",
    original_filename: "MAT101_Module1_Limits_Notes.pdf",
    mime_type: "application/pdf",
    file_size: 4820000,
    published: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "m2222222-2222-2222-2222-222222222222",
    lesson_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    subject_id: "11111111-1111-1111-1111-111111111111",
    module_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    title: "Mean Value Theorems Practice Problem Sheet with Solutions",
    description: "25 standard university exam questions covering Rolle's and Lagrange's theorems with complete analytical steps.",
    material_type: "pdf",
    storage_path: "materials/engineering-mathematics/module-1/mvt-problems.pdf",
    original_filename: "MAT101_MVT_Practice_Sheet.pdf",
    mime_type: "application/pdf",
    file_size: 3240000,
    published: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "m3333333-3333-3333-3333-333333333333",
    lesson_id: "eeeeeeee-0000-0000-0000-000000000001",
    subject_id: "22222222-2222-2222-2222-222222222222",
    module_id: "cccccccc-0000-0000-0000-000000000001",
    title: "Engineering Graphics Drawing Sheet Standards & Quadrant Rules",
    description: "First angle projection conventions, line weights, dimensioning guides, and drawing sheet layout.",
    material_type: "pdf",
    storage_path: "materials/engineering-graphics/module-1/drawing-standards.pdf",
    original_filename: "EST110_Drawing_Standards.pdf",
    mime_type: "application/pdf",
    file_size: 6120000,
    published: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "m4444444-4444-4444-4444-444444444444",
    lesson_id: "ffffffff-0000-0000-0000-000000000001",
    subject_id: "33333333-3333-3333-3333-333333333333",
    module_id: "dddddddd-0000-0000-0000-000000000001",
    title: "Circuit Theory Summary & Network Theorems Formula Sheet",
    description: "Key equations for mesh, nodal, Thevenin, and Norton analysis with standard circuit diagrams.",
    material_type: "pdf",
    storage_path: "materials/electrical-engineering/module-1/theorems-summary.pdf",
    original_filename: "EST130_Network_Theorems_CheatSheet.pdf",
    mime_type: "application/pdf",
    file_size: 2750000,
    published: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialFallbackActivity: ActivityLog[] = [
  {
    id: "act-1",
    action: "System Initialized",
    entity_type: "system",
    metadata: { version: "1.0.0" },
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "act-2",
    action: "Subject Published",
    entity_type: "subject",
    metadata: { title: "Engineering Mathematics", code: "MAT 101" },
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "act-3",
    action: "Lecture Uploaded",
    entity_type: "lesson",
    metadata: { title: "Lecture 01 — Introduction to Limits" },
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "act-4",
    action: "Study Material Added",
    entity_type: "material",
    metadata: { title: "Module 1 Handwritten Class Notes", type: "pdf" },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

// ---------------- Synchronized File-Backed Fallback Store ----------------
// When Supabase is not yet configured with production keys, this store ensures that
// Next.js Route Handlers and Server Components (which run in separate workers/bundles)
// read and mutate the EXACT SAME dataset with instant consistency.

interface FallbackStoreData {
  siteSettings: SiteSettings;
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
    subjects: [...initialFallbackSubjects],
    modules: [...initialFallbackModules],
    lessons: [...initialFallbackLessons],
    videos: [...initialFallbackVideos],
    materials: [...initialFallbackMaterials],
    activity: [...initialFallbackActivity],
  };
}

function getStore(): FallbackStoreData {
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const content = fs.readFileSync(STORE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
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

const fallbackSubjects: Subject[] = createStoreArrayProxy<Subject>("subjects");
const fallbackModules: Module[] = createStoreArrayProxy<Module>("modules");
const fallbackLessons: Lesson[] = createStoreArrayProxy<Lesson>("lessons");
const fallbackVideos: Video[] = createStoreArrayProxy<Video>("videos");
const fallbackMaterials: Material[] = createStoreArrayProxy<Material>("materials");
const fallbackActivity: ActivityLog[] = createStoreArrayProxy<ActivityLog>("activity");

// Helper to populate virtual relations in fallback arrays
function enrichFallbackLesson(lesson: Lesson): Lesson {
  const mod = fallbackModules.find((m) => m.id === lesson.module_id);
  const subject = mod ? fallbackSubjects.find((s) => s.id === mod.subject_id) : undefined;
  const video = fallbackVideos.find((v) => v.lesson_id === lesson.id) || null;
  const materials = fallbackMaterials.filter((m) => m.lesson_id === lesson.id);

  return {
    ...lesson,
    module: mod ? { ...mod, subject } : undefined,
    video,
    materials,
  };
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
      .single();
    if (error || !data) return fallbackSiteSettings;
    return data;
  } catch {
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
      if (!error && data) {
        Object.assign(fallbackSiteSettings, data);
        await logActivity("Site Settings Updated", "settings");
        return fallbackSiteSettings;
      }
    } catch (err) {
      console.warn("Supabase updateSiteSettings notice:", err);
    }
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

    if (error || !data) return fallbackSubjects.filter((s) => s.published);

    return data.map((s: any) => ({
      ...s,
      modules_count: s.modules?.filter((m: any) => m.published)?.length || 0,
      lessons_count: s.modules?.reduce((acc: number, m: any) => acc + (m.published ? (m.lessons?.filter((l: any) => l.published)?.length || 0) : 0), 0) || 0,
      materials_count: s.modules?.reduce((acc: number, m: any) => 
        acc + (m.published ? (m.lessons?.reduce((lAcc: number, l: any) => lAcc + (l.published ? (l.materials?.filter((mat: any) => mat.published)?.length || 0) : 0), 0) || 0) : 0), 0) || 0,
    }));
  } catch {
    return fallbackSubjects.filter((s) => s.published);
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

    if (error || !data) return fallbackSubjects;

    return data.map((s: any) => ({
      ...s,
      modules_count: s.modules?.length || 0,
      lessons_count: s.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0,
      materials_count: s.modules?.reduce((acc: number, m: any) => 
        acc + (m.lessons?.reduce((lAcc: number, l: any) => lAcc + (l.materials?.length || 0), 0) || 0), 0) || 0,
    }));
  } catch {
    return fallbackSubjects;
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
    const { data, error } = await query.single();
    if (error || !data) return null;
    return data;
  } catch {
    return fallbackSubjects.find((s) => s.slug === slug) || null;
  }
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  if (!isSupabaseConfigured()) {
    return fallbackSubjects.find((s) => s.id === id) || null;
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("subjects").select("*").eq("id", id).single();
    if (error || !data) return null;
    return data;
  } catch {
    return fallbackSubjects.find((s) => s.id === id) || null;
  }
}

export async function createSubject(subject: Partial<Subject>): Promise<Subject> {
  const newId = subject.id || crypto.randomUUID();
  const row: Subject = {
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
    modules_count: 0,
    lessons_count: 0,
    materials_count: 0,
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from("subjects").insert(row).select().single();
      if (error) {
        console.error("Supabase createSubject error:", error);
        throw new Error(`Failed to create subject: ${error.message}`);
      }
      fallbackSubjects.push(data);
      await logActivity("Subject Created", "subject", { id: data.id, title: data.title, slug: data.slug });
      return data;
    } catch (err: any) {
      console.error("Supabase createSubject error:", err);
      throw err;
    }
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
      const idx = fallbackSubjects.findIndex((s) => s.id === id);
      if (idx !== -1) {
        fallbackSubjects[idx] = { ...fallbackSubjects[idx], ...data };
      }
      await logActivity("Subject Updated", "subject", { id, title: data.title });
      return data;
    } catch (err: any) {
      console.error("Supabase updateSubject error:", err);
      throw err;
    }
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

      // 1. Fetch subject title for logging
      const { data: existing } = await supabase.from("subjects").select("title").eq("id", id).single();

      // 2. Find all modules belonging to this subject
      const { data: subjectModules } = await supabase
        .from("modules")
        .select("id")
        .eq("subject_id", id);
      const moduleIds = (subjectModules || []).map((m: any) => m.id);

      if (moduleIds.length > 0) {
        // 3. Find all lessons belonging to those modules
        const { data: subjectLessons } = await supabase
          .from("lessons")
          .select("id")
          .in("module_id", moduleIds);
        const lessonIds = (subjectLessons || []).map((l: any) => l.id);

        if (lessonIds.length > 0) {
          // 4. Collect video storage paths
          const { data: videoRows } = await supabase
            .from("videos")
            .select("storage_path")
            .in("lesson_id", lessonIds);
          const videoPaths = (videoRows || []).map((v: any) => v.storage_path).filter(Boolean);

          // 5. Collect material storage paths
          const { data: materialRows } = await supabase
            .from("materials")
            .select("storage_path")
            .in("lesson_id", lessonIds);
          const materialPaths = (materialRows || []).map((m: any) => m.storage_path).filter(Boolean);

          // 6. Remove files from Supabase Storage buckets (non-blocking)
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
        }
      }

      // 7. Delete the subject — ON DELETE CASCADE handles modules → lessons → videos → materials rows
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) {
        console.error("Supabase deleteSubject error:", error);
        throw new Error(`Failed to delete subject: ${error.message}`);
      }

      // 8. Sync fallback local store — remove subject and all its children
      const localModIds = fallbackModules.filter((m) => m.subject_id === id).map((m) => m.id);
      const localLessonIds = fallbackLessons.filter((l) => localModIds.includes(l.module_id)).map((l) => l.id);

      for (let i = fallbackMaterials.length - 1; i >= 0; i--) {
        if (localLessonIds.includes(fallbackMaterials[i].lesson_id)) fallbackMaterials.splice(i, 1);
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

      await logActivity("Subject Deleted", "subject", { id, title: existing?.title || "Subject" });
      return true;
    } catch (err: any) {
      console.error("Supabase deleteSubject error:", err);
      throw err;
    }
  }

  // Fallback-only mode: cascade through local store arrays
  const index = fallbackSubjects.findIndex((s) => s.id === id);
  if (index === -1) return false;
  const removed = fallbackSubjects.splice(index, 1)[0];

  const localModIds = fallbackModules.filter((m) => m.subject_id === id).map((m) => m.id);
  const localLessonIds = fallbackLessons.filter((l) => localModIds.includes(l.module_id)).map((l) => l.id);

  for (let i = fallbackMaterials.length - 1; i >= 0; i--) {
    if (localLessonIds.includes(fallbackMaterials[i].lesson_id)) fallbackMaterials.splice(i, 1);
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
    if (error || !data) return [];
    return data.map((m: any) => ({
      ...m,
      subject: m.subjects,
      lessons_count: m.lessons?.length || 0,
    }));
  } catch {
    return fallbackModules;
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
    if (error || !data) return [];
    return data.map((m: any) => ({
      ...m,
      subject: m.subjects,
      lessons_count: requirePublished
        ? (m.lessons?.filter((l: any) => l.published)?.length || 0)
        : (m.lessons?.length || 0),
    }));
  } catch {
    return fallbackModules.filter((m) => m.subject_id === subjectId);
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
    const { data, error } = await query.single();
    if (error || !data) return null;
    return {
      ...data,
      subject: data.subjects,
    };
  } catch {
    return fallbackModules.find((m) => m.subject_id === subjectId && m.slug === moduleSlug) || null;
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
    const { data, error } = await supabase.from("modules").select("*, subjects(*)").eq("id", id).single();
    if (error || !data) return null;
    return { ...data, subject: data.subjects };
  } catch {
    return fallbackModules.find((m) => m.id === id) || null;
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
      fallbackModules.push(enriched);
      await logActivity("Module Created", "module", { id: created.id, title: created.title, slug: created.slug });
      return enriched;
    } catch (err: any) {
      console.error("Supabase createModule error:", err);
      throw err;
    }
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
      const idx = fallbackModules.findIndex((m) => m.id === id);
      if (idx !== -1) fallbackModules[idx] = { ...fallbackModules[idx], ...data };
      await logActivity("Module Updated", "module", { id, title: data.title });
      return data;
    } catch (err: any) {
      console.error("Supabase updateModule error:", err);
      throw err;
    }
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

      // Step 4: Delete the module itself
      const { error: modErr } = await supabase.from("modules").delete().eq("id", id);
      if (modErr) {
        console.error("Supabase deleteModule error:", modErr);
        throw new Error(`Failed to delete module: ${modErr.message}`);
      }

      // Step 5: Clean up local fallback store atomically
      cleanupLocalStoreForModule(id, lessonIds);

      await logActivity("Module Deleted", "module", { id, title: existing.title });
      return true;
    } catch (err: any) {
      console.error("Supabase deleteModule error:", err);
      throw err;
    }
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
    const supabase = createAdminClient();
    let query = supabase
      .from("lessons")
      .select("*, modules(id, title, slug, subject_id, subjects(id, title, slug, code)), videos(*), materials(*)")
      .order("display_order", { ascending: true })
      .order("lesson_number", { ascending: true });

    if (options?.moduleId) {
      query = query.eq("module_id", options.moduleId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    let lessons = data.map((l: any) => ({
      ...l,
      module: l.modules
        ? {
            ...l.modules,
            subject: l.modules.subjects,
          }
        : undefined,
      video: l.videos?.[0] || null,
      materials: l.materials || [],
    }));

    if (options?.subjectId) {
      lessons = lessons.filter((l: any) => l.module?.subject_id === options.subjectId);
    }

    return lessons;
  } catch (err) {
    console.error("Supabase getAllLessons error:", err);
    return fallbackLessons.map(enrichFallbackLesson);
  }
}

export async function getLessonsForModule(moduleId: string, requirePublished = true): Promise<Lesson[]> {
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
    if (error || !data) return [];
    return data.map((l: any) => ({
      ...l,
      video: l.videos?.[0] || null,
      materials: l.materials || [],
    }));
  } catch {
    return fallbackLessons.filter((l) => l.module_id === moduleId).map(enrichFallbackLesson);
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
    const { data, error } = await query.single();
    if (error || !data) return null;

    const video = data.videos?.[0] || null;
    if (video) {
      video.playback_url = await getSignedVideoUrl(video.storage_path);
    }

    const materials = data.materials || [];
    for (const m of materials) {
      m.download_url = await getSignedMaterialUrl(m.storage_path);
    }

    return {
      ...data,
      module: data.modules
        ? {
            ...data.modules,
            subject: data.modules.subjects,
          }
        : undefined,
      video,
      materials,
    };
  } catch {
    const l = fallbackLessons.find((les) => les.module_id === moduleId && les.slug === lessonSlug);
    return l ? enrichFallbackLesson(l) : null;
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
      .single();

    if (error || !data) return null;
    return {
      ...data,
      module: data.modules
        ? {
            ...data.modules,
            subject: data.modules.subjects,
          }
        : undefined,
      video: data.videos?.[0] || null,
      materials: data.materials || [],
    };
  } catch {
    const les = fallbackLessons.find((l) => l.id === id);
    return les ? enrichFallbackLesson(les) : null;
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
      .eq("modules.subjects.published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return fallbackLessons.filter((l) => l.published).map(enrichFallbackLesson).slice(0, limit);

    return data.map((l: any) => ({
      ...l,
      module: {
        ...l.modules,
        subject: l.modules.subjects,
      },
      video: l.videos?.[0] || null,
      materials: l.materials || [],
    }));
  } catch {
    return fallbackLessons.filter((l) => l.published).map(enrichFallbackLesson).slice(0, limit);
  }
}

export async function createLesson(data: Partial<Lesson>): Promise<Lesson> {
  const insertPayload = {
    id: data.id || crypto.randomUUID(),
    module_id: data.module_id!,
    title: data.title || "Untitled Lecture",
    slug: data.slug || `lecture-${Date.now()}`,
    lesson_number: data.lesson_number ?? 1,
    description: data.description || null,
    thumbnail_path: data.thumbnail_path || null,
    duration_seconds: data.duration_seconds ?? 1200,
    published: Boolean(data.published),
    display_order: data.display_order ?? (fallbackLessons.length + 1),
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
      fallbackLessons.push(enriched);
      await logActivity("Lesson Created", "lesson", { id: created.id, title: created.title, slug: created.slug });
      return enriched;
    } catch (err: any) {
      console.error("Supabase createLesson error:", err);
      throw err;
    }
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
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const payload: Record<string, any> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      delete payload.id;
      delete payload.created_at;
      delete payload.module;
      delete payload.video;
      delete payload.materials;

      const { data, error } = await supabase.from("lessons").update(payload).eq("id", id).select().single();
      if (error) {
        console.error("Supabase updateLesson error:", error);
        throw new Error(`Failed to update lesson in database: ${error.message}`);
      }
      const idx = fallbackLessons.findIndex((l) => l.id === id);
      if (idx !== -1) fallbackLessons[idx] = { ...fallbackLessons[idx], ...data };
      await logActivity("Lesson Updated", "lesson", { id, title: data.title });
      return data;
    } catch (err: any) {
      console.error("Supabase updateLesson error:", err);
      throw err;
    }
  }

  const index = fallbackLessons.findIndex((l) => l.id === id);
  if (index === -1) return null;
  fallbackLessons[index] = {
    ...fallbackLessons[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  await logActivity("Lesson Updated", "lesson", { id, updates });
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

      // 2. Delete the lesson record (database ON DELETE CASCADE handles child video and material rows)
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) {
        console.error("Supabase deleteLesson error:", error);
        throw new Error(`Failed to delete lesson from database: ${error.message}`);
      }

      const idx = fallbackLessons.findIndex((l) => l.id === id);
      if (idx !== -1) fallbackLessons.splice(idx, 1);
      for (let i = fallbackVideos.length - 1; i >= 0; i--) {
        if (fallbackVideos[i].lesson_id === id) fallbackVideos.splice(i, 1);
      }
      for (let i = fallbackMaterials.length - 1; i >= 0; i--) {
        if (fallbackMaterials[i].lesson_id === id) fallbackMaterials.splice(i, 1);
      }

      await logActivity("Lesson Deleted", "lesson", { id, title: existing?.title || "Lesson" });
      return true;
    } catch (err: any) {
      console.error("Supabase deleteLesson error:", err);
      throw err;
    }
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

    if (error || !data) return [];
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
  } catch {
    return fallbackVideos;
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
    const { data, error } = await supabase.from("videos").select("*").eq("lesson_id", lessonId).single();
    if (error || !data) return null;
    data.playback_url = await getSignedVideoUrl(data.storage_path);
    return data;
  } catch {
    return null;
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
      fallbackVideos.push(created);
      await logActivity("Video Uploaded", "video", { id: created.id, title: created.title, lesson_id: created.lesson_id });
      return created;
    } catch (err: any) {
      console.error("Supabase createVideo error:", err);
      throw err;
    }
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
      const fIdx = fallbackVideos.findIndex((v) => v.id === id);
      if (fIdx !== -1) fallbackVideos.splice(fIdx, 1);
      await logActivity("Video Deleted", "video", { id });
      return true;
    } catch (err) {
      console.error("Supabase deleteVideo error:", err);
      throw err;
    }
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

    if (error || !data) return [];
    for (const mat of data) {
      mat.download_url = await getSignedMaterialUrl(mat.storage_path);
    }
    return data;
  } catch {
    return [];
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

    if (error || !data) return fallbackMaterials;
    return data.map((mat: any) => ({
      ...mat,
      lesson: mat.lessons,
      module: mat.lessons?.modules,
      subject: mat.lessons?.modules?.subjects,
    }));
  } catch {
    return fallbackMaterials;
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
      fallbackMaterials.push(created);
      await logActivity("Material Uploaded", "material", { id: created.id, title: created.title });
      return created;
    } catch (err: any) {
      console.error("Supabase createMaterial error:", err);
      throw err;
    }
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
      const idx = fallbackMaterials.findIndex((m) => m.id === id);
      if (idx !== -1) fallbackMaterials.splice(idx, 1);
      await logActivity("Material Deleted", "material", { id });
      return true;
    } catch (err) {
      console.error("Supabase deleteMaterial error:", err);
      throw err;
    }
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
      const { data: subs } = await supabase
        .from("subjects")
        .select("id, title, slug, code, short_description")
        .eq("published", true)
        .or(`title.ilike.%${q}%,code.ilike.%${q}%,short_description.ilike.%${q}%`);

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
      const { data: mods } = await supabase
        .from("modules")
        .select("id, title, slug, short_description, subject_id, subjects!inner(title, slug, published)")
        .eq("published", true)
        .eq("subjects.published", true)
        .or(`title.ilike.%${q}%,short_description.ilike.%${q}%`);

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
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, slug, description, module_id, modules!inner(title, slug, published, subject_id, subjects!inner(title, slug, published))")
        .eq("published", true)
        .eq("modules.published", true)
        .eq("modules.subjects.published", true)
        .or(`title.ilike.%${q}%,description.ilike.%${q}%`);

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
    } catch (err) {
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
    } catch (err) {
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

      if (!error && data && data.length > 0) return data;
    } catch (err) {
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
