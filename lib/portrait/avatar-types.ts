/**
 * Shared Type Definitions for Multi-Asset Student Lanyard Avatars
 */

export type AvatarProcessingStatus =
  | "none"
  | "processed"
  | "fallback"
  | "legacy";

export interface AvatarAssetsPayload {
  /** Primary URL passed to the Lanyard card front (cardUrl ?? processedUrl ?? originalUrl) */
  avatarUrl: string | null;
  /** Original unmodified uploaded user photo */
  originalUrl: string | null;
  /** Isolated transparent monochrome portrait PNG */
  processedUrl: string | null;
  /** Composed 1024x1440 white ID card front PNG */
  cardUrl: string | null;
  /** Processing outcome status */
  processingStatus: AvatarProcessingStatus;
}

