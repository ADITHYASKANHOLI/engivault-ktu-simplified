import React from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Layers, Video, FileText } from "lucide-react";
import { Subject } from "@/types";

interface SubjectCardProps {
  subject: Subject;
  index?: number;
}

export function SubjectCard({ subject, index = 1 }: SubjectCardProps) {
  // Select technical icon motif based on subject
  const getSubjectMotif = (title: string, code?: string | null) => {
    const t = (title + (code || "")).toLowerCase();
    if (t.includes("math") || t.includes("mat")) return "∫";
    if (t.includes("graphic") || t.includes("est 110")) return "📐";
    if (t.includes("elect") || t.includes("circuit")) return "⚡";
    return "⚙️";
  };

  const motif = getSubjectMotif(subject.title, subject.code);

  return (
    <div className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between">
      {/* Subtle diagonal technical watermark */}
      <div className="absolute -bottom-6 -right-6 text-7xl font-mono font-black text-slate-100 dark:text-slate-800/50 pointer-events-none select-none opacity-50 group-hover:scale-110 transition-transform duration-300">
        {motif}
      </div>

      <div>
        {/* Header strip: Code + Order Badge */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 border border-blue-100 dark:border-blue-900/50">
              {subject.code || "KTU CORE"}
            </span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {String(index).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
            <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            {subject.modules_count || 1} Modules
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-cyan-400 transition-colors mb-2 leading-snug">
          {subject.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-6 leading-relaxed">
          {subject.short_description || subject.description || "Structured KTU syllabus modules, video lectures, and revision question notes."}
        </p>
      </div>

      {/* Footer metadata & link */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Video className="w-3.5 h-3.5 text-blue-600" />
            {subject.lessons_count || 0} Lectures
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            Notes
          </span>
        </div>

        <Link
          href={`/subjects/${subject.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Explore</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
