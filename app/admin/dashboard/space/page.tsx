import React from "react";
import type { Metadata } from "next";
import { spaceService } from "@/lib/space/service";
import { AdminSpaceOverview } from "@/components/admin/space/AdminSpaceOverview";
import { DoorOpen, Sliders, UserCheck, CalendarCheck, BarChart3 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "FOLE SPACE Management — ENGIVAULT Admin",
  description: "Space occupancy, master switch, and live active session controls.",
};

export default async function AdminSpacePage() {
  const [status, sessions, todayEvents] = await Promise.all([
    spaceService.getPublicSpaceStatus(),
    spaceService.getAllSessions(),
    spaceService.getPublicEvents({ limit: 10 }),
  ]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <DoorOpen className="w-3.5 h-3.5" />
            <span>Digital Vault • Space Operations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            FOLE SPACE Overview
          </h1>
          <p className="text-xs text-slate-500">
            Monitor real-time occupancy, enforce check-outs, and manage physical space policies.
          </p>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/dashboard/space/settings"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings</span>
          </Link>

          <Link
            href="/admin/dashboard/space/organizers"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Organizers</span>
          </Link>

          <Link
            href="/admin/dashboard/space/events"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Events</span>
          </Link>

          <Link
            href="/admin/dashboard/space/reports"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Reports</span>
          </Link>
        </div>
      </div>

      <AdminSpaceOverview
        initialStatus={status}
        initialSessions={sessions}
        todayEvents={todayEvents}
      />
    </div>
  );
}
