"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface EngivaultLogoProps {
  /**
   * "full" displays the complete official ENGIVAULT logo artwork freely.
   * "compact" displays a streamlined smaller scale variant for tight mobile or collapsed states.
   */
  variant?: "full" | "compact";
  /**
   * Predefined size presets that scale height while letting width calculate automatically
   * according to the authentic 16:9 aspect ratio.
   * sm: ~28-36px (compact / mobile)
   * md: ~38-48px (standard header desktop / tablet)
   * lg: ~48-60px (login / splash / footer)
   * xl: ~60-80px (large hero display)
   */
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  href?: string | null;
  priority?: boolean;
  alt?: string;
  subtext?: string;
}

export function EngivaultLogo({
  variant = "full",
  size = "md",
  className = "",
  href = "/",
  priority = false,
  alt = "ENGIVAULT — KTU Learning Simplified",
}: EngivaultLogoProps) {
  // Height presets respecting recommended values from design specs:
  // Desktop: 38–52px; Tablet: 34–44px; Mobile: 30–38px
  const sizeClasses = {
    sm: "h-7 sm:h-8 md:h-9",
    md: "h-9 sm:h-10 md:h-11 lg:h-12",
    lg: "h-11 sm:h-13 md:h-14",
    xl: "h-14 sm:h-16 md:h-20",
  };

  const selectedSize =
    variant === "compact" ? "h-7 sm:h-8" : sizeClasses[size] || sizeClasses.md;

  // Render the official logo artwork directly with NO enclosing boxes, NO borders, NO background tiles, NO clipping
  const logoImage = (
    <Image
      src="/branding/engivault-logo.png"
      alt={alt}
      width={1024}
      height={576}
      priority={priority}
      className={cn(
        "w-auto object-contain select-none transition-transform duration-150 hover:scale-[1.02]",
        selectedSize,
        className
      )}
      style={{ width: "auto" }}
    />
  );

  if (!href) {
    return logoImage;
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 rounded transition-opacity hover:opacity-95"
      aria-label="ENGIVAULT Homepage"
    >
      {logoImage}
    </Link>
  );
}
