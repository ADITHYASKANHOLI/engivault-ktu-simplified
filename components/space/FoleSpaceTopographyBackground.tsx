"use client";

import React, { useEffect, useState } from "react";
import Topography from "@/components/Topography";

export function FoleSpaceTopographyBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fole-space-topography-layer" aria-hidden="true">
      {/* Deep Navy Base Background (#07111F) */}
      <div className="absolute inset-0 bg-[#07111F]" />

      {/* CSS Gradient & Contour Fallback (visible immediately before WebGL2 compiles or if unsupported) */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(79,124,255,0.25),rgba(6,182,212,0.12)_50%,transparent_75%)] opacity-85"
      />
      <div className="absolute inset-0 bg-tech-grid-dark opacity-15 pointer-events-none" />

      {/* Topography Canvas Wrapper */}
      <div className="fole-space-topography-canvas">
        {mounted && (
          <Topography
            color="#4f7cff"
            lineCount={22}
            lineWidth={1.2}
            elevation={1}
            foreground={0.2}
            tilt={32}
            speed={0.25}
            direction="forward"
            glow={0.6}
            depthOfField={0.4}
            fog={0.35}
            hoverEffect="lift"
            clickEffect="pulse"
          />
        )}
      </div>

      {/* Subtle top ambient gradient for navigation contrast */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07111F]/80 via-[#07111F]/30 to-transparent pointer-events-none" />
    </div>
  );
}
