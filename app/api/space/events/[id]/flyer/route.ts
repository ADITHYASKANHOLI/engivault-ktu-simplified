import { NextRequest, NextResponse } from "next/server";
import { spaceService } from "@/lib/space/service";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getAuthenticatedStudent } from "@/lib/space/permissions";
import { getAdminSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const slug = id;
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Event slug is required." }, { status: 400 });
    }

    const event = await spaceService.getEventBySlug(slug.trim(), false);
    if (!event || event.deleted_at) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // Access control: drafts/cancelled require owning organizer or space admin
    const isPublicStatus = ["published", "live", "completed"].includes(event.status);
    if (!isPublicStatus) {
      const adminSession = await getAdminSession();
      if (!adminSession) {
        const student = await getAuthenticatedStudent();
        if (!student || student.id !== event.organizer_id) {
          return NextResponse.json({ error: "Flyer is not publicly accessible." }, { status: 403 });
        }
      }
    }

    const flyerPath = event.flyer_path;
    if (!flyerPath) {
      return NextResponse.json({ error: "No flyer attached to this event." }, { status: 404 });
    }

    const mimeType = event.flyer_mime || "image/jpeg";
    const cacheHeaders = {
      "Content-Type": mimeType,
      "Cache-Control": isPublicStatus
        ? "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
        : "private, no-cache, no-store",
      "X-Content-Type-Options": "nosniff",
    };

    // If flyer is stored as a base64 data URL (e.g. mock or local testing)
    if (flyerPath.startsWith("data:image/")) {
      const match = flyerPath.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const detectedMime = match[1];
        const buffer = Buffer.from(match[2], "base64");
        return new NextResponse(buffer, {
          headers: {
            ...cacheHeaders,
            "Content-Type": detectedMime,
          },
        });
      }
    }

    // Download original bytes byte-for-byte from Supabase Storage
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase storage is not configured." },
        { status: 503 }
      );
    }

    const supabase = createAdminClient();
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("fole-space-flyers")
      .download(flyerPath);

    if (downloadError || !fileBlob) {
      console.error("Storage download error for flyer:", downloadError);
      return NextResponse.json(
        { error: "Unable to retrieve flyer file from storage." },
        { status: 404 }
      );
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: cacheHeaders,
    });
  } catch (error: any) {
    console.error("Flyer retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to load flyer." },
      { status: 500 }
    );
  }
}
