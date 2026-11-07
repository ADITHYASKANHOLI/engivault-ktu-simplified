"use client";

import React from "react";
import {
  ScrollProgressProvider,
  ScrollProgress,
} from "@animate-ui/react/primitives/scroll-progress";

export function GlobalScrollProgress() {
  return (
    <ScrollProgressProvider global={true}>
      <ScrollProgress
        mode="width"
        className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 pointer-events-none origin-left shadow-[0_0_8px_rgba(0,168,107,0.5)]"
      />
    </ScrollProgressProvider>
  );
}

