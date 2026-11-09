/**
 * Student Profile Avatar API Route
 *
 * GET    /api/auth/student/avatar — Retrieve current user's avatar URL
 * POST   /api/auth/student/avatar — Upload a new avatar (multipart/form-data, field: "file")
 * DELETE /api/auth/student/avatar — Remove avatar and reset to placeholder
 *
 * Security model:
 *  - Authenticated via Supabase JWT (`supabase.auth.getUser()`).
 *  - CSRF origin validation on all mutating requests (`isSafeOrigin`).
 *  - DB-backed per-user upload rate limiting.
 *  - Each user's avatars are stored strictly under: engivault-avatars/<userId>/avatar.<ext>
 *  - Magic-byte inspection rejects non-raster/spoofed payloads (JPG, PNG, WebP only).
 *  - 5 MB file size limit enforced server-side.
 *  - Old extension variants are cleaned up on replace to prevent orphaned objects.
 *  - Only `avatar_url` is updated in `public.profiles` (via admin client or narrow SECURITY DEFINER RPC).
 */

import { NextRequest, NextResponse } from "next/server";
import { isSafeOrigin } from "@/lib/security/origin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { validateImageBytes } from "@/lib/security/magic-bytes";
import {
  checkDbRateLimit,
  getClientIp,
  hashIdentifier,
  rateLimitResponse,
} from "@/lib/security/db-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AVATAR_BUCKET = "engivault-avatars";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_DECLARED_MIME = new Set([
  "",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function persistAvatarUrl(
  userId: string,
  avatarUrl: string | null,
  ssrSupabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ error: string | null }> {
  if (isSupabaseAdminConfigured()) {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (!error) return { error: null };
    return { error: error.message };
  }

  const { error } = await ssrSupabase.rpc("update_own_avatar_url", {
    p_avatar_url: avatarUrl,
  });

  if (!error) return { error: null };
  return { error: error.message };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ avatarUrl: null }, { status: 200 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      // Gracefully degrade to null if migration 015 hasn't added avatar_url yet
      return NextResponse.json({ avatarUrl: null }, { status: 200 });
    }

    return NextResponse.json({ avatarUrl: profile?.avatar_url ?? null });
  } catch (err: any) {
    console.error("[AVATAR GET]", err?.message);
    return NextResponse.json(
      { error: "Failed to retrieve avatar." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json(
      { error: "Cross-origin request rejected." },
      { status: 403 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Storage is not configured in this environment." },
      { status: 503 }
    );
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Request must be multipart/form-data." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(request);
    const rateLimit = await checkDbRateLimit(
      hashIdentifier(`avatar-upload:${user.id}:${ip}`),
      { windowSeconds: 15 * 60, maxAttempts: 15 }
    );
    if (!rateLimit.allowed) {
      return rateLimitResponse(
        "Too many avatar upload attempts. Please wait a few minutes.",
        rateLimit.resetInSeconds
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // 1. File size check
    if (file.size <= 0) {
      return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 5 MB." },
        { status: 413 }
      );
    }

    // 2. Declared MIME pre-check (if supplied by client)
    const declaredMime = (file.type || "").toLowerCase();
    if (!ALLOWED_DECLARED_MIME.has(declaredMime)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file format. Please upload a JPG, PNG, or WebP image.",
        },
        { status: 415 }
      );
    }

    // 3. Magic-byte validation (authoritative binary inspection)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 5 MB." },
        { status: 413 }
      );
    }

    const magicCheck = validateImageBytes(buffer);
    if (!magicCheck.valid || !magicCheck.detectedType) {
      return NextResponse.json(
        {
          error:
            magicCheck.error ||
            "File content does not match a valid JPG, PNG, or WebP image.",
        },
        { status: 415 }
      );
    }

    // 4. Deterministic storage path scoped to authenticated user: <userId>/avatar.<ext>
    const detectedMime = magicCheck.detectedType;
    const ext = EXT_MAP[detectedMime] ?? "jpg";
    const storagePath = `${user.id}/avatar.${ext}`;

    // Use user-scoped storage client (or admin fallback if storage RLS isn't provisioned yet)
    const storageClient = supabase.storage.from(AVATAR_BUCKET);

    // 5. Remove stale extension variants so orphaned files aren't left behind
    const stalePaths = (["jpg", "png", "webp"] as const)
      .filter((candidate) => candidate !== ext)
      .map((candidate) => `${user.id}/avatar.${candidate}`);
    if (stalePaths.length > 0) {
      await storageClient.remove(stalePaths).catch(() => {});
    }

    // 6. Upload to Supabase Storage with upsert
    let { error: uploadError } = await storageClient.upload(storagePath, buffer, {
      contentType: detectedMime,
      upsert: true,
      cacheControl: "3600",
    });

    // If user-scoped storage upload fails due to RLS and admin client is configured, retry securely for verified user.id
    if (uploadError && isSupabaseAdminConfigured()) {
      const admin = createAdminClient();
      const adminStorage = admin.storage.from(AVATAR_BUCKET);
      if (stalePaths.length > 0) {
        await adminStorage.remove(stalePaths).catch(() => {});
      }
      const adminUpload = await adminStorage.upload(storagePath, buffer, {
        contentType: detectedMime,
        upsert: true,
        cacheControl: "3600",
      });
      uploadError = adminUpload.error;
    }

    if (uploadError) {
      console.error("[AVATAR UPLOAD] Storage error:", uploadError.message);
      return NextResponse.json(
        { error: "Failed to upload avatar to storage." },
        { status: 500 }
      );
    }

    // 7. Resolve public URL + cache-busting query token so browsers, CDNs, and Lanyard texture cache update immediately
    const { data: publicUrlData } = storageClient.getPublicUrl(storagePath);
    const basePublicUrl = publicUrlData?.publicUrl ?? null;

    if (!basePublicUrl) {
      return NextResponse.json(
        { error: "Failed to resolve public URL for uploaded avatar." },
        { status: 500 }
      );
    }

    const versionedAvatarUrl = `${basePublicUrl}${basePublicUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;

    // 8. Persist ONLY `avatar_url` in `public.profiles`
    const { error: profileError } = await persistAvatarUrl(
      user.id,
      versionedAvatarUrl,
      supabase
    );

    if (profileError) {
      console.error("[AVATAR PROFILE UPDATE]", profileError);
      // Roll back uploaded object to avoid dangling untracked files
      await storageClient.remove([storagePath]).catch(() => {});
      return NextResponse.json(
        { error: "Failed to save profile picture reference. Ensure database migration 015 is applied." },
        { status: 500 }
      );
    }

    return NextResponse.json({ avatarUrl: versionedAvatarUrl }, { status: 200 });
  } catch (err: any) {
    console.error("[AVATAR POST]", err?.message);
    return NextResponse.json(
      { error: "An unexpected error occurred during upload." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json(
      { error: "Cross-origin request rejected." },
      { status: 403 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Storage is not configured." },
      { status: 503 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paths = (["jpg", "png", "webp"] as const).map(
      (ext) => `${user.id}/avatar.${ext}`
    );

    const { error: removeError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove(paths);

    if (removeError && isSupabaseAdminConfigured()) {
      await createAdminClient()
        .storage.from(AVATAR_BUCKET)
        .remove(paths)
        .catch(() => {});
    }

    const { error: profileError } = await persistAvatarUrl(user.id, null, supabase);
    if (profileError) {
      console.error("[AVATAR DELETE PROFILE UPDATE]", profileError);
      return NextResponse.json(
        { error: "Failed to clear profile picture reference." },
        { status: 500 }
      );
    }

    return NextResponse.json({ avatarUrl: null }, { status: 200 });
  } catch (err: any) {
    console.error("[AVATAR DELETE]", err?.message);
    return NextResponse.json(
      { error: "Failed to remove avatar." },
      { status: 500 }
    );
  }
}
