import React from "react";
import { Subject } from "@/types";
import { SubjectCard } from "./SubjectCard";
import { BookOpen } from "lucide-react";

interface SubjectGridProps {
  subjects: Subject[];
}

export function SubjectGrid({ subjects }: SubjectGridProps) {
  if (subjects.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No subjects published yet</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          The administrator is preparing subjects. Check back shortly for updated KTU curriculum lectures.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map((subject, idx) => (
        <SubjectCard key={subject.id} subject={subject} index={idx + 1} />
      ))}
    </div>
  );
}
