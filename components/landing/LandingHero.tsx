"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Play,
  BookOpen,
  Users,
  Calendar,
  Lightbulb,
  Leaf,
  Boxes,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FoleLogoVector } from "@/components/branding/FoleLogoVector";
import { HeroVideoDialog } from "@/components/landing/HeroVideoDialog";
import { LiquidGlassButton } from "@/components/ui/liquid-glass";

export interface LandingHeroProps {
  totalSubjects?: number;
}

export function LandingHero({ totalSubjects: _totalSubjects = 12 }: LandingHeroProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const watchVideoBtnRef = useRef<HTMLButtonElement | null>(null);

  const slidesData = [
    {
      id: "01",
      pillar: "LEARNING",
      detail: "Curriculum lectures, handwritten notes & KTU question vaults.",
    },
    {
      id: "02",
      pillar: "INNOVATION",
      detail: "Collaborative campus hackathons, open spaces & workshops.",
    },
    {
      id: "03",
      pillar: "COMMUNITY",
      detail: "A student-driven collective turning ideas into real-world impact.",
    },
  ];

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? slidesData.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev === slidesData.length - 1 ? 0 : prev + 1));
  };

  const scrollToCurriculum = () => {
    const el = document.getElementById("featured-subjects") || document.getElementById("latest-classes");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full min-h-[780px] sm:min-h-[900px] lg:min-h-screen pt-24 sm:pt-28 md:pt-32 pb-6 sm:pb-8 flex flex-col justify-between overflow-hidden bg-[#050908]">
      {/* ---------------- 1. BACKGROUND PHOTOGRAPHIC & ARCHITECTURAL ART LAYER ---------------- */}
      <div className="absolute inset-0 z-0 select-none overflow-hidden">
        <Image
          src="/images/fole-hero-campus.png"
          alt="FOLE Architectural Campus at Golden Hour"
          fill
          priority
          quality={90}
          className="object-cover object-[center_35%] lg:object-center transform scale-[1.01]"
          sizes="100vw"
        />

        {/* Soft atmospheric gradient transitions for optimal legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/60 to-transparent lg:w-[60%] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050908] via-transparent to-transparent h-44 bottom-0 pointer-events-none" />
      </div>

      {/* Top-Left Authentic Halftone Dot Pattern */}
      <div
        className="absolute top-0 left-0 w-80 h-80 opacity-60 pointer-events-none z-[2] select-none"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(#00A86B 1.5px, transparent 1.5px)",
          backgroundSize: "14px 14px",
          maskImage: "radial-gradient(ellipse at 0% 0%, black 35%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 0% 0%, black 35%, transparent 75%)",
        }}
      />

      {/* Bottom-Left Geometric Halftone Wedge & Sweep */}
      <div
        className="absolute bottom-0 left-0 w-[420px] h-[340px] pointer-events-none z-[2] select-none overflow-hidden hidden sm:block"
        aria-hidden="true"
      >
        <svg viewBox="0 0 420 340" className="w-full h-full" fill="none">
          <defs>
            <pattern id="halftone-bl" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.3" fill="#00E58B" fillOpacity="0.4" />
            </pattern>
            <linearGradient id="wedge-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#003D2D" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#00A86B" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d="M-20,360 L260,360 L-20,100 Z" fill="url(#wedge-grad)" />
          <path d="M-20,360 L260,360 L-20,100 Z" fill="url(#halftone-bl)" />
          <path d="M-20,360 C100,300 240,290 420,350 L420,360 Z" fill="#00A86B" fillOpacity="0.3" />
        </svg>
      </div>

      {/* ---------------- 2. MAIN HERO CONTENT AREA ---------------- */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4 sm:pt-8 lg:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Authentic Brand Typography & CTAs */}
          <div className="lg:col-span-8 max-w-2xl space-y-4 sm:space-y-5">
            {/* Small uppercase label + green horizontal accent line */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] sm:text-xs font-black tracking-[0.24em] text-[#050908] uppercase font-mono">
                FREE OPEN LEARNING & EDUCATION
              </span>
              <span className="h-0.5 w-12 sm:w-16 bg-[#00A86B] rounded-full inline-block" />
            </div>

            {/* Oversized Authentic FOLE Brand Logo */}
            <div className="py-0.5">
              <FoleLogoVector
                className="w-[min(290px,calc(100vw-2rem))] sm:w-[390px] md:w-[460px] lg:w-[490px] h-auto text-[#050908]"
                textColor="#050908"
                greenColor="#00A86B"
              />
            </div>

            {/* Tagline: IDEAS INTO IMPACT */}
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#050908] tracking-[0.16em] sm:tracking-[0.22em] uppercase leading-tight font-sans">
              IDEAS INTO IMPACT
            </h1>

            {/* Supporting 4 Pillar Words */}
            <div className="space-y-2 pt-0.5">
              <div className="text-xs sm:text-[13px] font-black tracking-[0.22em] text-[#050908]/85 uppercase space-y-1 font-mono">
                <div>LEARNING</div>
                <div>PEOPLE</div>
                <div>OPPORTUNITIES</div>
                <div>A BRIGHTER TOMORROW</div>
              </div>

              {/* Small Green Underline Bar under Pillars */}
              <div className="h-0.5 sm:h-1 w-16 sm:w-20 bg-[#00A86B] rounded-full mt-2.5 mb-4" />
            </div>

            {/* Action Buttons: Explore FOLE & Watch Video */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 pt-1">
              {/* Primary Green CTA */}
              <Link
                href="/subjects"
                className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm font-bold text-white bg-[#00A86B] hover:bg-[#008f5a] shadow-lg shadow-emerald-700/30 hover:shadow-emerald-700/40 hover:scale-[1.02] active:scale-[0.98] transition-all group"
              >
                <span>Explore FOLE</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Secondary Translucent Liquid Glass Video CTA */}
              <LiquidGlassButton
                ref={watchVideoBtnRef}
                onClick={() => setIsVideoOpen(true)}
                radius={999}
                bevelDepth={12}
                scale={36}
                aberration={3}
                frost={0.5}
                tint={0.2}
                aria-label="Watch FOLE Intro Video"
                contentClassName="gap-2.5 px-5 sm:px-7 py-3 sm:py-3.5"
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white ml-0.5" />
                </div>
                <span className="text-xs sm:text-sm">Watch Video</span>
              </LiquidGlassButton>
            </div>
          </div>

          {/* Right Column: Three Identity Statements with Green Icons (from Reference Mockup) */}
          <div className="lg:col-span-4 hidden lg:flex flex-col items-start xl:items-end space-y-8 pt-8 pr-2 xl:pr-6 select-none">
            {/* Statement 1: Tech People Impact */}
            <div className="flex items-center gap-3.5 text-left group">
              <Leaf className="w-6 h-6 text-[#00E58B] shrink-0" />
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white font-mono leading-snug">
                <div>TECH</div>
                <div>PEOPLE</div>
                <div>IMPACT</div>
              </div>
            </div>

            {/* Statement 2: Innovation For Real Life */}
            <div className="flex items-center gap-3.5 text-left group">
              <Boxes className="w-6 h-6 text-[#00E58B] shrink-0" />
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white font-mono leading-snug">
                <div>INNOVATION</div>
                <div>FOR REAL</div>
                <div>LIFE</div>
              </div>
            </div>

            {/* Statement 3: FOLE Est. 2025 */}
            <div className="flex items-center gap-3.5 text-left group">
              <Sparkles className="w-6 h-6 text-[#00E58B] shrink-0" />
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white font-mono leading-snug">
                <div>FOLE</div>
                <div>EST. 2025</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 3. BOTTOM FEATURE STRIP & CAROUSEL / SCROLL CONTROLS ---------------- */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8 sm:mt-12">
        {/* Dark Glass Floating Container */}
        <div className="rounded-2xl sm:rounded-3xl lg:rounded-full bg-[#050908]/85 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 sm:p-5 lg:py-5 lg:px-8 text-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-0 lg:divide-x lg:divide-white/10">
            {/* Feature 1: Academic Learning */}
            <Link
              href="/subjects"
              className="flex items-center gap-3.5 lg:px-6 first:pl-2 group hover:opacity-95 transition-opacity"
            >
              <BookOpen className="w-6 h-6 text-white group-hover:text-[#00E58B] shrink-0 stroke-[1.8] transition-colors" />
              <div className="space-y-0.5 min-w-0">
                <div className="text-sm font-bold text-white group-hover:text-[#00E58B] transition-colors truncate">
                  Academic Learning
                </div>
                <div className="text-xs text-slate-300 truncate">
                  Lectures, materials and more
                </div>
              </div>
            </Link>

            {/* Feature 2: FOLE SPACE */}
            <Link
              href="/fole-space"
              className="flex items-center gap-3.5 lg:px-6 group hover:opacity-95 transition-opacity"
            >
              <Users className="w-6 h-6 text-white group-hover:text-[#00E58B] shrink-0 stroke-[1.8] transition-colors" />
              <div className="space-y-0.5 min-w-0">
                <div className="text-sm font-bold text-white group-hover:text-[#00E58B] transition-colors truncate">
                  FOLE SPACE
                </div>
                <div className="text-xs text-slate-300 truncate">
                  A space for ideas and people
                </div>
              </div>
            </Link>

            {/* Feature 3: FOLE WORKS */}
            <Link
              href="/fole-works"
              className="flex items-center gap-3.5 lg:px-6 group hover:opacity-95 transition-opacity"
            >
              <Calendar className="w-6 h-6 text-white group-hover:text-[#00E58B] shrink-0 stroke-[1.8] transition-colors" />
              <div className="space-y-0.5 min-w-0">
                <div className="text-sm font-bold text-white group-hover:text-[#00E58B] transition-colors truncate">
                  FOLE WORKS
                </div>
                <div className="text-xs text-slate-300 truncate">
                  Events, opportunities and beyond
                </div>
              </div>
            </Link>

            {/* Feature 4: Student Community */}
            <Link
              href="/about"
              className="flex items-center gap-3.5 lg:px-6 last:pr-2 group hover:opacity-95 transition-opacity"
            >
              <Lightbulb className="w-6 h-6 text-white group-hover:text-[#00E58B] shrink-0 stroke-[1.8] transition-colors" />
              <div className="space-y-0.5 min-w-0">
                <div className="text-sm font-bold text-white group-hover:text-[#00E58B] transition-colors truncate">
                  Student Community
                </div>
                <div className="text-xs text-slate-300 truncate">
                  Create. Collaborate. Grow.
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ---------------- 4. BOTTOM CONTROLS: PAGINATION CAROUSEL & SCROLL INDICATOR ---------------- */}
        <div className="mt-4 sm:mt-5 flex items-center justify-between text-xs font-mono text-slate-400 px-2 select-none">
          {/* Left: 01 ——— 03 Slider Navigation */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="text-xs">{slidesData[activeSlide].id}</span>
              <div className="w-12 sm:w-16 h-0.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00A86B] transition-all duration-300"
                  style={{
                    width: `${((activeSlide + 1) / slidesData.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-slate-500 text-xs">{`0${slidesData.length}`}</span>
            </div>

            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Previous slide highlight"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Next slide highlight"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="hidden md:inline-block text-[11px] text-slate-400 ml-2">
              <span className="text-[#00E58B] font-bold">{slidesData[activeSlide].pillar}:</span>{" "}
              {slidesData[activeSlide].detail}
            </span>
          </div>

          {/* Right: SCROLL | Mouse Indicator Capsule */}
          <button
            type="button"
            onClick={scrollToCurriculum}
            className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-full px-2 py-1"
            aria-label="Scroll down to academic curriculum"
          >
            <span className="text-[10px] tracking-[0.2em] font-mono font-bold uppercase text-slate-300">SCROLL</span>
            <span className="h-3 w-px bg-white/30" />
            <div className="w-4 h-6 rounded-full border border-white/40 flex items-start justify-center p-0.5 group-hover:border-[#00E58B] transition-colors">
              <div className="w-1 h-1.5 rounded-full bg-[#00E58B] animate-bounce" />
            </div>
          </button>
        </div>
      </div>

      {/* ---------------- 5. VIDEO PLAYBACK MODAL ---------------- */}
      <HeroVideoDialog
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        triggerRef={watchVideoBtnRef}
        videoSrc="/videos/fole-intro.mp4"
        posterSrc="/videos/fole-intro-poster.jpg"
      />
    </section>
  );
}
