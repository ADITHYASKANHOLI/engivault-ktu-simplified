import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const supabaseReady = isSupabaseConfigured();

  return NextResponse.json({
    ok: true,
    status: "healthy",
    app: "ENGIVAULT",
    environment: isProd ? (process.env.VERCEL_ENV || "production") : "development",
    database: supabaseReady ? "configured" : "local-mode",
    timestamp: new Date().toISOString(),
  });
}
