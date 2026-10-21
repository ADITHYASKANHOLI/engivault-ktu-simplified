"use client";

import React, { useState, useEffect, useRef } from "react";
import { Share2, Link2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorksShareActivityInfo {
  id: string;
  title: string;
  slug?: string | null;
  short_description?: string | null;
  description?: string | null;
  category?: string | null;
  cover_image?: string | null;
}

export interface WorksShareButtonProps {
  activity: WorksShareActivityInfo;
  variant?: "flyer" | "card" | "detail-header" | "detail-cta";
  className?: string;
}

/**
 * Computes canonical public FOLE WORKS activity detail URL safely.
 * Prefers window.location.origin in the browser, falling back to NEXT_PUBLIC_SITE_URL or VERCEL_URL.
 */
export function getActivityShareUrl(slugOrId: string): string {
  if (!slugOrId) return "/fole-works";
  const clean = encodeURIComponent(String(slugOrId).trim());
  const path = `/fole-works/${clean}`;

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }

  let base = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    ""
  ).trim();

  if (base && !base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }
  base = base.replace(/\/+$/, "");
  return `${base}${path}`;
}

/**
 * Copies text to clipboard safely using Clipboard API with execCommand fallback.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // 1. Try modern navigator.clipboard API
  if (navigator?.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("[WorksShare] navigator.clipboard.writeText failed, trying fallback:", err);
    }
  }

  // 2. Legacy execCommand fallback for restricted browser contexts
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.setAttribute("readonly", "");
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (successful) return true;
  } catch (err) {
    console.warn("[WorksShare] execCommand fallback failed:", err);
  }

  return false;
}

/**
 * Fetches original flyer image as a File object for native Web Share API file attachment.
 */
async function getFlyerShareFile(activity: WorksShareActivityInfo): Promise<File | null> {
  if (typeof window === "undefined" || !activity.cover_image) return null;
  try {
    const cleanSlug = (activity.slug || activity.id).trim();
    // Prefer the same-origin flyer route to avoid cross-origin canvas/blob restrictions
    let fetchUrl = `/api/works/${encodeURIComponent(cleanSlug)}/flyer`;

    if (activity.cover_image.startsWith("data:image/")) {
      fetchUrl = activity.cover_image;
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      if (activity.cover_image.startsWith("http://") || activity.cover_image.startsWith("https://")) {
        const directRes = await fetch(activity.cover_image);
        if (!directRes.ok) return null;
        const blob = await directRes.blob();
        const mimeType = blob.type || "image/jpeg";
        const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
        return new File([blob], `${cleanSlug}-flyer.${ext}`, { type: mimeType });
      }
      return null;
    }

    const blob = await res.blob();
    const mimeType = blob.type || "image/jpeg";
    const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
    return new File([blob], `${cleanSlug}-flyer.${ext}`, { type: mimeType });
  } catch (err) {
    console.warn("[WorksShare] Could not construct flyer file:", err);
    return null;
  }
}

export function WorksShareButton({
  activity,
  variant = "card",
  className,
}: WorksShareButtonProps) {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanShare(true);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const shareTitle = activity.title ? `${activity.title} — FOLE WORKS` : "FOLE WORKS Activity";
  const cleanDesc = (
    activity.short_description ||
    (activity.description ? activity.description.slice(0, 160) : "") ||
    `Join ${activity.title || "this activity"} on FOLE WORKS (CE Vadakara)`
  ).trim();
  const shareUrl = getActivityShareUrl(activity.slug || activity.id);

  // Structured caption including direct activity link
  const shareCaption = `${activity.title || "FOLE WORKS Activity"}\n${cleanDesc}\n\nView activity: ${shareUrl}`;
  const shareText = shareCaption;

  const triggerCopiedFeedback = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setCopied(true);
    timerRef.current = setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const handleNativeShare = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (canShare && typeof navigator.share === "function") {
      // 1. Primary: Try native file-and-link sharing if flyer exists and browser can share files
      if (activity.cover_image && typeof navigator.canShare === "function") {
        try {
          const flyerFile = await getFlyerShareFile(activity);
          if (flyerFile && navigator.canShare({ files: [flyerFile] })) {
            await navigator.share({
              title: shareTitle,
              text: shareCaption,
              files: [flyerFile],
            });
            return;
          }
        } catch (err: any) {
          if (err?.name === "AbortError") {
            return; // User cancelled share sheet
          }
          console.warn("[WorksShare] Native file share failed, falling back to link share:", err);
        }
      }

      // 2. Fallback: Native text + URL sharing
      try {
        await navigator.share({
          title: shareTitle,
          text: `${activity.title}\n${cleanDesc}`,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") {
          return; // User dismissed native share sheet
        }
        console.warn("[WorksShare] Native share failed, falling back to copy link:", err);
        await handleCopyLink();
        return;
      }
    }

    // 3. Fallback when Web Share API is unavailable
    await handleCopyLink();
  };

  const handleCopyLink = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const success = await copyTextToClipboard(shareUrl);
    if (success) {
      triggerCopiedFeedback();
    } else {
      setShowFallbackModal(true);
    }
  };

  return (
    <>
      {/* Variant: Flyer overlay (top-left on activity card) */}
      {variant === "flyer" && (
        <button
          type="button"
          onClick={handleNativeShare}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold font-mono text-slate-200 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/60 hover:border-emerald-500/50 hover:text-emerald-400 backdrop-blur-md shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[30px]",
            copied && "text-emerald-400 border-emerald-500/60",
            className
          )}
          title={copied ? "Activity link copied!" : "Share activity"}
          aria-label={copied ? "Activity link copied!" : "Share activity"}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[3]" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Share</span>
            </>
          )}
        </button>
      )}

      {/* Variant: Card footer secondary row */}
      {variant === "card" && (
        <div className={cn("inline-flex items-center gap-1.5", className)}>
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[32px]"
            title="Share activity"
            aria-label="Share activity"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Share</span>
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[32px]",
              copied
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title="Copy activity link"
            aria-label="Copy activity link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 stroke-[3]" />
                <span className="font-bold">Link copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Variant: Detail page header */}
      {variant === "detail-header" && (
        <div className={cn("inline-flex items-center gap-2", className)}>
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[36px]"
            title="Share activity"
            aria-label="Share activity"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Share</span>
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[36px]",
              copied
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/40"
                : "text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
            )}
            title="Copy activity link"
            aria-label="Copy activity link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                <span>Link copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Variant: Detail page sticky action sidebar */}
      {variant === "detail-cta" && (
        <div className={cn("pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2", className)}>
          <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 block font-semibold">
            Share Activity
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[42px]"
              title="Share activity"
              aria-label="Share activity"
            >
              <Share2 className="w-4 h-4 text-emerald-500" />
              <span>Share</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className={cn(
                "w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[42px]",
                copied
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/40"
                  : "text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
              )}
              title="Copy activity link"
              aria-label="Copy activity link"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 text-slate-400" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {copied && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 text-white border border-emerald-500/50 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">Activity link copied!</span>
            <span className="text-[10px] text-slate-400 font-mono">Ready to paste and share</span>
          </div>
        </div>
      )}

      {/* Accessible Fallback Dialog for Restricted Contexts */}
      {showFallbackModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowFallbackModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="copy-link-title"
          >
            <div className="flex items-center justify-between">
              <h4 id="copy-link-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Copy Activity Link
              </h4>
              <button
                type="button"
                onClick={() => setShowFallbackModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Clipboard access was restricted. Please copy the direct link below:
            </p>
            <input
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowFallbackModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
