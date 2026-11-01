import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const supabaseReady = isSupabaseConfigured();
  let dbStatus = supabaseReady ? "configured" : "local-mode";
  let dbConnected = !supabaseReady;

  if (supabaseReady) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase.from("site_settings").select("id").limit(1);
      if (!error) {
        dbStatus = "connected";
        dbConnected = true;
      } else {
        dbStatus = "configured-unreachable";
      }
    } catch {
      dbStatus = "configured-unreachable";
    }
  }

  return NextResponse.json({
    ok: true,
    status: "healthy",
    app: "ENGIVAULT",
    environment: isProd ? (process.env.VERCEL_ENV || "production") : "development",
    database: dbStatus,
    databaseConnected: dbConnected,
    timestamp: new Date().toISOString(),
  });
}
