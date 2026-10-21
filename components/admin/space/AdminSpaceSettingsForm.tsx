"use client";

import React, { useState } from "react";
import { SpaceSettings } from "@/lib/space/types";
import { CheckCircle2, AlertCircle, Save, Sliders } from "lucide-react";

interface AdminSpaceSettingsFormProps {
  initialSettings: SpaceSettings;
}

export function AdminSpaceSettingsForm({ initialSettings }: AdminSpaceSettingsFormProps) {
  const [capacity, setCapacity] = useState(initialSettings.capacity);
  const [sessionMinutes, setSessionMinutes] = useState(initialSettings.session_minutes);
  const [allowExtension, setAllowExtension] = useState(initialSettings.allow_extension);
  const [maxSessionsPerDay, setMaxSessionsPerDay] = useState(initialSettings.max_sessions_per_day);
  const [extensionWindowMinutes, setExtensionWindowMinutes] = useState(
    initialSettings.extension_window_minutes
  );
  const [minSessionMinutes, setMinSessionMinutes] = useState(initialSettings.min_session_minutes);
  const [eventCheckinEarlyMinutes, setEventCheckinEarlyMinutes] = useState(
    initialSettings.event_checkin_early_minutes
  );
  const [eventCheckinGraceMinutes, setEventCheckinGraceMinutes] = useState(
    initialSettings.event_checkin_grace_minutes
  );

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const payload = {
      capacity: Number(capacity),
      session_minutes: Number(sessionMinutes),
      allow_extension: Boolean(allowExtension),
      max_sessions_per_day: Number(maxSessionsPerDay),
      extension_window_minutes: Number(extensionWindowMinutes),
      min_session_minutes: Number(minSessionMinutes),
      event_checkin_early_minutes: Number(eventCheckinEarlyMinutes),
      event_checkin_grace_minutes: Number(eventCheckinGraceMinutes),
    };

    try {
      const res = await fetch("/api/admin/space/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error || "Failed to save settings." });
      } else {
        setStatusMessage({ type: "success", text: "Space settings saved successfully." });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: "Network error saving settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-3xl space-y-8">
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>

          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Capacity & Session Timing */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600" />
          <span>Capacity & Study Session Policies</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Physical Space Capacity (Seats) *
            </label>
            <input
              type="number"
              min="1"
              max="200"
              required
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Maximum concurrent walk-in students.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Standard Session Length (Minutes) *
            </label>
            <input
              type="number"
              min="5"
              max="180"
              required
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default is 30 minutes.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Max Sessions Per Day Per Student *
            </label>
            <input
              type="number"
              min="1"
              max="20"
              required
              value={maxSessionsPerDay}
              onChange={(e) => setMaxSessionsPerDay(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Extension Window (Minutes) *
            </label>
            <input
              type="number"
              min="1"
              max="30"
              required
              value={extensionWindowMinutes}
              onChange={(e) => setExtensionWindowMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Minutes before session expiry extension is unlocked.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Min Useful Session (Minutes) *
            </label>
            <input
              type="number"
              min="5"
              max="30"
              required
              value={minSessionMinutes}
              onChange={(e) => setMinSessionMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Shortest useful session when a blocking event is approaching.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="allowExt"
            checked={allowExtension}
            onChange={(e) => setAllowExtension(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
          />
          <label htmlFor="allowExt" className="text-xs text-slate-700 font-medium">
            Allow students to extend active sessions when seats remain available.
          </label>
        </div>
      </div>

      {/* Event Window Policies */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600" />
          <span>Workshop Check-in Windows</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Early Check-in Window (Minutes) *
            </label>
            <input
              type="number"
              min="0"
              max="120"
              required
              value={eventCheckinEarlyMinutes}
              onChange={(e) => setEventCheckinEarlyMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Allowed check-in before scheduled event start time.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Grace Check-in Window (Minutes) *
            </label>
            <input
              type="number"
              min="0"
              max="120"
              required
              value={eventCheckinGraceMinutes}
              onChange={(e) => setEventCheckinGraceMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Allowed check-in after scheduled event end time.</p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 min-h-[44px]"
      >
        <Save className="w-4 h-4" />
        <span>{saving ? "Saving Changes..." : "Save Space Settings"}</span>
      </button>
    </form>
  );
}
