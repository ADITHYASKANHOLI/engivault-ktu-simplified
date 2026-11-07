"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface AnimatedTooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function AnimatedTooltip({
  content,
  children,
  side = "bottom",
  className,
}: AnimatedTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sideStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex items-center justify-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: side === "top" ? 4 : side === "bottom" ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="tooltip"
            className={`absolute ${sideStyles[side]} z-50 pointer-events-none px-2.5 py-1 rounded-md bg-[#050908] text-white text-[11px] font-mono font-medium tracking-wide shadow-md whitespace-nowrap border border-white/10 ${className || ""}`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

