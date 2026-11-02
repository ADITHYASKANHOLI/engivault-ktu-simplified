import { NextRequest, NextResponse } from "next/server";
import { getWorksActivityBySlug } from "@/lib/queries";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { safeFetchImage, verifyImageMagicBytes } from "@/lib/security/ssrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FLYER_BYTES = 5 * 1024 * 1024; // 5MB strict limit
const MAX_BASE64_CHARS = 7 * 1024 * 1024; // ~5MB raw payload

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Public Server-Side Route for Published FOLE WORKS Activity Flyers.
 * 
 * Security Assertions:
 * - Resolves the activity by validated slug.
 * - Confirms the activity is strictly published and not soft-deleted.
 * - Enforces strict 5MB byte limits on Base64 data URLs, Supabase Storage downloads, and remote downloads.
 * - Strictly validates binary magic bytes (PNG, JPEG, WebP) on all sources before serving.
 * - Never returns unvalidated file content using trusted image MIME headers.
 * - Enforces robust SSRF protection, DNS pinning, and domain allowlisting on remote targets.
 * - Returns 404 for draft, archived, unvalidated, or non-existent activities.
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
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    };

    // Case 1: Base64 data URL (e.g. local development or fallback simulation)
    if (coverImage.startsWith("data:image/")) {
      if (coverImage.length > MAX_BASE64_CHARS) {
        return NextResponse.json({ error: "Embedded image payload exceeds 5MB size limit." }, { status: 400 });
      }

      const match = coverImage.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const buffer = Buffer.from(match[2], "base64");
        if (buffer.length > MAX_FLYER_BYTES) {
          return NextResponse.json({ error: "Embedded image payload exceeds 5MB size limit." }, { status: 400 });
        }

        const magicCheck = verifyImageMagicBytes(buffer);
        if (!magicCheck.valid) {
          return NextResponse.json({ error: "Embedded image failed binary verification: Not a valid raster image." }, { status: 400 });
        }

        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            ...cacheHeaders,
            "Content-Type": magicCheck.contentType,
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
          if (arrayBuffer.byteLength > MAX_FLYER_BYTES) {
            return NextResponse.json({ error: "Storage flyer exceeds maximum allowed size of 5MB." }, { status: 400 });
          }

          const buffer = Buffer.from(arrayBuffer);
          const magicCheck = verifyImageMagicBytes(buffer);
          if (!magicCheck.valid) {
            return NextResponse.json({ error: "Storage object failed image binary verification." }, { status: 400 });
          }

          return new NextResponse(new Uint8Array(buffer), {
            headers: {
              ...cacheHeaders,
              "Content-Type": magicCheck.contentType,
              "Content-Length": buffer.length.toString(),
            },
          });
        }
      }
    }

    // Case 3: Public absolute HTTP/HTTPS URL (SSRF protected with DNS pinning and stream byte cap)
    if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
      try {
        const { buffer, contentType } = await safeFetchImage(coverImage, {
          maxSizeBytes: MAX_FLYER_BYTES,
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
          { error: "Remote flyer image could not be safely retrieved." },
          { status: 404 }
        );
      }
    }

    // Case 4: Storage path relative to engivault-thumbnails bucket
    if (isSupabaseConfigured()) {
      if (coverImage.includes("..") || coverImage.startsWith("/")) {
        return NextResponse.json({ error: "Invalid flyer storage path." }, { status: 400 });
      }

      const supabase = createAdminClient();
      const { data, error } = await supabase.storage
        .from("engivault-thumbnails")
        .download(coverImage);

      if (error || !data) {
        console.warn(`[FOLE WORKS] Supabase storage download error for path ${coverImage}:`, error);
        return NextResponse.json({ error: "Storage object not found." }, { status: 404 });
      }

      const arrayBuffer = await data.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_FLYER_BYTES) {
        return NextResponse.json({ error: "Storage flyer exceeds maximum allowed size of 5MB." }, { status: 400 });
      }

      const buffer = Buffer.from(arrayBuffer);
      const magicCheck = verifyImageMagicBytes(buffer);
      if (!magicCheck.valid) {
        return NextResponse.json({ error: "Storage object failed image binary verification." }, { status: 400 });
      }

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          ...cacheHeaders,
          "Content-Type": magicCheck.contentType,
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    return NextResponse.json({ error: "Flyer storage unavailable" }, { status: 404 });
  } catch (error: any) {
    console.error("[FOLE WORKS] Flyer route exception:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving activity flyer." },
      { status: 500 }
    );
  }
}
