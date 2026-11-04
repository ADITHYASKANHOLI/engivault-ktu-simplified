"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Trash2,
  X,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Play,
  Search,
  BookOpen,
  GraduationCap,
  ArrowUpDown,
  Check,
  Layers,
} from "lucide-react";
import { Reorder } from "motion/react";
import { SortableLessonRow } from "@/components/admin/lessons/SortableLessonRow";
import { SortableLessonCard } from "@/components/admin/lessons/SortableLessonCard";
import { YoutubeIcon } from "@/components/icons/YoutubeIcon";
import { Subject, Module, Lesson, Department, Semester, Topic, Faculty } from "@/types";
import { slugify } from "@/lib/utils";
import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  getYouTubeWatchUrl,
} from "@/lib/utils/youtube";

function AdminLessonsContent() {
  const searchParams = useSearchParams();
  const urlSubjectId = searchParams.get("subjectId");
  const urlModuleId = searchParams.get("moduleId");
  const urlAutoCreate = searchParams.get("create");

  // Core Data Collections
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [_semesters, setSemesters] = useState<Semester[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
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

  // Manual Drag-and-Drop Video Reordering State
  const [orderedLessons, setOrderedLessons] = useState<Lesson[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);
  const [orderSaveStatus, setOrderSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastPersistedOrderRef = useRef<string[]>([]);
  const isSavingOrderRef = useRef<boolean>(false);

  // Exact Add Lecture UX Form State
  const [formData, setFormData] = useState({
    title: "",
    department_id: "",
    semester_number: 1,
    subject_id: "",
    module_id: "",
    topic_id: "",
    faculty_id: "",
    instructor: "",
    description: "",
    youtube_url: "",
    slug: "",
    lesson_number: 1,
    display_order: 1,
    duration_seconds: 1200,
    published: true,
  });

  const clearFeedbackAfterDelay = () => {
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  const autoCreateTriggeredRef = useRef(false);

  // Fetch all collections
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [lessonsRes, subjectsRes, modulesRes, academicRes] = await Promise.all([
        fetch("/api/admin/lessons", { cache: "no-store" }),
        fetch("/api/admin/subjects", { cache: "no-store" }),
        fetch("/api/admin/modules", { cache: "no-store" }),
        fetch("/api/admin/academic", { cache: "no-store" }),
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
      if (academicRes.ok) {
        const data = await academicRes.json();
        if (data.departments) setDepartments(data.departments);
        if (data.semesters) setSemesters(data.semesters);
        if (data.faculty) setFacultyList(data.faculty);
        if (data.topics) setTopics(data.topics);
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

  // Clean, controlled close of modal
  const closeModal = useCallback(() => {
    setModalMode(null);
    setEditingLesson(null);
    setSubmitting(false);
    setSubmittingStatus("");
    setFormData({
      title: "",
      department_id: "",
      semester_number: 1,
      subject_id: "",
      module_id: "",
      topic_id: "",
      faculty_id: "",
      instructor: "",
      description: "",
      youtube_url: "",
      slug: "",
      lesson_number: 1,
      display_order: 1,
      duration_seconds: 1200,
      published: true,
    });
    if (typeof window !== "undefined" && window.location.search.includes("create=true")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("create");
      window.history.replaceState(
        {},
        "",
        url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "")
      );
    }
  }, []);

  // Handle open create modal
  const openCreateModal = useCallback(() => {
    // Select default department
    const defDeptId = selectedDepartmentId !== "all" ? selectedDepartmentId : departments[0]?.id || "";

    // Select default subject
    let defaultSubject = "";
    if (selectedSubjectId !== "all" && selectedSubjectId) {
      defaultSubject = selectedSubjectId;
    } else {
      const matchSub = subjects.find(
        (s) => !defDeptId || s.department_id === defDeptId
      );
      defaultSubject = matchSub?.id || subjects[0]?.id || "";
    }

    const relevantModules = modules.filter(
      (m) => !defaultSubject || m.subject_id === defaultSubject
    );

    let defaultModule = "";
    if (
      selectedModuleId !== "all" &&
      relevantModules.some((m) => m.id === selectedModuleId)
    ) {
      defaultModule = selectedModuleId;
    } else {
      defaultModule = relevantModules[0]?.id || "";
    }

    const relevantTopics = topics.filter((t) => t.module_id === defaultModule);
    const defaultTopic = relevantTopics[0]?.id || "";

    const targetSub = subjects.find((s) => s.id === defaultSubject);
    const semNumber = targetSub?.semester_number || 1;
    const defFaculty = facultyList[0]?.id || "";

    const existingLessonsInModule = lessons.filter((l) => l.module_id === defaultModule);
    const nextNumber = existingLessonsInModule.length + 1;

    setFormData({
      title: "",
      department_id: targetSub?.department_id || defDeptId,
      semester_number: semNumber,
      subject_id: defaultSubject,
      module_id: defaultModule,
      topic_id: defaultTopic,
      faculty_id: defFaculty,
      instructor: facultyList[0]?.name || "",
      description: "",
      youtube_url: "",
      slug: "",
      lesson_number: nextNumber,
      display_order: nextNumber,
      duration_seconds: 1200,
      published: true,
    });

    setModalMode("create");
    setEditingLesson(null);
  }, [
    selectedDepartmentId,
    departments,
    selectedSubjectId,
    subjects,
    modules,
    selectedModuleId,
    topics,
    facultyList,
    lessons,
  ]);

  // Handle open edit modal
  const openEditModal = useCallback(
    (lesson: Lesson) => {
      const parentMod = modules.find((m) => m.id === lesson.module_id);
      const parentSub = subjects.find((s) => s.id === parentMod?.subject_id);

      setEditingLesson(lesson);
      setFormData({
        title: lesson.title,
        department_id: parentSub?.department_id || "",
        semester_number: parentSub?.semester_number || 1,
        subject_id: parentMod?.subject_id || "",
        module_id: lesson.module_id,
        topic_id: lesson.topic_id || "",
        faculty_id: lesson.faculty_id || "",
        instructor: lesson.instructor || lesson.faculty?.name || "",
        description: lesson.description || "",
        youtube_url: lesson.youtube_url || lesson.youtubeUrl || "",
        slug: lesson.slug,
        lesson_number: lesson.lesson_number ?? 1,
        display_order: lesson.display_order ?? 1,
        duration_seconds: lesson.duration_seconds ?? 1200,
        published: lesson.published ?? true,
      });

      setModalMode("edit");
    },
    [modules, subjects]
  );

  // Auto trigger modal from query param
  useEffect(() => {
    if (urlAutoCreate === "true" && !loading && !autoCreateTriggeredRef.current) {
      autoCreateTriggeredRef.current = true;
      openCreateModal();
    }
  }, [urlAutoCreate, loading, openCreateModal]);

  // Dynamic cascading module choices for the modal
  const availableModalModules = modules.filter(
    (m) => !formData.subject_id || m.subject_id === formData.subject_id
  );

  // Dynamic cascading topic choices for the modal
  const availableModalTopics = topics.filter(
    (t) => !formData.module_id || t.module_id === formData.module_id
  );

  // Dynamic cascading subject choices for the modal
  const availableModalSubjects = subjects.filter((s) => {
    if (formData.department_id && s.department_id && s.department_id !== formData.department_id) {
      return false;
    }
    return true;
  });

  // Handle title auto slugify
  const handleTitleChange = (newTitle: string) => {
    setFormData((prev) => ({
      ...prev,
      title: newTitle,
      slug: modalMode === "create" ? slugify(newTitle) : prev.slug,
    }));
  };

  // Real-time YouTube validation & video ID extraction
  const rawYtInput = formData.youtube_url.trim();
  const detectedYtId = extractYouTubeVideoId(rawYtInput);
  const isInvalidYtUrl = Boolean(rawYtInput && !detectedYtId);

  // Can the admin save?
  const isSaveReady =
    formData.title.trim().length >= 2 &&
    Boolean(detectedYtId) &&
    Boolean(formData.module_id) &&
    !isInvalidYtUrl;

  // Handle Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setFeedback({
        type: "error",
        message: "Lecture Name is required.",
      });
      return;
    }

    if (!formData.youtube_url.trim()) {
      setFeedback({
        type: "error",
        message: "YouTube Video Link is required.",
      });
      return;
    }

    if (!detectedYtId) {
      setFeedback({
        type: "error",
        message: "Please enter a valid YouTube video link.",
      });
      return;
    }

    if (!formData.module_id) {
      setFeedback({
        type: "error",
        message: "Please select an academic subject and module for this lecture.",
      });
      return;
    }

    setSubmitting(true);
    setSubmittingStatus("Validating YouTube link & saving...");

    try {
      const resolvedFaculty = facultyList.find((f) => f.id === formData.faculty_id);
      const instructorName =
        formData.instructor || resolvedFaculty?.name || "Faculty Instructor";

      const payload = {
        title: formData.title.trim(),
        module_id: formData.module_id,
        topic_id: formData.topic_id || null,
        faculty_id: formData.faculty_id || null,
        instructor: instructorName,
        slug: formData.slug || slugify(formData.title),
        lesson_number: Number(formData.lesson_number) || 1,
        display_order: Number(formData.display_order) || 1,
        duration_seconds: Number(formData.duration_seconds) || 1200,
        description: formData.description.trim() || null,
        published: formData.published,
        youtube_url: getYouTubeWatchUrl(detectedYtId) || `https://www.youtube.com/watch?v=${detectedYtId}`,
        youtube_video_id: detectedYtId,
        thumbnail_path: getYouTubeThumbnailUrl(detectedYtId, "hqdefault"),
      };

      if (modalMode === "create") {
        const res = await fetch("/api/admin/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to create lecture");
        }

        const created = await res.json();
        setLessons((prev) => [created, ...prev]);
        setFeedback({
          type: "success",
          message: `Lecture "${payload.title}" created successfully with YouTube video!`,
        });
      } else if (modalMode === "edit" && editingLesson) {
        const res = await fetch("/api/admin/lessons", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingLesson.id,
            ...payload,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to update lecture");
        }

        const updated = await res.json();
        setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        setFeedback({
          type: "success",
          message: `Lecture "${payload.title}" updated successfully!`,
        });
      }

      closeModal();
      clearFeedbackAfterDelay();
    } catch (err: any) {
      console.error("Save error:", err);
      setFeedback({
        type: "error",
        message: err.message || "An unexpected error occurred while saving the lecture.",
      });
      clearFeedbackAfterDelay();
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deleteModalLesson) return;
    setSubmitting(true);
    setSubmittingStatus("Deleting lecture...");

    try {
      const res = await fetch(`/api/admin/lessons?id=${deleteModalLesson.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete lecture");
      }

      setLessons((prev) => prev.filter((l) => l.id !== deleteModalLesson.id));
      setFeedback({
        type: "success",
        message: `Lecture "${deleteModalLesson.title}" has been removed.`,
      });
      setDeleteModalLesson(null);
      clearFeedbackAfterDelay();
    } catch (err: any) {
      console.error("Delete error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to delete lecture. Please try again.",
      });
      clearFeedbackAfterDelay();
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered lessons for table view
  const filteredLessons = lessons.filter((l) => {
    // Subject filter
    if (selectedSubjectId !== "all" && l.module?.subject_id !== selectedSubjectId) {
      return false;
    }
    // Module filter
    if (selectedModuleId !== "all" && l.module_id !== selectedModuleId) {
      return false;
    }
    // Department filter
    if (
      selectedDepartmentId !== "all" &&
      l.module?.subject?.department_id !== selectedDepartmentId
    ) {
      return false;
    }
    // Semester filter
    if (
      selectedSemester !== "all" &&
      String(l.module?.subject?.semester_number) !== selectedSemester
    ) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchSubject = (l.module?.subject?.title || "").toLowerCase().includes(q);
      const matchModule = (l.module?.title || "").toLowerCase().includes(q);
      const matchTopic = (l.topic?.title || "").toLowerCase().includes(q);
      const matchInstructor = (l.instructor || l.faculty?.name || "").toLowerCase().includes(q);
      if (
        !matchTitle &&
        !matchSubject &&
        !matchModule &&
        !matchTopic &&
        !matchInstructor
      ) {
        return false;
      }
    }
    return true;
  });

  // Determine if drag-and-drop reordering is active:
  // Reordering requires:
  // 1. Lessons belong to a single module (prevent cross-module corruption).
  // 2. Viewing the complete set of lectures in that module (no partial search filter).
  // 3. More than 1 lesson to reorder.
  const distinctModuleIds = Array.from(new Set(filteredLessons.map((l) => l.module_id)));
  const singleModuleId = distinctModuleIds.length === 1 ? distinctModuleIds[0] : null;
  const totalInSelectedModule = singleModuleId
    ? lessons.filter((l) => l.module_id === singleModuleId).length
    : 0;
  const isCompleteModuleView =
    Boolean(singleModuleId) &&
    totalInSelectedModule > 1 &&
    filteredLessons.length === totalInSelectedModule &&
    !searchQuery.trim();

  const canReorder = isCompleteModuleView;
  const activeModule = singleModuleId ? modules.find((m) => m.id === singleModuleId) : null;
  const isPartialFilterActive = Boolean(singleModuleId) && !isCompleteModuleView && totalInSelectedModule > 1;

  // Modules that contain lessons in the current view
  const availableModulesWithLessons = modules.filter((m) =>
    lessons.some(
      (l) =>
        l.module_id === m.id &&
        (selectedSubjectId === "all" || m.subject_id === selectedSubjectId) &&
        (selectedDepartmentId === "all" || m.subject?.department_id === selectedDepartmentId)
    )
  );

  // Sync orderedLessons with filteredLessons whenever filteredLessons changes
  useEffect(() => {
    setOrderedLessons(filteredLessons);
    lastPersistedOrderRef.current = filteredLessons.map((l) => l.id);
  }, [filteredLessons]);

  // Handle optimistic drag reorder update
  const handleReorder = (newOrder: Lesson[]) => {
    setOrderedLessons(newOrder);
  };

  // Commit reordered sequence to the database upon drag completion
  const handleCommitReorder = async (finalList?: Lesson[]) => {
    const listToCommit = finalList || orderedLessons;
    const newIds = listToCommit.map((l) => l.id);
    const lastIds = lastPersistedOrderRef.current;

    // Verify whether order has actually changed
    if (newIds.length === lastIds.length && newIds.every((id, idx) => id === lastIds[idx])) {
      return;
    }

    if (isSavingOrderRef.current) return;
    isSavingOrderRef.current = true;
    setIsSavingOrder(true);
    setOrderSaveStatus("saving");

    try {
      const targetModuleId = listToCommit[0]?.module_id;
      const res = await fetch("/api/admin/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          module_id: targetModuleId,
          ordered_ids: newIds,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to persist new video order.");
      }

      lastPersistedOrderRef.current = newIds;
      setOrderSaveStatus("saved");

      // Update parent lessons state
      setLessons((prev) => {
        const orderMap = new Map(newIds.map((id, idx) => [id, idx + 1]));
        return prev
          .map((l) => {
            if (orderMap.has(l.id)) {
              const seq = orderMap.get(l.id)!;
              return {
                ...l,
                display_order: seq,
                order_index: seq,
              };
            }
            return l;
          })
          .sort((a, b) => {
            if (a.module_id === targetModuleId && b.module_id === targetModuleId) {
              return (a.display_order ?? 0) - (b.display_order ?? 0);
            }
            return 0;
          });
      });

      setFeedback({
        type: "success",
        message: "Video sequence updated and saved to database successfully.",
      });
      setTimeout(() => setOrderSaveStatus("idle"), 3000);
      clearFeedbackAfterDelay();
    } catch (err: any) {
      console.error("Reorder save error:", err);
      // Revert to last confirmed order
      const rollbackMap = new Map(lastIds.map((id, idx) => [id, idx]));
      const restored = [...listToCommit].sort(
        (a, b) => (rollbackMap.get(a.id) ?? 0) - (rollbackMap.get(b.id) ?? 0)
      );
      setOrderedLessons(restored);
      setOrderSaveStatus("error");
      setFeedback({
        type: "error",
        message: err.message || "Failed to persist video sequence. Reverted to previous order.",
      });
      setTimeout(() => setOrderSaveStatus("idle"), 4000);
      clearFeedbackAfterDelay();
    } finally {
      setIsSavingOrder(false);
      isSavingOrderRef.current = false;
    }
  };

  // Keyboard and accessible button move
  const handleMoveItem = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedLessons.length) return;

    const nextList = [...orderedLessons];
    const item = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = item;

    setOrderedLessons(nextList);
    await handleCommitReorder(nextList);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
              Academic Engine
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Central Content Unit</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Lectures Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organized academic repository with YouTube video streaming and multi-tier syllabus mapping.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            title="Refresh list"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lecture</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between transition-all shadow-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Multi-discipline Academic Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Academic Filter Matrix</span>
          <span className="ml-auto text-[11px] font-normal text-slate-400">
            Showing {filteredLessons.length} of {lessons.length} lectures
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Branch / Department
            </label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            >
              <option value="all">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={String(sem)}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedModuleId("all");
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.code || "KTU"})
                </option>
              ))}
            </select>
          </div>

          {/* Module Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Module
            </label>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            >
              <option value="all">All Modules</option>
              {modules
                .filter((m) => selectedSubjectId === "all" || m.subject_id === selectedSubjectId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Search Keyword
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, topic, faculty..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reorder Status & Module Focus Banner */}
      {canReorder ? (
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 text-blue-950 font-medium">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">
                Manual Video Reordering Active
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Drag and drop lectures to rearrange their order. Changes are saved automatically.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isSavingOrder ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100/80 text-blue-800 font-bold text-[11px]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Saving sequence...</span>
              </span>
            ) : orderSaveStatus === "saved" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100/80 text-emerald-800 font-bold text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sequence saved</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-mono">
                {orderedLessons.length} videos sortable in {activeModule?.title || "module"}
              </span>
            )}
          </div>
        </div>
      ) : isPartialFilterActive ? (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 text-amber-950 font-medium">
            <div className="p-2 rounded-xl bg-amber-600 text-white shadow-xs shrink-0">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-amber-900">
                Manual Reordering Paused (Partial Filter Active)
              </div>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Displaying {filteredLessons.length} of {totalInSelectedModule} lectures in{" "}
                <span className="font-bold">{activeModule?.title || "this module"}</span>. Clear the search box to view and reorder all lectures in this module.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition-colors shrink-0 cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : selectedModuleId === "all" && availableModulesWithLessons.length > 0 ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Layers className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Select an Academic Module to Enable Video Drag-and-Drop Reordering:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {availableModulesWithLessons.map((m) => {
              const count = lessons.filter((l) => l.module_id === m.id).length;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedModuleId(m.id);
                    if (selectedSubjectId === "all" && m.subject_id) {
                      setSelectedSubjectId(m.subject_id);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-700 text-slate-800 font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>{m.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {count} {count === 1 ? "video" : "videos"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-medium">Loading academic lectures repository...</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No lectures found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No academic lectures matched your filter criteria. Try clearing filters or add a new lecture.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lecture</span>
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Record Cards for Lessons */}
            <div className="block md:hidden">
              {canReorder ? (
                <Reorder.Group
                  axis="y"
                  values={orderedLessons}
                  onReorder={handleReorder}
                  className="divide-y divide-slate-100"
                >
                  {orderedLessons.map((l, index) => (
                    <SortableLessonCard
                      key={l.id}
                      lesson={l}
                      index={index}
                      total={orderedLessons.length}
                      canReorder={canReorder}
                      onMoveUp={() => handleMoveItem(index, "up")}
                      onMoveDown={() => handleMoveItem(index, "down")}
                      onEdit={openEditModal}
                      onDelete={setDeleteModalLesson}
                      onDragEnd={handleCommitReorder}
                    />
                  ))}
                </Reorder.Group>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredLessons.map((l, index) => (
                    <SortableLessonCard
                      key={l.id}
                      lesson={l}
                      index={index}
                      total={filteredLessons.length}
                      canReorder={false}
                      onMoveUp={() => {}}
                      onMoveDown={() => {}}
                      onEdit={openEditModal}
                      onDelete={setDeleteModalLesson}
                      onDragEnd={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table with Sortable Drag Handles */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4 w-20 text-center">Order</th>
                    <th className="p-4">Lecture</th>
                    <th className="p-4">Academic Hierarchy</th>
                    <th className="p-4">Faculty / Instructor</th>
                    <th className="p-4">Video Status</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Updated</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                {canReorder ? (
                  <Reorder.Group
                    as="tbody"
                    axis="y"
                    values={orderedLessons}
                    onReorder={handleReorder}
                    className="divide-y divide-slate-100 text-slate-700"
                  >
                    {orderedLessons.map((l, index) => (
                      <SortableLessonRow
                        key={l.id}
                        lesson={l}
                        index={index}
                        total={orderedLessons.length}
                        canReorder={canReorder}
                        onMoveUp={() => handleMoveItem(index, "up")}
                        onMoveDown={() => handleMoveItem(index, "down")}
                        onEdit={openEditModal}
                        onDelete={setDeleteModalLesson}
                        onDragEnd={handleCommitReorder}
                      />
                    ))}
                  </Reorder.Group>
                ) : (
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredLessons.map((l, index) => (
                      <SortableLessonRow
                        key={l.id}
                        lesson={l}
                        index={index}
                        total={filteredLessons.length}
                        canReorder={false}
                        onMoveUp={() => {}}
                        onMoveDown={() => {}}
                        onEdit={openEditModal}
                        onDelete={setDeleteModalLesson}
                        onDragEnd={() => {}}
                      />
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* EXACT ADD / EDIT LECTURE MODAL                                            */}
      {/* Required fields: Lecture Name and YouTube Video Link                      */}
      {/* Displays immediate live 16:9 player preview & safe ID extraction          */}
      {/* ========================================================================= */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                    {modalMode === "create" ? "Add Lecture" : "Edit Lecture"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Connect academic syllabus with authenticated YouTube streaming.
                  </p>
                </div>
              </div>
              <button
                disabled={submitting}
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* 1. Lecture Name (REQUIRED) */}
              <div>
                <label className="block text-slate-900 font-bold mb-1">
                  Lecture Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering Mathematics — Module 3 — Laplace Transform"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium text-xs bg-slate-50/50 focus:bg-white"
                />
              </div>

              {/* 2. Academic Hierarchy: Department & Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Department / Branch
                  </label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => {
                      const newDeptId = e.target.value;
                      const matchedSubs = subjects.filter(
                        (s) => !newDeptId || s.department_id === newDeptId
                      );
                      setFormData((prev) => ({
                        ...prev,
                        department_id: newDeptId,
                        subject_id: matchedSubs[0]?.id || prev.subject_id,
                      }));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">[ Select Department ]</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Semester / Year
                  </label>
                  <select
                    value={formData.semester_number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        semester_number: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Academic Hierarchy: Subject & Module */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.subject_id}
                    onChange={(e) => {
                      const newSubId = e.target.value;
                      const relatedMods = modules.filter((m) => m.subject_id === newSubId);
                      setFormData((prev) => ({
                        ...prev,
                        subject_id: newSubId,
                        module_id: relatedMods[0]?.id || "",
                        topic_id: "",
                      }));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                  >
                    <option value="">[ Select Subject ]</option>
                    {availableModalSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.code || "KTU"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Module / Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.module_id}
                    onChange={(e) => {
                      const newModId = e.target.value;
                      const relTopics = topics.filter((t) => t.module_id === newModId);
                      setFormData((prev) => ({
                        ...prev,
                        module_id: newModId,
                        topic_id: relTopics[0]?.id || "",
                      }));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                  >
                    <option value="">[ Select Module ]</option>
                    {availableModalModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Topic & Faculty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Topic
                  </label>
                  <select
                    value={formData.topic_id}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, topic_id: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">[ Select Topic ]</option>
                    {availableModalTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Faculty / Instructor
                  </label>
                  <select
                    value={formData.faculty_id}
                    onChange={(e) => {
                      const facId = e.target.value;
                      const fac = facultyList.find((f) => f.id === facId);
                      setFormData((prev) => ({
                        ...prev,
                        faculty_id: facId,
                        instructor: fac?.name || prev.instructor,
                      }));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">[ Select Faculty ]</option>
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} — {f.department}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Description */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Outline syllabus concepts, derivation points, solved questions..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-normal leading-relaxed text-xs"
                />
              </div>

              {/* 6. YouTube Video Link (REQUIRED) & Live Preview */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-900 font-bold flex items-center gap-1.5">
                    <YoutubeIcon className="w-4 h-4 text-red-600" />
                    <span>YouTube Video Link</span>
                    <span className="text-red-500">*</span>
                  </label>
                  {detectedYtId && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Ready to Attach (ID: {detectedYtId})
                    </span>
                  )}
                </div>

                <div>
                  <input
                    type="url"
                    required
                    value={formData.youtube_url}
                    placeholder="Paste YouTube video link here (e.g. https://www.youtube.com/watch?v=VIDEO_ID)"
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, youtube_url: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Accepts watch, youtu.be, shorts, and embed links. Students will watch directly in EngiVault.
                  </p>
                </div>

                {/* Validation feedback if invalid URL is entered */}
                {isInvalidYtUrl && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span className="font-semibold">Please enter a valid YouTube video link.</span>
                  </div>
                )}

                {/* Live Preview Container (Thumbnail & Responsive 16:9 Embed) */}
                {detectedYtId && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-red-600 fill-red-600" />
                        <span>Video Preview</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">16:9 Responsive Player</span>
                    </div>

                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-300 shadow-sm">
                      <iframe
                        src={getYouTubeEmbedUrl(detectedYtId)}
                        title="YouTube video preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Published Toggle */}
              <div className="flex items-center gap-3 pt-1">
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
                  Publish lecture immediately to student vault
                </span>
              </div>

              {/* Form Validation Feedback if Save is not ready */}
              {!isSaveReady && (
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Lecture Name and a valid YouTube video link are required to save.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !isSaveReady}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white bg-blue-700 hover:bg-blue-800 font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{submittingStatus}</span>
                    </>
                  ) : (
                    <span>Save Lecture</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Lecture</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 font-bold">
                &ldquo;{deleteModalLesson.title}&rdquo;
              </strong>
              ? This will remove the lecture and its YouTube link from EngiVault.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                disabled={submitting}
                onClick={() => setDeleteModalLesson(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-xs font-medium">Loading lectures...</p>
        </div>
      }
    >
      <AdminLessonsContent />
    </Suspense>
  );
}
