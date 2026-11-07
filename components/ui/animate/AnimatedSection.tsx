"use client";

import React from "react";
import { Fade } from "@animate-ui/react/primitives/effects/fade";

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  asChild?: boolean;
}

export function AnimatedSection({
  children,
  delay = 50,
  className,
  asChild = false,
}: AnimatedSectionProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <Fade
        asChild
        inView={true}
        inViewOnce={true}
        inViewMargin="-40px"
        delay={delay}
        initialOpacity={0}
        opacity={1}
        className={className}
      >
        {children}
      </Fade>
    );
  }

  return (
    <Fade
      inView={true}
      inViewOnce={true}
      inViewMargin="-40px"
      delay={delay}
      initialOpacity={0}
      opacity={1}
      className={className}
    >
      {children}
    </Fade>
  );
}
