"use client";

import React, { useState, useEffect } from "react";
import { SpaceStatus, SpaceSession } from "@/lib/space/types";

interface FoleSpaceLiveDeskProps {
  initialStatus?: SpaceStatus | null;
  initialSession?: SpaceSession | null;
  isAuthenticated?: boolean;
  studentName?: string | null;
}

export function FoleSpaceLiveDesk({
  initialStatus,
  initialSession,
  isAuthenticated: _isAuthenticated = false,
  studentName,
}: FoleSpaceLiveDeskProps) {
  // Capacity & occupancy state
  const capacity = initialStatus?.capacity || 65;
  const initialOccupancy = initialStatus?.occupancy ?? 42;
  const [occupancy, setOccupancy] = useState<number>(initialOccupancy);

  // Active session timer state
  const hasActiveSession = Boolean(initialSession || true);
  const [totalSeconds, setTotalSeconds] = useState<number>(2 * 3600 + 14 * 60 + 38);
  const [sessionExtended, setSessionExtended] = useState<boolean>(false);
  const [isCheckedOut, setIsCheckedOut] = useState<boolean>(false);

  // Optical scanner simulator state
  const [beamDown, setBeamDown] = useState<boolean>(true);
  const [manualToken, setManualToken] = useState<string>("");
  const [scannerFeedback, setScannerFeedback] = useState<{
    message: string;
    code: string;
    active: boolean;
  }>({
    message: "Valid Academic Credentials Loaded",
    code: "200 OK",
    active: false,
  });

  // Table filter state
  const [tableFilter, setTableFilter] = useState<"all" | "open">("all");
  const [joinedTables, setJoinedTables] = useState<Record<string, boolean>>({});

  // Study circle proposal state
  const [studyCircleModalOpen, setStudyCircleModalOpen] = useState(false);
  const [proposedCircle, setProposedCircle] = useState({ title: "", focus: "", time: "" });
  const [proposals, setProposals] = useState<Array<{ title: string; time: string; focus: string; venue: string; rsvp: number }>>([]);

  // Session timer countdown engine
  useEffect(() => {
    if (!hasActiveSession || isCheckedOut) return;

    const interval = setInterval(() => {
      setTotalSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [hasActiveSession, isCheckedOut]);

  // Scanner beam oscillation animation
  useEffect(() => {
    const beamInterval = setInterval(() => {
      setBeamDown((prev) => !prev);
    }, 1400);

    return () => clearInterval(beamInterval);
  }, []);

  // Format seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    const hrs = String(Math.floor(secs / 3600)).padStart(2, "0");
    const mins = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${hrs}:${mins}:${s}`;
  };

  // Handle Session Extension (+45m)
  const handleExtendSession = async () => {
    setTotalSeconds((prev) => prev + 45 * 60);
    setSessionExtended(true);
    setTimeout(() => setSessionExtended(false), 2000);

    try {
      if (initialSession?.id) {
        await fetch("/api/space/extend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: initialSession.id, minutes: 45 }),
        });
      }
    } catch {
      // Graceful local extension if offline
    }
  };

  // Handle Desk Release (Checkout)
  const handleReleaseDesk = async () => {
    if (confirm("Release station ALCOVE-08B and finalize your campus attendance record?")) {
      setIsCheckedOut(true);
      setTotalSeconds(0);
      setOccupancy((prev) => Math.max(0, prev - 1));

      try {
        if (initialSession?.id) {
          await fetch("/api/space/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: initialSession.id }),
          });
        }
      } catch {
        // Graceful local checkout
      }
    }
  };

  // Handle Optical or Manual Token Verification
  const handleVerifyPass = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = manualToken.trim() || "FOLE-8092B";

    setScannerFeedback({
      message: `Verified: ${token} — Check-in Recorded`,
      code: "ATTENDANCE LOGGED",
      active: true,
    });
    setManualToken("");
    setOccupancy((prev) => Math.min(capacity, prev + 1));

    setTimeout(() => {
      setScannerFeedback((prev) => ({ ...prev, active: false }));
    }, 3500);
  };

  // Toggle Table Join
  const toggleJoinTable = (tableId: string) => {
    setJoinedTables((prev) => ({
      ...prev,
      [tableId]: !prev[tableId],
    }));
  };

  // Percentage capacity calculation
  const occupancyPercentage = Math.min(100, Math.round((occupancy / capacity) * 100));
  const freeDesks = Math.max(0, capacity - occupancy);

  // Table sessions
  const floorTables = [
    {
      id: "T-02",
      name: "T-02: Compilers & AST Analysis",
      module: "Curriculum Module #04.2",
      lead: "M. Al-Mansoor",
      schedule: "14:00 – 16:30",
      taken: 4,
      total: 6,
      full: false,
    },
    {
      id: "T-05",
      name: "T-05: Distributed Byzantine Faults",
      module: "Vault Working Paper RFC-19",
      lead: "H. Lin-Kaufman",
      schedule: "15:00 – 17:00",
      taken: 2,
      total: 5,
      full: false,
    },
    {
      id: "T-07",
      name: "T-07: Hellenic Epigraphy & Latinity",
      module: "Classics Humanities Circle",
      lead: "D. Aris",
      schedule: "16:15 – 18:00",
      taken: 8,
      total: 8,
      full: true,
    },
    {
      id: "T-11",
      name: "T-11: Peer Proof-Checking: Category Theory",
      module: "Open Mathematical Colloquium",
      lead: "S. Varma",
      schedule: "17:00 – 19:30",
      taken: 1,
      total: 4,
      full: false,
    },
  ];

  const visibleTables = floorTables.filter((tbl) => {
    if (tableFilter === "open") return !tbl.full;
    return true;
  });

  return (
    <div className="flex flex-col w-full bg-surface-canvas text-on-surface font-body">
      {/* 1. Top Archival Notification Banner */}
      <div className="w-full bg-surface-warm border-b border-border-subtle py-space-xs px-gutter">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-space-sm text-on-surface-variant font-code-tabular text-xs">
          <div className="flex items-center gap-space-sm">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-semibold text-label-caps uppercase">
              FOLE Node 04
            </span>
            <span className="text-on-surface">Physical Space: North Loggia &amp; Atrium Commons</span>
          </div>
          <div className="flex items-center gap-space-md">
            <span>
              Acoustic Tier: <strong className="text-secondary font-semibold">Tier 1 (Subdued Scholarly)</strong>
            </span>
            <span className="text-border-firm hidden sm:inline">|</span>
            <span className="hidden sm:inline">
              Desk Warden on Duty: <strong className="text-primary font-semibold">Prof. E. Vance</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-gutter py-space-lg flex flex-col gap-space-xl">
        {/* 2. Header Utility Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md border-b border-border-subtle pb-space-lg">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs text-outline font-label-caps text-label-caps uppercase tracking-wider">
              <span>Campus Desk</span>
              <span>/</span>
              <span>Presence &amp; Station Registrar</span>
              <span>/</span>
              <span className="text-secondary font-semibold">Live Floor</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
              FOLE Space Live Desk &amp; Scholar Check-in
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
              Reserve physical study alcoves, stamp your peer workshop attendance, and monitor real-time spatial acoustics and seat availability.
            </p>
          </div>

          {/* Real-time Status Card with Capacity Gauge */}
          <div className="bg-surface-card border border-border-firm p-space-md rounded flex items-center gap-space-lg shadow-xs">
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-surface-container"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                ></path>
                <path
                  className="text-secondary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${occupancyPercentage}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                ></path>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-code-tabular text-xs font-bold text-primary leading-none">
                  {occupancyPercentage}%
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
                <span className="font-label-caps text-label-caps text-primary font-bold uppercase">
                  Commons Open
                </span>
              </div>
              <div className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                {occupancy} / {capacity} Occupied
              </div>
              <span className="font-code-tabular text-xs text-on-surface-variant">
                {freeDesks} Unreserved Desks Available
              </span>
            </div>
          </div>
        </div>

        {/* 3. Main Workspace Grid: 12 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Left Column: Active Session & Station Dossier (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            {/* Active Session Card */}
            <div className="bg-surface-card border border-border-firm rounded shadow-xs overflow-hidden">
              <div className="bg-surface-warm px-space-md py-space-sm border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-space-xs font-label-caps text-label-caps text-primary uppercase">
                  <span className="material-symbols-outlined text-base text-secondary">chair</span>
                  <span>Active Terminal Allocated</span>
                </div>
                <span className="bg-secondary-fixed/50 text-on-secondary-fixed-variant px-space-xs py-0.5 rounded text-label-caps font-code-tabular font-semibold">
                  ALCOVE-08B (EAST WING)
                </span>
              </div>
              <div className="p-space-md flex flex-col gap-space-md">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-space-sm">
                  <div>
                    <span className="font-label-caps text-label-caps text-outline block">STUDENT IDENTIFIER</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">
                      {studentName || "C. Thorne (#8092-B)"}
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="font-label-caps text-label-caps text-outline block">CHECKED-IN TIMESTAMP</span>
                    <span className="font-code-tabular text-xs text-on-surface font-semibold">
                      Today @ 13:46:12 IST
                    </span>
                  </div>
                </div>

                {/* Session Countdown Block */}
                <div className="bg-surface-canvas border border-border-subtle p-space-md rounded flex flex-col sm:flex-row items-center justify-between gap-space-md">
                  <div className="flex items-center gap-space-md w-full sm:w-auto">
                    <div className="w-10 h-10 rounded bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">hourglass_top</span>
                    </div>
                    <div>
                      <span className="font-label-caps text-label-caps text-outline block">
                        AUTHORIZED DURATION REMAINING
                      </span>
                      <div className="flex items-baseline gap-space-xs">
                        <span className="font-headline-md text-headline-md font-code-tabular text-primary font-bold">
                          {formatTime(totalSeconds)}
                        </span>
                        <span className="font-label-caps text-label-caps text-secondary font-semibold uppercase">
                          Standard Window
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Group */}
                  <div className="flex items-center gap-space-xs w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleExtendSession}
                      disabled={isCheckedOut}
                      className={`px-space-md py-space-xs bg-surface-card hover:bg-surface-canvas text-primary border border-border-firm rounded font-label-caps text-label-caps tracking-wider uppercase transition-colors flex items-center gap-1 shadow-xs cursor-pointer ${
                        sessionExtended ? "bg-surface-container font-bold" : ""
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">more_time</span>
                      Extend +45m
                    </button>
                    <button
                      type="button"
                      onClick={handleReleaseDesk}
                      disabled={isCheckedOut}
                      className={`px-space-md py-space-xs rounded font-label-caps text-label-caps tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer ${
                        isCheckedOut
                          ? "bg-surface-container text-outline cursor-not-allowed"
                          : "bg-primary hover:bg-secondary text-on-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isCheckedOut ? "check" : "logout"}
                      </span>
                      {isCheckedOut ? "Checked Out" : "Release Desk"}
                    </button>
                  </div>
                </div>

                {/* Station Spec Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-xs">
                  <div className="p-space-xs border border-border-subtle rounded bg-surface-warm">
                    <span className="font-label-caps text-label-caps text-outline block">POWER STATUS</span>
                    <span className="font-code-tabular text-xs text-on-surface font-medium flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span> 100W USB-C &amp; AC
                    </span>
                  </div>
                  <div className="p-space-xs border border-border-subtle rounded bg-surface-warm">
                    <span className="font-label-caps text-label-caps text-outline block">LOCAL LUX LEVEL</span>
                    <span className="font-code-tabular text-xs text-on-surface font-medium block mt-0.5">
                      480 lx (Natural)
                    </span>
                  </div>
                  <div className="p-space-xs border border-border-subtle rounded bg-surface-warm">
                    <span className="font-label-caps text-label-caps text-outline block">NETWORK NODE</span>
                    <span className="font-code-tabular text-xs text-on-surface font-medium block mt-0.5">
                      mesh-fole-5g
                    </span>
                  </div>
                  <div className="p-space-xs border border-border-subtle rounded bg-surface-warm">
                    <span className="font-label-caps text-label-caps text-outline block">PERMIT STATUS</span>
                    <span className="font-code-tabular text-xs text-secondary font-semibold block mt-0.5">
                      {isCheckedOut ? "Session Ended" : "Active / Valid"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Peer Code Review & Consultation Sessions Table */}
            <div className="bg-surface-card border border-border-firm rounded shadow-xs overflow-hidden">
              <div className="p-space-md border-b border-border-subtle flex flex-wrap items-center justify-between gap-space-sm">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                    Floor Sessions &amp; Peer Reviews
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Scheduled academic tables active in the Commons this afternoon.
                  </p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-caps text-label-caps text-outline">FILTER:</span>
                  <button
                    type="button"
                    onClick={() => setTableFilter("all")}
                    className={`px-2 py-1 rounded text-label-caps font-code-tabular cursor-pointer ${
                      tableFilter === "all"
                        ? "bg-surface-warm border border-border-subtle text-primary font-semibold"
                        : "bg-transparent text-on-surface-variant hover:bg-surface-warm"
                    }`}
                  >
                    ALL TBLS ({floorTables.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableFilter("open")}
                    className={`px-2 py-1 rounded text-label-caps font-code-tabular cursor-pointer ${
                      tableFilter === "open"
                        ? "bg-surface-warm border border-border-subtle text-primary font-semibold"
                        : "bg-transparent text-on-surface-variant hover:bg-surface-warm"
                    }`}
                  >
                    OPEN SEATS
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead className="bg-surface-warm border-b border-border-subtle text-outline font-label-caps text-label-caps">
                    <tr>
                      <th className="py-space-xs px-space-md">TABLE / FOCUS</th>
                      <th className="py-space-xs px-space-md">LEAD SCHOLAR</th>
                      <th className="py-space-xs px-space-md">SCHEDULE</th>
                      <th className="py-space-xs px-space-md">SEATS</th>
                      <th className="py-space-xs px-space-md text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle font-code-tabular text-xs">
                    {visibleTables.map((tbl) => {
                      const isJoined = joinedTables[tbl.id] ?? false;

                      return (
                        <tr key={tbl.id} className="hover:bg-surface-warm transition-colors">
                          <td className="py-space-sm px-space-md">
                            <span className="font-bold text-primary block">{tbl.name}</span>
                            <span className="text-label-caps text-outline font-body-sm">{tbl.module}</span>
                          </td>
                          <td className="py-space-sm px-space-md text-on-surface">{tbl.lead}</td>
                          <td className="py-space-sm px-space-md text-on-surface-variant">{tbl.schedule}</td>
                          <td className="py-space-sm px-space-md">
                            {tbl.full ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-warm text-outline font-semibold">
                                Full ({tbl.taken}/{tbl.total})
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-semibold">
                                {isJoined ? tbl.taken + 1 : tbl.taken} / {tbl.total} Taken
                              </span>
                            )}
                          </td>
                          <td className="py-space-sm px-space-md text-right">
                            {tbl.full ? (
                              <button
                                type="button"
                                disabled
                                className="px-space-sm py-1 bg-surface-warm border border-border-subtle text-outline rounded text-label-caps font-bold uppercase cursor-not-allowed"
                              >
                                Standby
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleJoinTable(tbl.id)}
                                className={`px-space-sm py-1 rounded text-label-caps font-bold uppercase transition-colors cursor-pointer ${
                                  isJoined
                                    ? "bg-secondary text-white border border-secondary"
                                    : "bg-surface-canvas hover:bg-surface-container border border-border-firm text-primary"
                                }`}
                              >
                                {isJoined ? "Joined ✓" : `Join ${tbl.id}`}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quiet Zone Policy Protocol Box */}
            <div className="bg-surface-canvas border border-border-subtle p-space-md rounded">
              <div className="flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-secondary mt-0.5">policy</span>
                <div className="flex flex-col gap-1">
                  <span className="font-label-caps text-label-caps text-primary font-bold uppercase">
                    Quiet Zone Regulations: North Loggia Stacks
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Laptops must remain on mute with headphones seated properly. Mobile devices are silenced. Scholarly discourse over 45 dB is redirected to the South Atrium Amphitheater or Mezzanine Group Pods. Desks unoccupied for &gt;25 minutes are automatically released back to the general pool.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Check-in Scanner, Ticket Validator & Study Groups (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-space-lg">
            {/* Interactive Check-In & Scanner Simulator */}
            <div className="bg-surface-card border border-border-firm rounded shadow-xs overflow-hidden">
              <div className="bg-surface-warm px-space-md py-space-sm border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-space-xs font-label-caps text-label-caps text-primary uppercase">
                  <span className="material-symbols-outlined text-base text-secondary">qr_code_scanner</span>
                  <span>Hardware Terminal &amp; QR Verifier</span>
                </div>
                <span className="font-code-tabular text-label-caps text-status-success font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse"></span>
                  SCANNER READY
                </span>
              </div>
              <div className="p-space-md flex flex-col gap-space-md">
                {/* Simulated Optical Viewfinder */}
                <div className="relative bg-primary text-on-primary rounded overflow-hidden p-space-md flex flex-col items-center justify-center min-h-[220px]">
                  {/* Crosshair brackets */}
                  <div className="absolute inset-4 border border-outline/30 rounded pointer-events-none flex flex-col justify-between">
                    <div className="flex justify-between p-1">
                      <span className="w-3 h-3 border-t-2 border-l-2 border-secondary"></span>
                      <span className="w-3 h-3 border-t-2 border-r-2 border-secondary"></span>
                    </div>
                    <div className="flex justify-between p-1">
                      <span className="w-3 h-3 border-b-2 border-l-2 border-secondary"></span>
                      <span className="w-3 h-3 border-b-2 border-r-2 border-secondary"></span>
                    </div>
                  </div>

                  {/* Center QR Mock */}
                  <div className="w-28 h-28 bg-surface-card p-2 rounded flex flex-col items-center justify-center relative shadow-md">
                    <div className="w-full h-full border-2 border-dashed border-primary flex flex-col items-center justify-center bg-surface-warm">
                      <span className="material-symbols-outlined text-3xl text-primary">qr_code_2</span>
                      <span className="font-code-tabular text-[10px] text-on-surface-variant mt-1 font-semibold">
                        FOLE-8092B
                      </span>
                    </div>
                    {/* Animated Optical Laser Line */}
                    <div
                      className="absolute left-2 right-2 h-0.5 bg-secondary shadow-[0_0_8px_#159447] transition-all duration-700 ease-in-out pointer-events-none"
                      style={{ top: beamDown ? "88px" : "12px" }}
                    ></div>
                  </div>
                  <span className="font-label-caps text-label-caps text-surface-container mt-3 tracking-widest uppercase">
                    Align Physical Badge or Mobile Pass
                  </span>
                </div>

                {/* Manual Token Form Alternative */}
                <form className="flex flex-col gap-space-xs" onSubmit={handleVerifyPass}>
                  <label className="font-label-caps text-label-caps text-outline uppercase" htmlFor="scholarTokenInput">
                    Or Validate Manual Entry Stamp
                  </label>
                  <div className="flex gap-space-xs">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-outline text-base">
                        pin
                      </span>
                      <input
                        id="scholarTokenInput"
                        type="text"
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        placeholder="e.g. TKT-9941-Commons"
                        className="w-full pl-8 pr-3 py-1.5 bg-surface-canvas border border-border-firm rounded font-code-tabular text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-space-md py-1.5 bg-primary hover:bg-secondary text-on-primary rounded font-label-caps text-label-caps uppercase transition-colors shrink-0 cursor-pointer"
                    >
                      Verify Pass
                    </button>
                  </div>
                </form>

                {/* Verification Feedback Display */}
                <div
                  className={`p-space-sm rounded border flex items-center justify-between transition-colors ${
                    scannerFeedback.active
                      ? "bg-secondary-fixed/30 border-secondary"
                      : "bg-surface-warm border-border-subtle"
                  }`}
                >
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-status-success text-base">
                      check_circle
                    </span>
                    <span className="font-code-tabular text-xs text-on-surface">
                      {scannerFeedback.message}
                    </span>
                  </div>
                  <span className="font-label-caps text-label-caps text-secondary font-bold">
                    {scannerFeedback.code}
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming Study Circles & Groups */}
            <div className="bg-surface-card border border-border-firm rounded shadow-xs overflow-hidden">
              <div className="p-space-md border-b border-border-subtle flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Upcoming Study Groups
                </h2>
                <span className="font-label-caps text-label-caps text-outline">CONVENING TODAY</span>
              </div>
              <div className="p-space-md flex flex-col gap-space-sm">
                {/* Group 1 */}
                <div className="p-space-sm border border-border-subtle rounded hover:bg-surface-warm transition-colors flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-base text-primary font-bold">
                      Syllabus Group: Category Theory II
                    </span>
                    <span className="font-code-tabular text-label-caps text-secondary font-semibold bg-surface-container px-1.5 py-0.5 rounded">
                      16:00 – 17:30
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Focus: Monads, Kleisli categories, and computational semantics.
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-border-subtle/60 text-outline font-label-caps text-label-caps">
                    <span>SEMINAR RM-B</span>
                    <span className="text-on-surface font-code-tabular font-medium">5 Scholars RSVP&apos;d</span>
                  </div>
                </div>

                {/* Group 2 */}
                <div className="p-space-sm border border-border-subtle rounded hover:bg-surface-warm transition-colors flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-base text-primary font-bold">
                      Kernel Hacker Pod: eBPF Tracing
                    </span>
                    <span className="font-code-tabular text-label-caps text-secondary font-semibold bg-surface-container px-1.5 py-0.5 rounded">
                      18:00 – 20:00
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Hands-on tracepoint debugging with BCC tools on Linux 6.8 kernels.
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-border-subtle/60 text-outline font-label-caps text-label-caps">
                    <span>LAB POD 03</span>
                    <span className="text-on-surface font-code-tabular font-medium">8 Scholars RSVP&apos;d</span>
                  </div>
                </div>

                {/* Group 3 */}
                <div className="p-space-sm border border-border-subtle rounded hover:bg-surface-warm transition-colors flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-base text-primary font-bold">
                      Manuscript Reading: Post-Digital Typography
                    </span>
                    <span className="font-code-tabular text-label-caps text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                      20:30 – 21:45
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Reading Bringhurst Chapter 7 and discussion of early Dutch punch-cutting.
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-border-subtle/60 text-outline font-label-caps text-label-caps">
                    <span>MEZZANINE LOUNGE</span>
                    <span className="text-on-surface font-code-tabular font-medium">3 Scholars RSVP&apos;d</span>
                  </div>
                </div>

                {/* Custom User Proposed Circles */}
                {proposals.map((prop, idx) => (
                  <div key={idx} className="p-space-sm border border-secondary/60 bg-secondary-fixed/20 rounded flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-base text-primary font-bold">{prop.title}</span>
                      <span className="font-code-tabular text-label-caps text-secondary font-semibold bg-surface-container px-1.5 py-0.5 rounded">
                        {prop.time}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{prop.focus}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-border-subtle/60 text-outline font-label-caps text-label-caps">
                      <span>{prop.venue}</span>
                      <span className="text-on-surface font-code-tabular font-medium">{prop.rsvp} Scholars RSVP&apos;d</span>
                    </div>
                  </div>
                ))}

                {/* Fast Register Button */}
                <button
                  type="button"
                  onClick={() => setStudyCircleModalOpen(true)}
                  className="w-full py-space-xs mt-1 border border-border-firm hover:border-primary text-primary font-label-caps text-label-caps uppercase rounded bg-surface-canvas hover:bg-surface-container transition-colors flex items-center justify-center gap-1 font-semibold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">group_add</span>
                  Propose or Register Study Circle
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Live Ambient Noise & Environmental Readout Strip */}
        <div className="border-t border-border-subtle pt-space-lg flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              Spatial Environmental Monitor (Campus Nodes Telemetry)
            </span>
            <span className="font-code-tabular text-xs text-on-surface-variant">Telemetry updated 12s ago</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
            <div className="bg-surface-card border border-border-subtle p-space-sm rounded">
              <span className="font-label-caps text-label-caps text-outline block">AMBIENT SOUND LEVEL</span>
              <div className="flex items-baseline gap-space-xs mt-0.5">
                <span className="font-headline-sm text-headline-sm text-primary font-bold">36.4</span>
                <span className="font-code-tabular text-xs text-on-surface-variant">dB (Whisper quiet)</span>
              </div>
            </div>
            <div className="bg-surface-card border border-border-subtle p-space-sm rounded">
              <span className="font-label-caps text-label-caps text-outline block">AIR QUALITY (CO2 TIER)</span>
              <div className="flex items-baseline gap-space-xs mt-0.5">
                <span className="font-headline-sm text-headline-sm text-secondary font-bold">482</span>
                <span className="font-code-tabular text-xs text-on-surface-variant">ppm (Optimum)</span>
              </div>
            </div>
            <div className="bg-surface-card border border-border-subtle p-space-sm rounded">
              <span className="font-label-caps text-label-caps text-outline block">AMBIENT TEMPERATURE</span>
              <div className="flex items-baseline gap-space-xs mt-0.5">
                <span className="font-headline-sm text-headline-sm text-primary font-bold">69.8</span>
                <span className="font-code-tabular text-xs text-on-surface-variant">°F / 21.0 °C</span>
              </div>
            </div>
            <div className="bg-surface-card border border-border-subtle p-space-sm rounded">
              <span className="font-label-caps text-label-caps text-outline block">PEAK HOURS FORECAST</span>
              <div className="flex items-baseline gap-space-xs mt-0.5">
                <span className="font-headline-sm text-headline-sm text-status-warning font-bold">16:30</span>
                <span className="font-code-tabular text-xs text-on-surface-variant">Expected 92% Cap</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Propose Study Circle Modal */}
      {studyCircleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card border border-border-subtle max-w-md w-full rounded p-space-lg shadow-xl space-y-space-md">
            <div className="flex items-center justify-between border-b border-border-subtle pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary">group_add</span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Propose Study Circle</h3>
              </div>
              <button
                type="button"
                onClick={() => setStudyCircleModalOpen(false)}
                className="p-1 hover:bg-surface-warm rounded text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (proposedCircle.title) {
                  setProposals((prev) => [
                    ...prev,
                    {
                      title: proposedCircle.title,
                      focus: proposedCircle.focus || "Open Peer Discussion",
                      time: proposedCircle.time || "19:00 - 20:30",
                      venue: "Commons Floor Node",
                      rsvp: 1,
                    },
                  ]);
                  setProposedCircle({ title: "", focus: "", time: "" });
                  setStudyCircleModalOpen(false);
                }
              }}
              className="space-y-space-sm font-body-sm text-body-sm"
            >
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold block mb-1">
                  TOPIC / CIRCLE NAME
                </label>
                <input
                  type="text"
                  required
                  value={proposedCircle.title}
                  onChange={(e) => setProposedCircle({ ...proposedCircle, title: e.target.value })}
                  placeholder="e.g. CST 201 Trees & Graph Algorithms"
                  className="w-full bg-surface-canvas border border-border-firm px-3 py-2 rounded font-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold block mb-1">
                  FOCUS &amp; OBJECTIVE
                </label>
                <input
                  type="text"
                  value={proposedCircle.focus}
                  onChange={(e) => setProposedCircle({ ...proposedCircle, focus: e.target.value })}
                  placeholder="e.g. Solving KTU QP derivations together"
                  className="w-full bg-surface-canvas border border-border-firm px-3 py-2 rounded font-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold block mb-1">
                  CONVENING TIME WINDOW
                </label>
                <input
                  type="text"
                  value={proposedCircle.time}
                  onChange={(e) => setProposedCircle({ ...proposedCircle, time: e.target.value })}
                  placeholder="e.g. 17:00 – 18:30"
                  className="w-full bg-surface-canvas border border-border-firm px-3 py-2 rounded font-code-tabular text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-space-xs border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setStudyCircleModalOpen(false)}
                  className="px-space-md py-1.5 border border-border-firm text-on-surface rounded font-code-tabular text-label-caps hover:bg-surface-warm"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-space-md py-1.5 bg-primary text-on-primary rounded font-code-tabular text-label-caps hover:bg-secondary cursor-pointer"
                >
                  SUBMIT PROPOSAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
