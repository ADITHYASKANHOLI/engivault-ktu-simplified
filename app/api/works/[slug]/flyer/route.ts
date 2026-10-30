import { NextRequest, NextResponse } from "next/server";
import { getWorksActivityBySlug } from "@/lib/queries";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Public Server-Side Route for Published FOLE WORKS Activity Flyers.
 * 
 * - Resolves the activity by validated slug.
 * - Confirms the activity is strictly published and not soft-deleted.
 * - Serves original image bytes with correct Content-Type and CDN cache headers.
 * - Provides a reliable, permanent URL for Open Graph crawlers and social share cards.
 * - Returns 404 for draft, archived, or non-existent activities.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Activity slug is required" }, { status: 400 });
    }

    // Retrieve activity record (unauthenticated public read path)
    const activity = await getWorksActivityBySlug(slug.trim(), false);

    // Verify activity exists, is published, and not soft-deleted
    if (!activity || activity.status !== "published" || activity.deleted_at) {
      return NextResponse.json(
        { error: "Activity flyer not available or activity is not published" },
        { status: 404 }
      );
    }

    const coverImage = activity.cover_image?.trim();
    if (!coverImage) {
      return NextResponse.json(
        { error: "No flyer image configured for this activity" },
        { status: 404 }
      );
    }

    const cacheHeaders = {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    };

    // Case 1: Base64 data URL (e.g. local development or fallback simulation)
    if (coverImage.startsWith("data:image/")) {
      const match = coverImage.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const buffer = Buffer.from(match[2], "base64");
        return new NextResponse(buffer, {
          headers: {
            ...cacheHeaders,
            "Content-Type": mimeType,
            "Content-Length": buffer.length.toString(),
          },
        });
      }
    }

    // Case 2: Public absolute HTTP/HTTPS URL (e.g. Supabase Storage public URL or CDN)
    if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
      try {
        const imgRes = await fetch(coverImage, {
          headers: {
            "User-Agent": "FOLE-Web-Flyer-Proxy/1.0",
          },
        });

        if (!imgRes.ok) {
          console.warn(`[FOLE WORKS] Remote flyer fetch returned status ${imgRes.status} for slug: ${slug}`);
          return NextResponse.json({ error: "Remote flyer not accessible" }, { status: 404 });
        }

        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
          headers: {
            ...cacheHeaders,
            "Content-Type": contentType,
            "Content-Length": buffer.length.toString(),
          },
        });
      } catch (fetchErr) {
        console.error(`[FOLE WORKS] Failed to fetch remote flyer for slug: ${slug}`, fetchErr);
        return NextResponse.json({ error: "Failed to stream flyer" }, { status: 502 });
      }
    }

    // Case 3: Storage path relative to engivault-thumbnails bucket
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.storage
        .from("engivault-thumbnails")
        .download(coverImage);

      if (error || !data) {
        console.warn(`[FOLE WORKS] Supabase storage download error for path ${coverImage}:`, error);
        return NextResponse.json({ error: "Storage object not found" }, { status: 404 });
      }

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = data.type || "image/jpeg";

      return new NextResponse(buffer, {
        headers: {
          ...cacheHeaders,
          "Content-Type": mimeType,
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    return NextResponse.json({ error: "Flyer storage unavailable" }, { status: 404 });
  } catch (error: any) {
    console.error("[FOLE WORKS] Flyer route exception:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving activity flyer" },
      { status: 500 }
    );
  }
}
