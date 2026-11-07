"use client";

import React from "react";
import { Shine } from "@animate-ui/react/primitives/effects/shine";

interface ShineWrapperProps {
  children: React.ReactNode;
  color?: string;
  opacity?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  asChild?: boolean;
}

export function ShineWrapper({
  children,
  color = "rgba(255, 255, 255, 0.45)",
  opacity = 0.35,
  duration = 950,
  className,
  style,
  asChild = false,
}: ShineWrapperProps) {
  return (
    <Shine
      asChild={asChild}
      color={color}
      opacity={opacity}
      duration={duration}
      enableOnHover={true}
      deg={-18}
      className={className}
      style={style}
    >
      {children}
    </Shine>
  );
}
