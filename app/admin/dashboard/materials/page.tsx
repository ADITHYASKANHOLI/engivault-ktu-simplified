"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Trash2,
  Plus,
  Download,
  ArrowDownToLine,
} from "lucide-react";
import { Material } from "@/types";
import { formatFileSize, formatDate } from "@/lib/utils";

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/admin/materials");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/materials?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to delete material: ${err.error || "Server error"}`);
      } else {
        await fetchMaterials();
      }
    } catch (err) {
      console.error(err);
      alert("Network error deleting material.");
    } finally {
      setDeletingId(null);
    }
  };

  const getDownloadUrl = (m: Material) => {
    return (
      m.download_url ||
      (m.storage_path
        ? `/api/materials/download?path=${encodeURIComponent(m.storage_path)}`
        : `/api/materials/download?id=${m.id}`)
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Study Materials & Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage downloadable handwritten notes, university question banks, and syllabus formulas.
          </p>
        </div>

        <Link
          href="/admin/dashboard/uploads"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors shadow-xs min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Material</span>
        </Link>
      </div>

      {/* Mobile Stacked Record Cards (Narrow screens < 768px) */}
      <div className="block md:hidden space-y-3.5">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Loading study materials...
          </div>
        ) : materials.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No study materials uploaded yet.</p>
            <p className="text-[11px] text-slate-500">Use the Upload Material button above to add notes or question banks.</p>
          </div>
        ) : (
          materials.map((m) => (
            <div
              key={m.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug break-words">
                      {m.title}
                    </h2>
                    {m.original_filename && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
                        {m.original_filename}
                      </p>
                    )}
                  </div>
                </div>

                <span className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {m.material_type}
                </span>
              </div>

              {/* Meta information row */}
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>{formatFileSize(m.file_size)}</span>
                <span>•</span>
                <span>{formatDate(m.created_at)}</span>
              </div>

              {/* Action buttons with compliance to 44px min touch target */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={getDownloadUrl(m)}
                  download={m.original_filename || true}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-3 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                  <span>Download</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleDelete(m.id, m.title)}
                  disabled={deletingId === m.id}
                  className="h-11 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
                  aria-label={`Delete ${m.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden xs:inline">Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Data Table (Screens >= 768px) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <tr>
                <th className="p-4">Material Title</th>
                <th className="p-4">Type</th>
                <th className="p-4">File Size</th>
                <th className="p-4">Uploaded</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Loading study materials...
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No materials uploaded yet.
                  </td>
                </tr>
              ) : (
                materials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div>{m.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono font-normal truncate max-w-xs">
                            {m.original_filename}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono uppercase font-bold text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                        {m.material_type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{formatFileSize(m.file_size)}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{formatDate(m.created_at)}</td>
                    <td className="p-4 text-right space-x-1.5">
                      <a
                        href={getDownloadUrl(m)}
                        download={m.original_filename || true}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id, m.title)}
                        disabled={deletingId === m.id}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
