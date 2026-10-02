import { NextRequest, NextResponse } from "next/server";
import { searchContent } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json([]);
  }

  const results = await searchContent(q);
  return NextResponse.json(results);
}
