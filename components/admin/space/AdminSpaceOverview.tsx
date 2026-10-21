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
      if (statusRes.ok) {
        setStatus(await statusRes.json());
      } else if (statusRes.status === 503) {
        const sErr = await statusRes.json().catch(() => null);
        setStatus((prev) => ({
          ...prev,
          configured: false,
          error: sErr?.error,
        }));
      }
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
    if (status.configured === false) {
      setActionMessage({
        type: "error",
        text: "FOLE SPACE database is not set up. Run migration 011.",
      });
      return;
    }

    const currentOpen = Boolean(status.is_open ?? status.isOpen);
    const nextState = !currentOpen;
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
        if (res.status === 503 || data.code === "FOLE_SPACE_DATABASE_NOT_CONFIGURED") {
          setStatus((prev) => ({ ...prev, configured: false }));
        }
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
    if (status.configured === false) {
      setActionMessage({
        type: "error",
        text: "FOLE SPACE database is not set up. Run migration 011.",
      });
      return;
    }

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
      {/* Missing Schema / Database Setup Required Banner */}
      {status.configured === false && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                FOLE SPACE database is not set up. Run migration 011.
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Database tables and RPC functions for FOLE SPACE were not found in the PostgreSQL schema.
                Run <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900">supabase/migrations/011_fole_space_setup.sql</code> in your Supabase SQL Editor.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={refreshData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      )}

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
                  (status.is_open ?? status.isOpen) && status.configured !== false ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {(status.is_open ?? status.isOpen) && status.configured !== false ? "SPACE OPEN" : "CLOSED"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleMasterOpen}
            disabled={loadingAction === "toggle-open" || status.configured === false}
            title={status.configured === false ? "Database setup required before switching space on" : undefined}
            className={`mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              status.configured === false
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : (status.is_open ?? status.isOpen)
                ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{(status.is_open ?? status.isOpen) && status.configured !== false ? "Close Space Now" : "Open Space"}</span>
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
          <SpaceStatusChip state={status.state || status.availabilityState || "unavailable"} size="sm" />
          <p className="text-xs text-slate-500 mt-2">
            {(status.state || status.availabilityState) === "available"
              ? "Students can walk in and check in."
              : (status.state || status.availabilityState) === "occupied"
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
