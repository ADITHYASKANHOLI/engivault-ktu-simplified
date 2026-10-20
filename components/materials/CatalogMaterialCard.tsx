import React from "react";
import Link from "next/link";
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Archive,
  ArrowDownToLine,
  ExternalLink,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
} from "lucide-react";
import { Material } from "@/types";
import { formatFileSize } from "@/lib/utils";

interface CatalogMaterialCardProps {
  material: Material;
}

export function CatalogMaterialCard({ material }: CatalogMaterialCardProps) {
  // Format upload date safely
  const formattedDate = React.useMemo(() => {
    if (!material.created_at) return null;
    try {
      const d = new Date(material.created_at);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  }, [material.created_at]);

  // Determine icon, badge label and color
  const getTypeMeta = (type: string = "", mime: string = "") => {
    const combined = `${type} ${mime}`.toLowerCase();
    if (combined.includes("question") || combined.includes("pyq") || combined.includes("exam")) {
      return {
        icon: GraduationCap,
        badge: "Question Bank",
        color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60",
      };
    }
    if (combined.includes("pdf")) {
      return {
        icon: FileText,
        badge: "PDF Notes",
        color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
      };
    }
    if (combined.includes("presentation") || combined.includes("ppt")) {
      return {
        icon: Presentation,
        badge: "Slides",
        color: "text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60",
      };
    }
    if (combined.includes("zip") || combined.includes("rar") || combined.includes("archive")) {
      return {
        icon: Archive,
        badge: "Archive",
        color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60",
      };
    }
    return {
      icon: FileSpreadsheet,
      badge: "Document",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60",
    };
  };

  const { icon: TypeIcon, badge, color } = getTypeMeta(
    material.material_type,
    material.mime_type
  );

  const downloadHref =
    material.download_url ||
    (material.storage_path
      ? `/api/materials/download?path=${encodeURIComponent(material.storage_path)}`
      : `/api/materials/download?id=${material.id}`);

  return (
    <article className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all flex flex-col justify-between h-full">
      <div className="space-y-3">
        {/* Header: Type Badge & File Size */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider border ${color}`}
            >
              <TypeIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{badge}</span>
            </span>
          </div>
          {material.file_size ? (
            <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70 px-2 py-0.5 rounded">
              {formatFileSize(material.file_size)}
            </span>
          ) : null}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug break-words group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {material.title}
          </h3>
          {material.description ? (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed break-words">
              {material.description}
            </p>
          ) : null}
        </div>

        {/* Academic Hierarchy Context Pills */}
        <div className="space-y-1.5 pt-1">
          {material.subject && (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <Link
                href={`/subjects/${material.subject.slug}`}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold truncate hover:underline"
                title={`${material.subject.code ? material.subject.code + ": " : ""}${material.subject.title}`}
              >
                {material.subject.code ? `${material.subject.code} — ` : ""}
                {material.subject.title}
              </Link>
            </div>
          )}

          {material.module && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {material.module.display_order
                  ? `Module ${material.module.display_order}: `
                  : ""}
                {material.module.title}
              </span>
            </div>
          )}

          {material.lesson && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-3.5 h-3.5 text-center font-bold text-[10px] text-slate-400 leading-none shrink-0">
                ▶
              </span>
              <span className="truncate text-slate-600 dark:text-slate-300">
                {material.lesson.title}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Upload Date */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 dark:text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate ? `Added ${formattedDate}` : "KTU Syllabus Material"}</span>
        </div>

        {/* Action Buttons: Compliant with WCAG 44x44px touch targets */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={downloadHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px]"
            title="Preview study material"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <span>View</span>
          </a>

          <a
            href={downloadHref}
            download={material.original_filename || `${material.title}.pdf`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px]"
            title="Download study material"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Download</span>
          </a>
        </div>
      </div>
    </article>
  );
}
