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
      <section className="py-8 bg-[#f7f6ef] border-b border-slate-200/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-4 sm:p-5 rounded-md bg-white border border-[#dce2da]">
            <div className="flex items-center justify-between mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>Browse by Engineering Department / Discipline</span>
              </span>
              <Link href="/lectures" className="text-emerald-700 hover:underline normal-case font-sans font-semibold">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {departments.map((dept) => (
                <Link
                  key={dept.id}
                  href={`/lectures?dept=${dept.slug}`}
                  className="flex flex-col items-center justify-center p-3 rounded-md border border-slate-100 bg-[#f7f8f4] hover:bg-[#edf4ed] hover:border-emerald-300 transition-all text-center group"
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
      <section id="featured-subjects" className="border-y border-[#dce2da] bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#176b45] font-mono mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Curriculum Library</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Explore KTU subjects
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl">
                Browse subjects organised around the APJ Abdul Kalam Technological University syllabus.
              </p>
            </div>

            <Link
              href="/subjects"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#176b45] hover:text-[#105437] transition-colors shrink-0"
            >
              <span>View all subjects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {subjectError && subjects.length === 0 ? (
            <div className="p-8 rounded-md bg-slate-50 border border-slate-200 text-center max-w-xl mx-auto my-6 space-y-3">
              <div className="w-12 h-12 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Academic Database Connecting
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We are currently establishing connection with the live curriculum database. Please refresh in a moment or browse the open lecture collection.
              </p>
              <div className="pt-2">
                <Link
                  href="/lectures"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-semibold text-white bg-[#176b45] hover:bg-[#105437] transition-colors "
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Browse Video Lectures</span>
                </Link>
              </div>
            </div>
          ) : (
            <SubjectGrid subjects={subjects} />
          )}
        </div>
      </section>

      {/* ---------------- 3. LATEST CLASSES & LECTURES ---------------- */}
      <section id="latest-classes" className="bg-[#f2f4ee] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#176b45] font-mono mb-2">
                <Play className="w-3.5 h-3.5" />
                <span>Video Lectures Vault</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Recently added lectures
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl">
                Step-by-step chalk and digital blackboard derivations with authentic exam problems explained clearly.
              </p>
            </div>

            <Link
              href="/lectures"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#176b45] hover:text-[#105437] transition-colors shrink-0"
            >
              <span>Explore all lectures</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {latestLessons.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-md border border-slate-200">
              <p className="text-sm font-medium">New lectures are being uploaded. Check back shortly!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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

          <div className="text-center mt-12">
            <Link
              href="/lectures"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md text-xs font-bold text-white bg-[#176b45] hover:bg-[#105437] transition-colors"
            >
              <span>Open Academic Lecture Browser</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- 4. HOW FOLE SUPPORTS LEARNING ---------------- */}
      <section className="border-t border-[#dce2da] bg-white py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#176b45]">Built around KTU study</p>
            <h2 className="fole-heading mt-4 text-4xl leading-tight text-[#17231c] sm:text-5xl">Useful resources. Shared openly.</h2>
            <p className="mt-5 text-sm leading-7 text-[#647168]">
              FOLE brings core study material and campus learning activities into one place, with open access for students and a shared space to keep learning beyond the classroom.
            </p>
            <a href="https://ktu.edu.in/home" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#176b45] hover:text-[#105437]">
              Visit the KTU website <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="divide-y divide-[#dce2da] border-y border-[#dce2da]">
            <div className="grid grid-cols-[3rem_1fr] gap-4 py-5 sm:grid-cols-[4rem_1fr]">
              <span className="font-mono text-sm text-[#176b45]">01</span>
              <div><h3 className="font-semibold text-[#17231c]">KTU-aligned subjects</h3><p className="mt-1 text-sm leading-6 text-[#647168]">Syllabus modules and subject-wise learning paths organised for KTU students.</p></div>
            </div>
            <div className="grid grid-cols-[3rem_1fr] gap-4 py-5 sm:grid-cols-[4rem_1fr]">
              <span className="font-mono text-sm text-[#176b45]">02</span>
              <div><h3 className="font-semibold text-[#17231c]">Recorded classes</h3><p className="mt-1 text-sm leading-6 text-[#647168]">Faculty-led explanations of concepts, derivations, problem solving and engineering graphics.</p></div>
            </div>
            <div className="grid grid-cols-[3rem_1fr] gap-4 py-5 sm:grid-cols-[4rem_1fr]">
              <span className="font-mono text-sm text-[#176b45]">03</span>
              <div><h3 className="font-semibold text-[#17231c]">Study notes and questions</h3><p className="mt-1 text-sm leading-6 text-[#647168]">Downloadable material for revision and exam preparation.</p></div>
            </div>
            <div className="grid grid-cols-[3rem_1fr] gap-4 py-5 sm:grid-cols-[4rem_1fr]">
              <span className="font-mono text-sm text-[#176b45]">04</span>
              <div><h3 className="font-semibold text-[#17231c]">Open access</h3><p className="mt-1 text-sm leading-6 text-[#647168]">Published learning resources are available without a paywall.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 5. FINAL CTA ---------------- */}
      <section className="bg-[#123d2b] py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b7d7c2]">Start with a subject</p>
            <h2 className="fole-heading mt-3 text-3xl leading-tight sm:text-5xl">Your next learning step starts here.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">Find your subject, open a lecture, or save the notes you need for your next class.</p>
          </div>
          <Link href="/subjects" className="inline-flex min-h-12 shrink-0 items-center gap-2 bg-white px-6 text-sm font-semibold text-[#123d2b] transition-colors hover:bg-[#e8f0e8]">
            Browse KTU subjects <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
