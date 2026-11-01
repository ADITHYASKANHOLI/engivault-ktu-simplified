"use client";

import React, { useState } from "react";
import { SpaceEvent } from "@/lib/space/types";
import { formatDateTimeIST } from "@/lib/space/time";
import { CalendarCheck, AlertTriangle, Eye, XCircle, Undo2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface AdminEventsModerationProps {
  initialEvents: SpaceEvent[];
}

export function AdminEventsModeration({ initialEvents }: AdminEventsModerationProps) {
  const [events, setEvents] = useState<SpaceEvent[]>(initialEvents);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const refreshEvents = async () => {
    try {
      const res = await fetch("/api/admin/space/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } catch (err) {
      console.warn("Refresh failed:", err);
    }
  };

  const handleModerate = async (eventId: string, action: "unpublish" | "cancel") => {
    const promptText =
      action === "cancel"
        ? "Cancel this event? All active tickets and registrations will be voided."
        : "Revert this event to Draft mode?";
    if (!window.confirm(promptText)) return;

    setLoadingId(`${eventId}-${action}`);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/space/events/${eventId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: "error", text: data.error || "Moderation action failed." });
      } else {
        setActionMessage({ type: "success", text: data.message });
        await refreshEvents();
      }
    } catch (err) {
      setActionMessage({ type: "error", text: "Network error during moderation." });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>

          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            <span>All Registered Events ({events.length})</span>
          </h2>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {events.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No events found in the database.</div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{evt.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                        evt.status === "published"
                          ? "bg-blue-50 text-blue-700"
                          : evt.status === "live"
                          ? "bg-emerald-100 text-emerald-800"
                          : evt.status === "cancelled"
                          ? "bg-red-50 text-red-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>

                  <div className="text-slate-500 text-[11px] flex items-center gap-2 flex-wrap">
                    <span>Host: @{evt.organizer?.username || "unknown"}</span>
                    <span>•</span>
                    <span>{formatDateTimeIST(evt.starts_at)}</span>
                    <span>•</span>
                    <span>Capacity: {evt.capacity}</span>
                    {evt.attendee_count !== undefined && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-emerald-600">
                          {evt.attendee_count} registered
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/fole-space/events/${evt.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </Link>

                  {evt.status === "published" && (
                    <button
                      type="button"
                      onClick={() => handleModerate(evt.id, "unpublish")}
                      disabled={loadingId === `${evt.id}-unpublish`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Unpublish</span>
                    </button>
                  )}

                  {evt.status !== "cancelled" && evt.status !== "completed" && (
                    <button
                      type="button"
                      onClick={() => handleModerate(evt.id, "cancel")}
                      disabled={loadingId === `${evt.id}-cancel`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
