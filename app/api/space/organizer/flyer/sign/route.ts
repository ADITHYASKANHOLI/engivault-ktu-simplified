import { NextRequest, NextResponse } from "next/server";
import { isSafeOrigin } from "@/lib/security/origin";
import { getAuthenticatedStudent, isVerifiedOrganizer } from "@/lib/space/permissions";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FLYER_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const student = await getAuthenticatedStudent();
  if (!student) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const isOrganizer = await isVerifiedOrganizer(student.id);
  if (!isOrganizer) {
    return NextResponse.json({ error: "Organizer access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { filename, file_size, mime_type, event_id } = body;

    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Filename is required." }, { status: 400 });
    }

    if (!file_size || typeof file_size !== "number" || file_size > MAX_FLYER_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 10MB maximum limit (${file_size} bytes provided).` },
        { status: 400 }
      );
    }

    const cleanMime = (mime_type || "").toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.includes(cleanMime)) {
      return NextResponse.json(
        { error: "Invalid flyer format. Only PNG, JPEG, and WebP raster images are allowed." },
        { status: 400 }
      );
    }

    // Reject SVG files explicitly (XSS prevention)
    if (filename.toLowerCase().endsWith(".svg") || cleanMime.includes("svg")) {
      return NextResponse.json(
        { error: "Vector SVG images are not allowed for flyers. Please upload PNG, JPEG, or WebP." },
        { status: 400 }
      );
    }

    const safeFilename = filename.toLowerCase().replace(/[^a-z0-9.-]/g, "_");
    const uniqueId = crypto.randomUUID();
    const folder = event_id ? `events/${event_id}` : `drafts/${student.id}`;
    const storagePath = `${folder}/${uniqueId}-${safeFilename}`;

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase storage is not configured." },
        { status: 503 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("fole-space-flyers")
      .createSignedUploadUrl(storagePath);

    if (error || !data?.signedUrl) {
      console.error("Storage signed upload error for flyer:", error);
      return NextResponse.json(
        { error: "Failed to generate secure upload URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      storagePath,
    });
  } catch (error: any) {
    console.error("Flyer sign error:", error);
    return NextResponse.json({ error: "Failed to authorize flyer upload." }, { status: 500 });
  }
}
