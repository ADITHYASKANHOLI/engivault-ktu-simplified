import { NextResponse } from "next/server";
import { getAuthenticatedStudent } from "@/lib/space/permissions";
import { spaceService } from "@/lib/space/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const student = await getAuthenticatedStudent();
  if (!student) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in with your student account." },
      { status: 401 }
    );
  }

  try {
    const data = await spaceService.getMySpaceData(student.id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error retrieving student space data:", error);
    return NextResponse.json(
      { error: "Unable to load personal space data." },
      { status: 500 }
    );
  }
}
