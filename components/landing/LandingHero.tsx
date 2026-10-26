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
    <section className="relative w-full min-h-[920px] lg:min-h-screen pt-24 pb-12 sm:pb-16 flex flex-col justify-between overflow-hidden bg-[#07140E]">
      {/* ---------------- 1. BACKGROUND PHOTOGRAPHIC & ARCHITECTURAL ART LAYER ---------------- */}
      <div className="absolute inset-0 z-0 select-none overflow-hidden">
        <Image
          src="/images/fole-hero-campus.png"
          alt="FOLE Architectural Campus at Golden Hour"
          fill
          priority
          quality={95}
          className="object-cover object-[center_35%] lg:object-center transform scale-[1.01]"
          sizes="100vw"
        />

        {/* Soft atmospheric gradient transitions for optimal legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent lg:w-[58%] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07140e] via-transparent to-transparent h-48 bottom-0 pointer-events-none" />
      </div>

      {/* Halftone subtle decorative texture (top-left & bottom-left authentic accents) */}
      <div
        className="absolute top-0 left-0 w-80 h-80 opacity-40 pointer-events-none z-1"
        style={{
          backgroundImage: "radial-gradient(#00C853 1.2px, transparent 1.2px)",
          backgroundSize: "16px 16px",
          maskImage: "radial-gradient(circle at 0% 0%, black 35%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(circle at 0% 0%, black 35%, transparent 75%)",
        }}
      />

      {/* ---------------- 2. MAIN HERO CONTENT AREA ---------------- */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8 sm:pt-14 lg:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Authentic Brand Typography & CTAs */}
          <div className="lg:col-span-8 max-w-2xl space-y-6 sm:space-y-7">
            {/* Small uppercase label + green horizontal accent line */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] sm:text-xs font-black tracking-[0.22em] text-[#050E09] uppercase font-mono">
                FREE OPEN LEARNING & EDUCATION
              </span>
              <span className="h-0.5 w-12 sm:w-16 bg-[#00C853] rounded-full inline-block" />
            </div>

            {/* Oversized Authentic FOLE Brand Logo */}
            <div className="py-1">
              <FoleLogoVector
                className="w-[280px] sm:w-[380px] md:w-[460px] lg:w-[490px] h-auto text-[#050E09]"
                textColor="#050E09"
                greenColor="#00C853"
              />
            </div>

            {/* Tagline: IDEAS INTO IMPACT */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#050E09] tracking-[0.24em] uppercase leading-tight font-sans">
              IDEAS INTO IMPACT
            </h1>

            {/* Supporting Pillar Words & Mission Narrative */}
            <div className="space-y-4 pt-1">
              {/* 4 Pillars matching reference visual style */}
              <div className="text-xs sm:text-sm font-black tracking-[0.2em] text-[#050E09]/80 uppercase space-y-1">
                <div>LEARNING</div>
                <div>PEOPLE</div>
                <div>OPPORTUNITIES</div>
                <div>A BRIGHTER TOMORROW</div>
              </div>

              {/* Supporting Copy */}
              <p className="text-sm sm:text-base text-slate-800/90 leading-relaxed max-w-xl font-medium">
                <span className="font-bold text-[#050E09]">Learn. Build. Belong.</span> A student-driven platform for open learning, structured KTU engineering curriculum, and real-world opportunities.
              </p>
            </div>

            {/* Action Buttons: Explore FOLE & Watch Video */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              {/* Primary Green CTA */}
              <Link
                href="/subjects"
                className="inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3.5 rounded-full text-sm font-bold text-white bg-[#00C853] hover:bg-[#00B048] shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all group"
              >
                <span>Explore FOLE</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Secondary Translucent Video CTA */}
              <button
                ref={watchVideoBtnRef}
                type="button"
                onClick={() => setIsVideoOpen(true)}
                className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 rounded-full text-sm font-semibold text-white bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/25 hover:border-white/40 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Watch FOLE Intro Video"
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                </div>
                <span>Watch Video</span>
              </button>
            </div>
          </div>

          {/* Right Column: Architectural Facade Brand Badges (from Reference Mockup) */}
          <div className="lg:col-span-4 hidden lg:flex flex-col items-end space-y-9 pt-12 pr-4">
            {/* Badge 1: Tech People Impact */}
            <div className="flex items-center gap-3.5 text-right group">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90 font-mono leading-tight">
                <div>TECH</div>
                <div>PEOPLE</div>
                <div>IMPACT</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg group-hover:border-emerald-400/50 transition-colors">
                <Leaf className="w-5 h-5 text-[#2EE585]" />
              </div>
            </div>

            {/* Badge 2: Innovation For Real Life */}
            <div className="flex items-center gap-3.5 text-right group">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90 font-mono leading-tight">
                <div>INNOVATION</div>
                <div>FOR REAL</div>
                <div>LIFE</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg group-hover:border-emerald-400/50 transition-colors">
                <Boxes className="w-5 h-5 text-[#2EE585]" />
              </div>
            </div>

            {/* Badge 3: FOLE Est. 2025 */}
            <div className="flex items-center gap-3.5 text-right group">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90 font-mono leading-tight">
                <div>FOLE</div>
                <div>EST. 2025</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg group-hover:border-emerald-400/50 transition-colors">
                <Sparkles className="w-5 h-5 text-[#2EE585]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 3. BOTTOM FEATURE STRIP & CAROUSEL / SCROLL CONTROLS ---------------- */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-12 sm:mt-16">
        {/* Dark Glass Floating Container */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#07140e]/85 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 sm:p-6 lg:p-7 text-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-white/10">
            {/* Feature 1: Academic Learning */}
            <Link
              href="/subjects"
              className="flex items-center gap-4 lg:px-6 first:pl-2 group hover:opacity-95 transition-opacity"
            >
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#00C853]/20 group-hover:border-[#00C853]/40 transition-colors">
                <BookOpen className="w-5 h-5 text-white group-hover:text-[#2EE585] transition-colors" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-white group-hover:text-[#2EE585] transition-colors">
                  Academic Learning
                </div>
                <div className="text-xs text-slate-400">
                  Lectures, materials and more
                </div>
              </div>
            </Link>

            {/* Feature 2: FOLE SPACE */}
            <Link
              href="/fole-space"
              className="flex items-center gap-4 lg:px-6 group hover:opacity-95 transition-opacity"
            >
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#00C853]/20 group-hover:border-[#00C853]/40 transition-colors">
                <Users className="w-5 h-5 text-white group-hover:text-[#2EE585] transition-colors" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-white group-hover:text-[#2EE585] transition-colors">
                  FOLE SPACE
                </div>
                <div className="text-xs text-slate-400">
                  A space for ideas and people
                </div>
              </div>
            </Link>

            {/* Feature 3: FOLE WORKS */}
            <Link
              href="/fole-works"
              className="flex items-center gap-4 lg:px-6 group hover:opacity-95 transition-opacity"
            >
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#00C853]/20 group-hover:border-[#00C853]/40 transition-colors">
                <Calendar className="w-5 h-5 text-white group-hover:text-[#2EE585] transition-colors" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-white group-hover:text-[#2EE585] transition-colors">
                  FOLE WORKS
                </div>
                <div className="text-xs text-slate-400">
                  Events, opportunities and beyond
                </div>
              </div>
            </Link>

            {/* Feature 4: Student Community */}
            <Link
              href="/about"
              className="flex items-center gap-4 lg:px-6 last:pr-2 group hover:opacity-95 transition-opacity"
            >
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#00C853]/20 group-hover:border-[#00C853]/40 transition-colors">
                <Lightbulb className="w-5 h-5 text-white group-hover:text-[#2EE585] transition-colors" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-white group-hover:text-[#2EE585] transition-colors">
                  Student Community
                </div>
                <div className="text-xs text-slate-400">
                  Create. Collaborate. Grow.
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ---------------- 4. BOTTOM CONTROLS: PAGINATION CAROUSEL & SCROLL INDICATOR ---------------- */}
        <div className="mt-5 flex items-center justify-between text-xs font-mono text-slate-400 px-2 select-none">
          {/* Left: 01 ——— 03 Slider Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white font-bold">
              <span>{slidesData[activeSlide].id}</span>
              <div className="w-12 sm:w-16 h-0.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00C853] transition-all duration-300"
                  style={{
                    width: `${((activeSlide + 1) / slidesData.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-slate-500">{`0${slidesData.length}`}</span>
            </div>

            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Previous slide highlight"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Next slide highlight"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="hidden md:inline-block text-[11px] text-slate-400 ml-2">
              <span className="text-[#00C853] font-bold">{slidesData[activeSlide].pillar}:</span>{" "}
              {slidesData[activeSlide].detail}
            </span>
          </div>

          {/* Right: SCROLL with Mouse Icon */}
          <button
            type="button"
            onClick={scrollToCurriculum}
            className="flex items-center gap-2.5 text-slate-400 hover:text-white transition-colors group cursor-pointer"
            aria-label="Scroll down to academic curriculum"
          >
            <span className="text-[11px] tracking-widest font-bold uppercase">SCROLL</span>
            <div className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center p-1 group-hover:border-[#00C853] transition-colors">
              <div className="w-1 h-2 rounded-full bg-[#00C853] animate-bounce" />
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
