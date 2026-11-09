import React from "react";
import { BookOpen, Search } from "lucide-react";
import { getPublishedSubjects } from "@/lib/queries";
import { SubjectGrid } from "@/components/subjects/SubjectGrid";
import { matchesSubjectQuery } from "@/lib/utils/academic-search";
import { AnimatedSection } from "@/components/ui/animate";

export const metadata = {
  title: "Engineering Subjects Catalog — ENGIVAULT",
};

export const dynamic = "force-dynamic";

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; semester?: string }>;
}) {
  const { q } = (await searchParams) || {};
  let subjects = await getPublishedSubjects();

  if (q) {
    subjects = subjects.filter((s) => matchesSubjectQuery(s, q));
  }

  return (
    <main className="flex-1 pt-24 sm:pt-32 pb-16 sm:pb-24 bg-[#F7F9FC] bg-tech-grid">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 text-blue-700 dark:text-cyan-400 text-xs font-mono font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>KTU CURRICULUM DIRECTORY</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            KTU Engineering Subjects
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Select a subject to explore its syllabus modules, recorded video lectures, and downloadable question notes.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-8 sm:mb-12">
          <form method="GET" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 min-w-0 flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={q || ""}
                aria-label="Search engineering subjects"
                placeholder="Search subjects (e.g. Calculus, Circuits)..."
                className="w-full min-h-[48px] pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base sm:text-sm text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="min-h-[48px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm sm:text-xs font-semibold transition-colors shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {/* Subject Grid */}
        <AnimatedSection>
          <SubjectGrid subjects={subjects} />
        </AnimatedSection>
      </div>
    </main>
  );
}
