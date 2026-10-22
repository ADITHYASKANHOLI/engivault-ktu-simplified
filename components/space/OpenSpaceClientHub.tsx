"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SpaceStatusResponse, SpaceSession } from "@/lib/space/types";
import { SpaceStatusChip } from "@/components/space/SpaceStatusChip";
import { OpenSpaceCountdown } from "@/components/space/OpenSpaceCountdown";
import { formatDateTimeIST } from "@/lib/space/time";
import {
  DoorOpen,
  LogOut,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  Calendar,
  LogIn,
} from "lucide-react";

interface OpenSpaceClientHubProps {
  initialStatus: SpaceStatusResponse;
  initialSession: SpaceSession | null;
  isAuthenticated: boolean;
  studentName?: string;
}

export function OpenSpaceClientHub({
  initialStatus,
  initialSession,
  isAuthenticated,
  studentName,
}: OpenSpaceClientHubProps) {
  const [status, setStatus] = useState<SpaceStatusResponse>(initialStatus);
  const [activeSession, setActiveSession] = useState<SpaceSession | null>(initialSession);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll status every 20 seconds, pausing when tab is hidden
  const refreshStatus = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/space/status", { cache: "no-store" });
      if (res.ok) {
        const freshStatus = await res.json();
        setStatus(freshStatus);
      } else if (res.status === 503) {
        const errorData = await res.json().catch(() => null);
        setStatus((prev) => ({
          ...prev,
          configured: false,
          error: errorData?.error || "FOLE SPACE database is not set up. Run migration 011.",
        }));
      }
    } catch (err) {
      console.warn("Status refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshStatus();
        interval = setInterval(refreshStatus, 20000);
      } else {
        clearInterval(interval);
      }
    };

    interval = setInterval(refreshStatus, 20000);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshStatus]);

  // Handle Guest Login Dialog Trigger
  const handleOpenLogin = () => {
    window.dispatchEvent(
      new CustomEvent("fole:open-login", {
        detail: { returnTo: "/fole-space/open" },
      })
    );
  };

  // Check in
  const handleCheckin = async () => {
    if (status.configured === false) {
      setActionError("FOLE SPACE database is not set up. Run migration 011.");
      return;
    }

    if (!isAuthenticated) {
      handleOpenLogin();
      return;
    }

    setLoadingAction("checkin");
    setActionError(null);

    try {
      const res = await fetch("/api/space/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "Check-in failed.");
        return;
      }

      setActiveSession(data.session);
      await refreshStatus();
    } catch (err: any) {
      setActionError("Network error. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  // Check out
  const handleCheckout = async () => {
    if (!activeSession) return;
    setLoadingAction("checkout");
    setActionError(null);

    try {
      const res = await fetch("/api/space/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: activeSession.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "Check-out failed.");
        return;
      }

      setActiveSession(null);
      await refreshStatus();
    } catch (err) {
      setActionError("Failed to check out. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  // Extend
  const handleExtend = async () => {
    if (!activeSession) return;
    setLoadingAction("extend");
    setActionError(null);

    try {
      const res = await fetch("/api/space/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: activeSession.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "Extension failed.");
        return;
      }

      setActiveSession(data.session);
      await refreshStatus();
    } catch (err) {
      setActionError("Unable to extend session. Please check capacity.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header bar with live status chip and manual refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Open Space Hub
            </h1>
            {isRefreshing && (
              <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
            )}
          </div>
          <p className="text-xs text-slate-500">
            Real-time walk-in availability and study session manager
          </p>
        </div>

        <SpaceStatusChip
          state={status.state || status.availabilityState || "unavailable"}
          occupancy={status.occupancy}
          capacity={status.capacity}
          size="md"
        />
      </div>

      {actionError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Notice: </span>
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Interaction Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        {activeSession ? (
          /* ACTIVE SESSION VIEW */
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Current Study Pass
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                You are Checked In
              </h2>
              {studentName && (
                <p className="text-xs text-slate-500 mt-0.5">Attendee: {studentName}</p>
              )}
            </div>

            <OpenSpaceCountdown
              expiresAt={activeSession.expires_at}
              serverNow={status.server_now || status.serverNow || new Date().toISOString()}
              onExpire={() => {
                refreshStatus();
              }}
            />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loadingAction === "checkout"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-xs transition-colors min-h-[44px] disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>
                  {loadingAction === "checkout" ? "Checking Out..." : "Check Out Early"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExtend}
                disabled={loadingAction === "extend"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-sm font-bold transition-colors min-h-[44px] disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {loadingAction === "extend" ? "Extending..." : "Extend Session"}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* NOT CHECKED IN VIEW */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <DoorOpen className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Walk-in Open Space
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
              Check in to claim an open desk for a 30-minute study or collaborative building session.
            </p>

            {/* Checkin Action Buttons */}
            {status.configured === false ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 max-w-md mx-auto text-amber-900 dark:text-amber-200 text-sm">
                <div className="font-bold flex items-center justify-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Space Setup In Progress</span>
                </div>
                <span>
                  {status.error || "FOLE SPACE database is not set up. Run migration 011."}
                </span>
              </div>
            ) : !isAuthenticated ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleOpenLogin}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-all min-h-[48px]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log in with Student Account to Check In</span>
                </button>
                <p className="text-xs text-slate-400">
                  Guest visitors can view availability freely. An active account is required to check in.
                </p>
              </div>
            ) : (status.state === "available" || status.availabilityState === "available") ? (
              <button
                type="button"
                onClick={handleCheckin}
                disabled={loadingAction === "checkin"}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-base font-bold shadow-md transition-all min-h-[48px] disabled:opacity-50"
              >
                <DoorOpen className="w-5 h-5" />
                <span>
                  {loadingAction === "checkin" ? "Checking in..." : "Check In for 30 Minutes"}
                </span>
              </button>
            ) : (status.state === "occupied" || status.availabilityState === "occupied") ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 max-w-md mx-auto text-amber-900 dark:text-amber-200 text-sm">
                <div className="font-bold flex items-center justify-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Space at Full Capacity</span>
                </div>
                <span>
                  All {status.capacity} seats are currently occupied. Please check back when active sessions complete.
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-slate-700 dark:text-slate-300 text-sm">
                <div className="font-bold flex items-center justify-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Space Currently Unavailable</span>
                </div>
                <span>
                  The space is either outside scheduled operating hours, reserved for a scheduled workshop, or closed by administrator.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upcoming Event Conflict Notice */}
      {(status.next_event || status.nextBlockingEvent) && (
        <div className="mt-8 p-5 bg-cyan-50/80 dark:bg-cyan-950/40 rounded-2xl border border-cyan-200 dark:border-cyan-900 flex items-start gap-3">
          <Calendar className="w-5 h-5 text-cyan-700 dark:text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-cyan-900 dark:text-cyan-200">
            <span className="font-bold block text-sm mb-0.5">
              Scheduled Event Approaching: {(status.next_event || status.nextBlockingEvent)?.title}
            </span>
            <span>
              Starts at {formatDateTimeIST((status.next_event || status.nextBlockingEvent)!.starts_at)}. Walk-in sessions automatically adjust so as not to overlap with reserved workshops.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
