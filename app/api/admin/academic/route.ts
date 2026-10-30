import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  getAllDepartments,
  getAllSemesters,
  getAllFaculty,
  getAllTopics,
  createTopic,
} from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [departments, semesters, faculty, topics] = await Promise.all([
      getAllDepartments(),
      getAllSemesters(),
      getAllFaculty(),
      getAllTopics(),
    ]);

    return NextResponse.json(
      {
        departments,
        semesters,
        faculty,
        topics,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/admin/academic error:", error);
    return NextResponse.json({ error: "Failed to fetch academic hierarchy" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.title || !body.module_id) {
      return NextResponse.json(
        { error: "Title and module_id are required for creating a topic" },
        { status: 400 }
      );
    }

    const topic = await createTopic(body);
    return NextResponse.json(topic, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/academic error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create topic" }, { status: 500 });
  }
}
