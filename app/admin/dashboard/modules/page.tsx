"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Globe,
  EyeOff,
  Layers,
  BookOpen,
  X,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Video,
  ArrowRight,
} from "lucide-react";
import { Module, Subject } from "@/types";
import { slugify } from "@/lib/utils";

function AdminModulesContent() {
  const searchParams = useSearchParams();
  const urlSubjectId = searchParams.get("subjectId");
  const urlAutoCreate = searchParams.get("create");

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(urlSubjectId || "");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  // Delete modal state
  const [deleteModalModule, setDeleteModalModule] = useState<Module | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Toast feedback state
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form input state
  const [formData, setFormData] = useState({
    subject_id: "",
    title: "",
    slug: "",
    short_description: "",
    display_order: 1,
    published: true,
  });

  const autoCreateTriggeredRef = useRef(false);

  const clearFeedbackAfterDelay = () => {
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [subsRes, modsRes] = await Promise.all([
        fetch("/api/admin/subjects", { cache: "no-store" }),
        fetch("/api/admin/modules", { cache: "no-store" }),
      ]);

      let loadedSubjects: Subject[] = [];
      if (subsRes.ok) {
        loadedSubjects = await subsRes.json();
        setSubjects(loadedSubjects);
      }

      if (modsRes.ok) {
        const mods: Module[] = await modsRes.json();
        setModules(Array.isArray(mods) ? mods : []);
      }

      // Automatically select subject from URL or first available subject
      if (loadedSubjects.length > 0) {
        setSelectedSubjectId((prev) => {
          if (urlSubjectId && loadedSubjects.some((s) => s.id === urlSubjectId)) {
            return urlSubjectId;
          }
          if (prev && loadedSubjects.some((s) => s.id === prev)) {
            return prev;
          }
          return loadedSubjects[0].id;
        });
      }
    } catch (err) {
      console.error("Failed to load modules data:", err);
      setFeedback({
        type: "error",
        message: "Failed to connect to data service. Please try again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [urlSubjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const closeModal = useCallback(() => {
    setModalMode(null);
    setEditingModule(null);
    setSubmitting(false);
    setFormData({
      subject_id: selectedSubjectId || "",
      title: "",
      slug: "",
      short_description: "",
      display_order: 1,
      published: true,
    });
    if (typeof window !== "undefined" && window.location.search.includes("create=true")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("create");
      window.history.replaceState({}, "", url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""));
    }
  }, [selectedSubjectId]);

  const openCreateModal = useCallback(() => {
    const currentSubjectModules = modules.filter((m) => m.subject_id === selectedSubjectId);
    setEditingModule(null);
    setFormData({
      subject_id: selectedSubjectId,
      title: "",
      slug: "",
      short_description: "",
      display_order: currentSubjectModules.length + 1,
      published: true,
    });
    setModalMode("create");
  }, [modules, selectedSubjectId]);

  // Handle URL auto-create trigger safely without infinite loop
  useEffect(() => {
    if (
      urlAutoCreate === "true" &&
      selectedSubjectId &&
      !loading &&
      !autoCreateTriggeredRef.current
    ) {
      autoCreateTriggeredRef.current = true;
      openCreateModal();
    }
  }, [urlAutoCreate, selectedSubjectId, loading, openCreateModal]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalMode && !submitting) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalMode, submitting, closeModal]);

  const openEditModal = (mod: Module) => {
    setEditingModule(mod);
    setFormData({
      subject_id: mod.subject_id,
      title: mod.title,
      slug: mod.slug,
      short_description: mod.short_description || "",
      display_order: mod.display_order || 1,
      published: Boolean(mod.published),
    });
    setModalMode("edit");
  };

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: modalMode === "create" ? slugify(val) : prev.slug,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFeedback({ type: "error", message: "Module title is required." });
      return;
    }
    if (!formData.subject_id) {
      setFeedback({ type: "error", message: "Please select a parent subject." });
      return;
    }

    setSubmitting(true);

    try {
      if (modalMode === "create") {
        const payload = {
          subject_id: formData.subject_id,
          title: formData.title.trim(),
          slug: formData.slug.trim() || slugify(formData.title),
          short_description: formData.short_description.trim() || null,
          display_order: Number(formData.display_order) || 1,
          published: formData.published,
        };

        const res = await fetch("/api/admin/modules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to create module in database.");
        }

        setFeedback({ type: "success", message: "Module created successfully in Supabase." });
        closeModal();
        await loadData(true);
      } else if (modalMode === "edit" && editingModule) {
        const payload = {
          id: editingModule.id,
          subject_id: formData.subject_id,
          title: formData.title.trim(),
          slug: formData.slug.trim() || slugify(formData.title),
          short_description: formData.short_description.trim() || null,
          display_order: Number(formData.display_order) || 1,
          published: formData.published,
        };

        const res = await fetch("/api/admin/modules", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to update module in database.");
        }

        setFeedback({ type: "success", message: "Module updated successfully." });
        closeModal();
        await loadData(true);
      }
    } catch (err: any) {
      console.error("Save module error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Unable to save module. No changes were saved.",
      });
    } finally {
      setSubmitting(false);
      clearFeedbackAfterDelay();
    }
  };

  const handleTogglePublish = async (mod: Module) => {
    try {
      const nextState = !mod.published;
      const res = await fetch("/api/admin/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mod.id,
          published: nextState,
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setModules((prev) =>
        prev.map((m) => (m.id === mod.id ? { ...m, published: nextState } : m))
      );
      setFeedback({
        type: "success",
        message: `Module "${mod.title}" marked as ${nextState ? "PUBLISHED" : "DRAFT"}.`,
      });
    } catch (err) {
      console.error("Toggle publish error:", err);
      setFeedback({ type: "error", message: "Failed to update publication status." });
    } finally {
      clearFeedbackAfterDelay();
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalModule) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/modules?id=${deleteModalModule.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteModalModule.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete module.");
      }

      setModules((prev) => prev.filter((m) => m.id !== deleteModalModule.id));
      setFeedback({
        type: "success",
        message: `Module "${deleteModalModule.title}" and its contents were permanently removed.`,
      });
      setDeleteModalModule(null);
      await loadData(true);
    } catch (err: any) {
      console.error("Delete module error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to delete module.",
      });
    } finally {
      setSubmitting(false);
      clearFeedbackAfterDelay();
    }
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentSubjectModules = modules
    .filter((m) => m.subject_id === selectedSubjectId)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-8">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-md animate-in fade-in slide-in-from-top-3 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-md hover:bg-black/5 text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Module Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Organize each KTU subject into structured syllabus modules (e.g. Module 1, Module 2).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            title="Refresh modules from Supabase"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <button
            onClick={openCreateModal}
            disabled={!selectedSubjectId || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Module</span>
          </button>
        </div>
      </div>

      {/* Filter by Subject */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 shrink-0">Filter by Subject:</span>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/80 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
          >
            {subjects.length === 0 ? (
              <option value="">No subjects found</option>
            ) : (
              subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.code || "KTU"})
                </option>
              ))
            )}
          </select>
        </div>

        {currentSubject && (
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentSubject.title}</span>
            <span>•</span>
            <span className="font-bold text-slate-800">{currentSubjectModules.length} modules</span>
          </div>
        )}
      </div>

      {/* Modules List View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
          <span>Configured Modules ({currentSubjectModules.length})</span>
          <span>Order & Actions</span>
        </div>

        <div className="divide-y divide-slate-100 p-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              <p className="text-xs">Loading modules from database...</p>
            </div>
          ) : !currentSubject ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs">Please create a subject first before managing modules.</p>
              <Link
                href="/admin/dashboard/subjects"
                className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline mt-2"
              >
                <span>Go to Subjects</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : currentSubjectModules.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  No modules configured for {currentSubject.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click &quot;Create Module&quot; above to add Module 1 for this KTU subject.
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Module</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-mono mb-2">
                Displaying modules for: <strong className="text-slate-800">{currentSubject.title}</strong>
              </div>

              {currentSubjectModules.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                        Order #{m.display_order}
                      </span>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2 truncate">
                        <Layers className="w-4 h-4 text-cyan-600 shrink-0" />
                        <span className="truncate">{m.title}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>{m.slug}</span>
                      <span>•</span>
                      <span className="text-slate-700 font-medium">
                        {m.lessons_count || 0} recorded lectures
                      </span>
                    </div>

                    {m.short_description && (
                      <p className="text-xs text-slate-600 line-clamp-2 pt-1 font-normal">
                        {m.short_description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {/* Public visibility toggle */}
                    <button
                      onClick={() => handleTogglePublish(m)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-colors ${
                        m.published
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                    >
                      {m.published ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{m.published ? "PUBLISHED" : "DRAFT"}</span>
                    </button>

                    {/* View Lectures shortcut */}
                    <Link
                      href={`/admin/dashboard/lessons?subjectId=${m.subject_id}&moduleId=${m.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                      title="View all lectures in this module"
                    >
                      <Video className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lectures</span>
                    </Link>

                    {/* Create Lecture directly under this module */}
                    <Link
                      href={`/admin/dashboard/lessons?subjectId=${m.subject_id}&moduleId=${m.id}&create=true`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
                      title="Create a new lecture in this module"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Lecture</span>
                    </Link>

                    {/* Edit Module */}
                    <button
                      onClick={() => openEditModal(m)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-slate-200 transition-colors"
                      title="Edit Module Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Module */}
                    <button
                      onClick={() => setDeleteModalModule(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Create / Edit Module */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) {
              closeModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {modalMode === "create" ? "Create New Module" : "Edit Module"}
              </h3>
              <button
                disabled={submitting}
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Parent Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 font-medium"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.code || "KTU"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Module Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Module 1 — Linear Algebra & Vector Calculus"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Slug (URL Identifier) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-slate-900 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Order in Syllabus
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                  />
                </div>

                <div className="flex flex-col justify-end pb-1.5">
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) =>
                        setFormData({ ...formData, published: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-700"></div>
                    <span className="ml-2.5 text-xs font-semibold text-slate-700">
                      Published
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Syllabus Description & Scope
                </label>
                <textarea
                  rows={3}
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Topics covered in this syllabus module according to the KTU curriculum..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <span>{modalMode === "create" ? "Create Module" : "Save Changes"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalModule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) {
              setDeleteModalModule(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-xl bg-red-50">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Module</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Are you sure you want to permanently delete this module?
              </p>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-1.5">
                <div>
                  <span className="text-slate-500 font-semibold">Title:</span>{" "}
                  <span className="text-slate-900 font-bold">{deleteModalModule.title}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Slug:</span>{" "}
                  <span className="text-slate-900 font-mono">{deleteModalModule.slug}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Contains:</span>{" "}
                  <span className="text-slate-900 font-bold">
                    {deleteModalModule.lessons_count || 0} lectures
                  </span>
                </div>
              </div>

              <p className="text-rose-600 font-bold text-[11px]">
                ⚠ All lectures, recorded videos, and notes under this module will be permanently removed from Supabase and Storage.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setDeleteModalModule(null)}
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

export default function AdminModulesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
          <p className="text-xs">Loading modules management...</p>
        </div>
      }
    >
      <AdminModulesContent />
    </Suspense>
  );
}

