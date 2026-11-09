"use client";

import React from "react";
import { Magnetic } from "@animate-ui/react/primitives/effects/magnetic";

interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number;
  range?: number;
  className?: string;
  style?: React.CSSProperties;
  asChild?: boolean;
}

export function MagneticButton({
  children,
  strength = 0.28,
  range = 80,
  className,
  style,
  asChild = true,
}: MagneticButtonProps) {
  if (asChild && React.isValidElement(children)) {
    const childStyle = (children.props as { style?: React.CSSProperties })?.style;
    const resolvedStyle: React.CSSProperties = {
      ...(childStyle?.display ? { display: childStyle.display } : { display: undefined }),
      ...style,
    };

    return (
      <Magnetic
        asChild
        strength={strength}
        range={range}
        onlyOnHover={true}
        disableOnTouch={true}
        springOptions={{ stiffness: 180, damping: 14, mass: 0.3 }}
        className={className}
        style={resolvedStyle}
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
      style={style}
    >
      {children}
    </Magnetic>
  );
}
