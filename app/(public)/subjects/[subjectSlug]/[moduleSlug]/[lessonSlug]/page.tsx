import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  FileText,
  Clock,
  User,
  Layers,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { YoutubeIcon } from "@/components/icons/YoutubeIcon";
import { getYouTubeWatchUrl } from "@/lib/utils/youtube";
import {
  getSubjectBySlug,
  getModuleBySlug,
  getLessonBySlug,
  getModulesForSubject,
  getLessonsForModule,
} from "@/lib/queries";
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
  if (!subject) return { title: "Lecture Not Found — ENGIVAULT" };

  const mod = await getModuleBySlug(subject.id, moduleSlug);
  if (!mod) return { title: "Lecture Not Found — ENGIVAULT" };

  const lesson = await getLessonBySlug(mod.id, lessonSlug);
  if (!lesson) return { title: "Lecture Not Found — ENGIVAULT" };

  return {
    title: `${lesson.title} — ${subject.title} — ENGIVAULT`,
    description:
      lesson.description ||
      `Watch recorded academic lecture for ${lesson.title} (${subject.title} - ${mod.title}).`,
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

  const watchUrl =
    getYouTubeWatchUrl(lesson.youtube_video_id || lesson.youtubeVideoId) ||
    getYouTubeWatchUrl(lesson.youtube_url || lesson.youtubeUrl);

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
  const currentModuleLessons =
    modulesWithLessons.find((m) => m.id === currentModule.id)?.lessons || [];
  const currentIndex = currentModuleLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? currentModuleLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < currentModuleLessons.length - 1
      ? currentModuleLessons[currentIndex + 1]
      : null;

  return (
    <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24 bg-[#F8FAFC]">
      {/* 5-Tier Academic Breadcrumbs */}
      <div className="bg-white border-b border-slate-200/80 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto whitespace-nowrap">
          <Link href="/subjects" className="min-h-[36px] sm:min-h-0 hover:text-blue-700 inline-flex items-center gap-1 font-semibold shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>EngiVault</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

          {subject.department && (
            <>
              <span className="text-slate-600 truncate">{subject.department.name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </>
          )}

          {subject.semester_number && (
            <>
              <span className="text-slate-600">Semester {subject.semester_number}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </>
          )}

          <Link href={`/subjects/${subject.slug}`} className="min-h-[36px] sm:min-h-0 inline-flex items-center hover:text-blue-700 truncate font-semibold">
            {subject.title}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

          <Link href={`/subjects/${subject.slug}/${currentModule.slug}`} className="min-h-[36px] sm:min-h-0 inline-flex items-center hover:text-blue-700 truncate">
            {currentModule.title}
          </Link>

          {lesson.topic && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-blue-700 font-semibold truncate">
                {lesson.topic.title}
              </span>
            </>
          )}

          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-bold truncate">Lecture {lesson.lesson_number ?? 1}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
          {/* Main Video & Content Area */}
          <div className="flex-1 w-full min-w-0 space-y-6">
            {/* Primary Focus: Large 16:9 YouTube Video Player */}
            <div className="space-y-4">
              <VideoPlayer
                youtubeUrl={lesson.youtube_url || lesson.youtubeUrl}
                youtubeVideoId={lesson.youtube_video_id || lesson.youtubeVideoId}
                playbackUrl={lesson.video?.playback_url}
                title={lesson.title}
                durationSeconds={lesson.duration_seconds}
                posterUrl={lesson.thumbnail_path}
              />
            </div>

            {/* Lecture Title & Academic Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold text-blue-700 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                      {subject.code || "KTU"}
                    </span>
                    <span>•</span>
                    <span>{currentModule.title}</span>
                    {lesson.topic && (
                      <>
                        <span>•</span>
                        <span className="text-slate-700">Topic: {lesson.topic.title}</span>
                      </>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    {lesson.title}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  {watchUrl && (
                    <a
                      href={watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all"
                    >
                      <YoutubeIcon className="w-4 h-4 text-white" />
                      <span>Watch on YouTube</span>
                      <ExternalLink className="w-3.5 h-3.5 text-white/90" />
                    </a>
                  )}

                  <div className="min-h-[40px] sm:min-h-0 flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDuration(lesson.duration_seconds || 1200)}</span>
                  </div>
                </div>
              </div>

              {/* Faculty / Instructor Card */}
              {(lesson.instructor || lesson.faculty) && (
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                    <User className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{lesson.instructor || lesson.faculty?.name}</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono">
                        Faculty
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {lesson.faculty?.title || "Department Faculty Instructor"}
                    </div>
                  </div>
                </div>
              )}

              {/* Description & Learning Notes */}
              {lesson.description && (
                <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Lecture Overview & Key Concepts
                  </h3>
                  <p>{lesson.description}</p>
                </div>
              )}

              {/* Next / Previous / Topic Navigation Controls */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                {prevLesson ? (
                  <Link
                    href={`/subjects/${subject.slug}/${currentModule.slug}/${prevLesson.slug}`}
                    className="min-h-[44px] inline-flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[220px] sm:max-w-none">
                      Previous: {prevLesson.title}
                    </span>
                  </Link>
                ) : (
                  <div className="hidden sm:block" />
                )}

                <Link
                  href={`/subjects/${subject.slug}/${currentModule.slug}`}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Back to Module</span>
                </Link>

                {nextLesson ? (
                  <Link
                    href={`/subjects/${subject.slug}/${currentModule.slug}/${nextLesson.slug}`}
                    className="min-h-[44px] inline-flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 px-4.5 py-2.5 rounded-xl transition-colors shadow-xs"
                  >
                    <span className="truncate max-w-[220px] sm:max-w-none">
                      Next: {nextLesson.title}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </Link>
                ) : (
                  <Link
                    href={`/subjects/${subject.slug}`}
                    className="min-h-[44px] inline-flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <span>All Subject Modules</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </Link>
                )}
              </div>
            </div>

            {/* Downloadable Materials & Notes */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-mono flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Downloadable Study Materials & Lecture Notes</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono shrink-0">
                  {(lesson.materials || []).length} available
                </span>
              </div>

              {!lesson.materials || lesson.materials.length === 0 ? (
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

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <Link
                  href={`/materials?subject=${subject.slug}&module=${currentModule.slug}`}
                  className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <span>Browse all notes & question banks for this module</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                </Link>
              </div>
            </div>
          </div>

          {/* Sticky Syllabus Playlist Sidebar */}
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
