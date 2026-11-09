import React from "react";
import Link from "next/link";
import {
  Search,
  GraduationCap,
  Video,
  X,
  ChevronRight,
} from "lucide-react";
import {
  getAllLessons,
  getAllDepartments,
  getAllSemesters,
  getPublishedSubjects,
} from "@/lib/queries";
import { LectureCard } from "@/components/lectures/LectureCard";
import { AnimatedCountingNumber, AnimatedSection } from "@/components/ui/animate";
import {
  matchesSubjectQuery,
  matchesAcademicTarget,
} from "@/lib/utils/academic-search";
import { LearnGridScanBackground } from "@/components/lectures/LearnGridScanBackground";

export const metadata = {
  title: "Academic Lectures Browser — ENGIVAULT",
  description:
    "Explore engineering academic lectures organized by department, semester, subject, module, and topic with YouTube video classes.",
};

export const dynamic = "force-dynamic";

interface LecturesPageProps {
  searchParams: Promise<{
    q?: string;
    dept?: string;
    sem?: string;
    subject?: string;
  }>;
}

export default async function LecturesPage({ searchParams }: LecturesPageProps) {
  const { q, dept, sem, subject } = (await searchParams) || {};

  const [allLectures, departments, semesters, subjects] = await Promise.all([
    getAllLessons(),
    getAllDepartments(),
    getAllSemesters(),
    getPublishedSubjects(),
  ]);

  // Create lookups for academic hierarchy filtering
  const selectedDept = dept ? departments.find((d) => d.slug === dept || d.id === dept) : null;
  const selectedSem = sem ? semesters.find((s) => String(s.number) === sem || String(s.semester_number) === sem || s.slug === sem) : null;
  const selectedSubject = subject ? subjects.find((s) => s.slug === subject || s.id === subject) : null;

  // Filter lectures
  let filtered = allLectures.filter((lec) => lec.published !== false);

  if (selectedSubject) {
    filtered = filtered.filter((l) => {
      const subId = l.module?.subject_id || l.subject?.id;
      return subId === selectedSubject.id;
    });
  } else if (selectedDept) {
    // If a department is selected, match subjects associated with this department
    filtered = filtered.filter((l) => {
      const sub = l.subject || (l.module?.subject_id ? subjects.find((s) => s.id === l.module?.subject_id) : null);
      if (!sub) return true;
      return sub.department_id === selectedDept.id || !sub.department_id;
    });
  }

  if (selectedSem) {
    const semNum = selectedSem.number || selectedSem.semester_number;
    filtered = filtered.filter((l) => {
      const sub = l.subject || (l.module?.subject_id ? subjects.find((s) => s.id === l.module?.subject_id) : null);
      if (!sub) return true;
      return sub.semester_number === semNum || sub.semester_id === selectedSem.id || !sub.semester_id;
    });
  }

  if (q) {
    filtered = filtered.filter((l) => {
      const parentSub =
        l.subject ||
        (l.module?.subject_id
          ? subjects.find((s) => s.id === l.module?.subject_id)
          : null) ||
        (l.module as any)?.subject ||
        (l.module as any)?.subjects;

      const subMatch = parentSub ? matchesSubjectQuery(parentSub, q) : false;
      const titleMatch = matchesAcademicTarget(l.title, q);
      const descMatch = matchesAcademicTarget(l.description || l.short_description || "", q);
      const moduleMatch = matchesAcademicTarget(l.module?.title || "", q);
      const topicMatch = matchesAcademicTarget(l.topic?.title || "", q);
      const facultyMatch = matchesAcademicTarget(l.faculty?.name || (l as any).instructor || "", q);

      return subMatch || titleMatch || descMatch || moduleMatch || topicMatch || facultyMatch;
    });
  }

  const hasActiveFilters = Boolean(q || dept || sem || subject);

  return (
    <div className="relative isolate min-h-screen bg-[#07111F] text-slate-100">
      <LearnGridScanBackground />
      <main className="page-content-relative flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          {/* Academic Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-5 sm:mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-400 font-medium">
            <Link href="/" className="min-h-[40px] sm:min-h-0 inline-flex items-center hover:text-cyan-400 transition-colors">
              EngiVault
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-white font-semibold">Academic Lectures</span>
            {selectedDept && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-cyan-400 font-semibold">{selectedDept.name}</span>
              </>
            )}
            {selectedSem && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-cyan-400 font-semibold">Semester {selectedSem.number || selectedSem.semester_number}</span>
              </>
            )}
            {selectedSubject && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-white font-semibold truncate max-w-[200px]">{selectedSubject.title}</span>
              </>
            )}
          </nav>

          {/* Page Banner */}
          <div className="rounded-3xl bg-slate-900/60 backdrop-blur-md text-white p-6 min-[375px]:p-7 sm:p-10 shadow-xl mb-8 sm:mb-10 border border-cyan-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-3.5 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>KTU ACADEMIC LECTURE VAULT</span>
              </div>
              <h1 className="text-2xl min-[375px]:text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Engineering Academic Lectures
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Step-by-step video classes taught by experienced faculty, mapped directly to KTU university syllabus modules and exam topics.
              </p>
            </div>
          </div>

          {/* Search & Cascading Filter Controls */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-700/60 p-4 min-[375px]:p-5 sm:p-6 shadow-sm mb-8 sm:mb-10 space-y-5 text-slate-100">
            {/* Global Search Bar */}
            <form method="GET" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 min-w-0 flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  name="q"
                  defaultValue={q || ""}
                  aria-label="Search academic lectures"
                  placeholder="Search lectures, codes, or topics..."
                  className="w-full min-h-[48px] sm:min-h-[46px] pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800/80 text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-slate-800 transition-all shadow-xs"
                />
              </div>
              {/* Preserve selected filter params in form */}
              {dept && <input type="hidden" name="dept" value={dept} />}
              {sem && <input type="hidden" name="sem" value={sem} />}
              {subject && <input type="hidden" name="subject" value={subject} />}
              <button
                type="submit"
                className="min-h-[48px] sm:min-h-[46px] px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm sm:text-xs font-bold transition-colors shrink-0 cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Department Filter Pills */}
            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2.5">
                <span>Department / Discipline</span>
                {dept && (
                  <Link href={`/lectures?${new URLSearchParams({ ...(sem && { sem }), ...(subject && { subject }), ...(q && { q }) }).toString()}`} className="min-h-[40px] sm:min-h-0 inline-flex items-center gap-1 text-cyan-400 hover:underline normal-case font-sans shrink-0">
                    <X className="w-3 h-3" /> Clear discipline
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <Link
                  href={`/lectures?${new URLSearchParams({ ...(sem && { sem }), ...(subject && { subject }), ...(q && { q }) }).toString()}`}
                  className={`min-h-[42px] sm:min-h-[34px] inline-flex items-center px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold max-w-full transition-colors ${
                    !dept
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60"
                  }`}
                >
                  All Disciplines
                </Link>
                {departments.map((d) => {
                  const isActive = dept === d.slug || dept === d.id;
                  const params = new URLSearchParams({
                    dept: d.slug,
                    ...(sem && { sem }),
                    ...(subject && { subject }),
                    ...(q && { q }),
                  });
                  return (
                    <Link
                      key={d.id}
                      href={`/lectures?${params.toString()}`}
                      className={`min-h-[42px] sm:min-h-[34px] inline-flex items-center px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold max-w-full transition-colors ${
                        isActive
                          ? "bg-cyan-600 text-white shadow-xs"
                          : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60"
                      }`}
                    >
                      <span className="truncate">{d.code} • {d.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Semester Filter Pills */}
            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2.5">
                <span>Semester</span>
                {sem && (
                  <Link href={`/lectures?${new URLSearchParams({ ...(dept && { dept }), ...(subject && { subject }), ...(q && { q }) }).toString()}`} className="min-h-[40px] sm:min-h-0 inline-flex items-center gap-1 text-cyan-400 hover:underline normal-case font-sans shrink-0">
                    <X className="w-3 h-3" /> Clear semester
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <Link
                  href={`/lectures?${new URLSearchParams({ ...(dept && { dept }), ...(subject && { subject }), ...(q && { q }) }).toString()}`}
                  className={`min-h-[42px] sm:min-h-[34px] inline-flex items-center px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    !sem
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60"
                  }`}
                >
                  All Semesters
                </Link>
                {semesters.map((s) => {
                  const sNum = s.number || s.semester_number || 1;
                  const isActive = sem === String(sNum) || sem === s.slug;
                  const params = new URLSearchParams({
                    ...(dept && { dept }),
                    sem: String(sNum),
                    ...(subject && { subject }),
                    ...(q && { q }),
                  });
                  return (
                    <Link
                      key={s.id}
                      href={`/lectures?${params.toString()}`}
                      className={`min-h-[42px] sm:min-h-[34px] inline-flex items-center px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? "bg-cyan-600 text-white shadow-xs"
                          : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60"
                      }`}
                    >
                      Sem {sNum}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Active Filter Clear Bar */}
            {hasActiveFilters && (
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-xs text-slate-400 font-medium">
                  Showing <strong className="text-white"><AnimatedCountingNumber value={filtered.length} /></strong> matching academic lectures
                </span>
                <Link
                  href="/lectures"
                  className="min-h-[40px] sm:min-h-0 text-xs font-bold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset all filters</span>
                </Link>
              </div>
            )}
          </div>

          {/* Lectures Grid or Empty State */}
          {filtered.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/70 backdrop-blur-md rounded-3xl border border-dashed border-slate-700 max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-800/50">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">No lectures found</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                We couldn&apos;t find any lectures matching your active search or filters. Try adjusting your search query or reset filters to see all classes.
              </p>
              <div className="pt-2">
                <Link
                  href="/lectures"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors min-h-[44px]"
                >
                  <span>Browse All Lectures</span>
                </Link>
              </div>
            </div>
          ) : (
            <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filtered.map((lecture, idx) => (
                <LectureCard
                  key={lecture.id}
                  lecture={lecture}
                  subjectSlug={lecture.subject?.slug}
                  moduleSlug={lecture.module?.slug}
                  subjectTitle={lecture.subject?.title}
                  moduleTitle={lecture.module?.title}
                  topicTitle={lecture.topic?.title}
                  instructorName={lecture.faculty?.name}
                  index={idx + 1}
                />
              ))}
            </AnimatedSection>
          )}
        </div>
      </main>
    </div>
  );
}
