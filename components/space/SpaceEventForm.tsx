"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SpaceEvent } from "@/lib/space/types";
import { FlyerDisplay } from "@/components/space/FlyerDisplay";
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

  const [title, setTitle] = useState(initialEvent?.title || "");
  const [slug, setSlug] = useState(initialEvent?.slug || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [category, setCategory] = useState(initialEvent?.category || "Workshop");
  const [startsAt, setStartsAt] = useState(
    initialEvent?.starts_at ? new Date(initialEvent.starts_at).toISOString().slice(0, 16) : ""
  );
  const [endsAt, setEndsAt] = useState(
    initialEvent?.ends_at ? new Date(initialEvent.ends_at).toISOString().slice(0, 16) : ""
  );
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

  // Auto-generate slug when title changes in create mode
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (mode === "create" && (!slug || slug === autoSlugify(title))) {
      setSlug(autoSlugify(val));
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
      // 1. Request Signed Upload URL
      const signRes = await fetch("/api/space/organizer/flyer/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          event_id: initialEvent?.id,
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
          event_id: initialEvent?.id,
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

      // Local preview from file for instantaneous display
      setFlyerPreviewUrl(URL.createObjectURL(file));
    } catch (err: any) {
      console.error("Flyer upload error:", err);
      setErrorMessage(err?.message || "Failed to upload flyer.");
    } finally {
      setUploadingFlyer(false);
    }
  };

  const handleSubmit = async (publishImmediate = false) => {
    setSaving(true);
    setErrorMessage(null);

    const payload = {
      title,
      slug,
      description,
      category,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      capacity: Number(capacity),
      blocks_open_space: blocksOpenSpace,
      flyer_path: flyerPath || undefined,
      flyer_mime: flyerMime || undefined,
      flyer_width: flyerWidth || undefined,
      flyer_height: flyerHeight || undefined,
      flyer_bytes: flyerBytes || undefined,
    };

    try {
      let eventId = initialEvent?.id;

      if (mode === "create") {
        const res = await fetch("/api/space/organizer/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create event.");
        eventId = data.event.id;
      } else {
        const res = await fetch(`/api/space/organizer/events/${initialEvent?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update event.");
      }

      if (publishImmediate && eventId) {
        const pubRes = await fetch(`/api/space/organizer/events/${eventId}/publish`, {
          method: "POST",
        });
        const pubData = await pubRes.json();
        if (!pubRes.ok) throw new Error(pubData.error || "Failed to publish event.");
      }

      router.push("/fole-space/organizer");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err?.message || "Submission failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              URL Slug *
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="embedded-rust-workshop"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Workshop">Workshop</option>
                <option value="Study Jam">Study Jam</option>
                <option value="Hack Sprint">Hack Sprint</option>
                <option value="Discussion">Discussion</option>
                <option value="Talk">Talk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Capacity (Seats) *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
              </input>
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
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Ends At (IST) *
              </label>
              <input
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
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
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline what participants will learn, what they should bring (laptops, microcontrollers), and the session flow."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
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
                  disabled={uploadingFlyer}
                  onChange={handleFlyerFileChange}
                  className="sr-only"
                />
              </label>
            </div>
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
              <span>Save as Draft</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
