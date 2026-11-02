/**
 * File Magic Byte Inspection & Validation Utility.
 * 
 * Inspects file binary signatures (magic bytes) to verify genuine file types,
 * preventing MIME-spoofing, polyglot files, and executable script uploads.
 */

export interface MagicByteValidationResult {
  valid: boolean;
  detectedType?: string;
  error?: string;
}

/**
 * Validates magic bytes for image uploads (JPEG, PNG, WebP).
 * Explicitly rejects SVGs and non-raster images.
 */
export function validateImageBytes(buffer: Buffer): MagicByteValidationResult {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: "File buffer is too small to be a valid image." };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedType: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedType: "image/png" };
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedType: "image/webp" };
  }

  return {
    valid: false,
    error: "Invalid image binary header. Only genuine PNG, JPEG, and WebP raster images are allowed.",
  };
}

/**
 * Validates magic bytes for academic document uploads (PDF, Office, ZIP, Text).
 */
export function validateMaterialBytes(buffer: Buffer, originalFilename?: string): MagicByteValidationResult {
  if (!buffer || buffer.length < 4) {
    return { valid: false, error: "File buffer is too small to be a valid document." };
  }

  // PDF: %PDF- (0x25, 0x50, 0x44, 0x46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { valid: true, detectedType: "application/pdf" };
  }

  // ZIP / DOCX / PPTX / XLSX: PK.. (0x50, 0x4B, 0x03/0x05/0x07, 0x04/0x06/0x08)
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)
  ) {
    return { valid: true, detectedType: "application/zip" };
  }

  // Legacy Compound File Binary (DOC, PPT, XLS): D0 CF 11 E0 A1 B1 1A E1
  if (
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  ) {
    return { valid: true, detectedType: "application/msword" };
  }

  // Plain Text (TXT): Must contain printable ASCII/UTF-8 and no binary null bytes
  if (originalFilename && originalFilename.toLowerCase().endsWith(".txt")) {
    const sampleLength = Math.min(buffer.length, 1024);
    let hasNull = false;
    for (let i = 0; i < sampleLength; i++) {
      if (buffer[i] === 0) {
        hasNull = true;
        break;
      }
    }
    if (!hasNull) {
      return { valid: true, detectedType: "text/plain" };
    }
  }

  return {
    valid: false,
    error: "Invalid document format. Only verified PDF, DOCX, PPTX, ZIP, and TXT files are permitted.",
  };
}

/**
 * Validates magic bytes for video uploads (MP4, WebM, MKV, QuickTime).
 */
export function validateVideoBytes(buffer: Buffer): MagicByteValidationResult {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: "File buffer is too small to be a valid video." };
  }

  // ISO Base Media File Format (MP4, MOV): ftyp box at offset 4
  const ftyp = buffer.slice(4, 8).toString("ascii");
  if (ftyp === "ftyp" || ftyp === "moov") {
    return { valid: true, detectedType: "video/mp4" };
  }

  // Matroska / WebM: EBML Header (0x1A, 0x45, 0xDF, 0xA3)
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { valid: true, detectedType: "video/webm" };
  }

  return {
    valid: false,
    error: "Invalid video binary header. Supported video formats: MP4, WebM, QuickTime (.mov), MKV.",
  };
}
