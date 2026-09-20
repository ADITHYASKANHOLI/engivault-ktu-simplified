import React from "react";
import Link from "next/link";
import { PlayCircle, Clock, ChevronRight, FileText } from "lucide-react";
import { Lesson } from "@/types";
import { formatDuration } from "@/lib/utils";

interface LessonRowProps {
  lesson: Lesson;
  subjectSlug: string;
  moduleSlug: string;
  isActive?: boolean;
}

export function LessonRow({ lesson, subjectSlug, moduleSlug, isActive = false }: LessonRowProps) {
  return (
    <Link
      href={`/subjects/${subjectSlug}/${moduleSlug}/${lesson.slug}`}
      className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
        isActive
          ? "bg-blue-50/80 dark:bg-blue-950/60 border-blue-500/50 shadow-sm"
          : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-cyan-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs"
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            isActive
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white"
          }`}
        >
          <PlayCircle className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-700 dark:group-hover:text-cyan-400 transition-colors">
            {lesson.title}
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-0.5">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-slate-400" />
              {formatDuration(lesson.duration_seconds)}
            </span>
            {lesson.materials && lesson.materials.length > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-cyan-400">
                  <FileText className="w-3 h-3" />
                  {lesson.materials.length} resource{lesson.materials.length > 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-3">
        <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
          Watch
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-all" />
      </div>
    </Link>
  );
}
