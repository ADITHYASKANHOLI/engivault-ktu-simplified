import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { spaceService } from "@/lib/space/service";
import { AdminEventsModeration } from "@/components/admin/space/AdminEventsModeration";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Event Moderation — ENGIVAULT Admin",
  description: "Review and moderate workshops, sessions, and physical space reservations.",
};

export default async function AdminSpaceEventsPage() {
  const events = await spaceService.getAllEventsForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/dashboard/space"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Space Overview</span>
        </Link>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Event Moderation & Oversight
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review community sessions, unpublish drafts, and cancel conflicting reservations with full audit tracking.
        </p>
      </div>

      <AdminEventsModeration initialEvents={events} />
    </div>
  );
}
