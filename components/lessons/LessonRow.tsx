import React from "react";
import Link from "next/link";
import { PlayCircle, Clock, FileText, Play, ExternalLink, VideoOff } from "lucide-react";
import { YoutubeIcon } from "@/components/icons/YoutubeIcon";
import { Lesson } from "@/types";
import { formatDuration } from "@/lib/utils";
import { extractYouTubeVideoId, getYouTubeThumbnailUrl, getYouTubeWatchUrl } from "@/lib/utils/youtube";

interface LessonRowProps {
  lesson: Lesson;
  subjectSlug: string;
  moduleSlug: string;
  isActive?: boolean;
}

export function LessonRow({ lesson, subjectSlug, moduleSlug, isActive = false }: LessonRowProps) {
  const watchUrl =
    getYouTubeWatchUrl(lesson.youtube_video_id || lesson.youtubeVideoId) ||
    getYouTubeWatchUrl(lesson.youtube_url || lesson.youtubeUrl);

  const videoId = watchUrl ? extractYouTubeVideoId(watchUrl) : null;

  const thumbnailUrl =
    (videoId ? getYouTubeThumbnailUrl(videoId, "hqdefault") : null) ||
    lesson.thumbnail_path;

  const internalNotesHref = `/subjects/${subjectSlug}/${moduleSlug}/${lesson.slug}`;

  // When a valid YouTube destination exists, clicking anywhere on the row opens the video in a new tab
  if (watchUrl) {
    return (
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Watch lecture ${lesson.title} on YouTube (opens in new tab)`}
        className={`group flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
          isActive
            ? "bg-red-50/80 dark:bg-red-950/40 border-red-500/50 shadow-sm"
            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-red-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs"
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
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <Play className="w-3.5 h-3.5 text-white fill-white" />
              </div>
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isActive
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white"
              }`}
            >
              <PlayCircle className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
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
              {lesson.instructor && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[120px] hidden sm:inline">
                    {lesson.instructor}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 group-hover:underline">
            <YoutubeIcon className="w-3.5 h-3.5 text-red-600" />
            <span>Watch on YouTube</span>
            <ExternalLink className="w-3 h-3 text-red-500" />
          </span>
        </div>
      </a>
    );
  }

  // Fallback for lessons without a valid YouTube link
  return (
    <Link
      href={internalNotesHref}
      aria-label={`View notes for: ${lesson.title}`}
      className="group flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 transition-all shadow-xs"
    >
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-400">
          <VideoOff className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-700 truncate">
            {lesson.title}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Video link pending • Study materials available
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 pl-3 text-xs font-semibold text-blue-600 group-hover:underline shrink-0">
        <FileText className="w-3.5 h-3.5" />
        <span>View Notes</span>
      </div>
    </Link>
  );
}
