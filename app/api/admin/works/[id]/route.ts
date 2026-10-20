import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { worksActivityUpdateSchema } from "@/lib/validation/schemas";
import { getWorksActivityById, updateWorksActivity, deleteWorksActivity } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const activity = await getWorksActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    return NextResponse.json(activity);
  } catch (error: any) {
    console.error("GET /api/admin/works/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch activity" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const result = worksActivityUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateWorksActivity(id, result.data);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/admin/works/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update activity" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const soft = searchParams.get("hard") !== "true";

    const deleted = await deleteWorksActivity(id, soft);
    if (!deleted) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE /api/admin/works/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete activity" },
      { status: 500 }
    );
  }
}
