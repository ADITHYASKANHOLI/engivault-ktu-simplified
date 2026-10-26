import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  DoorOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { spaceService } from "@/lib/space/service";
import { FoleSpaceLogo } from "@/components/branding/FoleSpaceLogo";
import { SpaceStatusChip } from "@/components/space/SpaceStatusChip";
import { formatDateTimeIST } from "@/lib/space/time";

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 overflow-hidden border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-[#07111F] dark:to-slate-950">
        <div className="absolute inset-0 bg-tech-grid-dark opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Logo Display */}
            <div className="mb-6 transform hover:scale-102 transition-transform duration-300">
              <FoleSpaceLogo size="xl" priority />
            </div>

            {/* Live Operational Status Chip */}
            <div className="mb-6">
              <SpaceStatusChip
                state={availabilityState}
                occupancy={status?.occupancy}
                capacity={status?.capacity}
                size="md"
              />
            </div>

            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Learn Together. Build Together. Grow Together.</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              A Physical Space for <span className="text-emerald-600 dark:text-emerald-400">Curious Minds</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
              Inspired by collaborative hubs like Thinkerspace Calicut, <strong>FOLE SPACE</strong> is the physical sanctuary for students at <strong>College of Engineering Vadakara (CEV)</strong>. Drop in for distraction-free study, work on team builds, and participate in verified student-led workshops.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/fole-space/open"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-md min-h-[48px]"
              >
                <DoorOpen className="w-4 h-4" />
                <span>Open Space Check-in</span>
              </Link>

              <Link
                href="/fole-space/calendar"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all shadow-xs min-h-[48px]"
              >
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>Events Calendar</span>
              </Link>

              <Link
                href="/fole-space/my"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all min-h-[48px]"
              >
                <QrCode className="w-4 h-4" />
                <span>My Tickets</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Two Modes Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Two Ways to Experience the Space
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Whether you need a quiet desk for focused study or want to lead an engineering workshop, FOLE SPACE provides the infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mode 1: Open Space */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-6">
                <DoorOpen className="w-6 h-6" />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Walk-In Mode
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-500">30 Min Sessions</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Open Space Check-in
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Drop in anytime during open hours. Members check in with one tap, receive an active 30-minute study countdown, and can extend their session or check out early when finished. Occupancy is tracked live so you always know if seats are free.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 mb-8">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Real-time occupancy vs capacity tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Synchronized server clock countdown display</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Automatic collision protection with scheduled workshops</span>
                </li>
              </ul>
            </div>

            <Link
              href="/fole-space/open"
              className="inline-flex items-center justify-between px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400 text-sm font-bold text-slate-900 dark:text-white transition-all group"
            >
              <span>View Live Space & Check In</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mode 2: Events & Sessions */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6" />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Organized Sessions
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-500">Free Digital Passes</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Events & Workshops
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Verified student organizers host technical workshops, study jams, and project sprints in the space. Members RSVP for free tickets with secure QR codes for check-in at the door.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 mb-8">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span>Interactive monthly calendar & agenda view</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span>Unguessable digital QR tickets with mobile download</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span>Support for camera QR scanning and virtual check-in</span>
                </li>
              </ul>
            </div>

            <Link
              href="/fole-space/events"
              className="inline-flex items-center justify-between px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 hover:text-cyan-700 dark:hover:text-cyan-400 text-sm font-bold text-slate-900 dark:text-white transition-all group"
            >
              <span>Explore Upcoming Events</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Events Strip */}
      {upcomingEvents.length > 0 && (
        <section className="py-12 border-t border-slate-200 dark:border-slate-800 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Upcoming at FOLE SPACE
              </h2>
              <p className="text-xs text-slate-500 mt-1">Reserve your seat ahead of time</p>
            </div>

            <Link
              href="/fole-space/calendar"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
            >
              <span>Full Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingEvents.map((evt) => (
              <Link
                key={evt.id}
                href={`/fole-space/events/${evt.slug}`}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-[10px]">
                      {evt.category}
                    </span>
                    <span>{formatDateTimeIST(evt.starts_at)}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2">
                    {evt.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Capacity: {evt.capacity} seats</span>
                  <span className="font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Details & RSVP →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Verified Organizer Callout */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300 uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Organizer Network</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">
              Want to host a session at FOLE SPACE?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Verified student organizers get full access to the space event desk, camera QR scanners, flyer uploads, and session management tools. Contact the space administrator to be verified.
            </p>
          </div>

          <Link
            href="/fole-space/organizer"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm transition-all shadow-md shrink-0"
          >
            Access Organizer Hub
          </Link>
        </div>
      </section>
    </div>
  );
}
