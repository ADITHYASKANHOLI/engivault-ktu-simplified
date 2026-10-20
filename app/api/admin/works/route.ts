import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { worksActivitySchema } from "@/lib/validation/schemas";
import { getAllWorksActivitiesForAdmin, createWorksActivity } from "@/lib/queries";

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
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;

    const activities = await getAllWorksActivitiesForAdmin({
      status,
      category,
      search,
    });

    return NextResponse.json(activities, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/works error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = worksActivitySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const created = await createWorksActivity(result.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/works error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create activity" },
      { status: 500 }
    );
  }
}
