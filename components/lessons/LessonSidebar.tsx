import React from "react";
import Link from "next/link";
import { PlayCircle, CheckCircle, FileText, ChevronDown, Layers } from "lucide-react";
import { Module, Lesson } from "@/types";
import { formatDuration } from "@/lib/utils";

interface LessonSidebarProps {
  subjectSlug: string;
  modules: (Module & { lessons?: Lesson[] })[];
  currentLessonId: string;
}

export function LessonSidebar({ subjectSlug, modules, currentLessonId }: LessonSidebarProps) {
  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4">
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
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
                  return (
                    <Link
                      key={les.id}
                      href={`/subjects/${subjectSlug}/${mod.slug}/${les.slug}`}
                      className={`group flex items-start gap-2.5 p-2 rounded-lg text-xs transition-all ${
                        isActive
                          ? "bg-blue-600 text-white font-medium shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <PlayCircle
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          isActive ? "text-cyan-300" : "text-slate-400 group-hover:text-blue-600"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate leading-tight">{les.title}</div>
                        <div
                          className={`text-[10px] font-mono mt-0.5 ${
                            isActive ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          {formatDuration(les.duration_seconds)}
                        </div>
                      </div>
                    </Link>
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
