import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, BookOpen, Layers, Video, FileText, ArrowLeft } from "lucide-react";
import { getSubjectBySlug, getModulesForSubject, getLessonsForModule, getMaterialsForSubject } from "@/lib/queries";
import { LessonRow } from "@/components/lessons/LessonRow";
import { CatalogMaterialCard } from "@/components/materials/CatalogMaterialCard";

export const dynamic = "force-dynamic";

interface SubjectDetailPageProps {
  params: Promise<{ subjectSlug: string }>;
}

export async function generateMetadata({ params }: SubjectDetailPageProps) {
  const { subjectSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) return { title: "Subject Not Found — FOLE" };

  return {
    title: `${subject.title} (${subject.code || "KTU"}) — FOLE`,
    description: subject.short_description || `Complete KTU module breakdown and recorded video lectures for ${subject.title}.`,
  };
}

export default async function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  const { subjectSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);

  if (!subject) {
    notFound();
  }

  const [modules, subjectMaterials] = await Promise.all([
    getModulesForSubject(subject.id),
    getMaterialsForSubject(subject.id),
  ]);

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
    <main className="flex-1 pt-24 pb-24 bg-[#f7f6ef]">
      {/* Top Breadcrumbs */}
      <div className="bg-white border-b border-slate-200/80 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/subjects" className="hover:text-[#176b45] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Subjects</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold truncate">{subject.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Subject Header Banner */}
        <div className="mb-12 bg-[#123d2b] p-8 text-white md:p-12">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-md bg-white/10 border border-white/20 text-[#c7e1ce] text-xs font-mono font-bold">
                {subject.code || "KTU CORE"}
              </span>
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#b7d7c2]" />
                {modules.length} Modules
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#b7d7c2]" />
                {totalLessons} Video Lectures
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#b7d7c2]" />
                {subjectMaterials.length} Study Materials
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {subject.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
              {subject.description || subject.short_description || "Comprehensive syllabus breakdown with recorded lectures, derivations, and question papers for KTU university exams."}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href={`/materials?subject=${subject.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-none bg-white hover:bg-[#e9f0e9] text-[#123d2b] font-bold text-xs transition-colors "
              >
                <FileText className="w-3.5 h-3.5 text-slate-950" />
                <span>Browse Subject Notes & PYQs</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Modules & Lessons Hierarchy */}
        <div className="space-y-10">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#176b45]" />
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
                className="border-y border-[#dce2da] bg-white p-6 space-y-6"
              >
                {/* Module Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="font-mono text-xl sm:text-2xl font-black text-[#176b45] bg-[#e7f0e8] px-3 py-1 rounded-md">
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

        {/* Subject Study Materials Section */}
        {subjectMaterials.length > 0 && (
          <div className="mt-14 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Subject Study Materials & Question Banks</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Handpicked revision notes, module slides, and previous KTU question papers for this subject.
                </p>
              </div>
              <Link
                href={`/materials?subject=${subject.slug}`}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0"
              >
                <span>View all in materials catalog</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {subjectMaterials.slice(0, 6).map((material) => (
                <CatalogMaterialCard key={material.id} material={material} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
