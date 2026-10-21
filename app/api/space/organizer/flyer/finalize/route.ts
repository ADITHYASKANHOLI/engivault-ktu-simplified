import { NextRequest, NextResponse } from "next/server";
import { isSafeOrigin } from "@/lib/security/origin";
import { getAuthenticatedStudent, isVerifiedOrganizer } from "@/lib/space/permissions";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { spaceService } from "@/lib/space/service";
import { validateFlyerBuffer } from "@/lib/space/flyer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const { storage_path, event_id } = body;

    if (!storage_path || typeof storage_path !== "string") {
      return NextResponse.json({ error: "Storage path is required." }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase storage is not configured." },
        { status: 503 }
      );
    }

    const supabase = createAdminClient();

    // Download the uploaded file bytes to verify header & dimensions
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("fole-space-flyers")
      .download(storage_path);

    if (downloadError || !fileBlob) {
      console.error("Storage download error during flyer finalization:", downloadError);
      return NextResponse.json(
        { error: "Uploaded flyer not found in storage." },
        { status: 400 }
      );
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate magic bytes and extract natural dimensions
    const validation = validateFlyerBuffer(buffer);
    if (!validation.isValid) {
      // Remove invalid file from storage
      await supabase.storage.from("fole-space-flyers").remove([storage_path]);
      return NextResponse.json(
        { error: validation.error || "Invalid image file format." },
        { status: 400 }
      );
    }

    const flyerData = {
      flyer_path: storage_path,
      flyer_mime: validation.mimeType!,
      flyer_width: validation.width,
      flyer_height: validation.height,
      flyer_bytes: validation.bytes,
    };

    // If an event_id was provided, update the event record and clean up any old flyer
    if (event_id && typeof event_id === "string") {
      const existingEvent = await spaceService.getEventById(event_id);
      if (existingEvent && existingEvent.organizer_id === student.id) {
        if (existingEvent.flyer_path && existingEvent.flyer_path !== storage_path) {
          // Clean up old flyer
          await supabase.storage.from("fole-space-flyers").remove([existingEvent.flyer_path]);
        }

        await spaceService.updateEvent(event_id, student.id, flyerData);
      }
    }

    return NextResponse.json({
      success: true,
      flyer: flyerData,
      message: "Flyer verified and preserved byte-for-byte in natural dimensions.",
    });
  } catch (error: any) {
    console.error("Flyer finalize error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to finalize flyer." },
      { status: 500 }
    );
  }
}
