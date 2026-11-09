import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Play, GraduationCap, AlertCircle } from "lucide-react";
import {
  getPublishedSubjects,
  getSiteSettings,
  getRecentPublishedLessons,
  getAllDepartments,
  initialFallbackSiteSettings,
} from "@/lib/queries";
import { LandingHero } from "@/components/landing/LandingHero";
import { SubjectGrid } from "@/components/subjects/SubjectGrid";
import { LectureCard } from "@/components/lectures/LectureCard";
import { AnimatedSection } from "@/components/ui/animate";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [subjectsResult, settingsResult, latestLessonsResult, departmentsResult] =
    await Promise.allSettled([
      getPublishedSubjects(),
      getSiteSettings(),
      getRecentPublishedLessons(6),
      getAllDepartments(),
    ]);

  const subjects =
    subjectsResult.status === "fulfilled" ? subjectsResult.value : [];
  const _settings =
    settingsResult.status === "fulfilled"
      ? settingsResult.value
      : initialFallbackSiteSettings;
  const latestLessons =
    latestLessonsResult.status === "fulfilled" ? latestLessonsResult.value : [];
  const departments =
    departmentsResult.status === "fulfilled" ? departmentsResult.value : [];

  const subjectError =
    subjectsResult.status === "rejected" ? subjectsResult.reason : null;

  return (
    <main className="relative flex-1">
      {/* ---------------- 1. AUTHENTIC FOLE LANDING HERO ---------------- */}
      <LandingHero totalSubjects={subjects.length} />

      {/* ---------------- 1B. DISCIPLINE / DEPARTMENT QUICK NAV ---------------- */}
      <section className="py-8 sm:py-10 bg-[#F8F7F0] border-b border-slate-200/60 relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="p-4 min-[375px]:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              <span className="flex items-center gap-1.5 min-w-0">
                <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Browse by Engineering Department</span>
              </span>
              <Link href="/lectures" className="min-h-[40px] sm:min-h-0 inline-flex items-center text-emerald-700 hover:underline normal-case font-sans font-semibold shrink-0">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2.5 sm:gap-3">
              {departments.map((dept) => (
                <Link
                  key={dept.id}
                  href={`/lectures?dept=${dept.slug}`}
                  className="flex flex-col items-center justify-center p-3 min-h-[56px] rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-emerald-50/80 hover:border-emerald-300 transition-all text-center group"
                >
                  <span className="font-mono text-xs font-black text-slate-900 group-hover:text-emerald-700">
                    {dept.code}
                  </span>
                  <span className="text-[11px] text-slate-600 group-hover:text-slate-900 truncate max-w-full mt-0.5">
                    {dept.name.replace("Engineering", "").replace("and", "&").trim()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 2. SUBJECT CATALOG PREVIEW ---------------- */}
      <section className="py-12 sm:py-20 bg-white relative border-y border-slate-200/60">
        <AnimatedSection className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-700 font-mono mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Curriculum Library</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Featured Engineering Subjects
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl leading-relaxed">
                Comprehensive semester-wise modules designed precisely around APJ Abdul Kalam Technological University syllabus and question patterns.
              </p>
            </div>

            <Link
              href="/subjects"
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors shrink-0 self-start md:self-auto"
            >
              <span>View all subjects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {subjectError && subjects.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center max-w-xl mx-auto my-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Academic Database Connecting
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We are currently establishing connection with the live curriculum database. Please refresh in a moment or explore our lecture vault.
              </p>
              <div className="pt-2">
                <Link
                  href="/lectures"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Browse Video Lectures</span>
                </Link>
              </div>
            </div>
          ) : (
            <SubjectGrid subjects={subjects} />
          )}
        </AnimatedSection>
      </section>

      {/* ---------------- 3. LATEST CLASSES & LECTURES ---------------- */}
      <section id="latest-classes" className="py-12 sm:py-20 bg-[#F7F9FC] relative bg-tech-grid">
        <AnimatedSection className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-700 font-mono mb-2">
                <Play className="w-3.5 h-3.5" />
                <span>Video Lectures Vault</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Latest Academic Lectures
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl leading-relaxed">
                Step-by-step chalk and digital blackboard derivations with authentic exam problems explained clearly.
              </p>
            </div>

            <Link
              href="/lectures"
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors shrink-0 self-start md:self-auto"
            >
              <span>Explore all lectures</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {latestLessons.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white/60 rounded-2xl border border-slate-200">
              <p className="text-sm font-medium">New lectures are being uploaded. Check back shortly!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
              {latestLessons.map((les, idx) => (
                <LectureCard
                  key={les.id}
                  lecture={les}
                  subjectSlug={les.module?.subject?.slug || "engineering-mathematics"}
                  moduleSlug={les.module?.slug || "module-1-single-variable-calculus"}
                  subjectTitle={les.module?.subject?.title}
                  moduleTitle={les.module?.title}
                  topicTitle={les.topic?.title}
                  instructorName={les.faculty?.name}
                  index={idx + 1}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-10 sm:mt-12">
            <Link
              href="/lectures"
              className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition-all"
            >
              <span>Open Academic Lecture Browser</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </AnimatedSection>
      </section>

      {/* ---------------- 4. ACADEMIC ARCHITECTURE PILLARS ---------------- */}
      <section className="py-12 sm:py-20 bg-white border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
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
                  className="min-h-[40px] sm:min-h-0 text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Explore the KTU Scheme</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold mb-4">
                🎥
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Recorded Video Classes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                High-definition lectures focusing on concepts, derivations, circuit solutions, and isometric projections.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-4">
                📝
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Downloadable Notes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clean handwritten formula summaries, question banks, and university exam solution templates.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
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
      <section className="py-14 sm:py-16 bg-[#0B1F3A] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-tech-grid-dark opacity-30 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 text-center relative z-10 space-y-5 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-semibold">
            <span>START STUDYING TODAY</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Ready to ace your KTU university exams?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Choose your subject, download the curated lecture notes, and start watching recorded classes today.
          </p>
          <div className="pt-2">
            <Link
              href="/subjects"
              className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-4 rounded-xl text-sm font-bold text-[#07111F] bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/25"
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
