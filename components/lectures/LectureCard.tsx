import React from "react";
import Link from "next/link";
import { Play, Clock, User, BookOpen, ExternalLink, VideoOff } from "lucide-react";
import { YoutubeIcon } from "@/components/icons/YoutubeIcon";
import { Lesson } from "@/types";
import { formatDuration } from "@/lib/utils";
import { extractYouTubeVideoId, getYouTubeThumbnailUrl, getYouTubeWatchUrl } from "@/lib/utils/youtube";

interface LectureCardProps {
  lecture: Lesson;
  subjectSlug?: string;
  moduleSlug?: string;
  subjectTitle?: string;
  moduleTitle?: string;
  topicTitle?: string;
  instructorName?: string;
  index?: number;
}

export function LectureCard({
  lecture,
  subjectSlug,
  moduleSlug,
  subjectTitle,
  moduleTitle,
  topicTitle,
  instructorName,
  index,
}: LectureCardProps) {
  // Derive canonical watch URL strictly via shared YouTube utility
  const watchUrl =
    getYouTubeWatchUrl(lecture.youtube_video_id || lecture.youtubeVideoId) ||
    getYouTubeWatchUrl(lecture.youtube_url || lecture.youtubeUrl);

  const videoId = watchUrl ? extractYouTubeVideoId(watchUrl) : null;

  const thumbnailUrl =
    (videoId ? getYouTubeThumbnailUrl(videoId, "hqdefault") : null) ||
    lecture.thumbnail_path ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60";

  const effectiveSubjectSlug = subjectSlug || lecture.subject?.slug || lecture.module?.subject?.slug;
  const effectiveModuleSlug = moduleSlug || lecture.module?.slug;
  const notesHref =
    effectiveSubjectSlug && effectiveModuleSlug && lecture.slug
      ? `/subjects/${effectiveSubjectSlug}/${effectiveModuleSlug}/${lecture.slug}`
      : null;

  const seq = lecture.sequence_order || lecture.orderIndex || index || 1;
  const seqFormatted = String(seq).padStart(2, "0");

  const displayModule = moduleTitle || lecture.module?.title || "MODULE 1";
  const displaySubject = subjectTitle || lecture.subject?.title || lecture.module?.subject?.title || "Engineering";
  const displayTopic = topicTitle || lecture.topic?.title;
  const displayFaculty = instructorName || lecture.instructor || lecture.faculty?.name || "KTU Faculty";

  // When a valid YouTube destination exists, the card is a genuine external anchor opening in a new tab
  if (watchUrl) {
    return (
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Watch lecture ${lecture.title} on YouTube (opens in new tab)`}
        className="group flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-xl hover:border-red-500/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/50"
      >
        {/* 16:9 Video Thumbnail Container with Academic Overlays */}
        <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt={lecture.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Academic Context Badge on top-left of video */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/85 backdrop-blur-md border border-white/10 text-white shadow-xs">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              {displayModule.toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-400">•</span>
            <span className="font-mono text-[10px] font-semibold text-slate-200">
              LEC {seqFormatted}
            </span>
          </div>

          {/* YouTube Play Button Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>

          {/* Duration Badge on bottom-right */}
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[11px] font-medium flex items-center gap-1 shadow-xs">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>{formatDuration(lecture.duration_seconds)}</span>
          </div>
        </div>

        {/* Academic Content Block */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
          <div>
            {/* Subject & Topic Context */}
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-cyan-400 font-semibold mb-1.5">
              <span className="flex items-center gap-1 truncate">
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{displaySubject}</span>
              </span>
              {displayTopic && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 font-mono text-[11px] truncate">{displayTopic}</span>
                </>
              )}
            </div>

            {/* Lecture Title */}
            <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              {lecture.title}
            </h3>

            {/* Short description if available */}
            {lecture.short_description && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                {lecture.short_description}
              </p>
            )}
          </div>

          {/* Instructor / Faculty strip & Direct Watch Action */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                {displayFaculty}
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-xs group-hover:underline shrink-0">
              <YoutubeIcon className="w-3.5 h-3.5 text-red-600" />
              <span>Watch on YouTube</span>
              <ExternalLink className="w-3 h-3 text-red-500" />
            </span>
          </div>
        </div>
      </a>
    );
  }

  // Graceful controlled fallback for lectures without a valid YouTube destination
  return (
    <div
      className="flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm opacity-90"
      aria-label={`${lecture.title} (Video stream unavailable)`}
    >
      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex items-center justify-center">
        {thumbnailUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnailUrl}
            alt={lecture.title}
            className="w-full h-full object-cover opacity-50"
            loading="lazy"
          />
        ) : null}

        <div className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center p-4 text-center">
          <VideoOff className="w-8 h-8 text-slate-400 mb-2" />
          <span className="text-xs font-semibold text-rose-300">Video Unavailable</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Syllabus notes available below</span>
        </div>

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/85 backdrop-blur-md border border-white/10 text-white shadow-xs">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            {displayModule.toUpperCase()}
          </span>
          <span className="text-[10px] text-slate-400">•</span>
          <span className="font-mono text-[10px] font-semibold text-slate-200">
            LEC {seqFormatted}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1.5">
            <span className="flex items-center gap-1 truncate">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{displaySubject}</span>
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
            {lecture.title}
          </h3>

          {lecture.short_description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
              {lecture.short_description}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium text-slate-700 dark:text-slate-300">
              {displayFaculty}
            </span>
          </div>

          {notesHref ? (
            <Link
              href={notesHref}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-xs"
            >
              <span>View Notes</span>
              <BookOpen className="w-3 h-3" />
            </Link>
          ) : (
            <span className="text-slate-400 font-mono text-[11px]">Video pending</span>
          )}
        </div>
      </div>
    </div>
  );
}
