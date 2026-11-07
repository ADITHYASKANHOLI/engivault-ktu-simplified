"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { MorphingText } from "@animate-ui/react/primitives/texts/morphing";

const TAGLINE_PHRASES = [
  "Learn Together.",
  "Build Together.",
  "Grow Together.",
];

export function FoleSpaceTagline() {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-4 max-w-full">
      <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      <span className="inline-block min-w-[145px] sm:min-w-[160px] text-left">
        <MorphingText
          text={TAGLINE_PHRASES}
          loop={true}
          holdDelay={2500}
        />
      </span>
    </div>
  );
}

