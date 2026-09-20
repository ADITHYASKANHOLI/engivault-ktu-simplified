import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle, Sparkles, Play, ShieldCheck, FileText, Layers, Award } from "lucide-react";
import { getPublishedSubjects, getSiteSettings, getRecentPublishedLessons } from "@/lib/queries";
import { HeroGraphic } from "@/components/graphics/HeroGraphic";
import { SubjectGrid } from "@/components/subjects/SubjectGrid";
import { LessonRow } from "@/components/lessons/LessonRow";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const subjects = await getPublishedSubjects();
  const settings = await getSiteSettings();
  const latestLessons = await getRecentPublishedLessons(3);

  return (
    <main className="relative flex-1">
      {/* ---------------- 1. HERO SECTION ---------------- */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-gradient-to-b from-[#F0F4FA] via-[#F7F9FC] to-[#F7F9FC] bg-tech-grid">
        {/* Soft background ambient gradient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200/80 bg-white/80 shadow-xs backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 font-mono">
                  KTU-ORIENTED ENGINEERING LEARNING
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08]">
                Learn Engineering. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-500">
                  Build Confidence.
                </span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {settings.headline || "Recorded classes, structured modules and downloadable study materials for KTU-oriented engineering subjects."}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/subjects"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Explore Subjects</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="#latest-classes"
                  className="w-full sm:w-auto px-7 py-4 rounded-xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 text-cyan-600 fill-cyan-600" />
                  <span>Latest Classes</span>
                </Link>
              </div>

              {/* Trust Strip */}
              <div className="pt-6 border-t border-slate-200/70">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{subjects.length} Core KTU Subjects</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Recorded Video Classes</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Notes & Question Banks</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Learn at Your Pace</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Visual Graphic Column */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <HeroGraphic />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 2. SUBJECT CATALOG PREVIEW ---------------- */}
      <section className="py-20 bg-white relative border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-700 font-mono mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Curriculum Library</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Featured Engineering Subjects
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl">
                Comprehensive semester-wise modules designed precisely around APJ Abdul Kalam Technological University syllabus and question patterns.
              </p>
            </div>

            <Link
              href="/subjects"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors shrink-0"
            >
              <span>View all subjects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <SubjectGrid subjects={subjects} />
        </div>
      </section>

      {/* ---------------- 3. LATEST CLASSES & LECTURES ---------------- */}
      <section id="latest-classes" className="py-20 bg-[#F7F9FC] relative bg-tech-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-700 font-mono mb-2">
              <Play className="w-3.5 h-3.5" />
              <span>Video Lectures</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Latest Recorded Lectures
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Step-by-step chalk and digital blackboard derivations with authentic exam problems explained clearly.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {latestLessons.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-white/60 rounded-2xl border border-slate-200">
                <p className="text-sm font-medium">New lectures are being uploaded. Check back shortly!</p>
              </div>
            ) : (
              latestLessons.map((les) => (
                <LessonRow
                  key={les.id}
                  lesson={les}
                  subjectSlug={les.module?.subject?.slug || "engineering-mathematics"}
                  moduleSlug={les.module?.slug || "module-1-single-variable-calculus"}
                />
              ))
            )}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/subjects"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <span>Browse all module lectures</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- 4. ACADEMIC ARCHITECTURE PILLARS ---------------- */}
      <section className="py-20 bg-white border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-4">
                📐
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">100% KTU Aligned</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Structured precisely following the Kerala Technological University syllabus schemes (2019 & 2024 schemes).
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200/60">
                <a
                  href="https://ktu.edu.in/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Explore the KTU Scheme</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold mb-4">
                🎥
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Recorded Video Classes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                High-definition lectures focusing on concepts, derivations, circuit solutions, and isometric projections.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-4">
                📝
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Downloadable Notes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clean handwritten formula summaries, question banks, and university exam solution templates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-4">
                ⚡
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Zero Friction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Open public access to published courses without paywalls or complicated pay-per-view steps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 5. FINAL CTA BANNER ---------------- */}
      <section className="py-16 bg-[#0B1F3A] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-tech-grid-dark opacity-30 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-semibold">
            <span>START STUDYING TODAY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to ace your KTU university exams?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Choose your subject, download the curated lecture notes, and start watching recorded classes today.
          </p>
          <div className="pt-2">
            <Link
              href="/subjects"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-[#07111F] bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/25"
            >
              <span>Explore All KTU Subjects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
