"use client";

/**
 * LanyardProfileCard
 *
 * Mobile-only interactive 3D Lanyard profile card with profile picture upload.
 * Strictly conditionally mounted ONLY on mobile viewports (< 640px) inside
 * the Profile (/account) section. Desktop/tablet viewports never load Three.js
 * or create a WebGL context, and resizing above 639px cleanly unmounts WebGL
 * and disposes all GPU resources.
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
} from "lucide-react";

// Lazy-loaded Three.js WebGL component — only requested when isMobile is true.
const LanyardWebGL = lazy(() => import("@/components/Lanyard"));

// Default card and strap assets (served from /public/lanyard/)
const DEFAULT_FRONT = "/lanyard/card-front.png";
const DEFAULT_BACK = "/lanyard/card-back.png";
const DEFAULT_STRAP = "/lanyard/band.png";

const MOBILE_MEDIA_QUERY = "(max-width: 639px)";
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

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

export interface LanyardProfileCardProps {
  username: string;
  initialAvatarUrl?: string | null;
}

type UploadState =
  | { status: "idle" }
  | { status: "preview"; objectUrl: string; file: File }
  | { status: "uploading"; objectUrl: string }
  | { status: "success"; avatarUrl: string }
  | { status: "error"; message: string };

export function LanyardProfileCard({
  username,
  initialAvatarUrl,
}: LanyardProfileCardProps) {
  // Start false so SSR & initial desktop hydration never mount Three.js / WebGL.
  const [isMobile, setIsMobile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialAvatarUrl ?? null
  );
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeObjectUrlRef = useRef<string | null>(null);

  const revokeActiveObjectUrl = useCallback(() => {
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
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

  // Sync SSR initial prop updates
  useEffect(() => {
    if (initialAvatarUrl !== undefined) {
      setAvatarUrl(initialAvatarUrl);
    }
  }, [initialAvatarUrl]);

  // Fetch persisted avatar on mobile mount if not already passed from server
  useEffect(() => {
    if (!isMobile || initialAvatarUrl !== undefined) return;
    let cancelled = false;

    fetch("/api/auth/student/avatar")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && "avatarUrl" in data) {
          setAvatarUrl(data.avatarUrl ?? null);
        }
      })
      .catch(() => {
        // Non-critical fallback to default card image
      });

    return () => {
      cancelled = true;
    };
  }, [isMobile, initialAvatarUrl]);

  // Cleanup any active blob URL on unmount
  useEffect(() => {
    return () => {
      revokeActiveObjectUrl();
    };
  }, [revokeActiveObjectUrl]);

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

  const handleFileSelected = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        revokeActiveObjectUrl();
        setUploadState({ status: "error", message: error });
        return;
      }

      revokeActiveObjectUrl();
      const nextUrl = URL.createObjectURL(file);
      activeObjectUrlRef.current = nextUrl;
      setUploadState({ status: "preview", objectUrl: nextUrl, file });
    },
    [revokeActiveObjectUrl]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
    // Reset input so re-selecting the same file still fires onChange
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (uploadState.status !== "preview") return;
    const { file, objectUrl } = uploadState;

    setUploadState({ status: "uploading", objectUrl });

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/auth/student/avatar", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        revokeActiveObjectUrl();
        setUploadState({
          status: "error",
          message: data?.error ?? "Upload failed. Please try again.",
        });
        return;
      }

      revokeActiveObjectUrl();
      const newUrl = data.avatarUrl as string;
      setAvatarUrl(newUrl);
      setUploadState({ status: "success", avatarUrl: newUrl });

      setTimeout(() => {
        setUploadState((prev) =>
          prev.status === "success" ? { status: "idle" } : prev
        );
      }, 3000);
    } catch {
      revokeActiveObjectUrl();
      setUploadState({
        status: "error",
        message: "Network error. Please check your connection and try again.",
      });
    }
  };

  const handleCancel = () => {
    revokeActiveObjectUrl();
    setUploadState({ status: "idle" });
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const res = await fetch("/api/auth/student/avatar", { method: "DELETE" });
      if (res.ok) {
        revokeActiveObjectUrl();
        setAvatarUrl(null);
        setUploadState({ status: "idle" });
      } else {
        const data = await res.json().catch(() => null);
        setUploadState({
          status: "error",
          message: data?.error ?? "Failed to remove profile picture.",
        });
      }
    } catch {
      setUploadState({
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

  // Strictly display the user's photo (or preview) inside the 3D Lanyard `frontImage` only
  const frontImage =
    uploadState.status === "preview" || uploadState.status === "uploading"
      ? uploadState.objectUrl
      : uploadState.status === "success"
      ? uploadState.avatarUrl
      : avatarUrl ?? DEFAULT_FRONT;

  const isBusy = uploadState.status === "uploading" || isRemoving;

  return (
    <section
      aria-label="Mobile interactive student ID lanyard"
      className="sm:hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4"
    >
      {/* ── 3D Lanyard Interactive Stage ─────────────────────── */}
      <div className="relative rounded-xl overflow-hidden bg-[radial-gradient(circle_at_50%_38%,rgba(16,185,129,0.14),rgba(226,232,240,0.55)_75%)] dark:bg-[radial-gradient(circle_at_50%_38%,rgba(16,185,129,0.2),rgba(2,6,23,0.95)_75%)] border border-slate-200/70 dark:border-slate-800/80">
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
              cardColor="#07111F"
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

        {/* Minimal hint overlay */}
        <p className="pb-2.5 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 select-none pointer-events-none">
          Drag card to swing • Tap to flip
        </p>
      </div>

      {/* ── Upload & Persistence Controls ────────────────────── */}
      <div className="space-y-3">
        {uploadState.status === "error" && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{uploadState.message}</span>
          </div>
        )}

        {uploadState.status === "success" && (
          <div
            role="status"
            className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile picture updated on your ID card!</span>
          </div>
        )}

        {uploadState.status === "preview" && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                Previewing on 3D card above
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                {humanSize(uploadState.file.size)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUpload}
                disabled={isBusy}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Save to Card</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isBusy}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {uploadState.status === "uploading" && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Saving your profile picture…</span>
          </div>
        )}

        {(uploadState.status === "idle" ||
          uploadState.status === "success" ||
          uploadState.status === "error") && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{avatarUrl ? "Change ID Photo" : "Upload ID Photo"}</span>
            </button>

            {avatarUrl && (
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
          JPG, PNG, or WebP • Max {MAX_SIZE_MB} MB
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
