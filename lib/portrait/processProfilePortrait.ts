/**
 * High-level Portrait Processing Orchestrator
 *
 * Executes the complete client-side pipeline:
 *  1. Optional heavy-photo normalization (keeps original payloads safe under serverless limits)
 *  2. Person foreground segmentation (MediaPipe Selfie Multiclass + Guided Matting)
 *  3. Natural monochrome charcoal/pencil-sketch stylization (transparent portrait.png)
 *  4. Dynamic ID card composition with FOLE mark + authenticated @username (card-front.png)
 *  5. Graceful cropped fallback when segmentation cannot isolate a clear person
 */

import {
  decodeImageSource,
  PortraitSegmentationError,
  segmentPrimaryPerson,
} from "./segmentPerson";
import { stylizeSegmentedPortrait } from "./stylizePortrait";
import {
  composeFallbackIdCard,
  composeIsolatedPortraitIdCard,
  type ComposedIdCard,
} from "./composeIdCard";

export type PortraitProcessResult =
  | {
      mode: "isolated";
      /** Isolated transparent monochrome portrait PNG blob */
      portraitBlob: Blob;
      portraitObjectUrl: string;
      /** Composed 1024x1440 white ID card front PNG */
      card: ComposedIdCard;
      durationMs: number;
    }
  | {
      mode: "fallback";
      portraitBlob: null;
      portraitObjectUrl: null;
      /** Clean cropped fallback ID card front PNG */
      card: ComposedIdCard;
      reason: string;
      errorCode: PortraitSegmentationError["code"] | "UNKNOWN";
      durationMs: number;
    };

/**
 * Ensures any huge (>3.6 MB) raw mobile photograph is also accompanied by a
 * serverless-safe original Blob while preserving images <= 3.6 MB byte-for-byte.
 */
export async function prepareOriginalUploadBlob(file: File): Promise<Blob> {
  const SAFE_RAW_BYTES = 3.6 * 1024 * 1024;
  if (file.size <= SAFE_RAW_BYTES) {
    return file;
  }

  const { canvas } = await decodeImageSource(file, 2200);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.size > 0) {
          resolve(blob);
        } else {
          reject(new Error("Could not normalize oversized photograph."));
        }
      },
      "image/jpeg",
      0.92
    );
  });
}

/**
 * Run full background removal, monochrome charcoal styling, and ID card composition.
 * Automatically falls back to a cleanly cropped ID card if segmentation fails.
 */
export async function processProfilePortrait(
  source: Blob | string,
  username: string
): Promise<PortraitProcessResult> {
  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

  try {
    const segmented = await segmentPrimaryPerson(source);
    const stylized = await stylizeSegmentedPortrait(segmented);
    const portraitObjectUrl = URL.createObjectURL(stylized.blob);

    const card = await composeIsolatedPortraitIdCard({
      portraitCanvas: stylized.canvas,
      subjectBox: segmented.subjectBox,
      headBox: segmented.headBox,
      username,
    });

    const elapsed = Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt
    );

    return {
      mode: "isolated",
      portraitBlob: stylized.blob,
      portraitObjectUrl,
      card,
      durationMs: elapsed,
    };
  } catch (err) {
    const isSegErr = err instanceof PortraitSegmentationError;
    const errorCode: PortraitSegmentationError["code"] | "UNKNOWN" = isSegErr
      ? err.code
      : "UNKNOWN";
    const reason = isSegErr
      ? err.message
      : "Background removal could not be completed. Showing a cleanly cropped photo instead.";

    // Always try to compose a clean, properly cropped fallback ID card so the user never sees a broken card
    const { canvas } = await decodeImageSource(source, 1440);
    const card = await composeFallbackIdCard({
      sourceCanvas: canvas,
      username,
    });

    const elapsed = Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt
    );

    return {
      mode: "fallback",
      portraitBlob: null,
      portraitObjectUrl: null,
      card,
      reason,
      errorCode,
      durationMs: elapsed,
    };
  }
}

