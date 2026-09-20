import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { videoSchema } from "@/lib/validation/schemas";
import { getAllVideos, createVideo, deleteVideo, getLessonById, getModuleById } from "@/lib/queries";
import { revalidateContentHierarchy } from "@/lib/cache/revalidate";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const videos = await getAllVideos();
    return NextResponse.json(videos);
  } catch (error: any) {
    console.error("GET /api/admin/videos error:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = videoSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const created = await createVideo(result.data);

    // Invalidate caches
    const parentLesson = await getLessonById(created.lesson_id);
    const parentModule = parentLesson?.module_id ? await getModuleById(parentLesson.module_id) : null;

    revalidateContentHierarchy({
      subjectSlug: parentModule?.subject?.slug,
      moduleSlug: parentModule?.slug,
      lessonSlug: parentLesson?.slug,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/videos error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record video metadata" },
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
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    const success = await deleteVideo(id);
    if (!success) {
      return NextResponse.json({ error: "Video not found or failed to delete" }, { status: 500 });
    }

    revalidateContentHierarchy({});

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE /api/admin/videos error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete video" },
      { status: 500 }
    );
  }
}
