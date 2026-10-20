import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { updateWorksActivityStatus } from "@/lib/queries";
import { WorksActivityStatus } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const status = body.status as WorksActivityStatus;

    if (!["draft", "published", "archived"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value. Must be 'draft', 'published', or 'archived'." },
        { status: 400 }
      );
    }

    const updated = await updateWorksActivityStatus(id, status);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("POST /api/admin/works/[id]/status error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update activity status" },
      { status: 500 }
    );
  }
}
