import { GET as handleFlyerGet } from "@/app/api/works/[slug]/flyer/route";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return handleFlyerGet(request, context);
}
