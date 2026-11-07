import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  DoorOpen,
  Calendar,
  ArrowRight,
  QrCode,
  ShieldCheck,
  Cpu,
  Users,
  Sparkles,
  Clock,
  Wrench,
  Layers,
} from "lucide-react";
import { spaceService } from "@/lib/space/service";
import { FoleSpaceLogo } from "@/components/branding/FoleSpaceLogo";
import { SpaceStatusChip } from "@/components/space/SpaceStatusChip";
import { FoleSpaceTagline } from "@/components/fole/FoleSpaceTagline";
import { MagneticButton } from "@/components/ui/animate";
import { formatDateTimeIST } from "@/lib/space/time";
import { FoleSpaceTopographyBackground } from "@/components/space/FoleSpaceTopographyBackground";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "FOLE SPACE — Physical Collaborative Learning Space | FOLE CEV",
  description:
    "A student-led physical learning and maker space at College of Engineering Vadakara. Drop in to study, collaborate, and attend hands-on technical sessions.",
  openGraph: {
    title: "FOLE SPACE — Physical Learning Space | FOLE CEV",
    description:
      "A physical collaborative learning hub at College of Engineering Vadakara. Learn Together. Build Together. Grow Together.",
    images: [{ url: "/branding/fole-space-logo.png", width: 1024, height: 455, alt: "FOLE SPACE" }],
  },
};

export default async function FoleSpacePage() {
  const [status, upcomingEvents] = await Promise.all([
    spaceService.getPublicSpaceStatus().catch(() => null),
    spaceService.getPublicEvents({ limit: 3 }).catch(() => []),
  ]);

  const availabilityState = status?.state || status?.availabilityState || "unavailable";

  return (
    <div className="fole-space-page min-h-screen text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* 
        Persistent Viewport-Height Sticky Topography Background
        - Stays fixed behind content as visitor scrolls from hero to final CTA
        - Naturally stops at the end of the .fole-space-page container
        - Strictly separates from the global SiteFooter
      */}
      <FoleSpaceTopographyBackground />

      {/* Main Page Content Layer */}
      <main className="fole-space-content">
        {/* Section 1: Hero — Discover FOLE SPACE */}
        <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden border-b border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              {/* Brand Logo with Topography Blue Aura */}
              <div className="mb-6 transform hover:scale-[1.02] transition-transform duration-300 drop-shadow-[0_0_35px_rgba(79,124,255,0.4)]">
                <FoleSpaceLogo size="xl" priority />
              </div>

              {/* Live Operational Status Chip */}
              <div className="mb-5">
                <SpaceStatusChip
                  state={availabilityState}
                  occupancy={status?.occupancy}
                  capacity={status?.capacity}
                  size="md"
                />
              </div>

              {/* Tagline */}
              <div className="mb-3">
                <FoleSpaceTagline />
              </div>

              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[#4f7cff] text-xs font-mono font-bold tracking-wider uppercase mb-5 shadow-[0_0_20px_rgba(79,124,255,0.2)]">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Physical Collaborative Hub • College of Engineering Vadakara</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-4">
                A Physical Sanctuary for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4f7cff] via-cyan-400 to-emerald-400">
                  Curious Minds
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 font-normal">
                Inspired by collaborative hubs like Thinkerspace Calicut, <strong>FOLE SPACE</strong> is the physical sanctuary for students at <strong>College of Engineering Vadakara (CEV)</strong>. Drop in for distraction-free study, work on team builds, and participate in verified student-led workshops.
              </p>

              {/* Primary Action CTAs */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12">
                <MagneticButton strength={0.25} range={70}>
                  <Link
                    href="/fole-space/open"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-[#00A86B] hover:from-emerald-500 hover:to-[#00c57d] active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(0,168,107,0.35)] min-h-[48px]"
                  >
                    <DoorOpen className="w-4 h-4" />
                    <span>Open Space Check-in</span>
                  </Link>
                </MagneticButton>

                <Link
                  href="/fole-space/calendar"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-100 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 backdrop-blur-md active:scale-[0.98] transition-all min-h-[48px]"
                >
                  <Calendar className="w-4 h-4 text-[#4f7cff]" />
                  <span>Events Calendar</span>
                </Link>

                <Link
                  href="/fole-space/my"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 backdrop-blur-md transition-all min-h-[48px]"
                >
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  <span>My Tickets</span>
                </Link>
              </div>

              {/* Live Operational Metrics Panel (Translucent Glass) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl mx-auto text-left">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 backdrop-blur-md flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                    <DoorOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-400 uppercase">Live Capacity</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {status?.capacity ? `${status.occupancy ?? 0} / ${status.capacity} Seats` : "Open Seating"}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 backdrop-blur-md flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-[#4f7cff]/15 text-[#4f7cff] shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-400 uppercase">Study Cycles</div>
                    <div className="text-sm font-bold text-white mt-0.5">30-Min Sprints</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 backdrop-blur-md flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/15 text-cyan-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-400 uppercase">Scheduled</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {upcomingEvents.length > 0 ? `${upcomingEvents.length} Active Sessions` : "Open Desk Hours"}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 backdrop-blur-md flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-500/15 text-purple-400 shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-400 uppercase">Access Model</div>
                    <div className="text-sm font-bold text-white mt-0.5">100% Free for CEV</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Two Modes Grid */}
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <span>Dual Operational Modes</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Two Ways to Experience the Space
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
              Whether you need a quiet desk for focused study or want to lead an engineering workshop, FOLE SPACE provides the infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mode 1: Open Space Walk-in */}
            <div className="p-8 sm:p-10 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/40 backdrop-blur-md shadow-xl flex flex-col justify-between transition-all duration-300 group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-6 transition-transform group-hover:scale-105">
                  <DoorOpen className="w-6 h-6" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    Walk-In Mode
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400">30 Min Sessions</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  Open Space Check-in
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Drop in anytime during open hours. Members check in with one tap, receive an active 30-minute study countdown, and can extend their session or check out early when finished. Occupancy is tracked live so you always know if seats are free.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Real-time occupancy vs capacity tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Synchronized server clock countdown display</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Automatic collision protection with scheduled workshops</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/fole-space/open"
                className="inline-flex items-center justify-between px-5 py-3.5 rounded-xl bg-white/5 hover:bg-emerald-600 text-slate-100 hover:text-white border border-white/10 hover:border-emerald-500 text-sm font-bold transition-all group/btn min-h-[48px]"
              >
                <span>View Live Space &amp; Check In</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Mode 2: Organized Events & Sessions */}
            <div className="p-8 sm:p-10 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-[#4f7cff]/40 backdrop-blur-md shadow-xl flex flex-col justify-between transition-all duration-300 group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#4f7cff]/15 border border-[#4f7cff]/30 text-[#4f7cff] flex items-center justify-center mb-6 transition-transform group-hover:scale-105">
                  <Calendar className="w-6 h-6" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4f7cff]">
                    Organized Sessions
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400">Free Digital Passes</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  Events &amp; Workshops
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Verified student organizers host technical workshops, study jams, and project sprints in the space. Members RSVP for free tickets with secure QR codes for check-in at the door.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4f7cff] shrink-0" />
                    <span>Interactive monthly calendar &amp; agenda view</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4f7cff] shrink-0" />
                    <span>Unguessable digital QR tickets with mobile download</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4f7cff] shrink-0" />
                    <span>Support for camera QR scanning and virtual check-in</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/fole-space/events"
                className="inline-flex items-center justify-between px-5 py-3.5 rounded-xl bg-white/5 hover:bg-[#4f7cff] text-slate-100 hover:text-white border border-white/10 hover:border-[#4f7cff] text-sm font-bold transition-all group/btn min-h-[48px]"
              >
                <span>Explore Upcoming Events</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 3: Space Capabilities & Amenities (Translucent Feature Grid) */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="max-w-3xl mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <span>Space Capabilities</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Designed for Builders, Tinkerers &amp; Thinkers
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
              Every corner of FOLE SPACE is built to eliminate distractions and provide engineering students with the tools to innovate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/40 backdrop-blur-md transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Hardware Workbench</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated stations for microcontrollers, soldering, prototyping, and embedded systems experimentation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-[#4f7cff]/40 backdrop-blur-md transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-[#4f7cff]/10 border border-[#4f7cff]/20 text-[#4f7cff] flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Team Squad Bays</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Collaborative seating arrangements for multi-branch hackathon teams and robotics build sessions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-cyan-500/40 backdrop-blur-md transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Quiet Study Nooks</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Distraction-free desks with power banks and ergonomic seating for intensive exam and coding sprints.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/40 backdrop-blur-md transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Presentation Stage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Projection tools and acoustic setup for student-led knowledge shares, paper discussions, and project demos.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Upcoming Events Strip */}
        {upcomingEvents.length > 0 && (
          <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#4f7cff] mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>Curated Sessions</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Upcoming at FOLE SPACE
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Reserve your digital ticket ahead of time</p>
              </div>

              <Link
                href="/fole-space/calendar"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5 focus:outline-none"
              >
                <span>Full Calendar View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map((evt) => (
                <Link
                  key={evt.id}
                  href={`/fole-space/events/${evt.slug}`}
                  className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/40 backdrop-blur-md transition-all duration-300 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                      <span className="font-mono font-bold text-emerald-400 uppercase tracking-wider text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                        {evt.category}
                      </span>
                      <span>{formatDateTimeIST(evt.starts_at)}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2">
                      {evt.title}
                    </h3>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Capacity: {evt.capacity} seats</span>
                    <span className="font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Details &amp; RSVP →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section 5: Verified Organizer Network Callout */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/50 border border-slate-800/90 backdrop-blur-md text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Organizer Network</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black">
                Want to host a session at FOLE SPACE?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Verified student organizers get full access to the space event desk, camera QR scanners, flyer uploads, and session management tools. Contact the space administrator to be verified.
              </p>
            </div>

            <Link
              href="/fole-space/organizer"
              className="px-7 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm transition-all shadow-md shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              Access Organizer Hub
            </Link>
          </div>
        </section>

        {/* Section 6: Final Concluding CTA (Topography Visible Behind, Stops Before Footer) */}
        <section className="relative py-20 sm:py-28 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-mono font-bold tracking-wider uppercase text-cyan-400 mb-6 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-[#4f7cff]" />
            <span>Open Community Sanctuary</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Drop In. Build Together. Grow Together.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal">
            Whether you&apos;re debugging an embedded circuit, preparing for upcoming exams, or collaborating on an open-source project — FOLE SPACE is open to all students at College of Engineering Vadakara.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
            <Link
              href="/fole-space/open"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-[#00A86B] hover:from-emerald-500 hover:to-[#00c57d] transition-all shadow-[0_0_25px_rgba(0,168,107,0.35)] min-h-[48px]"
            >
              <DoorOpen className="w-4 h-4" />
              <span>Check In to Open Space</span>
            </Link>

            <Link
              href="/fole-space/calendar"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-100 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 backdrop-blur-md transition-all min-h-[48px]"
            >
              <Calendar className="w-4 h-4 text-[#4f7cff]" />
              <span>Browse Calendar</span>
            </Link>
          </div>

          <div className="pt-6 border-t border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-4">
            <span>College of Engineering Vadakara</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono font-semibold">FOLE SPACE Live Infrastructure</span>
          </div>
        </section>
      </main>
    </div>
  );
}
