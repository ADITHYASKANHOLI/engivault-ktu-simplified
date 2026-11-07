"use client";

import React, { useEffect, useState } from "react";
import GridScan from "@/components/GridScan";

export function LearnGridScanBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="page-sticky-bg-layer" aria-hidden="true">
      {/* Deep Navy Base (#07111F) */}
      <div className="absolute inset-0 bg-[#07111F]" />

      {/* Cybernetic Grid/Cyan CSS Gradient Fallback */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_35%,rgba(6,182,212,0.18),rgba(23,50,74,0.3)_50%,transparent_75%)] opacity-85"
      />
      <div className="absolute inset-0 bg-tech-grid-dark opacity-15 pointer-events-none" />

      {/* Persistent Canvas Container */}
      <div className="page-sticky-bg-canvas">
        {mounted && (
          <GridScan
            linesColor="#17324A"
            scanColor="#06B6D4"
            cells={8}
            lineThickness={1}
            lineStyle="solid"
            depth={3}
            depthFade={0.65}
            parallax={0.45}
            points={true}
            reflection={0.25}
            shading={0.6}
            scanDirection="forward"
            scanDuration={3.2}
            scanDelay={2}
            scanWidth={0.8}
            trail={0.45}
            glow={0.5}
            autoScan={true}
            interactive={true}
            clickEffect="ping"
            enableWebcam={false}
            showPreview={false}
            enableGyro={false}
            intro={true}
            lightMode={false}
          />
        )}
      </div>

      {/* Top and Bottom ambient gradients */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07111F]/80 via-[#07111F]/30 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#07111F]/90 via-[#07111F]/40 to-transparent pointer-events-none" />
    </div>
  );
}
