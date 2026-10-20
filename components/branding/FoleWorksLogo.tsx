"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FoleWorksLogoProps {
  /**
   * Predefined size presets that scale dimensions while preserving
   * authentic 1:1 square aspect ratio.
   * sm: ~28-32px (compact header / mobile badge)
   * md: ~40-48px (standard desktop header / cards)
   * lg: ~56-64px (section headers)
   * xl: ~80-112px (large hero presentation)
   */
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  href?: string | null;
  priority?: boolean;
  alt?: string;
  showWordmark?: boolean;
}

export function FoleWorksLogo({
  size = "md",
  className = "",
  href = "/fole-works",
  priority = false,
  alt = "FOLE WORKS — Operational & Professional Activities",
  showWordmark = true,
}: FoleWorksLogoProps) {
  const sizeMap = {
    sm: { img: "w-7 h-7 sm:w-8 sm:h-8", text: "text-sm", sub: "text-[9px]" },
    md: { img: "w-10 h-10 sm:w-11 sm:h-11", text: "text-base sm:text-lg", sub: "text-[10px]" },
    lg: { img: "w-14 h-14 sm:w-16 sm:h-16", text: "text-xl sm:text-2xl", sub: "text-xs" },
    xl: { img: "w-20 h-20 sm:w-28 sm:h-28", text: "text-2xl sm:text-4xl", sub: "text-xs sm:text-sm" },
  };

  const selected = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 sm:gap-3 group select-none", className)}>
      {/* Official FOLE WORKS Emblem (1024x1024 1:1 ratio preserved) */}
      <div className={cn(
        "relative rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-slate-950 p-1 border border-emerald-500/30 shadow-xs transition-transform duration-200 group-hover:scale-105",
        selected.img
      )}>
        <Image
          src="/branding/fole-works-logo.png"
          alt={alt}
          width={1024}
          height={1024}
          priority={priority}
          className="w-full h-full object-contain"
        />
      </div>

      {showWordmark && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={cn("font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors font-mono", selected.text)}>
              FOLE
            </span>
            <span className={cn("font-black tracking-widest text-emerald-400 uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40", selected.sub)}>
              WORKS
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase hidden sm:inline-block">
            FOLE CEV Initiatives
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
