"use client";

import React, { useEffect, useState } from "react";
import Aurora from "@/components/Aurora";

export function FoleWorksAuroraBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* Dark base background beneath transparent canvas */}
      <div className="absolute inset-0 bg-[#050811]" />

      {/* Matching CSS Gradient Fallback (visible immediately before WebGL2 compiles or if unsupported) */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_35%,rgba(82,39,255,0.35),rgba(124,255,103,0.18)_50%,transparent_75%)] opacity-85"
      />

      {/* Tech grid texture for engineering atmosphere */}
      <div className="absolute inset-0 bg-tech-grid-dark opacity-10 pointer-events-none" />

      {/* EXACT AURORA CONFIGURATION — DO NOT CHANGE */}
      <div style={{ width: "100%", height: "600px", position: "relative" }}>
        {mounted && (
          <Aurora
            colorStops={["#5227FF", "#7cff67", "#5227FF"]}
            amplitude={1}
            blend={0.5}
            height={0.45}
            speed={1}
            glow={0.6}
          />
        )}
      </div>

      {/* Soft gradient edge masks to blend the 600px height smoothly into hero */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#050811] via-[#050811]/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#050811] via-[#050811]/80 to-transparent" />
    </div>
  );
}
