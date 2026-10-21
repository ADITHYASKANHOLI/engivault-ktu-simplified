"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FoleSpaceLogoProps {
  /**
   * Predefined size presets for FOLE SPACE logo:
   * sm: h-7 / h-8 (~60-70px width)
   * md: h-9 / h-10 (~90-100px width)
   * lg: h-12 / h-14 (~130-150px width)
   * xl: h-16 / h-20 (~180-220px width)
   */
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  href?: string | null;
  priority?: boolean;
  alt?: string;
}

export function FoleSpaceLogo({
  size = "md",
  className = "",
  href = "/fole-space",
  priority = false,
  alt = "FOLE SPACE — Open Collaborative Learning Space",
}: FoleSpaceLogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    sm: { h: "h-7 sm:h-8", w: 1024, hNum: 455 },
    md: { h: "h-9 sm:h-10", w: 1024, hNum: 455 },
    lg: { h: "h-12 sm:h-14", w: 1024, hNum: 455 },
    xl: { h: "h-16 sm:h-20", w: 1024, hNum: 455 },
  };

  const selected = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={cn("inline-flex items-center group select-none transition-transform duration-200 group-hover:scale-102", className)}>
      {!imageError ? (
        <div className={cn("relative shrink-0 flex items-center", selected.h)}>
          <Image
            src="/branding/fole-space-logo.png"
            alt={alt}
            width={selected.w}
            height={selected.hNum}
            priority={priority}
            onError={() => setImageError(true)}
            className={cn("w-auto object-contain", selected.h)}
          />
        </div>
      ) : (
        /* Fallback wordmark if image fails or is missing */
        <div className="flex items-center gap-1.5 font-bold tracking-tight">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-900 dark:text-white font-extrabold text-base">FOLE</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">SPACE</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
