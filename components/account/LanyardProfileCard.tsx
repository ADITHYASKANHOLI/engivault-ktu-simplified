"use client";

/**
 * LanyardProfileCard
 *
 * Mobile-only interactive 3D Lanyard profile card with client-side person
 * background removal, monochrome charcoal portrait styling, dynamic ID card
 * composition, and multi-asset persistence.
 *
 * Strictly conditionally mounted ONLY on mobile viewports (< 640px) inside
 * the Profile (/account) section. Desktop/tablet viewports never load Three.js,
 * MediaPipe WASM, or create a WebGL context, and resizing above 639px cleanly
 * unmounts WebGL and disposes all GPU resources.
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  lazy,
  Suspense,
} from "react";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Upload,
  RefreshCw,
} from "lucide-react";
import type { AvatarAssetsPayload } from "@/lib/portrait/avatar-types";

// Lazy-loaded Three.js WebGL component — only requested when isMobile is true.
const LanyardWebGL = lazy(() => import("@/components/Lanyard"));

// Default static fallback card and strap assets (served from /public/lanyard/)
const DEFAULT_FRONT = "/lanyard/card-front.png";
const DEFAULT_BACK = "/lanyard/card-back.png";
const DEFAULT_STRAP = "/lanyard/band.png";

const MOBILE_MEDIA_QUERY = "(max-width: 639px)";
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const SINGLE_REQUEST_SAFE_BYTES = 3.5 * 1024 * 1024;

function humanSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isSupportedImageFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  if (mime) {
    return ACCEPTED_TYPES.includes(mime);
  }
  const lowerName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

function buildInitialAssets(
  initialAvatarAssets?: AvatarAssetsPayload,
  initialAvatarUrl?: string | null
): AvatarAssetsPayload {
  if (initialAvatarAssets) return initialAvatarAssets;
  if (initialAvatarUrl) {
    return {
      avatarUrl: initialAvatarUrl,
      originalUrl: null,
      processedUrl: null,
      cardUrl: initialAvatarUrl,
      processingStatus: "legacy",
    };
  }
  return {
    avatarUrl: null,
    originalUrl: null,
    processedUrl: null,
    cardUrl: null,
    processingStatus: "none",
  };
}

export interface LanyardProfileCardProps {
  username: string;
  initialAvatarUrl?: string | null;
  initialAvatarAssets?: AvatarAssetsPayload;
}

type CardFlowState =
  | { status: "idle" }
  | { status: "processing"; label: string }
  | {
      status: "preview-isolated";
      file: File | null;
      sourceBlob: Blob;
      portraitBlob: Blob;
      portraitObjectUrl: string;
      cardBlob: Blob;
      cardObjectUrl: string;
      durationMs: number;
    }
  | {
      status: "preview-fallback";
      file: File | null;
      sourceBlob: Blob;
      cardBlob: Blob;
      cardObjectUrl: string;
      reason: string;
    }
  | { status: "uploading"; previewUrl: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function LanyardProfileCard({
  username,
  initialAvatarUrl,
  initialAvatarAssets,
}: LanyardProfileCardProps) {
  // Start false so SSR & initial desktop hydration never mount Three.js / WebGL or MediaPipe.
  const [isMobile, setIsMobile] = useState(false);
  const [assets, setAssets] = useState<AvatarAssetsPayload>(() =>
    buildInitialAssets(initialAvatarAssets, initialAvatarUrl)
  );
  const [starterCardUrl, setStarterCardUrl] = useState<string | null>(null);
  const [flowState, setFlowState] = useState<CardFlowState>({ status: "idle" });
  const [isRemoving, setIsRemoving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCardUrlRef = useRef<string | null>(null);
  const previewPortraitUrlRef = useRef<string | null>(null);
  const starterUrlRef = useRef<string | null>(null);
  const processTokenRef = useRef(0);

  const revokePreviewUrls = useCallback(() => {
    if (previewCardUrlRef.current) {
      URL.revokeObjectURL(previewCardUrlRef.current);
      previewCardUrlRef.current = null;
    }
    if (previewPortraitUrlRef.current) {
      URL.revokeObjectURL(previewPortraitUrlRef.current);
      previewPortraitUrlRef.current = null;
    }
  }, []);

  // Track mobile viewport strictly (< 640px matching Tailwind `sm:` breakpoint)
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    const updateViewport = () => setIsMobile(mql.matches);
    updateViewport();

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", updateViewport);
      return () => mql.removeEventListener("change", updateViewport);
    }
    mql.addListener(updateViewport);
    return () => mql.removeListener(updateViewport);
  }, []);

  // Sync SSR initial props
  useEffect(() => {
    if (initialAvatarAssets !== undefined || initialAvatarUrl !== undefined) {
      setAssets(buildInitialAssets(initialAvatarAssets, initialAvatarUrl));
    }
  }, [initialAvatarAssets, initialAvatarUrl]);

  // Fetch persisted avatar assets only if SSR did not pre-populate them
  useEffect(() => {
    if (
      !isMobile ||
      initialAvatarAssets !== undefined ||
      initialAvatarUrl !== undefined
    ) {
      return;
    }
    let cancelled = false;

    fetch("/api/auth/student/avatar")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && "avatarUrl" in data) {
          setAssets({
            avatarUrl: data.avatarUrl ?? null,
            originalUrl: data.originalUrl ?? null,
            processedUrl: data.processedUrl ?? null,
            cardUrl: data.cardUrl ?? data.avatarUrl ?? null,
            processingStatus: data.processingStatus ?? "none",
          });
        }
      })
      .catch(() => {
        // Non-critical fallback to default starter ID card
      });

    return () => {
      cancelled = true;
    };
  }, [isMobile, initialAvatarAssets, initialAvatarUrl]);

  // Compose personalized clean white starter ID card on mobile when no portrait is uploaded
  useEffect(() => {
    if (!isMobile || assets.cardUrl || assets.avatarUrl) {
      return;
    }
    let cancelled = false;

    import("@/lib/portrait/composeIdCard")
      .then(({ composeStarterIdCard }) => composeStarterIdCard(username))
      .then((starter) => {
        if (cancelled) {
          URL.revokeObjectURL(starter.objectUrl);
          return;
        }
        if (starterUrlRef.current) {
          URL.revokeObjectURL(starterUrlRef.current);
        }
        starterUrlRef.current = starter.objectUrl;
        setStarterCardUrl(starter.objectUrl);
      })
      .catch(() => {
        // Fallback smoothly to static DEFAULT_FRONT
      });

    return () => {
      cancelled = true;
    };
  }, [isMobile, username, assets.cardUrl, assets.avatarUrl]);

  // Cleanup active blob URLs on unmount
  useEffect(() => {
    return () => {
      revokePreviewUrls();
      if (starterUrlRef.current) {
        URL.revokeObjectURL(starterUrlRef.current);
        starterUrlRef.current = null;
      }
    };
  }, [revokePreviewUrls]);

  const validateFile = (file: File): string | null => {
    if (!isSupportedImageFile(file)) {
      return `Unsupported format (${file.type || file.name}). Please choose a JPG, PNG, or WebP image.`;
    }
    if (file.size <= 0) {
      return "Selected file appears to be empty.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File is too large (${humanSize(file.size)}). Maximum size is ${MAX_SIZE_MB} MB.`;
    }
    return null;
  };

  const runPortraitPipeline = useCallback(
    async (sourceBlob: Blob, originalFile: File | null) => {
      const token = ++processTokenRef.current;
      revokePreviewUrls();
      setFlowState({
        status: "processing",
        label: originalFile
          ? "Isolating portrait & styling ID card…"
          : "Reprocessing portrait from saved photograph…",
      });

      try {
        const { processProfilePortrait } = await import(
          "@/lib/portrait/processProfilePortrait"
        );
        const result = await processProfilePortrait(sourceBlob, username);

        if (token !== processTokenRef.current) {
          URL.revokeObjectURL(result.card.objectUrl);
          if (result.portraitObjectUrl) {
            URL.revokeObjectURL(result.portraitObjectUrl);
          }
          return;
        }

        previewCardUrlRef.current = result.card.objectUrl;
        if (result.portraitObjectUrl) {
          previewPortraitUrlRef.current = result.portraitObjectUrl;
        }

        if (result.mode === "isolated") {
          setFlowState({
            status: "preview-isolated",
            file: originalFile,
            sourceBlob,
            portraitBlob: result.portraitBlob,
            portraitObjectUrl: result.portraitObjectUrl,
            cardBlob: result.card.blob,
            cardObjectUrl: result.card.objectUrl,
            durationMs: result.durationMs,
          });
        } else {
          setFlowState({
            status: "preview-fallback",
            file: originalFile,
            sourceBlob,
            cardBlob: result.card.blob,
            cardObjectUrl: result.card.objectUrl,
            reason: result.reason,
          });
        }
      } catch (err) {
        if (token !== processTokenRef.current) return;
        revokePreviewUrls();
        setFlowState({
          status: "error",
          message:
            err instanceof Error
              ? err.message
              : "Could not process this image file. Please try another photograph.",
        });
      }
    },
    [revokePreviewUrls, username]
  );

  const handleFileSelected = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        revokePreviewUrls();
        setFlowState({ status: "error", message: error });
        return;
      }
      void runPortraitPipeline(file, file);
    },
    [revokePreviewUrls, runPortraitPipeline]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
    // Reset input so re-selecting the same file still triggers onChange
    e.target.value = "";
  };

  const handleRetryProcessing = () => {
    if (
      flowState.status === "preview-isolated" ||
      flowState.status === "preview-fallback"
    ) {
      void runPortraitPipeline(flowState.sourceBlob, flowState.file);
    }
  };

  const handleReprocessSaved = async () => {
    if (!assets.originalUrl) return;
    const token = ++processTokenRef.current;
    setFlowState({
      status: "processing",
      label: "Loading saved photograph for reprocessing…",
    });

    try {
      // Same-origin authenticated stream prevents cross-origin canvas taint
      const res = await fetch("/api/auth/student/avatar?asset=original", {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Saved original photograph could not be loaded.");
      }
      const blob = await res.blob();
      if (token !== processTokenRef.current) return;
      await runPortraitPipeline(blob, null);
    } catch (err) {
      if (token !== processTokenRef.current) return;
      setFlowState({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Could not load original photograph for reprocessing.",
      });
    }
  };

  const handleSaveToCard = async () => {
    if (
      flowState.status !== "preview-isolated" &&
      flowState.status !== "preview-fallback"
    ) {
      return;
    }

    const previewUrl = flowState.cardObjectUrl;
    const isIsolated = flowState.status === "preview-isolated";
    const originalFile = flowState.file;
    const cardBlob = flowState.cardBlob;
    const portraitBlob = isIsolated ? flowState.portraitBlob : null;

    setFlowState({ status: "uploading", previewUrl });

    try {
      const { prepareOriginalUploadBlob } = await import(
        "@/lib/portrait/processProfilePortrait"
      );

      let uploadOriginalBlob: Blob | null = null;
      if (originalFile) {
        uploadOriginalBlob = await prepareOriginalUploadBlob(originalFile);
      }

      const derivedBytes =
        cardBlob.size + (portraitBlob ? portraitBlob.size : 0);
      const totalBytes = (uploadOriginalBlob?.size ?? 0) + derivedBytes;

      let response: Response;

      if (uploadOriginalBlob && totalBytes > SINGLE_REQUEST_SAFE_BYTES) {
        // Two lightweight sequential stages stay safely below Vercel 4.5 MB limit
        const stage1 = new FormData();
        stage1.append("assetRole", "original");
        stage1.append(
          "file",
          new File([uploadOriginalBlob], originalFile?.name || "original.jpg", {
            type: uploadOriginalBlob.type || "image/jpeg",
          })
        );
        const stage1Res = await fetch("/api/auth/student/avatar", {
          method: "POST",
          body: stage1,
        });
        if (!stage1Res.ok) {
          const errData = await stage1Res.json().catch(() => null);
          throw new Error(errData?.error ?? "Failed to upload original photo.");
        }

        const stage2 = new FormData();
        stage2.append("useExistingOriginal", "1");
        stage2.append(
          "processingStatus",
          isIsolated ? "processed" : "fallback"
        );
        if (portraitBlob) {
          stage2.append(
            "processedFile",
            new File([portraitBlob], "portrait.png", { type: "image/png" })
          );
        }
        stage2.append(
          "cardFile",
          new File([cardBlob], "card-front.png", { type: "image/png" })
        );
        response = await fetch("/api/auth/student/avatar", {
          method: "POST",
          body: stage2,
        });
      } else {
        const form = new FormData();
        if (uploadOriginalBlob && originalFile) {
          form.append(
            "file",
            new File([uploadOriginalBlob], originalFile.name || "original.jpg", {
              type: uploadOriginalBlob.type || "image/jpeg",
            })
          );
        } else {
          form.append("useExistingOriginal", "1");
        }
        form.append(
          "processingStatus",
          isIsolated ? "processed" : "fallback"
        );
        if (portraitBlob) {
          form.append(
            "processedFile",
            new File([portraitBlob], "portrait.png", { type: "image/png" })
          );
        }
        form.append(
          "cardFile",
          new File([cardBlob], "card-front.png", { type: "image/png" })
        );

        response = await fetch("/api/auth/student/avatar", {
          method: "POST",
          body: form,
        });
      }

      const data = await response.json();
      if (!response.ok) {
        revokePreviewUrls();
        setFlowState({
          status: "error",
          message: data?.error ?? "Upload failed. Please try again.",
        });
        return;
      }

      revokePreviewUrls();
      const savedAssets: AvatarAssetsPayload = {
        avatarUrl: data.avatarUrl ?? null,
        originalUrl: data.originalUrl ?? null,
        processedUrl: data.processedUrl ?? null,
        cardUrl: data.cardUrl ?? data.avatarUrl ?? null,
        processingStatus:
          data.processingStatus ?? (isIsolated ? "processed" : "fallback"),
      };
      setAssets(savedAssets);
      setFlowState({
        status: "success",
        message:
          savedAssets.processingStatus === "processed"
            ? "Isolated portrait ID card saved!"
            : "Cropped portrait photo saved to your ID card.",
      });

      setTimeout(() => {
        setFlowState((prev) =>
          prev.status === "success" ? { status: "idle" } : prev
        );
      }, 3200);
    } catch (err) {
      revokePreviewUrls();
      setFlowState({
        status: "error",
        message:
          err instanceof Error && err.message
            ? err.message
            : "Network error. Please check your connection and try again.",
      });
    }
  };

  const handleCancel = () => {
    processTokenRef.current++;
    revokePreviewUrls();
    setFlowState({ status: "idle" });
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const res = await fetch("/api/auth/student/avatar", { method: "DELETE" });
      if (res.ok) {
        revokePreviewUrls();
        setAssets({
          avatarUrl: null,
          originalUrl: null,
          processedUrl: null,
          cardUrl: null,
          processingStatus: "none",
        });
        setFlowState({ status: "idle" });
      } else {
        const data = await res.json().catch(() => null);
        setFlowState({
          status: "error",
          message: data?.error ?? "Failed to remove profile picture.",
        });
      }
    } catch {
      setFlowState({
        status: "error",
        message: "Network error while removing profile picture.",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  // Conditional unmounting on tablet/desktop viewports (>= 640px)
  if (!isMobile) {
    return null;
  }

  // Always pass the active card front composition to LanyardWebGL (cached on revisit)
  const frontImage =
    flowState.status === "preview-isolated" ||
    flowState.status === "preview-fallback"
      ? flowState.cardObjectUrl
      : flowState.status === "uploading"
      ? flowState.previewUrl
      : assets.cardUrl ?? assets.avatarUrl ?? starterCardUrl ?? DEFAULT_FRONT;

  const isBusy =
    flowState.status === "processing" ||
    flowState.status === "uploading" ||
    isRemoving;

  const hasSavedPhoto = Boolean(assets.cardUrl || assets.avatarUrl);

  return (
    <section
      aria-label="Mobile interactive student ID lanyard"
      className="sm:hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4"
    >
      {/* ── 3D Lanyard Interactive Stage ─────────────────────── */}
      <div className="relative rounded-xl overflow-hidden bg-[radial-gradient(circle_at_50%_38%,rgba(16,185,129,0.12),rgba(226,232,240,0.58)_75%)] dark:bg-[radial-gradient(circle_at_50%_38%,rgba(16,185,129,0.2),rgba(2,6,23,0.95)_75%)] border border-slate-200/70 dark:border-slate-800/80">
        <div
          className="w-full h-[420px]"
          aria-label={`Interactive 3D lanyard ID card for @${username}`}
          role="region"
          aria-roledescription="interactive 3D lanyard"
        >
          <Suspense
            fallback={
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
                <span className="text-[11px] font-medium">
                  Loading 3D ID Card…
                </span>
              </div>
            }
          >
            <LanyardWebGL
              frontImage={frontImage}
              backImage={DEFAULT_BACK}
              strapImage={DEFAULT_STRAP}
              imageFit="cover"
              strapColor="#064E3B"
              cardColor="#F8FAFC"
              finish="glossy"
              orientation="portrait"
              size={0.56}
              anchor="center"
              strapLength={0.36}
              strapWidth={0.6}
              gravity={1.2}
              damping={0.55}
              elasticity={0.45}
              breeze={0.0}
              interactive={true}
              intro={true}
            />
          </Suspense>
        </div>

        {/* Non-blocking processing badge inside stage */}
        {flowState.status === "processing" && (
          <div className="absolute inset-x-3 bottom-9 flex items-center justify-center pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/92 dark:bg-slate-900/92 backdrop-blur-xs border border-slate-200 dark:border-slate-700 shadow-sm text-[11px] font-medium text-slate-700 dark:text-slate-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>{flowState.label}</span>
            </div>
          </div>
        )}

        {/* Minimal hint overlay */}
        <p className="pb-2.5 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 select-none pointer-events-none">
          Drag card to swing • Tap to flip
        </p>
      </div>

      {/* ── Upload, Preview & Persistence Controls ───────────── */}
      <div className="space-y-3">
        {flowState.status === "error" && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{flowState.message}</span>
          </div>
        )}

        {flowState.status === "success" && (
          <div
            role="status"
            className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{flowState.message}</span>
          </div>
        )}

        {flowState.status === "preview-isolated" && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                Isolated portrait preview ready
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                {(flowState.durationMs / 1000).toFixed(1)}s
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveToCard}
                disabled={isBusy}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span>Save to Card</span>
              </button>
              <button
                type="button"
                onClick={handleRetryProcessing}
                disabled={isBusy}
                aria-label="Retry portrait processing"
                title="Retry portrait processing"
                className="px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isBusy}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {flowState.status === "preview-fallback" && (
          <div className="space-y-2.5">
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                <p className="font-semibold">
                  Background removal could not be completed
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {flowState.reason} Showing a clean, cropped version of your
                  original photo on the card.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveToCard}
                disabled={isBusy}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span>Save Photo</span>
              </button>
              <button
                type="button"
                onClick={handleRetryProcessing}
                disabled={isBusy}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isBusy}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {flowState.status === "uploading" && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Saving portrait assets to your ID card…</span>
          </div>
        )}

        {flowState.status === "processing" && (
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span>{flowState.label}</span>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        )}

        {(flowState.status === "idle" ||
          flowState.status === "success" ||
          flowState.status === "error") && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>
                {hasSavedPhoto ? "Change ID Photo" : "Upload ID Photo"}
              </span>
            </button>

            {assets.originalUrl && (
              <button
                type="button"
                onClick={handleReprocessSaved}
                disabled={isBusy}
                aria-label="Reprocess portrait from saved photo"
                title="Reprocess portrait from saved photo"
                className="p-2.5 rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            {hasSavedPhoto && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isBusy}
                aria-label="Remove profile picture"
                title="Remove profile picture"
                className="p-2.5 rounded-xl text-red-600 hover:text-red-700 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                {isRemoving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        )}

        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
          JPG, PNG, or WebP • Max {MAX_SIZE_MB} MB • Background removal runs privately on your device
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Select profile picture for lanyard ID card"
        onChange={handleInputChange}
      />
    </section>
  );
}
