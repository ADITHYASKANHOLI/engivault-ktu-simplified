import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { isSafeOrigin } from "@/lib/security/origin";
import { reorderLessonsSchema } from "@/lib/validation/schemas";
import { reorderLessons } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/lessons/reorder
 *
 * Secure server-side endpoint for manual drag-and-drop video lecture reordering.
 *
 * Security Requirements:
 * - Strictly requires verified administrator authentication (engivault_admin_session).
 * - Enforces CSRF same-origin verification (isSafeOrigin).
 * - Validates submitted payload structure (min 1, max 500, UUID format).
 * - Rejects duplicate IDs in the reorder sequence.
 * - Enforces academic grouping: all reordered lessons must belong to the same module.
 * - Atomically persists normalized sequence (1, 2, 3... N) in the database.
 * - Triggers Next.js cache revalidation across public and admin routes.
 */
export async function POST(request: NextRequest) {
  // 1. CSRF same-origin verification
  if (!isSafeOrigin(request)) {
    return NextResponse.json(
      { error: "Cross-origin request rejected." },
      { status: 403 }
    );
  }

  // 2. Verified admin session check
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized: Administrator privileges required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // 3. Strict schema validation
    const validation = reorderLessonsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed: Invalid reorder request payload.",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { items, moduleId } = validation.data;

    // 4. Atomic database-backed reordering
    const result = await reorderLessons(items, {
      moduleId: moduleId || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully reordered ${result.count} video lectures.`,
      count: result.count,
      items: result.items,
    });
  } catch (error: any) {
    console.error("[REORDER_LESSONS_ERROR]", error?.message || error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to persist new video order.",
      },
      { status: 400 }
    );
  }
}

