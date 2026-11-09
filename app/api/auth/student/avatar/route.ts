/**
 * Student Profile Avatar & Isolated Portrait API Route
 *
 * GET    /api/auth/student/avatar                 — Retrieve current user's avatar asset URLs
 * GET    /api/auth/student/avatar?asset=original  — Same-origin authenticated stream of user's own stored original photo (prevents canvas CORS tainting on reprocess)
 * POST   /api/auth/student/avatar                 — Upload original, isolated portrait PNG, and composed ID card front PNG
 * DELETE /api/auth/student/avatar                 — Remove all avatar assets and reset profile card
 *
 * Security model:
 *  - Authenticated strictly via Supabase JWT (`supabase.auth.getUser()`).
 *  - CSRF origin validation on all mutating requests (`isSafeOrigin`).
 *  - DB-backed per-user rate limiting.
 *  - Storage paths strictly scoped under: engivault-avatars/<userId>/...
 *  - Magic-byte inspection rejects spoofed/non-raster payloads.
 *  - Supports separate staged original + derived uploads so requests stay comfortably below Vercel's 4.5 MB ceiling.
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
import type {
  AvatarAssetsPayload,
  AvatarProcessingStatus,
} from "@/lib/portrait/avatar-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AVATAR_BUCKET = "engivault-avatars";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per stored object
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

function isMissing016SchemaError(message?: string | null): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("avatar_original_url") ||
    m.includes("avatar_processed_url") ||
    m.includes("avatar_card_url") ||
    m.includes("avatar_processing_status") ||
    m.includes("update_own_avatar_assets") ||
    m.includes("schema cache")
  );
}

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

function emptyPayload(): AvatarAssetsPayload {
  return {
    avatarUrl: null,
    originalUrl: null,
    processedUrl: null,
    cardUrl: null,
    processingStatus: "none",
  };
}

async function readProfileAssets(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AvatarAssetsPayload> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "avatar_url, avatar_original_url, avatar_processed_url, avatar_card_url, avatar_processing_status"
    )
    .eq("id", userId)
    .maybeSingle();

  if (!error) {
    const avatarUrl = data?.avatar_card_url ?? data?.avatar_url ?? null;
    const originalUrl = data?.avatar_original_url ?? null;
    const processedUrl = data?.avatar_processed_url ?? null;
    const cardUrl = data?.avatar_card_url ?? avatarUrl;
    const processingStatus = normalizeStatus(
      data?.avatar_processing_status ?? (avatarUrl ? "legacy" : "none")
    );
    return {
      avatarUrl,
      originalUrl,
      processedUrl,
      cardUrl,
      processingStatus,
    };
  }

  // Graceful fallback to pre-016 schema (migration 015 only has avatar_url)
  const { data: legacy, error: legacyErr } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (legacyErr) {
    return emptyPayload();
  }

  const url = legacy?.avatar_url ?? null;
  return {
    avatarUrl: url,
    originalUrl: null,
    processedUrl: null,
    cardUrl: url,
    processingStatus: url ? "legacy" : "none",
  };
}

async function persistAvatarAssets(
  userId: string,
  assets: AvatarAssetsPayload,
  ssrSupabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ error: string | null }> {
  const now = new Date().toISOString();

  if (isSupabaseAdminConfigured()) {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({
        avatar_url: assets.avatarUrl,
        avatar_original_url: assets.originalUrl,
        avatar_processed_url: assets.processedUrl,
        avatar_card_url: assets.cardUrl,
        avatar_processing_status: assets.processingStatus,
        avatar_updated_at:
          assets.avatarUrl || assets.originalUrl ? now : null,
        updated_at: now,
      })
      .eq("id", userId);

    if (!error) return { error: null };

    // Fallback cleanly if migration 016 columns aren't deployed yet
    if (isMissing016SchemaError(error.message)) {
      const { error: legacyErr } = await admin
        .from("profiles")
        .update({
          avatar_url: assets.avatarUrl,
          updated_at: now,
        })
        .eq("id", userId);
      return { error: legacyErr?.message ?? null };
    }

    return { error: error.message };
  }

  const { error } = await ssrSupabase.rpc("update_own_avatar_assets", {
    p_avatar_url: assets.avatarUrl,
    p_avatar_original_url: assets.originalUrl,
    p_avatar_processed_url: assets.processedUrl,
    p_avatar_card_url: assets.cardUrl,
    p_processing_status: assets.processingStatus,
  });

  if (!error) return { error: null };

  if (isMissing016SchemaError(error.message)) {
    const { error: legacyRpcErr } = await ssrSupabase.rpc("update_own_avatar_url", {
      p_avatar_url: assets.avatarUrl,
    });
    return { error: legacyRpcErr?.message ?? null };
  }

  return { error: error.message };
}

async function validateUploadFile(
  file: FormDataEntryValue | null,
  options: { pngOnly?: boolean; label: string }
): Promise<
  | { ok: true; buffer: Buffer; mime: string; ext: string }
  | { ok: false; status: number; error: string }
> {
  if (!file || !(file instanceof File)) {
    return { ok: false, status: 400, error: `Missing ${options.label} file.` };
  }
  if (file.size <= 0) {
    return { ok: false, status: 400, error: `Uploaded ${options.label} file is empty.` };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `${options.label} exceeds 5 MB maximum limit.`,
    };
  }

  const declaredMime = (file.type || "").toLowerCase();
  if (!ALLOWED_DECLARED_MIME.has(declaredMime)) {
    return {
      ok: false,
      status: 415,
      error: `Unsupported ${options.label} format. Please upload a JPG, PNG, or WebP image.`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_SIZE_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `${options.label} exceeds 5 MB maximum limit.`,
    };
  }

  const magicCheck = validateImageBytes(buffer);
  if (!magicCheck.valid || !magicCheck.detectedType) {
    return {
      ok: false,
      status: 415,
      error:
        magicCheck.error ||
        `Invalid binary signature for ${options.label}. Only JPG, PNG, and WebP images are allowed.`,
    };
  }

  if (options.pngOnly && magicCheck.detectedType !== "image/png") {
    return {
      ok: false,
      status: 415,
      error: `${options.label} must be a valid PNG image.`,
    };
  }

  const ext = EXT_MAP[magicCheck.detectedType] ?? "png";
  return { ok: true, buffer, mime: magicCheck.detectedType, ext };
}

async function uploadToBucket(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<{ publicUrl: string | null; error: string | null }> {
  const storageClient = supabase.storage.from(AVATAR_BUCKET);

  let { error: uploadError } = await storageClient.upload(path, buffer, {
    contentType,
    upsert: true,
    cacheControl: "3600",
  });

  if (uploadError && isSupabaseAdminConfigured()) {
    const admin = createAdminClient();
    const adminStorage = admin.storage.from(AVATAR_BUCKET);
    const retry = await adminStorage.upload(path, buffer, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });
    uploadError = retry.error;
  }

  if (uploadError) {
    return { publicUrl: null, error: uploadError.message };
  }

  const { data: publicUrlData } = storageClient.getPublicUrl(path);
  const publicUrl = publicUrlData?.publicUrl ?? null;
  if (!publicUrl) {
    return { publicUrl: null, error: "Could not resolve public URL." };
  }

  return { publicUrl, error: null };
}

async function removeFromBucket(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[]
) {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove(paths);
  if (error && isSupabaseAdminConfigured()) {
    await createAdminClient()
      .storage.from(AVATAR_BUCKET)
      .remove(paths)
      .catch(() => {});
  }
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(emptyPayload(), { status: 200 });
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

    // Authenticated same-origin proxy of the caller's own stored original photo
    // for zero-CORS canvas reprocessing without re-selecting a file.
    if (request.nextUrl.searchParams.get("asset") === "original") {
      const storageClient = supabase.storage.from(AVATAR_BUCKET);
      const adminStorage = isSupabaseAdminConfigured()
        ? createAdminClient().storage.from(AVATAR_BUCKET)
        : null;

      for (const candidate of [
        { ext: "jpg", mime: "image/jpeg" },
        { ext: "png", mime: "image/png" },
        { ext: "webp", mime: "image/webp" },
      ]) {
        const objectPath = `${user.id}/original.${candidate.ext}`;
        let download = await storageClient.download(objectPath);
        if ((download.error || !download.data) && adminStorage) {
          download = await adminStorage.download(objectPath);
        }
        if (!download.error && download.data) {
          const bytes = Buffer.from(await download.data.arrayBuffer());
          return new NextResponse(bytes, {
            status: 200,
            headers: {
              "Content-Type": candidate.mime,
              "Cache-Control": "private, no-store",
              "X-Content-Type-Options": "nosniff",
            },
          });
        }
      }

      return NextResponse.json(
        { error: "Stored original photograph was not found." },
        { status: 404 }
      );
    }

    const payload = await readProfileAssets(user.id, supabase);
    return NextResponse.json(payload, { status: 200 });
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
      { windowSeconds: 15 * 60, maxAttempts: 25 }
    );
    if (!rateLimit.allowed) {
      return rateLimitResponse(
        "Too many avatar upload attempts. Please wait a few minutes.",
        rateLimit.resetInSeconds
      );
    }

    const formData = await request.formData();
    const assetRole = String(formData.get("assetRole") || "bundle");
    const useExistingOriginal = formData.get("useExistingOriginal") === "1";
    const requestedStatus =
      formData.get("processingStatus") === "fallback" ? "fallback" : "processed";

    const currentAssets = await readProfileAssets(user.id, supabase);
    const versionToken = Date.now();
    const appendVersion = (url: string) =>
      `${url}${url.includes("?") ? "&" : "?"}v=${versionToken}`;

    let nextOriginalUrl = currentAssets.originalUrl;
    let nextProcessedUrl = currentAssets.processedUrl;
    let nextCardUrl = currentAssets.cardUrl;
    let nextStatus: AvatarProcessingStatus = requestedStatus;
    const uploadedPathsForRollback: string[] = [];

    // Stage/handle original uploaded photo if supplied
    const rawOriginal = formData.get("file");
    if (rawOriginal instanceof File) {
      const checkedOriginal = await validateUploadFile(rawOriginal, {
        label: "original portrait",
      });
      if (!checkedOriginal.ok) {
        return NextResponse.json(
          { error: checkedOriginal.error },
          { status: checkedOriginal.status }
        );
      }

      const origPath = `${user.id}/original.${checkedOriginal.ext}`;
      const staleOriginalPaths = (["jpg", "png", "webp"] as const)
        .filter((ext) => ext !== checkedOriginal.ext)
        .map((ext) => `${user.id}/original.${ext}`);
      await removeFromBucket(supabase, staleOriginalPaths);

      const upOrig = await uploadToBucket(
        supabase,
        origPath,
        checkedOriginal.buffer,
        checkedOriginal.mime
      );
      if (upOrig.error || !upOrig.publicUrl) {
        console.error("[AVATAR UPLOAD original]", upOrig.error);
        return NextResponse.json(
          { error: "Failed to upload original portrait to storage." },
          { status: 500 }
        );
      }
      uploadedPathsForRollback.push(origPath);
      nextOriginalUrl = appendVersion(upOrig.publicUrl);

      // If this request strictly stages the large original image before derived PNGs,
      // save originalUrl and return early (prevents exceeding Vercel 4.5 MB limit).
      if (assetRole === "original") {
        const partialPayload: AvatarAssetsPayload = {
          avatarUrl: currentAssets.avatarUrl ?? nextOriginalUrl,
          originalUrl: nextOriginalUrl,
          processedUrl: currentAssets.processedUrl,
          cardUrl: currentAssets.cardUrl,
          processingStatus: currentAssets.processingStatus,
        };
        const { error: stageErr } = await persistAvatarAssets(
          user.id,
          partialPayload,
          supabase
        );
        if (stageErr) {
          await removeFromBucket(supabase, uploadedPathsForRollback);
          return NextResponse.json(
            { error: "Failed to save original portrait metadata." },
            { status: 500 }
          );
        }
        return NextResponse.json(partialPayload, { status: 200 });
      }
    } else if (!useExistingOriginal) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    } else if (!nextOriginalUrl) {
      // Allow finding existing original object if legacy/016 columns lagged behind storage
      const storageClient = supabase.storage.from(AVATAR_BUCKET);
      const { data: listed } = await storageClient.list(user.id, { limit: 10 });
      const existingOrig = listed?.find((item) =>
        item.name.startsWith("original.")
      );
      if (existingOrig) {
        const { data: pub } = storageClient.getPublicUrl(
          `${user.id}/${existingOrig.name}`
        );
        if (pub?.publicUrl) {
          nextOriginalUrl = appendVersion(pub.publicUrl);
        }
      }
      if (!nextOriginalUrl) {
        return NextResponse.json(
          { error: "Original photograph was not found. Please upload a photo again." },
          { status: 400 }
        );
      }
    }

    // Handle processed transparent monochrome portrait (isolated mode)
    const rawProcessed = formData.get("processedFile");
    if (requestedStatus === "processed" && rawProcessed instanceof File) {
      const checkedProcessed = await validateUploadFile(rawProcessed, {
        pngOnly: true,
        label: "processed portrait",
      });
      if (!checkedProcessed.ok) {
        await removeFromBucket(supabase, uploadedPathsForRollback);
        return NextResponse.json(
          { error: checkedProcessed.error },
          { status: checkedProcessed.status }
        );
      }

      const processedPath = `${user.id}/portrait.png`;
      const upProc = await uploadToBucket(
        supabase,
        processedPath,
        checkedProcessed.buffer,
        "image/png"
      );
      if (upProc.error || !upProc.publicUrl) {
        await removeFromBucket(supabase, uploadedPathsForRollback);
        return NextResponse.json(
          { error: "Failed to upload processed portrait." },
          { status: 500 }
        );
      }
      uploadedPathsForRollback.push(processedPath);
      nextProcessedUrl = appendVersion(upProc.publicUrl);
    } else if (requestedStatus === "fallback") {
      // Clear stale isolated portrait if falling back cleanly to original cropped view
      await removeFromBucket(supabase, [`${user.id}/portrait.png`]);
      nextProcessedUrl = null;
      nextStatus = "fallback";
    }

    // Handle composed ID card front image (1024x1440 PNG)
    const rawCard = formData.get("cardFile");
    if (rawCard instanceof File) {
      const checkedCard = await validateUploadFile(rawCard, {
        pngOnly: true,
        label: "ID card composition",
      });
      if (!checkedCard.ok) {
        await removeFromBucket(supabase, uploadedPathsForRollback);
        return NextResponse.json(
          { error: checkedCard.error },
          { status: checkedCard.status }
        );
      }

      const cardPath = `${user.id}/card-front.png`;
      const upCard = await uploadToBucket(
        supabase,
        cardPath,
        checkedCard.buffer,
        "image/png"
      );
      if (upCard.error || !upCard.publicUrl) {
        await removeFromBucket(supabase, uploadedPathsForRollback);
        return NextResponse.json(
          { error: "Failed to upload composed ID card front." },
          { status: 500 }
        );
      }
      uploadedPathsForRollback.push(cardPath);
      nextCardUrl = appendVersion(upCard.publicUrl);
    } else if (!nextCardUrl) {
      nextCardUrl = nextProcessedUrl ?? nextOriginalUrl;
    }

    // Legacy `avatar_url` always points to the active card front so single-field consumers stay consistent
    const canonicalAvatarUrl =
      nextCardUrl ?? nextProcessedUrl ?? nextOriginalUrl;

    const finalPayload: AvatarAssetsPayload = {
      avatarUrl: canonicalAvatarUrl,
      originalUrl: nextOriginalUrl,
      processedUrl: nextProcessedUrl,
      cardUrl: nextCardUrl,
      processingStatus: nextStatus,
    };

    const { error: profileError } = await persistAvatarAssets(
      user.id,
      finalPayload,
      supabase
    );

    if (profileError) {
      console.error("[AVATAR PROFILE UPDATE]", profileError);
      await removeFromBucket(supabase, uploadedPathsForRollback);
      return NextResponse.json(
        {
          error:
            "Failed to save profile picture reference. Ensure database migrations 015 and 016 are applied.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(finalPayload, { status: 200 });
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

    const paths = [
      `${user.id}/original.jpg`,
      `${user.id}/original.png`,
      `${user.id}/original.webp`,
      `${user.id}/portrait.png`,
      `${user.id}/card-front.png`,
      `${user.id}/avatar.jpg`,
      `${user.id}/avatar.png`,
      `${user.id}/avatar.webp`,
    ];

    await removeFromBucket(supabase, paths);

    const cleared = emptyPayload();
    const { error: profileError } = await persistAvatarAssets(
      user.id,
      cleared,
      supabase
    );

    if (profileError) {
      console.error("[AVATAR DELETE PROFILE UPDATE]", profileError);
      return NextResponse.json(
        { error: "Failed to clear profile picture reference." },
        { status: 500 }
      );
    }

    return NextResponse.json(cleared, { status: 200 });
  } catch (err: any) {
    console.error("[AVATAR DELETE]", err?.message);
    return NextResponse.json(
      { error: "Failed to remove avatar." },
      { status: 500 }
    );
  }
}
