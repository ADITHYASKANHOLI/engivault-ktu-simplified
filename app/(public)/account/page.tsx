import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { StudentAccountView } from "@/components/account/StudentAccountView";
import type {
  AvatarAssetsPayload,
  AvatarProcessingStatus,
} from "@/lib/portrait/avatar-types";

export const metadata: Metadata = {
  title: "Student Account — FOLE Web",
  description: "Manage your student account profile and credentials on FOLE Web.",
};

export const dynamic = "force-dynamic";

function normalizeStatus(value: unknown): AvatarProcessingStatus {
  if (
    value === "processed" ||
    value === "fallback" ||
    value === "legacy" ||
    value === "none"
  ) {
    return value;
  }
  return "none";
}

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

  let initialAvatarAssets: AvatarAssetsPayload = {
    avatarUrl: null,
    originalUrl: null,
    processedUrl: null,
    cardUrl: null,
    processingStatus: "none",
  };

  try {
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select(
        "avatar_url, avatar_original_url, avatar_processed_url, avatar_card_url, avatar_processing_status"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (!profileErr && profile) {
      const avatarUrl = profile.avatar_card_url ?? profile.avatar_url ?? null;
      initialAvatarAssets = {
        avatarUrl,
        originalUrl: profile.avatar_original_url ?? null,
        processedUrl: profile.avatar_processed_url ?? null,
        cardUrl: profile.avatar_card_url ?? avatarUrl,
        processingStatus: normalizeStatus(
          profile.avatar_processing_status ?? (avatarUrl ? "legacy" : "none")
        ),
      };
    } else {
      // Fallback safely when migration 016 columns are not yet present
      const { data: legacy } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      const url = legacy?.avatar_url ?? null;
      initialAvatarAssets = {
        avatarUrl: url,
        originalUrl: null,
        processedUrl: null,
        cardUrl: url,
        processingStatus: url ? "legacy" : "none",
      };
    }
  } catch {
    initialAvatarAssets = {
      avatarUrl: null,
      originalUrl: null,
      processedUrl: null,
      cardUrl: null,
      processingStatus: "none",
    };
  }

  return (
    <div className="flex-1 bg-slate-50/50 dark:bg-slate-950 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
      <div className="max-w-4xl mx-auto">
        <StudentAccountView
          username={username}
          createdAt={user.created_at}
          initialAvatarAssets={initialAvatarAssets}
        />
      </div>
    </div>
  );
}
