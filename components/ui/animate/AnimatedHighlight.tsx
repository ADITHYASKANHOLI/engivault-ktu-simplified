"use client";

import React from "react";
import { HighlightText } from "@animate-ui/react/primitives/texts/highlight";

interface AnimatedHighlightProps {
  text: string;
  delay?: number;
  className?: string;
}

export function AnimatedHighlight({
  text,
  delay = 150,
  className = "font-semibold text-emerald-800 dark:text-emerald-300 px-1 py-0.5 rounded-sm",
}: AnimatedHighlightProps) {
  return (
    <HighlightText
      text={text}
      inView={true}
      inViewOnce={true}
      delay={delay}
      className={className}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(0, 168, 107, 0.22), rgba(6, 182, 212, 0.22))",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
      }}
    />
  );
}

