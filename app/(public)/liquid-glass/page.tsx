"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Sliders,
  Info,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Zap,
} from "lucide-react";
import LiquidGlassDemo from "@/components/liquid-glass-demo";
import {
  LiquidGlassButton,
  LiquidGlassCard,
  LiquidGlassBadge,
  LiquidGlassPanel,
} from "@/components/ui/liquid-glass";

export default function LiquidGlassPage() {
  const [shape, setShape] = useState<"circle" | "pill">("circle");
  const [scale, setScale] = useState(48);
  const [aberration, setAberration] = useState(14);
  const [bevelDepth, setBevelDepth] = useState(37);
  const [frost, setFrost] = useState(0.4);
  const [tint, setTint] = useState(0.12);

  return (
    <main className="min-h-screen bg-[#07140E] text-slate-100 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-emerald-950/80 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to FOLE Home</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400/80 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-900/60">
            <Sparkles className="w-3.5 h-3.5 text-[#2EE585]" />
            <span>Aceternity UI • Liquid Glass Engine</span>
          </div>
        </div>

        {/* Header Title Section */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono uppercase tracking-widest font-bold">
            Interactive Optical Surface
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans">
            Snell&apos;s-Law Liquid Glass
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            A dynamic optical refraction surface powered by SVG displacement maps and chromatic aberration. Drag the glass lens across the campus canvas below to experience light-bending translucency.
          </p>
        </div>

        {/* Interactive Master Demonstration Canvas */}
        <div className="space-y-6">
          <LiquidGlassDemo
            shape={shape}
            scale={scale}
            aberration={aberration}
            bevelDepth={bevelDepth}
            frost={frost}
            tint={tint}
            bgSrc="/images/fole-hero-campus.png"
            headline={"Bend the\nlight."}
            subtext="FOLE Optical Refraction & Dispersion"
          />

          {/* Interactive Controls Bar */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#092214]/70 border border-emerald-900/60 backdrop-blur-md shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-950/80 pb-4">
              <div className="flex items-center gap-2.5 text-sm font-bold text-white font-mono uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-[#2EE585]" />
                <span>Refraction Parameters</span>
              </div>

              {/* Shape Toggle */}
              <div className="flex items-center gap-2 bg-[#050E09] p-1 rounded-xl border border-emerald-950">
                <button
                  type="button"
                  onClick={() => setShape("circle")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    shape === "circle"
                      ? "bg-[#00C853] text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Circle Lens
                </button>
                <button
                  type="button"
                  onClick={() => setShape("pill")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    shape === "pill"
                      ? "bg-[#00C853] text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pill Lens
                </button>
              </div>
            </div>

            {/* Parameter Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Scale / Displacement */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Scale (Bend)</span>
                  <span className="text-emerald-400 font-bold">{scale}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="2"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full accent-[#00C853] cursor-pointer"
                />
              </div>

              {/* Chromatic Aberration */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Aberration</span>
                  <span className="text-emerald-400 font-bold">{aberration}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={aberration}
                  onChange={(e) => setAberration(Number(e.target.value))}
                  className="w-full accent-[#00C853] cursor-pointer"
                />
              </div>

              {/* Bevel Depth */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Bevel Depth</span>
                  <span className="text-emerald-400 font-bold">{bevelDepth}px</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={bevelDepth}
                  onChange={(e) => setBevelDepth(Number(e.target.value))}
                  className="w-full accent-[#00C853] cursor-pointer"
                />
              </div>

              {/* Frost (Blur) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Frost (Blur)</span>
                  <span className="text-emerald-400 font-bold">{frost.toFixed(2)}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={frost}
                  onChange={(e) => setFrost(Number(e.target.value))}
                  className="w-full accent-[#00C853] cursor-pointer"
                />
              </div>

              {/* Tint */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Body Tint</span>
                  <span className="text-emerald-400 font-bold">{Math.round(tint * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.02"
                  value={tint}
                  onChange={(e) => setTint(Number(e.target.value))}
                  className="w-full accent-[#00C853] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Practical Component Integration Showcase: Liquid Glass in UI Elements */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-400 font-mono">
            <Layers className="w-4 h-4" />
            <span>UI Integration Examples & Texture Pack Components</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Example 1: Liquid Glass Button */}
            <div className="p-6 rounded-2xl bg-[#092214]/40 border border-emerald-950 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">LiquidGlassButton</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive refractive pill button with Snell&apos;s-law refraction, focus rings, and hover states.
                </p>
              </div>

              <div className="pt-2">
                <LiquidGlassButton
                  scale={24}
                  bevelDepth={12}
                  aberration={4}
                  tint={0.16}
                  onClick={() => alert("Liquid Glass Button Clicked!")}
                >
                  <Zap className="w-3.5 h-3.5 text-[#00E58B]" />
                  <span>Explore Lectures</span>
                </LiquidGlassButton>
              </div>
            </div>

            {/* Example 2: Liquid Glass Badge */}
            <div className="p-6 rounded-2xl bg-[#092214]/40 border border-emerald-950 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">LiquidGlassBadge</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compact optical glass chip for status indicators, academic accreditation, and tags.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <LiquidGlassBadge tint={0.2} frost={0.4}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00E58B] animate-pulse" />
                    <span className="text-white font-mono text-[11px] font-bold">KTU 2024 SCHEME</span>
                  </div>
                </LiquidGlassBadge>
              </div>
            </div>

            {/* Example 3: Liquid Glass Card */}
            <div className="p-6 rounded-2xl bg-[#092214]/40 border border-emerald-950 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">LiquidGlassCard</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Full card surface with optical dispersion, top specular highlight, and inner lighting.
                </p>
              </div>

              <div className="pt-2">
                <LiquidGlassCard radius={18} scale={20} bevelDepth={14} aberration={3} tint={0.18} glow>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Open Commons</span>
                    <span className="text-[10px] font-mono font-bold bg-[#00A86B]/30 text-[#00E58B] px-2 py-0.5 rounded-full border border-[#00A86B]/50">
                      LIVE
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">42 Desks Available</div>
                </LiquidGlassCard>
              </div>
            </div>
          </div>

          {/* Example 4: Wide Architectural LiquidGlassPanel */}
          <div className="mt-4">
            <LiquidGlassPanel radius={24} scale={26} bevelDepth={16} aberration={3} tint={0.16}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-white font-mono">LiquidGlassPanel Architectural Container</h4>
                  <p className="text-xs text-slate-300">
                    Full-width translucent glass surface designed for dashboards, dialog banners, and floating hero modules.
                  </p>
                </div>
                <LiquidGlassButton scale={20} bevelDepth={10} aberration={2} tint={0.2}>
                  <span>Get Started →</span>
                </LiquidGlassButton>
              </div>
            </LiquidGlassPanel>
          </div>
        </div>

        {/* Technical Architecture & Browser Support Notes */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#050E09] border border-emerald-950 text-slate-300 space-y-6">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white font-mono">
            <Info className="w-4 h-4 text-[#2EE585]" />
            <span>Optical Physics & Compatibility Specifications</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#2EE585]" />
                <span>Snell&apos;s Law Displacement</span>
              </div>
              <p className="text-slate-400">
                Calculates light angles as rays transition through differing refractive indices (air to glass), creating authentic lens edge compression without 3D WebGL overhead.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#2EE585]" />
                <span>Multi-Pass Aberration</span>
              </div>
              <p className="text-slate-400">
                Separates Red, Green, and Blue light channels via SVG feColorMatrix filters to reproduce natural chromatic fringing at the lens periphery.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <ShieldCheck className="w-4 h-4 text-[#2EE585]" />
                <span>Graceful Browser Fallbacks</span>
              </div>
              <p className="text-slate-400">
                Chromium renders full SVG refraction; Safari and Firefox automatically fall back to frosted glass backdrop-filter; devices requesting reduced transparency receive a clean solid opaque surface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
