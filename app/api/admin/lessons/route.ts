import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { lessonSchema, lessonUpdateSchema } from "@/lib/validation/schemas";
import { getAllLessons, getLessonById, createLesson, updateLesson, deleteLesson, getModuleById } from "@/lib/queries";
import { revalidateContentHierarchy } from "@/lib/cache/revalidate";
import { parseYouTubeUrl, isValidYouTubeUrl, getYouTubeThumbnailUrl } from "@/lib/utils/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    return NextResponse.json(lessons, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    });
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
    const rawBody = await request.json();
    const body = {
      ...rawBody,
      youtube_url: rawBody.youtube_url !== undefined ? rawBody.youtube_url : rawBody.youtubeUrl,
    };

    // Strict validation for required fields
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length < 2) {
      return NextResponse.json(
        { error: "Lecture Name is required (minimum 2 characters)." },
        { status: 400 }
      );
    }

    const youtubeUrl = typeof body.youtube_url === "string" ? body.youtube_url.trim() : "";
    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube Video Link is required." },
        { status: 400 }
      );
    }

    const parseResult = parseYouTubeUrl(youtubeUrl);
    if (!parseResult.isValid || !parseResult.videoId) {
      return NextResponse.json(
        { error: "Please enter a valid YouTube video link." },
        { status: 400 }
      );
    }

    body.youtube_video_id = parseResult.videoId;
    body.thumbnail_path = body.thumbnail_path || getYouTubeThumbnailUrl(parseResult.videoId);

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
    const rawBody = await request.json();
    const { id, ...rawUpdates } = rawBody;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    const updates = {
      ...rawUpdates,
      youtube_url:
        rawUpdates.youtube_url !== undefined
          ? rawUpdates.youtube_url
          : rawUpdates.youtubeUrl,
    };

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
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // body may not be JSON
      }
    }

    if (!id || typeof id !== "string") {
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

    const postCheck = await getLessonById(id);
    if (postCheck) {
      return NextResponse.json(
        { error: "Lesson was not deleted from database." },
        { status: 500 }
      );
    }

    const parentModule = existing.module_id ? await getModuleById(existing.module_id) : null;
    revalidateContentHierarchy({
      subjectSlug: parentModule?.subject?.slug,
      moduleSlug: parentModule?.slug,
      lessonSlug: existing.slug,
    });

    return NextResponse.json(
      { success: true, deletedId: id, id },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("DELETE /api/admin/lessons error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
