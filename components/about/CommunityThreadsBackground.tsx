"use client";

import React, { useEffect, useState } from "react";
import Threads from "@/components/Threads";

export function CommunityThreadsBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="page-sticky-bg-layer" aria-hidden="true">
      {/* Deep Navy Base (#07111F) */}
      <div className="absolute inset-0 bg-[#07111F]" />

      {/* Emerald & Cyan CSS Gradient Fallback */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_35%,rgba(0,168,107,0.2),rgba(6,182,212,0.16)_45%,transparent_75%)] opacity-85"
      />
      <div className="absolute inset-0 bg-tech-grid-dark opacity-10 pointer-events-none" />

      {/* Persistent Canvas Container */}
      <div className="page-sticky-bg-canvas">
        {mounted && (
          <Threads
            color={[0.0, 0.66, 0.42]}
            accentColor={[0.02, 0.71, 0.83]}
            amplitude={1.4}
            distance={0.4}
            enableMouseInteraction={true}
            lineCount={75}
            thickness={0.55}
            softness={1.3}
            speed={0.4}
            waves={1.0}
            split={0.035}
            fray={0.4}
            angle={25}
            seed={0}
            parting={0.18}
            taper={0.85}
            brightness={1.15}
            fade={0.2}
            opacity={0.78}
            paused={false}
          />
        )}
      </div>

      {/* Top and Bottom ambient gradients */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07111F]/80 via-[#07111F]/30 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#07111F]/90 via-[#07111F]/40 to-transparent pointer-events-none" />
    </div>
  );
}
