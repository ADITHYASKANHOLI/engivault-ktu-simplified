"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Globe,
  EyeOff,
  Video as VideoIcon,
  Clock,
  X,
  FileText,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Eye,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import { Subject, Module, Lesson } from "@/types";
import { slugify, formatDuration } from "@/lib/utils";

function AdminLessonsContent() {
  const searchParams = useSearchParams();
  const urlSubjectId = searchParams.get("subjectId");
  const urlModuleId = searchParams.get("moduleId");
  const urlAutoCreate = searchParams.get("create");

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(urlSubjectId || "all");
  const [selectedModuleId, setSelectedModuleId] = useState<string>(urlModuleId || "all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deleteModalLesson, setDeleteModalLesson] = useState<Lesson | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState<string>("Saving...");

  // Feedback notifications
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    subject_id: "",
    module_id: "",
    title: "",
    slug: "",
    duration_seconds: 1200,
    lesson_number: 1,
    display_order: 1,
    description: "",
    published: true,
  });

  // Video replacement state during edit
  const [replaceVideoFile, setReplaceVideoFile] = useState<File | null>(null);

  const clearFeedbackAfterDelay = () => {
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Fetch initial live data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [lessonsRes, subjectsRes, modulesRes] = await Promise.all([
        fetch("/api/admin/lessons"),
        fetch("/api/admin/subjects"),
        fetch("/api/admin/modules"),
      ]);

      if (lessonsRes.ok) {
        const data = await lessonsRes.json();
        setLessons(Array.isArray(data) ? data : []);
      }
      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        setSubjects(Array.isArray(data) ? data : []);
      }
      if (modulesRes.ok) {
        const data = await modulesRes.json();
        setModules(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load admin lessons data:", err);
      setFeedback({
        type: "error",
        message: "Failed to connect to data service. Please try again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle open create modal
  const openCreateModal = useCallback(() => {
    const defaultSubject =
      selectedSubjectId !== "all"
        ? selectedSubjectId
        : urlSubjectId || subjects[0]?.id || "";

    const relevantModules = modules.filter(
      (m) => !defaultSubject || m.subject_id === defaultSubject
    );

    let defaultModule = "";
    if (selectedModuleId !== "all" && relevantModules.some((m) => m.id === selectedModuleId)) {
      defaultModule = selectedModuleId;
    } else if (urlModuleId && relevantModules.some((m) => m.id === urlModuleId)) {
      defaultModule = urlModuleId;
    } else {
      defaultModule = relevantModules[0]?.id || "";
    }

    setEditingLesson(null);
    setReplaceVideoFile(null);
    setFormData({
      subject_id: defaultSubject,
      module_id: defaultModule,
      title: "",
      slug: "",
      duration_seconds: 1200,
      lesson_number: lessons.length + 1,
      display_order: lessons.length + 1,
      description: "",
      published: true,
    });
    setModalMode("create");
  }, [selectedSubjectId, urlSubjectId, subjects, modules, selectedModuleId, urlModuleId, lessons.length]);

  // Handle URL auto-create trigger
  useEffect(() => {
    if (urlAutoCreate === "true" && subjects.length > 0 && modules.length > 0 && !loading && modalMode === null) {
      openCreateModal();
    }
  }, [urlAutoCreate, subjects, modules, loading, modalMode, openCreateModal]);

  // Handle open edit modal
  const openEditModal = (lesson: Lesson) => {
    const parentMod = modules.find((m) => m.id === lesson.module_id);
    const parentSubId = parentMod?.subject_id || lesson.module?.subject_id || subjects[0]?.id || "";

    setEditingLesson(lesson);
    setReplaceVideoFile(null);
    setFormData({
      subject_id: parentSubId,
      module_id: lesson.module_id,
      title: lesson.title,
      slug: lesson.slug,
      duration_seconds: lesson.duration_seconds || 1200,
      lesson_number: lesson.lesson_number || 1,
      display_order: lesson.display_order || 1,
      description: lesson.description || "",
      published: Boolean(lesson.published),
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

  // Handle Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFeedback({ type: "error", message: "Lecture title is required." });
      return;
    }
    if (!formData.module_id) {
      setFeedback({ type: "error", message: "Please select a syllabus module." });
      return;
    }

    if (replaceVideoFile) {
      const mime = replaceVideoFile.type?.toLowerCase() || "";
      const name = replaceVideoFile.name.toLowerCase();
      const isValidVideo =
        mime.startsWith("video/") ||
        name.endsWith(".mp4") ||
        name.endsWith(".webm") ||
        name.endsWith(".mov") ||
        name.endsWith(".mkv");

      if (!isValidVideo) {
        setFeedback({
          type: "error",
          message: "Please select a valid video file (MP4, WebM, QuickTime, or MKV).",
        });
        return;
      }

      if (replaceVideoFile.size > 5368709120) {
        setFeedback({
          type: "error",
          message: "Selected video exceeds 5GB maximum size limit.",
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      if (modalMode === "create") {
        let uploadedStoragePath: string | null = null;

        // STEP 1: Upload video file first if attached
        if (replaceVideoFile) {
          setSubmittingStatus("Uploading lecture video to storage...");
          const uploadForm = new FormData();
          uploadForm.append("file", replaceVideoFile);
          uploadForm.append("bucket", "engivault-videos");
          uploadForm.append("subject_id", formData.subject_id);
          uploadForm.append("module_id", formData.module_id);

          const upRes = await fetch("/api/admin/upload", {
            method: "POST",
            body: uploadForm,
          });

          if (!upRes.ok) {
            const errData = await upRes.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to upload lecture video to storage.");
          }

          const upData = await upRes.json();
          uploadedStoragePath = upData.storagePath;
        }

        // STEP 2: Create lecture in Supabase database
        setSubmittingStatus("Creating lecture record in Supabase...");
        const payload = {
          module_id: formData.module_id,
          title: formData.title.trim(),
          slug: formData.slug.trim() || slugify(formData.title),
          lesson_number: Number(formData.lesson_number) || 1,
          duration_seconds: Number(formData.duration_seconds) || 1200,
          display_order: Number(formData.display_order) || 1,
          description: formData.description.trim() || null,
          published: formData.published,
        };

        const res = await fetch("/api/admin/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          // Failure safety: clean up uploaded storage file if DB insert failed
          if (uploadedStoragePath) {
            await fetch(
              `/api/admin/upload?bucket=engivault-videos&path=${encodeURIComponent(uploadedStoragePath)}`,
              { method: "DELETE" }
            ).catch(() => {});
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Unable to create lecture in database. No changes were saved.");
        }

        const createdLesson = await res.json();

        // STEP 3: Link video metadata if video was uploaded
        if (uploadedStoragePath && replaceVideoFile) {
          setSubmittingStatus("Linking video metadata...");
          const videoRes = await fetch("/api/admin/videos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lesson_id: createdLesson.id,
              title: replaceVideoFile.name.replace(/\.[^/.]+$/, ""),
              storage_path: uploadedStoragePath,
              mime_type: replaceVideoFile.type || "video/mp4",
              file_size: replaceVideoFile.size,
              duration_seconds: Number(formData.duration_seconds) || 1200,
              published: formData.published,
            }),
          });

          if (!videoRes.ok) {
            // Failure safety: rollback created lesson and storage file
            await fetch(`/api/admin/lessons?id=${createdLesson.id}`, { method: "DELETE" }).catch(() => {});
            await fetch(
              `/api/admin/upload?bucket=engivault-videos&path=${encodeURIComponent(uploadedStoragePath)}`,
              { method: "DELETE" }
            ).catch(() => {});
            const vidErr = await videoRes.json().catch(() => ({}));
            throw new Error(vidErr.error || "Failed to link video metadata to lecture.");
          }
        }

        setFeedback({ type: "success", message: "Lecture created successfully in Supabase." });
        setModalMode(null);
        await fetchData(true);
      } else if (modalMode === "edit" && editingLesson) {
        let uploadedStoragePath: string | null = null;

        // If replacement video provided, upload it
        if (replaceVideoFile) {
          setSubmittingStatus("Uploading replacement video...");
          const uploadForm = new FormData();
          uploadForm.append("file", replaceVideoFile);
          uploadForm.append("bucket", "engivault-videos");
          uploadForm.append("subject_id", formData.subject_id);
          uploadForm.append("module_id", formData.module_id);
          uploadForm.append("lesson_id", editingLesson.id);

          const upRes = await fetch("/api/admin/upload", {
            method: "POST",
            body: uploadForm,
          });

          if (!upRes.ok) {
            const errData = await upRes.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to upload replacement video.");
          }

          const upData = await upRes.json();
          uploadedStoragePath = upData.storagePath;
        }

        setSubmittingStatus("Updating lecture details...");
        const payload = {
          id: editingLesson.id,
          module_id: formData.module_id,
          title: formData.title.trim(),
          slug: formData.slug.trim() || slugify(formData.title),
          lesson_number: Number(formData.lesson_number) || 1,
          duration_seconds: Number(formData.duration_seconds) || 1200,
          display_order: Number(formData.display_order) || 1,
          description: formData.description.trim() || null,
          published: formData.published,
        };

        const res = await fetch("/api/admin/lessons", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          if (uploadedStoragePath) {
            await fetch(
              `/api/admin/upload?bucket=engivault-videos&path=${encodeURIComponent(uploadedStoragePath)}`,
              { method: "DELETE" }
            ).catch(() => {});
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Unable to update lecture. No changes were saved.");
        }

        if (uploadedStoragePath && replaceVideoFile) {
          setSubmittingStatus("Linking updated video metadata...");
          const videoRes = await fetch("/api/admin/videos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lesson_id: editingLesson.id,
              title: replaceVideoFile.name.replace(/\.[^/.]+$/, ""),
              storage_path: uploadedStoragePath,
              mime_type: replaceVideoFile.type || "video/mp4",
              file_size: replaceVideoFile.size,
              duration_seconds: Number(formData.duration_seconds) || 1200,
              published: formData.published,
            }),
          });

          if (!videoRes.ok) {
            const vidErr = await videoRes.json().catch(() => ({}));
            throw new Error(vidErr.error || "Failed to link updated video metadata.");
          }
        }

        setFeedback({ type: "success", message: "Lecture updated successfully." });
        setModalMode(null);
        await fetchData(true);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Unable to save lecture. No changes were saved.",
      });
    } finally {
      setSubmitting(false);
      clearFeedbackAfterDelay();
    }
  };

  // Quick Toggle Publish
  const handleTogglePublish = async (lesson: Lesson) => {
    const nextState = !lesson.published;
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lesson.id,
          published: nextState,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update publishing state");
      }

      setLessons((prev) =>
        prev.map((l) => (l.id === lesson.id ? { ...l, published: nextState } : l))
      );

      setFeedback({
        type: "success",
        message: nextState ? "Lesson published." : "Lesson moved to draft.",
      });
      clearFeedbackAfterDelay();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "Unable to change publish state. No changes were saved.",
      });
      clearFeedbackAfterDelay();
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalLesson) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/lessons?id=${deleteModalLesson.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete lesson.");
      }

      setLessons((prev) => prev.filter((l) => l.id !== deleteModalLesson.id));
      setFeedback({ type: "success", message: "Lesson deleted successfully." });
      setDeleteModalLesson(null);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Unable to delete lesson.",
      });
    } finally {
      setSubmitting(false);
      clearFeedbackAfterDelay();
    }
  };

  // Filter modules based on selected subject in modal
  const availableModalModules = modules.filter(
    (m) => !formData.subject_id || m.subject_id === formData.subject_id
  );

  // Filter lessons for table
  const filteredLessons = lessons.filter((l) => {
    if (selectedSubjectId !== "all") {
      const parentMod = modules.find((m) => m.id === l.module_id);
      const subId = parentMod?.subject_id || l.module?.subject_id;
      if (subId !== selectedSubjectId) return false;
    }
    if (selectedModuleId !== "all" && l.module_id !== selectedModuleId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchSlug = l.slug.toLowerCase().includes(q);
      const matchDesc = l.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchSlug && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs border transition-all animate-in fade-in slide-in-from-top-2 ${
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

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Lesson & Lecture Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Authoritative curriculum repository synced directly with Supabase PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            title="Refresh from Supabase"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Lecture</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Subject Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filter by Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setSelectedModuleId("all");
            }}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Subjects ({subjects.length})</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.code || "KTU"})
              </option>
            ))}
          </select>
        </div>

        {/* Module Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filter by Module
          </label>
          <select
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Modules ({modules.length})</option>
            {modules
              .filter(
                (m) => selectedSubjectId === "all" || m.subject_id === selectedSubjectId
              )
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="flex-1 min-w-[220px]">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Search Lectures
          </label>
          <input
            type="text"
            placeholder="Search by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Lectures Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-medium">Fetching lessons from Supabase...</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Filter className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No lectures found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedSubjectId !== "all" || selectedModuleId !== "all"
                ? "Try adjusting your subject, module, or search filters."
                : "No lectures have been created in the database yet. Click 'New Lecture' to create your first class."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Lecture Title</th>
                  <th className="p-4">Module & Subject</th>
                  <th className="p-4">Order</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Media</th>
                  <th className="p-4">Visibility</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLessons.map((l) => {
                  const parentMod = modules.find((m) => m.id === l.module_id);
                  const parentSub = parentMod?.subject || subjects.find((s) => s.id === parentMod?.subject_id) || l.module?.subject;
                  const publicUrl = parentSub && parentMod ? `/subjects/${parentSub.slug}/${parentMod.slug}/${l.slug}` : null;

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${l.video ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400"}`}>
                            <VideoIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{l.title}</div>
                            <div className="text-[11px] text-slate-400 font-mono font-normal">
                              {l.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-slate-800 font-medium line-clamp-1">
                          {parentMod?.title || "Module"}
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {parentSub?.title || "Subject"}
                        </div>
                      </td>

                      <td className="p-4 font-mono font-medium text-slate-600">
                        #{l.lesson_number}
                        <span className="text-[10px] text-slate-400 ml-1">(Ord: {l.display_order})</span>
                      </td>

                      <td className="p-4 font-mono text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDuration(l.duration_seconds || 0)}
                        </span>
                      </td>

                      <td className="p-4 space-y-1">
                        {l.video ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                            MP4 ATTACHED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-500">
                            NO VIDEO
                          </span>
                        )}
                        {l.materials && l.materials.length > 0 && (
                          <div className="text-[10px] text-slate-500 font-medium">
                            {l.materials.length} {l.materials.length === 1 ? "document" : "documents"}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => handleTogglePublish(l)}
                          title="Click to toggle publish status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-all ${
                            l.published
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {l.published ? (
                            <>
                              <Globe className="w-3 h-3" />
                              <span>PUBLISHED</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>DRAFT</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {publicUrl && (
                          <Link
                            href={publicUrl}
                            target="_blank"
                            title="Preview on Live Site"
                            className="inline-flex p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => openEditModal(l)}
                          title="Edit Lesson"
                          className="inline-flex p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModalLesson(l)}
                          title="Delete Lesson"
                          className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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

      {/* Create / Edit Lesson Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {modalMode === "create" ? "Create New Lecture" : "Edit Lecture Details"}
              </h3>
              <button
                disabled={submitting}
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Parent Subject & Module Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => {
                      const newSubId = e.target.value;
                      const relatedMods = modules.filter((m) => m.subject_id === newSubId);
                      setFormData((prev) => ({
                        ...prev,
                        subject_id: newSubId,
                        module_id: relatedMods[0]?.id || "",
                      }));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.code || "KTU"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Module <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.module_id}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, module_id: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                  >
                    {availableModalModules.length === 0 ? (
                      <option value="">No modules found for subject</option>
                    ) : (
                      availableModalModules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Title and Slug */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Lecture Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture 03 — Partial Differentiation"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  URL Slug (Immutable / SEO Path)
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 font-mono text-[11px]"
                />
              </div>

              {/* Number, Order, Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Lecture #
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.lesson_number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lesson_number: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        display_order: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Duration (sec)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={60}
                    value={formData.duration_seconds}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration_seconds: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-slate-800"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Description & Syllabus Topics
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline topics covered, theorems taught, or university questions solved..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-normal leading-relaxed"
                />
              </div>

              {/* Video Media Section (Safe Video Preservation) */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                    <VideoIcon className="w-4 h-4 text-blue-700" />
                    <span>Video Lecture Attachment</span>
                  </span>
                  {editingLesson?.video && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                      Current Video Attached
                    </span>
                  )}
                </div>

                {editingLesson?.video && (
                  <p className="text-[11px] text-slate-500">
                    Existing video: <code className="font-mono text-slate-700">{editingLesson.video.title || editingLesson.video.storage_path}</code>.
                    Leave blank to preserve current video, or select a new file to replace it.
                  </p>
                )}

                <div>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setReplaceVideoFile(e.target.files[0]);
                      } else {
                        setReplaceVideoFile(null);
                      }
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {replaceVideoFile && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      Ready to upload: {replaceVideoFile.name} ({(replaceVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </p>
                  )}
                </div>
              </div>

              {/* Published Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, published: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-700"></div>
                </label>
                <span className="text-slate-700 font-medium">
                  Publish immediately (accessible by students)
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-blue-700 hover:bg-blue-800 font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{submittingStatus}</span>
                    </>
                  ) : (
                    <span>{modalMode === "create" ? "Create Lecture" : "Save Changes"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-xl bg-red-50">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Delete this lecture?
              </h3>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                Are you sure you want to delete{" "}
                <strong className="text-slate-900 font-semibold">
                  &ldquo;{deleteModalLesson.title}&rdquo;
                </strong>
                ?
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-[11px]">
                <div>
                  <span className="text-slate-400">Lesson ID:</span>{" "}
                  <code className="font-mono text-slate-700">{deleteModalLesson.id}</code>
                </div>
                <div>
                  <span className="text-slate-400">Slug:</span>{" "}
                  <code className="font-mono text-slate-700">{deleteModalLesson.slug}</code>
                </div>
              </div>
              <p className="text-rose-700 font-medium">
                This will permanently delete the lesson record from Supabase PostgreSQL, cascade delete any child video/material records, and remove stored MP4 files from Supabase Storage.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setDeleteModalLesson(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-red-600 hover:bg-red-700 font-bold transition-colors shadow-xs disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Lecture</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLessonsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
          <p className="text-xs">Loading lecture management...</p>
        </div>
      }
    >
      <AdminLessonsContent />
    </Suspense>
  );
}
