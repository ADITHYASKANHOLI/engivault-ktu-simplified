import { Resend } from "resend";

export const OFFICIAL_FOLE_EMAIL = "folecev@gmail.com";
export const DEFAULT_FROM_EMAIL = "FOLE Web <onboarding@resend.dev>";

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt?: string;
  clientIp?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipient?: string;
  from?: string;
  replyTo?: string;
  subject?: string;
}

// Type for mock dispatcher in unit tests
type EmailSenderFn = (payload: {
  from: string;
  to: string[];
  replyTo: string;
  subject: string;
  text: string;
  html: string;
}) => Promise<{ id?: string; error?: { message: string } }>;

let mockSender: EmailSenderFn | null = null;

export function setMockEmailSender(fn: EmailSenderFn | null): void {
  mockSender = fn;
}

/**
 * Escapes HTML characters to prevent HTML/script injection inside email viewers.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Strips carriage returns and newlines to prevent email header injection attacks (CRLF injection).
 */
export function sanitizeHeader(str: string): string {
  return str.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Formats canonical contact email subject line.
 * Pattern: [FOLE Web Contact] — [Student's Subject]
 */
export function formatContactEmailSubject(studentSubject: string): string {
  const cleanSubject = sanitizeHeader(studentSubject);
  return `[FOLE Web Contact] — ${cleanSubject}`;
}

/**
 * Generates plain-text fallback content for email clients.
 */
export function buildContactEmailText(data: ContactSubmission): string {
  const dateStr = data.submittedAt || new Date().toISOString();
  return [
    "============================================================",
    "  FOLE WEB — NEW CONTACT US INQUIRY",
    "============================================================",
    "",
    "Source: FOLE Web Contact Us Form (Official Platform Submission)",
    `Submitted At: ${dateStr}`,
    "",
    "--- SENDER INFORMATION ---",
    `Full Name: ${sanitizeHeader(data.name)}`,
    `Email: ${sanitizeHeader(data.email)}`,
    `Subject: ${sanitizeHeader(data.subject)}`,
    "",
    "--- MESSAGE ---",
    data.message,
    "",
    "============================================================",
    "REPLY DIRECTLY: Simply hit Reply in your email client to reach",
    `the sender directly at: ${sanitizeHeader(data.email)}`,
    "============================================================",
  ].join("\n");
}

/**
 * Generates modern, responsive HTML email matching FOLE's dark & emerald aesthetic.
 */
export function buildContactEmailHtml(data: ContactSubmission): string {
  const dateStr = data.submittedAt || new Date().toISOString();
  const safeName = escapeHtml(sanitizeHeader(data.name));
  const safeEmail = escapeHtml(sanitizeHeader(data.email));
  const safeSubject = escapeHtml(sanitizeHeader(data.subject));
  const safeMessage = escapeHtml(data.message).replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Us Inquiry — FOLE Web</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #050C18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; margin: 0 auto; background-color: #0B172B; border-radius: 16px; border: 1px solid #1E2E48; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <!-- Brand Header -->
    <tr>
      <td style="padding: 28px 24px; background: linear-gradient(135deg, #07111F 0%, #0F2344 100%); border-bottom: 2px solid #10B981;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="font-size: 22px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.2;">
                FOLE <span style="color: #10B981;">WEB</span>
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; font-family: monospace;">
                Academic Digital Vault • Contact Us Form
              </div>
            </td>
            <td align="right">
              <span style="display: inline-block; padding: 4px 10px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #10B981; font-family: monospace;">
                NEW INQUIRY
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 28px 24px;">
        <!-- Metadata Summary Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #07111F; border: 1px solid #1E2E48; border-radius: 12px; margin-bottom: 24px; padding: 18px 20px;">
          <tr>
            <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; width: 110px; font-family: monospace;">Sender</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #F8FAFC;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; font-family: monospace;">Email</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #10B981;">
              <a href="mailto:${safeEmail}" style="color: #10B981; text-decoration: none;">${safeEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; font-family: monospace;">Subject</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #E2E8F0;">${safeSubject}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; font-family: monospace;">Received</td>
            <td style="padding: 6px 0; font-size: 12px; color: #94A3B8; font-family: monospace;">${dateStr}</td>
          </tr>
        </table>

        <!-- Message Block -->
        <div style="margin-bottom: 10px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #10B981; font-family: monospace;">
          Student Message
        </div>
        <div style="background-color: #07111F; border: 1px solid #1E2E48; border-left: 4px solid #10B981; border-radius: 8px; padding: 20px; font-size: 14px; line-height: 1.7; color: #E2E8F0; white-space: pre-wrap;">
${safeMessage}
        </div>

        <!-- Reply Notice Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; background-color: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 14px 16px;">
          <tr>
            <td style="font-size: 13px; line-height: 1.5; color: #A7F3D0;">
              <strong>Direct Reply:</strong> Click <em>Reply</em> in your email client to respond directly to <strong>${safeEmail}</strong> (configured via Reply-To header).
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 16px 24px; background-color: #050B14; border-top: 1px solid #1E2E48; text-align: center; font-size: 11px; color: #64748B;">
        Delivered to official inbox (${OFFICIAL_FOLE_EMAIL}) • FOLE Web Academic Vault
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends a validated contact form submission to FOLE CEV (folecev@gmail.com).
 * Uses Resend SDK or active mock transporter for testing.
 */
export async function sendContactEmail(submission: ContactSubmission): Promise<SendEmailResult> {
  const recipientEmail = (process.env.CONTACT_EMAIL_TO || OFFICIAL_FOLE_EMAIL).trim();
  const fromEmail = (process.env.CONTACT_EMAIL_FROM || DEFAULT_FROM_EMAIL).trim();
  const apiKey = process.env.RESEND_API_KEY;

  const subject = formatContactEmailSubject(submission.subject);
  const text = buildContactEmailText(submission);
  const html = buildContactEmailHtml(submission);
  const replyTo = sanitizeHeader(submission.email);

  // If a mock sender is active (e.g. during automated test suite), use it
  if (mockSender) {
    try {
      const result = await mockSender({
        from: fromEmail,
        to: [recipientEmail],
        replyTo,
        subject,
        text,
        html,
      });
      if (result.error) {
        return {
          success: false,
          error: result.error.message,
          recipient: recipientEmail,
        };
      }
      return {
        success: true,
        messageId: result.id || "mock-msg-id-12345",
        recipient: recipientEmail,
        from: fromEmail,
        replyTo,
        subject,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Mock email provider failure",
      };
    }
  }

  // Production / Real Resend Delivery
  if (!apiKey) {
    console.error(
      "[FOLE EMAIL] RESEND_API_KEY is not configured in environment variables. Email cannot be dispatched."
    );
    return {
      success: false,
      error: "EMAIL_SERVICE_UNCONFIGURED",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      replyTo,
      subject,
      text,
      html,
    });

    if (error) {
      console.error("[FOLE EMAIL] Resend delivery returned error:", error.name, error.message);
      return {
        success: false,
        error: error.message || "Email provider error",
      };
    }

    return {
      success: true,
      messageId: data?.id,
      recipient: recipientEmail,
      from: fromEmail,
      replyTo,
      subject,
    };
  } catch (err: any) {
    console.error("[FOLE EMAIL] Unexpected email dispatch failure:", err?.message || err);
    return {
      success: false,
      error: "Unexpected delivery failure",
    };
  }
}
