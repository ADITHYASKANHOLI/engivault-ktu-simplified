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
    const query = q.toLowerCase().trim();
    filtered = filtered.filter((l) => {
      const titleMatch = l.title.toLowerCase().includes(query);
      const descMatch = (l.description || l.short_description || "").toLowerCase().includes(query);
      const subjectMatch = (l.subject?.title || "").toLowerCase().includes(query) || (l.subject?.code || "").toLowerCase().includes(query);
      const moduleMatch = (l.module?.title || "").toLowerCase().includes(query);
      const topicMatch = (l.topic?.title || "").toLowerCase().includes(query);
      const facultyMatch = (l.faculty?.name || "").toLowerCase().includes(query);
      return titleMatch || descMatch || subjectMatch || moduleMatch || topicMatch || facultyMatch;
    });
  }

  const hasActiveFilters = Boolean(q || dept || sem || subject);

  return (
    <main className="flex-1 pt-28 pb-24 bg-[#F7F9FC] min-h-screen bg-tech-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Academic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-blue-700 transition-colors">
            EngiVault
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">Academic Lectures</span>
          {selectedDept && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-blue-700 font-semibold">{selectedDept.name}</span>
            </>
          )}
          {selectedSem && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-cyan-700 font-semibold">Semester {selectedSem.number || selectedSem.semester_number}</span>
            </>
          )}
          {selectedSubject && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 font-semibold truncate max-w-[200px]">{selectedSubject.title}</span>
            </>
          )}
        </nav>

        {/* Page Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0A192F] via-[#102A4C] to-[#1E3A8A] text-white p-8 sm:p-10 shadow-xl mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>KTU ACADEMIC LECTURE VAULT</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Engineering Academic Lectures
            </h1>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
              Step-by-step video classes taught by experienced faculty, mapped directly to KTU university syllabus modules and exam topics.
            </p>
          </div>
        </div>

        {/* Search & Cascading Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm mb-10 space-y-5">
          {/* Global Search Bar */}
          <form method="GET" className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="Search lectures by topic (e.g. Laplace Transform, Isometric Projection, KVL, Normal Form)..."
              className="w-full pl-11 pr-24 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-xs"
            />
            {/* Preserve selected filter params in form */}
            {dept && <input type="hidden" name="dept" value={dept} />}
            {sem && <input type="hidden" name="sem" value={sem} />}
            {subject && <input type="hidden" name="subject" value={subject} />}
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors"
            >
              Search
            </button>
          </form>

          {/* Department Filter Pills */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-2.5">
              <span>Department / Discipline</span>
              {dept && (
                <Link href={`/lectures?${new URLSearchParams({ ...(sem && { sem }), ...(subject && { subject }), ...(q && { q }) }).toString()}`} className="text-blue-600 hover:underline flex items-center gap-1 normal-case font-sans">
                  <X className="w-3 h-3" /> Clear discipline
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <Link
                href={`/lectures?${new URLSearchParams({ ...(sem && { sem }), ...(subject && { subject }), ...(q && { q }) }).toString()}`}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  !dept
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                      isActive
                        ? "bg-blue-700 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {d.code} • {d.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Semester Filter Pills */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-2.5">
              <span>Semester</span>
              {sem && (
                <Link href={`/lectures?${new URLSearchParams({ ...(dept && { dept }), ...(subject && { subject }), ...(q && { q }) }).toString()}`} className="text-blue-600 hover:underline flex items-center gap-1 normal-case font-sans">
                  <X className="w-3 h-3" /> Clear semester
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <Link
                href={`/lectures?${new URLSearchParams({ ...(dept && { dept }), ...(subject && { subject }), ...(q && { q }) }).toString()}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  !sem
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                      isActive
                        ? "bg-cyan-700 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Showing <strong className="text-slate-900">{filtered.length}</strong> matching academic lectures
              </span>
              <Link
                href="/lectures"
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </Link>
            </div>
          )}
        </div>

        {/* Lectures Grid or Empty State */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
              <Video className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No lectures found</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              We couldn&apos;t find any lectures matching your active search or filters. Try adjusting your search query or reset filters to see all classes.
            </p>
            <div className="pt-2">
              <Link
                href="/lectures"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors"
              >
                <span>Browse All Lectures</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
          </div>
        )}
      </div>
    </main>
  );
}
