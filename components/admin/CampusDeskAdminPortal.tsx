"use client";

import React, { useState } from "react";
import Link from "next/link";
import { isValidYouTubeUrl, extractYouTubeVideoId } from "@/lib/utils/youtube";
import { Subject } from "@/types";

interface CampusDeskAdminPortalProps {
  stats: {
    totalSubjects: number;
    publishedSubjects: number;
    totalModules: number;
    totalLessons: number;
    totalMaterials: number;
  };
  subjects: Array<Subject | { id: string; title: string; code?: string | null; name?: string; branch?: string }>;
  recentActivities: Array<{ id: string; action: string; details?: string; created_at: string }>;
}

export function CampusDeskAdminPortal({
  stats,
  subjects,
  recentActivities: _recentActivities,
}: CampusDeskAdminPortalProps) {
  // Tabs: 'scholars' | 'curation' | 'checkin'
  const [activeTab, setActiveTab] = useState<"scholars" | "curation" | "checkin">("scholars");

  // Notification / Alert banner state
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Scholars state
  const [scholarSearch, setScholarSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedScholars, setSelectedScholars] = useState<Record<string, boolean>>({});
  const [scholarsList, setScholarsList] = useState([
    {
      id: "WYD21CS042",
      name: "Ananya Anand",
      email: "ananya.a@gecw.ac.in",
      branch: "CSE",
      year: "Year 4 / Sem VII",
      attendancePercent: 94.2,
      sessions: "28 / 30 Vault Sessions",
      status: "VERIFIED" as const,
      statusLabel: "VERIFIED SCHOLAR",
      initials: "AA",
      color: "bg-primary-fixed text-primary",
    },
    {
      id: "WYD22EC018",
      name: "Rohan Varma",
      email: "rohan.v@gecw.ac.in",
      branch: "ECE",
      year: "Year 3 / Sem V",
      attendancePercent: 71.0,
      sessions: "18 / 25 Vault Sessions",
      status: "PENDING" as const,
      statusLabel: "PENDING ATTESTATION",
      initials: "RV",
      color: "bg-surface-container text-on-surface-variant",
    },
    {
      id: "WYD21CS089",
      name: "Fathima Maryam",
      email: "fathima.m@gecw.ac.in",
      branch: "CSE",
      year: "Year 4 / Sem VII",
      attendancePercent: 98.5,
      sessions: "32 / 32 Vault Sessions",
      status: "VERIFIED" as const,
      statusLabel: "VERIFIED SCHOLAR",
      initials: "FM",
      color: "bg-primary-fixed text-primary",
    },
    {
      id: "WYD23ME004",
      name: "Karthik Nambiar",
      email: "karthik.n@gecw.ac.in",
      branch: "ME",
      year: "Year 2 / Sem III",
      attendancePercent: 62.4,
      sessions: "10 / 16 Vault Sessions",
      status: "PROBATION" as const,
      statusLabel: "UNDER ACADEMIC REVIEW",
      initials: "KN",
      color: "bg-secondary-fixed-dim text-on-secondary-fixed",
    },
    {
      id: "WYD22CE031",
      name: "Sneha Balan",
      email: "sneha.b@gecw.ac.in",
      branch: "CE",
      year: "Year 3 / Sem V",
      attendancePercent: 88.0,
      sessions: "22 / 25 Vault Sessions",
      status: "VERIFIED" as const,
      statusLabel: "VERIFIED SCHOLAR",
      initials: "SB",
      color: "bg-surface-warm text-secondary",
    },
  ]);

  // Modals state
  const [dossierModal, setDossierModal] = useState<{
    open: boolean;
    scholar: (typeof scholarsList)[0] | null;
  }>({ open: false, scholar: null });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    actionKey: string;
    targetId?: string;
  }>({ open: false, title: "", message: "", actionKey: "" });

  const [enrollDrawerOpen, setEnrollDrawerOpen] = useState(false);
  const [newScholar, setNewScholar] = useState({
    name: "",
    ktuId: "",
    branch: "CSE",
    year: "Year 1 (2024)",
    rfid: "",
  });

  // Tab 2: YouTube Lecture Ingestion state
  const [ytUrl, setYtUrl] = useState("");
  const [urlStatus, setUrlStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [videoPreview, setVideoPreview] = useState<{
    visible: boolean;
    videoId?: string;
    title?: string;
  }>({ visible: false });
  const [targetCourse, setTargetCourse] = useState(
    subjects[0]?.code || "CST301"
  );
  const [targetModule, setTargetModule] = useState("M1");
  const [moderationQueue, setModerationQueue] = useState([
    {
      id: "q-1",
      course: "CST303",
      module: "M04 Lecture 3",
      time: "SUBMITTED 2H AGO",
      title: "Subnetting & CIDR Address Calculations with Examples",
      faculty: "Prof. Hari Kumar (Govt Engg Sreekrishnapuram)",
      link: "youtu.be/k9fG_81M0aQ",
    },
    {
      id: "q-2",
      course: "ECT202",
      module: "M01 Lecture 7",
      time: "SUBMITTED YESTERDAY",
      title: "Small Signal Analysis of BJT Common Emitter Amplifier",
      faculty: "Dr. Suma Nair (NPTEL Archival Transfer)",
      link: "youtu.be/wX_99zM81eA",
    },
    {
      id: "q-3",
      course: "MET204",
      module: "M02 Lecture 1",
      time: "SUBMITTED 3D AGO",
      title: "Modern CNC Lathe Operations and G-Code Syntax Primer",
      faculty: "Mechanical Student Circle (Peer Authored)",
      link: "youtu.be/mE_02Lz44B",
    },
  ]);

  // Tab 3: Check-in Logs state
  const [manualRfid, setManualRfid] = useState("");
  const [accessLogs, setAccessLogs] = useState([
    {
      id: "log-1",
      time: "14:41:02 IST",
      name: "Arjun Das",
      reg: "WYD21CS019",
      desk: "Node Alpha-08",
      duration: "00:01:17 (Just tap-in)",
      type: "CHECK-IN (NFC)",
      isCheckIn: true,
    },
    {
      id: "log-2",
      time: "14:38:44 IST",
      name: "Devika Pillai",
      reg: "WYD22EC044",
      desk: "Quiet Vault #02",
      duration: "03:42:15",
      type: "CHECK-OUT (TAP)",
      isCheckIn: false,
    },
    {
      id: "log-3",
      time: "14:22:10 IST",
      name: "Muhammed Nihal",
      reg: "WYD23CS102",
      desk: "Collab Table B-3",
      duration: "00:20:09",
      type: "CHECK-IN (OVERRIDE)",
      isCheckIn: true,
    },
    {
      id: "log-4",
      time: "13:58:30 IST",
      name: "Meera Krishnan",
      reg: "WYD21EE008",
      desk: "Node Beta-01",
      duration: "00:43:49",
      type: "CHECK-IN (NFC)",
      isCheckIn: true,
    },
    {
      id: "log-5",
      time: "13:15:00 IST",
      name: "Siddharth Menon",
      reg: "WYD22ME052",
      desk: "Node Gamma-04",
      duration: "01:25:00",
      type: "CHECK-OUT (TAP)",
      isCheckIn: false,
    },
  ]);

  // Filter scholars
  const filteredScholars = scholarsList.filter((s) => {
    const q = scholarSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q);

    const matchesBranch = branchFilter === "ALL" || s.branch === branchFilter;
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  // Toggle select all
  const handleSelectAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) {
      filteredScholars.forEach((s) => {
        next[s.id] = true;
      });
    }
    setSelectedScholars(next);
  };

  // Batch approve
  const handleBatchApprove = () => {
    const ids = Object.keys(selectedScholars).filter((k) => selectedScholars[k]);
    if (ids.length === 0) {
      alert("Please select one or more scholars from the table first.");
      return;
    }
    setScholarsList((prev) =>
      prev.map((s) => (ids.includes(s.id) ? { ...s, status: "VERIFIED", statusLabel: "VERIFIED SCHOLAR" } : s))
    );
    setSelectedScholars({});
    setBannerNotice(`Batch Accreditation Approved: ${ids.length} scholars attested into campus ledger.`);
    setTimeout(() => setBannerNotice(null), 5000);
  };

  // Direct verify single scholar
  const handleDirectVerify = (id: string) => {
    setScholarsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "VERIFIED", statusLabel: "VERIFIED SCHOLAR" } : s))
    );
    setBannerNotice(`Scholar ${id} verified and accredited.`);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Execute destructive action from confirm modal
  const handleExecuteDestructiveAction = () => {
    if (confirmModal.actionKey === "REVOKE" && confirmModal.targetId) {
      setScholarsList((prev) =>
        prev.map((s) => (s.id === confirmModal.targetId ? { ...s, status: "PROBATION", statusLabel: "UNDER ACADEMIC REVIEW" } : s))
      );
      setBannerNotice(`Credentials revoked for ${confirmModal.targetId}.`);
    } else if (confirmModal.actionKey === "REJECT_LECTURE" && confirmModal.targetId) {
      setModerationQueue((prev) => prev.filter((item) => item.id !== confirmModal.targetId));
      setBannerNotice(`Lecture submission #${confirmModal.targetId} rejected and returned.`);
    } else if (confirmModal.actionKey === "REVOKE_ALL") {
      setScholarsList((prev) =>
        prev.map((s) => (s.status === "PENDING" ? { ...s, status: "PROBATION", statusLabel: "UNDER ACADEMIC REVIEW" } : s))
      );
      setBannerNotice("Pending credentials flagged for registrar audit.");
    }

    setConfirmModal({ open: false, title: "", message: "", actionKey: "" });
    setTimeout(() => setBannerNotice(null), 5000);
  };

  // Validate YouTube URL
  const handleYtInput = (url: string) => {
    setYtUrl(url);
    if (!url.trim()) {
      setUrlStatus("idle");
      setVideoPreview({ visible: false });
      return;
    }

    if (isValidYouTubeUrl(url)) {
      setUrlStatus("valid");
      const vid = extractYouTubeVideoId(url);
      setVideoPreview({
        visible: true,
        videoId: vid || undefined,
        title: "Verified Video Stream: KTU Scheme 2024 Academic Compendium",
      });
    } else {
      setUrlStatus("invalid");
      setVideoPreview({ visible: false });
    }
  };

  // Submit lecture to vault
  const handleCommitLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlStatus !== "valid") {
      alert("Please provide a valid YouTube video URL first.");
      return;
    }

    setBannerNotice(
      `Lecture committed to ${targetCourse} Module ${targetModule}. Dispatched to public syllabus pipeline.`
    );
    setYtUrl("");
    setUrlStatus("idle");
    setVideoPreview({ visible: false });
    setTimeout(() => setBannerNotice(null), 6000);
  };

  // Moderate queue item
  const handleApproveQueueItem = (id: string, course: string) => {
    setModerationQueue((prev) => prev.filter((q) => q.id !== id));
    setBannerNotice(`Lecture for ${course} approved and catalogued into FOLE Vault.`);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Manual RFID / Card check-in
  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const token = manualRfid.trim() || "WYD24CS" + Math.floor(100 + Math.random() * 900);
    const newEntry = {
      id: "log-" + Date.now(),
      time: new Date().toLocaleTimeString("en-IN", { hour12: false }) + " IST",
      name: "Scholar " + token,
      reg: token,
      desk: "Terminal Station #04",
      duration: "00:00:01 (Just tap-in)",
      type: "CHECK-IN (MANUAL TAP)",
      isCheckIn: true,
    };

    setAccessLogs([newEntry, ...accessLogs]);
    setManualRfid("");
    setBannerNotice(`Card swipe recorded for ${token} at Station #04.`);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Toggle desk override
  const handleToggleOverride = (logId: string) => {
    setAccessLogs((prev) =>
      prev.map((log) => {
        if (log.id === logId) {
          const nextCheckIn = !log.isCheckIn;
          return {
            ...log,
            isCheckIn: nextCheckIn,
            type: nextCheckIn ? "CHECK-IN (OVERRIDE)" : "CHECK-OUT (FORCED)",
            duration: nextCheckIn ? "00:00:01 (Re-opened)" : "01:45:00 (Finalized)",
          };
        }
        return log;
      })
    );
  };

  // Enroll new scholar
  const handleEnrollScholar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScholar.name || !newScholar.ktuId) return;

    const initials = newScholar.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const created = {
      id: newScholar.ktuId.toUpperCase(),
      name: newScholar.name,
      email: `${newScholar.name.toLowerCase().replace(/\s+/g, ".")}@gecw.ac.in`,
      branch: newScholar.branch,
      year: newScholar.year,
      attendancePercent: 100.0,
      sessions: "1 / 1 Vault Sessions",
      status: "VERIFIED" as const,
      statusLabel: "VERIFIED SCHOLAR",
      initials: initials || "ST",
      color: "bg-primary-fixed text-primary",
    };

    setScholarsList([created, ...scholarsList]);
    setEnrollDrawerOpen(false);
    setNewScholar({
      name: "",
      ktuId: "",
      branch: "CSE",
      year: "Year 1 (2024)",
      rfid: "",
    });
    setBannerNotice(`New scholar ${created.name} (${created.id}) successfully enrolled and issued digital pass.`);
    setTimeout(() => setBannerNotice(null), 5000);
  };

  return (
    <div className="flex flex-col w-full bg-surface-canvas text-on-surface font-body min-h-screen">
      {/* Dynamic Command Strip Notice */}
      {bannerNotice && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-primary text-on-primary p-space-md rounded border border-border-firm shadow-lg flex items-start gap-space-sm animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-status-success shrink-0 text-xl">
            verified
          </span>
          <div className="text-body-sm">
            <p className="font-bold font-code-tabular">CAMPUS DESK DISPATCH</p>
            <p className="mt-1">{bannerNotice}</p>
          </div>
          <button
            onClick={() => setBannerNotice(null)}
            className="text-on-primary hover:opacity-75 ml-auto text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Command Strip / Admin Header */}
      <section className="w-full bg-surface-warm border-b border-border-subtle py-space-md">
        <div className="max-w-7xl mx-auto px-gutter flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded bg-primary text-on-primary flex items-center justify-center font-code-tabular font-bold shadow-xs">
              CD
            </div>
            <div>
              <div className="flex items-center gap-space-xs">
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider font-semibold">
                  Campus Operations Desk
                </span>
                <span className="text-outline">/</span>
                <span className="font-code-tabular text-code-tabular text-on-surface-variant font-medium">
                  Station #04 [Main Sanctum]
                </span>
              </div>
              <h1 className="font-headline-md text-headline-md text-primary tracking-tight font-bold">
                Academic Registrar &amp; Vault Dispatch
              </h1>
            </div>
          </div>

          {/* Quick Metrics Counter Tape */}
          <div className="flex items-center gap-space-lg font-code-tabular text-code-tabular overflow-x-auto pb-space-xs md:pb-0">
            <div className="flex flex-col border-l border-border-subtle pl-space-md">
              <span className="font-label-caps text-label-caps text-outline">DESK STATUS</span>
              <span className="flex items-center gap-1.5 text-status-success font-semibold">
                <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
                ACTIVE CONSOLE
              </span>
            </div>

            <div className="flex flex-col border-l border-border-subtle pl-space-md">
              <span className="font-label-caps text-label-caps text-outline">CATALOG MODULES</span>
              <span className="text-primary font-bold">{stats.totalModules} Units</span>
            </div>

            <div className="flex flex-col border-l border-border-subtle pl-space-md">
              <span className="font-label-caps text-label-caps text-outline">RECORDED LECTURES</span>
              <span className="text-primary font-bold">{stats.totalLessons} Videos</span>
            </div>

            <div className="flex flex-col border-l border-border-subtle pl-space-md">
              <span className="font-label-caps text-label-caps text-outline">SANCTUM LOAD</span>
              <span className="text-primary font-bold">84 / 110 Seats</span>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Sub-Nav Links & Quick Shortcuts */}
      <div className="w-full bg-surface-container-low border-b border-border-subtle px-gutter py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-code-tabular overflow-x-auto gap-4">
          <div className="flex items-center gap-4 text-on-surface-variant">
            <span className="font-label-caps text-outline uppercase">Quick Navigation:</span>
            <Link href="/admin/dashboard/subjects" className="hover:text-primary transition-colors">
              Courses &amp; Subjects ({stats.totalSubjects})
            </Link>
            <Link href="/admin/dashboard/modules" className="hover:text-primary transition-colors">
              Modules ({stats.totalModules})
            </Link>
            <Link href="/admin/dashboard/lessons" className="hover:text-primary transition-colors">
              Video Classes ({stats.totalLessons})
            </Link>
            <Link href="/admin/dashboard/materials" className="hover:text-primary transition-colors">
              Documents &amp; PDFs ({stats.totalMaterials})
            </Link>
            <Link href="/admin/dashboard/activity" className="hover:text-primary transition-colors">
              Audit Logs
            </Link>
          </div>
          <span className="font-label-caps text-outline hidden md:inline">
            ACADEMIC CHARTER 2024-25 • SCHOLAR ID #8092-B
          </span>
        </div>
      </div>

      {/* Workspace Sub-Nav Tab Bar */}
      <div className="w-full bg-surface border-b border-border-subtle sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-gutter flex items-center justify-between">
          <div className="flex items-center gap-space-md">
            <button
              onClick={() => setActiveTab("scholars")}
              className={`py-3.5 px-2 font-code-tabular text-code-tabular flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "scholars"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-on-surface-variant hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-base">how_to_reg</span>
              Scholars Registry &amp; Verification
              <span className="ml-1 px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps">
                {scholarsList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("curation")}
              className={`py-3.5 px-2 font-code-tabular text-code-tabular flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "curation"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-on-surface-variant hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-base">video_library</span>
              Course Material &amp; YouTube Ingestion
            </button>

            <button
              onClick={() => setActiveTab("checkin")}
              className={`py-3.5 px-2 font-code-tabular text-code-tabular flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "checkin"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-on-surface-variant hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-base">meeting_room</span>
              FOLE Sanctum Access Logs
            </button>
          </div>

          <div className="hidden md:flex items-center gap-space-sm font-label-caps text-label-caps">
            <button
              onClick={() => {
                alert("Audit ledger exported to collegiate archives CSV.");
              }}
              className="text-secondary hover:text-primary transition-colors flex items-center gap-1"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export Audit Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Primary Work Area Container */}
      <div className="max-w-7xl mx-auto px-gutter py-space-xl w-full flex-1">
        {/* ========================================== */}
        {/* TAB 1: SCHOLARS REGISTRY (DATA TABLE VIEW) */}
        {/* ========================================== */}
        {activeTab === "scholars" && (
          <div className="flex flex-col gap-space-lg">
            {/* Search, Filtering, and Batch Bar */}
            <div className="bg-surface-warm border border-border-subtle p-space-md rounded flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
              <div className="flex flex-1 flex-col sm:flex-row items-center gap-space-sm">
                <div className="relative w-full sm:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    value={scholarSearch}
                    onChange={(e) => setScholarSearch(e.target.value)}
                    placeholder="Search by name, KTU ID, or roll..."
                    className="w-full bg-surface-container-lowest border border-border-firm pl-9 pr-3 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none rounded"
                  />
                </div>

                <div className="flex items-center gap-space-xs w-full sm:w-auto">
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="w-full sm:w-auto bg-surface-container-lowest border border-border-firm px-3 py-2 font-code-tabular text-code-tabular text-on-surface rounded focus:border-primary focus:outline-none"
                  >
                    <option value="ALL">All Branches (KTU)</option>
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="ECE">Electronics (ECE)</option>
                    <option value="ME">Mechanical (ME)</option>
                    <option value="CE">Civil Engineering (CE)</option>
                    <option value="EEE">Electrical &amp; Electronics (EEE)</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-auto bg-surface-container-lowest border border-border-firm px-3 py-2 font-code-tabular text-code-tabular text-on-surface rounded focus:border-primary focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="VERIFIED">Verified Only</option>
                    <option value="PENDING">Pending Review</option>
                    <option value="PROBATION">Under Academic Review</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-space-sm">
                <button
                  onClick={handleBatchApprove}
                  className="bg-surface border border-border-firm hover:border-primary text-on-surface px-3 py-2 rounded font-code-tabular text-code-tabular flex items-center gap-1.5 transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm text-status-success">verified</span>
                  Approve Batch
                </button>

                <button
                  onClick={() =>
                    setConfirmModal({
                      open: true,
                      title: "Flag Deviations & Batch Audit",
                      message:
                        "Are you certain you wish to flag all pending credentials for registrar re-audit?",
                      actionKey: "REVOKE_ALL",
                    })
                  }
                  className="bg-surface border border-border-firm hover:border-status-danger text-status-danger px-3 py-2 rounded font-code-tabular text-code-tabular flex items-center gap-1.5 transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">block</span>
                  Flag Deviations
                </button>

                <button
                  onClick={() => setEnrollDrawerOpen(true)}
                  className="bg-primary hover:bg-secondary text-on-primary px-4 py-2 rounded font-code-tabular text-code-tabular flex items-center gap-1.5 transition-colors font-medium"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  Enroll Scholar
                </button>
              </div>
            </div>

            {/* High-Productivity Admin Data Table */}
            <div className="w-full bg-surface-container-lowest border border-border-subtle rounded overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-warm border-b border-border-subtle font-label-caps text-label-caps text-on-surface-variant tracking-wider">
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="accent-primary rounded-xs w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">SCHOLAR IDENTITY</th>
                      <th className="py-3 px-4">KTU REGISTRATION</th>
                      <th className="py-3 px-4">BRANCH &amp; YEAR</th>
                      <th className="py-3 px-4">ATTENDANCE STATS</th>
                      <th className="py-3 px-4">VERIFICATION BADGE</th>
                      <th className="py-3 px-4 text-right">PROTOCOL ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle font-body-sm text-body-sm text-on-surface">
                    {filteredScholars.map((scholar) => (
                      <tr
                        key={scholar.id}
                        className={`hover:bg-surface-warm/70 transition-colors ${
                          selectedScholars[scholar.id] ? "bg-surface-warm/50" : ""
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedScholars[scholar.id])}
                            onChange={(e) =>
                              setSelectedScholars({
                                ...selectedScholars,
                                [scholar.id]: e.target.checked,
                              })
                            }
                            className="accent-primary rounded-xs w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full font-code-tabular font-bold flex items-center justify-center text-xs ${scholar.color}`}
                            >
                              {scholar.initials}
                            </div>
                            <div>
                              <div className="font-body-md text-body-md font-semibold text-primary">
                                {scholar.name}
                              </div>
                              <div className="font-code-tabular text-xs text-outline">
                                {scholar.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-code-tabular text-code-tabular font-semibold text-on-surface">
                          {scholar.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-code-tabular text-code-tabular">
                            <span className="px-2 py-0.5 rounded bg-surface-container border border-border-subtle text-on-surface">
                              {scholar.branch}
                            </span>
                            <span className="text-outline">{scholar.year}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-surface-container rounded h-2 overflow-hidden">
                              <div
                                className={`h-full ${
                                  scholar.attendancePercent >= 80
                                    ? "bg-status-success"
                                    : scholar.attendancePercent >= 70
                                    ? "bg-status-warning"
                                    : "bg-status-danger"
                                }`}
                                style={{ width: `${scholar.attendancePercent}%` }}
                              />
                            </div>
                            <span
                              className={`font-code-tabular text-code-tabular font-semibold ${
                                scholar.attendancePercent >= 80
                                  ? "text-status-success"
                                  : "text-status-warning"
                              }`}
                            >
                              {scholar.attendancePercent}%
                            </span>
                          </div>
                          <span className="font-label-caps text-[0.6875rem] text-outline">
                            {scholar.sessions}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {scholar.status === "VERIFIED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F0F7F2] border border-[#A9C8AD] text-primary font-code-tabular text-xs font-semibold">
                              <span className="material-symbols-outlined text-xs text-status-success">
                                check_circle
                              </span>
                              VERIFIED SCHOLAR
                            </span>
                          ) : scholar.status === "PENDING" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-warm border border-status-warning text-status-warning font-code-tabular text-xs font-semibold">
                              <span className="material-symbols-outlined text-xs">pending</span>
                              PENDING ATTESTATION
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container text-status-danger font-code-tabular text-xs font-semibold">
                              <span className="material-symbols-outlined text-xs">warning</span>
                              REVIEW PROBATION
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {scholar.status === "PENDING" && (
                              <button
                                onClick={() => handleDirectVerify(scholar.id)}
                                className="px-2 py-1 bg-primary text-on-primary rounded font-code-tabular text-xs flex items-center gap-1 hover:bg-secondary transition-colors"
                                title="Review Document"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-xs">check</span>
                                Verify
                              </button>
                            )}
                            <button
                              onClick={() => setDossierModal({ open: true, scholar })}
                              className="p-1.5 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors"
                              title="View Dossier"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">visibility</span>
                            </button>
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  open: true,
                                  title: "Revoke Scholar Pass",
                                  message: `Confirm revocation of access credentials for ${scholar.name} (${scholar.id})?`,
                                  actionKey: "REVOKE",
                                  targetId: scholar.id,
                                })
                              }
                              className="p-1.5 hover:bg-surface-container rounded text-on-surface-variant hover:text-status-danger transition-colors"
                              title="Revoke Accreditation"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">person_off</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: COURSE MATERIAL & YOUTUBE INGESTION              */}
        {/* ======================================================== */}
        {activeTab === "curation" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            {/* Ingestion Console (7 Columns) */}
            <div className="lg:col-span-7 bg-surface-container-lowest border border-border-subtle rounded p-space-lg shadow-xs flex flex-col gap-space-md">
              <div className="border-b border-border-subtle pb-space-sm flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-label-caps text-secondary font-semibold uppercase">
                    Curriculum Vault Dispatch
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                    Open Lecture &amp; Syllabus Ingestion
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-warm border border-border-subtle font-code-tabular text-xs text-on-surface-variant">
                  FORMAT: KTU-V24
                </span>
              </div>

              <form onSubmit={handleCommitLecture} className="space-y-4">
                {/* YouTube URL Validator Panel */}
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold flex items-center justify-between">
                    <span>LECTURE SOURCE URL (YOUTUBE / CANONICAL EMBED)</span>
                    <span
                      className={`text-xs font-code-tabular ${
                        urlStatus === "valid"
                          ? "text-status-success font-semibold"
                          : urlStatus === "invalid"
                          ? "text-status-danger font-semibold"
                          : "text-outline font-normal"
                      }`}
                    >
                      {urlStatus === "valid" && "✓ Valid YouTube Stream URL"}
                      {urlStatus === "invalid" && "✕ Invalid Domain (Must be youtube.com / youtu.be)"}
                      {urlStatus === "idle" && "Awaiting input"}
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg pointer-events-none">
                        smart_display
                      </span>
                      <input
                        type="url"
                        value={ytUrl}
                        onChange={(e) => handleYtInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full bg-surface-container-lowest border border-border-firm pl-9 pr-3 py-2 font-code-tabular text-code-tabular text-on-surface placeholder:text-outline rounded focus:border-primary focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleYtInput("https://www.youtube.com/watch?v=k9fG_81M0aQ")
                      }
                      className="bg-surface-warm border border-border-firm hover:border-primary px-3 py-2 rounded font-code-tabular text-code-tabular text-on-surface flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">sync</span>
                      Sample URL
                    </button>
                  </div>
                  <p className="font-body-sm text-xs text-outline">
                    Strict YouTube-first compliance: validates canonical IDs, rejects arbitrary iframes.
                  </p>
                </div>

                {/* Video Preview Scrape Simulation */}
                {videoPreview.visible && (
                  <div className="bg-surface-warm border border-border-subtle p-3 rounded flex gap-3 items-center animate-in fade-in">
                    <div className="w-32 h-20 bg-surface-canvas rounded border border-border-firm flex items-center justify-center text-outline overflow-hidden relative shrink-0">
                      <span className="material-symbols-outlined text-2xl text-status-danger">
                        play_circle
                      </span>
                      <div className="absolute bottom-1 right-1 px-1 bg-black/80 text-white font-code-tabular text-[0.625rem] rounded">
                        52:14
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-label-caps text-[0.625rem] text-secondary font-bold">
                        EXTRACTED VIDEO PAYLOAD
                      </span>
                      <h4 className="font-body-md text-sm font-semibold text-primary truncate">
                        {videoPreview.title}
                      </h4>
                      <p className="font-code-tabular text-xs text-on-surface-variant">
                        Video ID: {videoPreview.videoId} • 1080p Embed Ready
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.2 rounded bg-surface border border-border-firm font-code-tabular text-[0.6875rem] text-status-success">
                          Transcript Available
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-surface border border-border-firm font-code-tabular text-[0.6875rem] text-on-surface-variant">
                          Timestamped Index
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Course & Module Assignment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
                      TARGET SYLLABUS COURSE
                    </label>
                    <select
                      value={targetCourse}
                      onChange={(e) => setTargetCourse(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-border-firm px-3 py-2 font-code-tabular text-code-tabular text-on-surface rounded focus:border-primary focus:outline-none"
                    >
                      {subjects.map((sub) => {
                        const codeVal = sub.code || sub.id;
                        const titleVal = (sub as any).title || (sub as any).name || sub.id;
                        return (
                          <option key={sub.id} value={codeVal}>
                            {codeVal}: {titleVal}
                          </option>
                        );
                      })}
                      {subjects.length === 0 && (
                        <>
                          <option value="CST301">CST301: Formal Languages &amp; Automata</option>
                          <option value="CST303">CST303: Computer Networks Architecture</option>
                          <option value="ECT202">ECT202: Analog Integrated Circuits</option>
                          <option value="MET204">MET204: Manufacturing Technologies</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
                      MODULE CADENCE
                    </label>
                    <select
                      value={targetModule}
                      onChange={(e) => setTargetModule(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-border-firm px-3 py-2 font-code-tabular text-code-tabular text-on-surface rounded focus:border-primary focus:outline-none"
                    >
                      <option value="M1">Module 01: Foundations &amp; Alphabets</option>
                      <option value="M2">Module 02: Deterministic Finite Automata (DFA)</option>
                      <option value="M3">Module 03: NFA to DFA Equivalence &amp; Min</option>
                      <option value="M4">Module 04: Pushdown Automata &amp; CFLs</option>
                      <option value="M5">Module 05: Turing Machine Computability</option>
                    </select>
                  </div>
                </div>

                {/* Lecture Notes Attachment */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
                    SYLLABUS COMPANION CITATION &amp; NOTES (.PDF / .MD)
                  </label>
                  <div className="border-2 border-dashed border-border-firm hover:border-primary rounded p-4 text-center cursor-pointer bg-surface-warm transition-colors flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-outline mb-1">
                      upload_file
                    </span>
                    <span className="font-body-sm text-sm text-on-surface font-medium">
                      Click to attach verified course notes or drag file
                    </span>
                    <span className="font-code-tabular text-xs text-outline">
                      Max: 45MB • PDF, EPUB, or LaTeX package
                    </span>
                  </div>
                </div>

                {/* Verification Checkboxes */}
                <div className="bg-surface-warm border border-border-subtle p-3 rounded flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer font-body-sm text-xs text-on-surface">
                    <input defaultChecked className="accent-primary rounded-xs w-4 h-4" type="checkbox" />
                    <span>Confirm content conforms to KTU 2019/2024 scheme syllabus outcome mapping.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-body-sm text-xs text-on-surface">
                    <input defaultChecked className="accent-primary rounded-xs w-4 h-4" type="checkbox" />
                    <span>Publish automatically to FOLE Vault public student portal index.</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-space-sm pt-space-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setYtUrl("");
                      setUrlStatus("idle");
                      setVideoPreview({ visible: false });
                    }}
                    className="px-4 py-2 border border-border-firm text-on-surface rounded font-code-tabular text-code-tabular hover:bg-surface-warm transition-colors"
                  >
                    Reset Fields
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary hover:bg-secondary text-on-primary rounded font-code-tabular text-code-tabular font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">archive</span>
                    Commit Lecture to Vault
                  </button>
                </div>
              </form>
            </div>

            {/* Moderation Queue & Pending Submissions (Col 8-12) */}
            <div className="lg:col-span-5 bg-surface-container-lowest border border-border-subtle rounded p-space-lg shadow-xs flex flex-col gap-space-md">
              <div className="border-b border-border-subtle pb-space-sm flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-label-caps text-status-warning font-semibold uppercase">
                    Pending Peer Review
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                    Lecture Moderation
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-warm border border-border-subtle font-code-tabular text-xs text-on-surface-variant">
                  {moderationQueue.length} Queued
                </span>
              </div>

              <div className="flex flex-col divide-y divide-border-subtle">
                {moderationQueue.map((item) => (
                  <div key={item.id} className="py-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-code-tabular text-xs font-bold text-primary">
                        {item.course} • {item.module}
                      </span>
                      <span className="font-label-caps text-[0.625rem] px-1.5 py-0.5 rounded bg-surface-warm border border-border-firm text-outline">
                        {item.time}
                      </span>
                    </div>
                    <h5 className="font-body-sm text-sm font-semibold text-on-surface">
                      {item.title}
                    </h5>
                    <p className="font-code-tabular text-xs text-outline truncate">
                      {item.faculty}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-code-tabular text-xs text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">link</span>
                        {item.link}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            setConfirmModal({
                              open: true,
                              title: "Reject Lecture Submission",
                              message: `Reject submission for ${item.course} ${item.module}?`,
                              actionKey: "REJECT_LECTURE",
                              targetId: item.id,
                            })
                          }
                          className="px-2 py-1 rounded border border-border-firm text-status-danger hover:bg-error-container text-xs font-code-tabular"
                          type="button"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveQueueItem(item.id, item.course)}
                          className="px-2.5 py-1 rounded bg-primary hover:bg-secondary text-on-primary text-xs font-code-tabular font-medium"
                          type="button"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: REAL-TIME SPACE CHECK-IN DESK LOGS                */}
        {/* ======================================================== */}
        {activeTab === "checkin" && (
          <div className="flex flex-col gap-space-lg">
            {/* Desk Terminal Action Banner */}
            <div className="bg-surface-warm border border-border-subtle p-space-md rounded flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded bg-surface-container border border-border-firm flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">sensors</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                    Physical Sanctum NFC Scanner [Desk 01]
                  </h3>
                  <p className="font-code-tabular text-xs text-on-surface-variant">
                    Listening for hardware card swipes • Baud rate 9600 • Gateway IP: 192.168.1.144
                  </p>
                </div>
              </div>

              {/* Manual Card Tap Simulator & Override */}
              <form onSubmit={handleManualCheckIn} className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={manualRfid}
                  onChange={(e) => setManualRfid(e.target.value)}
                  placeholder="Type KTU Reg or Scan Card..."
                  className="bg-surface-container-lowest border border-border-firm px-3 py-2 font-code-tabular text-code-tabular text-on-surface rounded focus:border-primary focus:outline-none w-full md:w-64"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-secondary text-on-primary px-3 py-2 rounded font-code-tabular text-code-tabular font-semibold whitespace-nowrap transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">tap_and_play</span>
                  Record Tap
                </button>
              </form>
            </div>

            {/* Real-Time Access Log Table */}
            <div className="w-full bg-surface-container-lowest border border-border-subtle rounded overflow-hidden shadow-xs">
              <div className="border-b border-border-subtle px-4 py-3 bg-surface flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-label-caps text-label-caps text-secondary font-bold">
                    REAL-TIME ACCESS FEED
                  </span>
                  <span className="w-2 h-2 rounded-full bg-status-success animate-ping"></span>
                </div>
                <div className="font-code-tabular text-xs text-outline">
                  Total active seats occupied: <span className="font-bold text-primary">84 / 110</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-body-sm text-body-sm">
                  <thead>
                    <tr className="bg-surface-warm border-b border-border-subtle font-label-caps text-label-caps text-on-surface-variant">
                      <th className="py-3 px-4">TIMESTAMP</th>
                      <th className="py-3 px-4">SCHOLAR / VISITOR</th>
                      <th className="py-3 px-4">REG NUMBER</th>
                      <th className="py-3 px-4">ASSIGNED DESK / NODE</th>
                      <th className="py-3 px-4">SESSION DURATION</th>
                      <th className="py-3 px-4">EVENT TYPE</th>
                      <th className="py-3 px-4 text-right">MANUAL OVERRIDE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle font-code-tabular text-code-tabular">
                    {accessLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-warm/50 transition-colors">
                        <td className="py-3 px-4 text-on-surface font-semibold">{log.time}</td>
                        <td className="py-3 px-4 font-body-sm font-semibold text-primary">{log.name}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{log.reg}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-surface-warm border border-border-subtle text-on-surface">
                            {log.desk}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 font-semibold ${
                            log.isCheckIn ? "text-status-success" : "text-outline font-normal"
                          }`}
                        >
                          {log.duration}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              log.isCheckIn ? "text-status-success" : "text-on-surface-variant"
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {log.isCheckIn ? "login" : "logout"}
                            </span>
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleOverride(log.id)}
                            className={`px-2.5 py-1 border rounded text-xs transition-colors ${
                              log.isCheckIn
                                ? "border-border-firm hover:border-status-danger hover:text-status-danger text-on-surface"
                                : "border-border-firm hover:border-primary text-on-surface"
                            }`}
                            type="button"
                          >
                            {log.isCheckIn ? "Force Check-Out" : "Re-Open Session"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle max-w-md w-full rounded p-space-lg shadow-xl flex flex-col gap-space-md animate-in zoom-in-95">
            <div className="flex items-center gap-space-sm text-status-danger">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {confirmModal.title}
              </h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {confirmModal.message}
            </p>
            <div className="bg-surface-warm border border-border-subtle p-3 rounded font-code-tabular text-xs text-outline flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">lock</span>
              <span>Action requires registrar credential signature (#8092-B).</span>
            </div>
            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                onClick={() => setConfirmModal({ open: false, title: "", message: "", actionKey: "" })}
                className="px-4 py-2 border border-border-firm text-on-surface rounded font-code-tabular text-code-tabular hover:bg-surface-warm transition-colors"
                type="button"
              >
                Cancel &amp; Abort
              </button>
              <button
                onClick={handleExecuteDestructiveAction}
                className="px-4 py-2 bg-status-danger hover:bg-status-danger/90 text-white rounded font-code-tabular text-code-tabular font-semibold transition-colors"
                type="button"
              >
                Confirm Execution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scholar Add Drawer */}
      {enrollDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="max-w-md w-full bg-surface-container-lowest border-l border-border-subtle shadow-2xl h-full flex flex-col p-space-lg justify-between animate-in slide-in-from-right">
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between border-b border-border-subtle pb-space-sm">
                <div>
                  <span className="font-label-caps text-label-caps text-secondary font-semibold uppercase">
                    Academic Admission Desk
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                    Enroll New Scholar
                  </h3>
                </div>
                <button
                  onClick={() => setEnrollDrawerOpen(false)}
                  className="p-1 hover:bg-surface-warm rounded text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form id="enroll-form" onSubmit={handleEnrollScholar} className="flex flex-col gap-space-sm">
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
                    FULL LEGAL NAME
                  </label>
                  <input
                    required
                    type="text"
                    value={newScholar.name}
                    onChange={(e) => setNewScholar({ ...newScholar, name: e.target.value })}
                    placeholder="e.g. Athira Madhavan"
                    className="w-full bg-surface-container-lowest border border-border-firm px-3 py-2 font-body-sm text-on-surface rounded focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
                    KTU REGISTRATION ID
                  </label>
                  <input
                    required
                    type="text"
                    value={newScholar.ktuId}
                    onChange={(e) => setNewScholar({ ...newScholar, ktuId: e.target.value })}
                    placeholder="e.g. WYD23CS050"
                    className="w-full bg-surface-container-lowest border border-border-firm px-3 py-2 font-code-tabular text-code-tabular text-on-surface rounded focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
                      BRANCH
                    </label>
                    <select
                      value={newScholar.branch}
                      onChange={(e) => setNewScholar({ ...newScholar, branch: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-border-firm px-3 py-2 font-code-tabular text-code-tabular text-on-surface rounded focus:border-primary focus:outline-none"
                    >
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="ME">ME</option>
                      <option value="CE">CE</option>
                      <option value="EEE">EEE</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
                      ADMIT YEAR
                    </label>
                    <select
                      value={newScholar.year}
                      onChange={(e) => setNewScholar({ ...newScholar, year: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-border-firm px-3 py-2 font-code-tabular text-code-tabular text-on-surface rounded focus:border-primary focus:outline-none"
                    >
                      <option>Year 1 (2024)</option>
                      <option>Year 2 (2023)</option>
                      <option>Year 3 (2022)</option>
                      <option>Year 4 (2021)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
                    CAMPUS RFID SERIAL NO.
                  </label>
                  <input
                    type="text"
                    value={newScholar.rfid}
                    onChange={(e) => setNewScholar({ ...newScholar, rfid: e.target.value })}
                    placeholder="Swipe physical card or enter HEX..."
                    className="w-full bg-surface-container-lowest border border-border-firm px-3 py-2 font-code-tabular text-code-tabular text-on-surface rounded focus:border-primary focus:outline-none"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border-subtle pt-space-md">
              <button
                type="button"
                onClick={() => setEnrollDrawerOpen(false)}
                className="px-4 py-2 border border-border-firm text-on-surface rounded font-code-tabular text-code-tabular hover:bg-surface-warm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="enroll-form"
                className="px-4 py-2 bg-primary hover:bg-secondary text-on-primary rounded font-code-tabular text-code-tabular font-semibold transition-colors"
              >
                Confirm &amp; Mint Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scholar Dossier Modal */}
      {dossierModal.open && dossierModal.scholar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle max-w-2xl w-full rounded p-space-lg shadow-2xl flex flex-col gap-space-md animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border-subtle pb-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded bg-primary text-on-primary flex items-center justify-center font-code-tabular font-bold">
                  KTU
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-primary">
                    {dossierModal.scholar.name}
                  </h3>
                  <span className="font-code-tabular text-xs text-outline">
                    REG: {dossierModal.scholar.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDossierModal({ open: false, scholar: null })}
                className="p-1 hover:bg-surface-warm rounded text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm font-code-tabular text-code-tabular">
              <div className="bg-surface-warm p-3 rounded border border-border-subtle">
                <span className="font-label-caps text-[0.625rem] text-outline block">ACADEMIC BRANCH</span>
                <span className="text-sm font-bold text-primary">{dossierModal.scholar.branch}</span>
              </div>
              <div className="bg-surface-warm p-3 rounded border border-border-subtle">
                <span className="font-label-caps text-[0.625rem] text-outline block">VAULT ATTENDANCE</span>
                <span className="text-sm font-bold text-status-success">
                  {dossierModal.scholar.attendancePercent}%
                </span>
              </div>
              <div className="bg-surface-warm p-3 rounded border border-border-subtle">
                <span className="font-label-caps text-[0.625rem] text-outline block">SANCTUM ACCESS KEY</span>
                <span className="text-sm font-bold text-primary">ENABLED (A-08)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant font-semibold">
                ATTENDANCE LOG CHRONOLOGY
              </span>
              <div className="border border-border-subtle rounded divide-y divide-border-subtle font-code-tabular text-xs max-h-40 overflow-y-auto">
                <div className="p-2 flex justify-between bg-surface-container-lowest">
                  <span>2025-02-24 • CST301 Lecture 12</span>
                  <span className="text-status-success font-semibold">ATTENDED (98m)</span>
                </div>
                <div className="p-2 flex justify-between bg-surface-container-lowest">
                  <span>2025-02-22 • Open Peer Colloquium #04</span>
                  <span className="text-status-success font-semibold">ATTENDED (120m)</span>
                </div>
                <div className="p-2 flex justify-between bg-surface-container-lowest">
                  <span>2025-02-19 • CST303 Lab Demonstration</span>
                  <span className="text-status-success font-semibold">ATTENDED (180m)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-space-xs">
              <button
                onClick={() => setDossierModal({ open: false, scholar: null })}
                className="px-4 py-2 border border-border-firm text-on-surface rounded font-code-tabular text-code-tabular hover:bg-surface-warm"
                type="button"
              >
                Close Dossier
              </button>
              <button
                onClick={() => alert(`Official Transcript minted for ${dossierModal.scholar?.name}`)}
                className="px-4 py-2 bg-primary hover:bg-secondary text-on-primary rounded font-code-tabular text-code-tabular font-medium flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Print Official Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
