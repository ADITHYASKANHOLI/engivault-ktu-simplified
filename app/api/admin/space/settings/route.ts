import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { isSafeOrigin } from "@/lib/security/origin";
import { spaceService } from "@/lib/space/service";
import { spaceSettingsSchema } from "@/lib/space/validation";
import {
  isMissingSpaceSchemaError,
  FOLE_SPACE_SETUP_REQUIRED_MESSAGE,
  FOLE_SPACE_NOT_CONFIGURED_CODE,
} from "@/lib/space/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await spaceService.getSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    if (isMissingSpaceSchemaError(error) || error?.code === FOLE_SPACE_NOT_CONFIGURED_CODE) {
      return NextResponse.json(
        { error: FOLE_SPACE_SETUP_REQUIRED_MESSAGE, code: FOLE_SPACE_NOT_CONFIGURED_CODE, configured: false },
        { status: 503 }
      );
    }
    console.error("Admin space settings GET error:", error);
    return NextResponse.json({ error: "Failed to load space settings." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = spaceSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await spaceService.updateSettings(parsed.data);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    if (isMissingSpaceSchemaError(error) || error?.code === FOLE_SPACE_NOT_CONFIGURED_CODE) {
      return NextResponse.json(
        { error: FOLE_SPACE_SETUP_REQUIRED_MESSAGE, code: FOLE_SPACE_NOT_CONFIGURED_CODE, configured: false },
        { status: 503 }
      );
    }
    console.error("Admin space settings update error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update settings." }, { status: 500 });
  }
}
