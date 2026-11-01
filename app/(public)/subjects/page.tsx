import React from "react";
import { BookOpen, Search } from "lucide-react";
import { getPublishedSubjects } from "@/lib/queries";
import { SubjectGrid } from "@/components/subjects/SubjectGrid";
import { matchesSubjectQuery } from "@/lib/utils/academic-search";

export const metadata = {
  title: "Engineering Subjects Catalog — FOLE",
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
    <main className="flex-1 bg-[#f7f6ef] pb-24 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-10 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 border-b border-[#9db5a2] pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#176b45]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>KTU CURRICULUM DIRECTORY</span>
          </div>
          <h1 className="fole-heading text-4xl leading-tight text-[#17231c] sm:text-5xl">
            KTU Engineering Subjects
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#647168]">
            Select a subject to explore its syllabus modules, recorded video lectures, and downloadable question notes.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-10 max-w-2xl">
          <form method="GET" className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              aria-label="Search engineering subjects"
              placeholder="Search subjects by name (e.g. Calculus, Graphics, Circuits)..."
              className="w-full pl-11 pr-24 py-3.5 rounded-none border border-[#cbd5cb] bg-white focus:outline-none focus:ring-2 focus:ring-[#176b45] focus:border-transparent text-sm text-slate-900"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-none bg-[#176b45] hover:bg-[#105437] text-white text-xs font-semibold transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Subject Grid */}
        <SubjectGrid subjects={subjects} />
      </div>
    </main>
  );
}
