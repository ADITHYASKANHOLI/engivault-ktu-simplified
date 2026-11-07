"use client";

import React, { useEffect, useState } from "react";
import GradientASCII from "@/components/GradientASCII";

export function MaterialsAsciiBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="page-sticky-bg-layer" aria-hidden="true">
      {/* Dark Navy Base (#07111F) */}
      <div className="absolute inset-0 bg-[#07111F]" />

      {/* CSS Gradient Fallback (visible immediately before WebGL2 compiles or if unsupported) */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(0,168,107,0.2),rgba(6,182,212,0.15)_45%,transparent_75%)] opacity-85"
      />
      <div className="absolute inset-0 bg-tech-grid-dark opacity-15 pointer-events-none" />

      {/* Persistent Canvas Container */}
      <div className="page-sticky-bg-canvas">
        {mounted && (
          <GradientASCII
            colors={['#07111F', '#00A86B', '#06B6D4', '#D9FFF4']}
            shape="horizon"
            characters=" .:-=+*#@"
            cellSize={18}
            density={0.72}
            glyphOpacity={0.75}
            gradientOpacity={0.68}
            glow={0.35}
            depthOfField={0.18}
            flicker={0.12}
            softness={0.55}
            scale={1}
            flow={0.55}
            speed={0.35}
            grain={0.04}
            variation={0}
            mouseInteraction={true}
            scrambleRadius={0.08}
            clickEffect="wave"
            intro={true}
            lightMode={false}
          />
        )}
      </div>

      {/* Top and Bottom ambient gradients for header and footer transitions */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07111F]/80 via-[#07111F]/30 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07111F]/90 via-[#07111F]/40 to-transparent pointer-events-none" />
    </div>
  );
}
