import React from "react";
import Link from "next/link";
import { BookOpen, Search, Filter } from "lucide-react";
import { getPublishedSubjects } from "@/lib/queries";
import { SubjectGrid } from "@/components/subjects/SubjectGrid";

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
    const query = q.toLowerCase().trim();
    subjects = subjects.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.code?.toLowerCase().includes(query) ||
        s.short_description?.toLowerCase().includes(query)
    );
  }

  return (
    <main className="flex-1 pt-32 pb-24 bg-[#F7F9FC] bg-tech-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 text-blue-700 dark:text-cyan-400 text-xs font-mono font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>KTU CURRICULUM DIRECTORY</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            KTU Engineering Subjects
          </h1>
          <p className="text-base text-slate-600 mt-3">
            Select a subject to explore its syllabus modules, recorded video lectures, and downloadable question notes.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-12">
          <form method="GET" className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="Search subjects by name (e.g. Calculus, Graphics, Circuits)..."
              className="w-full pl-11 pr-24 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm text-slate-900"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors"
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
