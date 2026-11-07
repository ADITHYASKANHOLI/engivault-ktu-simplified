"use client";

import React, { useEffect, useState } from "react";
import Particles from "@/components/Particles";

export function EventsParticlesBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="page-sticky-bg-layer" aria-hidden="true">
      {/* Deep Navy Base (#07111F) */}
      <div className="absolute inset-0 bg-[#07111F]" />

      {/* Matching CSS Gradient Fallback */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_35%,rgba(0,168,107,0.22),rgba(6,182,212,0.14)_45%,transparent_75%)] opacity-85"
      />
      <div className="absolute inset-0 bg-tech-grid-dark opacity-10 pointer-events-none" />

      {/* Persistent Canvas Container */}
      <div className="page-sticky-bg-canvas">
        {mounted && (
          <Particles
            particleCount={150}
            particleSpread={11}
            speed={0.12}
            particleColors={['#00A86B', '#06B6D4', '#7CFF67', '#FFFFFF']}
            moveParticlesOnHover={true}
            particleHoverFactor={0.8}
            alphaParticles={true}
            particleBaseSize={75}
            sizeRandomness={0.85}
            cameraDistance={22}
            shape="circle"
            glow={0.55}
            twinkle={0.3}
            depthOfField={0.35}
            connections={true}
            connectionDistance={110}
            hoverEffect="parallax"
            hoverRadius={130}
            clickBurst={true}
            drift="up"
            driftSpeed={0.35}
            variation={0}
            intro={true}
            opacity={0.72}
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
