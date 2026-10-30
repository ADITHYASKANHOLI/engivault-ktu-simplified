import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { isSafeOrigin } from "@/lib/security/origin";
import { spaceService } from "@/lib/space/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
  }

  try {
    const result = await spaceService.forceCheckoutSession(sessionId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Session successfully forced to check out." });
  } catch (error: any) {
    console.error("Force checkout error:", error);
    return NextResponse.json({ error: error?.message || "Failed to force check out." }, { status: 500 });
  }
}
