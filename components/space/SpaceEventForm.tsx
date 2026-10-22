"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SpaceEvent } from "@/lib/space/types";
import { FlyerDisplay } from "@/components/space/FlyerDisplay";
import { formatUtcToIstInput, parseIstInputToUtcIso } from "@/lib/space/time";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";

interface SpaceEventFormProps {
  initialEvent?: SpaceEvent;
  mode: "create" | "edit";
}

export function SpaceEventForm({ initialEvent, mode }: SpaceEventFormProps) {
  const router = useRouter();

  // If initialEvent has an id or an event was successfully created during this session, track it here
  const [savedEventId, setSavedEventId] = useState<string | null>(initialEvent?.id || null);

  const [title, setTitle] = useState(initialEvent?.title || "");
  const [slug, setSlug] = useState(initialEvent?.slug || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [category, setCategory] = useState(initialEvent?.category || "Workshop");
  const [startsAt, setStartsAt] = useState(formatUtcToIstInput(initialEvent?.starts_at));
  const [endsAt, setEndsAt] = useState(formatUtcToIstInput(initialEvent?.ends_at));
  const [capacity, setCapacity] = useState(initialEvent?.capacity || 20);
  const [blocksOpenSpace, setBlocksOpenSpace] = useState(
    initialEvent?.blocks_open_space ?? true
  );

  // Flyer State
  const [flyerPath, setFlyerPath] = useState(initialEvent?.flyer_path || "");
  const [flyerMime, setFlyerMime] = useState(initialEvent?.flyer_mime || "");
  const [flyerWidth, setFlyerWidth] = useState<number | null>(initialEvent?.flyer_width || null);
  const [flyerHeight, setFlyerHeight] = useState<number | null>(initialEvent?.flyer_height || null);
  const [flyerBytes, setFlyerBytes] = useState<number | null>(initialEvent?.flyer_bytes || null);
  const [flyerPreviewUrl, setFlyerPreviewUrl] = useState<string>(
    initialEvent?.slug && initialEvent?.flyer_path
      ? `/api/space/events/${initialEvent.slug}/flyer`
      : ""
  );

  const [uploadingFlyer, setUploadingFlyer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Helper to clear specific field error on user interaction
  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  // Auto-generate slug when title changes in create mode
  const handleTitleChange = (val: string) => {
    setTitle(val);
    clearFieldError("title");
    if (mode === "create" && !savedEventId && (!slug || slug === autoSlugify(title))) {
      setSlug(autoSlugify(val));
      clearFieldError("slug");
    }
  };

  const autoSlugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Direct Flyer Upload Flow
  const handleFlyerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size <= 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Flyer exceeds 10MB maximum size limit.");
      return;
    }

    // Check raster MIME
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type.toLowerCase())) {
      setErrorMessage("Only PNG, JPEG, and WebP raster images are permitted. SVG is not allowed.");
      return;
    }

    setUploadingFlyer(true);
    setErrorMessage(null);

    try {
      const activeEventId = savedEventId || initialEvent?.id;

      // 1. Request Signed Upload URL
      const signRes = await fetch("/api/space/organizer/flyer/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          event_id: activeEventId,
        }),
      });

      const signData = await signRes.json();
      if (!signRes.ok) {
        throw new Error(signData.error || "Failed to authorize upload.");
      }

      // 2. Direct Upload byte-for-byte to Supabase Storage
      const uploadRes = await fetch(signData.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Direct storage upload failed.");
      }

      // 3. Finalize on Server to verify magic bytes and extract natural dimensions
      const finalizeRes = await fetch("/api/space/organizer/flyer/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storage_path: signData.storagePath,
          event_id: activeEventId,
        }),
      });

      const finalizeData = await finalizeRes.json();
      if (!finalizeRes.ok) {
        throw new Error(finalizeData.error || "Flyer validation failed.");
      }

      const verified = finalizeData.flyer;
      setFlyerPath(verified.flyer_path);
      setFlyerMime(verified.flyer_mime);
      setFlyerWidth(verified.flyer_width);
      setFlyerHeight(verified.flyer_height);
      setFlyerBytes(verified.flyer_bytes);

      // Clear any previous flyer validation errors
      clearFieldError("flyer_path");
      clearFieldError("flyer_mime");

      // Local preview from file for instantaneous display
      setFlyerPreviewUrl(URL.createObjectURL(file));
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[SpaceEventForm] Flyer upload error:", err);
      }
      setErrorMessage(err?.message || "Failed to upload flyer.");
    } finally {
      setUploadingFlyer(false);
    }
  };

  const validateClientInputs = (): { isValid: boolean; payload?: any } => {
    const errors: Record<string, string[]> = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = ["Title is required."];
    } else if (trimmedTitle.length < 3) {
      errors.title = ["Title must be at least 3 characters."];
    } else if (trimmedTitle.length > 100) {
      errors.title = ["Title cannot exceed 100 characters."];
    }

    const trimmedSlug = slug.trim();
    if (!trimmedSlug) {
      errors.slug = ["Slug is required."];
    } else if (trimmedSlug.length < 3) {
      errors.slug = ["Slug must be at least 3 characters."];
    } else if (trimmedSlug.length > 80) {
      errors.slug = ["Slug cannot exceed 80 characters."];
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug)) {
      errors.slug = ["Slug must contain only lowercase letters, numbers, and hyphens."];
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      errors.description = ["Description is required."];
    } else if (trimmedDescription.length < 10) {
      errors.description = ["Description must be at least 10 characters."];
    } else if (trimmedDescription.length > 5000) {
      errors.description = ["Description cannot exceed 5000 characters."];
    }

    const trimmedCategory = category.trim();
    if (!trimmedCategory || trimmedCategory.length < 2) {
      errors.category = ["Please select or enter a valid category."];
    }

    const capNum = Number(capacity);
    if (isNaN(capNum) || !Number.isInteger(capNum) || capNum < 1) {
      errors.capacity = ["Capacity must be at least 1."];
    } else if (capNum > 1000) {
      errors.capacity = ["Capacity cannot exceed 1000."];
    }

    const startsAtUtcIso = parseIstInputToUtcIso(startsAt);
    if (!startsAt || !startsAtUtcIso) {
      errors.starts_at = ["Please select a valid start date and time (IST)."];
    }

    const endsAtUtcIso = parseIstInputToUtcIso(endsAt);
    if (!endsAt || !endsAtUtcIso) {
      errors.ends_at = ["Please select a valid end date and time (IST)."];
    }

    if (startsAtUtcIso && endsAtUtcIso) {
      if (new Date(endsAtUtcIso).getTime() <= new Date(startsAtUtcIso).getTime()) {
        errors.ends_at = ["Event end time must be after the start time."];
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage("Please correct the highlighted fields before submitting.");
      return { isValid: false };
    }

    setFieldErrors({});

    const payload = {
      title: trimmedTitle,
      slug: trimmedSlug,
      description: trimmedDescription,
      category: trimmedCategory,
      starts_at: startsAtUtcIso!,
      ends_at: endsAtUtcIso!,
      capacity: capNum,
      blocks_open_space: blocksOpenSpace,
      flyer_path: flyerPath ? flyerPath : null,
      flyer_mime: flyerMime ? flyerMime : null,
      flyer_width: flyerWidth ?? null,
      flyer_height: flyerHeight ?? null,
      flyer_bytes: flyerBytes ?? null,
    };

    return { isValid: true, payload };
  };

  const handleSubmit = async (publishImmediate = false) => {
    if (saving || uploadingFlyer) return;

    setSaving(true);
    setErrorMessage(null);

    // 1. Client-side pre-validation
    const validation = validateClientInputs();
    if (!validation.isValid || !validation.payload) {
      setSaving(false);
      return;
    }

    const payload = validation.payload;

    try {
      const activeEventId = savedEventId || initialEvent?.id;
      const isEdit = mode === "edit" || Boolean(activeEventId);

      const endpoint = isEdit
        ? `/api/space/organizer/events/${activeEventId}`
        : `/api/space/organizer/events`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      }

      if (!res.ok) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[SpaceEventForm] Server validation / update error:", {
            status: res.status,
            error: data?.error,
            details: data?.details,
          });
        }

        if (data?.details && typeof data.details === "object" && Object.keys(data.details).length > 0) {
          setFieldErrors(data.details);
          setErrorMessage("Please correct the validation errors highlighted below.");
        } else {
          setErrorMessage(data?.error || `Failed to save event (HTTP ${res.status}).`);
        }
        return;
      }

      // Event was saved successfully
      const createdOrUpdatedId = data?.event?.id || activeEventId;
      if (createdOrUpdatedId) {
        setSavedEventId(createdOrUpdatedId);
      }

      // 2. Publish step if "Save & Publish" was clicked
      if (publishImmediate && createdOrUpdatedId) {
        const pubRes = await fetch(`/api/space/organizer/events/${createdOrUpdatedId}/publish`, {
          method: "POST",
        });

        let pubData: any = null;
        if (pubRes.headers.get("content-type")?.includes("application/json")) {
          try {
            pubData = await pubRes.json();
          } catch {
            pubData = null;
          }
        }

        if (!pubRes.ok) {
          if (process.env.NODE_ENV !== "production") {
            console.error("[SpaceEventForm] Publish error:", {
              status: pubRes.status,
              error: pubData?.error,
            });
          }
          setErrorMessage(
            `Event was saved as a draft, but publishing to the calendar failed: ${
              pubData?.error || pubRes.statusText || "Server error"
            }. You can retry publishing below.`
          );
          return;
        }
      }

      // Successful operation — redirect to organizer dashboard
      router.push("/fole-space/organizer");
      router.refresh();
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[SpaceEventForm] Unexpected submission error:", err);
      }
      setErrorMessage(err?.message || "An unexpected error occurred while saving the event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <span className="font-bold">Error: </span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Embedded Rust Workshop & Sensors"
              className={`w-full px-4 py-2.5 rounded-xl border ${
                fieldErrors.title
                  ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500"
              } bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2`}
            />
            {fieldErrors.title && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.title.join(", ")}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              URL Slug *
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                clearFieldError("slug");
              }}
              placeholder="embedded-rust-workshop"
              className={`w-full px-4 py-2.5 rounded-xl border ${
                fieldErrors.slug
                  ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500"
              } bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-hidden focus:ring-2`}
            />
            {fieldErrors.slug && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.slug.join(", ")}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  clearFieldError("category");
                }}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  fieldErrors.category
                    ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                    : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500"
                } bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2`}
              >
                <option value="Workshop">Workshop</option>
                <option value="Study Jam">Study Jam</option>
                <option value="Hack Sprint">Hack Sprint</option>
                <option value="Discussion">Discussion</option>
                <option value="Talk">Talk</option>
              </select>
              {fieldErrors.category && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.category.join(", ")}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Capacity (Seats) *
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                required
                value={capacity}
                onChange={(e) => {
                  setCapacity(Number(e.target.value));
                  clearFieldError("capacity");
                }}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  fieldErrors.capacity
                    ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                    : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500"
                } bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2`}
              />
              {fieldErrors.capacity && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.capacity.join(", ")}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Starts At (IST) *
              </label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => {
                  setStartsAt(e.target.value);
                  clearFieldError("starts_at");
                }}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  fieldErrors.starts_at
                    ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                    : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500"
                } bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2`}
              />
              {fieldErrors.starts_at && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.starts_at.join(", ")}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Ends At (IST) *
              </label>
              <input
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => {
                  setEndsAt(e.target.value);
                  clearFieldError("ends_at");
                }}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  fieldErrors.ends_at
                    ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                    : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500"
                } bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2`}
              />
              {fieldErrors.ends_at && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.ends_at.join(", ")}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Description & Prerequisites *
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearFieldError("description");
              }}
              placeholder="Outline what participants will learn, what they should bring (laptops, microcontrollers), and the session flow."
              className={`w-full px-4 py-2.5 rounded-xl border ${
                fieldErrors.description
                  ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500"
              } bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm leading-relaxed focus:outline-hidden focus:ring-2`}
            />
            {fieldErrors.description && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.description.join(", ")}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="blocksSpace"
              checked={blocksOpenSpace}
              onChange={(e) => setBlocksOpenSpace(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <label htmlFor="blocksSpace" className="text-xs text-slate-600 dark:text-slate-300">
              <strong>Reserve physical space exclusively:</strong> Temporarily halts open walk-in check-in during this session.
            </label>
          </div>
        </div>

        {/* Right Column: Direct Flyer Upload & Live Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Event Poster (Original Ratio)
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Upload JPEG, PNG, or WebP (max 10MB). The uploaded file is preserved byte-for-byte and displayed in its full natural aspect ratio without cropping.
            </p>

            {flyerPreviewUrl ? (
              <div className="space-y-3">
                <FlyerDisplay
                  src={flyerPreviewUrl}
                  alt={title || "Flyer Preview"}
                  width={flyerWidth}
                  height={flyerHeight}
                />

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>
                    {flyerWidth && flyerHeight ? `${flyerWidth} × ${flyerHeight} px` : "Uploaded"}
                  </span>
                  <span>{flyerBytes ? `${(flyerBytes / 1024 / 1024).toFixed(2)} MB` : ""}</span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/30">
                <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-2 stroke-1" />
                <span className="text-xs text-slate-400 block mb-3">No poster uploaded yet</span>
              </div>
            )}

            <div>
              <label className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-xs">
                <UploadCloud className="w-4 h-4 text-emerald-600" />
                <span>{uploadingFlyer ? "Verifying & Preserving..." : "Upload Original Flyer"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploadingFlyer || saving}
                  onChange={handleFlyerFileChange}
                  className="sr-only"
                />
              </label>
            </div>

            {(fieldErrors.flyer_path || fieldErrors.flyer_mime) && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{(fieldErrors.flyer_path || fieldErrors.flyer_mime)?.join(", ")}</span>
              </p>
            )}
          </div>

          {/* Submission Action Buttons */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <button
              type="button"
              disabled={saving || uploadingFlyer}
              onClick={() => handleSubmit(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save & Publish to Calendar"}</span>
            </button>

            <button
              type="button"
              disabled={saving || uploadingFlyer}
              onClick={() => handleSubmit(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors disabled:opacity-50"
            >
              <span>{saving ? "Saving..." : "Save as Draft"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
