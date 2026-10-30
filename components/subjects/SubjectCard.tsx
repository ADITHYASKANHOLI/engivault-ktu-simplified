import React from "react";
import Link from "next/link";
import { ArrowUpRight, FileText, Layers, Video } from "lucide-react";
import { Subject } from "@/types";

interface SubjectCardProps {
  subject: Subject;
  index?: number;
}

export function SubjectCard({ subject, index = 1 }: SubjectCardProps) {
  return (
    <article className="group flex h-full flex-col border border-[#dce2da] bg-white p-5 transition-colors hover:border-[#8cae98] sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#e8ece6] pb-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#176b45]">
          {subject.code || "KTU SUBJECT"}
        </span>
        <span className="font-mono text-[11px] text-[#89958c]">{String(index).padStart(2, "0")}</span>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold leading-snug text-[#17231c] transition-colors group-hover:text-[#176b45]">
          {subject.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#647168]">
          {subject.short_description || subject.description || "Explore the syllabus, recorded lectures, and study materials for this subject."}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e8ece6] pt-4 text-xs text-[#647168]">
        <span className="inline-flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-[#176b45]" />{subject.modules_count || 1} modules</span>
        <span className="inline-flex items-center gap-1.5"><Video className="h-3.5 w-3.5 text-[#176b45]" />{subject.lessons_count || 0} lectures</span>
        <span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-[#176b45]" />Study notes</span>
        <Link href={`/subjects/${subject.slug}`} className="ml-auto inline-flex items-center gap-1 font-semibold text-[#176b45] hover:text-[#105437]">
          Explore <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
