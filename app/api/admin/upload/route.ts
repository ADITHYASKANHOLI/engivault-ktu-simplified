import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { uploadAuthorizeSchema } from "@/lib/validation/schemas";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = uploadAuthorizeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const { bucket, filename, mime_type, file_size, subject_id, module_id, lesson_id } = result.data;

    // Sanitize filename and generate collision-resistant storage path
    const safeFilename = filename.toLowerCase().replace(/[^a-z0-9.-]/g, "_");
    const uniquePrefix = crypto.randomUUID();
    const storagePath = `${subject_id || "general"}/${module_id || "general"}/${lesson_id || "general"}/${uniquePrefix}-${safeFilename}`;

    if (!isSupabaseConfigured()) {
      // Local fallback mode: simulate instant upload authorization
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

    // Live Supabase: generate signed upload URL
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
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
