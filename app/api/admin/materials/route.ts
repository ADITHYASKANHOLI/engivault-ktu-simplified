import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { isSafeOrigin } from "@/lib/security/origin";
import { materialSchema } from "@/lib/validation/schemas";
import { createMaterial, deleteMaterial, getAllMaterials, getLessonById, getModuleById } from "@/lib/queries";
import { revalidateContentHierarchy } from "@/lib/cache/revalidate";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { validateMaterialBytes } from "@/lib/security/magic-bytes";

export const runtime = "nodejs";

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
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

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

    const { storage_path, original_filename } = result.data;

    // Path traversal defense
    if (storage_path.includes("..") || storage_path.startsWith("/") || storage_path.includes("\\")) {
      return NextResponse.json({ error: "Invalid storage path structure." }, { status: 400 });
    }

    // Binary Magic-Byte Inspection of the uploaded storage file
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("engivault-materials")
        .download(storage_path);

      if (downloadError || !fileData) {
        return NextResponse.json(
          { error: "Uploaded material file not found in storage. Complete the upload before creating the material." },
          { status: 400 }
        );
      }

      const arrayBuf = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      if (buffer.length > 104857600) {
        await supabase.storage.from("engivault-materials").remove([storage_path]);
        return NextResponse.json(
          { error: "Uploaded file exceeds the maximum 100MB limit for study materials." },
          { status: 400 }
        );
      }

      const magicCheck = validateMaterialBytes(buffer, original_filename);
      if (!magicCheck.valid) {
        // Immediately purge the invalid / malicious file from storage
        await supabase.storage.from("engivault-materials").remove([storage_path]);
        return NextResponse.json(
          { error: magicCheck.error || "Material file binary validation failed: Content does not match an allowed document format." },
          { status: 400 }
        );
      }
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
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

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
