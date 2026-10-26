"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FoleLogoVectorProps {
  className?: string;
  textColor?: string;
  greenColor?: string;
  href?: string | null;
  priority?: boolean;
}

export function FoleLogoVector({
  className = "h-8 w-auto",
  textColor = "#050E09",
  greenColor = "#00C853",
  href,
}: FoleLogoVectorProps) {
  const svgContent = (
    <svg
      viewBox="-400 -120 800 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", className)}
      aria-label="FOLE — Free Open Learning & Education"
      role="img"
    >
      {/* F */}
      <path
        fill={textColor}
        d="M-360,-95 H-210 A8,8 0 0 1 -202,-87 V-57 A8,8 0 0 1 -210,-49 H-306 V-20 H-230 A8,8 0 0 1 -222,-12 V16 A8,8 0 0 1 -230,24 H-306 V87 A8,8 0 0 1 -314,95 H-360 A8,8 0 0 1 -368,87 V-87 A8,8 0 0 1 -360,-95 Z"
      />
      {/* O Outer Circle */}
      <circle cx="-92" cy="0" r="102" fill={textColor} />
      {/* O Inner Authentic Green Node & Open Book Leaves */}
      <circle cx="-92" cy="-46" r="21" fill={greenColor} />
      <path
        fill={greenColor}
        d="M-87,-6 C-70,-24 -44,-30 -30,-28 L-30,34 C-47,32 -70,40 -87,58 Z"
      />
      <path
        fill={greenColor}
        d="M-97,-6 C-114,-24 -140,-30 -154,-28 L-154,34 C-137,32 -114,40 -97,58 Z"
      />
      {/* L */}
      <path
        fill={textColor}
        d="M36,-95 H82 A8,8 0 0 1 90,-87 V49 H182 A8,8 0 0 1 190,57 V87 A8,8 0 0 1 182,95 H36 A8,8 0 0 1 28,87 V-87 A8,8 0 0 1 36,-95 Z"
      />
      {/* E */}
      <path
        fill={textColor}
        d="M214,-95 H364 A8,8 0 0 1 372,-87 V-59 A8,8 0 0 1 364,-51 H268 V-21 H344 A8,8 0 0 1 352,-13 V13 A8,8 0 0 1 344,21 H268 V51 H364 A8,8 0 0 1 372,59 V87 A8,8 0 0 1 364,95 H214 A8,8 0 0 1 206,87 V-87 A8,8 0 0 1 214,-95 Z"
      />
    </svg>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded transition-opacity hover:opacity-90"
        aria-label="FOLE Home"
      >
        {svgContent}
      </Link>
    );
  }

  return svgContent;
}
