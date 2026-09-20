import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft, ArrowRight, FileText, Download, Clock, BookOpen, Layers } from "lucide-react";
import { getSubjectBySlug, getModuleBySlug, getLessonBySlug, getModulesForSubject, getLessonsForModule } from "@/lib/queries";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { LessonSidebar } from "@/components/lessons/LessonSidebar";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface LessonPageProps {
  params: Promise<{ subjectSlug: string; moduleSlug: string; lessonSlug: string }>;
}

export async function generateMetadata({ params }: LessonPageProps) {
  const { subjectSlug, moduleSlug, lessonSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) return { title: "Lesson Not Found — ENGIVAULT" };

  const mod = await getModuleBySlug(subject.id, moduleSlug);
  if (!mod) return { title: "Lesson Not Found — ENGIVAULT" };

  const lesson = await getLessonBySlug(mod.id, lessonSlug);
  if (!lesson) return { title: "Lesson Not Found — ENGIVAULT" };

  return {
    title: `${lesson.title} — ${subject.title} — ENGIVAULT`,
    description: lesson.description || `Watch recorded lecture for ${lesson.title} (${subject.title} - ${mod.title}).`,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { subjectSlug, moduleSlug, lessonSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) notFound();

  const currentModule = await getModuleBySlug(subject.id, moduleSlug);
  if (!currentModule) notFound();

  const lesson = await getLessonBySlug(currentModule.id, lessonSlug);
  if (!lesson) notFound();

  // Fetch all modules with lessons for sidebar navigation
  const allModules = await getModulesForSubject(subject.id);
  const modulesWithLessons = await Promise.all(
    allModules.map(async (m) => {
      const lessons = await getLessonsForModule(m.id);
      return {
        ...m,
        lessons,
      };
    })
  );

  // Determine Previous and Next lesson
  const currentModuleLessons = modulesWithLessons.find((m) => m.id === currentModule.id)?.lessons || [];
  const currentIndex = currentModuleLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? currentModuleLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < currentModuleLessons.length - 1 ? currentModuleLessons[currentIndex + 1] : null;

  return (
    <main className="flex-1 pt-28 pb-24 bg-[#F7F9FC]">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200/80 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto whitespace-nowrap">
          <Link href="/subjects" className="hover:text-blue-700">Subjects</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link href={`/subjects/${subject.slug}`} className="hover:text-blue-700 truncate">{subject.title}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link href={`/subjects/${subject.slug}/${currentModule.slug}`} className="hover:text-blue-700 truncate">{currentModule.title}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-semibold truncate">{lesson.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Video & Content Area */}
          <div className="flex-1 w-full space-y-6">
            {/* Video Player */}
            <VideoPlayer
              playbackUrl={lesson.video?.playback_url}
              title={lesson.title}
              durationSeconds={lesson.duration_seconds}
              posterUrl={lesson.thumbnail_path}
            />

            {/* Title & Metadata Strip */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-600 mb-1">
                    <span>{subject.code || "KTU"}</span>
                    <span>•</span>
                    <span>{currentModule.title}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    {lesson.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDuration(lesson.duration_seconds)}</span>
                </div>
              </div>

              {/* Description */}
              {lesson.description && (
                <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Lecture Overview & Key Concepts
                  </h3>
                  <p>{lesson.description}</p>
                </div>
              )}

              {/* Next / Previous Navigation Controls */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                {prevLesson ? (
                  <Link
                    href={`/subjects/${subject.slug}/${currentModule.slug}/${prevLesson.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-lg border border-slate-200 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[150px] sm:max-w-none">Previous: {prevLesson.title}</span>
                  </Link>
                ) : <div />}

                {nextLesson ? (
                  <Link
                    href={`/subjects/${subject.slug}/${currentModule.slug}/${nextLesson.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors shadow-xs"
                  >
                    <span className="truncate max-w-[150px] sm:max-w-none">Next: {nextLesson.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    href={`/subjects/${subject.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-700 bg-cyan-50 px-4 py-2 rounded-lg"
                  >
                    <span>All Subject Modules</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Downloadable Materials & Notes */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-mono flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>Downloadable Study Materials & Question Papers</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {(lesson.materials || []).length} available
                </span>
              </div>

              {(!lesson.materials || lesson.materials.length === 0) ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No additional study documents attached to this lecture yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {lesson.materials.map((mat) => (
                    <MaterialCard key={mat.id} material={mat} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Syllabus Sidebar */}
          <LessonSidebar
            subjectSlug={subject.slug}
            modules={modulesWithLessons}
            currentLessonId={lesson.id}
          />
        </div>
      </div>
    </main>
  );
}
