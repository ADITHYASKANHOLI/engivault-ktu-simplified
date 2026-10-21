import React from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getAdminSession } from "@/lib/auth/session";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminSession = await getAdminSession();
  let studentUser = null;
  const isConfigured = isSupabaseConfigured();

  if (!adminSession && isConfigured) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      studentUser = user;
    } catch {
      // Ignore auth fetch error in SSR to prevent layout crash
    }
  }

  const initialAuth = adminSession
    ? { role: "admin" as const, username: "Admin" }
    : studentUser
    ? {
        role: "student" as const,
        username:
          studentUser.user_metadata?.username ||
          studentUser.email?.split("@")[0] ||
          "Student",
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader initialAuth={initialAuth} isOffline={!isConfigured} />
      <div className="flex-1 flex flex-col">{children}</div>
      <SiteFooter />
    </div>
  );
}
