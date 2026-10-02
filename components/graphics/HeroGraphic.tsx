import React from "react";
import { BookOpen, PlayCircle, FileText, CheckCircle2 } from "lucide-react";

export function HeroGraphic() {
  return (
    <div className="relative w-full max-w-xl mx-auto aspect-square flex items-center justify-center select-none" aria-hidden="true">
      {/* Background radial engineering glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-cyan-500/10 to-indigo-600/15 rounded-full blur-3xl opacity-70" />

      {/* Outer Calibrated Coordinate Rings */}
      <div className="absolute w-[92%] h-[92%] rounded-full border border-cyan-500/15 border-dashed animate-[spin_120s_linear_infinite]" />
      <div className="absolute w-[76%] h-[76%] rounded-full border border-blue-500/20" />
      <div className="absolute w-[56%] h-[56%] rounded-full border border-cyan-400/25 border-dotted animate-[spin_80s_linear_infinite_reverse]" />

      {/* SVG Layer: Circuit Traces & Mathematical Curve */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#19B5C8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#163B8C" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6C63FF" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="circuitGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#19B5C8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#19B5C8" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Technical Coordinate Crosshairs */}
        <line x1="250" y1="20" x2="250" y2="480" stroke="rgba(25, 181, 200, 0.12)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="20" y1="250" x2="480" y2="250" stroke="rgba(25, 181, 200, 0.12)" strokeWidth="1" strokeDasharray="4 4" />

        {/* Circuit Traces */}
        <path
          d="M 60 120 L 140 120 L 190 170 L 190 230"
          stroke="url(#circuitGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="60" cy="120" r="3.5" fill="#19B5C8" className="animate-node" />
        <circle cx="140" cy="120" r="2.5" fill="#19B5C8" />
        <circle cx="190" cy="230" r="3.5" fill="#19B5C8" className="animate-node" />

        <path
          d="M 440 380 L 360 380 L 310 330 L 310 270"
          stroke="url(#circuitGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="440" cy="380" r="3.5" fill="#19B5C8" className="animate-node" />
        <circle cx="360" cy="380" r="2.5" fill="#19B5C8" />
        <circle cx="310" cy="270" r="3.5" fill="#19B5C8" className="animate-node" />

        {/* Mathematical Function Curve (Calculus Sine / Cubic Spline) */}
        <path
          d="M 50 340 C 130 380, 180 140, 250 250 C 320 360, 370 120, 450 160"
          stroke="url(#curveGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="animate-curve"
        />

        {/* Engineering Dimension Marks */}
        <path d="M 230 40 L 270 40 M 250 35 L 250 45" stroke="#19B5C8" strokeWidth="1" opacity="0.6" />
        <path d="M 460 230 L 460 270 M 455 250 L 465 250" stroke="#19B5C8" strokeWidth="1" opacity="0.6" />
      </svg>

      {/* Floating Engineering Math & Circuit Symbols */}
      <div className="absolute top-10 left-12 text-cyan-500/50 font-mono text-xl tracking-wider select-none font-bold">
        ∫ f(x) dx
      </div>
      <div className="absolute bottom-12 right-14 text-indigo-400/60 font-mono text-lg tracking-wider select-none font-semibold">
        V = I · R
      </div>
      <div className="absolute top-28 right-10 text-cyan-400/50 font-mono text-xl tracking-wider select-none">
        ∇ × B = μ₀J
      </div>
      <div className="absolute bottom-24 left-10 text-blue-500/50 font-mono text-xl tracking-wider select-none">
        λ₁ = det(A - λI)
      </div>

      {/* Central Floating Glassmorphic Lesson Preview Card */}
      <div className="relative z-10 w-[82%] max-w-[340px] rounded-2xl border border-white/60 bg-white/70 dark:bg-slate-900/80 p-5 shadow-[0_20px_50px_rgba(11,18,32,0.12)] backdrop-blur-xl transition-transform duration-300 hover:scale-[1.02]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-slate-700 dark:text-slate-200 uppercase font-mono">
              MAT 101 • KTU LECTURE
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/40 dark:text-blue-300">
            S1/S2
          </span>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-md">
            <PlayCircle className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Module 1 • Calculus</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
              Limits & L&apos;Hospital&apos;s Theorem
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>23 mins</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> KTU Solved
              </span>
            </div>
          </div>
        </div>

        {/* Mini resources strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Class Notes PDF</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Question Bank</span>
          </div>
        </div>
      </div>
    </div>
  );
}
