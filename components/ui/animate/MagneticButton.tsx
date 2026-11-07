"use client";

import React from "react";
import { Magnetic } from "@animate-ui/react/primitives/effects/magnetic";

interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number;
  range?: number;
  className?: string;
  asChild?: boolean;
}

export function MagneticButton({
  children,
  strength = 0.28,
  range = 80,
  className,
  asChild = true,
}: MagneticButtonProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <Magnetic
        asChild
        strength={strength}
        range={range}
        onlyOnHover={true}
        disableOnTouch={true}
        springOptions={{ stiffness: 180, damping: 14, mass: 0.3 }}
        className={className}
      >
        {children}
      </Magnetic>
    );
  }

  return (
    <Magnetic
      strength={strength}
      range={range}
      onlyOnHover={true}
      disableOnTouch={true}
      springOptions={{ stiffness: 180, damping: 14, mass: 0.3 }}
      className={className}
    >
      {children}
    </Magnetic>
  );
}
