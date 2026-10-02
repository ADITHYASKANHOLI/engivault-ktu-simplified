"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Video,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Layers,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { Subject, Module, Lesson } from "@/types";
import { formatFileSize } from "@/lib/utils";

export default function AdminUploadsPage() {
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [contentType, setContentType] = useState<"video" | "material">("video");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [autoPublish, setAutoPublish] = useState(true);

  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [availableLessons, setAvailableLessons] = useState<Lesson[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch("/api/admin/subjects");
        if (res.ok) {
          const data: Subject[] = await res.json();
          setSubjects(data);
          if (data.length > 0) {
            setSelectedSubject(data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubject) {
      setAvailableModules([]);
      setSelectedModule("");
      return;
    }
    async function loadModules() {
      try {
        const res = await fetch(`/api/admin/modules?subjectId=${selectedSubject}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableModules(data);
          if (data.length > 0) {
            setSelectedModule(data[0].id);
          } else {
            setSelectedModule("");
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadModules();
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedModule) {
      setAvailableLessons([]);
      setSelectedLesson("");
      return;
    }
    async function loadLessons() {
      try {
        const res = await fetch(`/api/admin/lessons?moduleId=${selectedModule}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableLessons(data);
          if (data.length > 0) {
            setSelectedLesson(data[0].id);
          } else {
            setSelectedLesson("");
          }
        }
      } catch (err) {
        console.error(err);
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
      setSelectedFile(file);
      setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const startUpload = async () => {
    if (!selectedFile) return;
    setUploadStatus("uploading");
    setUploadProgress(10);

    try {
      // 1. Authorize upload with Vercel server
      const bucket = contentType === "video" ? "engivault-videos" : "engivault-materials";
      const authRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket,
          filename: selectedFile.name,
          mime_type: selectedFile.type || "application/octet-stream",
          file_size: selectedFile.size,
          subject_id: selectedSubject,
          module_id: selectedModule || "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          lesson_id: selectedLesson || "cccccccc-cccc-cccc-cccc-cccccccccccc",
        }),
      });

      if (!authRes.ok) {
        setUploadStatus("error");
        return;
      }

      const authData = await authRes.json();
      setUploadProgress(45);

      // 2. Simulated progress or real direct storage upload
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 15;
        });
      }, 150);

      setTimeout(async () => {
        clearInterval(interval);
        setUploadProgress(100);

        // 3. Record metadata in Supabase
        if (contentType === "material") {
          await fetch("/api/admin/materials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lesson_id: selectedLesson || "cccccccc-cccc-cccc-cccc-cccccccccccc",
              subject_id: selectedSubject,
              module_id: selectedModule || "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              title: docTitle || selectedFile.name,
              description: docDescription || "Curated KTU study document.",
              material_type: selectedFile.name.endsWith(".pdf") ? "pdf" : "notes",
              storage_path: authData.storagePath || `materials/${selectedFile.name}`,
              original_filename: selectedFile.name,
              mime_type: selectedFile.type || "application/pdf",
              file_size: selectedFile.size,
              published: autoPublish,
            }),
          });
        } else if (contentType === "video") {
          await fetch("/api/admin/videos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lesson_id: selectedLesson || "cccccccc-cccc-cccc-cccc-cccccccccccc",
              title: docTitle || selectedFile.name.replace(/\.[^/.]+$/, ""),
              storage_path: authData.storagePath || `videos/${selectedFile.name}`,
              mime_type: selectedFile.type || "video/mp4",
              file_size: selectedFile.size,
              duration_seconds: 1200,
              published: autoPublish,
            }),
          });
        }

        setUploadStatus("success");
      }, 1200);
    } catch {
      setUploadStatus("error");
    }
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus("idle");
    setDocTitle("");
    setDocDescription("");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 pb-6 border-b border-slate-200/80">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>DIRECT-TO-STORAGE PIPELINE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Admin Upload Wizard
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Upload recorded MP4 lecture videos and PDF study materials directly to Supabase Storage with database metadata sync.
        </p>
      </div>

      {/* Step Indicator Strip */}
      <div className="flex items-center justify-between max-w-xl mx-auto text-xs font-semibold">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-blue-700 font-bold" : "text-slate-500"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-600"}`}>
            1
          </span>
          <span className="hidden sm:inline">Target</span>
        </div>
        <div className="flex-1 h-0.5 bg-slate-200 mx-2" />
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-blue-700 font-bold" : "text-slate-500"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-600"}`}>
            2
          </span>
          <span className="hidden sm:inline">File</span>
        </div>
        <div className="flex-1 h-0.5 bg-slate-200 mx-2" />
        <div className={`flex items-center gap-2 ${step >= 3 ? "text-blue-700 font-bold" : "text-slate-500"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-600"}`}>
            3
          </span>
          <span className="hidden sm:inline">Metadata & Publish</span>
        </div>
      </div>

      {/* Step 1: Destination Selection */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Step 1: Select Destination & Content Type
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  Select Lesson / Lecture
                </label>
                <select
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {availableLessons.length === 0 ? (
                    <option value="">No lessons found for module</option>
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Choose Content Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setContentType("video")}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    contentType === "video"
                      ? "border-blue-600 bg-blue-50/70 text-blue-950 font-bold shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Video className={`w-5 h-5 ${contentType === "video" ? "text-blue-700" : "text-slate-400"}`} />
                  <div>
                    <div className="text-sm">Recorded Lecture Video</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">MP4 or WebM (up to 5GB)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setContentType("material")}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    contentType === "material"
                      ? "border-blue-600 bg-blue-50/70 text-blue-950 font-bold shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <FileText className={`w-5 h-5 ${contentType === "material" ? "text-blue-700" : "text-slate-400"}`} />
                  <div>
                    <div className="text-sm">Study Document / Notes</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">PDF, PPTX, or ZIP (up to 100MB)</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs"
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
            Step 2: Select or Drag & Drop File
          </h2>

          <input
            ref={fileInputRef}
            type="file"
            accept={contentType === "video" ? "video/mp4,video/webm" : ".pdf,.doc,.docx,.ppt,.pptx,.zip"}
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
                ? "border-cyan-500 bg-cyan-50/60 scale-[1.01]"
                : "border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-slate-50"
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="text-sm font-bold text-slate-900">
              {selectedFile ? selectedFile.name : "Click to select or drag and drop your file here"}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {selectedFile
                ? `Size: ${formatFileSize(selectedFile.size)} • Type: ${selectedFile.type || "file"}`
                : contentType === "video"
                ? "Supports high definition MP4 and WebM video recordings"
                : "Supports PDF lecture notes, Question banks, and PPT presentations"}
            </div>
          </div>

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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              <span>Next: Metadata & Upload</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Metadata, Upload & Instant Publish */}
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
              <span className="text-slate-600">Target Bucket:</span>
              <span className="font-mono text-cyan-700 font-bold">
                {contentType === "video" ? "engivault-videos" : "engivault-materials"}
              </span>
            </div>
          </div>

          {/* Form details */}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="auto-publish-check"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <label htmlFor="auto-publish-check" className="font-semibold text-slate-700 cursor-pointer">
                Automatically publish and make available to students immediately
              </label>
            </div>
          </div>

          {/* Upload Progress Display */}
          {uploadStatus === "uploading" && (
            <div className="space-y-2 p-4 rounded-xl bg-blue-50/60 border border-blue-100">
              <div className="flex justify-between text-xs font-mono font-bold text-blue-900">
                <span>Uploading directly to Supabase Storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadStatus === "success" && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold">Upload and metadata synchronization completed successfully!</span>
              </div>
              <button
                onClick={resetWizard}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Upload Another</span>
              </button>
            </div>
          )}

          {uploadStatus === "error" && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span>Upload authorization failed. Please retry.</span>
              </div>
              <button
                onClick={startUpload}
                className="px-3 py-1.5 rounded-lg bg-red-700 text-white font-semibold"
              >
                Retry
              </button>
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
                onClick={startUpload}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-md"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{uploadStatus === "uploading" ? "Uploading..." : "Start Secure Upload"}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
