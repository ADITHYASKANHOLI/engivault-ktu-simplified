import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { spaceService } from "@/lib/space/service";
import { AdminReportsView } from "@/components/admin/space/AdminReportsView";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "FOLE SPACE Reports — ENGIVAULT Admin",
  description: "Space attendance analytics, peak usage, and event turnout reports.",
};

export default async function AdminSpaceReportsPage() {
  const report = await spaceService.getReports();

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
          Space Usage & Turnout Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore daily student sessions, peak facility hours, and workshop turnout with CSV data export.
        </p>
      </div>

      <AdminReportsView initialReport={report} />
    </div>
  );
}
