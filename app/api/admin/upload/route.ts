import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { uploadAuthorizeSchema } from "@/lib/validation/schemas";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/queries";

const ALLOWED_BUCKETS = [
  "engivault-videos",
  "engivault-materials",
  "engivault-thumbnails",
  "engivault-branding",
] as const;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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
      const bucket = (formData.get("bucket") as string) || "engivault-videos";
      const subject_id = (formData.get("subject_id") as string) || "";
      const module_id = (formData.get("module_id") as string) || "";
      const lesson_id = (formData.get("lesson_id") as string) || "";
      const folder = (formData.get("folder") as string) || "";

      if (!file) {
        return NextResponse.json({ error: "No file provided for upload" }, { status: 400 });
      }

      if (!ALLOWED_BUCKETS.includes(bucket as any)) {
        return NextResponse.json({ error: `Invalid target bucket: ${bucket}` }, { status: 400 });
      }

      // Validate video MIME types if target is engivault-videos
      if (bucket === "engivault-videos") {
        const mime = file.type?.toLowerCase() || "";
        const name = file.name.toLowerCase();
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

        if (file.size > 5368709120) {
          return NextResponse.json({ error: "File exceeds 5GB maximum upload limit." }, { status: 400 });
        }
      }

      // Validate material MIME types if target is engivault-materials
      if (bucket === "engivault-materials") {
        const mime = file.type?.toLowerCase() || "";
        const name = file.name.toLowerCase();
        const isValidDoc =
          mime.includes("pdf") ||
          mime.includes("document") ||
          mime.includes("presentation") ||
          mime.includes("text") ||
          mime.includes("msword") ||
          mime.includes("zip") ||
          mime.includes("octet-stream") ||
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

        if (file.size > 104857600) {
          return NextResponse.json({ error: "File exceeds 100MB maximum upload limit for study materials." }, { status: 400 });
        }
      }

      // Validate image MIME types if target is engivault-thumbnails or engivault-branding
      if (bucket === "engivault-thumbnails" || bucket === "engivault-branding") {
        const mime = file.type?.toLowerCase() || "";
        const name = file.name.toLowerCase();
        const isValidImg =
          mime.startsWith("image/") ||
          mime === "image/jpeg" ||
          mime === "image/png" ||
          mime === "image/webp" ||
          name.endsWith(".jpg") ||
          name.endsWith(".jpeg") ||
          name.endsWith(".png") ||
          name.endsWith(".webp") ||
          name.endsWith(".svg");

        if (!isValidImg) {
          return NextResponse.json(
            { error: "Invalid image format. Supported formats: JPEG, PNG, WebP." },
            { status: 400 }
          );
        }

        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: "Image file exceeds 10MB maximum upload limit." }, { status: 400 });
        }
      }

      // Sanitize filename and generate collision-resistant storage path
      const safeFilename = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "_");
      const uniquePrefix = crypto.randomUUID();
      const basePath = folder || (bucket === "engivault-thumbnails" ? "works-flyers" : `${subject_id || "general"}/${module_id || "general"}/${lesson_id || "general"}`);
      const storagePath = `${basePath}/${uniquePrefix}-${safeFilename}`;

      if (isSupabaseConfigured()) {
        const supabase = createAdminClient();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

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

      // Local fallback mode: simulate upload and provide base64 data URL for images so they preview immediately
      await logActivity("File Upload Simulated (Fallback)", "upload", {
        bucket,
        filename: file.name,
        storagePath,
        size: file.size,
      });

      let publicUrl = storagePath;
      if (bucket === "engivault-thumbnails" || bucket === "engivault-branding") {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
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

  // 2. JSON-based Signed Upload URL generation
  try {
    const body = await request.json();
    const result = uploadAuthorizeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const { bucket, filename, file_size, subject_id, module_id, lesson_id, mime_type } = result.data;

    // Validate video MIME types if target is engivault-videos
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

    // Validate material MIME types if target is engivault-materials
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
        mime.includes("octet-stream") ||
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

    // Validate thumbnail/flyer MIME types if target is engivault-thumbnails or engivault-branding
    if (bucket === "engivault-thumbnails" || bucket === "engivault-branding") {
      const mime = (mime_type || "").toLowerCase();
      const name = filename.toLowerCase();
      const isValidImg =
        mime.startsWith("image/") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".png") ||
        name.endsWith(".webp") ||
        name.endsWith(".svg");

      if (!isValidImg) {
        return NextResponse.json(
          { error: "Invalid image format. Supported formats: JPEG, PNG, WebP." },
          { status: 400 }
        );
      }

      if (file_size > 10485760) {
        return NextResponse.json({ error: "Image file exceeds 10MB maximum upload limit." }, { status: 400 });
      }
    }

    const safeFilename = filename.toLowerCase().replace(/[^a-z0-9.-]/g, "_");
    const uniquePrefix = crypto.randomUUID();
    const folder = result.data.folder || "";
    const basePath = folder || (bucket === "engivault-thumbnails" ? "works-flyers" : `${subject_id || "general"}/${module_id || "general"}/${lesson_id || "general"}`);
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
