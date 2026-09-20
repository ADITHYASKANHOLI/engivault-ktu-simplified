import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { moduleSchema, moduleUpdateSchema } from "@/lib/validation/schemas";
import { getAllModules, getModuleById, createModule, updateModule, deleteModule, getSubjectById } from "@/lib/queries";
import { revalidateContentHierarchy } from "@/lib/cache/revalidate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId") || undefined;
    const modules = await getAllModules(subjectId);
    return NextResponse.json(modules, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/modules error:", error);
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = moduleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const created = await createModule(result.data);
    const parentSubject = await getSubjectById(created.subject_id);

    revalidateContentHierarchy({
      subjectSlug: parentSubject?.slug,
      moduleSlug: created.slug,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/modules error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create module" },
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
      return NextResponse.json({ error: "Module ID is required" }, { status: 400 });
    }

    const result = moduleUpdateSchema.safeParse(updates);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const existing = await getModuleById(id);
    if (!existing) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const updated = await updateModule(id, result.data);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
    }

    const parentSubject = await getSubjectById(updated.subject_id);
    revalidateContentHierarchy({
      subjectSlug: parentSubject?.slug,
      moduleSlug: updated.slug,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/admin/modules error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update module" },
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
      return NextResponse.json({ error: "Module ID is required" }, { status: 400 });
    }

    const existing = await getModuleById(id);
    if (!existing) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const success = await deleteModule(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
    }

    const parentSubject = await getSubjectById(existing.subject_id);
    revalidateContentHierarchy({
      subjectSlug: parentSubject?.slug,
      moduleSlug: existing.slug,
    });

    return NextResponse.json(
      { success: true, id },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("DELETE /api/admin/modules error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete module" },
      { status: 500 }
    );
  }
}
