"use client";

import React, { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { WorksActivity, WorksCategory, WorksDeliveryMode, WorksActivityStatus } from "@/types";
import { validateActivityPublicationReadiness } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";

interface WorksActivityFormProps {
  initialData?: Partial<WorksActivity>;
  isEdit?: boolean;
  activityId?: string;
}

const CATEGORIES: WorksCategory[] = [
  "Workshop",
  "Internship",
  "Technical Training",
  "Collaborative Project",
  "Seminar / Talk",
  "Hackathon / Contest",
  "Certification",
  "Other",
];

export function WorksActivityForm({
  initialData,
  isEdit = false,
  activityId,
}: WorksActivityFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to convert ISO date string to datetime-local value (YYYY-MM-DDTHH:mm)
  const toDateTimeLocal = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  };

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData?.slug));
  const [category, setCategory] = useState<string>(initialData?.category || "Workshop");
  const [activityType, setActivityType] = useState(initialData?.activity_type || "Hands-on Workshop");
  const [deliveryMode, setDeliveryMode] = useState<WorksDeliveryMode>(initialData?.delivery_mode || "in_person");
  const [venue, setVenue] = useState(initialData?.venue || "");
  const [shortDescription, setShortDescription] = useState(initialData?.short_description || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [startAt, setStartAt] = useState(toDateTimeLocal(initialData?.start_at));
  const [endAt, setEndAt] = useState(toDateTimeLocal(initialData?.end_at));
  const [timezone, setTimezone] = useState(initialData?.timezone || "Asia/Kolkata");
  
  // Platform link & fee
  const [registrationUrl, setRegistrationUrl] = useState(initialData?.registration_url || "");
  const [registrationOpensAt, setRegistrationOpensAt] = useState(toDateTimeLocal(initialData?.registration_opens_at));
  const [registrationClosesAt, setRegistrationClosesAt] = useState(toDateTimeLocal(initialData?.registration_closes_at));
  const [feeAmount, setFeeAmount] = useState<number>(initialData?.fee_amount ?? 0);
  const [currency, setCurrency] = useState(initialData?.currency || "INR");
  const [capacity, setCapacity] = useState<string>(initialData?.capacity ? String(initialData.capacity) : "");

  // Flyer / Poster state
  const [coverImage, setCoverImage] = useState<string>(initialData?.cover_image || "");
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(initialData?.cover_image || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Host & Contacts
  const [organizerDetails, setOrganizerDetails] = useState(initialData?.organizer_details || "FOLE CEV — College of Engineering Vadakara");
  const [contactEmail, setContactEmail] = useState(initialData?.contact_email || "folecev@gmail.com");
  const [contactPhone, setContactPhone] = useState(initialData?.contact_phone || "");
  const [isFeatured, setIsFeatured] = useState(Boolean(initialData?.is_featured));
  const [status, setStatus] = useState<WorksActivityStatus>(initialData?.status || "draft");

  // Learning outcomes dynamic items
  const [outcomes, setOutcomes] = useState<string[]>(
    initialData?.learning_outcomes && initialData.learning_outcomes.length > 0
      ? initialData.learning_outcomes
      : [""]
  );

  const [saving, setSaving] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched && !isEdit) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generated);
    }
  };

  const handleAddOutcome = () => {
    setOutcomes([...outcomes, ""]);
  };

  const handleOutcomeChange = (index: number, val: string) => {
    const updated = [...outcomes];
    updated[index] = val;
    setOutcomes(updated);
  };

  const handleRemoveOutcome = (index: number) => {
    setOutcomes(outcomes.filter((_, i) => i !== index));
  };

  // Validate and stage flyer image file
  const handleFileSelection = (file: File) => {
    setUploadError(null);
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimes.includes(file.type)) {
      setUploadError("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      setUploadError("Image exceeds 10MB limit. Please compress the flyer before uploading.");
      return;
    }

    setFlyerFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFlyerPreview(objectUrl);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFlyer = () => {
    setFlyerFile(null);
    setFlyerPreview(null);
    setCoverImage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Publication readiness assessment
  const publicationReadiness = useMemo(() => {
    const hasFlyer = Boolean(flyerFile || flyerPreview || coverImage);
    return validateActivityPublicationReadiness({
      title,
      description,
      cover_image: hasFlyer ? "has_flyer" : null,
      registration_url: registrationUrl,
      fee_amount: feeAmount,
    });
  }, [title, description, flyerFile, flyerPreview, coverImage, registrationUrl, feeAmount]);

  const handleVerifyLink = () => {
    if (!registrationUrl.trim()) {
      alert("Please enter an activity platform link first.");
      return;
    }
    try {
      const u = new URL(registrationUrl.trim());
      if (u.protocol !== "https:" && u.protocol !== "http:") {
        alert("Platform link must use https:// protocol.");
        return;
      }
      window.open(u.toString(), "_blank", "noopener,noreferrer");
    } catch {
      alert("Invalid URL format. Please include https://");
    }
  };

  const handleSubmit = async (submitStatus: WorksActivityStatus) => {
    try {
      setSaving(true);
      setError(null);
      setProgressText(null);

      if (!title.trim()) throw new Error("Activity title is required.");
      if (!slug.trim()) throw new Error("URL slug is required.");
      if (!description.trim()) throw new Error("Full description is required.");

      // Check publication readiness if publishing
      if (submitStatus === "published") {
        if (!publicationReadiness.isReady) {
          throw new Error(
            `Cannot publish activity. Required fields incomplete: ${publicationReadiness.missing.join(", ")}`
          );
        }
      }

      let activeCoverImage = coverImage;

      // Upload flyer if new file selected
      if (flyerFile) {
        setProgressText("Uploading flyer to Supabase Storage...");
        const formData = new FormData();
        formData.append("file", flyerFile);
        formData.append("bucket", "engivault-thumbnails");
        formData.append("folder", "works-flyers");

        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          throw new Error(`Flyer upload failed: ${uploadErr.error || "Storage upload failed"}`);
        }

        const uploadData = await uploadRes.json();
        activeCoverImage = uploadData.publicUrl || uploadData.path;
        if (!activeCoverImage) {
          throw new Error("Upload succeeded but failed to retrieve public flyer URL.");
        }
        setCoverImage(activeCoverImage);
      }

      setProgressText("Saving activity record...");

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        category,
        activity_type: activityType.trim(),
        delivery_mode: deliveryMode,
        venue: venue.trim() || null,
        cover_image: activeCoverImage.trim() || null,
        short_description: shortDescription.trim() || null,
        description: description.trim(),
        start_at: startAt ? new Date(startAt).toISOString() : null,
        end_at: endAt ? new Date(endAt).toISOString() : null,
        timezone: timezone.trim() || "Asia/Kolkata",
        registration_url: registrationUrl.trim() || null,
        registration_opens_at: registrationOpensAt ? new Date(registrationOpensAt).toISOString() : null,
        registration_closes_at: registrationClosesAt ? new Date(registrationClosesAt).toISOString() : null,
        fee_amount: Number(feeAmount) || 0,
        currency: currency.trim() || "INR",
        capacity: capacity ? parseInt(capacity, 10) : null,
        organizer_details: organizerDetails.trim() || null,
        learning_outcomes: outcomes.map((o) => o.trim()).filter(Boolean),
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        is_featured: isFeatured,
        status: submitStatus,
      };

      const url = isEdit ? `/api/admin/works/${activityId}` : "/api/admin/works";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save activity to database");
      }

      router.push("/admin/dashboard/works/activities");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
      setProgressText(null);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(status);
      }}
      className="space-y-6"
    >
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <Link
            href="/admin/dashboard/works/activities"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-500 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Activities List</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isEdit ? "Edit FOLE WORKS Activity" : "Create FOLE WORKS Activity"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure title, flyer poster, description, registration fee, and external platform link.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit("draft")}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors min-h-[44px]"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Draft"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit("published")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-xs min-h-[44px]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isEdit ? "Update & Publish" : "Publish Activity"}</span>
          </button>
        </div>
      </div>

      {/* Upload & Save Progress Banner */}
      {progressText && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          <span className="font-medium">{progressText}</span>
        </div>
      )}

      {/* Global Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Publication Readiness Checklist */}
      <div className="bg-slate-50 dark:bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 dark:text-slate-200">
              Publication Readiness Checklist
            </h3>
          </div>
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase",
              publicationReadiness.isReady
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
            )}
          >
            {publicationReadiness.isReady ? "Ready to Publish" : "Draft Incomplete"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1 text-xs">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            {title.trim().length >= 3 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
            )}
            <span className={title.trim().length >= 3 ? "text-slate-900 dark:text-white font-medium" : "text-slate-400"}>
              Title
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            {flyerFile || flyerPreview || coverImage ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
            )}
            <span className={flyerFile || flyerPreview || coverImage ? "text-slate-900 dark:text-white font-medium" : "text-slate-400"}>
              Flyer Poster
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            {description.trim().length >= 10 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
            )}
            <span className={description.trim().length >= 10 ? "text-slate-900 dark:text-white font-medium" : "text-slate-400"}>
              Description
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            {typeof feeAmount === "number" && !isNaN(feeAmount) && feeAmount >= 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
            )}
            <span className={typeof feeAmount === "number" && feeAmount >= 0 ? "text-slate-900 dark:text-white font-medium" : "text-slate-400"}>
              Fee ({feeAmount === 0 ? "Free" : `₹${feeAmount}`})
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            {registrationUrl.trim() && (registrationUrl.startsWith("https://") || registrationUrl.startsWith("http://")) ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
            )}
            <span className={registrationUrl.trim() ? "text-slate-900 dark:text-white font-medium" : "text-slate-400"}>
              Platform Link
            </span>
          </div>
        </div>
      </div>

      {/* 1. Basic Information */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
          1. Basic Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Title */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Activity Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Embedded Systems & IoT Rapid Prototyping with ESP32"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          {/* Slug */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              URL Slug *
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 text-slate-400 text-xs font-mono min-h-[44px] flex items-center">
                /fole-works/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Activity Type Label *
            </label>
            <input
              type="text"
              required
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              placeholder="e.g. Hands-on Workshop, 8-Week Internship"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          {/* Delivery Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Delivery Format *
            </label>
            <select
              value={deliveryMode}
              onChange={(e) => setDeliveryMode(e.target.value as WorksDeliveryMode)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            >
              <option value="in_person">In-Person (Campus Lab / Venue)</option>
              <option value="online">Online (Virtual Stream / Meeting)</option>
              <option value="hybrid">Hybrid (Campus + Remote)</option>
            </select>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Venue / Meeting Instructions
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. IoT Lab, CEV or Google Meet"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          {/* Short Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Short Description (Card Summary)
            </label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="1-2 sentences summarizing the activity for catalogue cards..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Full Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Description *
            </label>
            <textarea
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed syllabus, prerequisites, schedule breakdown, and instructions..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Activity Flyer / Poster Upload */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
              2. Activity Flyer / Poster *
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload the official workshop or project banner (JPEG, PNG, WebP up to 10MB). Required for publication.
            </p>
          </div>
          {flyerPreview && (
            <button
              type="button"
              onClick={handleRemoveFlyer}
              className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>

        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Dropzone & Preview Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* File Picker / Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 min-h-[220px]",
              isDragging
                ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20"
                : "border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/40"
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelection(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {flyerPreview ? "Click to Replace Flyer Image" : "Click or Drag & Drop Activity Flyer"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                JPEG, PNG, or WebP • Max size 10MB
              </p>
            </div>
            {flyerFile && (
              <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Selected: {flyerFile.name} ({(flyerFile.size / 1024).toFixed(0)} KB)
              </span>
            )}
          </div>

          {/* Flyer Live Preview Box */}
          <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-[220px]">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>Flyer Preview</span>
              </span>
              <span>16:9 / 16:10 Ratio</span>
            </div>

            {flyerPreview ? (
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700/80">
                <img
                  src={flyerPreview}
                  alt="Activity flyer preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full aspect-[16/10] rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 gap-2">
                <ImageIcon className="w-8 h-8 stroke-1" />
                <span className="text-xs font-medium">No flyer selected yet</span>
              </div>
            )}

            {/* Direct URL Accordion */}
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-slate-500 hover:text-emerald-500 transition-colors underline"
              >
                {showUrlInput ? "Hide image URL input" : "Or link existing image URL"}
              </button>
            </div>

            {showUrlInput && (
              <div className="pt-2">
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => {
                    setCoverImage(e.target.value);
                    if (!flyerFile) setFlyerPreview(e.target.value || null);
                  }}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Schedule, Platform Link & Registration Fee */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
          3. Platform Link, Fees & Schedule
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Registration Platform Link (Field E) */}
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Activity Platform / Registration Link *
              </label>
              {registrationUrl.trim() && (
                <button
                  type="button"
                  onClick={handleVerifyLink}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Verify Link</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="url"
                value={registrationUrl}
                onChange={(e) => setRegistrationUrl(e.target.value)}
                placeholder="https://forms.gle/... or https://meet.google.com/... or event page URL"
                className="w-full pl-3.5 pr-24 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              />
              <button
                type="button"
                onClick={handleVerifyLink}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1"
                title="Test destination URL in a new tab"
              >
                <span>Test</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Visitors clicking the public activity card, flyer, title, or button will directly open this platform link in a new tab. Must use https://.
            </p>
          </div>

          {/* Registration Fee & Currency (Field D) */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Registration Fee * (Enter 0 for Free Activities)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <div className="flex items-center">
                  <span className="px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs font-mono min-h-[44px] flex items-center">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={feeAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setFeeAmount(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    placeholder="0"
                    className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  placeholder="INR"
                  maxLength={5}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>
            </div>

            {/* Live Fee Display Pill */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400">Card Display Preview:</span>
              <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {feeAmount === 0 ? "Free / ₹0" : `₹${feeAmount} ${currency}`}
              </span>
            </div>
          </div>

          {/* Seat Capacity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Seat Capacity
            </label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Leave empty for unlimited"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          {/* Registration Opens */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Registration Opens At (Optional)
            </label>
            <input
              type="datetime-local"
              value={registrationOpensAt}
              onChange={(e) => setRegistrationOpensAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          {/* Registration Deadline */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Registration Deadline / Closes At
            </label>
            <input
              type="datetime-local"
              value={registrationClosesAt}
              onChange={(e) => setRegistrationClosesAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Timezone
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Asia/Kolkata"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          {/* Featured checkbox */}
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
            />
            <label htmlFor="isFeatured" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              Pin to Top (Featured Activity)
            </label>
          </div>
        </div>
      </div>

      {/* 4. Learning Outcomes */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
            4. Learning Outcomes & Skills
          </h2>
          <button
            type="button"
            onClick={handleAddOutcome}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {outcomes.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 w-5 text-right">{idx + 1}.</span>
              <input
                type="text"
                value={item}
                onChange={(e) => handleOutcomeChange(idx, e.target.value)}
                placeholder="e.g. Master FreeRTOS dual-core multitasking on ESP32"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
              />
              {outcomes.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOutcome(idx)}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  aria-label="Remove outcome"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Organization, Contact & Publication Status */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
          5. Organization & Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Organizer / Host Details
            </label>
            <input
              type="text"
              value={organizerDetails}
              onChange={(e) => setOrganizerDetails(e.target.value)}
              placeholder="e.g. FOLE CEV in collaboration with Dept. of ECE, CEV"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Contact Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="folecev@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Contact Phone (Optional)
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 ..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Publication Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as WorksActivityStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            >
              <option value="draft">Draft (Private)</option>
              <option value="published">Published (Live on Website)</option>
              <option value="archived">Archived (Historical Record)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Footer Submission Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/admin/dashboard/works/activities"
          className="px-5 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] flex items-center"
        >
          Cancel
        </Link>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSubmit("draft")}
          className="px-5 py-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors min-h-[44px]"
        >
          Save Draft
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSubmit("published")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-xs min-h-[44px]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isEdit ? "Save & Publish" : "Publish Activity"}</span>
        </button>
      </div>
    </form>
  );
}
