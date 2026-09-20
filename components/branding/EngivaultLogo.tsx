import React from "react";
import Image from "next/image";
import Link from "next/link";

export interface EngivaultLogoProps {
  variant?: "full" | "icon" | "admin";
  size?: "sm" | "md" | "lg" | "xl";
  showSubtext?: boolean;
  subtext?: string;
  className?: string;
  href?: string;
  priority?: boolean;
}

export function EngivaultLogo({
  variant = "full",
  size = "md",
  showSubtext = true,
  subtext,
  className = "",
  href = "/",
  priority = false,
}: EngivaultLogoProps) {
  const sizeMap = {
    sm: { icon: 28, text: "text-base", sub: "text-[9px]" },
    md: { icon: 34, text: "text-lg", sub: "text-[10px]" },
    lg: { icon: 42, text: "text-xl", sub: "text-[11px]" },
    xl: { icon: 54, text: "text-2xl", sub: "text-xs" },
  };

  const currentSize = sizeMap[size];

  const defaultSubtext =
    variant === "admin"
      ? "ADMIN CONTROL"
      : "KTU LEARNING REPOSITORY";

  const renderedSubtext = subtext || defaultSubtext;

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Vault Shield / Monogram Mark */}
      <div
        className="relative shrink-0 rounded-xl overflow-hidden shadow-xs border border-blue-900/10"
        style={{ width: currentSize.icon, height: currentSize.icon }}
      >
        <Image
          src="/branding/engivault-logo.png"
          alt="ENGIVAULT Logo"
          width={currentSize.icon * 2}
          height={currentSize.icon * 2}
          className="w-full h-full object-cover"
          priority={priority}
        />
      </div>

      {/* Typography Lockup */}
      {variant !== "icon" && (
        <div className="flex flex-col">
          <div className={`font-black tracking-tight leading-none text-slate-900 ${currentSize.text}`}>
            ENGI<span className="text-blue-700">VAULT</span>
          </div>
          {showSubtext && (
            <span
              className={`font-mono font-bold tracking-wider text-slate-500 uppercase leading-tight mt-0.5 ${currentSize.sub}`}
            >
              {renderedSubtext}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex hover:opacity-90 transition-opacity">
      {content}
    </Link>
  );
}
