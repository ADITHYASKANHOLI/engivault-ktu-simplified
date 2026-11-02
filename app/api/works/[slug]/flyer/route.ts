import { NextRequest, NextResponse } from "next/server";
import { getWorksActivityBySlug } from "@/lib/queries";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { safeFetchImage, verifyImageMagicBytes } from "@/lib/security/ssrf";

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
 * - Enforces robust SSRF protection, domain allowlisting, and magic-byte raster validation.
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
        const magicCheck = verifyImageMagicBytes(buffer);
        if (!magicCheck.valid) {
          return NextResponse.json({ error: "Invalid embedded image data format" }, { status: 400 });
        }
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            ...cacheHeaders,
            "Content-Type": magicCheck.contentType || mimeType,
            "Content-Length": buffer.length.toString(),
          },
        });
      }
    }

    // Case 2: Supabase Storage public URL — route directly to storage SDK rather than outbound HTTP fetch
    const supabaseStorageMarker = "/storage/v1/object/public/engivault-thumbnails/";
    if (coverImage.includes(supabaseStorageMarker) && isSupabaseConfigured()) {
      const relativePath = decodeURIComponent(coverImage.split(supabaseStorageMarker)[1] || "");
      if (relativePath && !relativePath.includes("..")) {
        const supabase = createAdminClient();
        const { data, error } = await supabase.storage
          .from("engivault-thumbnails")
          .download(relativePath);

        if (!error && data) {
          const arrayBuffer = await data.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const magicCheck = verifyImageMagicBytes(buffer);
          return new NextResponse(new Uint8Array(buffer), {
            headers: {
              ...cacheHeaders,
              "Content-Type": magicCheck.valid ? magicCheck.contentType : (data.type || "image/jpeg"),
              "Content-Length": buffer.length.toString(),
            },
          });
        }
      }
    }

    // Case 3: Public absolute HTTP/HTTPS URL (SSRF protected)
    if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
      try {
        const { buffer, contentType } = await safeFetchImage(coverImage, {
          maxSizeBytes: 5 * 1024 * 1024,
          timeoutMs: 5000,
          enforceDomainAllowlist: true,
        });

        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            ...cacheHeaders,
            "Content-Type": contentType,
            "Content-Length": buffer.length.toString(),
          },
        });
      } catch (fetchErr: any) {
        console.warn(`[FOLE WORKS] SSRF or image fetch blocked for slug '${slug}':`, fetchErr?.message);
        return NextResponse.json(
          { error: "Remote flyer image could not be safely retrieved" },
          { status: 404 }
        );
      }
    }

    // Case 4: Storage path relative to engivault-thumbnails bucket
    if (isSupabaseConfigured()) {
      if (coverImage.includes("..") || coverImage.startsWith("/")) {
        return NextResponse.json({ error: "Invalid flyer storage path" }, { status: 400 });
      }

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
      const magicCheck = verifyImageMagicBytes(buffer);

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          ...cacheHeaders,
          "Content-Type": magicCheck.valid ? magicCheck.contentType : (data.type || "image/jpeg"),
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
