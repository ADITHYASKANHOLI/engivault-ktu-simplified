"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Video,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Play,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Subject, Module, Lesson } from "@/types";
import { formatFileSize } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
} from "@/lib/utils/youtube";

export default function AdminUploadsPage() {
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [contentType, setContentType] = useState<"material" | "video">("material");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdResource, setCreatedResource] = useState<{ id: string; title: string; storagePath?: string } | null>(null);

  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [autoPublish, setAutoPublish] = useState(true);

  // Video lecture form (YouTube-first architecture)
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoInstructor, setVideoInstructor] = useState("");
  const [videoPublish, setVideoPublish] = useState(true);
  const [videoSubmitting, setVideoSubmitting] = useState(false);
  const [videoFeedback, setVideoFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [availableLessons, setAvailableLessons] = useState<Lesson[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Load subjects on mount
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch("/api/admin/subjects", { cache: "no-store" });
        if (res.ok) {
          const data: Subject[] = await res.json();
          setSubjects(data);
          if (data.length > 0) {
            setSelectedSubject(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load subjects:", err);
      }
    }
    loadSubjects();
  }, []);

  // 2. Cascade load modules when selectedSubject changes
  useEffect(() => {
    if (!selectedSubject) {
      setAvailableModules([]);
      setSelectedModule("");
      return;
    }
    async function loadModules() {
      try {
        const res = await fetch(`/api/admin/modules?subjectId=${selectedSubject}`, { cache: "no-store" });
        if (res.ok) {
          const data: Module[] = await res.json();
          setAvailableModules(data);
          if (data.length > 0) {
            setSelectedModule(data[0].id);
          } else {
            setSelectedModule("");
          }
        }
      } catch (err) {
        console.error("Failed to load modules:", err);
      }
    }
    loadModules();
  }, [selectedSubject]);

  // 3. Cascade load lessons when selectedModule changes
  useEffect(() => {
    if (!selectedModule) {
      setAvailableLessons([]);
      setSelectedLesson("");
      return;
    }
    async function loadLessons() {
      try {
        const res = await fetch(`/api/admin/lessons?moduleId=${selectedModule}`, { cache: "no-store" });
        if (res.ok) {
          const data: Lesson[] = await res.json();
          setAvailableLessons(data);
          if (data.length > 0) {
            setSelectedLesson(data[0].id);
          } else {
            setSelectedLesson("");
          }
        }
      } catch (err) {
        console.error("Failed to load lessons:", err);
      }
    }
    loadLessons();
  }, [selectedModule]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    const validExtensions = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".zip"];
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMessage("Please select a supported document (PDF, Word, PowerPoint, TXT, or ZIP).");
      return;
    }
    if (file.size > 104857600) {
      setErrorMessage("File exceeds 100MB maximum upload limit.");
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
    setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
  };

  // Real Upload Workflow for Study Materials
  const startMaterialUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Please choose a file to upload.");
      return;
    }

    if (!selectedSubject || !selectedModule || !selectedLesson) {
      setErrorMessage("Valid Subject, Module, and Lecture selections are required.");
      return;
    }

    setUploadStatus("uploading");
    setErrorMessage(null);
    setUploadProgress(15);
    setUploadStage("Requesting authorized storage target...");

    let uploadedStoragePath: string | null = null;
    let targetBucket = "engivault-materials";

    try {
      // Step 1: Request signed upload target
      const authRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: targetBucket,
          filename: selectedFile.name,
          mime_type: selectedFile.type || "application/pdf",
          file_size: selectedFile.size,
          subject_id: selectedSubject,
          module_id: selectedModule,
          lesson_id: selectedLesson,
        }),
      });

      if (!authRes.ok) {
        const errData = await authRes.json().catch(() => ({}));
        throw new Error(errData.error || `Upload authorization failed (HTTP ${authRes.status})`);
      }

      const authData = await authRes.json();
      targetBucket = authData.bucket || targetBucket;
      uploadedStoragePath = authData.storagePath;

      setUploadProgress(40);
      setUploadStage("Transferring file bytes to Supabase Storage...");

      // Step 2: Transfer actual file bytes to Supabase Storage
      let transferSuccess = false;

      if (authData.mode === "supabase-direct" && authData.token && authData.storagePath) {
        try {
          const supabase = createClient();
          const { data: uploadRes, error: uploadErr } = await supabase.storage
            .from(targetBucket)
            .uploadToSignedUrl(authData.storagePath, authData.token, selectedFile);

          if (uploadErr) {
            throw uploadErr;
          }
          if (uploadRes) {
            transferSuccess = true;
          }
        } catch (signedErr: any) {
          console.warn("Client signed upload error, falling back to server upload:", signedErr?.message || signedErr);
          // Fallback to server-side multipart streaming
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("bucket", targetBucket);
          formData.append("subject_id", selectedSubject);
          formData.append("module_id", selectedModule);
          formData.append("lesson_id", selectedLesson);

          const multiRes = await fetch("/api/admin/upload", {
            method: "POST",
            body: formData,
          });

          if (!multiRes.ok) {
            const multiErr = await multiRes.json().catch(() => ({}));
            throw new Error(multiErr.error || "Storage transfer failed via server upload.");
          }

          const multiData = await multiRes.json();
          uploadedStoragePath = multiData.storagePath || uploadedStoragePath;
          transferSuccess = true;
        }
      } else if (authData.mode === "local-simulation") {
        // Zero-config development local mode
        transferSuccess = true;
      } else {
        // Direct server multipart upload
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("bucket", targetBucket);
        formData.append("subject_id", selectedSubject);
        formData.append("module_id", selectedModule);
        formData.append("lesson_id", selectedLesson);

        const multiRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!multiRes.ok) {
          const multiErr = await multiRes.json().catch(() => ({}));
          throw new Error(multiErr.error || "Failed to transfer file bytes to storage.");
        }

        const multiData = await multiRes.json();
        uploadedStoragePath = multiData.storagePath || uploadedStoragePath;
        transferSuccess = true;
      }

      if (!transferSuccess) {
        throw new Error("File could not be transferred to storage.");
      }

      setUploadProgress(80);
      setUploadStage("Recording material metadata in database...");

      // Step 3: Record metadata in database
      const matRes = await fetch("/api/admin/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson_id: selectedLesson,
          subject_id: selectedSubject,
          module_id: selectedModule,
          title: docTitle.trim() || selectedFile.name,
          description: docDescription.trim() || null,
          material_type: selectedFile.name.toLowerCase().endsWith(".pdf") ? "pdf" : "notes",
          storage_path: uploadedStoragePath || `materials/${selectedFile.name}`,
          original_filename: selectedFile.name,
          mime_type: selectedFile.type || "application/pdf",
          file_size: selectedFile.size,
          published: autoPublish,
        }),
      });

      if (!matRes.ok) {
        const matErr = await matRes.json().catch(() => ({}));
        // Clean up orphaned storage object to prevent leaks
        if (uploadedStoragePath) {
          try {
            await fetch(`/api/admin/upload?bucket=${targetBucket}&path=${encodeURIComponent(uploadedStoragePath)}`, {
              method: "DELETE",
            });
          } catch (cleanupErr) {
            console.warn("Orphan cleanup notice:", cleanupErr);
          }
        }
        throw new Error(matErr.error || `Failed to record material metadata (HTTP ${matRes.status})`);
      }

      const created = await matRes.json();
      setCreatedResource({
        id: created.id,
        title: created.title,
        storagePath: uploadedStoragePath || undefined,
      });

      setUploadProgress(100);
      setUploadStage("Upload and metadata registration complete!");
      setUploadStatus("success");
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadStatus("error");
      setErrorMessage(err?.message || "An unexpected error occurred during upload.");
    }
  };

  // YouTube-First Lecture Creation
  const handleCreateYouTubeLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !selectedModule) {
      setVideoFeedback({ type: "error", message: "Please select an academic subject and module." });
      return;
    }
    const title = videoTitle.trim();
    if (title.length < 2) {
      setVideoFeedback({ type: "error", message: "Lecture Title must be at least 2 characters." });
      return;
    }
    const cleanUrl = videoUrl.trim();
    const vidId = extractYouTubeVideoId(cleanUrl);
    if (!vidId) {
      setVideoFeedback({ type: "error", message: "Please enter a valid YouTube video link (Watch, Shorts, or Share URL)." });
      return;
    }

    setVideoSubmitting(true);
    setVideoFeedback(null);

    try {
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: selectedModule,
          title,
          youtube_url: cleanUrl,
          youtube_video_id: vidId,
          instructor: videoInstructor.trim() || null,
          published: videoPublish,
          lesson_number: availableLessons.length + 1,
          display_order: availableLessons.length + 1,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create lecture in database");
      }

      const created = await res.json();
      setAvailableLessons((prev) => [created, ...prev]);
      setSelectedLesson(created.id);
      setVideoFeedback({
        type: "success",
        message: `Lecture "${created.title}" successfully published with YouTube video ID ${vidId}!`,
      });
      setVideoTitle("");
      setVideoUrl("");
    } catch (err: any) {
      setVideoFeedback({ type: "error", message: err?.message || "Failed to publish YouTube lecture." });
    } finally {
      setVideoSubmitting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStage("");
    setUploadStatus("idle");
    setErrorMessage(null);
    setCreatedResource(null);
    setDocTitle("");
    setDocDescription("");
  };

  const detectedVideoId = extractYouTubeVideoId(videoUrl.trim());
  const isTargetReady = Boolean(selectedSubject && selectedModule && selectedLesson);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 pb-6 border-b border-slate-200/80">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>DIRECT-TO-STORAGE & YOUTUBE STUDIO</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Admin Upload & Content Studio
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Upload PDF notes to Supabase Storage or create YouTube-first lectures with instant academic metadata sync.
        </p>
      </div>

      {/* Content Type Tabs */}
      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
        <button
          type="button"
          onClick={() => {
            setContentType("material");
            setUploadStatus("idle");
            setErrorMessage(null);
          }}
          className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
            contentType === "material"
              ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          <FileText className={`w-5 h-5 ${contentType === "material" ? "text-emerald-700" : "text-slate-400"}`} />
          <div>
            <div className="text-sm">Study Material / Notes</div>
            <div className="text-[11px] text-slate-500 font-normal mt-0.5">PDF, PPT, Word (Up to 100MB)</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setContentType("video");
            setUploadStatus("idle");
            setErrorMessage(null);
          }}
          className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
            contentType === "video"
              ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          <Video className={`w-5 h-5 ${contentType === "video" ? "text-emerald-700" : "text-slate-400"}`} />
          <div>
            <div className="text-sm">Video Lecture</div>
            <div className="text-[11px] text-slate-500 font-normal mt-0.5">YouTube Streaming (16:9 HD)</div>
          </div>
        </button>
      </div>

      {/* VIEW A: YOUTUBE LECTURE WORKFLOW */}
      {contentType === "video" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>ENGIVAULT YouTube-First Lecture Architecture</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              All video lectures are delivered via verified YouTube embeds for instantaneous 16:9 playback, zero server buffering, and maximum bandwidth reliability for students.
            </p>
          </div>

          <form onSubmit={handleCreateYouTubeLecture} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Academic Subject *
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-emerald-600"
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
                  Module / Unit *
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {availableModules.length === 0 ? (
                    <option value="">No modules found for subject</option>
                  ) : (
                    availableModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lecture Name *
              </label>
              <input
                type="text"
                required
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="e.g. Module 1: Laplace Transform Definition & Basic Properties"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                YouTube Video Link *
              </label>
              <input
                type="url"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              {detectedVideoId && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <img
                    src={getYouTubeThumbnailUrl(detectedVideoId, "default")}
                    alt="YouTube Thumbnail Preview"
                    className="w-20 h-14 object-cover rounded-lg border border-slate-300"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-800">YouTube Video ID Validated: </span>
                    <span className="font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">
                      {detectedVideoId}
                    </span>
                    <div className="text-slate-500 mt-0.5">Ready for 16:9 student playback</div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Instructor Attribution (Optional)
                </label>
                <input
                  type="text"
                  value={videoInstructor}
                  onChange={(e) => setVideoInstructor(e.target.value)}
                  placeholder="e.g. Dr. K. Ramanathan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="yt-publish-check"
                  checked={videoPublish}
                  onChange={(e) => setVideoPublish(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <label htmlFor="yt-publish-check" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Publish lecture immediately to students
                </label>
              </div>
            </div>

            {videoFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  videoFeedback.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                    : "bg-red-50 border border-red-200 text-red-900"
                }`}
              >
                {videoFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{videoFeedback.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link
                href={`/admin/dashboard/lessons?subjectId=${selectedSubject}&moduleId=${selectedModule}&create=true`}
                className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>Open Full Lecture Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="submit"
                disabled={videoSubmitting || !videoTitle.trim() || !detectedVideoId || !selectedModule}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs"
              >
                {videoSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Publish YouTube Lecture</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW B: STUDY MATERIAL FILE UPLOAD WIZARD */}
      {contentType === "material" && (
        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between max-w-xl mx-auto text-xs font-semibold">
            <div className={`flex items-center gap-2 ${step >= 1 ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-600"}`}>
                1
              </span>
              <span>Target Lecture</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-2" />
            <div className={`flex items-center gap-2 ${step >= 2 ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-600"}`}>
                2
              </span>
              <span>File Select</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-2" />
            <div className={`flex items-center gap-2 ${step >= 3 ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-600"}`}>
                3
              </span>
              <span>Upload & Sync</span>
            </div>
          </div>

          {/* Step 1: Destination Selection */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Step 1: Select Academic Lecture Destination
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.code || "KTU"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Select Module
                    </label>
                    <select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {availableModules.length === 0 ? (
                        <option value="">No modules found for subject</option>
                      ) : (
                        availableModules.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Select Attached Lecture *
                    </label>
                    <select
                      value={selectedLesson}
                      onChange={(e) => setSelectedLesson(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {availableLessons.length === 0 ? (
                        <option value="">No lectures found in this module</option>
                      ) : (
                        availableLessons.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.title}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {!isTargetReady && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Study materials must attach to an academic lecture. Create a lecture first if none exists.
                      </span>
                    </div>
                    {selectedModule && (
                      <Link
                        href={`/admin/dashboard/lessons?subjectId=${selectedSubject}&moduleId=${selectedModule}&create=true`}
                        className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold transition-colors"
                      >
                        Add Lecture
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={!isTargetReady}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <span>Continue to File Selection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Drag & Drop Dropzone */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Step 2: Choose Study Material Document
              </h2>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/60 scale-[1.01]"
                    : "border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-slate-50"
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {selectedFile ? selectedFile.name : "Click to select or drag and drop your document here"}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {selectedFile
                    ? `Size: ${formatFileSize(selectedFile.size)} • Type: ${selectedFile.type || "document"}`
                    : "Supports PDF lecture notes, Question banks, and PPT presentations (Max 100MB)"}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={!selectedFile}
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <span>Next: Review & Upload</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Metadata, Upload & Safe Verification */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Step 3: Review, Add Metadata & Execute Upload
              </h2>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">File Selected:</span>
                  <span className="font-bold text-slate-900">{selectedFile?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">File Size:</span>
                  <span className="font-mono text-slate-900">{formatFileSize(selectedFile?.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Storage Destination:</span>
                  <span className="font-mono text-emerald-800 font-bold">engivault-materials (Supabase)</span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Resource Display Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. Module 1 Handwritten Limits Notes"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Description / Highlights
                  </label>
                  <textarea
                    rows={2}
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    placeholder="Important formulas, university exam solutions..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="auto-publish-check"
                    checked={autoPublish}
                    onChange={(e) => setAutoPublish(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <label htmlFor="auto-publish-check" className="font-semibold text-slate-700 cursor-pointer">
                    Automatically publish and make available to students immediately
                  </label>
                </div>
              </div>

              {/* Progress State */}
              {uploadStatus === "uploading" && (
                <div className="space-y-2 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex justify-between text-xs font-mono font-bold text-emerald-950">
                    <span>{uploadStage || "Transferring file..."}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-emerald-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Notification */}
              {uploadStatus === "success" && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-bold">
                      Material &ldquo;{createdResource?.title}&rdquo; uploaded and registered successfully!
                    </span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={resetWizard}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Upload Another Material</span>
                    </button>
                    <Link
                      href="/admin/dashboard/materials"
                      className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-semibold transition-colors"
                    >
                      View All Materials
                    </Link>
                  </div>
                </div>
              )}

              {/* Error Notification */}
              {uploadStatus === "error" && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-950 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Upload Failed</div>
                      <div className="text-red-700 mt-0.5">{errorMessage || "An unexpected error occurred."}</div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={startMaterialUpload}
                      className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold transition-colors"
                    >
                      Retry Upload
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {uploadStatus !== "success" && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={uploadStatus === "uploading"}
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={uploadStatus === "uploading" || !docTitle.trim()}
                    onClick={startMaterialUpload}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-md"
                  >
                    {uploadStatus === "uploading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading File Bytes...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Start Secure Upload</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
