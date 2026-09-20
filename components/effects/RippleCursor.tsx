"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function RippleCursor() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);

  const visibleRef = useRef(false);
  const activeStateRef = useRef<"normal" | "button" | "link" | "card" | "input" | "video">("normal");

  useEffect(() => {
    // 1. Check touch / coarse pointer detection or admin route
    const isTouchDevice =
      window.matchMedia("(pointer: coarse)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (isTouchDevice || pathname?.startsWith("/admin")) {
      setMounted(false);
      return;
    }

    setMounted(true);

    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Is admin route check
    const isAdmin = pathname?.startsWith("/admin");

    const updateStateStyles = (state: "normal" | "button" | "link" | "card" | "input" | "video") => {
      if (activeStateRef.current === state) return;
      activeStateRef.current = state;

      const lens = lensRef.current;
      const aura = auraRef.current;
      if (!lens || !aura) return;

      if (state === "input") {
        container.style.opacity = isAdmin ? "0.1" : "0.2";
        lens.style.transform = "translate(-50%, -50%) scale(0.65)";
        aura.style.transform = "translate(-50%, -50%) scale(0.6)";
      } else if (state === "button") {
        container.style.opacity = isAdmin ? "0.35" : "1";
        lens.style.transform = "translate(-50%, -50%) scale(1.18)";
        lens.style.borderColor = "rgba(85, 215, 231, 0.4)";
        aura.style.transform = "translate(-50%, -50%) scale(1.3)";
      } else if (state === "link") {
        container.style.opacity = isAdmin ? "0.3" : "0.9";
        lens.style.transform = "translate(-50%, -50%) scale(0.92)";
        lens.style.borderColor = "rgba(185, 168, 255, 0.45)";
        aura.style.transform = "translate(-50%, -50%) scale(1.1)";
      } else if (state === "card") {
        container.style.opacity = isAdmin ? "0.25" : "0.85";
        lens.style.transform = "translate(-50%, -50%) scale(1.05)";
        lens.style.borderColor = "rgba(255, 255, 255, 0.35)";
        aura.style.transform = "translate(-50%, -50%) scale(1.45)";
      } else {
        // Normal
        container.style.opacity = isAdmin ? "0.25" : "0.75";
        lens.style.transform = "translate(-50%, -50%) scale(1)";
        lens.style.borderColor = "rgba(255, 255, 255, 0.25)";
        aura.style.transform = "translate(-50%, -50%) scale(1)";
      }
    };

    // ZERO DELAY Tracking:
    // Directly update translate3d in the pointermove event handler synchronously.
    const handlePointerMove = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      // Update position immediately with GPU-accelerated transform
      container.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      if (!visibleRef.current) {
        visibleRef.current = true;
        container.style.display = "block";
      }

      // Identify interactive element under pointer
      const target = e.target as HTMLElement | null;
      if (!target) {
        updateStateStyles("normal");
        return;
      }

      if (target.closest("input, textarea, select, [contenteditable='true']")) {
        updateStateStyles("input");
      } else if (target.closest("button, [role='button']")) {
        updateStateStyles("button");
      } else if (target.closest("a, [role='link']")) {
        updateStateStyles("link");
      } else if (target.closest("video, iframe, [data-video-player]")) {
        updateStateStyles("video");
      } else if (target.closest("[data-card], .group, article, .border")) {
        updateStateStyles("card");
      } else {
        updateStateStyles("normal");
      }
    };

    const handlePointerLeave = () => {
      visibleRef.current = false;
      container.style.display = "none";
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
    };
  }, [pathname]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform"
      style={{
        display: "none",
        transform: "translate3d(-100px, -100px, 0)",
        transition: "opacity 0.2s ease",
      }}
    >
      {/* 1. Atmospheric Soft Lavender / Cyan Cloud Aura */}
      <div
        ref={auraRef}
        className="absolute top-0 left-0 w-36 h-36 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 will-change-transform transition-transform duration-200 ease-out"
        style={{
          background:
            "radial-gradient(circle, rgba(185, 168, 255, 0.14) 0%, rgba(85, 215, 231, 0.05) 45%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* 2. Concentric Soft Ripple Wave 1 (Independent expanding pulse) */}
      <div
        ref={ring1Ref}
        className="absolute top-0 left-0 w-12 h-12 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 border border-indigo-400/20 will-change-transform"
        style={{
          background: "radial-gradient(circle, rgba(185, 168, 255, 0.08) 0%, rgba(85, 215, 231, 0.03) 60%, transparent 100%)",
          animation: "cursor-ripple-expand 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite",
        }}
      />

      {/* 3. Concentric Soft Ripple Wave 2 (Phase-offset wave) */}
      <div
        ref={ring2Ref}
        className="absolute top-0 left-0 w-12 h-12 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 border border-cyan-400/15 will-change-transform"
        style={{
          animation: "cursor-ripple-expand 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite 1.1s",
        }}
      />

      {/* 4. Central Transparent Glass Droplet / Lens (Center locked exactly to pointer) */}
      <div
        ref={lensRef}
        className="absolute top-0 left-0 w-8 h-8 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 border transition-all duration-150 ease-out will-change-transform flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.22) 0%, rgba(185, 168, 255, 0.12) 55%, rgba(85, 215, 231, 0.06) 100%)",
          borderColor: "rgba(255, 255, 255, 0.25)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          boxShadow:
            "0 0 16px rgba(185, 168, 255, 0.25), inset 0 0 8px rgba(255, 255, 255, 0.18)",
        }}
      >
        {/* Subtle pinpoint center droplet reflection */}
        <div
          className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_6px_rgba(255,255,255,0.8)]"
        />
      </div>
    </div>
  );
}
