"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Video as VideoIcon, Plus, Play, Trash2, Loader2, RefreshCw } from "lucide-react";
import { formatDuration, formatFileSize } from "@/lib/utils";

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/videos");
      if (res.ok) {
        const data = await res.json();
        setVideos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load videos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recorded video? It will be removed from Supabase storage and database.")) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/videos?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== id));
      } else {
        alert("Failed to delete video.");
      }
    } catch (err) {
      alert("Error deleting video.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recorded Video Classes</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Browse stored MP4 video lectures in Supabase Storage with playback duration and signed URLs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadVideos}
            disabled={loading}
            title="Refresh videos"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <Link
            href="/admin/dashboard/uploads"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Lecture Video</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-medium">Fetching videos from Supabase...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <VideoIcon className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No recorded videos found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload MP4 videos using the Upload Wizard to attach video playback to syllabus lectures.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Video Title</th>
                  <th className="p-4">Subject & Module</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Storage Path</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {videos.map((v) => {
                  const subTitle = v.lesson?.module?.subject?.title || "Subject";
                  const modTitle = v.lesson?.module?.title || "Module";
                  const publicUrl =
                    v.lesson?.module?.subject?.slug && v.lesson?.module?.slug && v.lesson?.slug
                      ? `/subjects/${v.lesson.module.subject.slug}/${v.lesson.module.slug}/${v.lesson.slug}`
                      : null;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                            <VideoIcon className="w-4 h-4" />
                          </div>
                          <span>{v.title || "Lecture Video"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">
                        <div>{subTitle}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{modTitle}</div>
                      </td>
                      <td className="p-4 font-mono font-medium text-slate-700">
                        {formatDuration(v.duration_seconds || 0)}
                      </td>
                      <td className="p-4 font-mono text-slate-500">
                        {formatFileSize(v.file_size || 0)}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                        {v.storage_path}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {publicUrl && (
                          <Link
                            href={publicUrl}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold"
                          >
                            <Play className="w-3.5 h-3.5 fill-blue-700" />
                            <span>Watch</span>
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(v.id)}
                          disabled={deletingId === v.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
