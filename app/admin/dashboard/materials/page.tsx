"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Trash2, Plus, Download, ArrowUpRight } from "lucide-react";
import { Material } from "@/types";
import { formatFileSize, formatDate } from "@/lib/utils";

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      await fetch(`/api/admin/materials?id=${id}`, { method: "DELETE" });
      await fetchMaterials();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Study Materials & Notes</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage downloadable handwritten notes, university question banks, and formulas.
          </p>
        </div>

        <Link
          href="/admin/dashboard/uploads"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Material</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="p-4">Material Title</th>
                <th className="p-4">Type</th>
                <th className="p-4">File Size</th>
                <th className="p-4">Uploaded</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Loading study materials...</td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No materials uploaded yet.</td>
                </tr>
              ) : (
                materials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <div>{m.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono font-normal truncate max-w-xs">
                            {m.original_filename}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono uppercase font-bold text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                        {m.material_type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-600">{formatFileSize(m.file_size)}</td>
                    <td className="p-4 text-slate-500">{formatDate(m.created_at)}</td>
                    <td className="p-4 text-right space-x-2">
                      <a
                        href={m.download_url || "#"}
                        download={m.original_filename}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-slate-100"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
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
