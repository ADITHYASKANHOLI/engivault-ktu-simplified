import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAuthenticatedStudent, isVerifiedOrganizer } from "@/lib/space/permissions";
import { spaceService } from "@/lib/space/service";
import { formatDateTimeIST } from "@/lib/space/time";
import {
  Calendar,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  QrCode,
  Edit,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Organizer Hub — FOLE SPACE",
  description: "Create and manage collaborative events, check-in desks, and attendee lists.",
};

export default async function OrganizerHubPage() {
  const student = await getAuthenticatedStudent();

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] pt-28 pb-16 flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Organizer Portal
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Please log in with your student account to access your organizer privileges and events.
          </p>
          <Link
            href="/fole-space/open"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
          >
            <span>Log in to Continue</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOrganizer = await isVerifiedOrganizer(student.id);

  if (!isOrganizer) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] pt-28 pb-16 flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Organizer Access Required
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            Hello <strong>{student.display_name}</strong> (@{student.username}). Your student account is not yet on the verified organizer roster. Only verified organizers added by the space administrator can create events and manage check-in desks.
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-500 mb-6 text-left">
            <span className="font-semibold block mb-0.5">How to get verified:</span>
            Reach out to the FOLE CEV community leads or administrator with your event proposal to have your username verified.
          </div>
          <Link
            href="/fole-space"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition-all"
          >
            <span>Return to FOLE SPACE</span>
          </Link>
        </div>
      </div>
    );
  }

  const events = await spaceService.getOrganizerEvents(student.id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111F] pt-24 pb-16 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Organizer Hub</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Event Management & Check-In Desk
            </h1>
            <p className="text-xs text-slate-500">
              Logged in as {student.display_name} (@{student.username})
            </p>
          </div>

          <Link
            href="/fole-space/organizer/events/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all shrink-0 min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Event</span>
          </Link>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            My Events ({events.length})
          </h2>

          {events.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-1" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No events created yet
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Host a technical workshop, study session, or project hackathon at FOLE SPACE.
              </p>
              <Link
                href="/fole-space/organizer/events/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Your First Event</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((evt) => {
                const statusColors = {
                  draft: "bg-slate-100 text-slate-700 border-slate-200",
                  published: "bg-blue-50 text-blue-700 border-blue-200",
                  live: "bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse font-black",
                  completed: "bg-slate-100 text-slate-600 border-slate-200",
                  cancelled: "bg-red-50 text-red-700 border-red-200",
                };

                return (
                  <div
                    key={evt.id}
                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase ${
                            statusColors[evt.status as keyof typeof statusColors] || statusColors.draft
                          }`}
                        >
                          {evt.status}
                        </span>

                        <span className="text-slate-500 font-mono">
                          {formatDateTimeIST(evt.starts_at)}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1">
                        {evt.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                        {evt.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
                        <span>Capacity: {evt.capacity}</span>
                        <span>•</span>
                        <span>{evt.category}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/fole-space/organizer/events/${evt.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>

                        <Link
                          href={`/fole-space/events/${evt.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                          title="Public page preview"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* Check-In Desk Button */}
                      <Link
                        href={`/fole-space/organizer/events/${evt.id}/desk`}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                          evt.status === "live"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Check-In Desk</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
