"use client";

import React from "react";
import { GradientText } from "@animate-ui/react/primitives/texts/gradient";

const FOLE_WORKS_GRADIENT =
  "linear-gradient(90deg, #059669 0%, #10B981 25%, #06B6D4 50%, #10B981 75%, #059669 100%)";

export function FoleWorksHeading() {
  return (
    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
      FOLE{" "}
      <span className="font-mono inline-block">
        <GradientText
          text="WORKS"
          gradient={FOLE_WORKS_GRADIENT}
          neon={false}
        />
      </span>
    </h1>
  );
}

