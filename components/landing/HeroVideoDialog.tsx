"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Play, RefreshCw, AlertCircle } from "lucide-react";

export interface HeroVideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  videoSrc?: string;
  posterSrc?: string;
}

export function HeroVideoDialog({
  isOpen,
  onClose,
  triggerRef,
  videoSrc = "/videos/fole-intro.mp4",
  posterSrc = "/videos/fole-intro-poster.jpg",
}: HeroVideoDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Lock body scroll and manage focus
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const triggerElement = triggerRef?.current;

    // Set initial focus to close button for accessibility
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
      // Restore focus to triggering button
      triggerElement?.focus();
    };
  }, [isOpen, triggerRef]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.pause();
        }
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Safe playback control on open/close
  useEffect(() => {
    if (!isOpen) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setIsLoading(true);
      setHasError(false);
      return;
    }

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsLoading(false);
          })
          .catch((err) => {
            // Autoplay was blocked by browser policy; user can click native play control
            console.log("Autoplay policy info:", err.message);
            setIsLoading(false);
          });
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onClose();
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        setIsLoading(false);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fole-video-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog Frame */}
      <div className="relative z-10 w-full max-w-5xl rounded-2xl md:rounded-3xl bg-[#07140e] border border-emerald-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-emerald-950/60 bg-[#050e09]/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2
              id="fole-video-title"
              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-100 font-mono"
            >
              FOLE — Ideas Into Impact
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            className="p-1.5 sm:p-2 rounded-full text-slate-300 hover:text-white hover:bg-emerald-950/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="Close video player (Escape)"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative w-full aspect-[3024/1730] sm:aspect-[16/9] bg-black flex items-center justify-center overflow-hidden">
          {isLoading && !hasError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white gap-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="text-xs font-mono text-emerald-200">Buffering FOLE Experience...</span>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center text-white gap-4">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Unable to play video</p>
                <p className="text-xs text-slate-400 max-w-md">{errorMessage || "The media stream could not be loaded."}</p>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Playback</span>
              </button>
            </div>
          )}

          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc}
            controls
            playsInline
            preload="metadata"
            onLoadedData={() => setIsLoading(false)}
            onCanPlay={() => setIsLoading(false)}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => setIsLoading(false)}
            onError={(e) => {
              setIsLoading(false);
              setHasError(true);
              setErrorMessage("Unable to load video format in this browser.");
              console.error("Video error:", e);
            }}
            className="w-full h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Footer Sub-Bar */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#050e09] border-t border-emerald-950/60 flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Free Open Learning & Education</span>
            <span className="sm:hidden">FOLE Intro</span>
          </div>
          <span className="text-emerald-400 font-semibold">HD Quality • Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
