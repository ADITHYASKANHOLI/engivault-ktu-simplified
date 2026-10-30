/**
 * YouTube Utility Module for ENGIVAULT
 * Handles sanitization, validation, video ID extraction, embed URL generation,
 * and thumbnail retrieval strictly for allowed YouTube domains.
 */

const ALLOWED_YOUTUBE_DOMAINS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
];

// YouTube video IDs are 11-character base64url strings ([a-zA-Z0-9_-]{11})
const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts a YouTube Video ID from any common YouTube URL format:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - Handles query parameters (e.g. ?t=..., &feature=...)
 * - Handles leading and trailing accidental whitespace
 *
 * Returns null if the URL is invalid or from a non-YouTube domain.
 */
export function extractYouTubeVideoId(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    // Add protocol if missing for URL parsing
    const urlString = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();

    const isAllowedDomain = ALLOWED_YOUTUBE_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isAllowedDomain) {
      return null;
    }

    let rawId: string | null = null;

    if (hostname === "youtu.be" || hostname.endsWith(".youtu.be")) {
      // Path format: /VIDEO_ID
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        rawId = pathParts[0];
      }
    } else {
      // Hostname is youtube.com or subdomain
      if (parsed.pathname === "/watch") {
        rawId = parsed.searchParams.get("v");
      } else if (parsed.pathname.startsWith("/embed/")) {
        const parts = parsed.pathname.split("/embed/")[1]?.split("/");
        rawId = parts && parts.length > 0 ? parts[0] : null;
      } else if (parsed.pathname.startsWith("/shorts/")) {
        const parts = parsed.pathname.split("/shorts/")[1]?.split("/");
        rawId = parts && parts.length > 0 ? parts[0] : null;
      } else if (parsed.pathname.startsWith("/v/")) {
        const parts = parsed.pathname.split("/v/")[1]?.split("/");
        rawId = parts && parts.length > 0 ? parts[0] : null;
      } else if (parsed.pathname.startsWith("/live/")) {
        const parts = parsed.pathname.split("/live/")[1]?.split("/");
        rawId = parts && parts.length > 0 ? parts[0] : null;
      }
    }

    if (!rawId) {
      return null;
    }

    // Strip any trailing punctuation or hash if present
    const cleanId = rawId.split(/[?#&]/)[0];

    if (YOUTUBE_VIDEO_ID_REGEX.test(cleanId)) {
      return cleanId;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validates whether the given string is a valid YouTube video URL.
 */
export function isValidYouTubeUrl(input: string | null | undefined): boolean {
  return extractYouTubeVideoId(input) !== null;
}

/**
 * Constructs a safe canonical YouTube watch URL (https://www.youtube.com/watch?v=VIDEO_ID)
 * using a validated video ID or URL. Returns null for invalid or missing inputs.
 */
export function getYouTubeWatchUrl(videoIdOrUrl: string | null | undefined): string | null {
  if (!videoIdOrUrl) return null;
  const trimmed = String(videoIdOrUrl).trim();
  if (!trimmed) return null;

  const videoId = YOUTUBE_VIDEO_ID_REGEX.test(trimmed)
    ? trimmed
    : extractYouTubeVideoId(trimmed);

  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

/**
 * Constructs a safe YouTube embed URL using the validated video ID.
 * Never directly embeds raw arbitrary user URLs into iframes.
 */
export function getYouTubeEmbedUrl(videoIdOrUrl: string): string {
  const videoId = YOUTUBE_VIDEO_ID_REGEX.test(videoIdOrUrl)
    ? videoIdOrUrl
    : extractYouTubeVideoId(videoIdOrUrl);

  if (!videoId) {
    return "";
  }

  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
}

export type YouTubeThumbnailQuality =
  | "default"
  | "hqdefault"
  | "mqdefault"
  | "sddefault"
  | "maxresdefault";

/**
 * Constructs the YouTube thumbnail URL for a given video ID or URL.
 * Defaults to "hqdefault", supports "default", "mqdefault", "sddefault", "maxresdefault".
 */
export function getYouTubeThumbnailUrl(
  videoIdOrUrl: string,
  quality: YouTubeThumbnailQuality = "hqdefault"
): string {
  const videoId = YOUTUBE_VIDEO_ID_REGEX.test(videoIdOrUrl)
    ? videoIdOrUrl
    : extractYouTubeVideoId(videoIdOrUrl);

  if (!videoId) {
    return "";
  }

  return `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/${quality}.jpg`;
}

export interface YouTubeParseResult {
  isValid: boolean;
  videoId: string | null;
  canonicalUrl: string | null;
}

/**
 * Parses, validates, and normalizes a candidate YouTube URL.
 * Protects against malformed URLs, arbitrary iframe injection, unsupported hosts,
 * empty IDs, and XSS attempts.
 */
export function parseYouTubeUrl(input: string | null | undefined): YouTubeParseResult {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) {
    return {
      isValid: false,
      videoId: null,
      canonicalUrl: null,
    };
  }

  return {
    isValid: true,
    videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

