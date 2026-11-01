"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { LiquidGlass } from "@/components/ui/liquid-glass";

export type LiquidGlassDemoProps = {
  shape?: "circle" | "pill";
  scale?: number;
  aberration?: number;
  bevelDepth?: number;
  frost?: number;
  tint?: number;
  bgSrc?: string;
  headline?: string;
  subtext?: string;
};

export default function LiquidGlassDemo({
  shape = "circle",
  scale = 48,
  aberration = 14,
  bevelDepth = 37,
  frost = 0.4,
  tint = 0.12,
  bgSrc = "/images/fole-hero-campus.png",
  headline = "Bend the\nlight.",
  subtext = "FOLE Liquid Optical Dispersion & Refraction",
}: LiquidGlassDemoProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const size = shape === "pill" ? { w: 320, h: 120 } : { w: 200, h: 200 };

  return (
    <div
      ref={constraintsRef}
      className="relative h-[32rem] sm:h-[36rem] w-full overflow-hidden bg-neutral-900 rounded-3xl border border-white/10 select-none shadow-2xl"
    >
      <Image
        src={bgSrc}
        alt="FOLE Campus Scene"
        fill
        className="absolute inset-0 size-full object-cover"
        draggable={false}
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60 pointer-events-none" />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-8 text-center select-none z-10">
        <p className="text-5xl sm:text-6xl md:text-8xl leading-[0.95] font-black tracking-tighter text-white drop-shadow-lg">
          {headline.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </p>
        {subtext && (
          <p className="mt-4 text-xs sm:text-sm font-mono uppercase tracking-[0.2em] text-[#2EE585] font-bold">
            {subtext}
          </p>
        )}
        <div className="mt-8 grid w-full max-w-md grid-cols-12 gap-1.5">
          {Array.from({ length: 48 }).map((_, i) => (
            <span key={i} className="h-1.5 rounded-full bg-white/80" />
          ))}
        </div>
      </div>

      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        whileDrag={reduceMotion ? undefined : { scale: 1.04 }}
        className="absolute top-1/2 left-1/2 cursor-grab touch-none active:cursor-grabbing z-20"
        style={{
          width: size.w,
          height: size.h,
          marginLeft: -size.w / 2,
          marginTop: -size.h / 2,
        }}
      >
        <LiquidGlass
          radius={size.h / 2}
          scale={scale}
          aberration={aberration}
          bevelDepth={bevelDepth}
          frost={frost}
          tint={tint}
          className="size-full shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)]"
        />
      </motion.div>
    </div>
  );
}
