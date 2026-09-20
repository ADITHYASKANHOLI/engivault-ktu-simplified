import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { lessonSchema, lessonUpdateSchema } from "@/lib/validation/schemas";
import { getAllLessons, getLessonById, createLesson, updateLesson, deleteLesson, getModuleById } from "@/lib/queries";
import { revalidateContentHierarchy } from "@/lib/cache/revalidate";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId") || undefined;
    const subjectId = searchParams.get("subjectId") || undefined;

    const lessons = await getAllLessons({ moduleId, subjectId });
    return NextResponse.json(lessons);
  } catch (error: any) {
    console.error("GET /api/admin/lessons error:", error);
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = lessonSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const created = await createLesson(result.data);

    // Fetch parent hierarchy for targeted cache invalidation
    const parentModule = await getModuleById(created.module_id);
    revalidateContentHierarchy({
      subjectSlug: parentModule?.subject?.slug,
      moduleSlug: parentModule?.slug,
      lessonSlug: created.slug,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/lessons error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create lesson" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    const result = lessonUpdateSchema.safeParse(updates);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const existing = await getLessonById(id);
    if (!existing) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const updated = await updateLesson(id, result.data);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 });
    }

    const parentModule = await getModuleById(updated.module_id);
    revalidateContentHierarchy({
      subjectSlug: parentModule?.subject?.slug,
      moduleSlug: parentModule?.slug,
      lessonSlug: updated.slug,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/admin/lessons error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update lesson" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    const existing = await getLessonById(id);
    if (!existing) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const success = await deleteLesson(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
    }

    const parentModule = existing.module_id ? await getModuleById(existing.module_id) : null;
    revalidateContentHierarchy({
      subjectSlug: parentModule?.subject?.slug,
      moduleSlug: parentModule?.slug,
      lessonSlug: existing.slug,
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE /api/admin/lessons error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
