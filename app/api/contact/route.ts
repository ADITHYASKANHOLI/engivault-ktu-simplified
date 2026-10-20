import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sendContactEmail } from "@/lib/email";

export const runtime = "nodejs";

const MAX_PAYLOAD_BYTES = 50 * 1024; // 50 KB

/**
 * Extracts a reliable client IP from standard proxy and CDN headers.
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "127.0.0.1";
}

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce payload size limits before body consumption
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload too large. Please shorten your message." },
        { status: 413 }
      );
    }

    // 2. Enforce IP-based rate limiting (5 submissions per 10 minutes)
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      windowMs: 10 * 60 * 1000,
      max: 5,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a few minutes before submitting another message.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetInSeconds),
          },
        }
      );
    }

    // 3. Parse JSON body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    // 4. Validate schema with Zod
    const parsed = contactFormSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const fieldName = issue.path[0];
        if (typeof fieldName === "string" && !fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      return NextResponse.json(
        {
          error: "Validation failed. Please correct the highlighted fields.",
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message, hp_company } = parsed.data;

    // 5. Spam honeypot detection
    if (hp_company && hp_company.trim().length > 0) {
      // Return 400 for honeypot bot trap
      return NextResponse.json(
        { error: "Spam submission detected." },
        { status: 400 }
      );
    }

    // 6. Forward submission to FOLE CEV email
    const emailResult = await sendContactEmail({
      name,
      email,
      subject,
      message,
      submittedAt: new Date().toISOString(),
      clientIp,
    });

    if (!emailResult.success) {
      // Safe generic failure response without exposing internal secrets
      return NextResponse.json(
        {
          error: "We could not send your message right now. Please try again later.",
        },
        { status: 503 }
      );
    }

    // 7. Successful delivery confirmation
    return NextResponse.json(
      {
        success: true,
        message: "Thank you for contacting FOLE CEV. Your message has been submitted successfully.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[CONTACT API] Unexpected handler error:", error?.message || error);
    return NextResponse.json(
      {
        error: "We could not send your message right now. Please try again later.",
      },
      { status: 500 }
    );
  }
}
