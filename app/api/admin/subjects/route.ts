import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { subjectSchema, subjectUpdateSchema } from "@/lib/validation/schemas";
import { getAllSubjects, getSubjectById, createSubject, updateSubject, deleteSubject } from "@/lib/queries";
import { revalidateContentHierarchy } from "@/lib/cache/revalidate";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subjects = await getAllSubjects();
    return NextResponse.json(subjects);
  } catch (error: any) {
    console.error("GET /api/admin/subjects error:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = subjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const created = await createSubject(result.data);
    revalidateContentHierarchy({
      subjectSlug: created.slug,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/subjects error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create subject" },
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
      return NextResponse.json({ error: "Subject ID required" }, { status: 400 });
    }

    const result = subjectUpdateSchema.safeParse(updates);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const existing = await getSubjectById(id);
    if (!existing) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const updated = await updateSubject(id, result.data);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update subject" }, { status: 500 });
    }

    revalidateContentHierarchy({
      subjectSlug: updated.slug,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/admin/subjects error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update subject" },
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
      return NextResponse.json({ error: "Subject ID required" }, { status: 400 });
    }

    const existing = await getSubjectById(id);
    if (!existing) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const success = await deleteSubject(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
    }

    revalidateContentHierarchy({
      subjectSlug: existing.slug,
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE /api/admin/subjects error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete subject" },
      { status: 500 }
    );
  }
}
