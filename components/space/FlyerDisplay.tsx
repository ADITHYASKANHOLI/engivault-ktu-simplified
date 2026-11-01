"use client";

import React, { useState, useEffect } from "react";
import { Maximize2, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlyerDisplayProps {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  className?: string;
  priority?: boolean;
}

export function FlyerDisplay({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: FlyerDisplayProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Compute CSS aspect ratio from natural dimensions if available
  const aspectRatio =
    width && height && width > 0 && height > 0 ? `${width} / ${height}` : "auto";

  // Close modal on Escape
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "w-full bg-slate-100 border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-400 aspect-video",
          className
        )}
      >
        <ImageIcon className="w-12 h-12 mb-2 stroke-1" />
        <span className="text-xs font-medium">No event poster available</span>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "relative group rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200 shadow-sm",
          className
        )}
        style={{ aspectRatio }}
      >
        {/* Render uncropped full image in natural aspect ratio */}
        <img
          src={src}
          alt={alt}
          width={width || undefined}
          height={height || undefined}
          className="w-full h-auto object-contain max-h-[700px] select-none"
          loading={priority ? "eager" : "lazy"}
          onError={() => setHasError(true)}
        />

        {/* View Full Size Overlay Trigger */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity focus:outline-hidden focus:ring-2 focus:ring-emerald-400 flex items-center gap-1.5 text-xs font-semibold px-3 shadow-lg"
          aria-label="View flyer full size"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Full Poster</span>
        </button>
      </div>

      {/* Lightbox / Full-size Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setModalOpen(false)}
        >
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-hidden focus:ring-2 focus:ring-white"
            aria-label="Close full size view"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="max-w-5xl max-h-[90vh] overflow-auto flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
