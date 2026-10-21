"use client";

import React, { useState } from "react";
import { SpaceStatusResponse, SpaceSession, SpaceEvent } from "@/lib/space/types";
import { SpaceStatusChip } from "@/components/space/SpaceStatusChip";
import { formatDateTimeIST } from "@/lib/space/time";
import {
  Power,
  Users,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface AdminSpaceOverviewProps {
  initialStatus: SpaceStatusResponse;
  initialSessions: SpaceSession[];
  todayEvents: SpaceEvent[];
}

export function AdminSpaceOverview({
  initialStatus,
  initialSessions,
  todayEvents,
}: AdminSpaceOverviewProps) {
  const [status, setStatus] = useState<SpaceStatusResponse>(initialStatus);
  const [sessions, setSessions] = useState<SpaceSession[]>(initialSessions);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const refreshData = async () => {
    try {
      const [statusRes, sessionsRes] = await Promise.all([
        fetch("/api/space/status"),
        fetch("/api/admin/space/sessions"),
      ]);
      if (statusRes.ok) setStatus(await statusRes.json());
      if (sessionsRes.ok) {
        const sData = await sessionsRes.json();
        setSessions(sData.sessions);
      }
    } catch (err) {
      console.warn("Refresh failed:", err);
    }
  };

  // Toggle master open/close switch
  const handleToggleMasterOpen = async () => {
    const nextState = !status.isOpen;
    setLoadingAction("toggle-open");
    setActionMessage(null);

    try {
      const res = await fetch("/api/admin/space/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_open: nextState }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: "error", text: data.error || "Failed to update switch." });
      } else {
        setActionMessage({
          type: "success",
          text: `FOLE SPACE is now ${nextState ? "OPEN" : "CLOSED"}.`,
        });
        await refreshData();
      }
    } catch (err) {
      setActionMessage({ type: "error", text: "Network error updating master switch." });
    } finally {
      setLoadingAction(null);
    }
  };

  // Force check-out session
  const handleForceCheckout = async (sessionId: string) => {
    if (!window.confirm("Force check-out this student session immediately?")) return;

    setLoadingAction(`checkout-${sessionId}`);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/space/sessions/${sessionId}/force-checkout`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: "error", text: data.error || "Failed to force check-out." });
      } else {
        setActionMessage({ type: "success", text: "Session forced to check out." });
        await refreshData();
      }
    } catch (err) {
      setActionMessage({ type: "error", text: "Network error." });
    } finally {
      setLoadingAction(null);
    }
  };

  const activeSessions = sessions.filter(
    (s) => s.status === "active" && !s.checked_out_at && new Date(s.expires_at) > new Date()
  );

  return (
    <div className="space-y-8">
      {/* Action Notification */}
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
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
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

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Master Open Switch Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Master Switch
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-black ${
                  status.isOpen ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {status.isOpen ? "SPACE OPEN" : "CLOSED"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleMasterOpen}
            disabled={loadingAction === "toggle-open"}
            className={`mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              status.isOpen
                ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{status.isOpen ? "Close Space Now" : "Open Space"}</span>
          </button>
        </div>

        {/* Live Occupancy */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Current Occupancy
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{status.occupancy}</span>
            <span className="text-sm text-slate-500 font-semibold">/ {status.capacity} seats</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${
                status.occupancy >= status.capacity ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{
                width: `${Math.min(100, Math.round((status.occupancy / status.capacity) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Operational State */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Availability State
          </span>
          <SpaceStatusChip state={status.availabilityState} size="sm" />
          <p className="text-xs text-slate-500 mt-2">
            {status.availabilityState === "available"
              ? "Students can walk in and check in."
              : status.availabilityState === "occupied"
              ? "All seats taken."
              : "Walk-ins rejected."}
          </p>
        </div>

        {/* Scheduled Sessions Today */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Workshops Today
          </span>
          <div className="text-3xl font-black text-slate-900">{todayEvents.length}</div>
          <p className="text-xs text-slate-500 mt-2">
            {todayEvents.length === 0 ? "No blocking events" : "Scheduled workshops on calendar"}
          </p>
        </div>
      </div>

      {/* Active Walk-in Sessions with Force Check-Out */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Active Walk-in Sessions ({activeSessions.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={refreshData}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800"
            title="Refresh sessions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
          {activeSessions.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              No students currently checked in to Open Space.
            </div>
          ) : (
            activeSessions.map((s) => (
              <div key={s.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span>{s.user?.display_name || "Student"}</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      @{s.user?.username || "unknown"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Started: {formatDateTimeIST(s.started_at)} • Expires: {formatDateTimeIST(s.expires_at)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleForceCheckout(s.id)}
                  disabled={loadingAction === `checkout-${s.id}`}
                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition-colors shadow-xs"
                >
                  Force Check-Out
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
