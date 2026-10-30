import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const username = user.user_metadata?.username || splitInternalEmail(user.email);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username,
        createdAt: user.created_at,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}

function splitInternalEmail(email?: string | null): string {
  if (!email) return "student";
  return email.split("@")[0] || "student";
}
