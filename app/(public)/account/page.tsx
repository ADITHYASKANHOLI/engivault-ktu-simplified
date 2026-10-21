import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { StudentAccountView } from "@/components/account/StudentAccountView";

export const metadata: Metadata = {
  title: "Student Account — FOLE Web",
  description: "Manage your student account profile and credentials on FOLE Web.",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    redirect("/?auth=login");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/?auth=login");
  }

  const username =
    user.user_metadata?.username ||
    user.email?.split("@")[0] ||
    "student";

  return (
    <div className="flex-1 bg-slate-50/50 dark:bg-slate-950 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
      <div className="max-w-4xl mx-auto">
        <StudentAccountView
          username={username}
          createdAt={user.created_at}
        />
      </div>
    </div>
  );
}
