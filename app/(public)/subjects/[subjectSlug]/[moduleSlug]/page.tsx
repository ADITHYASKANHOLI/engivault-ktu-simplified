import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft, BookOpen, Video } from "lucide-react";
import { getSubjectBySlug, getModuleBySlug, getLessonsForModule } from "@/lib/queries";
import { LessonRow } from "@/components/lessons/LessonRow";

export const dynamic = "force-dynamic";

interface ModuleDetailPageProps {
  params: Promise<{ subjectSlug: string; moduleSlug: string }>;
}

export async function generateMetadata({ params }: ModuleDetailPageProps) {
  const { subjectSlug, moduleSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) return { title: "Module Not Found — ENGIVAULT" };
  const mod = await getModuleBySlug(subject.id, moduleSlug);
  if (!mod) return { title: "Module Not Found — ENGIVAULT" };

  return {
    title: `${mod.title} — ${subject.title} — ENGIVAULT`,
    description: mod.short_description || `Lectures and materials for ${mod.title}.`,
  };
}

export default async function ModuleDetailPage({ params }: ModuleDetailPageProps) {
  const { subjectSlug, moduleSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) notFound();

  const mod = await getModuleBySlug(subject.id, moduleSlug);
  if (!mod) notFound();

  const lessons = await getLessonsForModule(mod.id);

  return (
    <main className="flex-1 pt-28 pb-24 bg-[#F7F9FC]">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200/80 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto">
          <Link href="/subjects" className="hover:text-blue-700">Subjects</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link href={`/subjects/${subject.slug}`} className="hover:text-blue-700 truncate">{subject.title}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-semibold truncate">{mod.title}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <Link
            href={`/subjects/${subject.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {subject.title}</span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{mod.title}</h1>
          {mod.short_description && (
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{mod.short_description}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-600" />
              <span>Lectures in this Module</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">{lessons.length} lectures</span>
          </div>

          {lessons.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
              No lectures uploaded for this module yet.
            </div>
          ) : (
            lessons.map((lesson) => (
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
    </main>
  );
}
