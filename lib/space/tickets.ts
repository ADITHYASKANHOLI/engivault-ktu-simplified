import { randomBytes } from "node:crypto";
import QRCode from "qrcode";

export const QR_PAYLOAD_PREFIX = "FS1.";

/**
 * Generates a cryptographically strong, unguessable 128-bit ticket code
 */
export function generateTicketCode(): string {
  return randomBytes(16).toString("base64url");
}

/**
 * Encodes the ticket code into the canonical FOLE SPACE QR payload: FS1.<ticket_code>
 */
export function encodeTicketQrPayload(ticketCode: string): string {
  const clean = ticketCode.trim();
  return `${QR_PAYLOAD_PREFIX}${clean}`;
}

/**
 * Parses a scanned QR payload or raw ticket code, extracting the sanitized ticket code
 */
export function decodeTicketQrPayload(rawInput: string): string | null {
  if (!rawInput || typeof rawInput !== "string") return null;
  const trimmed = rawInput.trim();

  if (trimmed.startsWith(QR_PAYLOAD_PREFIX)) {
    const code = trimmed.slice(QR_PAYLOAD_PREFIX.length).trim();
    return code.length >= 10 ? code : null;
  }

  // Also support entering the raw ticket code manually
  if (/^[a-zA-Z0-9_-]{10,64}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Generates a clean, scalable SVG string of the QR code for vector rendering
 */
export async function generateQrSvg(ticketCode: string): Promise<string> {
  const payload = encodeTicketQrPayload(ticketCode);
  return QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: {
      dark: "#0f172a", // Slate-900
      light: "#ffffff",
    },
  });
}

/**
 * Generates a high-resolution PNG Data URL for downloading the ticket image
 */
export async function generateQrDataUrl(ticketCode: string): Promise<string> {
  const payload = encodeTicketQrPayload(ticketCode);
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 600,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}
