import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublishedMaterialsForCatalog, getAllMaterials } from "@/lib/queries";
import { getAdminSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * Public and Authorized Download Handler for Study Materials.
 *
 * Security Assertions:
 * - Sanitizes search parameters to prevent path traversal attempts.
 * - For non-admin requests, validates the complete academic publication hierarchy:
 *   material.published -> lesson.published -> module.published -> subject.published.
 * - Authenticated admins (with valid session tokens) may preview unpublished materials.
 * - Soft-deleted assets (deleted_at is not null) are strictly rejected with 403.
 * - Generates time-bounded signed download URLs (30 minutes expiry).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path")?.trim();
  const id = searchParams.get("id")?.trim();

  if (!path && !id) {
    return NextResponse.json({ error: "Missing material path or id" }, { status: 400 });
  }

  // Prevent path traversal attempts
  if (path && (path.includes("..") || path.startsWith("/") || path.includes("\\"))) {
    return NextResponse.json({ error: "Invalid material storage path" }, { status: 400 });
  }

  const adminSession = await getAdminSession();
  const isAdmin = !!adminSession;

  // 1. Production / Supabase Connected Mode
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      let query = supabase.from("materials").select(`
        id,
        storage_path,
        published,
        deleted_at,
        original_filename,
        lesson_id,
        lessons (
          id,
          published,
          deleted_at,
          modules (
            id,
            published,
            deleted_at,
            subjects (
              id,
              published,
              deleted_at
            )
          )
        )
      `);

      if (id) {
        query = query.eq("id", id);
      } else if (path) {
        query = query.eq("storage_path", path);
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        return NextResponse.json({ error: "Study material not found" }, { status: 404 });
      }

      // Authorization & Publication Hierarchy Verification
      if (!isAdmin) {
        if (!data.published || data.deleted_at !== null) {
          return NextResponse.json(
            { error: "This study material is not publicly available" },
            { status: 403 }
          );
        }

        const rawLesson = (data as any).lessons;
        if (rawLesson) {
          if (!rawLesson.published || rawLesson.deleted_at !== null) {
            return NextResponse.json(
              { error: "This study material is not publicly available" },
              { status: 403 }
            );
          }

          const rawModule = rawLesson.modules;
          if (rawModule) {
            if (!rawModule.published || rawModule.deleted_at !== null) {
              return NextResponse.json(
                { error: "This study material is not publicly available" },
                { status: 403 }
              );
            }

            const rawSubject = rawModule.subjects;
            if (rawSubject) {
              if (!rawSubject.published || rawSubject.deleted_at !== null) {
                return NextResponse.json(
                  { error: "This study material is not publicly available" },
                  { status: 403 }
                );
              }
            }
          }
        }
      }

      // Generate signed URL with download flag
      const { data: signedData, error: signError } = await supabase.storage
        .from("engivault-materials")
        .createSignedUrl(data.storage_path, 60 * 30, {
          download: data.original_filename || true,
        });

      if (signError || !signedData?.signedUrl) {
        return NextResponse.json({ error: "Failed to generate download authorization" }, { status: 500 });
      }

      return NextResponse.redirect(signedData.signedUrl, 302);
    } catch (err) {
      console.error("[MATERIALS DOWNLOAD] Error:", err);
      return NextResponse.json({ error: "Internal download error" }, { status: 500 });
    }
  }

  // 2. Offline / Local Fallback Mode
  const publishedMaterials = await getPublishedMaterialsForCatalog();
  let matched = publishedMaterials.find(
    (m) => (id && m.id === id) || (path && m.storage_path === path)
  );

  // If not in published catalog, allow admin to access via all materials
  if (!matched && isAdmin) {
    const allMaterials = await getAllMaterials();
    matched = allMaterials.find(
      (m) => (id && m.id === id) || (path && m.storage_path === path)
    );
  }

  if (!matched) {
    return NextResponse.json({ error: "Study material not found" }, { status: 404 });
  }

  // In offline dev mode, return a dummy PDF text representation with proper PDF headers
  const samplePdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj
4 0 obj<</Length 51>>stream
BT /F1 14 Tf 50 700 Td (${matched.title}) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
0000000192 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
293
%%EOF`;

  return new NextResponse(samplePdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${matched.original_filename || "material.pdf"}"`,
    },
  });
}
