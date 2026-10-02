import React from "react";
import { FileText, Download, FileSpreadsheet, Presentation, Archive, ArrowDownToLine } from "lucide-react";
import { Material } from "@/types";
import { formatFileSize } from "@/lib/utils";

interface MaterialCardProps {
  material: Material;
}

export function MaterialCard({ material }: MaterialCardProps) {
  const getIconAndBadge = (type: string, mime: string) => {
    const t = (type + mime).toLowerCase();
    if (t.includes("pdf")) {
      return {
        icon: FileText,
        badge: "PDF",
        color: "text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50",
      };
    }
    if (t.includes("presentation") || t.includes("ppt")) {
      return {
        icon: Presentation,
        badge: "PPTX",
        color: "text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/50",
      };
    }
    if (t.includes("zip") || t.includes("archive")) {
      return {
        icon: Archive,
        badge: "ZIP",
        color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50",
      };
    }
    return {
      icon: FileSpreadsheet,
      badge: "DOC",
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50",
    };
  };

  const { icon: Icon, badge, color } = getIconAndBadge(material.material_type, material.mime_type);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-cyan-500/40 transition-colors">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={`p-2.5 rounded-lg border flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {material.title}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-mono">
            <span className="font-semibold uppercase">{badge}</span>
            <span>•</span>
            <span>{formatFileSize(material.file_size)}</span>
            {material.original_filename && (
              <>
                <span>•</span>
                <span className="truncate max-w-[140px] text-slate-400">{material.original_filename}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <a
        href={material.download_url || "#"}
        download={material.original_filename}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-blue-700 dark:bg-slate-800 dark:hover:bg-cyan-600 transition-colors shrink-0 shadow-xs"
      >
        <ArrowDownToLine className="w-3.5 h-3.5" />
        <span>Download</span>
      </a>
    </div>
  );
}
