import React from "react";
import Link from "next/link";
import { PlayCircle, Layers } from "lucide-react";
import { YoutubeIcon } from "@/components/icons/YoutubeIcon";
import { Module, Lesson } from "@/types";
import { formatDuration } from "@/lib/utils";
import { getYouTubeWatchUrl } from "@/lib/utils/youtube";

interface LessonSidebarProps {
  subjectSlug: string;
  modules: (Module & { lessons?: Lesson[] })[];
  currentLessonId: string;
}

export function LessonSidebar({ subjectSlug, modules, currentLessonId }: LessonSidebarProps) {
  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4">
      <div className="rounded-md border border-[#dce2da] bg-white p-4">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
            Syllabus Navigation
          </h3>
        </div>

        <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {modules.map((mod, mIdx) => (
            <div key={mod.id} className="space-y-1.5">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 px-2 py-1 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between">
                <span className="truncate">
                  {mod.title}
                </span>
                <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                  M{mIdx + 1}
                </span>
              </div>

              <div className="space-y-1 pl-1">
                {(mod.lessons || []).map((les) => {
                  const isActive = les.id === currentLessonId;
                  const lesWatchUrl =
                    getYouTubeWatchUrl(les.youtube_video_id || les.youtubeVideoId) ||
                    getYouTubeWatchUrl(les.youtube_url || les.youtubeUrl);

                  return (
                    <div
                      key={les.id}
                      className={`group flex items-center justify-between p-1.5 rounded-sm text-xs transition-colors ${
                        isActive
                          ? "bg-[#176b45] text-white font-medium"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Link
                        href={`/subjects/${subjectSlug}/${mod.slug}/${les.slug}`}
                        className="flex items-start gap-2.5 min-w-0 flex-1"
                        aria-label={`View lecture notes for ${les.title}`}
                      >
                        <PlayCircle
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            isActive ? "text-[#b7d7c2]" : "text-slate-400 group-hover:text-emerald-600"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate leading-tight">{les.title}</div>
                          <div
                            className={`text-[10px] font-mono mt-0.5 ${
                              isActive ? "text-white/80" : "text-slate-400"
                            }`}
                          >
                            {formatDuration(les.duration_seconds)}
                          </div>
                        </div>
                      </Link>

                      {lesWatchUrl && (
                        <a
                          href={lesWatchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Watch lecture on YouTube (opens in new tab)"
                          aria-label={`Watch ${les.title} on YouTube (opens in new tab)`}
                          className={`p-1 rounded transition-colors shrink-0 ${
                            isActive
                              ? "text-white/80 hover:text-white hover:bg-[#105437]"
                              : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                          }`}
                        >
                          <YoutubeIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
