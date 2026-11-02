import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { isSafeOrigin } from "@/lib/security/origin";
import { uploadAuthorizeSchema } from "@/lib/validation/schemas";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/queries";
import {
  validateImageBytes,
  validateMaterialBytes,
  validateVideoBytes,
} from "@/lib/security/magic-bytes";

const ALLOWED_BUCKETS = [
  "engivault-videos",
  "engivault-materials",
  "engivault-thumbnails",
  "engivault-branding",
] as const;

export const runtime = "nodejs";

function sanitizePathComponent(val: string | null | undefined): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.includes("/") || trimmed.includes("\\")) {
    return null;
  }
  if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function sanitizeFolder(folder: string | null | undefined): string | null {
  if (!folder) return null;
  const trimmed = folder.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.includes("\\") || trimmed.startsWith("/")) {
    return null;
  }
  if (!/^[a-zA-Z0-9_\-]+(\/[a-zA-Z0-9_\-]+)*$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  // 1. Direct Multipart Form-Data File Upload (Server-side to Supabase Storage)
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const rawBucket = (formData.get("bucket") as string) || "engivault-videos";
      const rawSubjectId = (formData.get("subject_id") as string) || "";
      const rawModuleId = (formData.get("module_id") as string) || "";
      const rawLessonId = (formData.get("lesson_id") as string) || "";
      const rawFolder = (formData.get("folder") as string) || "";

      if (!file) {
        return NextResponse.json({ error: "No file provided for upload" }, { status: 400 });
      }

      if (!ALLOWED_BUCKETS.includes(rawBucket as any)) {
        return NextResponse.json({ error: `Invalid target bucket: ${rawBucket}` }, { status: 400 });
      }
      const bucket = rawBucket as (typeof ALLOWED_BUCKETS)[number];

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Binary Magic Bytes Validation & Size Constraints
      if (bucket === "engivault-videos") {
        if (file.size > 5368709120) {
          return NextResponse.json({ error: "File exceeds 5GB maximum upload limit." }, { status: 400 });
        }
        const check = validateVideoBytes(buffer);
        if (!check.valid) {
          return NextResponse.json({ error: check.error || "Invalid video format." }, { status: 400 });
        }
      } else if (bucket === "engivault-materials") {
        if (file.size > 104857600) {
          return NextResponse.json({ error: "File exceeds 100MB maximum upload limit for study materials." }, { status: 400 });
        }
        const check = validateMaterialBytes(buffer, file.name);
        if (!check.valid) {
          return NextResponse.json({ error: check.error || "Invalid document format." }, { status: 400 });
        }
      } else if (bucket === "engivault-thumbnails" || bucket === "engivault-branding") {
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: "Image file exceeds 10MB maximum upload limit." }, { status: 400 });
        }
        const mime = file.type?.toLowerCase() || "";
        const allowedImageMimes = ["image/jpeg", "image/png", "image/webp"];
        if (mime && !allowedImageMimes.includes(mime)) {
          return NextResponse.json({ error: "Invalid image format. Allowed: image/jpeg, image/png, image/webp" }, { status: 400 });
        }
        const check = validateImageBytes(buffer);
        if (!check.valid) {
          return NextResponse.json({ error: check.error || "Invalid image format." }, { status: 400 });
        }
      }

      // Path Sanitization & Traversal Prevention
      const safeFolder = sanitizeFolder(rawFolder);
      const safeSubjectId = sanitizePathComponent(rawSubjectId) || "general";
      const safeModuleId = sanitizePathComponent(rawModuleId) || "general";
      const safeLessonId = sanitizePathComponent(rawLessonId) || "general";

      const basename = (file.name || "unnamed").split(/[/\\]/).pop() || "unnamed";
      const safeFilename = basename.toLowerCase().replace(/[^a-z0-9.-]/g, "_");
      const uniquePrefix = crypto.randomUUID();
      const basePath = safeFolder || (bucket === "engivault-thumbnails" ? "works-flyers" : `${safeSubjectId}/${safeModuleId}/${safeLessonId}`);
      const storagePath = `${basePath}/${uniquePrefix}-${safeFilename}`;

      if (isSupabaseConfigured()) {
        const supabase = createAdminClient();

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, buffer, {
            contentType: file.type || (bucket === "engivault-videos" ? "video/mp4" : "application/octet-stream"),
            upsert: true,
          });

        if (uploadError) {
          console.error("Supabase Storage upload error:", uploadError);
          return NextResponse.json(
            { error: `Storage upload failed: ${uploadError.message}` },
            { status: 500 }
          );
        }

        await logActivity("File Uploaded to Storage", "storage", {
          bucket,
          storagePath,
          filename: file.name,
          size: file.size,
        });

        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);

        return NextResponse.json({
          success: true,
          storagePath,
          publicUrl: publicUrlData?.publicUrl || storagePath,
          bucket,
          filename: file.name,
          size: file.size,
          mimeType: file.type || (bucket === "engivault-videos" ? "video/mp4" : "application/octet-stream"),
        });
      }

      if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
        return NextResponse.json(
          { error: "Supabase Storage credentials are required in production." },
          { status: 503 }
        );
      }

      // Local fallback simulation mode
      await logActivity("File Upload Simulated (Fallback)", "upload", {
        bucket,
        filename: file.name,
        storagePath,
        size: file.size,
      });

      let publicUrl = storagePath;
      if (bucket === "engivault-thumbnails" || bucket === "engivault-branding") {
        const base64 = buffer.toString("base64");
        publicUrl = `data:${file.type || "image/png"};base64,${base64}`;
      }

      return NextResponse.json({
        success: true,
        storagePath,
        publicUrl,
        bucket,
        filename: file.name,
        size: file.size,
        mode: "local-simulation",
      });
    } catch (error: any) {
      console.error("Multipart upload error:", error);
      return NextResponse.json(
        { error: error?.message || "File upload failed" },
        { status: 500 }
      );
    }
  }

  // 2. JSON-based Signed Upload URL generation or Post-Upload Verification
  try {
    const body = await request.json();

    // Staging / Post-upload verification path
    if (body?.action === "verify" || body?.action === "finalize") {
      const targetBucket = body.bucket as string;
      const storagePath = (body.storage_path || body.storagePath) as string;
      const originalFilename = body.filename || body.original_filename || "";

      if (!targetBucket || !ALLOWED_BUCKETS.includes(targetBucket as any)) {
        return NextResponse.json({ error: "Invalid storage bucket specified." }, { status: 400 });
      }

      if (!storagePath || storagePath.includes("..") || storagePath.startsWith("/") || storagePath.includes("\\")) {
        return NextResponse.json({ error: "Invalid storage path." }, { status: 400 });
      }

      if (isSupabaseConfigured()) {
        const supabase = createAdminClient();
        const { data: fileBlob, error: downloadError } = await supabase.storage
          .from(targetBucket)
          .download(storagePath);

        if (downloadError || !fileBlob) {
          return NextResponse.json({ error: "Storage object not found for verification." }, { status: 404 });
        }

        const arrayBuffer = await fileBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let validationCheck: { valid: boolean; error?: string } = { valid: false };

        if (targetBucket === "engivault-materials") {
          if (buffer.length > 104857600) {
            await supabase.storage.from(targetBucket).remove([storagePath]);
            return NextResponse.json({ error: "File exceeds 100MB limit for study materials." }, { status: 400 });
          }
          validationCheck = validateMaterialBytes(buffer, originalFilename);
        } else if (targetBucket === "engivault-thumbnails" || targetBucket === "engivault-branding") {
          if (buffer.length > 10 * 1024 * 1024) {
            await supabase.storage.from(targetBucket).remove([storagePath]);
            return NextResponse.json({ error: "Image exceeds 10MB limit." }, { status: 400 });
          }
          validationCheck = validateImageBytes(buffer);
        } else if (targetBucket === "engivault-videos") {
          if (buffer.length > 5368709120) {
            await supabase.storage.from(targetBucket).remove([storagePath]);
            return NextResponse.json({ error: "Video exceeds 5GB limit." }, { status: 400 });
          }
          validationCheck = validateVideoBytes(buffer);
        }

        if (!validationCheck.valid) {
          // Immediately purge invalid / malicious file
          await supabase.storage.from(targetBucket).remove([storagePath]);
          return NextResponse.json(
            { error: validationCheck.error || "Uploaded file failed binary validation." },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          verified: true,
          bucket: targetBucket,
          storagePath,
        });
      }

      // Offline / fallback verification
      return NextResponse.json({
        success: true,
        verified: true,
        bucket: targetBucket,
        storagePath,
        mode: "local-simulation",
      });
    }

    const result = uploadAuthorizeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const { bucket, filename, file_size, subject_id, module_id, lesson_id, mime_type } = result.data;

    // Validate size and MIME rules per bucket
    if (bucket === "engivault-videos") {
      const mime = (mime_type || "").toLowerCase();
      const name = filename.toLowerCase();
      const isValidVideo =
        mime.startsWith("video/") ||
        name.endsWith(".mp4") ||
        name.endsWith(".webm") ||
        name.endsWith(".mov") ||
        name.endsWith(".mkv");

      if (!isValidVideo) {
        return NextResponse.json(
          { error: "Invalid video format. Supported formats: MP4, WebM, QuickTime (.mov), MKV." },
          { status: 400 }
        );
      }

      if (file_size > 5368709120) {
        return NextResponse.json({ error: "File exceeds 5GB maximum upload limit." }, { status: 400 });
      }
    }

    if (bucket === "engivault-materials") {
      const mime = (mime_type || "").toLowerCase();
      const name = filename.toLowerCase();
      const isValidDoc =
        mime.includes("pdf") ||
        mime.includes("document") ||
        mime.includes("presentation") ||
        mime.includes("text") ||
        mime.includes("msword") ||
        mime.includes("zip") ||
        name.endsWith(".pdf") ||
        name.endsWith(".doc") ||
        name.endsWith(".docx") ||
        name.endsWith(".ppt") ||
        name.endsWith(".pptx") ||
        name.endsWith(".txt") ||
        name.endsWith(".zip");

      if (!isValidDoc) {
        return NextResponse.json(
          { error: "Invalid document format. Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP." },
          { status: 400 }
        );
      }

      if (file_size > 104857600) {
        return NextResponse.json({ error: "File exceeds 100MB maximum upload limit for study materials." }, { status: 400 });
      }
    }

    if (bucket === "engivault-thumbnails" || bucket === "engivault-branding") {
      const mime = (mime_type || "").toLowerCase();
      const name = filename.toLowerCase();
      const isValidImg =
        mime.startsWith("image/") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".png") ||
        name.endsWith(".webp");

      if (!isValidImg || name.endsWith(".svg") || mime.includes("svg")) {
        return NextResponse.json(
          { error: "Invalid image format. Only raster images (JPEG, PNG, WebP) are permitted." },
          { status: 400 }
        );
      }

      if (file_size > 10485760) {
        return NextResponse.json({ error: "Image file exceeds 10MB maximum upload limit." }, { status: 400 });
      }
    }

    const safeFolder = sanitizeFolder(result.data.folder);
    const safeSubjectId = sanitizePathComponent(subject_id) || "general";
    const safeModuleId = sanitizePathComponent(module_id) || "general";
    const safeLessonId = sanitizePathComponent(lesson_id) || "general";

    const basename = filename.split(/[/\\]/).pop() || "unnamed";
    const safeFilename = basename.toLowerCase().replace(/[^a-z0-9.-]/g, "_");
    const uniquePrefix = crypto.randomUUID();
    const basePath = safeFolder || (bucket === "engivault-thumbnails" ? "works-flyers" : `${safeSubjectId}/${safeModuleId}/${safeLessonId}`);
    const storagePath = `${basePath}/${uniquePrefix}-${safeFilename}`;

    if (!isSupabaseConfigured()) {
      if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
        return NextResponse.json(
          { error: "Supabase Storage credentials are required in production." },
          { status: 503 }
        );
      }

      await logActivity("File Upload Authorized (Fallback)", "upload", {
        bucket,
        filename,
        storagePath,
        file_size,
      });

      return NextResponse.json({
        uploadUrl: null,
        storagePath,
        bucket,
        mode: "local-simulation",
        message: "Upload target ready",
      });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(storagePath);

    if (error || !data?.signedUrl) {
      console.error("Storage signed upload error:", error);
      return NextResponse.json(
        { error: "Failed to generate storage upload URL" },
        { status: 500 }
      );
    }

    await logActivity("Storage Upload Target Generated", "storage", {
      bucket,
      storagePath,
      filename,
    });

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      storagePath,
      token: data.token,
      bucket,
      mode: "supabase-direct",
    });
  } catch (error) {
    console.error("Upload authorize error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let bucket = searchParams.get("bucket");
    let path = searchParams.get("path") || searchParams.get("storagePath");

    if (!bucket || !path) {
      try {
        const body = await request.json();
        bucket = bucket || body.bucket;
        path = path || body.path || body.storagePath;
      } catch {
        // body may not be JSON
      }
    }

    if (!bucket || !path) {
      return NextResponse.json({ error: "Bucket and path are required" }, { status: 400 });
    }

    // Validate bucket allowlist
    if (!ALLOWED_BUCKETS.includes(bucket as any)) {
      return NextResponse.json({ error: "Invalid target bucket." }, { status: 400 });
    }

    // Prevent path traversal
    if (path.includes("..") || path.startsWith("/") || path.includes("\\")) {
      return NextResponse.json({ error: "Invalid storage path." }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) {
        console.warn("Storage delete notice:", error);
      }
    }

    await logActivity("Storage File Removed", "storage", { bucket, path });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Storage delete error:", error);
    return NextResponse.json({ error: error?.message || "Storage delete failed" }, { status: 500 });
  }
}
