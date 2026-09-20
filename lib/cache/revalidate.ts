import { revalidatePath } from "next/cache";

/**
 * Centralized Cache Invalidation Helper for ENGIVAULT.
 * Ensures targeted invalidation across both public and admin routes
 * when content is created, updated, reordered, or deleted in Supabase.
 */

export function revalidateAdminContent() {
  try {
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/dashboard/subjects");
    revalidatePath("/admin/dashboard/modules");
    revalidatePath("/admin/dashboard/lessons");
    revalidatePath("/admin/dashboard/videos");
    revalidatePath("/admin/dashboard/materials");
    revalidatePath("/admin/dashboard/uploads");
  } catch (err) {
    console.warn("revalidateAdminContent failed:", err);
  }
}

export function revalidateSubject(subjectSlug?: string) {
  try {
    revalidatePath("/");
    revalidatePath("/subjects");
    if (subjectSlug) {
      revalidatePath(`/subjects/${subjectSlug}`);
      revalidatePath(`/subjects/${subjectSlug}`, "layout");
    }
    revalidatePath("/admin/dashboard/subjects");
    revalidatePath("/admin/dashboard");
  } catch (err) {
    console.warn("revalidateSubject failed:", err);
  }
}

export function revalidateModule(subjectSlug?: string, moduleSlug?: string) {
  try {
    revalidateSubject(subjectSlug);
    if (subjectSlug && moduleSlug) {
      revalidatePath(`/subjects/${subjectSlug}/${moduleSlug}`);
      revalidatePath(`/subjects/${subjectSlug}/${moduleSlug}`, "layout");
    }
    revalidatePath("/admin/dashboard/modules");
  } catch (err) {
    console.warn("revalidateModule failed:", err);
  }
}

export function revalidateLesson(subjectSlug?: string, moduleSlug?: string, lessonSlug?: string) {
  try {
    revalidateModule(subjectSlug, moduleSlug);
    if (subjectSlug && moduleSlug && lessonSlug) {
      revalidatePath(`/subjects/${subjectSlug}/${moduleSlug}/${lessonSlug}`);
    }
    revalidatePath("/admin/dashboard/lessons");
    revalidatePath("/admin/dashboard/videos");
    revalidatePath("/admin/dashboard/materials");
  } catch (err) {
    console.warn("revalidateLesson failed:", err);
  }
}

export function revalidateContentHierarchy(params: {
  subjectSlug?: string;
  moduleSlug?: string;
  lessonSlug?: string;
}) {
  try {
    revalidatePath("/");
    revalidatePath("/subjects");
    if (params.subjectSlug) {
      revalidatePath(`/subjects/${params.subjectSlug}`);
      if (params.moduleSlug) {
        revalidatePath(`/subjects/${params.subjectSlug}/${params.moduleSlug}`);
        if (params.lessonSlug) {
          revalidatePath(`/subjects/${params.subjectSlug}/${params.moduleSlug}/${params.lessonSlug}`);
        }
      }
    }
    revalidateAdminContent();
  } catch (err) {
    console.warn("revalidateContentHierarchy failed:", err);
  }
}
