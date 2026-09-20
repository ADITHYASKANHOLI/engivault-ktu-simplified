import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, BookOpen, Layers, Video, FileText, ArrowLeft, CheckCircle2 } from "lucide-react";
import { getSubjectBySlug, getModulesForSubject, getLessonsForModule } from "@/lib/queries";
import { LessonRow } from "@/components/lessons/LessonRow";

export const dynamic = "force-dynamic";

interface SubjectDetailPageProps {
  params: Promise<{ subjectSlug: string }>;
}

export async function generateMetadata({ params }: SubjectDetailPageProps) {
  const { subjectSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) return { title: "Subject Not Found — ENGIVAULT" };

  return {
    title: `${subject.title} (${subject.code || "KTU"}) — ENGIVAULT`,
    description: subject.short_description || `Complete KTU module breakdown and recorded video lectures for ${subject.title}.`,
  };
}

export default async function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  const { subjectSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);

  if (!subject) {
    notFound();
  }

  const modules = await getModulesForSubject(subject.id);
  const modulesWithLessons = await Promise.all(
    modules.map(async (mod) => {
      const lessons = await getLessonsForModule(mod.id);
      return {
        ...mod,
        lessons,
      };
    })
  );

  const totalLessons = modulesWithLessons.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <main className="flex-1 pt-28 pb-24 bg-[#F7F9FC]">
      {/* Top Breadcrumbs */}
      <div className="bg-white border-b border-slate-200/80 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/subjects" className="hover:text-blue-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Subjects</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold truncate">{subject.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Subject Header Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0B1F3A] to-[#163B8C] text-white p-8 md:p-12 shadow-xl relative overflow-hidden mb-12">
          {/* Faint technical grid background */}
          <div className="absolute inset-0 bg-tech-grid-dark opacity-35 pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-md bg-cyan-400/20 border border-cyan-300/30 text-cyan-300 text-xs font-mono font-bold">
                {subject.code || "KTU CORE"}
              </span>
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                {modules.length} Modules
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                {totalLessons} Video Lectures
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {subject.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
              {subject.description || subject.short_description || "Comprehensive syllabus breakdown with recorded lectures, derivations, and question papers for KTU university exams."}
            </p>
          </div>
        </div>

        {/* Modules & Lessons Hierarchy */}
        <div className="space-y-10">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-700" />
              <span>Syllabus Modules & Classes</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {modules.length} modules available
            </span>
          </div>

          {modulesWithLessons.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
              <p className="text-sm text-slate-500">Modules for this subject are being prepared. Check back shortly!</p>
            </div>
          ) : (
            modulesWithLessons.map((mod, index) => (
              <div
                key={mod.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6"
              >
                {/* Module Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="font-mono text-xl sm:text-2xl font-black text-cyan-600 bg-cyan-50 px-3 py-1 rounded-xl">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {mod.title}
                      </h3>
                      {mod.short_description && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {mod.short_description}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 font-mono self-start sm:self-auto">
                    {mod.lessons.length} {mod.lessons.length === 1 ? "lecture" : "lectures"}
                  </span>
                </div>

                {/* Lesson List */}
                <div className="space-y-3">
                  {mod.lessons.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-2">
                      Lectures for this module are currently uploading.
                    </div>
                  ) : (
                    mod.lessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        subjectSlug={subject.slug}
                        moduleSlug={mod.slug}
                      />
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
