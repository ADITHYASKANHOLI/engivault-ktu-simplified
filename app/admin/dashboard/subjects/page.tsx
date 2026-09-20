"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, Globe, EyeOff, X, BookOpen, CheckCircle2, AlertCircle, Loader2, Layers } from "lucide-react";
import { Subject } from "@/types";
import { slugify } from "@/lib/utils";

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Delete confirmation modal
  const [deleteModalSubject, setDeleteModalSubject] = useState<Subject | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Feedback toast
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const clearFeedbackAfterDelay = () => {
    setTimeout(() => setFeedback(null), 4500);
  };

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    code: "",
    short_description: "",
    description: "",
    published: true,
  });

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/admin/subjects");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormData({
      title: "",
      slug: "",
      code: "",
      short_description: "",
      description: "",
      published: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (s: Subject) => {
    setEditingSubject(s);
    setFormData({
      title: s.title,
      slug: s.slug,
      code: s.code || "",
      short_description: s.short_description || "",
      description: s.description || "",
      published: s.published,
    });
    setModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: editingSubject ? prev.slug : slugify(val),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSubject) {
        const res = await fetch("/api/admin/subjects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingSubject.id, ...formData }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to update subject.");
        }
        setFeedback({ type: "success", message: "Subject updated successfully." });
        await fetchSubjects();
        setModalOpen(false);
      } else {
        const res = await fetch("/api/admin/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to create subject.");
        }
        setFeedback({ type: "success", message: "Subject created successfully." });
        await fetchSubjects();
        setModalOpen(false);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "An error occurred." });
    } finally {
      setSubmitting(false);
      clearFeedbackAfterDelay();
    }
  };

  const togglePublish = async (s: Subject) => {
    try {
      await fetch("/api/admin/subjects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, published: !s.published }),
      });
      await fetchSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteModalSubject) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/subjects?id=${deleteModalSubject.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete subject.");
      }

      setSubjects((prev) => prev.filter((s) => s.id !== deleteModalSubject.id));
      setFeedback({ type: "success", message: `"${deleteModalSubject.title}" deleted successfully.` });
      setDeleteModalSubject(null);
      // Also re-fetch to ensure consistency
      await fetchSubjects();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Unable to delete subject.",
      });
    } finally {
      setSubmitting(false);
      clearFeedbackAfterDelay();
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs border transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subject Management</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Create, update, reorder and publish KTU engineering courses.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Subject</span>
        </button>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="p-4">Subject Title</th>
                <th className="p-4">Code</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Curriculum</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading subjects...
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No subjects created yet. Click &quot;New Subject&quot; above to create one.
                  </td>
                </tr>
              ) : (
                subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      <Link
                        href={`/admin/dashboard/modules?subjectId=${s.id}`}
                        className="flex items-center gap-2 hover:text-blue-700 transition-colors group"
                        title="Manage syllabus modules for this subject"
                      >
                        <BookOpen className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="underline-offset-2 group-hover:underline">{s.title}</span>
                      </Link>
                    </td>
                    <td className="p-4 font-mono font-medium text-slate-600">
                      {s.code || "—"}
                    </td>
                    <td className="p-4 font-mono text-slate-500 text-[11px]">
                      {s.slug}
                    </td>
                    <td className="p-4 text-slate-500">
                      <Link
                        href={`/admin/dashboard/modules?subjectId=${s.id}`}
                        className="inline-flex items-center gap-1.5 hover:text-blue-700 font-medium transition-colors"
                        title="View modules for this subject"
                      >
                        <Layers className="w-3.5 h-3.5 text-cyan-600" />
                        <span>{s.modules_count || 0} modules</span>
                        <span>•</span>
                        <span>{s.lessons_count || 0} lectures</span>
                      </Link>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => togglePublish(s)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-colors ${
                          s.published
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        }`}
                      >
                        {s.published ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{s.published ? "PUBLISHED" : "DRAFT"}</span>
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      <Link
                        href={`/admin/dashboard/modules?subjectId=${s.id}`}
                        className="inline-flex p-1.5 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
                        title="Manage Modules"
                      >
                        <Layers className="w-4 h-4 text-cyan-600" />
                      </Link>
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModalSubject(s)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Subject"
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

      {/* Modal for Create / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingSubject ? "Edit Subject" : "Create New KTU Subject"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Engineering Mathematics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    KTU Course Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. MAT 101"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="engineering-mathematics"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Brief 1-2 sentence overview for catalog cards..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Syllabus Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed course scope, KTU syllabus modules, examination pattern..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="published-toggle"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="published-toggle" className="font-semibold text-slate-700 cursor-pointer">
                  Publish immediately (visible to students)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-rose-700">
                Confirm Deletion
              </h3>
              <button
                disabled={submitting}
                onClick={() => setDeleteModalSubject(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-700 font-medium">
                This will <span className="text-rose-600 font-bold">permanently delete</span> the
                following subject and <span className="text-rose-600 font-bold">all its modules, lessons, videos, and study materials</span>:
              </p>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-1.5">
                <div>
                  <span className="text-slate-500 font-semibold">Title:</span>{" "}
                  <span className="text-slate-900 font-bold">{deleteModalSubject.title}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Code:</span>{" "}
                  <span className="text-slate-900 font-mono">{deleteModalSubject.code || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Slug:</span>{" "}
                  <span className="text-slate-900 font-mono">{deleteModalSubject.slug}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Contains:</span>{" "}
                  <span className="text-slate-900">
                    {deleteModalSubject.modules_count || 0} modules, {deleteModalSubject.lessons_count || 0} lectures
                  </span>
                </div>
              </div>

              <p className="text-rose-600 font-bold text-[11px]">
                ⚠ This action cannot be undone. All uploaded videos and PDFs will also be removed from storage.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setDeleteModalSubject(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs text-xs disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
