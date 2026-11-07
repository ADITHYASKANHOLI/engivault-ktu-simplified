"use client";

import React from "react";
import Link from "next/link";
import { ArrowDown, Mail, ArrowRight, Sparkles } from "lucide-react";

export function FoleWorksFinalCTA() {
  const handleScrollToActivities = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById("activities");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-[#050811] text-white">
      {/* Background Echoes of Aurora Palette (#5227FF, #7cff67) */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(82,39,255,0.25),rgba(124,255,103,0.12)_45%,transparent_75%)]" />
        <div className="absolute inset-0 bg-tech-grid-dark opacity-10" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-mono font-bold tracking-wider uppercase text-emerald-400 mb-6 shadow-[0_0_20px_rgba(124,255,103,0.12)]">
          <Sparkles className="w-3.5 h-3.5 text-[#7cff67]" />
          <span>Take the Next Step</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
          Ready to Build, Create, and Lead?
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal">
          Whether you want to join an upcoming hands-on workshop, collaborate on open-source engineering projects, or propose a new student-led initiative at CEV — FOLE WORKS is open to you.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
          <a
            href="#activities"
            onClick={handleScrollToActivities}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-[#00A86B] hover:from-emerald-500 hover:to-[#00c57d] transition-all shadow-[0_0_25px_rgba(0,168,107,0.35)] hover:shadow-[0_0_35px_rgba(124,255,103,0.45)] min-h-[48px]"
          >
            <span>Explore Activities</span>
            <ArrowDown className="w-4 h-4" />
          </a>

          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 backdrop-blur-md transition-all min-h-[48px]"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Propose an Initiative</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-white/10 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-4">
          <span>Free Open Learning &amp; Education — College of Engineering Vadakara</span>
          <span>•</span>
          <a
            href="mailto:folecev@gmail.com"
            className="text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
          >
            <span>folecev@gmail.com</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
}
