export const MAX_FLYER_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FLYER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedFlyerMime = (typeof ALLOWED_FLYER_MIME_TYPES)[number];

export interface FlyerValidationResult {
  valid: boolean;
  error?: string;
  mime?: AllowedFlyerMime;
  width?: number;
  height?: number;
  bytes?: number;
}

/**
 * Validates a buffer's magic bytes to guarantee genuine raster image format (JPEG, PNG, WebP)
 * Strictly rejects SVGs, scripts, HTML, and executables.
 */
export function validateFlyerMagicBytes(buffer: Buffer): FlyerValidationResult {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: "File buffer is too small to be a valid image." };
  }

  if (buffer.length > MAX_FLYER_SIZE_BYTES) {
    return { valid: false, error: "Flyer file exceeds maximum 10MB limit." };
  }

  // 1. JPEG check: Starts with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    const dims = parseJpegDimensions(buffer);
    return {
      valid: true,
      mime: "image/jpeg",
      bytes: buffer.length,
      width: dims?.width,
      height: dims?.height,
    };
  }

  // 2. PNG check: Starts with 89 50 4E 47 0D 0A 1A 0A
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
    const dims = parsePngDimensions(buffer);
    return {
      valid: true,
      mime: "image/png",
      bytes: buffer.length,
      width: dims?.width,
      height: dims?.height,
    };
  }

  // 3. WebP check: RIFF....WEBP
  if (
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    const dims = parseWebpDimensions(buffer);
    return {
      valid: true,
      mime: "image/webp",
      bytes: buffer.length,
      width: dims?.width,
      height: dims?.height,
    };
  }

  return {
    valid: false,
    error: "Invalid image format. Only genuine PNG, JPEG, and WebP raster images are accepted.",
  };
}

/**
 * Extracts width and height from PNG IHDR chunk (bytes 16-23)
 */
export function parsePngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width > 0 && height > 0) {
    return { width, height };
  }
  return null;
}

/**
 * Extracts width and height from JPEG Start Of Frame markers (SOF0, SOF2, etc.)
 */
export function parseJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  const len = buffer.length;

  while (offset < len) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = buffer[offset + 1];

    // SOF markers: SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2), SOF3 (0xC3),
    // SOF5 (0xC5), SOF6 (0xC6), SOF7 (0xC7), SOF9 (0xC9), SOF10 (0xCA), SOF11 (0xCB)
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb)
    ) {
      if (offset + 8 < len) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        if (width > 0 && height > 0) {
          return { width, height };
        }
      }
      return null;
    }

    // Skip SOS (Start of Scan) or EOI
    if (marker === 0xda || marker === 0xd9) {
      break;
    }

    if (offset + 3 < len) {
      const segmentLength = buffer.readUInt16BE(offset + 2);
      offset += 2 + segmentLength;
    } else {
      break;
    }
  }

  return null;
}

/**
 * Extracts width and height from WebP headers (VP8, VP8L, VP8X)
 */
export function parseWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30) return null;

  const format = buffer.toString("ascii", 12, 16);

  // VP8 lossy
  if (format === "VP8 ") {
    if (buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
      const width = buffer.readUInt16LE(26) & 0x3fff;
      const height = buffer.readUInt16LE(28) & 0x3fff;
      return { width, height };
    }
  }

  // VP8L lossless
  if (format === "VP8L") {
    if (buffer[20] === 0x2f) {
      const b0 = buffer[21];
      const b1 = buffer[22];
      const b2 = buffer[23];
      const b3 = buffer[24];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      return { width, height };
    }
  }

  // VP8X extended
  if (format === "VP8X") {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height };
  }

  return null;
}
