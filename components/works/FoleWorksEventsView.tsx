"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { WorksActivity } from "@/types";

interface FoleWorksEventsViewProps {
  initialActivities?: WorksActivity[];
  error?: string | null;
}

export function FoleWorksEventsView({
  initialActivities = [],
  error = null,
}: FoleWorksEventsViewProps) {
  // State
  const [activeTab, setActiveTab] = useState<"upcoming" | "archives">("upcoming");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [charterModalOpen, setCharterModalOpen] = useState(false);
  const [registerModal, setRegisterModal] = useState<{
    open: boolean;
    title: string;
    code: string;
    type: "register" | "waitlist" | "proposal" | "drafting";
  }>({ open: false, title: "", code: "", type: "register" });

  const [registeredSuccess, setRegisteredSuccess] = useState<string | null>(null);

  // Proposal form state
  const [proposalData, setProposalData] = useState({
    title: "",
    convener: "",
    node: "Node 01: Hardware Annex",
    format: "Intensive Workshop",
    abstract: "",
  });

  // Featured Stitch events catalog
  const featuredEvents = useMemo(() => [
    {
      id: "ws-2409",
      code: "#WS-2409",
      badge: "Intensive Workshop · 3 Days",
      status: "Registration Open",
      category: "workshops",
      title: "Rust Systems Programming Bootcamp",
      description:
        "Deconstruct bare-metal concurrency, zero-cost abstractions, memory ownership semantics, and async runtime internals. Includes direct synthesis exercises compiling custom OS kernels for RISC-V SBCs.",
      date: "Nov 14–16, 2024",
      time: "09:00 – 17:30 IST",
      convener: "Dr. Arvind Varman (Embedded Kernel Lead, OpenFirm)",
      location: "Node 01: Hardware Annex & P2P Streaming Node",
      prerequisites: "C/C++ familiarity or FOLE-CS-201",
      ticketTier: "Free for FOLE Members",
      capacityCap: "32 Seats Remaining / 45 Total",
      image: "/stitch/bootcamp-poster.png",
      actionType: "register" as const,
      actionLabel: "Register Seat",
    },
    {
      id: "gt-1102",
      code: "#GT-1102",
      badge: "Hybrid Lecture",
      status: "Waitlist",
      category: "guest-talks",
      title: "Career in Hardware Engineering Q&A",
      description:
        "An unvarnished breakdown of ASIC layout, FPGA validation pipelines, semiconductor fabrication realities, and breaking into physical compute architecture without standard corporate pipelines.",
      date: "Nov 22, 2024",
      time: "18:30 IST",
      convener: "Meera Nambiar (Principal Silicon Architect, Tensilica Alum)",
      location: "Studio 4C & Commons Audio Stream",
      prerequisites: "Open to all disciplines",
      ticketTier: "Capacity Reached (60)",
      capacityCap: "Waitlist Queue: 14 Active",
      image: "/stitch/folenex-space.png",
      actionType: "waitlist" as const,
      actionLabel: "Join Active Waitlist",
    },
    {
      id: "hk-4801",
      code: "#HK-4801",
      badge: "48-Hour Open Sprint",
      status: "Registration Open",
      category: "hackathons",
      title: "Autonomous Robotics Hackathon",
      description:
        "Design, calibrate, and navigate micro-UGVs through physical obstacle terrains using ROS 2, OpenCV, and edge compute micro-controllers. All parts, sensors, and power benches provided by FOLE Makers Vault.",
      date: "Dec 06–08, 2024",
      time: "Kickoff 18:00 Friday",
      convener: "FOLE Robotics Collective & FabLab Guild",
      location: "Central FabLab, Node 02",
      prerequisites: "Team Size: 2 to 4 Fellows",
      ticketTier: "Open & Free (Application Req.)",
      capacityCap: "Prize Pool: ₹1,50,000 Hardware Grants",
      image: "/stitch/bootcamp-banner.png",
      actionType: "proposal" as const,
      actionLabel: "Submit Team Proposal",
    },
    {
      id: "sc-0814",
      code: "#SC-0814",
      badge: "Public Curriculum Initiative",
      status: "Open Contribution",
      category: "study-circles",
      title: "Open Source KTU Syllabus Sprint",
      description:
        "Collaborative sprint to compile, annotate, and publicly host modular study guides, verified lab solutions, and open lecture transcripts for the revised KTU Engineering Curriculum across B.Tech branches.",
      date: "Dec 14, 2024",
      time: "10:00 – 16:00 IST",
      convener: "Academic Curation Ledger Working Group",
      location: "Hybrid (Commons Desk + Jitsi)",
      prerequisites: "Signals, OS, & Structures Focus",
      ticketTier: "CC-BY-SA 4.0 Public",
      capacityCap: "Git-Backed Peer Assembly",
      image: "/stitch/ee-assignment-cover.png",
      actionType: "drafting" as const,
      actionLabel: "Join Drafting Desk",
    },
  ], []);

  // Filter logic
  const filteredEvents = useMemo(() => {
    return featuredEvents.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.convener.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [featuredEvents, selectedCategory, searchQuery]);

  // Handle action click
  const handleAction = (eventItem: (typeof featuredEvents)[0]) => {
    setRegisterModal({
      open: true,
      title: eventItem.title,
      code: eventItem.code,
      type: eventItem.actionType,
    });
  };

  // Submit registration
  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisteredSuccess(
      `Credential Verified: Scholar entry confirmed for ${registerModal.code} (${registerModal.title}). Check-in barcode dispatched to scholar profile.`
    );
    setRegisterModal({ open: false, title: "", code: "", type: "register" });
    setTimeout(() => setRegisteredSuccess(null), 6000);
  };

  // Submit assembly proposal
  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisteredSuccess(
      `Assembly Proposal Received: "${proposalData.title}" assigned Docket #AP-${Math.floor(
        1000 + Math.random() * 9000
      )}. The Assembly Stewards will review within 48 hours.`
    );
    setProposalModalOpen(false);
    setProposalData({
      title: "",
      convener: "",
      node: "Node 01: Hardware Annex",
      format: "Intensive Workshop",
      abstract: "",
    });
    setTimeout(() => setRegisteredSuccess(null), 6000);
  };

  return (
    <div className="flex flex-col w-full bg-surface-canvas text-on-surface font-body min-h-screen">
      {/* Success Notification Banner */}
      {registeredSuccess && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-primary text-on-primary p-space-md rounded border border-border-firm shadow-lg flex items-start gap-space-sm animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-status-success shrink-0 text-xl">
            check_circle
          </span>
          <div className="text-body-sm">
            <p className="font-bold font-code-tabular">SCHOLAR VERIFIED</p>
            <p className="mt-1">{registeredSuccess}</p>
          </div>
          <button
            onClick={() => setRegisteredSuccess(null)}
            className="text-on-primary hover:opacity-75 ml-auto text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Utility Ribbon / Editorial Filter Header */}
      <div className="w-full bg-surface-warm border-b border-border-subtle py-space-md px-gutter">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-space-xs font-label-caps text-label-caps text-secondary uppercase tracking-widest mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
              Assembly Docket · Fall 2024 / Spring 2025
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Works, Events &amp; Workshops
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl mt-1">
              Open-format academic laboratory sessions, peer hack sprints, and practitioner discourse held across decentralized physical nodes and open tele-canvases.
            </p>
          </div>

          {/* State Toggle (Upcoming / Archives) */}
          <div className="flex items-center bg-surface-canvas p-1 rounded border border-border-subtle self-stretch md:self-auto justify-between">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-space-md py-1.5 rounded font-label-caps text-label-caps uppercase transition-colors ${
                activeTab === "upcoming"
                  ? "bg-primary text-on-primary font-bold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
              type="button"
            >
              Upcoming (4)
            </button>
            <button
              onClick={() => setActiveTab("archives")}
              className={`px-space-md py-1.5 rounded font-label-caps text-label-caps uppercase transition-colors ${
                activeTab === "archives"
                  ? "bg-primary text-on-primary font-bold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
              type="button"
            >
              Past Archives (28)
            </button>
          </div>
        </div>
      </div>

      {/* Filter Rail & Live Counter (Sticky) */}
      <div className="w-full bg-surface-card border-b border-border-subtle sticky top-16 z-30 px-gutter shadow-xs">
        <div className="max-w-7xl mx-auto py-space-sm flex flex-wrap items-center justify-between gap-space-sm">
          {/* Category Badges */}
          <div className="flex flex-wrap items-center gap-space-xs">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1 rounded font-code-tabular text-code-tabular font-medium transition-all ${
                selectedCategory === "all"
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-warm text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              All Disciplines <span className="ml-1 opacity-75 text-xs font-normal">/ 04</span>
            </button>

            <button
              onClick={() => setSelectedCategory("workshops")}
              className={`px-3 py-1 rounded font-code-tabular text-code-tabular font-medium transition-all ${
                selectedCategory === "workshops"
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-warm text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              Workshops <span className="ml-1 opacity-60 text-xs">01</span>
            </button>

            <button
              onClick={() => setSelectedCategory("hackathons")}
              className={`px-3 py-1 rounded font-code-tabular text-code-tabular font-medium transition-all ${
                selectedCategory === "hackathons"
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-warm text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              Hackathons <span className="ml-1 opacity-60 text-xs">01</span>
            </button>

            <button
              onClick={() => setSelectedCategory("study-circles")}
              className={`px-3 py-1 rounded font-code-tabular text-code-tabular font-medium transition-all ${
                selectedCategory === "study-circles"
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-warm text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              Study Circles <span className="ml-1 opacity-60 text-xs">01</span>
            </button>

            <button
              onClick={() => setSelectedCategory("guest-talks")}
              className={`px-3 py-1 rounded font-code-tabular text-code-tabular font-medium transition-all ${
                selectedCategory === "guest-talks"
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-warm text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              Guest Talks <span className="ml-1 opacity-60 text-xs">01</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-space-sm">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined text-outline absolute left-2 text-base pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "upcoming"
                    ? "Search title, speaker, protocol..."
                    : "Search past archival works..."
                }
                className="font-code-tabular text-code-tabular bg-surface-warm pl-8 pr-3 py-1 rounded border border-border-subtle focus:outline-none focus:border-primary text-on-surface w-48 sm:w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-outline hover:text-primary text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="font-code-tabular text-code-tabular text-outline hidden lg:inline">
              SYNCED: 10:42 UTC
            </span>
          </div>
        </div>
      </div>

      {/* Primary Asymmetric Editorial Grid */}
      <div className="max-w-7xl mx-auto px-gutter py-space-xl w-full flex-1">
        {error && (
          <div className="mb-space-md p-space-md rounded bg-surface-warm border border-status-danger/30 text-status-danger text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-surface-card rounded border border-border-subtle p-space-xl">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">
              event_busy
            </span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-primary">
              No matching assemblies located
            </h3>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Adjust your search keywords or category filters to view other scheduled works.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 bg-primary text-on-primary rounded font-label-caps text-label-caps uppercase"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            {/* EVENT 01: Rust Systems Programming (Hero Asymmetric Feature: 8 Columns) */}
            {filteredEvents.find((e) => e.id === "ws-2409") && (
              <article className="event-card lg:col-span-8 bg-surface-card border border-border-subtle rounded flex flex-col overflow-hidden hover:border-primary transition-colors">
                {/* Card Top Bar: Meta Info */}
                <div className="px-space-md py-space-xs bg-surface-warm border-b border-border-subtle flex items-center justify-between font-code-tabular text-code-tabular">
                  <div className="flex items-center gap-space-sm">
                    <span className="text-secondary font-bold">#WS-2409</span>
                    <span className="text-outline">/</span>
                    <span className="uppercase tracking-wider text-on-surface-variant font-label-caps text-label-caps">
                      Intensive Workshop · 3 Days
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-semibold text-xs border border-border-firm">
                    Registration Open
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 flex-1">
                  {/* Flyer Media Area */}
                  <div className="md:col-span-5 relative bg-surface-container flex flex-col justify-between overflow-hidden p-space-md border-b md:border-b-0 md:border-r border-border-subtle min-h-[260px]">
                    <div className="relative w-full h-64 md:h-full min-h-[220px]">
                      <Image
                        src="/stitch/bootcamp-poster.png"
                        alt="Rust systems programming workshop poster flyer"
                        fill
                        className="object-cover rounded"
                        priority
                      />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 bg-primary/95 text-on-primary p-space-sm rounded backdrop-blur-xs border border-border-firm/20">
                      <p className="font-label-caps text-label-caps tracking-widest text-primary-fixed uppercase">
                        Capacity Cap
                      </p>
                      <p className="font-code-tabular text-code-tabular font-bold">
                        32 Seats Remaining / 45 Total
                      </p>
                    </div>
                  </div>

                  {/* Event Dossier Details */}
                  <div className="md:col-span-7 p-space-md flex flex-col justify-between">
                    <div>
                      {/* Date & Location Anchor */}
                      <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 text-on-surface-variant font-code-tabular text-code-tabular mb-space-xs">
                        <span className="flex items-center gap-1 text-primary font-semibold">
                          <span className="material-symbols-outlined text-base">calendar_today</span>
                          Nov 14–16, 2024
                        </span>
                        <span className="text-outline">•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">schedule</span>
                          09:00 – 17:30 IST
                        </span>
                      </div>

                      <h2 className="font-headline-md text-headline-md text-primary font-bold tracking-tight mb-space-xs">
                        Rust Systems Programming Bootcamp
                      </h2>

                      <p className="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed">
                        Deconstruct bare-metal concurrency, zero-cost abstractions, memory ownership semantics, and async runtime internals. Includes direct synthesis exercises compiling custom OS kernels for RISC-V SBCs.
                      </p>

                      {/* Curated Metadata Breakdown */}
                      <div className="bg-surface-warm p-space-sm rounded border border-border-subtle space-y-2 mb-space-md">
                        <div className="flex items-start justify-between text-body-sm font-body-sm">
                          <span className="text-outline font-label-caps text-label-caps uppercase">Convener:</span>
                          <span className="font-semibold text-primary text-right">
                            Dr. Arvind Varman (Embedded Kernel Lead, OpenFirm)
                          </span>
                        </div>
                        <div className="flex items-start justify-between text-body-sm font-body-sm">
                          <span className="text-outline font-label-caps text-label-caps uppercase">Location:</span>
                          <span className="text-on-surface text-right">
                            Node 01: Hardware Annex &amp; P2P Streaming Node
                          </span>
                        </div>
                        <div className="flex items-start justify-between text-body-sm font-body-sm">
                          <span className="text-outline font-label-caps text-label-caps uppercase">Prerequisites:</span>
                          <span className="font-code-tabular text-code-tabular text-on-surface text-right">
                            C/C++ familiarity or FOLE-CS-201
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action Row */}
                    <div className="pt-space-sm border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-space-sm">
                      <div>
                        <span className="font-label-caps text-label-caps text-outline block uppercase">
                          Ticket Tier
                        </span>
                        <span className="font-body-md text-body-md font-bold text-status-success">
                          Free for FOLE Members
                        </span>
                      </div>
                      <div className="flex items-center gap-space-xs w-full sm:w-auto">
                        <button
                          onClick={() => handleAction(featuredEvents[0])}
                          className="w-full sm:w-auto px-space-md py-2 bg-primary text-on-primary rounded font-label-caps text-label-caps uppercase tracking-wider font-semibold hover:bg-secondary transition-colors text-center"
                          type="button"
                        >
                          Register Seat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* EVENT 02: Career in Hardware Engineering (4 Columns Sidebar Feature) */}
            {filteredEvents.find((e) => e.id === "gt-1102") && (
              <article className="event-card lg:col-span-4 bg-surface-card border border-border-subtle rounded flex flex-col justify-between overflow-hidden hover:border-primary transition-colors">
                <div>
                  {/* Header Tag */}
                  <div className="px-space-md py-space-xs bg-surface-warm border-b border-border-subtle flex items-center justify-between font-code-tabular text-code-tabular">
                    <span className="text-secondary font-bold">#GT-1102</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-semibold text-xs border border-border-subtle">
                      Waitlist
                    </span>
                  </div>

                  {/* Flyer Square Poster */}
                  <div className="relative bg-surface-warm border-b border-border-subtle h-44 overflow-hidden">
                    <Image
                      src="/stitch/folenex-space.png"
                      alt="Hardware Engineering Discourse Poster"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-surface-canvas/90 px-2 py-1 rounded border border-border-firm font-label-caps text-label-caps text-primary uppercase">
                      Hybrid Lecture
                    </div>
                  </div>

                  <div className="p-space-md">
                    <div className="font-code-tabular text-code-tabular text-on-surface-variant mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-base text-primary">event</span>
                      Nov 22, 2024 · 18:30 IST
                    </div>
                    <h2 className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight mb-space-xs">
                      Career in Hardware Engineering Q&amp;A
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md leading-relaxed">
                      An unvarnished breakdown of ASIC layout, FPGA validation pipelines, semiconductor fabrication realities, and breaking into physical compute architecture without standard corporate pipelines.
                    </p>
                    <div className="border-t border-b border-border-subtle py-space-xs space-y-1 mb-space-sm font-body-sm text-body-sm">
                      <p>
                        <span className="text-outline font-label-caps text-label-caps uppercase">Lead:</span>{" "}
                        <strong className="text-on-surface">Meera Nambiar</strong> (Principal Silicon Architect, Tensilica Alum)
                      </p>
                      <p>
                        <span className="text-outline font-label-caps text-label-caps uppercase">Venue:</span>{" "}
                        Studio 4C &amp; Commons Audio Stream
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-space-md pt-0">
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-caps text-label-caps text-outline uppercase">Admission</span>
                    <span className="font-code-tabular text-code-tabular text-status-warning font-semibold">
                      Capacity Reached (60)
                    </span>
                  </div>
                  <button
                    onClick={() => handleAction(featuredEvents[1])}
                    className="w-full py-2 bg-surface-warm border border-border-firm text-on-surface rounded font-label-caps text-label-caps uppercase tracking-wider font-semibold hover:bg-surface-canvas transition-colors"
                    type="button"
                  >
                    Join Active Waitlist
                  </button>
                </div>
              </article>
            )}

            {/* EVENT 03: Autonomous Robotics Hackathon (6 Columns Grid Card) */}
            {filteredEvents.find((e) => e.id === "hk-4801") && (
              <article className="event-card lg:col-span-6 bg-surface-card border border-border-subtle rounded flex flex-col justify-between overflow-hidden hover:border-primary transition-colors">
                <div>
                  <div className="px-space-md py-space-xs bg-surface-warm border-b border-border-subtle flex items-center justify-between font-code-tabular text-code-tabular">
                    <div className="flex items-center gap-space-xs">
                      <span className="text-secondary font-bold">#HK-4801</span>
                      <span className="text-outline">/</span>
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        48-Hour Open Sprint
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-semibold text-xs border border-border-firm">
                      Registration Open
                    </span>
                  </div>

                  <div className="relative bg-surface-container border-b border-border-subtle h-52 overflow-hidden">
                    <Image
                      src="/stitch/bootcamp-banner.png"
                      alt="Autonomous Robotics Hackathon Blueprint"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-surface-card/90 px-2 py-1 rounded border border-border-firm font-code-tabular text-code-tabular text-primary">
                      Prize Pool: ₹1,50,000 Hardware Grants
                    </div>
                  </div>

                  <div className="p-space-md">
                    <div className="flex items-center gap-2 font-code-tabular text-code-tabular text-on-surface-variant mb-1">
                      <span className="text-primary font-bold">Dec 06–08, 2024</span>
                      <span>•</span>
                      <span>Kickoff 18:00 Friday</span>
                    </div>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold tracking-tight mb-space-xs">
                      Autonomous Robotics Hackathon
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed">
                      Design, calibrate, and navigate micro-UGVs through physical obstacle terrains using ROS 2, OpenCV, and edge compute micro-controllers. All parts, sensors, and power benches provided by FOLE Makers Vault.
                    </p>
                    <div className="grid grid-cols-2 gap-space-xs bg-surface-warm p-space-sm rounded border border-border-subtle font-body-sm text-body-sm mb-space-sm">
                      <div>
                        <span className="text-outline font-label-caps text-label-caps block uppercase">Venue</span>
                        <span className="font-semibold text-on-surface">Central FabLab, Node 02</span>
                      </div>
                      <div>
                        <span className="text-outline font-label-caps text-label-caps block uppercase">Team Size</span>
                        <span className="font-semibold text-on-surface">2 to 4 Fellows</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-space-md pt-0 border-t border-border-subtle mt-2 flex items-center justify-between gap-space-sm">
                  <div>
                    <span className="font-label-caps text-label-caps text-outline block uppercase">Entry Cost</span>
                    <span className="font-body-md text-body-md font-bold text-primary">
                      Open &amp; Free (Application Req.)
                    </span>
                  </div>
                  <button
                    onClick={() => handleAction(featuredEvents[2])}
                    className="px-space-md py-2 bg-primary text-on-primary rounded font-label-caps text-label-caps uppercase tracking-wider font-semibold hover:bg-secondary transition-colors"
                    type="button"
                  >
                    Submit Team Proposal
                  </button>
                </div>
              </article>
            )}

            {/* EVENT 04: Open Source KTU Syllabus Sprint (6 Columns Grid Card) */}
            {filteredEvents.find((e) => e.id === "sc-0814") && (
              <article className="event-card lg:col-span-6 bg-surface-card border border-border-subtle rounded flex flex-col justify-between overflow-hidden hover:border-primary transition-colors">
                <div>
                  <div className="px-space-md py-space-xs bg-surface-warm border-b border-border-subtle flex items-center justify-between font-code-tabular text-code-tabular">
                    <div className="flex items-center gap-space-xs">
                      <span className="text-secondary font-bold">#SC-0814</span>
                      <span className="text-outline">/</span>
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        Public Curriculum Initiative
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-semibold text-xs border border-border-firm">
                      Open Contribution
                    </span>
                  </div>

                  <div className="relative bg-surface-container border-b border-border-subtle h-52 overflow-hidden">
                    <Image
                      src="/stitch/ee-assignment-cover.png"
                      alt="Open Source KTU Syllabus Sprint"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-surface-card/90 px-2 py-1 rounded border border-border-firm font-code-tabular text-code-tabular text-primary">
                      Git-Backed Peer Assembly
                    </div>
                  </div>

                  <div className="p-space-md">
                    <div className="flex items-center gap-2 font-code-tabular text-code-tabular text-on-surface-variant mb-1">
                      <span className="text-primary font-bold">Dec 14, 2024</span>
                      <span>•</span>
                      <span>10:00 – 16:00 IST</span>
                    </div>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold tracking-tight mb-space-xs">
                      Open Source KTU Syllabus Sprint
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed">
                      Collaborative sprint to compile, annotate, and publicly host modular study guides, verified lab solutions, and open lecture transcripts for the revised KTU Engineering Curriculum across B.Tech branches.
                    </p>
                    <div className="grid grid-cols-2 gap-space-xs bg-surface-warm p-space-sm rounded border border-border-subtle font-body-sm text-body-sm mb-space-sm">
                      <div>
                        <span className="text-outline font-label-caps text-label-caps block uppercase">Focus Areas</span>
                        <span className="font-semibold text-on-surface">Signals, OS, &amp; Structures</span>
                      </div>
                      <div>
                        <span className="text-outline font-label-caps text-label-caps block uppercase">Format</span>
                        <span className="font-semibold text-on-surface">Hybrid (Commons Desk + Jitsi)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-space-md pt-0 border-t border-border-subtle mt-2 flex items-center justify-between gap-space-sm">
                  <div>
                    <span className="font-label-caps text-label-caps text-outline block uppercase">Access License</span>
                    <span className="font-body-md text-body-md font-bold text-primary">
                      CC-BY-SA 4.0 Public
                    </span>
                  </div>
                  <button
                    onClick={() => handleAction(featuredEvents[3])}
                    className="px-space-md py-2 bg-surface-warm border border-border-firm text-primary hover:bg-primary hover:text-on-primary rounded font-label-caps text-label-caps uppercase tracking-wider font-semibold transition-colors"
                    type="button"
                  >
                    Join Drafting Desk
                  </button>
                </div>
              </article>
            )}

            {/* Additional Database Works Activities (if published in database) */}
            {initialActivities.length > 0 &&
              initialActivities.map((act) => (
                <article
                  key={act.id}
                  className="event-card lg:col-span-6 bg-surface-card border border-border-subtle rounded flex flex-col justify-between overflow-hidden hover:border-primary transition-colors"
                >
                  <div>
                    <div className="px-space-md py-space-xs bg-surface-warm border-b border-border-subtle flex items-center justify-between font-code-tabular text-code-tabular">
                      <div className="flex items-center gap-space-xs">
                        <span className="text-secondary font-bold">#{act.slug.toUpperCase()}</span>
                        <span className="text-outline">/</span>
                        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                          {act.category || "General Activity"}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-semibold text-xs border border-border-firm">
                        {act.delivery_mode.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <div className="p-space-md">
                      <h2 className="font-headline-md text-headline-md text-primary font-bold tracking-tight mb-space-xs">
                        {act.title}
                      </h2>
                      <p className="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed line-clamp-3">
                        {act.description || act.short_description}
                      </p>
                      {act.venue && (
                        <div className="bg-surface-warm p-space-sm rounded border border-border-subtle text-body-sm font-body-sm mb-space-sm">
                          <span className="text-outline font-label-caps text-label-caps uppercase">Venue: </span>
                          <span className="font-semibold text-on-surface">{act.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-space-md pt-0 border-t border-border-subtle mt-2 flex items-center justify-between gap-space-sm">
                    <span className="font-label-caps text-label-caps text-outline uppercase">
                      Campus Docket
                    </span>
                    <Link
                      href={`/fole-works/${act.slug}`}
                      className="px-space-md py-2 bg-primary text-on-primary rounded font-label-caps text-label-caps uppercase tracking-wider font-semibold hover:bg-secondary transition-colors"
                    >
                      View Activity Dossier →
                    </Link>
                  </div>
                </article>
              ))}
          </div>
        )}
      </div>

      {/* Physical Node / Venue Manifest Ribbon */}
      <section className="w-full bg-surface-warm border-t border-b border-border-subtle py-space-xl px-gutter">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-lg gap-space-sm">
            <div>
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block mb-1">
                Demarcated Spaces
              </span>
              <h2 className="font-headline-md text-headline-md text-primary font-bold">
                Physical &amp; Tele-Presence Nodes
              </h2>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
              Workshops leverage dedicated lab spaces equipped with test benches, logic analyzers, and quiet reflection carrels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {/* Node 1 */}
            <div className="bg-surface-card p-space-md rounded border border-border-subtle">
              <div className="flex items-center justify-between mb-space-xs font-code-tabular text-code-tabular">
                <span className="font-bold text-primary">NODE 01: HARDWARE ANNEX</span>
                <span className="w-2 h-2 rounded-full bg-status-success"></span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
                Ground floor bench with 12x Rigol DHO800 oscilloscopes, soldering stations, reflow ovens, and component reels.
              </p>
              <div className="font-label-caps text-label-caps text-outline uppercase">
                Pass-Card Access · 24/7 Fellows
              </div>
            </div>

            {/* Node 2 */}
            <div className="bg-surface-card p-space-md rounded border border-border-subtle">
              <div className="flex items-center justify-between mb-space-xs font-code-tabular text-code-tabular">
                <span className="font-bold text-primary">NODE 02: FABLAB &amp; ARENA</span>
                <span className="w-2 h-2 rounded-full bg-status-success"></span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
                Laser cutters, Voron 2.4 high-speed 3D printers, CNC routers, and an enclosed 8x8m robotics obstacle grid.
              </p>
              <div className="font-label-caps text-label-caps text-outline uppercase">
                Certified Induction Req.
              </div>
            </div>

            {/* Node 3 */}
            <div className="bg-surface-card p-space-md rounded border border-border-subtle">
              <div className="flex items-center justify-between mb-space-xs font-code-tabular text-code-tabular">
                <span className="font-bold text-primary">STUDIO 4C &amp; COMMONS</span>
                <span className="w-2 h-2 rounded-full bg-status-success"></span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
                Stepped lecture hall with multi-track directional audio, paper drafting tables, and synchronized peer screens.
              </p>
              <div className="font-label-caps text-label-caps text-outline uppercase">
                Open to Public · Hybrid Streamed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Propose an Event / Open Call Callout */}
      <section className="max-w-7xl mx-auto px-gutter py-space-2xl w-full">
        <div className="bg-primary text-on-primary rounded p-space-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg relative overflow-hidden">
          {/* Subtle Archival Vector */}
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <svg fill="currentColor" height="340" viewBox="0 0 100 100" width="340">
              <circle cx="50" cy="50" fill="none" r="48" stroke="currentColor" strokeWidth="2"></circle>
              <line stroke="currentColor" strokeWidth="1" x1="50" x2="50" y1="0" y2="100"></line>
              <line stroke="currentColor" strokeWidth="1" x1="0" x2="100" y1="50" y2="50"></line>
            </svg>
          </div>

          <div className="max-w-xl">
            <div className="font-label-caps text-label-caps text-primary-fixed uppercase tracking-wider mb-2">
              Fellow Initiated Programming
            </div>
            <h3 className="font-headline-lg text-headline-lg tracking-tight font-bold mb-space-xs text-on-primary">
              Convene your own workshop or sprint.
            </h3>
            <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">
              FOLE provides space, test hardware, component stipends, and peer attendance promotion. Any fellow can propose a peer-led session.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-space-sm w-full md:w-auto relative z-10">
            <button
              onClick={() => setProposalModalOpen(true)}
              className="px-space-lg py-3 bg-secondary-fixed text-on-secondary-fixed rounded font-label-caps text-label-caps uppercase tracking-wider font-bold hover:bg-secondary-fixed-dim transition-colors text-center"
              type="button"
            >
              Draft an Assembly Proposal
            </button>
            <button
              onClick={() => setCharterModalOpen(true)}
              className="px-space-lg py-3 bg-primary-container text-on-primary border border-border-firm/30 rounded font-label-caps text-label-caps uppercase tracking-wider font-semibold hover:bg-primary-container/80 transition-colors text-center"
              type="button"
            >
              Review Charter Guidelines
            </button>
          </div>
        </div>
      </section>

      {/* Registration / Waitlist Modal */}
      {registerModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card border border-border-firm rounded max-w-lg w-full p-space-lg shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-space-sm border-b border-border-subtle mb-space-md">
              <div className="flex items-center gap-2">
                <span className="font-code-tabular text-code-tabular font-bold text-secondary">
                  {registerModal.code}
                </span>
                <span className="text-outline">/</span>
                <span className="font-label-caps text-label-caps text-primary uppercase">
                  {registerModal.type.toUpperCase()} DOCKET
                </span>
              </div>
              <button
                onClick={() => setRegisterModal({ open: false, title: "", code: "", type: "register" })}
                className="text-on-surface-variant hover:text-primary text-xl"
              >
                ✕
              </button>
            </div>

            <h3 className="font-headline-sm text-headline-sm font-bold text-primary mb-2">
              {registerModal.title}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
              Complete scholar check to finalize seat allocation. Free for all verified FOLE members with academic student credentials.
            </p>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="block font-label-caps text-label-caps uppercase text-outline mb-1">
                  Scholar Roll Number / KTU ID
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. VDK21CS042"
                  className="w-full font-code-tabular text-code-tabular p-2.5 rounded bg-surface-warm border border-border-subtle focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              <div>
                <label className="block font-label-caps text-label-caps uppercase text-outline mb-1">
                  Academic Department / Branch
                </label>
                <select className="w-full font-body-sm p-2.5 rounded bg-surface-warm border border-border-subtle focus:outline-none focus:border-primary text-on-surface">
                  <option>Computer Science &amp; Engineering</option>
                  <option>Electronics &amp; Communication</option>
                  <option>Mechanical Engineering</option>
                  <option>Civil Engineering</option>
                  <option>Electrical &amp; Electronics</option>
                </select>
              </div>

              <div className="pt-space-sm border-t border-border-subtle flex items-center justify-end gap-space-sm">
                <button
                  type="button"
                  onClick={() => setRegisterModal({ open: false, title: "", code: "", type: "register" })}
                  className="px-4 py-2 font-label-caps text-label-caps uppercase text-on-surface-variant hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-on-primary rounded font-label-caps text-label-caps uppercase tracking-wider font-bold hover:bg-secondary transition-colors"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assembly Proposal Modal */}
      {proposalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card border border-border-firm rounded max-w-xl w-full p-space-lg shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-space-sm border-b border-border-subtle mb-space-md">
              <span className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
                Fellow Initiated Assembly Proposal
              </span>
              <button
                onClick={() => setProposalModalOpen(false)}
                className="text-on-surface-variant hover:text-primary text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProposalSubmit} className="space-y-4">
              <div>
                <label className="block font-label-caps text-label-caps uppercase text-outline mb-1">
                  Assembly / Workshop Title
                </label>
                <input
                  required
                  type="text"
                  value={proposalData.title}
                  onChange={(e) => setProposalData({ ...proposalData, title: e.target.value })}
                  placeholder="e.g. RISC-V Microarchitecture Synthesis Lab"
                  className="w-full font-body-sm p-2.5 rounded bg-surface-warm border border-border-subtle focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-outline mb-1">
                    Convener / Lead Fellow
                  </label>
                  <input
                    required
                    type="text"
                    value={proposalData.convener}
                    onChange={(e) => setProposalData({ ...proposalData, convener: e.target.value })}
                    placeholder="e.g. Anand R., S6 CSE"
                    className="w-full font-body-sm p-2.5 rounded bg-surface-warm border border-border-subtle focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps uppercase text-outline mb-1">
                    Format
                  </label>
                  <select
                    value={proposalData.format}
                    onChange={(e) => setProposalData({ ...proposalData, format: e.target.value })}
                    className="w-full font-body-sm p-2.5 rounded bg-surface-warm border border-border-subtle focus:outline-none focus:border-primary text-on-surface"
                  >
                    <option>Intensive Workshop</option>
                    <option>48-Hour Open Sprint</option>
                    <option>Study Circle</option>
                    <option>Practitioner Discourse</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-label-caps text-label-caps uppercase text-outline mb-1">
                  Demarcated Physical Node
                </label>
                <select
                  value={proposalData.node}
                  onChange={(e) => setProposalData({ ...proposalData, node: e.target.value })}
                  className="w-full font-body-sm p-2.5 rounded bg-surface-warm border border-border-subtle focus:outline-none focus:border-primary text-on-surface"
                >
                  <option>Node 01: Hardware Annex</option>
                  <option>Node 02: FabLab &amp; Arena</option>
                  <option>Studio 4C &amp; Commons</option>
                  <option>Decentralized Hybrid Tele-Canvas</option>
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-label-caps uppercase text-outline mb-1">
                  Syllabus / Lab Abstract
                </label>
                <textarea
                  required
                  rows={3}
                  value={proposalData.abstract}
                  onChange={(e) => setProposalData({ ...proposalData, abstract: e.target.value })}
                  placeholder="Summarize the core engineering problem, hardware requirements, and take-away synthesis materials..."
                  className="w-full font-body-sm p-2.5 rounded bg-surface-warm border border-border-subtle focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              <div className="pt-space-sm border-t border-border-subtle flex items-center justify-end gap-space-sm">
                <button
                  type="button"
                  onClick={() => setProposalModalOpen(false)}
                  className="px-4 py-2 font-label-caps text-label-caps uppercase text-on-surface-variant hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-on-primary rounded font-label-caps text-label-caps uppercase tracking-wider font-bold hover:bg-secondary transition-colors"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Charter Modal */}
      {charterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card border border-border-firm rounded max-w-xl w-full p-space-lg shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-space-sm border-b border-border-subtle mb-space-md">
              <span className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
                FOLE Open Learning Charter Guidelines
              </span>
              <button
                onClick={() => setCharterModalOpen(false)}
                className="text-on-surface-variant hover:text-primary text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-body-sm text-body-sm text-on-surface-variant leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <p>
                <strong className="text-primary font-bold">1. Zero Paywall Policy:</strong> All assemblies hosted under the FOLE banner must remain free of admission charges for all enrolled students.
              </p>
              <p>
                <strong className="text-primary font-bold">2. Open Educational Licensure:</strong> All generated code, CAD files, schematics, and lecture notes must be released under CC-BY-SA 4.0 or permissive open-source licenses (MIT/Apache 2.0).
              </p>
              <p>
                <strong className="text-primary font-bold">3. Peer Accountability:</strong> Workshop conveners are entrusted with physical laboratory instruments (Rigol scopes, soldering stations, 3D printers) and are responsible for workshop safety and tidy reclamation.
              </p>
              <p>
                <strong className="text-primary font-bold">4. Merit-Based Curation:</strong> Proposals are reviewed by the Assembly Stewards purely on academic rigor, relevance to engineering curriculum, and practical hands-on value.
              </p>
            </div>

            <div className="pt-space-md border-t border-border-subtle flex justify-end">
              <button
                onClick={() => setCharterModalOpen(false)}
                className="px-6 py-2 bg-primary text-on-primary rounded font-label-caps text-label-caps uppercase"
              >
                Close Charter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
