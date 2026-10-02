import React from "react";
import Link from "next/link";
import { PlayCircle, Clock, ChevronRight, FileText, Play } from "lucide-react";
import { Lesson } from "@/types";
import { formatDuration } from "@/lib/utils";
import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from "@/lib/utils/youtube";

interface LessonRowProps {
  lesson: Lesson;
  subjectSlug: string;
  moduleSlug: string;
  isActive?: boolean;
}

export function LessonRow({ lesson, subjectSlug, moduleSlug, isActive = false }: LessonRowProps) {
  const videoId =
    lesson.youtube_video_id ||
    lesson.youtubeVideoId ||
    (lesson.youtube_url ? extractYouTubeVideoId(lesson.youtube_url) : null);

  const thumbnailUrl =
    (videoId ? getYouTubeThumbnailUrl(videoId) : null) ||
    lesson.thumbnail_path;

  return (
    <Link
      href={`/subjects/${subjectSlug}/${moduleSlug}/${lesson.slug}`}
      className={`group flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
        isActive
          ? "bg-blue-50/80 dark:bg-blue-950/60 border-blue-500/50 shadow-sm"
          : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-cyan-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs"
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
        {/* Lecture Thumbnail / Play Icon */}
        {thumbnailUrl ? (
          <div className="relative w-14 sm:w-16 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-800 bg-slate-900 shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt={lesson.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-3.5 h-3.5 text-white fill-white" />
            </div>
          </div>
        ) : (
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isActive
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white"
            }`}
          >
            <PlayCircle className="w-5 h-5" />
          </div>
        )}

        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-700 dark:group-hover:text-cyan-400 transition-colors">
            {lesson.title}
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-0.5">
            {lesson.module?.title && (
              <>
                <span className="font-mono text-[11px] text-slate-400 hidden sm:inline truncate max-w-[120px]">
                  {lesson.module.title}
                </span>
                <span className="hidden sm:inline">•</span>
              </>
            )}
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-slate-400" />
              {formatDuration(lesson.duration_seconds)}
            </span>
            {lesson.materials && lesson.materials.length > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-cyan-400 text-[11px]">
                  <FileText className="w-3 h-3" />
                  {lesson.materials.length} resource{lesson.materials.length > 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-3 shrink-0">
        <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
          Watch
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-all" />
      </div>
    </Link>
  );
}
