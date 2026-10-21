"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { SpaceEvent, SpaceEventAttendee } from "@/lib/space/types";
import { formatDateTimeIST } from "@/lib/space/time";
import QrScanner from "qr-scanner";
import {
  Camera,
  Search,
  CheckCircle2,
  AlertCircle,
  Undo2,
  Users,
  Radio,
  StopCircle,
} from "lucide-react";

interface CheckinDeskViewProps {
  event: SpaceEvent;
  initialAttendees: SpaceEventAttendee[];
  initialCounts: { registered: number; checkedIn: number };
}

export function CheckinDeskView({
  event: initialEvent,
  initialAttendees,
  initialCounts,
}: CheckinDeskViewProps) {
  const [event, setEvent] = useState<SpaceEvent>(initialEvent);
  const [attendees, setAttendees] = useState<SpaceEventAttendee[]>(initialAttendees);
  const [counts, setCounts] = useState(initialCounts);

  // Scanner State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Scan feedback
  const [scanResult, setScanResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const isScanningBlockedRef = useRef(false);

  // Refresh desk data
  const refreshDesk = useCallback(async () => {
    try {
      const res = await fetch(`/api/space/organizer/events/${event.id}/desk`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data.event);
        setAttendees(data.attendees);
        setCounts(data.counts);
      }
    } catch (err) {
      console.warn("Desk sync failed:", err);
    }
  }, [event.id]);

  // Periodic poll every 8 seconds for live virtual check-ins
  useEffect(() => {
    const interval = setInterval(refreshDesk, 8000);
    return () => clearInterval(interval);
  }, [refreshDesk]);

  // Start Camera QR Scanner
  const startCamera = async () => {
    setCameraError(null);
    if (!videoRef.current) return;

    try {
      if (scannerRef.current) {
        await scannerRef.current.start();
        setCameraActive(true);
        return;
      }

      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          handleScanPayload(result.data);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 4,
        }
      );

      scannerRef.current = qrScanner;
      await qrScanner.start();
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera startup error:", err);
      setCameraActive(false);
      if (err?.name === "NotAllowedError" || err?.message?.includes("Permission")) {
        setCameraError(
          "Camera permission was denied. Please allow camera access in your browser settings or use the participant search below."
        );
      } else {
        setCameraError(
          "Unable to start camera. Camera may be busy or unsupported on this device. Please use the search bar below."
        );
      }
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      setCameraActive(false);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, []);

  // Process Scanned QR Payload
  const handleScanPayload = async (payload: string) => {
    if (isScanningBlockedRef.current) return;
    isScanningBlockedRef.current = true;

    try {
      const res = await fetch(`/api/space/organizer/events/${event.id}/checkin/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_payload: payload }),
      });

      const data = await res.json();

      if (!res.ok) {
        setScanResult({
          type: "error",
          message: data.error || "Scanned ticket could not be validated.",
        });
      } else {
        setScanResult({
          type: "success",
          message: "Check-in Confirmed! Welcome attendee.",
        });
        await refreshDesk();
      }
    } catch (err) {
      setScanResult({
        type: "error",
        message: "Network error processing scan.",
      });
    } finally {
      // Re-enable scanning after 2.5 seconds pause
      setTimeout(() => {
        isScanningBlockedRef.current = false;
        setScanResult(null);
      }, 2500);
    }
  };

  // Manual Check-In
  const handleManualCheckin = async (attendee: SpaceEventAttendee) => {
    setLoadingAction(`manual-${attendee.registration_id}`);
    setScanResult(null);

    try {
      const res = await fetch(`/api/space/organizer/events/${event.id}/checkin/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: attendee.user_id,
          registration_id: attendee.registration_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setScanResult({ type: "error", message: data.error || "Manual check-in failed." });
      } else {
        setScanResult({ type: "success", message: `Marked ${attendee.display_name} present.` });
        await refreshDesk();
      }
    } catch (err) {
      setScanResult({ type: "error", message: "Error performing manual check-in." });
    } finally {
      setLoadingAction(null);
    }
  };

  // Undo / Revoke Check-In
  const handleRevokeCheckin = async (attendee: SpaceEventAttendee) => {
    if (!attendee.checkin_id) return;
    if (!window.confirm(`Undo check-in for ${attendee.display_name}?`)) return;

    setLoadingAction(`undo-${attendee.checkin_id}`);
    try {
      const res = await fetch(
        `/api/space/organizer/events/${event.id}/checkin/${attendee.checkin_id}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (!res.ok) {
        setScanResult({ type: "error", message: data.error || "Failed to undo check-in." });
      } else {
        setScanResult({ type: "success", message: "Check-in reversed." });
        await refreshDesk();
      }
    } catch (err) {
      setScanResult({ type: "error", message: "Network error." });
    } finally {
      setLoadingAction(null);
    }
  };

  // Toggle Live status
  const handleToggleLive = async () => {
    const isCurrentlyLive = event.status === "live";
    const endpoint = isCurrentlyLive
      ? `/api/space/organizer/events/${event.id}/end`
      : `/api/space/organizer/events/${event.id}/live`;

    setLoadingAction("toggle-live");
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setScanResult({ type: "error", message: data.error || "Action failed." });
      } else {
        setEvent(data.event);
        await refreshDesk();
      }
    } catch (err) {
      setScanResult({ type: "error", message: "Failed to toggle live session." });
    } finally {
      setLoadingAction(null);
    }
  };

  // Filtered attendees
  const filteredAttendees = attendees.filter((a) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const displayName = (a.displayName || a.display_name || "").toLowerCase();
    const username = (a.username || "").toLowerCase();
    const ticketCode = (a.ticketCode || a.ticket_code || "").toLowerCase();
    return (
      displayName.includes(query) ||
      username.includes(query) ||
      ticketCode.includes(query)
    );
  });

  const attendanceRate =
    counts.registered > 0 ? Math.round((counts.checkedIn / counts.registered) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Banner: Status & Live Controls */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                event.status === "live"
                  ? "bg-emerald-500 text-white animate-pulse"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              {event.status === "live" ? "SESSION LIVE" : `STATUS: ${event.status.toUpperCase()}`}
            </span>

            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">
              {formatDateTimeIST(event.starts_at)}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {event.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Check-In Desk • Verified Host: @{event.organizer?.username}
          </p>
        </div>

        {/* Live Controller Button */}
        <div className="shrink-0 w-full md:w-auto">
          {event.status === "live" ? (
            <button
              type="button"
              onClick={handleToggleLive}
              disabled={loadingAction === "toggle-live"}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm shadow-md transition-all min-h-[48px]"
            >
              <StopCircle className="w-5 h-5" />
              <span>End Live Session</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleLive}
              disabled={loadingAction === "toggle-live" || event.status === "completed"}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all min-h-[48px] disabled:opacity-50"
            >
              <Radio className="w-5 h-5 animate-pulse" />
              <span>Go Live (Start Desk)</span>
            </button>
          )}
        </div>
      </div>

      {/* Attendance Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Checked In
          </span>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {counts.checkedIn}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total RSVPs
          </span>
          <span className="text-3xl font-black text-slate-900 dark:text-white">
            {counts.registered}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Attendance Rate
          </span>
          <span className="text-3xl font-black text-slate-900 dark:text-white">
            {attendanceRate}%
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Max Capacity
          </span>
          <span className="text-3xl font-black text-slate-400">
            {event.capacity}
          </span>
        </div>
      </div>

      {/* Live Scan Status Popup / Alert */}
      {scanResult && (
        <div
          className={`p-4 rounded-xl border text-sm font-bold flex items-center justify-between animate-in fade-in ${
            scanResult.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 text-emerald-900 dark:text-emerald-200"
              : "bg-red-50 dark:bg-red-950/80 border-red-300 text-red-900 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {scanResult.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{scanResult.message}</span>
          </div>

          <button
            type="button"
            onClick={() => setScanResult(null)}
            className="text-xs underline ml-4"
          >
            Clear
          </button>
        </div>
      )}

      {/* Camera QR Scanner Section */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <span>Camera QR Ticket Scanner</span>
          </h2>

          <button
            type="button"
            onClick={cameraActive ? stopCamera : startCamera}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              cameraActive
                ? "bg-slate-200 hover:bg-slate-300 text-slate-800"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {cameraActive ? "Turn Off Camera" : "Open Camera Scanner"}
          </button>
        </div>

        {cameraError && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
            {cameraError}
          </div>
        )}

        {/* Video Scanner Element */}
        <div
          className={`relative rounded-2xl overflow-hidden bg-slate-950 transition-all ${
            cameraActive ? "h-64 sm:h-80" : "hidden"
          }`}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/50 rounded-2xl flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-emerald-400 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Participant List & Search Bar */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Registered Participants ({attendees.length})</span>
          </h2>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, @username..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Attendee Roster Table */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
          {filteredAttendees.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching registered participants found.
            </div>
          ) : (
            filteredAttendees.map((att) => {
              const isCheckedIn = !!att.checkin_id;
              const isPendingAction =
                loadingAction === `manual-${att.registration_id}` ||
                loadingAction === `undo-${att.checkin_id}`;

              return (
                <div
                  key={att.registration_id}
                  className="py-3.5 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {att.display_name}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        @{att.username}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <code className="text-slate-400">{att.ticket_code}</code>
                      {isCheckedIn && (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                          <span>Checked in at {formatDateTimeIST(att.checked_in_at!)}</span>
                          <span className="uppercase text-[9px] bg-emerald-100 px-1.5 py-0.2 rounded font-mono">
                            {att.method}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Desk Check-In Action Button */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isCheckedIn ? (
                      <button
                        type="button"
                        onClick={() => handleRevokeCheckin(att)}
                        disabled={isPendingAction}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-xs transition-colors disabled:opacity-50"
                        title="Undo check-in"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Undo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleManualCheckin(att)}
                        disabled={isPendingAction}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 min-h-[38px]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Present</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
