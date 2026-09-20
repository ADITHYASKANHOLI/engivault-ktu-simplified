import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { materialSchema } from "@/lib/validation/schemas";
import { createMaterial, deleteMaterial, getAllMaterials, getLessonById, getModuleById } from "@/lib/queries";
import { revalidateContentHierarchy } from "@/lib/cache/revalidate";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const materials = await getAllMaterials();
    return NextResponse.json(materials);
  } catch (error: any) {
    console.error("GET /api/admin/materials error:", error);
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = materialSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const created = await createMaterial(result.data);

    // Targeted cache invalidation
    const parentLesson = await getLessonById(created.lesson_id);
    const parentModule = parentLesson?.module_id ? await getModuleById(parentLesson.module_id) : null;

    revalidateContentHierarchy({
      subjectSlug: parentModule?.subject?.slug,
      moduleSlug: parentModule?.slug,
      lessonSlug: parentLesson?.slug,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/materials error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create material" },
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
      return NextResponse.json({ error: "Material ID required" }, { status: 400 });
    }

    const success = await deleteMaterial(id);
    if (!success) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    revalidateContentHierarchy({});
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE /api/admin/materials error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete material" },
      { status: 500 }
    );
  }
}
