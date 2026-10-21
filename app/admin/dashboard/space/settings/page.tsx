import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { spaceService } from "@/lib/space/service";
import { AdminSpaceSettingsForm } from "@/components/admin/space/AdminSpaceSettingsForm";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "FOLE SPACE Settings — ENGIVAULT Admin",
  description: "Configure capacity, opening hours, and check-in policies.",
};

export default async function AdminSpaceSettingsPage() {
  const settings = await spaceService.getSettings();

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
          Space Configuration & Policies
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Adjust physical seat limits, standard session duration, extension rules, and check-in grace windows.
        </p>
      </div>

      <AdminSpaceSettingsForm initialSettings={settings} />
    </div>
  );
}
